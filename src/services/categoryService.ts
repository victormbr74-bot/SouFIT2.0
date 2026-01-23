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

const normalizeName = (value: string) => value.trim().toLowerCase()

export const categoryService = {
  async ensureDefaults(userId: number) {
    const now = new Date().toISOString()
    for (const item of CORE_CATEGORIES) {
      const exists = await db.categories
        .where('[userId+name]')
        .equals([userId, item.name])
        .first()
      if (!exists) {
        await db.categories.add({
          userId,
          name: item.name,
          kind: item.kind,
          createdAt: now,
        })
      }
    }
    await categoryService.cleanupDuplicates(userId)
  },
  async cleanupDuplicates(userId: number) {
    const rows = await db.categories.where('userId').equals(userId).sortBy('name')
    const seen = new Set<string>()
    for (const category of rows) {
      const key = normalizeName(category.name)
      if (seen.has(key)) {
        if (category.id) {
          await db.categories.delete(category.id)
        }
      } else {
        seen.add(key)
      }
    }
  },
  async list(userId: number) {
    const rows = await db.categories.where('userId').equals(userId).sortBy('name')
    const seen = new Set<string>()
    return rows.filter((category) => {
      const key = normalizeName(category.name)
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  },
  async create(userId: number, data: Pick<Category, 'name' | 'kind'>) {
    const now = new Date().toISOString()
    const name = data.name.trim()
    const existing = await db.categories
      .where('[userId+name]')
      .equals([userId, name])
      .first()
    if (existing) {
      return existing.id
    }
    return db.categories.add({
      ...data,
      name,
      userId,
      createdAt: now,
    })
  },
}
