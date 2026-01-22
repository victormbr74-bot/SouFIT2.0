export type ThemeMode = 'light' | 'dark';

export type CategoryKind = 'expense' | 'income' | 'both';

export type PaymentMethod = 'dinheiro' | 'cartão' | 'pix' | 'boleto';

export interface User {
  id?: number;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Transaction {
  id?: number;
  userId: number;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  categoryId: number;
  description?: string;
  paymentMethod?: PaymentMethod;
  recurring?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id?: number;
  userId: number;
  name: string;
  kind: CategoryKind;
  createdAt: string;
  color?: string;
}

export type SavingMode = 'targetValue' | 'durationMonths';

export type InterestMode = 'none' | 'percent' | 'fixed';

export interface SavingGoal {
  id?: number;
  userId: number;
  name: string;
  startDate: string;
  initialAmount: number;
  monthlyIncrease: number;
  mode: SavingMode;
  targetValue?: number;
  durationMonths?: number;
  interestMode: InterestMode;
  interestValue?: number;
  createdAt: string;
}

export interface SavingEntry {
  id?: number;
  goalId: number;
  userId: number;
  monthKey: string; // YYYY-MM
  plannedAmount: number;
  depositedAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  id?: number;
  userId: number;
  themeMode: ThemeMode;
  primaryColor: string;
  currency: string;
  essentialsCategories: number[];
  updatedAt: string;
}

export interface DashboardFilters {
  month: number;
  year: number;
}

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  categoryIds?: number[];
  type?: 'income' | 'expense';
  search?: string;
}
