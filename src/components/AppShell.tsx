import AddIcon from '@mui/icons-material/Add'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { PRIMARY_COLORS } from '../theme/ThemeProvider'
import { appNavItems } from './navigationItems'
import { MobileBottomNav } from './MobileBottomNav'
import { TransactionDialog } from './TransactionDialog'

const drawerWidth = 260

export const AppShell = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { settings, user, logout, setThemeMode, setPrimaryColor } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const location = useLocation()

  const drawerContent = (
    <Box display="flex" flexDirection="column" height="100%">
      <Box px={3} py={4}>
        <Typography variant="h6" fontWeight={700}>
          SouFinanças
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.name ?? 'Controle total do seu dinheiro'}
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {appNavItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={NavLink}
            to={item.path}
            sx={{
              borderRadius: 2,
              mx: 2,
              mb: 1,
            }}
            onClick={() => isMobile && setMobileOpen(false)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box px={3} py={2} display="flex" alignItems="center" gap={2}>
        <Avatar>{user?.name?.[0] ?? 'U'}</Avatar>
        <Box>
          <Typography variant="body2">{user?.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <IconButton
          aria-label="logout"
          onClick={logout}
          color="inherit"
          sx={{ marginLeft: 'auto' }}
        >
          <LogoutIcon />
        </IconButton>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={1}
        color="inherit"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={600}>
            SouFinanças
          </Typography>
          <Box flexGrow={1} />
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title="Alternar tema">
              <IconButton
                onClick={() =>
                  setThemeMode(settings?.themeMode === 'dark' ? 'light' : 'dark')
                }
              >
                {settings?.themeMode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
            <Stack direction="row" spacing={0.5} alignItems="center">
              {PRIMARY_COLORS.map((color) => (
                <Box
                  key={color}
                  onClick={() => setPrimaryColor(color)}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: color,
                    border: settings?.primaryColor === color ? '2px solid' : '2px solid transparent',
                    borderColor: (theme) => theme.palette.background.paper,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Stack>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Adicionar
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
      flexGrow: 1,
      p: { xs: 2, md: 4 },
      width: '100%',
      pb: { xs: 10, md: 4 },
    }}
  >
        <Toolbar />
        <Box display="flex" flexDirection="column" gap={3}>
          <Typography variant="subtitle2" color="text.secondary">
            Rota atual: {location.pathname}
          </Typography>
          <Outlet />
        </Box>
      </Box>
      <TransactionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <MobileBottomNav />
    </Box>
  )
}
