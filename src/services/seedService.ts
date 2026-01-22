import { addMonths, format } from 'date-fns'
import { db } from '../db'
import { categoryService } from './categoryService'
import { savingsService } from './savingsService'
import { transactionService } from './transactionService'

export const seedService = {
  async createDemoData(userId: number) {
    await categoryService.ensureDefaults(userId)
    const categories = await categoryService.list(userId)
    const incomeCategory = categories.find((cat) => cat.kind === 'income')
    const expenseCategory = categories.find((cat) => cat.kind === 'expense')
    const savingsCategory = categories.find((cat) => cat.name.toLowerCase().includes('poupança'))
    const now = new Date()
    for (let index = 0; index < 6; index += 1) {
      const date = addMonths(now, -index)
      const formattedDate = format(date, 'yyyy-MM-dd')
      await transactionService.add(userId, {
        type: index % 2 === 0 ? 'expense' : 'income',
        amount: Number((Math.random() * 500 + 100).toFixed(2)),
        date: formattedDate,
        categoryId: index % 2 === 0 ? expenseCategory?.id ?? 0 : incomeCategory?.id ?? 0,
        description: index % 2 === 0 ? 'Despesa recorrente' : 'Receita mensal',
      })
    }

    if (savingsCategory) {
      const goalId = await savingsService.createGoal(userId, {
        name: 'Reserva de emergência',
        startDate: format(now, 'yyyy-MM-dd'),
        initialAmount: 200,
        monthlyIncrease: 50,
        mode: 'durationMonths',
        durationMonths: 6,
        interestMode: 'none',
      })
      for (let month = 0; month < 6; month += 1) {
        const monthDate = addMonths(now, month)
        const monthKey = format(monthDate, 'yyyy-MM')
        const planned = 200 + month * 50
        await savingsService.recordDeposit(userId, goalId, monthKey, planned, planned)
      }
    }
  },
  async clearUserData(userId: number) {
    await db.transactions.where('userId').equals(userId).delete()
    await db.savingEntries.where('userId').equals(userId).delete()
    await db.savingGoals.where('userId').equals(userId).delete()
    await db.categories.where('userId').equals(userId).delete()
    await db.settings.where('userId').equals(userId).delete()
    await categoryService.ensureDefaults(userId)
  },
}
