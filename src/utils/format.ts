export const formatCurrency = (value: number, currency = 'BRL') =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)

export const formatMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-')
  if (!year || !month) return monthKey
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}
