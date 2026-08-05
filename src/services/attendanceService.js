import apiClient from '@/lib/apiClient'

export async function getAttendanceReport(params) {
  const { data } = await apiClient.get('/api/admin/presensi', { params })

  if (!data?.success) {
    throw new Error(data?.message || 'Gagal memuat laporan presensi.')
  }

  const report = data.data ?? {}

  return {
    items: Array.isArray(report.items) ? report.items.filter(Boolean) : [],
    meta: report.meta && typeof report.meta === 'object' ? report.meta : {},
  }
}

export async function downloadAttendanceReport(params) {
  const response = await apiClient.get('/api/admin/presensi/export', {
    params,
    responseType: 'blob',
  })

  return {
    file: response.data,
    contentDisposition: response.headers['content-disposition'],
  }
}
