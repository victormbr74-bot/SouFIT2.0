import { Box, Card, CardContent, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import { reportService } from '../../services/reportService'
import { transactionService } from '../../services/transactionService'
import { categoryService } from '../../services/categoryService'
import { useAuth } from '../../hooks/useAuth'
import type { Category, Transaction } from '../../types/models'
import { formatCurrency } from '../../utils/format'

const monthOptions = [
  { value: '', label: 'Todos' },
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Fev' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Abr' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Ago' },
  { value: '09', label: 'Set' },
  { value: '10', label: 'Out' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dez' },
]

export const ReportsPage = () => {
  const { user, settings } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState('')

  useEffect(() => {
    if (!user) return
    transactionService.list(user.id!).then(setTransactions)
    categoryService.list(user.id!).then(setCategories)
  }, [user])

  const filteredTransactions = useMemo(() => {
    if (!user) return []
    return transactions.filter((tx) => new Date(tx.date).getFullYear() === year)
  }, [transactions, year, user])

  const monthlyFilteredTransactions = useMemo(() => {
    if (!month) return filteredTransactions
    return filteredTransactions.filter((tx) => tx.date.startsWith(`${year}-${month}`))
  }, [filteredTransactions, month, year])

  const categoryTotals = reportService.byCategory(monthlyFilteredTransactions)
  const topExpenses = reportService.topExpenses(monthlyFilteredTransactions)
  const savingsCategoryId = categories.find((cat) => cat.name.toLowerCase().includes('poupança'))?.id
  const savingsTotal = monthlyFilteredTransactions
    .filter((tx) => tx.categoryId === savingsCategoryId)
    .reduce((sum, tx) => sum + tx.amount, 0)
  const savingRate = reportService.savingsRate(filteredTransactions, savingsTotal)
  const essentialIds = settings?.essentialsCategories ?? []
  const essentialData = reportService.essentialVsExtras(monthlyFilteredTransactions, essentialIds)
  const biggestCategory = reportService.biggestExpenseCategory(monthlyFilteredTransactions)
  const mostExpensiveMonth = reportService.mostExpensiveMonth(filteredTransactions)

  const categoryChartData = {
    labels: categoryTotals.map(
      (item) => categories.find((category) => category.id === item.categoryId)?.name ?? 'Outros',
    ),
    datasets: [
      {
        label: 'Despesa',
        data: categoryTotals.map((item) => item.total),
        backgroundColor: '#fb7185',
      },
    ],
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Typography variant="h6">Relatórios</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Ano</InputLabel>
                <Select value={year} label="Ano" onChange={(event) => setYear(Number(event.target.value))}>
                  {[year, year - 1, year - 2].map((optionYear) => (
                    <MenuItem key={optionYear} value={optionYear}>
                      {optionYear}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Mês</InputLabel>
                <Select value={month} label="Mês" onChange={(event) => setMonth(event.target.value)}>
                  {monthOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Top 10 despesas</Typography>
            <Stack spacing={1} mt={2}>
              {topExpenses.map((tx) => (
                <Box key={tx.id} display="flex" justifyContent="space-between">
                  <Typography variant="body2">{tx.description ?? 'Sem descrição'}</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(tx.amount)}
                  </Typography>
                </Box>
              ))}
              {!topExpenses.length && (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma despesa cadastrada no período.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Saúde financeira</Typography>
            <Stack spacing={1} mt={2}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Taxa de poupança</Typography>
                <Typography variant="body2">{savingRate.toFixed(1)}%</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Essenciais</Typography>
                <Typography variant="body2">{formatCurrency(essentialData.essential)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Supérfluos</Typography>
                <Typography variant="body2">{formatCurrency(essentialData.superfluous)}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Maior categoria de gasto: {categories.find((cat) => cat.id === biggestCategory?.categoryId)?.name ?? 'Não identificado'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mês mais caro: {mostExpensiveMonth?.month ?? 'Nenhum'}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Gráfico por categoria</Typography>
            <Bar data={categoryChartData} />
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  )
}
