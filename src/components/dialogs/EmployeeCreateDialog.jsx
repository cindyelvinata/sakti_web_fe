import { useMemo, useRef, useState } from 'react'
import { ImagePlus, RefreshCw, X } from 'lucide-react'

const initialForm = {
  nama_lengkap: '',
  nomor_telepon: '',
  email: '',
  password: '',
  role: 'karyawan',
  level_jabatan: '',
  divisi: '',
  unit: '',
  atasan_langsung_id: '',
}
const initialFiles = { photo: null, signature: null }
const photoTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
const signatureTypes = ['image/jpeg', 'image/png', 'image/jpg']
const maxSignatureSize = 2 * 1024 * 1024
const divisions = ['Service', 'Admin Support', 'Construction Network Access']
const units = ['Service', 'Admin Support', 'Access & Connectivity', 'Multimedia & Digital', 'Simpan Pinjam']
const positions = [
  { label: 'Staff', value: 'staff' },
  { label: 'Kepala Unit', value: 'ka_unit' },
  { label: 'Officer', value: 'officer' },
  { label: 'Manager', value: 'manager' },
  { label: 'HRD', value: 'hrd' },
  { label: 'General Manager', value: 'gm' },
  { label: 'Supervisor', value: 'spv' },
]

function fileError(file, allowedTypes, maxSize, label) {
  if (!file) return ''
  if (!allowedTypes.includes(file.type)) return `${label} harus berformat ${allowedTypes.includes('image/webp') ? 'jpg, png, jpeg, atau webp' : 'png, jpg, atau jpeg'}.`
  if (maxSize && file.size > maxSize) return `${label} maksimal 2MB.`
  return ''
}

function FilePicker({ label, file, error, accept, disabled, onChange }) {
  const inputRef = useRef(null)

  return <div className="mt-5 first:mt-0"><p className="text-[12px] font-semibold text-slate-700">{label}</p><button type="button" onClick={() => inputRef.current?.click()} className="mt-2 flex min-h-[118px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 text-center text-slate-400 disabled:opacity-60" disabled={disabled}><ImagePlus size={26} /><span className="mt-2 text-[11px] font-medium">{file ? 'Ganti File' : 'Upload'}</span>{file && <span className="mt-1 max-w-full truncate text-[10px] text-slate-500">{file.name}</span>}</button><input ref={inputRef} type="file" accept={accept} onChange={(event) => onChange(event.target.files?.[0] || null)} className="hidden" disabled={disabled} />{error && <p className="mt-2 text-[11px] font-medium text-[#EF2427]">{error}</p>}</div>
}

function managerLabel(manager) {
  return manager?.nama_lengkap || manager?.email || `Atasan ${manager?.id}`
}

function managerText(manager) {
  return `${manager?.nama_lengkap || ''} ${manager?.email || ''}`.toLowerCase()
}

function ManagerCreateSelect({ value, onChange, options, disabled }) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const selected = options.find((manager) => String(manager.id) === String(value))
  const hasSearch = query.trim().length > 0
  const inputValue = isSearching ? query : selected ? managerLabel(selected) : query
  const filteredOptions = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return []
    return options.filter((manager) => managerText(manager).includes(search)).slice(0, 8)
  }, [options, query])

  return <label className="relative text-[12px] font-semibold text-slate-700">Atasan<input value={inputValue} onFocus={() => { if (selected) { setIsSearching(true); setQuery('') } }} onChange={(event) => { if (selected) onChange(''); setIsSearching(true); setQuery(event.target.value) }} disabled={disabled} placeholder="Cari nama/email atasan" className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-[12px] font-normal text-black outline-none focus:border-[#1E93AB]" />{hasSearch && <div className="mt-2 max-h-[132px] overflow-y-auto rounded-lg border border-slate-200 bg-white p-1">{filteredOptions.length ? filteredOptions.map((manager) => <button key={manager.id} type="button" onClick={() => { onChange(String(manager.id)); setQuery(''); setIsSearching(false) }} disabled={disabled} className="block w-full rounded-md px-2 py-1.5 text-left text-[11px] font-normal text-slate-700 hover:bg-[#FDE5E5] disabled:opacity-60"><span className="block font-semibold">{managerLabel(manager)}</span>{manager.email && <span className="block text-[10px] text-slate-500">{manager.email}</span>}</button>) : <p className="px-2 py-2 text-[11px] font-normal text-slate-400">Atasan tidak ditemukan.</p>}</div>}</label>
}

function hasUploadErrors(errors) {
  return Boolean(errors.photo || errors.signature || errors.create)
}

