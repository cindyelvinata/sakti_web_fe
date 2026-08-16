import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatisticCard from '@/components/cards/StatisticCard'
import ChartCard from '@/components/cards/ChartCard'
import HorizontalBarChart from '@/components/charts/HorizontalBarChart'
import VerticalBarChart from '@/components/charts/VerticalBarChart'
import LeaveBarChart from '@/components/charts/LeaveBarChart'
import { authStorage } from '@/lib/authStorage'
import { ROUTES } from '@/constants/routes'
import { getAttendanceReport } from '@/services/attendanceService'
import { getDashboard } from '@/services/dashboardService'
import { getLeaveReport } from '@/services/leaveReportService'
import DashboardHeader from './DashboardHeader'

const attendanceInSeries = [
  { key: 'tepatWaktu', label: 'Tepat Waktu' },
  { key: 'terlambat', label: 'Terlambat' },
  { key: 'belumPresensi', label: 'Belum Presensi' },
]

const attendanceOutSeries = [
  { key: 'presensiKeluar', label: 'Presensi Keluar' },
  { key: 'presensiLembur', label: 'Presensi Lembur' },
  { key: 'belumPresensi', label: 'Belum Presensi' },
]
const weekdays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const workdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum']
const attendancePeriods = [
  { label: 'Minggu Ini', value: 'this_week', weekOffset: 0 },
  { label: 'Minggu Lalu', value: 'last_week', weekOffset: 1 },
  { label: '2 Minggu Lalu', value: 'two_weeks_ago', weekOffset: 2 },
]
const customAttendancePeriod = { label: 'Pilih Tanggal', value: 'custom' }
const leaveStatuses = ['Disetujui', 'Ditolak', 'Menunggu', 'Dibatalkan']
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const emptyAttendanceIn = () => workdays.map((day) => ({ day, tepatWaktu: 0, terlambat: 0, belumPresensi: 0 }))
const emptyAttendanceOut = () => workdays.map((day) => ({ day, presensiKeluar: 0, presensiLembur: 0, belumPresensi: 0 }))
const emptyLeaveData = () => leaveStatuses.map((status) => ({ status, total: 0 }))
const statusKey = (value) => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')

function groupRecords(records, field, labelKey) {
  if (!Array.isArray(records)) return []

  const grouped = records.reduce((result, record) => {
    const value = record?.[field] || 'Tidak diketahui'
    result[value] = (result[value] || 0) + 1
    return result
  }, {})

  return Object.entries(grouped).map(([label, total]) => ({ [labelKey]: label, total }))
}

function normalizeAggregates(records, sourceLabel, labelKey) {
  if (!Array.isArray(records)) return []

  return records.map((record) => ({
    [labelKey]: record?.[sourceLabel] || record?.[labelKey] || 'Tidak diketahui',
    total: Number(record?.total ?? record?.jumlah ?? 0),
  }))
}

function parseLocalDate(value) {
  const [, year, month, day] = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/) || []
  return year && month && day ? new Date(year, month - 1, day) : null
}

function dateParam(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function getMonday(date) {
  const day = date.getDay()
  const offset = day === 0 ? -6 : 1 - day
  return addDays(date, offset)
}

function getAttendanceRange(period) {
  const selected = attendancePeriods.find((item) => item.value === period) ?? attendancePeriods[0]
  const monday = addDays(getMonday(new Date()), selected.weekOffset * -7)
  return { startDate: monday, endDate: addDays(monday, 4) }
}

function isCurrentMonthRange({ startDate, endDate }) {
  const current = new Date()
  return startDate.getFullYear() === current.getFullYear()
    && endDate.getFullYear() === current.getFullYear()
    && startDate.getMonth() === current.getMonth()
    && endDate.getMonth() === current.getMonth()
}

function initialAttendancePeriod() {
  return isCurrentMonthRange(getAttendanceRange('this_week')) ? 'this_week' : 'custom'
}

function dateRangeLabel({ startDate, endDate }) {
  const dayFormatter = new Intl.DateTimeFormat('id-ID', { day: '2-digit' })
  const monthYearFormatter = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' })

  if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
    return `${dayFormatter.format(startDate)}-${dayFormatter.format(endDate)} ${monthYearFormatter.format(endDate)}`
  }

  const fullFormatter = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  return `${fullFormatter.format(startDate)} - ${fullFormatter.format(endDate)}`
}

