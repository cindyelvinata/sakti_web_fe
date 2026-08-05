import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Download, Search } from 'lucide-react'
import { getAttendanceReport, downloadAttendanceReport } from '@/services/attendanceService'
import { authStorage } from '@/lib/authStorage'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

const filters = ['Semua Status', 'Hadir', 'Terlambat', 'Cuti']
const statusStyle = {
  Hadir: 'border-[#B7DFE9] bg-[#EDF9FC] text-[#1E93AB]',
  Terlambat: 'border-red-200 bg-red-50 text-[#E62727]',
  Cuti: 'border-red-200 bg-red-50 text-[#E62727]',
}

function formatTime(value) {
  if (!value) return '-'
  if (/^\d{1,2}:\d{2}/.test(String(value))) return String(value).slice(0, 5)

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function formatStatus(value) {
  const status = String(value || '').toLowerCase()
  return { hadir: 'Hadir', terlambat: 'Terlambat', cuti: 'Cuti' }[status] || (value ? String(value) : '-')
}

function normalizeRecord(item) {
  return {
    id: item.id || item.presensi_id || item.attendance_id,
    name: item.nama_lengkap || '-',
    division: item.level_jabatan || '-',
    position: '-',
    checkIn: formatTime(item.jam_masuk),
    checkOut: formatTime(item.jam_keluar),
    gps: item.lintang_masuk || '-',
    status: formatStatus(item.status),
  }
}

function StatusBadge({ status }) {
  return <span className={cn('inline-flex min-w-[80px] justify-center rounded-full border px-3 py-1 text-[11px] font-semibold', statusStyle[status] || 'border-slate-200 bg-slate-100 text-slate-600')}>{status.toUpperCase()}</span>
}

function RecordCell({ record }) {
  return <article className="border-b border-slate-200 p-4 last:border-0 sm:p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-[13px] font-semibold text-black">{record.name}</p><p className="mt-1 text-[12px] font-semibold text-slate-700">{record.division}</p><p className="text-[11px] text-slate-400">{record.position}</p></div><StatusBadge status={record.status} /></div><div className="mt-4 grid grid-cols-3 gap-3 text-[11px]"><div><p className="text-slate-400">Jam masuk</p><p className="mt-1 font-semibold">{record.checkIn}</p></div><div><p className="text-slate-400">Jam keluar</p><p className="mt-1 font-semibold">{record.checkOut}</p></div><div><p className="text-slate-400">Lokasi GPS</p><p className="mt-1 truncate font-semibold">{record.gps}</p></div></div></article>
}

const reportDateRange = {
  startDate: '2026-07-01',
  endDate: '2026-07-31',
}

function getDownloadName(contentDisposition) {
  const filename = contentDisposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)?.[1]?.replace(/['"]/g, '')
  return filename || 'laporan-presensi.csv'
}

export default function AttendanceReportPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Semua Status')
  const [filterOpen, setFilterOpen] = useState(false)
  const [report, setReport] = useState({ items: [], meta: {} })
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [downloadError, setDownloadError] = useState('')

  const apiStatus = status === 'Semua Status' ? undefined : status.toLowerCase()

  const requestParams = useMemo(() => ({
    start_date: reportDateRange.startDate,
    end_date: reportDateRange.endDate,
    ...(apiStatus ? { status: apiStatus } : {}),
    page,
    limit: 10,
  }), [apiStatus, page])

  const redirectToLogin = useCallback(() => {
    authStorage.clearSession()
    navigate(ROUTES.login, { replace: true })
  }, [navigate])

  const loadReport = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      setReport(await getAttendanceReport(requestParams))
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        redirectToLogin()
        return
      }

      setErrorMessage(error.response?.data?.message || error.message || 'Gagal memuat laporan presensi.')
    } finally {
      setIsLoading(false)
    }
  }, [redirectToLogin, requestParams])

  useEffect(() => {
    // The initial API request intentionally populates the page state after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReport()
  }, [loadReport])

  const rows = useMemo(() => report.items.map(normalizeRecord).filter((record) => {
    const term = query.trim().toLowerCase()
    return !term || [record.name, record.division, record.position, record.status].some((value) => String(value).toLowerCase().includes(term))
  }), [query, report.items])

  const handleStatusChange = (nextStatus) => {
    setStatus(nextStatus)
    setPage(1)
    setFilterOpen(false)
  }

  const download = async () => {
    setIsDownloading(true)
    setDownloadError('')

    try {
      const { file, contentDisposition } = await downloadAttendanceReport({
        start_date: reportDateRange.startDate,
        end_date: reportDateRange.endDate,
        ...(apiStatus ? { status: apiStatus } : {}),
      })
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = getDownloadName(contentDisposition)
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        redirectToLogin()
        return
      }

      setDownloadError(error.response?.data?.message || 'Gagal mengunduh laporan presensi.')
    } finally {
      setIsDownloading(false)
    }
  }

  const currentPage = report.meta?.page || report.meta?.current_page || page
  const totalPages = report.meta?.total_pages || report.meta?.last_page || Math.ceil((report.meta?.total || 0) / (report.meta?.limit || 10)) || 1

  return <div><header className="mb-8"><h2 className="text-[26px] font-bold leading-none text-slate-900">Laporan Presensi</h2><p className="mt-2 text-[14px] text-slate-500">Lihat dan ekspor laporan presensi karyawan</p></header><section className="rounded-2xl bg-[#EF2427] p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row"><label className="flex h-[52px] flex-1 items-center rounded-full bg-white px-6"><Search size={21} className="shrink-0 text-black" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="ml-4 w-full bg-transparent text-[14px] outline-none placeholder:text-slate-800" placeholder="Cari nama, divisi, jabatan, atau status..." /></label><div className="relative"><button type="button" onClick={() => setFilterOpen((open) => !open)} className="flex h-[52px] w-full items-center justify-between rounded-full bg-white px-6 text-[13px] font-medium text-slate-700 sm:w-[185px]">{status}<ChevronDown size={18} className={cn('transition-transform', filterOpen && 'rotate-180')} /></button>{filterOpen && <div className="absolute right-0 z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl sm:w-[185px]">{filters.map((item) => <button key={item} type="button" onClick={() => handleStatusChange(item)} className={cn('block w-full rounded-lg px-4 py-2 text-left text-[13px] hover:bg-red-50', status === item && 'bg-red-50 text-[#E62727]')}>{item}</button>)}</div>}</div><button type="button" onClick={download} disabled={isDownloading} className="flex h-[52px] items-center justify-center gap-3 rounded-full bg-white px-7 text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-[195px]"><Download size={18} />{isDownloading ? 'Mengunduh...' : 'Unduh Laporan'}</button></div>{downloadError && <p role="alert" className="mt-3 text-center text-[13px] text-white">{downloadError}</p>}</section><section className="mt-9 overflow-hidden rounded-2xl border border-slate-200 bg-white"><h3 className="border-b border-slate-200 px-5 py-5 text-[22px] font-bold text-slate-900 sm:px-6">Data Presensi Karyawan</h3>{errorMessage ? <div className="p-10 text-center"><p className="text-sm text-[#EF2427]">{errorMessage}</p><button type="button" onClick={loadReport} className="mt-3 text-sm font-semibold text-[#1E93AB]">Coba lagi</button></div> : <><div className="sm:hidden">{isLoading ? <p className="p-8 text-center text-sm text-slate-500">Memuat data presensi...</p> : rows.length ? rows.map((record, index) => <RecordCell key={record.id || index} record={record} />) : <p className="p-8 text-center text-sm text-slate-500">Data presensi tidak ditemukan.</p>}</div><div className="hidden overflow-x-auto sm:block"><table className="w-full min-w-[850px] text-left"><thead className="bg-slate-50 text-[13px] font-bold uppercase text-slate-500"><tr><th className="px-6 py-4">Karyawan</th><th className="px-5 py-4">Divisi/Jabatan</th><th className="px-5 py-4">Jam Masuk</th><th className="px-5 py-4">Jam Keluar</th><th className="px-5 py-4">Lokasi GPS</th><th className="px-5 py-4 text-center">Status</th></tr></thead><tbody>{isLoading ? <tr><td colSpan="6" className="p-10 text-center text-sm text-slate-500">Memuat data presensi...</td></tr> : rows.length ? rows.map((record, index) => <tr key={record.id || index} className="border-t border-slate-200 text-[13px] text-black"><td className="px-6 py-3.5 font-semibold">{record.name}</td><td className="px-5 py-2"><p className="font-semibold">{record.division}</p><p className="mt-0.5 text-[11px] text-slate-400">{record.position}</p></td><td className="px-5 py-3.5 font-semibold">{record.checkIn}</td><td className="px-5 py-3.5 font-semibold">{record.checkOut}</td><td className="px-5 py-3.5 font-semibold">{record.gps}</td><td className="px-5 py-3.5 text-center"><StatusBadge status={record.status} /></td></tr>) : <tr><td colSpan="6" className="p-10 text-center text-sm text-slate-500">Data presensi tidak ditemukan.</td></tr>}</tbody></table></div>{totalPages > 1 && <div className="flex items-center justify-center gap-4 border-t border-slate-200 px-5 py-4 text-sm"><button type="button" onClick={() => setPage((current) => current - 1)} disabled={currentPage <= 1 || isLoading} className="font-semibold text-[#1E93AB] disabled:cursor-not-allowed disabled:opacity-40">Sebelumnya</button><span className="text-slate-500">Halaman {currentPage} dari {totalPages}</span><button type="button" onClick={() => setPage((current) => current + 1)} disabled={currentPage >= totalPages || isLoading} className="font-semibold text-[#1E93AB] disabled:cursor-not-allowed disabled:opacity-40">Berikutnya</button></div>}</>}</section></div>
}
