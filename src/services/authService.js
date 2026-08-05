import apiClient from '@/lib/apiClient'
import { authStorage } from '@/lib/authStorage'

export async function login({ email, password }) {
  const { data } = await apiClient.post('/api/auth/login', { email, password })
  const { access_token: accessToken, user } = data?.data ?? {}

  if (!data?.success || !accessToken) {
    throw new Error(data?.message || 'Login gagal. Silakan coba lagi.')
  }

  if (user?.role !== 'admin') {
    authStorage.clearSession()
    throw new Error('Akun ini tidak memiliki akses ke Web Admin.')
  }

  authStorage.setSession({ accessToken, user })
  return { accessToken, user }
}
