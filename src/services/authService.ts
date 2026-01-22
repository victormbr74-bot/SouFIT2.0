import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { db } from '../db'
import type { User } from '../types/models'

const SESSION_USER_KEY = 'soufinancas-current-user';
const SESSION_TOKEN_KEY = 'soufinancas-session-token';
const SALT_ROUNDS = 10;

export interface Credentials {
  email: string;
  password: string;
}

export interface RegistrationData extends Credentials {
  name: string;
}

export interface SessionPayload {
  user: User;
  token: string;
}

const storage = {
  set(userId: number, token: string) {
    localStorage.setItem(SESSION_USER_KEY, String(userId));
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
  },
  getUserId(): number | null {
    const raw = localStorage.getItem(SESSION_USER_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  },
};

export const authService = {
  async register(data: RegistrationData): Promise<SessionPayload> {
    const existing = await db.users.get({ email: data.email.toLowerCase() });
    if (existing) {
      throw new Error('Email já cadastrado');
    }
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const id = await db.users.add({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
    });
    const user = await db.users.get(id);
    if (!user) {
      throw new Error('Erro ao criar o usuário');
    }
    const token = nanoid();
    storage.set(id, token);
    return { user: user!, token };
  },
  async login(data: Credentials): Promise<SessionPayload> {
    const user = await db.users.get({ email: data.email.toLowerCase() });
    if (!user) {
      throw new Error('Credenciais inválidas');
    }
    const match = await bcrypt.compare(data.password, user.passwordHash);
    if (!match) {
      throw new Error('Credenciais inválidas');
    }
    const token = nanoid();
    storage.set(user.id!, token);
    return { user, token };
  },
  logout() {
    storage.clear();
  },
  getCurrentUserId(): number | null {
    return storage.getUserId();
  },
  async getCurrentUser(): Promise<User | null> {
    const id = storage.getUserId();
    if (!id) {
      return null;
    }
    const user = await db.users.get(id)
    return user ?? null
  },
};
