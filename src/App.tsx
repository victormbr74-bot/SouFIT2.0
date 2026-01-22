import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { FullPageLoading } from './components/FullPageLoading'
import { useAuth } from './hooks/useAuth'
import { AppShell } from './components/AppShell'
import { DashboardPage } from './pages/app/DashboardPage'
import { ProfilePage } from './pages/app/ProfilePage'
import { ReportsPage } from './pages/app/ReportsPage'
import { SavingsPage } from './pages/app/SavingsPage'
import { TransactionsPage } from './pages/app/TransactionsPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return <FullPageLoading />
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route
      path="/app/*"
      element={
        <RequireAuth>
          <AppShell />
        </RequireAuth>
      }
    >
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="transactions" element={<TransactionsPage />} />
      <Route path="savings" element={<SavingsPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Route>
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
)

export const App = () => (
  <ErrorBoundary>
    <AppRoutes />
  </ErrorBoundary>
)

export default App
