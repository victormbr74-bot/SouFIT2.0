import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { categoryService } from '../services/categoryService'
import { transactionService } from '../services/transactionService'
import { useAuth } from '../hooks/useAuth'
import type { Category } from '../types/models'

const schema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z
    .preprocess((value) => Number(value), z.number().positive('Informe um valor válido')),
  date: z.string(),
  categoryId: z
    .preprocess((value) => Number(value), z.number().optional())
    .optional(),
  description: z.string().optional(),
  paymentMethod: z.enum(['dinheiro', 'cartão', 'pix', 'boleto']).optional(),
  recurring: z.boolean().optional(),
})

type TransactionForm = z.infer<typeof schema>

interface TransactionDialogProps {
  open: boolean
  onClose(): void
}

export const TransactionDialog = ({ open, onClose }: TransactionDialogProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [customCategory, setCustomCategory] = useState('')
  const { user } = useAuth()
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<TransactionForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
    },
  })

  useEffect(() => {
    if (!user) return
    categoryService.ensureDefaults(user.id!).then(() => {
      categoryService.list(user.id!).then(setCategories)
    })
  }, [user, open])

  const onSubmit = async (values: TransactionForm) => {
    if (!user) return
    try {
      const kind = values.type === 'income' ? 'income' : 'expense'
      let finalCategoryId =
        values.categoryId ??
        categories.find((cat) => cat.kind === kind)?.id

      if (!finalCategoryId && customCategory.trim()) {
        finalCategoryId = await categoryService.create(user.id!, {
          name: customCategory.trim(),
          kind,
        })
        setCustomCategory('')
        const updated = await categoryService.list(user.id!)
        setCategories(updated)
      }

      if (!finalCategoryId) {
        throw new Error('Adicione ou selecione uma categoria antes de continuar')
      }

      await transactionService.add(user.id!, {
        type: values.type,
        amount: values.amount,
        date: values.date,
        categoryId: finalCategoryId,
        description: values.description,
        paymentMethod: values.paymentMethod,
        recurring: values.recurring,
      })
      reset()
      onClose()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth fullScreen={isMobile}>
    <DialogTitle>Adicionar transação rápida</DialogTitle>
      <DialogContent dividers>
        <Box
          component="form"
          display="flex"
          flexDirection="column"
          gap={2}
          onSubmit={handleSubmit(onSubmit)}
        >
          <TextField label="Tipo" select defaultValue="expense" {...register('type')}>
            <MenuItem value="income">Receita</MenuItem>
            <MenuItem value="expense">Despesa</MenuItem>
          </TextField>
          <TextField label="Valor" type="number" inputProps={{ step: '0.01' }} {...register('amount')} />
          <TextField label="Data" type="date" InputLabelProps={{ shrink: true }} {...register('date')} />
          <TextField
            label="Categoria"
            select
            fullWidth
            {...register('categoryId')}
            helperText="Se desejar, selecione a categoria desejada"
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Nova categoria"
            placeholder="Opcional"
            value={customCategory}
            onChange={(event) => setCustomCategory(event.target.value)}
          />
          <TextField label="Descrição" fullWidth {...register('description')} />
          <TextField label="Forma de pagamento" select fullWidth {...register('paymentMethod')}>
            <MenuItem value="dinheiro">Dinheiro</MenuItem>
            <MenuItem value="cartão">Cartão</MenuItem>
            <MenuItem value="pix">Pix</MenuItem>
            <MenuItem value="boleto">Boleto</MenuItem>
          </TextField>
          <FormControlLabel control={<Switch size="small" {...register('recurring')} />} label="Recorrente" />
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSubmitting}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
