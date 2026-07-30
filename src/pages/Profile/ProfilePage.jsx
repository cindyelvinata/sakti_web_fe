import personIcon from '@/assets/icons/person_icons.svg'
import emailIcon from '@/assets/icons/email_icons.svg'
import callIcon from '@/assets/icons/call_icons.svg'
import bagIcon from '@/assets/icons/bag_icons.svg'

const details = [
  { label: 'Nama', value: 'Wijaya Kusuma', icon: personIcon, iconAlt: 'Ikon pengguna', iconClassName: 'size-[21px] icon-profile-detail' },
  { label: 'Email', value: 'wijayakusuma@gmail.com', icon: emailIcon, iconAlt: 'Ikon email', iconClassName: 'size-6 object-contain icon-profile-detail' },
  { label: 'Nomor Telepon', value: '+62 812-3456-7890', icon: callIcon, iconAlt: 'Ikon telepon', iconClassName: 'size-6' },
  { label: 'Jabatan', value: 'HR Manager', icon: bagIcon, iconAlt: 'Ikon jabatan', iconClassName: 'size-[26px]' },
]

export default function ProfilePage() {
  return <div className="max-w-[1000px]">
    <h2 className="text-[26px] font-bold leading-none text-slate-950">Informasi Profil</h2>
    <section className="mx-auto mt-7 max-w-[980px]">
      <div className="text-center"><div className="mx-auto grid size-[200px] place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#77B1DB] to-[#244A74]"><img src={personIcon} alt="Foto profil Admin" className="size-[94px] brightness-0 invert"/></div><h3 className="mt-6 text-2xl font-bold text-black">Admin</h3><p className="mt-1 text-lg text-slate-500">Administrator</p></div>
      <div className="mt-7 space-y-7">{details.map(({ label, value, icon, iconAlt, iconClassName }) => <article key={label} className="flex min-h-[90px] items-center gap-7 rounded-2xl border border-slate-300 bg-[#FCFDFE] px-6 py-4"><div className="grid size-[54px] shrink-0 place-items-center rounded-lg bg-[#B7DFE9]"><img src={icon} alt={iconAlt} className={iconClassName}/></div><div><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-[15px] font-semibold text-black">{value}</p></div></article>)}</div>
    </section>
  </div>
}
