import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import { addMonths, format, startOfMonth } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { Doughnut, Line, Bar } from 'react-chartjs-2'
import { transactionService } from '../../services/transactionService'
import { categoryService } from '../../services/categoryService'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency } from '../../utils/format'
import type { Category, Transaction } from '../../types/models'

const monthOptions = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Fev' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Abr' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Ago' },
  { value: 9, label: 'Set' },
  { value: 10, label: 'Out' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dez' },
]

const getLastMonths = (count: number) => {
  const current = startOfMonth(new Date())
  return Array.from({ length: count }).map((_, index) => {
    const date = addMonths(current, index - (count - 1))
    return {
      key: format(date, 'yyyy-MM'),
      label: format(date, 'MMM yyyy'),
    }
  })
}

export const DashboardPage = () => {
  const { user } = useAuth()
  const today = new Date()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [month, setMonth] = useState<number>(today.getMonth() + 1)
  const [year, setYear] = useState<number>(today.getFullYear())

  useEffect(() => {
    if (!user) {
      return
    }
    transactionService.list(user.id!).then((result) => {
      setTransactions(result)
    })
  }, [user])

  useEffect(() => {
    if (!user) {
      return
    }
    categoryService.ensureDefaults(user.id!).then(() => {
      categoryService.list(user.id!).then((result) => setCategories(result))
    })
  }, [user])

  const availableYears = useMemo(() => {
    const uniqueYears = new Set<number>()
    transactions.forEach((tx) => {
      const yearNumber = new Date(tx.date).getFullYear()
      if (!Number.isNaN(yearNumber)) {
        uniqueYears.add(yearNumber)
      }
    })
    uniqueYears.add(today.getFullYear())
    return Array.from(uniqueYears).sort()
  }, [transactions, today])

  const selectedMonthKey = `${year}-${String(month).padStart(2, '0')}`

  const filteredTransactions = useMemo(
    () => transactions.filter((tx) => tx.date.startsWith(selectedMonthKey)),
    [transactions, selectedMonthKey],
  )

  const expenses = filteredTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)
  const incomes = filteredTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)
  const balance = incomes - expenses
  const savingsCategoryId = categories.find((cat) =>
    cat.name.toLowerCase().includes('poupança'),
  )?.id
  const savings = filteredTransactions
    .filter((tx) => tx.categoryId === savingsCategoryId)
    .reduce((sum, tx) => sum + tx.amount, 0)

  const lastMonths = getLastMonths(6)
  const monthlySeries = lastMonths.map((monthInfo) => {
    const monthlyTransactions = transactions.filter((tx) => tx.date.startsWith(monthInfo.key))
    const monthlyIncome = monthlyTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0)
    const monthlyExpense = monthlyTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0)
    return {
      ...monthInfo,
      income: monthlyIncome,
      expense: monthlyExpense,
    }
  })

  const doughnutData = {
    labels: categories.map((category) => category.name),
    datasets: [
      {
        data: categories.map((category) =>
          filteredTransactions
            .filter((tx) => tx.categoryId === category.id && tx.type === 'expense')
            .reduce((sum, tx) => sum + tx.amount, 0),
        ),
        backgroundColor: [
          '#4f46e5',
          '#0ea5e9',
          '#22c55e',
          '#f97316',
          '#ef4444',
          '#a855f7',
          '#0f766e',
          '#1d4ed8',
        ],
      },
    ],
  }

  const lineData = {
    labels: monthlySeries.map((item) => item.label),
    datasets: [
      {
        label: 'Saldo',
        data: monthlySeries.map((item) => item.income - item.expense),
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        tension: 0.4,
      },
    ],
  }

  const barData = {
    labels: monthlySeries.map((item) => item.label),
    datasets: [
      {
        label: 'Receitas',
        data: monthlySeries.map((item) => item.income),
        backgroundColor: '#0ea5e9',
      },
      {
        label: 'Despesas',
        data: monthlySeries.map((item) => item.expense),
        backgroundColor: '#ef4444',
      },
    ],
  }

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <Typography fontWeight={700} variant="h6">
              Dashboard
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl size="small">
                <InputLabel>Mês</InputLabel>
                <Select
                  label="Mês"
                  value={month}
                  onChange={(event) => setMonth(Number(event.target.value))}
                >
                  {monthOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>Ano</InputLabel>
                <Select
                  label="Ano"
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value))}
                >
                  {availableYears.map((value) => (
                    <MenuItem key={value} value={value}>
                      {value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setMonth(today.getMonth() + 1)
                  setYear(today.getFullYear())
                }}
              >
                Mês atual
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  const todayKey = format(today, 'yyyy-MM')
                  const [yearValue, monthValue] = todayKey.split('-')
                  setYear(Number(yearValue))
                  setMonth(Number(monthValue))
                }}
              >
                Hoje
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="overline">Despesas do mês</Typography>
            <Typography variant="h5" fontWeight={600}>
              {formatCurrency(expenses)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="overline">Receitas do mês</Typography>
            <Typography variant="h5" fontWeight={600}>
              {formatCurrency(incomes)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="overline">Saldo do mês</Typography>
            <Typography variant="h5" fontWeight={600} color={balance >= 0 ? 'success.main' : 'error.main'}>
              {formatCurrency(balance)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="overline">Poupança</Typography>
            <Typography variant="h5" fontWeight={600}>
              {formatCurrency(savings)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, minHeight: 340 }}>
            <Typography variant="subtitle1" gutterBottom>
              Linha: saldo últimos 6 meses
            </Typography>
            <Line data={lineData} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, minHeight: 340 }}>
            <Typography variant="subtitle1" gutterBottom>
              Rosca: despesas por categoria
            </Typography>
            <Doughnut data={doughnutData} />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Barra: receitas vs despesas
            </Typography>
            <Bar data={barData} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
