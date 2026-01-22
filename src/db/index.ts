import Dexie from 'dexie'
import type { Table } from 'dexie'
import type {
  Category,
  SavingEntry,
  SavingGoal,
  Setting,
  Transaction,
  User,
} from '../types/models'

export class FinanceDB extends Dexie {
  users!: Table<User, number>;
  transactions!: Table<Transaction, number>;
  categories!: Table<Category, number>;
  savingGoals!: Table<SavingGoal, number>;
  savingEntries!: Table<SavingEntry, number>;
  settings!: Table<Setting, number>;

  constructor() {
    super('sou-financas');
    this.version(1).stores({
      users: '++id,&email,createdAt',
      transactions:
        '++id,userId,date,categoryId,type,createdAt,updatedAt,[userId+date],[userId+type]',
      categories: '++id,userId,kind,createdAt,[userId+kind],[userId+name]',
      savingGoals: '++id,userId,startDate,createdAt',
      savingEntries: '++id,goalId,userId,monthKey,createdAt,updatedAt,[goalId+monthKey]',
      settings: '++id,userId,updatedAt',
    });
  }
}

export const db = new FinanceDB();
