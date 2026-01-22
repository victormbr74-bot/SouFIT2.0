import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Link, Paper, Snackbar, TextField, Typography, Alert } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../hooks/useAuth'

const registerSchema = z
  .object({
    name: z.string().min(3, 'Informe seu nome completo'),
    email: z.string().email('Digite um e-mail válido'),
    password: z.string().min(6, 'Senha precisa ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas precisam ser iguais',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export const RegisterPage = () => {
  const { register: registerAction } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (values: RegisterForm) => {
    try {
      await registerAction({
        name: values.name,
        email: values.email,
        password: values.password,
      })
      navigate('/app/dashboard', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      padding={2}
      bgcolor="background.default"
    >
      <Paper
        sx={{ width: '100%', maxWidth: 480, padding: 4, borderRadius: 3, boxShadow: 3 }}
        component="form"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Typography variant="h5" gutterBottom>
          Criar conta
        </Typography>
        <Typography color="text.secondary" variant="body2" gutterBottom>
          Use seu e-mail para criar uma conta segura.
        </Typography>
        <TextField
          label="Nome completo"
          fullWidth
          margin="normal"
          {...register('name')}
          error={!!errors.name}
          helperText={errors.name?.message}
        />
        <TextField
          label="E-mail"
          type="email"
          fullWidth
          margin="normal"
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <TextField
          label="Senha"
          type="password"
          fullWidth
          margin="normal"
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
        />
        <TextField
          label="Confirmar senha"
          type="password"
          fullWidth
          margin="normal"
          {...register('confirmPassword')}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
        />
        <Button size="large" variant="contained" fullWidth type="submit" sx={{ mt: 2 }} disabled={isSubmitting}>
          Criar conta
        </Button>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Já tem uma conta?{' '}
          <Link component={RouterLink} to="/login">
            Entrar agora
          </Link>
        </Typography>
      </Paper>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  )
}
