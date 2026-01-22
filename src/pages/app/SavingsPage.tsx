import AddIcon from '@mui/icons-material/Add'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
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
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { format } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Line } from 'react-chartjs-2'
import { z } from 'zod'
import { savingsService } from '../../services/savingsService'
import { useAuth } from '../../hooks/useAuth'
import type { SavingEntry, SavingGoal } from '../../types/models'
import { formatCurrency } from '../../utils/format'

const savingsGoalSchema = z
  .object({
    name: z.string().min(3),
    startDate: z.string(),
    initialAmount: z.preprocess((value) => Number(value), z.number().nonnegative()),
    monthlyIncrease: z.preprocess((value) => Number(value), z.number().nonnegative()),
    mode: z.enum(['targetValue', 'durationMonths']),
    targetValue: z.preprocess((value) => Number(value) || undefined, z.number().optional()),
    durationMonths: z
      .preprocess((value) => Number(value) || undefined, z.number().optional())
      .optional(),
    interestMode: z.enum(['none', 'percent', 'fixed']),
    interestValue: z.preprocess((value) => Number(value) || undefined, z.number().optional()),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'targetValue' && !data.targetValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetValue'],
        message: 'Informe o valor-meta',
      })
    }
    if (data.mode === 'durationMonths' && !data.durationMonths) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['durationMonths'],
        message: 'Informe a duração em meses',
      })
    }
    if (data.interestMode !== 'none' && !data.interestValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['interestValue'],
        message: 'Informe o valor de juros',
      })
    }
  })

type GoalFormData = z.infer<typeof savingsGoalSchema>

