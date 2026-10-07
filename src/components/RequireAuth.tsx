import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Redirects to / if user is not logged in */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null   // wait for /api/auth/me to resolve
  if (!user) return <Navigate to="/" replace />
  return <>{children}</>
}

/** Redirects to / if user is not admin */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}
