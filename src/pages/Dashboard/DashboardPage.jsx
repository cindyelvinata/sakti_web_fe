import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatisticCard from '@/components/cards/StatisticCard'
import ChartCard from '@/components/cards/ChartCard'
import HorizontalBarChart from '@/components/charts/HorizontalBarChart'
import VerticalBarChart from '@/components/charts/VerticalBarChart'
import LeaveBarChart from '@/components/charts/LeaveBarChart'
import { authStorage } from '@/lib/authStorage'
import { ROUTES } from '@/constants/routes'
import { getDashboard } from '@/services/dashboardService'
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

export default function DashboardPage() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      setDashboard(await getDashboard())
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        authStorage.clearSession()
        navigate(ROUTES.login, { replace: true })
        return
      }

      setErrorMessage(error.response?.data?.message || error.message || 'Gagal memuat data dashboard.')
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    // The initial API request intentionally populates the dashboard after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard()
  }, [loadDashboard])

  const statistics = dashboard ? [
    { label: 'Total Karyawan', value: dashboard.total_karyawan },
    { label: 'Karyawan Aktif', value: dashboard.karyawan_aktif },
    { label: 'Total Terlambat', value: dashboard.total_terlambat },
    { label: 'Total Lembur', value: dashboard.total_lembur },
    { label: 'Total Cuti Disetujui', value: dashboard.total_cuti_disetujui },
  ] : []

  const departmentData = dashboard?.karyawan_per_dept
    ? normalizeAggregates(dashboard.karyawan_per_dept, 'departemen', 'name')
    : groupRecords(dashboard?.karyawan, 'unit', 'name')
  const attendanceInData = dashboard?.attendance_in_data ?? []
  const attendanceOutData = dashboard?.attendance_out_data ?? []
  const leaveData = dashboard?.total_pengajuan_cuti
    ? normalizeAggregates(dashboard.total_pengajuan_cuti, 'status', 'status')
    : groupRecords(dashboard?.pengajuan_cuti, 'status', 'status')

  return <>
    <DashboardHeader />

    {errorMessage ? <section className="grid min-h-[300px] place-items-center"><div className="text-center"><p className="text-sm text-[#EF2427]">{errorMessage}</p><button type="button" onClick={loadDashboard} className="mt-4 text-sm font-semibold text-[#1E93AB]">Coba lagi</button></div></section> : <>
      <section className="grid grid-cols-1 justify-items-center gap-[23px] sm:grid-cols-2 md:justify-items-start xl:grid-cols-5">
        {isLoading ? Array.from({ length: 5 }, (_, index) => <StatisticCard key={index} label="Memuat data" value="..." />) : statistics.map((item) => <StatisticCard key={item.label} {...item} />)}
      </section>

      <section className="mt-[28px] grid grid-cols-1 gap-[28px] xl:grid-cols-2">
        <ChartCard title="Total Karyawan per Departemen" isLoading={isLoading} isEmpty={!isLoading && departmentData.length === 0}><HorizontalBarChart data={departmentData} /></ChartCard>
        <ChartCard title="Presensi Masuk berdasarkan Status" isLoading={isLoading} isEmpty={!isLoading && attendanceInData.length === 0}><VerticalBarChart data={attendanceInData} series={attendanceInSeries} /></ChartCard>
        <ChartCard title="Presensi Keluar berdasarkan Status" isLoading={isLoading} isEmpty={!isLoading && attendanceOutData.length === 0}><VerticalBarChart data={attendanceOutData} series={attendanceOutSeries} /></ChartCard>
        <ChartCard title="Total Pengajuan Cuti" isLoading={isLoading} isEmpty={!isLoading && leaveData.length === 0}><LeaveBarChart data={leaveData} /></ChartCard>
      </section>
    </>}
  </>
}