function getWorkweekRange(date) {
  const monday = getMonday(date)
  return { startDate: monday, endDate: addDays(monday, 4) }
}

function getCustomAttendanceRange(value) {
  const date = parseLocalDate(value)
  return getWorkweekRange(date || new Date())
}

function isRecordInRange(record, { startDate, endDate }) {
  const date = parseLocalDate(record?.tanggal)
  return date ? date >= startDate && date <= endDate : false
}

function isLeaveRecordInRange(record, { startDate, endDate }) {
  const date = parseLocalDate(record?.tanggal_mulai || record?.tanggal || record?.created_at)
  return date ? date >= startDate && date <= endDate : false
}

function totalPages(meta) {
  return Math.max(1, Number(meta?.total_pages ?? meta?.totalPages ?? meta?.last_page ?? 1) || 1)
}

function monthValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getMonthRange(value) {
  const [year, month] = String(value).split('-').map(Number)
  const startDate = new Date(year, month - 1, 1)
  return { startDate, endDate: new Date(year, month, 0) }
}

function getLeaveMonthOptions() {
  const current = new Date()
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(current.getFullYear(), current.getMonth() - index, 1)
    return { value: monthValue(date), label: `${monthNames[date.getMonth()]} ${date.getFullYear()}` }
  })
}

function recordDay(record) {
  const date = parseLocalDate(record?.tanggal)
  return date && !Number.isNaN(date.getTime()) ? weekdays[date.getDay()] : null
}

function aggregateAttendance(records) {
  const inData = emptyAttendanceIn()
  const outData = emptyAttendanceOut()
  const inByDay = new Map(inData.map((item) => [item.day, item]))
  const outByDay = new Map(outData.map((item) => [item.day, item]))

  records.forEach((record) => {
    const day = recordDay(record)
    const inItem = inByDay.get(day)
    const outItem = outByDay.get(day)

    if (!inItem || !outItem) return

    const checkInStatus = statusKey(record.status_masuk || record.jenis_cuti)
    const checkOutStatus = statusKey(record.status_keluar || record.jenis_cuti)

    if (checkInStatus === 'terlambat') inItem.terlambat += 1
    else if (checkInStatus === 'belum_presensi' || (!record.jam_masuk && !record.jenis_cuti)) inItem.belumPresensi += 1
    else if (record.jam_masuk || checkInStatus === 'tepat_waktu') inItem.tepatWaktu += 1

    if (checkOutStatus === 'lembur' || checkOutStatus === 'presensi_lembur') outItem.presensiLembur += 1
    else if (checkOutStatus === 'belum_presensi' || (!record.jam_keluar && !record.jenis_cuti)) outItem.belumPresensi += 1
    else if (record.jam_keluar || checkOutStatus === 'presensi_keluar' || checkOutStatus === 'keluar') outItem.presensiKeluar += 1
  })

  return { inData, outData }
}

function aggregateLeave(records) {
  const data = emptyLeaveData()
  const byStatus = new Map(data.map((item) => [statusKey(item.status), item]))

  records.forEach((record) => {
    const item = byStatus.get(statusKey(record.status))
    if (item) item.total += 1
  })

  return data
}

function attendanceKpi(records) {
  return records.reduce((result, record) => {
    const checkInStatus = statusKey(record.status_masuk || record.jenis_cuti)
    const checkOutStatus = statusKey(record.status_keluar || record.jenis_cuti)

    if (checkInStatus === 'terlambat') result.terlambat += 1
    if (checkOutStatus === 'lembur' || checkOutStatus === 'presensi_lembur') result.lembur += 1

    return result
  }, { terlambat: 0, lembur: 0 })
}

function approvedLeaveTotal(records) {
  return records.filter((record) => statusKey(record.status) === 'disetujui').length
}