export const SavingsPage = () => {
  const { user } = useAuth()
  const [goals, setGoals] = useState<SavingGoal[]>([])
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null)
  const [entries, setEntries] = useState<SavingEntry[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositMonth, setDepositMonth] = useState('')
  const [highlightedMonth, setHighlightedMonth] = useState('')

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const { register, handleSubmit, reset, watch } = useForm<GoalFormData>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      initialAmount: 100,
      monthlyIncrease: 20,
      mode: 'targetValue',
      interestMode: 'none',
    },
  })

  const loadGoals = async () => {
    if (!user) return
    const list = await savingsService.listGoals(user.id!)
    setGoals(list)
    setSelectedGoal((prev) => {
      if (prev) {
        const updated = list.find((goal) => goal.id === prev.id)
        if (updated) {
          return updated
        }
      }
      return list[0] ?? null
    })
  }

  useEffect(() => {
    loadGoals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (!user || !selectedGoal) return
    savingsService.getEntries(user.id!, selectedGoal.id!).then(setEntries)
  }, [user, selectedGoal])

  const plan = useMemo(() => (selectedGoal ? savingsService.computePlan(selectedGoal) : []), [selectedGoal])

  useEffect(() => {
    if (plan.length) {
      setDepositMonth(plan[0].monthKey)
    }
  }, [plan])

  const depositsByMonth = useMemo(
    () =>
      plan.map((item) => ({
        ...item,
        deposited: entries.find((entry) => entry.monthKey === item.monthKey)?.depositedAmount ?? 0,
      })),
    [entries, plan],
  )

  const realizedCumulative = useMemo(() => {
    let sum = 0
    return depositsByMonth.map((item) => {
      sum += item.deposited
      return sum
    })
  }, [depositsByMonth])

  const lineData = {
    labels: depositsByMonth.map((item) => item.label),
    datasets: [
      {
        label: 'Planejado',
        data: depositsByMonth.map((item) => item.cumulativePlanned),
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Realizado',
        data: realizedCumulative,
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.2)',
        tension: 0.4,
      },
    ],
  }

  const handleSubmitGoal = async (values: GoalFormData) => {
    if (!user) return
    await savingsService.createGoal(user.id!, {
      name: values.name,
      startDate: values.startDate,
      initialAmount: values.initialAmount,
      monthlyIncrease: values.monthlyIncrease,
      mode: values.mode,
      targetValue: values.mode === 'targetValue' ? values.targetValue : undefined,
      durationMonths: values.mode === 'durationMonths' ? values.durationMonths : undefined,
      interestMode: values.interestMode,
      interestValue: values.interestMode === 'none' ? undefined : values.interestValue,
    })
    reset()
    setDialogOpen(false)
    await loadGoals()
  }

  const handleDeposit = async () => {
    if (!user || !selectedGoal || !depositMonth) return
    const target = depositsByMonth.find((item) => item.monthKey === depositMonth)?.plannedAmount ?? 0
    await savingsService.recordDeposit(
      user.id!,
      selectedGoal.id!,
      depositMonth,
      Number(depositAmount || 0),
      target,
    )
    setDepositAmount('')
    await savingsService.getEntries(user.id!, selectedGoal.id!).then(setEntries)
  }

  const totalPlanned = depositsByMonth[depositsByMonth.length - 1]?.cumulativePlanned ?? 1
  const lastRealized = realizedCumulative[realizedCumulative.length - 1] ?? 0
  const progressPercent = depositsByMonth.length > 0 ? Math.min(100, (lastRealized / totalPlanned) * 100) : 0

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
        <Typography variant="h5" fontWeight={600}>
          Poupança
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Novo objetivo
        </Button>
      </Stack>
      <Grid container spacing={2}>
        {goals.map((goal) => (
          <Grid item xs={12} md={4} key={goal.id}>
            <Card
              variant="outlined"
              sx={{
                borderColor: selectedGoal?.id === goal.id ? 'primary.main' : 'divider',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedGoal(goal)}
            >
              <CardContent>
                <Typography variant="h6">{goal.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Começa em {format(new Date(goal.startDate), 'MMM yyyy')}
                </Typography>
                <Typography>
                  Meta: {goal.mode === 'targetValue' ? formatCurrency(goal.targetValue ?? 0) : `${goal.durationMonths} meses`}
                </Typography>
                <Typography>Juros: {goal.interestMode}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {selectedGoal ? (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} alignItems="center">
            <Typography variant="subtitle1">Planejamento: {selectedGoal.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Progresso total
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{ width: '100%', maxWidth: 360 }}
            />
            <Typography variant="body2">{progressPercent.toFixed(1)}%</Typography>
          </Stack>
          <Box mt={3}>
            <Line data={lineData} />
          </Box>
          <Box mt={3}>
            <Typography variant="subtitle1" gutterBottom>
              Planejamento mensal
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Mês</TableCell>
                    <TableCell>Planejado</TableCell>
                    <TableCell>Depositado</TableCell>
                    <TableCell>Diferença</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {depositsByMonth.map((item) => (
                    <TableRow
                      key={item.monthKey}
                      selected={highlightedMonth === item.monthKey}
                      onMouseEnter={() => setHighlightedMonth(item.monthKey)}
                      onMouseLeave={() => setHighlightedMonth('')}
                    >
                      <TableCell>{item.label}</TableCell>
                      <TableCell>{formatCurrency(item.plannedAmount)}</TableCell>
                      <TableCell>{formatCurrency(item.deposited)}</TableCell>
                      <TableCell
                        sx={{
                          color: item.deposited < item.plannedAmount ? 'error.main' : 'success.main',
                        }}
                      >
                        {formatCurrency(item.deposited - item.plannedAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Divider sx={{ my: 3 }} />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Mês</InputLabel>
              <Select
                label="Mês"
                value={depositMonth}
                onChange={(event) => setDepositMonth(event.target.value)}
              >
                {depositsByMonth.map((item) => (
                  <MenuItem key={item.monthKey} value={item.monthKey}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Valor guardado"
              type="number"
              value={depositAmount}
              onChange={(event) => setDepositAmount(event.target.value)}
            />
            <Button variant="contained" onClick={handleDeposit}>
              Registrar depósito
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Alert severity="info">Crie um objetivo para acompanhar sua poupança.</Alert>
      )}
      <Dialog fullScreen={isMobile} open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Novo objetivo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Preencha as informações mínimas para começar seu plano de poupança.
          </DialogContentText>
          <Stack spacing={2} mt={2}>
            <TextField label="Nome" {...register('name')} />
            <TextField label="Data inicial" type="date" InputLabelProps={{ shrink: true }} {...register('startDate')} />
            <TextField label="Valor inicial" type="number" {...register('initialAmount')} />
            <TextField label="Acréscimo mensal" type="number" {...register('monthlyIncrease')} />
            <TextField label="Modo" select defaultValue="targetValue" {...register('mode')}>
              <MenuItem value="targetValue">Valor-meta</MenuItem>
              <MenuItem value="durationMonths">Duração</MenuItem>
            </TextField>
            {watch('mode') === 'targetValue' ? (
              <TextField label="Valor-meta" type="number" {...register('targetValue')} />
            ) : (
              <TextField label="Duração (meses)" type="number" {...register('durationMonths')} />
            )}
            <TextField label="Juros" select defaultValue="none" {...register('interestMode')}>
              <MenuItem value="none">Sem juros</MenuItem>
              <MenuItem value="percent">Percentual ao mês</MenuItem>
              <MenuItem value="fixed">Valor fixo extra</MenuItem>
            </TextField>
            {watch('interestMode') !== 'none' && (
              <TextField label="Valor dos juros" type="number" {...register('interestValue')} />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit(handleSubmitGoal)}>
            Salvar objetivo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
