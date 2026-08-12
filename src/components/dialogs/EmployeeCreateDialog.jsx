import { useState } from 'react'
import { ImagePlus, X } from 'lucide-react'

const initialForm = {
  nama_lengkap: '',
  nomor_telepon: '',
  email: '',
  password: '',
  role: 'karyawan',
  level_jabatan: '',
  divisi: '',
  unit: '',
}

export default function EmployeeCreateDialog({ open, onClose, onCreate }) {
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const close = () => { if (!isSubmitting) onClose() }
  const submit = async (event) => {
    event.preventDefault()
    setMessage('')
    setIsSubmitting(true)

    try {
      await onCreate?.(form)
      setForm(initialForm)
      onClose()
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Gagal menambah karyawan.')
    } finally {
      setIsSubmitting(false)
    }
  }
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4" onMouseDown={close}><section role="dialog" aria-modal="true" aria-labelledby="create-employee-title" className="max-h-[90vh] w-full max-w-[760px] overflow-y-auto rounded-2xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><header className="flex items-center justify-between border-b border-slate-200 px-6 py-4"><div><h2 id="create-employee-title" className="text-[21px] font-bold text-slate-900">Tambah Karyawan Baru</h2><p className="mt-1 text-[12px] text-slate-500">Lengkapi informasi karyawan sebelum menambahkannya.</p></div><button type="button" onClick={close} className="grid size-8 place-items-center rounded-lg border border-slate-300 text-slate-400 disabled:opacity-60" aria-label="Tutup popup" disabled={isSubmitting}><X size={20} /></button></header><form onSubmit={submit} className="p-6"><div className="grid gap-6 sm:grid-cols-[130px_1fr]"><div><p className="text-[12px] font-semibold text-slate-700">Foto</p><button type="button" className="mt-2 flex h-[118px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 disabled:opacity-60" disabled={isSubmitting}><ImagePlus size={26} /><span className="mt-2 text-[11px] font-medium">Upload Foto</span></button></div><div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">{[['Nama Lengkap', 'nama_lengkap', 'Masukkan nama lengkap'], ['No. Telepon', 'nomor_telepon', 'Masukkan nomor telepon'], ['Email', 'email', 'Masukkan email'], ['Password', 'password', 'Masukkan password'], ['Divisi', 'divisi', 'Masukkan divisi'], ['Unit', 'unit', 'Masukkan unit']].map(([label, key, placeholder]) => <label key={key} className="text-[12px] font-semibold text-slate-700">{label}<input required={key === 'nama_lengkap' || key === 'email' || key === 'password'} type={key === 'email' ? 'email' : key === 'password' ? 'password' : 'text'} value={form[key]} onChange={(event) => setField(key, event.target.value)} placeholder={placeholder} disabled={isSubmitting} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-[12px] font-normal outline-none focus:border-[#1E93AB]" /></label>)}<label className="text-[12px] font-semibold text-slate-700">Role<select value={form.role} onChange={(event) => setField('role', event.target.value)} disabled={isSubmitting} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-[12px] font-normal capitalize outline-none focus:border-[#1E93AB]"><option>karyawan</option><option>atasan</option><option>admin</option><option>hrd</option></select></label><label className="text-[12px] font-semibold text-slate-700">Jabatan<select required value={form.level_jabatan} onChange={(event) => setField('level_jabatan', event.target.value)} disabled={isSubmitting} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-[12px] font-normal capitalize outline-none focus:border-[#1E93AB]"><option value="">Pilih jabatan</option><option>staff</option><option>officer</option><option>manager</option><option>hrd</option></select></label></div></div>{message && <p className="mt-5 text-right text-sm font-medium text-[#EF2427]">{message}</p>}<footer className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5"><button type="button" onClick={close} disabled={isSubmitting} className="h-10 min-w-[125px] rounded-full border border-[#FFB1B1] bg-[#FDE8E8] text-[13px] font-bold text-[#EF2427] disabled:opacity-60">Batal</button><button type="submit" disabled={isSubmitting} className="h-10 min-w-[125px] rounded-full bg-[#EF2427] text-[13px] font-bold text-white disabled:opacity-60">{isSubmitting ? 'Menyimpan...' : 'Simpan'}</button></footer></form></section></div>
}
