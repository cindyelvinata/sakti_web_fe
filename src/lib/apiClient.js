import axios from 'axios'
import { authStorage } from '@/lib/authStorage'

const baseURL = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const accessToken = authStorage.getAccessToken()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

export default apiClient
