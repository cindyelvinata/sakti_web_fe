import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { authStorage } from '@/lib/authStorage'

export default function ProtectedRoute() {
  const location = useLocation()
  const accessToken = authStorage.getAccessToken()
  const user = authStorage.getUser()

  if (!accessToken || user?.role !== 'admin') {
    authStorage.clearSession()
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }

  return <Outlet />
}
