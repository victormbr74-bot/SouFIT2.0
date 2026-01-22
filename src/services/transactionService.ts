import { db } from '../db'
import type { Transaction } from '../types/models'

export interface TransactionFilterOptions {
  startDate?: string
  endDate?: string
  categoryIds?: number[]
  type?: 'income' | 'expense'
  search?: string
}

export interface TransactionListOptions {
  filter?: TransactionFilterOptions
  limit?: number
  offset?: number
}

const matchesFilter = (filter: TransactionFilterOptions | undefined, tx: Transaction) => {
  if (!filter) return true
  if (filter.type && tx.type !== filter.type) return false
  if (filter.categoryIds && filter.categoryIds.length && !filter.categoryIds.includes(tx.categoryId))
    return false
  if (filter.startDate && tx.date < filter.startDate) return false
  if (filter.endDate && tx.date > filter.endDate) return false
  if (filter.search) {
    const query = filter.search.toLowerCase()
    if (!tx.description?.toLowerCase().includes(query)) return false
  }
  return true
}

export const transactionService = {
  async list(userId: number, options?: TransactionListOptions) {
    const collection = db.transactions.where('userId').equals(userId)
    const list = await collection.toArray()
    const filtered = list
      .filter((tx) => matchesFilter(options?.filter, tx))
      .sort((a, b) => b.date.localeCompare(a.date))
    const { offset = 0, limit } = options ?? {}
    return filtered.slice(offset, limit ? offset + limit : undefined)
  },
  async add(userId: number, payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) {
    const now = new Date().toISOString()
    return db.transactions.add({
      ...payload,
      userId,
      createdAt: now,
      updatedAt: now,
    })
  },
  async update(id: number, payload: Partial<Transaction>) {
    await db.transactions.update(id, {
      ...payload,
      updatedAt: new Date().toISOString(),
    })
  },
  async remove(id: number) {
    await db.transactions.delete(id)
  },
  async exportCsv(transactions: Transaction[]) {
    const header = ['Tipo', 'Valor', 'Data', 'Categoria', 'Descrição', 'Forma', 'Recorrente']
    const rows = transactions.map((tx) => [
      tx.type,
      tx.amount,
      tx.date,
      tx.categoryId,
      tx.description ?? '',
      tx.paymentMethod ?? '',
      tx.recurring ? 'Sim' : 'Não',
    ])
    return [header, ...rows].map((row) => row.join(',')).join('\n')
  },
  async importCsv(userId: number, csv: string) {
    const lines = csv.split('\n').map((line) => line.trim()).filter(Boolean)
    if (!lines.length) {
      return []
    }
    const header = lines[0].split(',').map((value) => value.trim().toLowerCase())
    const rows = lines.slice(1)
    const created: Transaction[] = []
    for (const row of rows) {
      const cells = row.split(',').map((value) => value.trim())
      const rowData: Record<string, string> = {}
      header.forEach((key, index) => {
        rowData[key] = cells[index] ?? ''
      })
      const type = rowData['tipo'] as 'income' | 'expense'
      const amount = Number(rowData['valor']) || 0
      const date = rowData['data'] || new Date().toISOString().split('T')[0]
      const description = rowData['descrição'] || rowData['descricao'] || ''
      const paymentMethod = rowData['forma'] as any
      let categoryId = Number(rowData['categoria']) || undefined
      if (!categoryId && rowData['categoria']) {
        const existing = await db.categories
          .where('[userId+name]')
          .equals([userId, rowData['categoria']])
          .first()
        if (existing) {
          categoryId = existing.id!
        } else {
          const newCatId = await db.categories.add({
            userId,
            name: rowData['categoria'],
            kind: type === 'income' ? 'income' : 'expense',
            createdAt: new Date().toISOString(),
          })
          categoryId = newCatId
        }
      }
      const tx = {
        userId,
        type,
        amount,
        date,
        categoryId: categoryId ?? 0,
        description,
        paymentMethod: paymentMethod as any,
        recurring: rowData['recorrente']?.toLowerCase() === 'sim',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const id = await db.transactions.add(tx)
      created.push({ ...tx, id })
    }
    return created
  },
}
