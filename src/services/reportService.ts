import type { Transaction } from '../types/models'

const byCategory = (transactions: Transaction[]) => {
  const map = new Map<number, number>()
  transactions.forEach((tx) => {
    if (tx.type === 'expense') {
      map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + tx.amount)
    }
  })
  return Array.from(map.entries())
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total)
}

const monthlyComparisons = (transactions: Transaction[]) => {
  const monthly: Record<string, { income: number; expense: number }> = {}
  transactions.forEach((tx) => {
    const key = tx.date.slice(0, 7)
    const existing = monthly[key] || { income: 0, expense: 0 }
    if (tx.type === 'income') {
      existing.income += tx.amount
    } else {
      existing.expense += tx.amount
    }
    monthly[key] = existing
  })
  return Object.entries(monthly).map(([month, data]) => ({
    month,
    ...data,
  }))
}

export const reportService = {
  byCategory,
  topExpenses(transactions: Transaction[]) {
    return transactions
      .filter((tx) => tx.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
  },
  monthlyComparisons: monthlyComparisons,
  savingsRate(transactions: Transaction[], savings: number) {
    const income = transactions.reduce((sum, tx) => (tx.type === 'income' ? sum + tx.amount : sum), 0)
    return income === 0 ? 0 : (savings / income) * 100
  },
  essentialVsExtras(transactions: Transaction[], essentialCategoryIds: number[]) {
    const essential = transactions
      .filter((tx) => tx.type === 'expense' && essentialCategoryIds.includes(tx.categoryId))
      .reduce((sum, tx) => sum + tx.amount, 0)
    const totalExpenses = transactions.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
    const superfluous = totalExpenses - essential
    return { essential, superfluous }
  },
  biggestExpenseCategory(transactions: Transaction[]) {
    const list = byCategory(transactions)
    return list.length ? list[0] : null
  },
  mostExpensiveMonth(transactions: Transaction[]) {
    const monthly = monthlyComparisons(transactions)
    if (!monthly.length) return null
    return monthly.reduce((prev, current) =>
      current.expense > prev.expense ? current : prev,
    )
  },
}
