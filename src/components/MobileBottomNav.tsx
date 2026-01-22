import { BottomNavigation, BottomNavigationAction, Paper, useMediaQuery, useTheme } from '@mui/material'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { appNavItems } from './navigationItems'

export const MobileBottomNav = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const location = useLocation()
  const [value, setValue] = useState(location.pathname)
  const navigate = useNavigate()

  useEffect(() => {
    setValue(location.pathname)
  }, [location.pathname])

  if (!isMobile) {
    return null
  }

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        zIndex: (theme) => theme.zIndex.drawer + 2,
      }}
    >
      <BottomNavigation
        value={value}
        showLabels
        onChange={(_event, next) => {
          setValue(next)
          navigate(next)
        }}
      >
        {appNavItems.map((item) => (
          <BottomNavigationAction key={item.path} label={item.label} value={item.path} icon={item.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
