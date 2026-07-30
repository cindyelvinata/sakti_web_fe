import { useRef, useState } from 'react'
import { Building2, ChevronDown, ImageUp, Pencil, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import penIcon from '@/assets/icons/pen.svg'

const initialConfiguration = {
  officeName: 'Koperasi Pegawai TELKOM Malang', radius: '500 m', checkIn: '08:00', checkInLimit: '08:30',
  checkOut: '17:00', checkOutLimit: '17:30', latitude: '-6.20000', longitude: '106.816666',
}

const initialHolidays = [
  { id: 1, date: '19 Maret 2026', name: 'Hari Suci Nyepi', type: 'Nasional', active: true },
  { id: 2, date: '27 Mei 2026', name: 'Idul Adha 1447 H', type: 'Nasional', active: true },
  { id: 3, date: '17 Agustus 2026', name: 'HUT RI ke-61', type: 'Nasional', active: true },
  { id: 4, date: '23 Maret 2026', name: 'Cuti Bersama Idul Fitri', type: 'Cuti Bersama', active: true },
  { id: 5, date: '23 Maret 2026', name: 'Cuti Bersama Idul Fitri', type: 'Cuti Bersama', active: true },
]

const fields = [
  ['officeName', 'Nama Kantor'], ['radius', 'Batas Radius'], ['checkIn', 'Jam Masuk'], ['checkInLimit', 'Batas Jam Masuk'],
  ['checkOut', 'Jam Keluar'], ['checkOutLimit', 'Batas Jam Keluar'], ['latitude', 'Latitude'], ['longitude', 'Longitude'],
]

function Modal({ title, children, onClose }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" onMouseDown={onClose}>
    <section className="w-full max-w-[530px] rounded-2xl bg-white p-6 shadow-2xl sm:p-8" onMouseDown={event => event.stopPropagation()}>
      <div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-bold text-black">{title}</h2><button type="button" onClick={onClose} aria-label="Tutup"><X size={20}/></button></div>
      {children}
    </section>
  </div>
}

function HolidayForm({ holiday, onCancel, onSave }) {
  const [form, setForm] = useState(holiday)
  const [dateParts, setDateParts] = useState({ day: '', month: '', year: '' })
  const monthRef = useRef(null)
  const yearRef = useRef(null)
  const setField = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const updateDatePart = (key, value, nextRef) => { const digits = value.replace(/\D/g, '').slice(0, 2); setDateParts(current => ({ ...current, [key]: digits })); if (digits.length === 2 && nextRef) nextRef.current?.focus() }
  const submit = event => { event.preventDefault(); onSave({ ...form, date: holiday.id ? form.date : `${dateParts.day}/${dateParts.month}/${dateParts.year}` }) }
  return <form onSubmit={submit} className="space-y-4">
    {holiday.id ? <label className="block text-sm font-semibold text-slate-800">Tanggal<input required type="text" value={form.date} onChange={event => setField('date', event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-400 px-4 text-sm outline-none focus:border-[#EF2427]" /></label> : <fieldset><legend className="text-sm font-semibold text-slate-800">Tanggal</legend><div className="mt-2 flex h-12 items-center rounded-xl border border-slate-400 px-4"><input required inputMode="numeric" value={dateParts.day} onChange={event => updateDatePart('day', event.target.value, monthRef)} placeholder="DD" aria-label="Tanggal" className="w-10 bg-transparent text-center text-sm outline-none placeholder:text-slate-400"/><span className="text-slate-400">/</span><input required ref={monthRef} inputMode="numeric" value={dateParts.month} onChange={event => updateDatePart('month', event.target.value, yearRef)} placeholder="MM" aria-label="Bulan" className="w-10 bg-transparent text-center text-sm outline-none placeholder:text-slate-400"/><span className="text-slate-400">/</span><input required ref={yearRef} inputMode="numeric" value={dateParts.year} onChange={event => updateDatePart('year', event.target.value)} placeholder="YY" aria-label="Tahun" className="w-10 bg-transparent text-center text-sm outline-none placeholder:text-slate-400"/></div></fieldset>}
    <label className="block text-sm font-semibold text-slate-800">Nama Hari Libur<input required type="text" value={form.name} onChange={event => setField('name', event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-400 px-4 text-sm outline-none focus:border-[#EF2427]" /></label>
    <label className="block text-sm font-semibold text-slate-800">Jenis Cuti<span className="relative mt-2 block"><select value={form.type} onChange={event => setField('type', event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-slate-400 px-4 pr-14 text-sm outline-none focus:border-[#EF2427]"><option>Nasional</option><option>Cuti Bersama</option></select><ChevronDown size={18} className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-500"/></span></label>
    <label className="flex items-center justify-between pt-1 text-sm font-semibold text-slate-800">Aktif<button type="button" role="switch" aria-checked={form.active} onClick={() => setField('active', !form.active)} className={cn('relative h-6 w-11 rounded-full transition', form.active ? 'bg-[#EF2427]' : 'bg-slate-300')}><span className={cn('absolute top-0.5 size-5 rounded-full bg-white transition', form.active ? 'left-[22px]' : 'left-0.5')} /></button></label>
    <div className="flex justify-center gap-4 pt-4"><button className="h-12 min-w-40 rounded-full bg-[#EF2427] px-7 text-sm font-semibold text-white">Simpan</button><button type="button" onClick={onCancel} className="h-12 min-w-40 rounded-full border border-red-200 bg-red-50 px-7 text-sm font-semibold text-[#EF2427]">Batal</button></div>
  </form>
}

export default function SettingsPage() {
  const [tab, setTab] = useState('configuration')
  const [configuration, setConfiguration] = useState(initialConfiguration)
  const [draft, setDraft] = useState(initialConfiguration)
  const [editingConfiguration, setEditingConfiguration] = useState(false)
  const [logoName, setLogoName] = useState('Logo belum dipilih')
  const [logoError, setLogoError] = useState('')
  const [holidays, setHolidays] = useState(initialHolidays)
  const [holidayForm, setHolidayForm] = useState(null)
  const saveConfiguration = () => { setConfiguration(draft); setEditingConfiguration(false) }
  const saveHoliday = holiday => { setHolidays(items => holiday.id ? items.map(item => item.id === holiday.id ? holiday : item) : [...items, { ...holiday, id: Date.now() }]); setHolidayForm(null) }
  const selectLogo = event => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 2 * 1024 * 1024) { setLogoError('Ukuran file maksimal 2 MB.'); event.target.value = ''; return }; setLogoName(file.name); setLogoError('') }

  return <div className="max-w-[1120px]">
    <header className="mb-5"><h2 className="text-[26px] font-bold leading-none text-slate-950">Pengaturan</h2><p className="mt-2 text-sm text-slate-500">Kelola hari libur dan konfigurasi kerja sebagai acuan sistem</p></header>
    <div className="grid grid-cols-2 rounded-2xl bg-red-100 p-1 text-sm font-semibold"><button type="button" onClick={() => setTab('configuration')} className={cn('rounded-xl py-3 transition', tab === 'configuration' ? 'bg-red-100 text-[#EF2427]' : 'text-red-300')}>Konfigurasi Kerja</button><button type="button" onClick={() => setTab('holiday')} className={cn('rounded-xl py-3 transition', tab === 'holiday' ? 'bg-red-100 text-[#EF2427]' : 'text-red-300')}>Hari Libur</button></div>

    {tab === 'configuration' ? <section className="pt-6">
      {!editingConfiguration && <div className="mb-5 flex justify-end"><button type="button" onClick={() => { setDraft(configuration); setEditingConfiguration(true) }} className="flex h-11 items-center gap-3 rounded-full bg-[#EF2427] px-7 text-sm font-semibold text-white"><img src={penIcon} alt="" className="size-4 brightness-0 invert"/>Edit Konfigurasi</button></div>}
      <form onSubmit={event => { event.preventDefault(); saveConfiguration() }}><div className={cn('rounded-2xl border bg-[#FCFDFE] p-5 sm:p-6', editingConfiguration ? 'border-slate-400' : 'border-slate-200')}><div className="flex flex-wrap items-center gap-5 border-b border-slate-200 pb-5">{editingConfiguration ? <><div className="grid size-[88px] place-items-center rounded-2xl border-2 border-dashed border-[#1E93AB] bg-white text-[#1E93AB]"><ImageUp size={31}/></div><div className="min-w-[230px] flex-1"><p className="font-semibold">Logo Kantor</p><p className="mt-1 text-sm text-slate-500">Format: PNG, JPG, SVG. Maks 2 MB.</p><p className={cn('mt-1 text-xs', logoError ? 'text-[#EF2427]' : 'text-[#1E93AB]')}>{logoError || logoName}</p></div><label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#1E93AB] px-5 text-sm font-medium text-[#1E93AB] transition hover:bg-[#EDF9FC]"><Building2 size={16}/><span>Pilih File</span><input type="file" accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml" onChange={selectLogo} className="sr-only"/></label></> : <><div className="grid size-16 place-items-center rounded-full border border-slate-300 bg-white text-[#EF2427]"><Building2 size={30}/></div><div><p className="font-semibold">Logo Kantor</p><p className="mt-1 text-sm text-slate-600">Logo telah diunggah</p></div></>}</div><div className="mt-5 grid gap-4 md:grid-cols-2">{fields.map(([key, label]) => <label key={key} className={cn('rounded-2xl border bg-[#FBFCFD] px-6 py-3.5', editingConfiguration ? 'border-slate-400' : 'border-slate-200')}><p className="text-sm font-semibold text-black">{label}</p>{editingConfiguration ? <input required value={draft[key]} onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))} className="mt-0.5 w-full bg-transparent text-[15px] text-slate-800 outline-none"/> : <p className="mt-0.5 text-[15px] text-slate-800">{configuration[key]}</p>}</label>)}</div></div>{editingConfiguration && <div className="mt-5 flex justify-center gap-4"><button className="h-12 min-w-40 rounded-full bg-[#EF2427] px-7 text-sm font-semibold text-white">Simpan</button><button type="button" onClick={() => { setDraft(configuration); setEditingConfiguration(false) }} className="h-12 min-w-40 rounded-full border border-red-200 bg-red-50 px-7 text-sm font-semibold text-[#EF2427]">Batal</button></div>}</form>
    </section> : <section className="pt-7"><div className="mb-7 flex justify-end"><button type="button" onClick={() => setHolidayForm({ date: '', name: '', type: 'Nasional', active: true })} className="flex h-12 items-center gap-3 rounded-full bg-[#EF2427] px-7 text-sm font-semibold text-white"><Plus size={22}/>Tambah Hari Libur</button></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><h3 className="border-b border-slate-200 px-6 py-5 text-[22px] font-bold">Kalender Hari Libur</h3><div className="overflow-x-auto"><table className="w-full min-w-[840px] text-left"><thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500"><tr><th className="px-6 py-4">Nomor</th><th className="px-5 py-4">Tanggal</th><th className="px-5 py-4">Nama</th><th className="px-5 py-4">Jenis Cuti</th><th className="px-5 py-4">Aktif</th><th className="px-5 py-4 text-center">Aksi</th></tr></thead><tbody>{holidays.map((holiday, index) => <tr key={holiday.id} className="border-t border-slate-200 text-sm"><td className="px-6 py-3.5 font-semibold">{index + 1}</td><td className="px-5 py-3.5 font-semibold">{holiday.date}</td><td className="px-5 py-3.5 font-semibold">{holiday.name}</td><td className="px-5 py-3.5"><span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase text-[#EF2427]">{holiday.type}</span></td><td className="px-5 py-3.5"><span className="rounded-full border border-[#B7DFE9] bg-[#EDF9FC] px-4 py-1 text-[11px] font-semibold text-[#1E93AB]">{holiday.active ? 'YA' : 'TIDAK'}</span></td><td className="px-5 py-3.5"><div className="flex justify-center gap-2"><button type="button" onClick={() => setHolidayForm(holiday)} className="grid size-7 place-items-center rounded-full border border-[#B7DFE9] bg-[#EDF9FC] text-[#1E93AB]" aria-label={`Ubah ${holiday.name}`}><Pencil size={13} strokeWidth={2.5}/></button><button type="button" onClick={() => setHolidays(items => items.filter(item => item.id !== holiday.id))} className="grid size-7 place-items-center rounded-full border border-red-200 bg-red-50 text-[#EF2427]" aria-label={`Hapus ${holiday.name}`}><Trash2 size={14}/></button></div></td></tr>)}</tbody></table></div></div></section>}

    {holidayForm && <Modal title={holidayForm.id ? 'Edit Hari Libur' : 'Tambah Hari Libur'} onClose={() => setHolidayForm(null)}><HolidayForm holiday={holidayForm} onCancel={() => setHolidayForm(null)} onSave={saveHoliday}/></Modal>}
  </div>
}
