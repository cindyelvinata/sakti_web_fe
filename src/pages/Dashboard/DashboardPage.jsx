import StatisticCard from '@/components/cards/StatisticCard'
import ChartCard from '@/components/cards/ChartCard'
import HorizontalBarChart from '@/components/charts/HorizontalBarChart'
import VerticalBarChart from '@/components/charts/VerticalBarChart'
import LeaveBarChart from '@/components/charts/LeaveBarChart'
import DashboardHeader from './DashboardHeader'
import { attendanceInData,attendanceOutData,departmentData,leaveData,statistics } from '@/data/dashboardData'
export default function DashboardPage(){return <><DashboardHeader/><section className="grid grid-cols-1 justify-items-center gap-[23px] sm:grid-cols-2 md:justify-items-start xl:grid-cols-5">{statistics.map(item=><StatisticCard key={item.label} {...item}/>)}</section><section className="mt-[28px] grid grid-cols-1 gap-[28px] xl:grid-cols-2"><ChartCard title="Total Karyawan per Departemen"><HorizontalBarChart data={departmentData}/></ChartCard><ChartCard title="Presensi Masuk berdasarkan Status"><VerticalBarChart data={attendanceInData} series={[{key:'tepatWaktu',label:'Tepat Waktu'},{key:'terlambat',label:'Terlambat'},{key:'belumPresensi',label:'Belum Presensi'}]}/></ChartCard><ChartCard title="Presensi Keluar berdasarkan Status"><VerticalBarChart data={attendanceOutData} series={[{key:'presensiKeluar',label:'Presensi Keluar'},{key:'presensiLembur',label:'Presensi Lembur'},{key:'belumPresensi',label:'Belum Presensi'}]}/></ChartCard><ChartCard title="Total Pengajuan Cuti"><LeaveBarChart data={leaveData}/></ChartCard></section></>}



