import { useState } from 'react'
import { X } from 'lucide-react'

const initialForm = { date: '', name: '', type: 'Nasional', active: true }

export default function HolidayCreateDialog({ open, onClose, onCreate }) {
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
      await onCreate({ ...form, id: Date.now() })
      setForm(initialForm)
      onClose()
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Gagal menambah hari libur.')
    } finally {
      setIsSubmitting(false)
    }
  }
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4" onMouseDown={close}><section role="dialog" aria-modal="true" aria-labelledby="create-holiday-title" className="w-full max-w-[480px] rounded-2xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><header className="flex items-center justify-between border-b border-slate-200 px-6 py-4"><div><h2 id="create-holiday-title" className="text-[21px] font-bold text-slate-900">Tambah Hari Libur</h2><p className="mt-1 text-[12px] text-slate-500">Masukkan informasi hari libur baru.</p></div><button type="button" onClick={close} disabled={isSubmitting} className="grid size-8 place-items-center rounded-lg border border-slate-300 text-slate-400 disabled:opacity-60" aria-label="Tutup popup"><X size={20} /></button></header><form onSubmit={submit} className="space-y-4 p-6"><label className="block text-[12px] font-semibold text-slate-700">Tanggal<input required type="date" value={form.date} onChange={(event) => setField('date', event.target.value)} disabled={isSubmitting} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-[#1E93AB] disabled:opacity-60" /></label><label className="block text-[12px] font-semibold text-slate-700">Nama Hari Libur<input required value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="Masukkan nama hari libur" disabled={isSubmitting} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-[#1E93AB] disabled:opacity-60" /></label><label className="block text-[12px] font-semibold text-slate-700">Jenis Cuti<select value={form.type} onChange={(event) => setField('type', event.target.value)} disabled={isSubmitting} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-[12px] outline-none focus:border-[#1E93AB] disabled:opacity-60"><option>Nasional</option><option>Cuti Bersama</option></select></label><div><p className="text-[12px] font-semibold text-slate-700">Aktif</p><div className="mt-2 flex gap-3"><button type="button" onClick={() => setField('active', true)} disabled={isSubmitting} className={`h-10 rounded-xl border px-5 text-[12px] font-bold disabled:opacity-60 ${form.active ? 'border-[#B7DFE9] bg-[#EDF9FC] text-[#1E93AB]' : 'border-slate-300 text-slate-500'}`}>YA</button><button type="button" onClick={() => setField('active', false)} disabled={isSubmitting} className={`h-10 rounded-xl border px-5 text-[12px] font-bold disabled:opacity-60 ${!form.active ? 'border-red-200 bg-red-50 text-[#EF2427]' : 'border-slate-300 text-slate-500'}`}>TIDAK</button></div></div>{message && <p className="text-right text-sm font-medium text-[#EF2427]">{message}</p>}<footer className="flex justify-end gap-3 border-t border-slate-200 pt-5"><button type="button" onClick={close} disabled={isSubmitting} className="h-10 min-w-[125px] rounded-full border border-red-200 bg-red-50 text-[13px] font-bold text-[#EF2427] disabled:opacity-60">Batal</button><button type="submit" disabled={isSubmitting} className="h-10 min-w-[125px] rounded-full bg-[#EF2427] text-[13px] font-bold text-white disabled:opacity-60">{isSubmitting ? 'Menambah...' : 'Tambah'}</button></footer></form></section></div>
}
