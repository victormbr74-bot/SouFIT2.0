import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { useAuth } from '../hooks/useAuth'

export const PRIMARY_COLORS = ['#5B21B6', '#0EA5E9', '#059669', '#C2410C', '#F97316', '#2563EB']

const getPalette = (mode: 'light' | 'dark', primaryColor: string) => ({
  mode,
  primary: {
    main: primaryColor,
  },
  background: {
    default: mode === 'dark' ? '#05070d' : '#f6f6f9',
    paper: mode === 'dark' ? '#0f172a' : '#ffffff',
  },
})

export const ThemeProviderWrapper = ({ children }: { children: ReactNode }) => {
  const { settings } = useAuth()
  const mode = settings?.themeMode ?? 'light'
  const primaryColor = settings?.primaryColor ?? PRIMARY_COLORS[0]

  const theme = useMemo(() => {
    const config = createTheme({
      palette: getPalette(mode, primaryColor),
      typography: {
        fontFamily: "'Inter', 'InterVariable', system-ui, sans-serif",
      },
      shape: {
        borderRadius: 12,
      },
    })
    return responsiveFontSizes(config)
  }, [mode, primaryColor])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
