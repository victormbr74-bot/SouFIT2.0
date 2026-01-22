import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Link, Paper, Snackbar, TextField, Typography, Alert } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('Digite um e-mail válido'),
  password: z.string().min(6, 'Senha precisa ter no mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app/dashboard'

  const onSubmit = async (values: LoginForm) => {
    try {
      await login(values)
      navigate(from, { replace: true })
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
        sx={{ width: '100%', maxWidth: 420, padding: 4, borderRadius: 3, boxShadow: 3 }}
        component="form"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Typography variant="h5" gutterBottom>
          Entrar
        </Typography>
        <Typography color="text.secondary" variant="body2" gutterBottom>
          Use seu e-mail e senha para continuar.
        </Typography>
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
        <Button size="large" variant="contained" fullWidth type="submit" sx={{ mt: 2 }} disabled={isSubmitting}>
          Entrar
        </Button>
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Ainda não tem uma conta?{' '}
          <Link component={RouterLink} to="/register">
            Criar cadastro
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
