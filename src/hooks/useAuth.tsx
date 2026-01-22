import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { db } from '../db'
import type { Setting, ThemeMode, User } from '../types/models'
import { authService } from '../services/authService'
import type { Credentials, RegistrationData } from '../services/authService'

interface AuthContext {
  loading: boolean
  ready: boolean
  user: User | null
  settings: Setting | null
  sessionToken: string | null
  login(credentials: Credentials): Promise<void>
  register(data: RegistrationData): Promise<void>
  logout(): void
  updateSettings(partial: Partial<Setting>): Promise<void>
  setThemeMode(mode: ThemeMode): Promise<void>
  setPrimaryColor(color: string): Promise<void>
  updateProfile(changes: Partial<Omit<User, 'id'>>): Promise<void>
}

const AuthContext = createContext<AuthContext | undefined>(undefined)

const DEFAULT_SETTINGS: Omit<Setting, 'id'> = {
  userId: -1,
  themeMode: 'light',
  primaryColor: '#5B21B6',
  currency: 'BRL',
  essentialsCategories: [],
  updatedAt: new Date().toISOString(),
}

async function ensureSettings(userId: number): Promise<Setting> {
  let stored = await db.settings.where('userId').equals(userId).first()
  if (!stored) {
    stored = {
      ...DEFAULT_SETTINGS,
      userId,
      updatedAt: new Date().toISOString(),
    }
    const id = await db.settings.add(stored)
    stored.id = id
  }
  return stored
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [settings, setSettings] = useState<Setting | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      const currentUser = await authService.getCurrentUser()
      if (!isMounted) return
      setUser(currentUser)
      if (currentUser && currentUser.id) {
        const stored = await ensureSettings(currentUser.id)
        if (!isMounted) return
        setSettings(stored)
      }
      setLoading(false)
    })()
    return () => {
      isMounted = false
    }
  }, [])

  const ready = useMemo(() => !loading, [loading])

  const refreshSettings = async (userId: number) => {
    const stored = await ensureSettings(userId)
    setSettings(stored)
  }

  const updateSettings = async (partial: Partial<Setting>) => {
    if (!user) return
    const merged = {
      ...settings,
      ...partial,
      updatedAt: new Date().toISOString(),
    } as Setting
    if (merged.id) {
      await db.settings.put(merged)
    } else {
      merged.id = await db.settings.add(merged)
    }
    setSettings(merged)
  }

  const login = async (credentials: Credentials) => {
    const payload = await authService.login(credentials)
    setUser(payload.user)
    setSessionToken(payload.token)
    await refreshSettings(payload.user.id!)
  }

  const register = async (data: RegistrationData) => {
    const payload = await authService.register(data)
    setUser(payload.user)
    setSessionToken(payload.token)
    await refreshSettings(payload.user.id!)
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setSettings(null)
    setSessionToken(null)
  }

  const setThemeMode = async (mode: ThemeMode) => {
    await updateSettings({ themeMode: mode })
  }

  const setPrimaryColor = async (primaryColor: string) => {
    await updateSettings({ primaryColor })
  }

  const updateProfile = async (changes: Partial<Omit<User, 'id'>>) => {
    if (!user?.id) return
    await db.users.update(user.id, changes)
    const refreshed = await db.users.get(user.id)
    if (refreshed) {
      setUser(refreshed)
    }
  }

  const value = {
    user,
    settings,
    loading,
    ready,
    sessionToken,
    login,
    register,
    logout,
    updateSettings,
    setThemeMode,
    setPrimaryColor,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de AuthProvider')
  }
  return context
}
