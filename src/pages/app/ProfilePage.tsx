import { Alert, Box, Button, Card, CardContent, Checkbox, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Select, Stack, Snackbar, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { seedService } from '../../services/seedService'
import { categoryService } from '../../services/categoryService'
import { PRIMARY_COLORS } from '../../theme/ThemeProvider'
import type { Category } from '../../types/models'

export const ProfilePage = () => {
  const { user, settings, updateProfile, updateSettings, setThemeMode, setPrimaryColor } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [currency, setCurrency] = useState(settings?.currency ?? 'BRL')
  const [themeMode, setTheme] = useState<'light' | 'dark'>(settings?.themeMode ?? 'light')
  const [essentials, setEssentials] = useState<number[]>(settings?.essentialsCategories ?? [])
  const [categories, setCategories] = useState<Category[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
    }
  }, [user])

  useEffect(() => {
    if (settings) {
      setCurrency(settings.currency)
      setTheme(settings.themeMode)
      setEssentials(settings.essentialsCategories ?? [])
    }
  }, [settings])

  useEffect(() => {
    if (!user) return
    categoryService.list(user.id!).then(setCategories)
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setWorking(true)
    await updateProfile({ name })
    await updateSettings({
      currency,
      essentialsCategories: essentials,
    })
    setThemeMode(themeMode)
    setMessage('Perfil atualizado')
    setWorking(false)
  }

  const toggleEssential = (categoryId: number) => {
    setEssentials((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const handleDemoData = async () => {
    if (!user) return
    setWorking(true)
    await seedService.createDemoData(user.id!)
    setMessage('Dados demo gerados')
    setWorking(false)
  }

  const handleReset = async () => {
    if (!user) return
    if (!window.confirm('Confirma resetar todos os dados locais?')) return
    setWorking(true)
    await seedService.clearUserData(user.id!)
    setMessage('Dados resetados')
    setWorking(false)
    window.location.reload()
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h6">Perfil e configurações</Typography>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} md={4}>
              <TextField label="Nome" fullWidth value={name} onChange={(event) => setName(event.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Moeda</InputLabel>
                <Select value={currency} label="Moeda" onChange={(event) => setCurrency(event.target.value)}>
                  <MenuItem value="BRL">BRL</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tema</InputLabel>
                <Select
                  value={themeMode}
                  label="Tema"
                  onChange={(event) => setTheme(event.target.value as 'light' | 'dark')}
                >
                  <MenuItem value="light">Claro</MenuItem>
                  <MenuItem value="dark">Escuro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} mt={2}>
            {PRIMARY_COLORS.map((color) => (
              <Box
                key={color}
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  bgcolor: color,
                  border: settings?.primaryColor === color ? '2px solid' : '2px solid transparent',
                  cursor: 'pointer',
                }}
                onClick={() => setPrimaryColor(color)}
              />
            ))}
          </Stack>
          <Stack direction="row" spacing={2} mt={3}>
            <Button variant="contained" onClick={handleSave} disabled={working}>
              Salvar
            </Button>
            <Button variant="outlined" onClick={handleDemoData} disabled={working}>
              Gerar dados demo
            </Button>
            <Button variant="contained" color="error" onClick={handleReset} disabled={working}>
              Resetar dados
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6">Categorias essenciais</Typography>
          <Stack direction="row" flexWrap="wrap" gap={2} mt={1}>
            {categories
              .filter((category): category is Category & { id: number } => typeof category.id === 'number')
              .map((category) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={essentials.includes(category.id)}
                      onChange={() => toggleEssential(category.id)}
                    />
                  }
                  label={category.name}
                  key={category.id}
                />
              ))}
          </Stack>
        </CardContent>
      </Card>
      <Snackbar open={!!message} autoHideDuration={4000} onClose={() => setMessage(null)}>
        <Alert onClose={() => setMessage(null)} severity="success">
          {message}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