function AttendancePeriodFilter({ value, options, customDate, rangeLabel, onChange, onCustomDateChange }) {
  const isCustom = value === customAttendancePeriod.value

  return <div className="flex min-w-0 flex-col gap-2 sm:items-end">
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 max-w-full rounded-full border border-slate-200 bg-white px-4 text-[12px] font-medium text-slate-700 outline-none focus:border-[#1E93AB]">
      {options.map((period) => <option key={period.value} value={period.value}>{period.label}</option>)}
    </select>
    {isCustom ? <input type="date" value={customDate} onChange={(event) => onCustomDateChange(event.target.value)} className="h-9 min-w-0 rounded-full border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 outline-none focus:border-[#1E93AB]" /> : null}
    <span className="max-w-full truncate text-[11px] font-medium text-slate-500">{rangeLabel}</span>
  </div>
}

function MonthPeriodFilter({ value, options, onChange }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 max-w-full rounded-full border border-slate-200 bg-white px-4 text-[12px] font-medium text-slate-700 outline-none focus:border-[#1E93AB]">
    {options.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
  </select>
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [attendancePeriod, setAttendancePeriod] = useState(initialAttendancePeriod)
  const [customAttendanceDate, setCustomAttendanceDate] = useState(() => dateParam(new Date()))
  const [leaveMonth, setLeaveMonth] = useState(() => monthValue(new Date()))
  const [attendanceData, setAttendanceData] = useState(() => ({ inData: emptyAttendanceIn(), outData: emptyAttendanceOut() }))
  const [leavePeriodData, setLeavePeriodData] = useState(() => emptyLeaveData())
  const [attendancePeriodKpi, setAttendancePeriodKpi] = useState({ terlambat: 0, lembur: 0 })
  const [leavePeriodKpi, setLeavePeriodKpi] = useState({ disetujui: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(true)
  const [isLeaveLoading, setIsLeaveLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState('')
  const [attendanceError, setAttendanceError] = useState('')
  const [leaveError, setLeaveError] = useState('')
  const availableAttendancePeriods = useMemo(() => [
    ...attendancePeriods
      .map((period) => ({ ...period, range: getAttendanceRange(period.value) }))
      .filter((period) => isCurrentMonthRange(period.range))
      .map((period) => ({ value: period.value, label: period.label })),
    customAttendancePeriod,
  ], [])
  const attendanceRange = useMemo(() => {
    if (attendancePeriod === customAttendancePeriod.value) return getCustomAttendanceRange(customAttendanceDate)
    return getAttendanceRange(attendancePeriod)
  }, [attendancePeriod, customAttendanceDate])
  const leaveMonthOptions = useMemo(() => getLeaveMonthOptions(), [])
  const leaveRange = useMemo(() => getMonthRange(leaveMonth), [leaveMonth])

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setDashboardError('')

    try {
      setDashboard(await getDashboard())
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        authStorage.clearSession()
        navigate(ROUTES.login, { replace: true })
        return
      }

      setDashboardError(error.response?.data?.message || error.message || 'Gagal memuat data dashboard.')
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  const loadAttendance = useCallback(async () => {
    setIsAttendanceLoading(true)
    setAttendanceError('')

    try {
      const params = { limit: 100, start_date: dateParam(attendanceRange.startDate), end_date: dateParam(attendanceRange.endDate) }
      const firstPage = await getAttendanceReport({ ...params, page: 1 })
      const pageCount = totalPages(firstPage.meta)
      const otherPages = pageCount > 1
        ? await Promise.all(Array.from({ length: pageCount - 1 }, (_, index) => getAttendanceReport({ ...params, page: index + 2 })))
        : []
      const records = [firstPage, ...otherPages].flatMap((report) => report.items)
      const periodRecords = records.filter((record) => isRecordInRange(record, attendanceRange))

      setAttendanceData(aggregateAttendance(periodRecords))
      setAttendancePeriodKpi(attendanceKpi(periodRecords))
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        authStorage.clearSession()
        navigate(ROUTES.login, { replace: true })
        return
      }

      setAttendanceError(error.response?.data?.message || error.message || 'Gagal memuat data presensi dashboard.')
    } finally {
      setIsAttendanceLoading(false)
    }
  }, [attendanceRange, navigate])

  const loadLeave = useCallback(async () => {
    setIsLeaveLoading(true)
    setLeaveError('')

    try {
      const params = { limit: 100, start_date: dateParam(leaveRange.startDate), end_date: dateParam(leaveRange.endDate) }
      const firstPage = await getLeaveReport({ ...params, page: 1 })
      const pageCount = totalPages(firstPage.meta)
      const otherPages = pageCount > 1
        ? await Promise.all(Array.from({ length: pageCount - 1 }, (_, index) => getLeaveReport({ ...params, page: index + 2 })))
        : []
      const records = [firstPage, ...otherPages].flatMap((report) => report.items)
      const periodRecords = records.filter((record) => isLeaveRecordInRange(record, leaveRange))

      setLeavePeriodData(aggregateLeave(periodRecords))
      setLeavePeriodKpi({ disetujui: approvedLeaveTotal(periodRecords) })
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        authStorage.clearSession()
        navigate(ROUTES.login, { replace: true })
        return
      }

      setLeaveError(error.response?.data?.message || error.message || 'Gagal memuat data cuti dashboard.')
    } finally {
      setIsLeaveLoading(false)
    }
  }, [leaveRange, navigate])

  useEffect(() => {
    // The initial API request intentionally populates the dashboard after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    // Attendance is scoped to the selected Monday-Friday period.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAttendance()
  }, [loadAttendance])

  useEffect(() => {
    // Leave chart is scoped to the selected calendar month.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLeave()
  }, [loadLeave])

  const statistics = dashboard ? [
    { label: 'Total Karyawan', value: dashboard.total_karyawan },
    { label: 'Karyawan Aktif', value: dashboard.karyawan_aktif },
    { label: 'Total Terlambat', value: isAttendanceLoading ? '...' : attendancePeriodKpi.terlambat },
    { label: 'Total Lembur', value: isAttendanceLoading ? '...' : attendancePeriodKpi.lembur },
    { label: 'Total Cuti Disetujui', value: isLeaveLoading ? '...' : leavePeriodKpi.disetujui },
  ] : []

  const departmentData = dashboard?.karyawan_per_dept
    ? normalizeAggregates(dashboard.karyawan_per_dept, 'departemen', 'name')
    : groupRecords(dashboard?.karyawan, 'unit', 'name')
  const attendanceInData = attendanceData.inData
  const attendanceOutData = attendanceData.outData
  const leaveData = leavePeriodData
  const attendanceRangeLabel = dateRangeLabel(attendanceRange)
  const renderAttendancePeriodFilter = () => <AttendancePeriodFilter
    value={attendancePeriod}
    options={availableAttendancePeriods}
    customDate={customAttendanceDate}
    rangeLabel={attendanceRangeLabel}
    onChange={setAttendancePeriod}
    onCustomDateChange={setCustomAttendanceDate}
  />
  const leavePeriodFilter = <MonthPeriodFilter value={leaveMonth} options={leaveMonthOptions} onChange={setLeaveMonth} />

  return <>
    <DashboardHeader />

    <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {isLoading ? Array.from({ length: 5 }, (_, index) => <StatisticCard key={index} label="Memuat data" value="..." />) : dashboardError ? <div className="rounded-[14px] border border-red-100 bg-red-50 p-5 text-sm text-[#EF2427] sm:col-span-2 lg:col-span-3 xl:col-span-5"><p>{dashboardError}</p><button type="button" onClick={loadDashboard} className="mt-3 font-semibold text-[#1E93AB]">Coba lagi</button></div> : statistics.map((item) => <StatisticCard key={item.label} {...item} />)}
    </section>

    <section className="mt-6 grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
      <ChartCard title="Total Karyawan per Departemen" isLoading={isLoading} isEmpty={!isLoading && !dashboardError && departmentData.length === 0} errorMessage={dashboardError} onRetry={loadDashboard}><HorizontalBarChart data={departmentData} /></ChartCard>
      <ChartCard title="Total Pengajuan Cuti" isLoading={isLeaveLoading} isEmpty={false} errorMessage={leaveError} onRetry={loadLeave} action={leavePeriodFilter}><LeaveBarChart data={leaveData} /></ChartCard>
      <ChartCard title="Presensi Masuk berdasarkan Status" isLoading={isAttendanceLoading} isEmpty={false} errorMessage={attendanceError} onRetry={loadAttendance} action={renderAttendancePeriodFilter()}><VerticalBarChart data={attendanceInData} series={attendanceInSeries} /></ChartCard>
      <ChartCard title="Presensi Keluar berdasarkan Status" isLoading={isAttendanceLoading} isEmpty={false} errorMessage={attendanceError} onRetry={loadAttendance} action={renderAttendancePeriodFilter()}><VerticalBarChart data={attendanceOutData} series={attendanceOutSeries} /></ChartCard>
    </section>
  </>
}
