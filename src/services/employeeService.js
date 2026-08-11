import apiClient from '@/lib/apiClient'

export async function getEmployees(params) {
  const { data } = await apiClient.get('/api/admin/karyawan', { params })

  if (!data?.success) throw new Error(data?.message || 'Gagal memuat data karyawan.')

  return {
    items: Array.isArray(data.data) ? data.data.filter(Boolean) : [],
    meta: data.meta && typeof data.meta === 'object' ? data.meta : {},
  }
}
