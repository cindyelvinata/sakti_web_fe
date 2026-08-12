import apiClient from '@/lib/apiClient'

async function unwrap(request, fallbackMessage) {
  const { data } = await request
  if (!data?.success) throw new Error(data?.message || fallbackMessage)
  return data.data
}

export const getWorkConfiguration = () => unwrap(apiClient.get('/api/admin/konfigurasi-kerja'), 'Gagal memuat konfigurasi kerja.')
export const updateWorkConfiguration = (payload) => unwrap(apiClient.put('/api/admin/konfigurasi-kerja', payload), 'Gagal menyimpan konfigurasi kerja.')

export async function getHolidays(params = { page: 1, limit: 100 }) {
  const { data } = await apiClient.get('/api/admin/libur', { params })
  if (!data?.success) throw new Error(data?.message || 'Gagal memuat hari libur.')
  return { items: Array.isArray(data.data) ? data.data : [], meta: data.meta ?? {} }
}

export const createHoliday = (payload) => unwrap(apiClient.post('/api/admin/libur', payload), 'Gagal menambah hari libur.')
export const updateHoliday = (id, payload) => unwrap(apiClient.put(`/api/admin/libur/${id}`, payload), 'Gagal memperbarui hari libur.')
export const deleteHoliday = (id) => unwrap(apiClient.delete(`/api/admin/libur/${id}`), 'Gagal menghapus hari libur.')
