import { addMonths, format } from 'date-fns'
import { db } from '../db'
import type { SavingEntry, SavingGoal } from '../types/models'

const buildMonthKey = (date: Date) => format(date, 'yyyy-MM')

const generatePlan = (goal: SavingGoal, capMonths = goal.durationMonths || 12) => {
  const startDate = new Date(goal.startDate)
  const plan: Array<{
    monthKey: string
    label: string
    plannedAmount: number
    cumulativePlanned: number
  }> = []
  let cumulative = 0
  const months = goal.mode === 'durationMonths' && goal.durationMonths ? goal.durationMonths : Math.max(6, capMonths)
  for (let index = 0; index < months; index += 1) {
    const current = addMonths(startDate, index)
    const monthKey = buildMonthKey(current)
    const plannedAmount = goal.initialAmount + index * goal.monthlyIncrease
    cumulative += plannedAmount
    plan.push({
      monthKey,
      label: format(current, 'MMM yyyy'),
      plannedAmount,
      cumulativePlanned: cumulative,
    })
  }
  return plan
}

export const savingsService = {
  listGoals(userId: number) {
    return db.savingGoals.where('userId').equals(userId).sortBy('startDate')
  },
  async createGoal(userId: number, payload: Omit<SavingGoal, 'id' | 'createdAt' | 'userId'>) {
    const now = new Date().toISOString()
    return db.savingGoals.add({
      ...payload,
      userId,
      createdAt: now,
    })
  },
  async recordDeposit(
    userId: number,
    goalId: number,
    monthKey: string,
    depositedAmount: number,
    plannedAmount: number,
  ) {
    const existing = await db.savingEntries
      .where('[goalId+monthKey]')
      .equals([goalId, monthKey])
      .first()
    const now = new Date().toISOString()
    if (existing) {
      await db.savingEntries.update(existing.id!, {
        depositedAmount,
        plannedAmount,
        updatedAt: now,
      })
      return existing.id
    }
    return db.savingEntries.add({
      goalId,
      userId,
      monthKey,
      plannedAmount,
      depositedAmount,
      createdAt: now,
      updatedAt: now,
    })
  },
  async getEntries(userId: number, goalId: number) {
    return db.savingEntries
      .where('[goalId+monthKey]')
      .between([goalId, '0000-00'], [goalId, '9999-99'])
      .and((entry) => entry.userId === userId)
      .sortBy('monthKey')
  },
  computePlan(goal: SavingGoal) {
    return generatePlan(goal)
  },
  async getProgress(goal: SavingGoal, entries: SavingEntry[]) {
    const plan = generatePlan(goal, goal.durationMonths ?? 12)
    const totalPlannedToDate = plan.reduce((sum, item) => sum + item.plannedAmount, 0)
    const totalDeposited = entries.reduce((sum, entry) => sum + entry.depositedAmount, 0)
    return {
      plan,
      totalPlannedToDate,
      totalDeposited,
      difference: totalPlannedToDate - totalDeposited,
      progressPercent: totalPlannedToDate > 0 ? Math.min(100, (totalDeposited / totalPlannedToDate) * 100) : 0,
    }
  },
}
