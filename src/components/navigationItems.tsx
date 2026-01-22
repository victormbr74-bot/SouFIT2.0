import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import type { ReactNode } from 'react'

export interface AppNavItem {
  label: string
  path: string
  icon: ReactNode
}

export const appNavItems: AppNavItem[] = [
  {
    label: 'Dashboard',
    path: '/app/dashboard',
    icon: <DashboardOutlinedIcon />,
  },
  {
    label: 'Transações',
    path: '/app/transactions',
    icon: <ReceiptLongOutlinedIcon />,
  },
  {
    label: 'Poupança',
    path: '/app/savings',
    icon: <SavingsOutlinedIcon />,
  },
  {
    label: 'Relatórios',
    path: '/app/reports',
    icon: <BarChartOutlinedIcon />,
  },
  {
    label: 'Perfil',
    path: '/app/profile',
    icon: <PersonOutlineOutlinedIcon />,
  },
]
