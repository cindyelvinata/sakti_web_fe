import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, Plus, Search, Trash2 } from 'lucide-react'
import EmployeeCreateDialog from '@/components/dialogs/EmployeeCreateDialog'
import { createEmployee, deactivateEmployee, getEmployees, updateEmployee } from '@/services/employeeService'
import { authStorage } from '@/lib/authStorage'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import penIcon from '@/assets/icons/pen.svg'
import { useNavigate } from 'react-router-dom'

const statusFilters = ['Semua Status', 'Aktif', 'Nonaktif']
const roles = ['karyawan', 'atasan', 'admin', 'hrd']
const positions = ['staff', 'officer', 'manager', 'hrd']
function titleCase(value) { return value ? String(value).split(/[_\s-]+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') : '-' }
function normalizeText(value) { return String(value ?? '').trim().toLowerCase() }
function normalizeStatus(value) { return normalizeText(value).replace(/[\s-]+/g, '_') }
function csvValue(value) { return `"${String(value ?? '').replace(/"/g, '""')}"` }
function StatusBadge({ status }) { return <span className={cn('inline-flex min-w-[61px] justify-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase', status === 'Aktif' ? 'border-[#B7DFE9] bg-[#EDF9FC] text-[#1E93AB]' : 'border-slate-200 bg-slate-100 text-slate-600')}>{status}</span> }
function FieldInput({ value, onChange }) { return <input value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="h-[30px] w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none focus:border-[#1E93AB]" /> }
function FieldSelect({ value, onChange, options }) { return <select value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="h-[30px] w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] capitalize text-slate-700 outline-none focus:border-[#1E93AB]">{[...new Set([value, ...options].filter(Boolean))].map((option) => <option key={option} value={option}>{titleCase(option)}</option>)}</select> }
function buildCreatePayload(form) {
  return {
    email: form.email,
    password: form.password,
    nama_lengkap: form.nama_lengkap,
    nomor_telepon: form.nomor_telepon,
    role: form.role,
    level_jabatan: form.level_jabatan,
    divisi: form.divisi,
    unit: form.unit,
  }
}

export default function EmployeeManagementPage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [draftEmployees, setDraftEmployees] = useState([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Semua Status')
  const [filterOpen, setFilterOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const loadEmployees = useCallback(async () => { setIsLoading(true); setErrorMessage(''); try { const result = await getEmployees({ page, limit: 10, ...(query.trim() ? { search: query.trim() } : {}), ...(status === 'Semua Status' ? {} : { status: status.toLowerCase() }) }); setEmployees(result.items); setMeta(result.meta) } catch (error) { if ([401, 403].includes(error.response?.status)) { authStorage.clearSession(); navigate(ROUTES.login, { replace: true }); return } setErrorMessage(error.response?.data?.message || error.message || 'Gagal memuat data karyawan.') } finally { setIsLoading(false) } }, [navigate, page, query, status])
  // API load populates table state after mount, page, search, or status changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadEmployees() }, [loadEmployees])
  const nameById = useMemo(() => new Map(employees.map((employee) => [employee.id, employee.nama_lengkap])), [employees])
  const idByName = useMemo(() => new Map(employees.map((employee) => [normalizeText(employee.nama_lengkap), employee.id])), [employees])
  const records = useMemo(() => employees.map((employee) => ({ id: employee.id, photo: employee.foto_url, name: employee.nama_lengkap || '-', phone: employee.nomor_telepon || '', email: employee.email || '', role: employee.role || '', position: employee.level_jabatan || '', managerId: employee.atasan_langsung_id, manager: nameById.get(employee.atasan_langsung_id) || '', division: employee.divisi || '-', unit: employee.unit || '-', status: titleCase(employee.status_karyawan) })), [employees, nameById])
  const rows = isEditMode ? draftEmployees : records
  const startEditing = () => { setDraftEmployees(records); setSaveError(''); setIsEditMode(true) }
  const updateDraft = (id, key, value) => setDraftEmployees((items) => items.map((item) => item.id === id ? { ...item, [key]: value } : item))
  const cancel = () => { setDraftEmployees([]); setSaveError(''); setIsEditMode(false) }
  const toUpdatePayload = (draft, original) => {
    const payload = {}
    if (draft.name !== original.name) payload.nama_lengkap = draft.name
    if (draft.phone !== original.phone) payload.nomor_telepon = draft.phone
    if (draft.email !== original.email) payload.email = draft.email
    if (draft.role !== original.role) payload.role = draft.role
    if (draft.position !== original.position) payload.level_jabatan = draft.position
    if (draft.division !== original.division) payload.divisi = draft.division
    if (draft.unit !== original.unit) payload.unit = draft.unit
    if (normalizeStatus(draft.status) !== normalizeStatus(original.status)) payload.status_karyawan = normalizeStatus(draft.status)
    if (draft.photo !== original.photo && draft.photo) payload.foto_url = draft.photo
    if (draft.manager !== original.manager) payload.atasan_langsung_id = draft.manager ? idByName.get(normalizeText(draft.manager)) : null
    return payload
  }
  const save = async () => {
    setSaveError('')
    setIsSaving(true)
    try {
      const originalById = new Map(records.map((employee) => [employee.id, employee]))
      const updates = draftEmployees.map((draft) => ({ draft, original: originalById.get(draft.id) })).filter(({ original }) => original).map(({ draft, original }) => ({ id: draft.id, payload: toUpdatePayload(draft, original), draft, original })).filter(({ payload }) => Object.keys(payload).length > 0)
      const invalidManager = updates.find(({ payload, draft }) => Object.hasOwn(payload, 'atasan_langsung_id') && draft.manager && payload.atasan_langsung_id === undefined)
      if (invalidManager) throw new Error(`Atasan "${invalidManager.draft.manager}" tidak ditemukan. Gunakan nama karyawan yang sudah ada.`)
      await Promise.all(updates.map(({ id, payload }) => updateEmployee(id, payload)))
      await loadEmployees()
      setDraftEmployees([])
      setIsEditMode(false)
    } catch (error) {
      setSaveError(error.response?.data?.message || error.message || 'Gagal menyimpan perubahan karyawan.')
    } finally {
      setIsSaving(false)
    }
  }
  const create = async (form) => { await createEmployee(buildCreatePayload(form)); await loadEmployees() }
  const remove = async (id) => {
    setSaveError('')
    setIsSaving(true)
    try {
      await deactivateEmployee(id)
      await loadEmployees()
      setDraftEmployees((items) => items.filter((item) => item.id !== id))
    } catch (error) {
      setSaveError(error.response?.data?.message || error.message || 'Gagal menonaktifkan karyawan.')
    } finally {
      setIsSaving(false)
    }
  }
  const downloadCsv = () => {
    setSaveError('')
    const headers = ['Nama', 'No. Telp', 'Email', 'Role', 'Jabatan', 'Atasan', 'Divisi', 'Unit', 'Status']
    const csvRows = rows.map((employee) => [employee.name, employee.phone, employee.email, employee.role, titleCase(employee.position), employee.manager, employee.division, employee.unit, employee.status].map(csvValue).join(','))
    const csv = [headers.map(csvValue).join(','), ...csvRows].join('\n')
    const file = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = 'data-karyawan.csv'
    link.click()
    URL.revokeObjectURL(url)
  }
  const currentPage = meta.page || page
  const totalPages = meta.total_pages || 1
  return <div className={cn('mx-auto', isEditMode ? 'max-w-none' : 'max-w-[1040px]')}><header className="mb-9"><h2 className="text-[26px] font-bold leading-none tracking-[-.5px] text-slate-900">Kelola Karyawan</h2><p className="mt-2 text-[14px] text-slate-500">Kelola data karyawan yang terdaftar dalam sistem</p></header><section className="rounded-2xl bg-[#EF2427] p-5"><div className="flex flex-col gap-3 lg:flex-row"><label className="flex h-9 flex-1 items-center rounded-full bg-white px-6 sm:h-[36px]"><Search size={20} className="shrink-0 text-black" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} className="ml-4 w-full bg-transparent text-[13px] outline-none placeholder:text-slate-900" placeholder="Cari" /></label><div className="relative"><button type="button" onClick={() => setFilterOpen((current) => !current)} className="flex h-9 w-full items-center justify-between rounded-full bg-white px-6 text-[13px] font-medium text-black lg:w-[214px]">{status}<ChevronDown size={18} /></button>{filterOpen && <div className="absolute right-0 z-30 mt-3 w-[200px] rounded-2xl bg-white p-1.5 shadow-xl">{statusFilters.map((item) => <button key={item} type="button" onClick={() => { setStatus(item); setPage(1); setFilterOpen(false) }} className={cn('block w-full rounded-xl px-3 py-2 text-left text-[13px] text-slate-700', status === item && 'bg-[#FDE5E5] font-semibold text-[#EF2427]')}>{item}</button>)}</div>}</div><button type="button" onClick={downloadCsv} disabled={isLoading || rows.length === 0} className="flex h-9 items-center justify-between rounded-full bg-white px-6 text-[13px] font-medium text-black disabled:opacity-60 lg:w-[214px]">Unduh CSV<ChevronDown size={18} /></button></div></section><section className="mt-9 overflow-hidden rounded-2xl border border-slate-200 bg-white"><h3 className="border-b border-slate-200 px-6 py-4 text-[23px] font-bold tracking-[-.5px] text-slate-900">Data Karyawan</h3>{errorMessage ? <div className="p-10 text-center text-sm text-[#EF2427]"><p>{errorMessage}</p><button type="button" onClick={loadEmployees} className="mt-3 font-semibold text-[#1E93AB]">Coba lagi</button></div> : <div className="overflow-x-auto">{isEditMode ? <table className="w-full min-w-[1700px] text-left"><colgroup><col className="w-[84px]" /><col className="w-[190px]" /><col className="w-[155px]" /><col className="w-[220px]" /><col className="w-[135px]" /><col className="w-[145px]" /><col className="w-[185px]" /><col className="w-[180px]" /><col className="w-[190px]" /><col className="w-[125px]" /><col className="w-[70px]" /></colgroup><thead className="bg-[#F7F8FA] text-[12px] font-bold uppercase text-[#707989]"><tr>{['Foto', 'Nama', 'No. Telp', 'Email', 'Role', 'Jabatan', 'Atasan', 'Divisi', 'Unit', 'Status', 'Aksi'].map((heading) => <th key={heading} className="px-3 py-4 whitespace-nowrap">{heading}</th>)}</tr></thead><tbody>{rows.map((employee) => <tr key={employee.id} className="border-t border-slate-200"><td className="px-3 py-2"><div className="flex flex-col items-center text-[9px] text-slate-400">{employee.photo ? <img src={employee.photo} alt="" className="size-10 rounded-full object-cover" /> : <span className="size-10 rounded-full bg-slate-200" />}Foto</div></td><td className="px-3 py-2"><FieldInput value={employee.name} onChange={(value) => updateDraft(employee.id, 'name', value)} /></td><td className="px-3 py-2"><FieldInput value={employee.phone} onChange={(value) => updateDraft(employee.id, 'phone', value)} /></td><td className="px-3 py-2"><FieldInput value={employee.email} onChange={(value) => updateDraft(employee.id, 'email', value)} /></td><td className="px-3 py-2"><FieldSelect value={employee.role} onChange={(value) => updateDraft(employee.id, 'role', value)} options={roles} /></td><td className="px-3 py-2"><FieldSelect value={employee.position} onChange={(value) => updateDraft(employee.id, 'position', value)} options={positions} /></td><td className="px-3 py-2"><FieldInput value={employee.manager} onChange={(value) => updateDraft(employee.id, 'manager', value)} /></td><td className="px-3 py-2"><FieldInput value={employee.division} onChange={(value) => updateDraft(employee.id, 'division', value)} /></td><td className="px-3 py-2"><FieldInput value={employee.unit} onChange={(value) => updateDraft(employee.id, 'unit', value)} /></td><td className="px-3 py-2"><FieldSelect value={employee.status.toLowerCase()} onChange={(value) => updateDraft(employee.id, 'status', titleCase(value))} options={['aktif', 'nonaktif']} /></td><td className="px-3 py-2"><button type="button" onClick={() => remove(employee.id)} disabled={isSaving} className="grid size-7 place-items-center rounded-md border border-red-200 bg-red-50 text-[#EF2427] disabled:opacity-50" aria-label={`Nonaktifkan ${employee.name}`}><Trash2 size={14} /></button></td></tr>)}</tbody></table> : <table className="w-full min-w-[780px] text-left"><thead className="bg-[#F7F8FA] text-[12px] font-bold uppercase text-[#707989]"><tr><th className="px-6 py-4">Nama</th><th className="px-4 py-4">Jabatan</th><th className="px-4 py-4">Divisi</th><th className="px-4 py-4">Unit</th><th className="px-4 py-4 text-right">Status</th></tr></thead><tbody>{isLoading ? <tr><td colSpan="5" className="p-10 text-center text-sm text-slate-500">Memuat data karyawan...</td></tr> : rows.length ? rows.map((employee) => <tr key={employee.id} className="border-t border-slate-200 text-[13px] text-black"><td className="w-[23%] px-6 py-4 font-bold uppercase">{employee.name}</td><td className="px-4 py-4 font-semibold">{titleCase(employee.position)}</td><td className="px-4 py-4 font-semibold">{employee.division}</td><td className="px-4 py-4 font-semibold">{employee.unit}</td><td className="px-6 py-4 text-right"><StatusBadge status={employee.status} /></td></tr>) : <tr><td colSpan="5" className="p-10 text-center text-sm text-slate-500">Data karyawan tidak ditemukan.</td></tr>}</tbody></table>}</div>}</section>{!errorMessage && !isEditMode && totalPages > 1 && <div className="mt-4 flex justify-center gap-4 text-sm"><button type="button" disabled={currentPage <= 1} onClick={() => setPage((current) => current - 1)} className="font-semibold text-[#1E93AB] disabled:opacity-40">Sebelumnya</button><span>Halaman {currentPage} dari {totalPages}</span><button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((current) => current + 1)} className="font-semibold text-[#1E93AB] disabled:opacity-40">Berikutnya</button></div>}<div className={cn('mt-7 flex gap-4', isEditMode ? 'justify-between' : 'justify-end')}>{isEditMode ? <><button type="button" onClick={() => setCreateOpen(true)} disabled={isSaving} className="grid size-9 place-items-center rounded-lg bg-[#EF2427] text-white shadow-sm hover:bg-[#d91c1f] disabled:opacity-50" aria-label="Tambah karyawan"><Plus size={25} /></button><div className="flex gap-4"><button type="button" onClick={save} disabled={isSaving} className="h-10 min-w-[140px] rounded-full bg-[#EF2427] px-7 text-[13px] font-bold text-white disabled:opacity-50">{isSaving ? 'Menyimpan...' : 'Simpan'}</button><button type="button" onClick={cancel} disabled={isSaving} className="h-10 min-w-[140px] rounded-full border border-[#FFB1B1] bg-[#FDE8E8] px-7 text-[13px] font-bold text-[#EF2427] disabled:opacity-50">Batal</button></div></> : <button type="button" onClick={startEditing} disabled={isLoading} className="flex h-10 items-center gap-3 rounded-full bg-[#EF2427] px-7 text-[13px] font-bold text-white disabled:opacity-50"><img src={penIcon} alt="" className="size-4 brightness-0 invert" />Edit Konfigurasi</button>}</div>{saveError && <p className="mt-3 text-right text-sm font-medium text-[#EF2427]">{saveError}</p>}<EmployeeCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={create} /></div>
}