export default function EmployeeCreateDialog({ open, onClose, onCreate, onRetryUpload, managerOptions = [] }) {
  const [form, setForm] = useState(initialForm)
  const [files, setFiles] = useState(initialFiles)
  const [fileErrors, setFileErrors] = useState({})
  const [uploadErrors, setUploadErrors] = useState({})
  const [createdId, setCreatedId] = useState(null)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitLabel, setSubmitLabel] = useState('')
  const [retrying, setRetrying] = useState('')
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const reset = () => {
    setForm(initialForm)
    setFiles(initialFiles)
    setFileErrors({})
    setUploadErrors({})
    setCreatedId(null)
    setMessage('')
    setSubmitLabel('')
  }
  const close = () => { if (!isSubmitting && !retrying) onClose() }
  const finish = () => {
    if (isSubmitting || retrying) return
    reset()
    onClose()
  }
  const setFile = (key, file) => {
    const error = key === 'signature'
      ? fileError(file, signatureTypes, maxSignatureSize, 'TTD')
      : fileError(file, photoTypes, null, 'Foto')
    setFiles((current) => ({ ...current, [key]: file }))
    setFileErrors((current) => ({ ...current, [key]: error }))
    setUploadErrors((current) => ({ ...current, [key]: '' }))
    setMessage('')
  }
  const submit = async (event) => {
    event.preventDefault()
    if (createdId) return

    const nextFileErrors = {
      photo: fileError(files.photo, photoTypes, null, 'Foto'),
      signature: fileError(files.signature, signatureTypes, maxSignatureSize, 'TTD'),
    }
    setFileErrors(nextFileErrors)
    if (nextFileErrors.photo || nextFileErrors.signature) return

    setMessage('')
    setUploadErrors({})
    setIsSubmitting(true)
    setSubmitLabel('Menyimpan...')

    try {
      const result = await onCreate?.(form, files, setSubmitLabel)
      const nextUploadErrors = result?.uploadErrors || {}

      if (hasUploadErrors(nextUploadErrors)) {
        setCreatedId(result?.karyawanId || null)
        setUploadErrors(nextUploadErrors)
        setMessage('Karyawan berhasil dibuat, tetapi ada file yang gagal diupload.')
        return
      }

      reset()
      onClose()
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Gagal menambah karyawan.')
    } finally {
      setIsSubmitting(false)
      setSubmitLabel('')
    }
  }
  const retryUpload = async (key) => {
    if (!createdId || !files[key]) return

    const error = key === 'signature'
      ? fileError(files.signature, signatureTypes, maxSignatureSize, 'TTD')
      : fileError(files.photo, photoTypes, null, 'Foto')
    setFileErrors((current) => ({ ...current, [key]: error }))
    if (error) return

    setRetrying(key)
    setMessage('')

    try {
      const result = await onRetryUpload?.(createdId, { [key]: files[key] })
      const nextUploadErrors = { ...uploadErrors, ...(result?.uploadErrors || {}) }
      if (!result?.uploadErrors?.[key]) nextUploadErrors[key] = ''
      setUploadErrors(nextUploadErrors)
      setMessage(hasUploadErrors(nextUploadErrors) ? 'Karyawan berhasil dibuat, tetapi ada file yang gagal diupload.' : 'Upload file berhasil.')
    } catch (error) {
      setUploadErrors((current) => ({ ...current, [key]: error.response?.data?.message || error.message || `Gagal mengupload ${key === 'photo' ? 'foto' : 'TTD'}.` }))
    } finally {
      setRetrying('')
    }
  }
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4" onMouseDown={close}><section role="dialog" aria-modal="true" aria-labelledby="create-employee-title" className="max-h-[90vh] w-full max-w-[760px] overflow-y-auto rounded-2xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><header className="flex items-center justify-between border-b border-slate-200 px-6 py-4"><div><h2 id="create-employee-title" className="text-[21px] font-bold text-slate-900">Tambah Karyawan Baru</h2><p className="mt-1 text-[12px] text-slate-500">Lengkapi informasi karyawan sebelum menambahkannya.</p></div><button type="button" onClick={createdId ? finish : close} className="grid size-8 place-items-center rounded-lg border border-slate-300 text-slate-400 disabled:opacity-60" aria-label="Tutup popup" disabled={isSubmitting || Boolean(retrying)}><X size={20} /></button></header><form onSubmit={submit} className="p-6"><div className="grid gap-6 sm:grid-cols-[130px_1fr]"><div><FilePicker label="Foto" file={files.photo} error={fileErrors.photo || uploadErrors.photo} accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" disabled={isSubmitting || Boolean(retrying) || Boolean(createdId && !uploadErrors.photo)} onChange={(file) => setFile('photo', file)} />{createdId && uploadErrors.photo && <button type="button" onClick={() => retryUpload('photo')} disabled={retrying === 'photo'} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-[#B7DFE9] bg-[#EDF9FC] px-3 py-2 text-[11px] font-bold text-[#1E93AB] disabled:opacity-60"><RefreshCw size={13} />{retrying === 'photo' ? 'Mengupload...' : 'Retry Foto'}</button>}<FilePicker label="TTD" file={files.signature} error={fileErrors.signature || uploadErrors.signature} accept=".png,.jpg,.jpeg,image/png,image/jpeg" disabled={isSubmitting || Boolean(retrying) || Boolean(createdId && !uploadErrors.signature)} onChange={(file) => setFile('signature', file)} />{createdId && uploadErrors.signature && <button type="button" onClick={() => retryUpload('signature')} disabled={retrying === 'signature'} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-[#B7DFE9] bg-[#EDF9FC] px-3 py-2 text-[11px] font-bold text-[#1E93AB] disabled:opacity-60"><RefreshCw size={13} />{retrying === 'signature' ? 'Mengupload...' : 'Retry TTD'}</button>}</div><div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">{[['Nama Lengkap', 'nama_lengkap', 'Masukkan nama lengkap'], ['No. Telepon', 'nomor_telepon', 'Masukkan nomor telepon'], ['Email', 'email', 'Masukkan email'], ['Password', 'password', 'Masukkan password']].map(([label, key, placeholder]) => <label key={key} className="text-[12px] font-semibold text-slate-700">{label}<input required={key === 'nama_lengkap' || key === 'email' || key === 'password'} type={key === 'email' ? 'email' : key === 'password' ? 'password' : 'text'} value={form[key]} onChange={(event) => setField(key, event.target.value)} placeholder={placeholder} disabled={isSubmitting || Boolean(createdId)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-[12px] font-normal outline-none focus:border-[#1E93AB]" /></label>)}<label className="text-[12px] font-semibold text-slate-700">Divisi<select required value={form.divisi} onChange={(event) => setField('divisi', event.target.value)} disabled={isSubmitting || Boolean(createdId)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-[12px] font-normal outline-none focus:border-[#1E93AB]"><option value="">Pilih divisi</option>{divisions.map((division) => <option key={division} value={division}>{division}</option>)}</select></label><label className="text-[12px] font-semibold text-slate-700">Unit<select value={form.unit} onChange={(event) => setField('unit', event.target.value)} disabled={isSubmitting || Boolean(createdId)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-[12px] font-normal outline-none focus:border-[#1E93AB]"><option value="">Pilih unit (opsional)</option>{units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></label><label className="text-[12px] font-semibold text-slate-700">Role<select value={form.role} onChange={(event) => setField('role', event.target.value)} disabled={isSubmitting || Boolean(createdId)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-[12px] font-normal capitalize outline-none focus:border-[#1E93AB]"><option>karyawan</option><option>atasan</option><option>admin</option><option>hrd</option></select></label><label className="text-[12px] font-semibold text-slate-700">Jabatan<select required value={form.level_jabatan} onChange={(event) => setField('level_jabatan', event.target.value)} disabled={isSubmitting || Boolean(createdId)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-[12px] font-normal outline-none focus:border-[#1E93AB]"><option value="">Pilih jabatan</option>{positions.map((position) => <option key={position.value} value={position.value}>{position.label}</option>)}</select></label><ManagerCreateSelect value={form.atasan_langsung_id} onChange={(value) => setField('atasan_langsung_id', value)} options={managerOptions} disabled={isSubmitting || Boolean(createdId)} /></div></div>{message && <p className={`mt-5 text-right text-sm font-medium ${createdId ? 'text-[#1E93AB]' : 'text-[#EF2427]'}`}>{message}</p>}{uploadErrors.create && <p className="mt-2 text-right text-sm font-medium text-[#EF2427]">{uploadErrors.create}</p>}<footer className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5"><button type="button" onClick={createdId ? finish : close} disabled={isSubmitting || Boolean(retrying)} className="h-10 min-w-[125px] rounded-full border border-[#FFB1B1] bg-[#FDE8E8] text-[13px] font-bold text-[#EF2427] disabled:opacity-60">{createdId ? 'Selesai' : 'Batal'}</button><button type="submit" disabled={isSubmitting || Boolean(retrying) || Boolean(createdId)} className="h-10 min-w-[125px] rounded-full bg-[#EF2427] text-[13px] font-bold text-white disabled:opacity-60">{submitLabel || 'Simpan'}</button></footer></form></section></div>
}

