import { db } from '../db'
import type { Category, CategoryKind } from '../types/models'

const CORE_CATEGORIES: Array<{ name: string; kind: CategoryKind }> = [
  { name: 'Alimentação', kind: 'expense' },
  { name: 'Transporte', kind: 'expense' },
  { name: 'Moradia', kind: 'expense' },
  { name: 'Saúde', kind: 'expense' },
  { name: 'Lazer', kind: 'expense' },
  { name: 'Educação', kind: 'expense' },
  { name: 'Outros', kind: 'expense' },
  { name: 'Poupança', kind: 'expense' },
  { name: 'Salário', kind: 'income' },
  { name: 'Investimentos', kind: 'income' },
  { name: 'Freelas', kind: 'income' },
]

export const categoryService = {
  async ensureDefaults(userId: number) {
    const existing = await db.categories.where('userId').equals(userId).count()
    if (existing === 0) {
      const now = new Date().toISOString()
      await db.categories.bulkAdd(
        CORE_CATEGORIES.map((item) => ({
          userId,
          name: item.name,
          kind: item.kind,
          createdAt: now,
        })),
      )
    }
  },
  list(userId: number) {
    return db.categories.where('userId').equals(userId).sortBy('name')
  },
  async create(userId: number, data: Pick<Category, 'name' | 'kind'>) {
    const now = new Date().toISOString()
    return db.categories.add({
      ...data,
      userId,
      createdAt: now,
    })
  },
}
