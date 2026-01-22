import DeleteIcon from '@mui/icons-material/Delete'
import {
  Box,
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { transactionService } from '../../services/transactionService'
import type { TransactionFilterOptions } from '../../services/transactionService'
import { categoryService } from '../../services/categoryService'
import type { Category, Transaction } from '../../types/models'
import { formatCurrency, formatMonthLabel } from '../../utils/format'

const PAGE_SIZE = 8

export const TransactionsPage = () => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filters, setFilters] = useState<TransactionFilterOptions>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [page, setPage] = useState(1)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    if (!user) return
    categoryService.ensureDefaults(user.id!).then(() => {
      categoryService.list(user.id!).then(setCategories)
    })
  }, [user])

  const loadTransactions = async () => {
    if (!user) return
    const data = await transactionService.list(user.id!, { filter: filters })
    setTransactions(data)
    setPage(1)
  }

  useEffect(() => {
    loadTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, user])

  const handleDelete = async (id: number) => {
    if (!window.confirm('Confirma remover esta transação?')) return
    await transactionService.remove(id)
    loadTransactions()
  }

  const handleExport = async () => {
    const csv = await transactionService.exportCsv(transactions)
    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `transacoes_${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!user) return
    const file = event.target.files?.[0]
    if (!file) return
    setImporting(true)
    const text = await file.text()
    await transactionService.importCsv(user.id!, text)
    await loadTransactions()
    setImporting(false)
  }

  const pageCount = Math.ceil(transactions.length / PAGE_SIZE) || 1

  const pageItems = useMemo(
    () => transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, transactions],
  )

  const filterChange = (key: keyof TransactionFilterOptions, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }))
  }

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>
          Transações
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              label="Busca"
              fullWidth
              value={filters.search ?? ''}
              onChange={(event) => filterChange('search', event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              label="Data início"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.startDate ?? ''}
              onChange={(event) => filterChange('startDate', event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              label="Data fim"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.endDate ?? ''}
              onChange={(event) => filterChange('endDate', event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                label="Tipo"
                value={filters.type ?? ''}
                onChange={(event) => filterChange('type', event.target.value || undefined)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="income">Receita</MenuItem>
                <MenuItem value="expense">Despesa</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Categoria</InputLabel>
              <Select
                label="Categoria"
                value={filters.categoryIds?.[0] ?? ''}
                onChange={(event) =>
                  filterChange(
                    'categoryIds',
                    event.target.value ? [Number(event.target.value)] : undefined,
                  )
                }
              >
                <MenuItem value="">Todas</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      <Stack direction="row" spacing={2} alignItems="center">
        <Button variant="outlined" onClick={handleExport}>
          Exportar CSV
        </Button>
        <Button variant="outlined" component="label" disabled={importing}>
          {importing ? 'Importando...' : 'Importar CSV'}
          <input type="file" accept=".csv" hidden onChange={handleImport} />
        </Button>
        <Button variant="contained" color="primary" onClick={() => loadTransactions()}>
          Atualizar
        </Button>
      </Stack>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageItems.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{tx.type === 'income' ? 'Receita' : 'Despesa'}</TableCell>
                <TableCell>{formatCurrency(tx.amount)}</TableCell>
                <TableCell>{formatMonthLabel(tx.date.slice(0, 7))}</TableCell>
                <TableCell>{categories.find((cat) => cat.id === tx.categoryId)?.name ?? 'Não categorizado'}</TableCell>
                <TableCell>{tx.description}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleDelete(tx.id!)} size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Pagination
        count={pageCount}
        page={page}
        onChange={(_event, value) => setPage(value)}
        color="primary"
      />
    </Box>
  )
}
