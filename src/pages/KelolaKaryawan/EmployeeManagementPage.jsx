import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Download, Plus, RefreshCw, Search } from 'lucide-react'
import EmployeeCreateDialog from '@/components/dialogs/EmployeeCreateDialog'
import { createEmployee, getEmployees, updateEmployee, uploadEmployeePhoto, uploadEmployeeSignature } from '@/services/employeeService'
import { authStorage } from '@/lib/authStorage'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import penIcon from '@/assets/icons/pen.svg'
import { useNavigate } from 'react-router-dom'

const roles = ['karyawan', 'atasan', 'admin', 'hrd']
const roleFilters = [{ label: 'Semua Role', value: '' }, { label: 'Atasan', value: 'atasan' }, { label: 'HRD', value: 'hrd' }, { label: 'Karyawan', value: 'karyawan' }]
const positions = [
  { label: 'Staff', value: 'staff' },
  { label: 'Kepala Unit', value: 'ka_unit' },
  { label: 'Officer', value: 'officer' },
  { label: 'Manager', value: 'manager' },
  { label: 'HRD', value: 'hrd' },
  { label: 'General Manager', value: 'gm' },
  { label: 'Supervisor', value: 'spv' },
]
const positionFilters = [{ label: 'Semua Jabatan', value: '' }, ...positions]
const divisions = ['Service', 'Admin Support', 'Construction Network Access']
const units = ['Service', 'Admin Support', 'Access & Connectivity', 'Multimedia & Digital', 'Simpan Pinjam']
const divisionFilters = [{ label: 'Semua Divisi', value: '' }, ...divisions.map((division) => ({ label: division, value: division }))]
const unitFilters = [{ label: 'Semua Unit', value: '' }, ...units.map((unit) => ({ label: unit, value: unit }))]
const employeeStatusFilters = [{ label: 'Semua Status', value: '' }, { label: 'Aktif', value: 'aktif' }, { label: 'Nonaktif', value: 'nonaktif' }]
const photoTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
const signatureTypes = ['image/png', 'image/jpeg', 'image/jpg']
const maxSignatureSize = 2 * 1024 * 1024
function titleCase(value) { return value ? String(value).split(/[_\s-]+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') : '-' }
function positionLabel(value) { return positions.find((position) => position.value === value)?.label || titleCase(value) }
function normalizeText(value) { return String(value ?? '').trim().toLowerCase() }
function normalizeStatus(value) { return normalizeText(value).replace(/[\s-]+/g, '_') }
function isActiveEmployee(employee) { return normalizeStatus(employee?.status_karyawan) === 'aktif' }
function csvValue(value) { return `"${String(value ?? '').replace(/"/g, '""')}"` }
function uniqueById(items) { const byId = new Map(); items.forEach((item) => { if (item?.id != null && !byId.has(String(item.id))) byId.set(String(item.id), item) }); return [...byId.values()] }
function signatureUrl(employee) { return employee?.tanda_tangan?.url_tanda_tangan || employee?.tanda_tangan?.url || employee?.url_tanda_tangan || employee?.tanda_tangan_url || employee?.ttd_url || '' }
function paginationItems(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
  const orderedPages = [...pages].filter((item) => item >= 1 && item <= totalPages).sort((first, second) => first - second)

  return orderedPages.flatMap((item, index) => {
    const previous = orderedPages[index - 1]
    return previous && item - previous > 1 ? ['...', item] : [item]
  })
}
function fileError(file, types, maxSize, label) {
  if (!file) return ''
  if (!types.includes(file.type)) return `${label} harus berformat ${label === 'Foto' ? 'jpg, png, jpeg, atau webp' : 'png, jpg, atau jpeg'}.`
  if (maxSize && file.size > maxSize) return `${label} maksimal 2MB.`
  return ''
}
function StatusBadge({ status }) { return <span className={cn('inline-flex min-w-[61px] justify-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase', status === 'Aktif' ? 'border-[#B7DFE9] bg-[#EDF9FC] text-[#1E93AB]' : 'border-slate-200 bg-slate-100 text-slate-600')}>{status}</span> }
function FieldInput({ value, onChange }) { return <input value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="h-[30px] w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none focus:border-[#1E93AB]" /> }
function FieldSelect({ value, onChange, options }) { const normalizedOptions = options.map((option) => typeof option === 'string' ? { label: titleCase(option), value: option } : option); const hasValue = !value || normalizedOptions.some((option) => option.value === value); const selectOptions = hasValue ? normalizedOptions : [{ label: titleCase(value), value }, ...normalizedOptions]; return <select value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="h-[30px] w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none focus:border-[#1E93AB]">{selectOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> }
function ColumnFilter({ id, label, value, options, openFilter, onToggle, onChange }) {
  const selected = options.find((option) => option.value === value)

  return <div className="relative inline-flex items-center"><button type="button" onClick={() => onToggle(id)} className={cn('flex items-center gap-1.5 whitespace-nowrap text-[12px] font-bold uppercase text-[#707989]', value && 'text-[#EF2427]')}>{label}<ChevronDown size={14} /></button>{openFilter === id && <div className="absolute left-0 top-full z-40 mt-2 w-44 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-slate-200">{options.map((option) => <button key={option.value || 'all'} type="button" onClick={() => onChange(option.value)} className={cn('block w-full rounded-lg px-3 py-2 text-left text-[12px] font-medium normal-case text-slate-700 hover:bg-[#FDE5E5]', value === option.value && 'bg-[#FDE5E5] font-semibold text-[#EF2427]')}>{option.label}</button>)}</div>}{value && <span className="sr-only">Filter aktif: {selected?.label}</span>}</div>
}
function ManagerSelect({ value, onChange, options }) { return <select value={value ?? ''} onChange={(event) => onChange(event.target.value || null)} className="h-[30px] w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none focus:border-[#1E93AB]"><option value="">Tidak ada</option>{options.map((manager) => <option key={manager.id} value={manager.id}>{manager.nama_lengkap || manager.email || `Atasan ${manager.id}`}</option>)}</select> }
function EditFilePicker({ employeeId, kind, label, currentUrl, file, error, uploadError, isRetrying, disabled, onSelect, onRetry }) {
  const previewUrl = file ? URL.createObjectURL(file) : currentUrl
  return <div className="flex flex-col items-center gap-1 text-[9px] text-slate-500"><label className={cn('group flex cursor-pointer flex-col items-center gap-1', disabled && 'pointer-events-none opacity-60')}><input type="file" className="sr-only" accept={kind === 'photo' ? '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp' : '.png,.jpg,.jpeg,image/png,image/jpeg'} disabled={disabled} onChange={(event) => onSelect(employeeId, kind, event.target.files?.[0] || null)} />{previewUrl ? <img src={previewUrl} alt="" className={cn('size-10 object-cover ring-1 ring-slate-200 group-hover:ring-[#1E93AB]', kind === 'photo' ? 'rounded-full' : 'rounded-md bg-white')} /> : <span className={cn('grid size-10 place-items-center bg-slate-100 text-[10px] font-bold text-slate-400 ring-1 ring-slate-200 group-hover:ring-[#1E93AB]', kind === 'photo' ? 'rounded-full' : 'rounded-md')}>{label}</span>}{file && <span className="max-w-[86px] truncate font-semibold text-slate-500 group-hover:text-[#1E93AB]">{file.name}</span>}</label>{(error || uploadError) && <p className="max-w-[86px] text-center text-[9px] font-semibold text-[#EF2427]">{error || uploadError}</p>}{uploadError && file && <button type="button" onClick={() => onRetry(employeeId, kind)} disabled={disabled || isRetrying} className="flex items-center gap-1 rounded-full border border-[#B7DFE9] bg-[#EDF9FC] px-2 py-1 text-[9px] font-bold text-[#1E93AB] disabled:opacity-60"><RefreshCw size={10} />{isRetrying ? 'Retry...' : 'Retry'}</button>}</div>
}
async function getAllEmployees(params) {
  const firstPage = await getEmployees({ ...params, page: 1, limit: 100 })
  const pageCount = Math.max(1, Number(firstPage.meta?.total_pages || 1))
  const otherPages = pageCount > 1
    ? await Promise.all(Array.from({ length: pageCount - 1 }, (_, index) => getEmployees({ ...params, page: index + 2, limit: 100 })))
    : []

  return [firstPage, ...otherPages].flatMap((result) => result.items)
}
function buildCreatePayload(form) {
  const payload = {
    email: form.email,
    password: form.password,
    nama_lengkap: form.nama_lengkap,
    nomor_telepon: form.nomor_telepon,
    role: form.role,
    level_jabatan: form.level_jabatan,
    divisi: form.divisi,
    unit: form.unit || null,
  }

  if (form.atasan_langsung_id) payload.atasan_langsung_id = form.atasan_langsung_id

  return payload
}
function employeeId(employee) {
  return employee?.id ?? employee?.karyawan_id
}
function buildEmployeeParams({ page, limit = 10, query, filters = {} }) {
  return {
    page,
    limit,
    ...(query?.trim() ? { search: query.trim() } : {}),
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.level_jabatan ? { level_jabatan: filters.level_jabatan } : {}),
    ...(filters.divisi ? { divisi: filters.divisi } : {}),
    ...(filters.unit ? { unit: filters.unit } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  }
}
function toEmployeeRow(employee, nameById) {
  return {
    id: employee.id,
    photo: employee.foto_url,
    signature: signatureUrl(employee),
    name: employee.nama_lengkap || '-',
    phone: employee.nomor_telepon || '',
    email: employee.email || '',
    role: employee.role || '',
    position: employee.level_jabatan || '',
    managerId: employee.atasan_langsung_id != null ? String(employee.atasan_langsung_id) : '',
    manager: nameById.get(String(employee.atasan_langsung_id)) || '',
    division: employee.divisi || '-',
    unit: employee.unit || '-',
    status: titleCase(employee.status_karyawan),
  }
}

export default function EmployeeManagementPage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [managerCandidates, setManagerCandidates] = useState([])
  const [draftEmployees, setDraftEmployees] = useState([])
  const [editFiles, setEditFiles] = useState({})
  const [editFileErrors, setEditFileErrors] = useState({})
  const [editUploadErrors, setEditUploadErrors] = useState({})
  const [retryingEditUpload, setRetryingEditUpload] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ role: '', level_jabatan: '', divisi: '', unit: '', status: '' })
  const [openFilter, setOpenFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveLabel, setSaveLabel] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [exportMessage, setExportMessage] = useState('')
  const loadRequestId = useRef(0)
  const loadEmployees = useCallback(async (targetPage = page) => {
    const requestId = loadRequestId.current + 1
    loadRequestId.current = requestId
    setIsLoading(true)
    setErrorMessage('')

    try {
      const result = await getEmployees(buildEmployeeParams({ page: targetPage, limit: 10, query, filters }))
      if (requestId === loadRequestId.current) {
        setEmployees(result.items)
        setMeta(result.meta)
      }
      return result
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        authStorage.clearSession()
        navigate(ROUTES.login, { replace: true })
        return null
      }

      if (requestId === loadRequestId.current) {
        setErrorMessage(error.response?.data?.message || error.message || 'Gagal memuat data karyawan.')
      }
      return null
    } finally {
      if (requestId === loadRequestId.current) setIsLoading(false)
    }
  }, [filters, navigate, page, query])
  const loadManagers = useCallback(async () => { try { const candidates = await getAllEmployees({ status: 'aktif' }); const activeEmployees = candidates.filter(isActiveEmployee); setManagerCandidates(activeEmployees.length ? activeEmployees : candidates) } catch (error) { if ([401, 403].includes(error.response?.status)) { authStorage.clearSession(); navigate(ROUTES.login, { replace: true }) } } }, [navigate])
  // API load populates table state after mount, page, search, or status changes.
  useEffect(() => { loadEmployees() }, [loadEmployees])
  // Manager options are loaded separately so edit mode is not limited by the visible table page.
  useEffect(() => { loadManagers() }, [loadManagers])
  const managerOptions = useMemo(() => {
    const byId = new Map()
    ;[...managerCandidates, ...employees.filter(isActiveEmployee)].forEach((employee) => {
      if (employee?.id != null) byId.set(String(employee.id), employee)
    })
    return [...byId.values()].sort((first, second) => String(first.nama_lengkap || '').localeCompare(String(second.nama_lengkap || '')))
  }, [employees, managerCandidates])
  const nameById = useMemo(() => new Map([...managerOptions, ...employees].map((employee) => [String(employee.id), employee.nama_lengkap])), [employees, managerOptions])
  const records = useMemo(() => employees.map((employee) => toEmployeeRow(employee, nameById)), [employees, nameById])
  const rows = isEditMode ? draftEmployees : records
  const updateColumnFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setOpenFilter('')
    setPage(1)
  }
  const startEditing = () => { setDraftEmployees(records); setEditFiles({}); setEditFileErrors({}); setEditUploadErrors({}); setRetryingEditUpload(null); setSaveError(''); setIsEditMode(true) }
  const updateDraft = (id, key, value) => setDraftEmployees((items) => items.map((item) => item.id === id ? { ...item, [key]: value } : item))
  const cancel = () => { setDraftEmployees([]); setEditFiles({}); setEditFileErrors({}); setEditUploadErrors({}); setRetryingEditUpload(null); setSaveError(''); setIsEditMode(false) }
  const setEditFile = (id, kind, file) => {
    const error = fileError(file, kind === 'photo' ? photoTypes : signatureTypes, kind === 'signature' ? maxSignatureSize : null, kind === 'photo' ? 'Foto' : 'TTD')
    setEditFiles((current) => ({ ...current, [id]: { ...current[id], [kind]: error ? null : file } }))
    setEditFileErrors((current) => ({ ...current, [id]: { ...current[id], [kind]: error } }))
    setEditUploadErrors((current) => ({ ...current, [id]: { ...current[id], [kind]: '' } }))
  }
  const uploadEditFile = async (id, kind, file) => {
    if (kind === 'photo') await uploadEmployeePhoto(file, id)
    else await uploadEmployeeSignature(file, id)
  }
  const retryEditUpload = async (id, kind) => {
    const file = editFiles[id]?.[kind]
    if (!file) return
    setRetryingEditUpload(`${id}:${kind}`)
    try {
      await uploadEditFile(id, kind, file)
      setEditFiles((current) => ({ ...current, [id]: { ...current[id], [kind]: null } }))
      setEditUploadErrors((current) => ({ ...current, [id]: { ...current[id], [kind]: '' } }))
      await loadEmployees()
    } catch (error) {
      setEditUploadErrors((current) => ({ ...current, [id]: { ...current[id], [kind]: error.response?.data?.message || error.message || `${kind === 'photo' ? 'Foto' : 'TTD'} gagal diupload.` } }))
    } finally {
      setRetryingEditUpload(null)
    }
  }
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
    if (String(draft.managerId || '') !== String(original.managerId || '')) payload.atasan_langsung_id = draft.managerId || null
    return payload
  }
  const save = async () => {
    setSaveError('')
    setIsSaving(true)
    setSaveLabel('Menyimpan...')
    try {
      const hasFileErrors = Object.values(editFileErrors).some((errors) => Object.values(errors || {}).some(Boolean))
      if (hasFileErrors) throw new Error('Periksa kembali format atau ukuran file foto/TTD.')
      const originalById = new Map(records.map((employee) => [employee.id, employee]))
      const updates = draftEmployees.map((draft) => ({ draft, original: originalById.get(draft.id) })).filter(({ original }) => original).map(({ draft, original }) => ({ id: draft.id, payload: toUpdatePayload(draft, original), draft, original })).filter(({ payload }) => Object.keys(payload).length > 0)
      await Promise.all(updates.map(({ id, payload }) => updateEmployee(id, payload)))
      const selectedUploads = Object.entries(editFiles).flatMap(([id, files]) => ['photo', 'signature'].filter((kind) => files?.[kind]).map((kind) => ({ id, kind, file: files[kind] })))
      if (selectedUploads.length) setSaveLabel('Mengupload...')
      const nextUploadErrors = {}
      await Promise.all(selectedUploads.map(async ({ id, kind, file }) => {
        try {
          await uploadEditFile(id, kind, file)
        } catch (error) {
          nextUploadErrors[id] = { ...nextUploadErrors[id], [kind]: error.response?.data?.message || error.message || `${kind === 'photo' ? 'Foto' : 'TTD'} gagal diupload.` }
        }
      }))
      await loadEmployees()
      if (Object.keys(nextUploadErrors).length) {
        setEditUploadErrors(nextUploadErrors)
        setEditFiles((current) => Object.fromEntries(Object.entries(current).map(([id, files]) => [id, { photo: nextUploadErrors[id]?.photo ? files.photo : null, signature: nextUploadErrors[id]?.signature ? files.signature : null }])))
        setSaveError('Perubahan data tersimpan, tetapi ada file yang gagal diupload. Silakan retry file tersebut.')
        return
      }
      setDraftEmployees([])
      setEditFiles({})
      setEditFileErrors({})
      setEditUploadErrors({})
      setIsEditMode(false)
    } catch (error) {
      setSaveError(error.response?.data?.message || error.message || 'Gagal menyimpan perubahan karyawan.')
    } finally {
      setIsSaving(false)
      setSaveLabel('')
    }
  }
  const uploadCreateFiles = async (karyawanId, files, targetPage = page) => {
    const uploadErrors = {}

    if (files?.photo) {
      try {
        await uploadEmployeePhoto(files.photo, karyawanId)
      } catch (error) {
        uploadErrors.photo = error.response?.data?.message || error.message || 'Foto gagal diupload.'
      }
    }

    if (files?.signature) {
      try {
        await uploadEmployeeSignature(files.signature, karyawanId)
      } catch (error) {
        uploadErrors.signature = error.response?.data?.message || error.message || 'TTD gagal diupload.'
      }
    }

    await loadEmployees(targetPage)
    return uploadErrors
  }
  const create = async (form, files, setProgressLabel) => {
    setSaveError('')
    setExportMessage('')
    setPage(1)
    const employee = await createEmployee(buildCreatePayload(form))
    const karyawanId = employeeId(employee)

    if (!karyawanId) {
      await loadEmployees(1)
      return { karyawanId: null, uploadErrors: files?.photo || files?.signature ? { create: 'Karyawan berhasil dibuat, tetapi ID karyawan tidak tersedia untuk upload file.' } : {} }
    }

    if (files?.photo || files?.signature) setProgressLabel?.('Mengupload...')
    const uploadErrors = await uploadCreateFiles(karyawanId, files, 1)
    return { karyawanId, uploadErrors }
  }
  const retryCreateUpload = async (karyawanId, files) => ({ karyawanId, uploadErrors: await uploadCreateFiles(karyawanId, files, 1) })
  const downloadCsv = async () => {
    setSaveError('')
    setExportMessage('')
    setIsExporting(true)

    try {
      const filteredEmployees = uniqueById(await getAllEmployees(buildEmployeeParams({ page: 1, limit: 100, query, filters })))

      if (!filteredEmployees.length) {
        setSaveError('Tidak ada data untuk diunduh.')
        return
      }

      const exportNameById = new Map([...managerOptions, ...filteredEmployees].map((employee) => [String(employee.id), employee.nama_lengkap]))
      const exportRows = filteredEmployees.map((employee) => toEmployeeRow(employee, exportNameById))
      const headers = ['Nama', 'No. Telp', 'Email', 'Role', 'Jabatan', 'Atasan', 'Divisi', 'Unit', 'Status']
      const csvRows = exportRows.map((employee) => [employee.name, employee.phone, employee.email, employee.role, positionLabel(employee.position), employee.manager, employee.division, employee.unit, employee.status].map(csvValue).join(','))
      const csv = [headers.map(csvValue).join(','), ...csvRows].join('\n')
      const file = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = 'data-karyawan.csv'
      link.click()
      URL.revokeObjectURL(url)
      setExportMessage(`Berhasil mengekspor ${exportRows.length} data karyawan.`)
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        authStorage.clearSession()
        navigate(ROUTES.login, { replace: true })
        return
      }

      setSaveError(error.response?.data?.message || error.message || 'Gagal mengekspor data karyawan.')
    } finally {
      setIsExporting(false)
    }
  }
  const currentPage = meta.page || page
  const totalPages = meta.total_pages || 1
  const pageItems = paginationItems(currentPage, totalPages)
  return <div className={cn('mx-auto', isEditMode ? 'max-w-none' : 'max-w-[1040px]')}><header className="mb-9"><h2 className="text-[26px] font-bold leading-none tracking-[-.5px] text-slate-900">Kelola Karyawan</h2><p className="mt-2 text-[14px] text-slate-500">Kelola data karyawan yang terdaftar dalam sistem</p></header><section className="rounded-2xl bg-[#EF2427] p-5"><div className="flex flex-col gap-3 lg:flex-row"><label className="flex h-9 flex-1 items-center rounded-full bg-white px-6 sm:h-[36px]"><Search size={20} className="shrink-0 text-black" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} className="ml-4 w-full bg-transparent text-[13px] outline-none placeholder:text-slate-900" placeholder="Cari nama/email" /></label><button type="button" onClick={downloadCsv} disabled={isLoading || isExporting} className="flex h-9 items-center justify-center gap-2 rounded-full bg-white px-6 text-[13px] font-medium text-black disabled:opacity-60 lg:w-[214px]"><Download size={16} />{isExporting ? 'Menyiapkan...' : 'Unduh CSV'}</button></div></section><section className="mt-9 overflow-hidden rounded-2xl border border-slate-200 bg-white"><h3 className="border-b border-slate-200 px-6 py-4 text-[23px] font-bold tracking-[-.5px] text-slate-900">Data Karyawan</h3>{errorMessage ? <div className="p-10 text-center text-sm text-[#EF2427]"><p>{errorMessage}</p><button type="button" onClick={loadEmployees} className="mt-3 font-semibold text-[#1E93AB]">Coba lagi</button></div> : <div className="overflow-x-auto">{isEditMode ? <table className="w-full min-w-[1740px] text-left"><colgroup><col className="w-[96px]" /><col className="w-[96px]" /><col className="w-[190px]" /><col className="w-[155px]" /><col className="w-[220px]" /><col className="w-[135px]" /><col className="w-[145px]" /><col className="w-[185px]" /><col className="w-[180px]" /><col className="w-[190px]" /><col className="w-[125px]" /></colgroup><thead className="bg-[#F7F8FA] text-[12px] font-bold uppercase text-[#707989]"><tr><th className="px-3 py-4 whitespace-nowrap">Foto</th><th className="px-3 py-4 whitespace-nowrap">TTD</th><th className="px-3 py-4 whitespace-nowrap">Nama</th><th className="px-3 py-4 whitespace-nowrap">No. Telp</th><th className="px-3 py-4 whitespace-nowrap">Email</th><th className="px-3 py-4 whitespace-nowrap"><ColumnFilter id="role" label="Role" value={filters.role} options={roleFilters} openFilter={openFilter} onToggle={(id) => setOpenFilter((current) => current === id ? '' : id)} onChange={(value) => updateColumnFilter('role', value)} /></th><th className="px-3 py-4 whitespace-nowrap"><ColumnFilter id="level_jabatan" label="Jabatan" value={filters.level_jabatan} options={positionFilters} openFilter={openFilter} onToggle={(id) => setOpenFilter((current) => current === id ? '' : id)} onChange={(value) => updateColumnFilter('level_jabatan', value)} /></th><th className="px-3 py-4 whitespace-nowrap">Atasan</th><th className="px-3 py-4 whitespace-nowrap"><ColumnFilter id="divisi" label="Divisi" value={filters.divisi} options={divisionFilters} openFilter={openFilter} onToggle={(id) => setOpenFilter((current) => current === id ? '' : id)} onChange={(value) => updateColumnFilter('divisi', value)} /></th><th className="px-3 py-4 whitespace-nowrap"><ColumnFilter id="unit" label="Unit" value={filters.unit} options={unitFilters} openFilter={openFilter} onToggle={(id) => setOpenFilter((current) => current === id ? '' : id)} onChange={(value) => updateColumnFilter('unit', value)} /></th><th className="px-3 py-4 whitespace-nowrap"><ColumnFilter id="status" label="Status" value={filters.status} options={employeeStatusFilters} openFilter={openFilter} onToggle={(id) => setOpenFilter((current) => current === id ? '' : id)} onChange={(value) => updateColumnFilter('status', value)} /></th></tr></thead><tbody>{rows.map((employee) => <tr key={employee.id} className="border-t border-slate-200"><td className="px-3 py-2"><EditFilePicker employeeId={employee.id} kind="photo" label="Foto" currentUrl={employee.photo} file={editFiles[employee.id]?.photo} error={editFileErrors[employee.id]?.photo} uploadError={editUploadErrors[employee.id]?.photo} isRetrying={retryingEditUpload === `${employee.id}:photo`} disabled={isSaving || Boolean(retryingEditUpload)} onSelect={setEditFile} onRetry={retryEditUpload} /></td><td className="px-3 py-2"><EditFilePicker employeeId={employee.id} kind="signature" label="TTD" currentUrl={employee.signature} file={editFiles[employee.id]?.signature} error={editFileErrors[employee.id]?.signature} uploadError={editUploadErrors[employee.id]?.signature} isRetrying={retryingEditUpload === `${employee.id}:signature`} disabled={isSaving || Boolean(retryingEditUpload)} onSelect={setEditFile} onRetry={retryEditUpload} /></td><td className="px-3 py-2"><FieldInput value={employee.name} onChange={(value) => updateDraft(employee.id, 'name', value)} /></td><td className="px-3 py-2"><FieldInput value={employee.phone} onChange={(value) => updateDraft(employee.id, 'phone', value)} /></td><td className="px-3 py-2"><FieldInput value={employee.email} onChange={(value) => updateDraft(employee.id, 'email', value)} /></td><td className="px-3 py-2"><FieldSelect value={employee.role} onChange={(value) => updateDraft(employee.id, 'role', value)} options={roles} /></td><td className="px-3 py-2"><FieldSelect value={employee.position} onChange={(value) => updateDraft(employee.id, 'position', value)} options={positions} /></td><td className="px-3 py-2"><ManagerSelect value={employee.managerId} onChange={(value) => updateDraft(employee.id, 'managerId', value)} options={managerOptions.filter((manager) => String(manager.id) !== String(employee.id))} /></td><td className="px-3 py-2"><FieldInput value={employee.division} onChange={(value) => updateDraft(employee.id, 'division', value)} /></td><td className="px-3 py-2"><FieldInput value={employee.unit} onChange={(value) => updateDraft(employee.id, 'unit', value)} /></td><td className="px-3 py-2"><FieldSelect value={employee.status.toLowerCase()} onChange={(value) => updateDraft(employee.id, 'status', titleCase(value))} options={['aktif', 'nonaktif']} /></td></tr>)}</tbody></table> : <table className="w-full min-w-[1644px] text-left"><colgroup><col className="w-[96px]" /><col className="w-[190px]" /><col className="w-[155px]" /><col className="w-[220px]" /><col className="w-[135px]" /><col className="w-[145px]" /><col className="w-[185px]" /><col className="w-[180px]" /><col className="w-[190px]" /><col className="w-[125px]" /></colgroup><thead className="bg-[#F7F8FA] text-[12px] font-bold uppercase text-[#707989]"><tr><th className="px-3 py-4 whitespace-nowrap">Foto</th><th className="px-3 py-4 whitespace-nowrap">Nama</th><th className="px-3 py-4 whitespace-nowrap">No. Telp</th><th className="px-3 py-4 whitespace-nowrap">Email</th><th className="px-3 py-4 whitespace-nowrap"><ColumnFilter id="role" label="Role" value={filters.role} options={roleFilters} openFilter={openFilter} onToggle={(id) => setOpenFilter((current) => current === id ? '' : id)} onChange={(value) => updateColumnFilter('role', value)} /></th><th className="px-3 py-4 whitespace-nowrap"><ColumnFilter id="level_jabatan" label="Jabatan" value={filters.level_jabatan} options={positionFilters} openFilter={openFilter} onToggle={(id) => setOpenFilter((current) => current === id ? '' : id)} onChange={(value) => updateColumnFilter('level_jabatan', value)} /></th><th className="px-3 py-4 whitespace-nowrap">Atasan</th><th className="px-3 py-4 whitespace-nowrap"><ColumnFilter id="divisi" label="Divisi" value={filters.divisi} options={divisionFilters} openFilter={openFilter} onToggle={(id) => setOpenFilter((current) => current === id ? '' : id)} onChange={(value) => updateColumnFilter('divisi', value)} /></th><th className="px-3 py-4 whitespace-nowrap"><ColumnFilter id="unit" label="Unit" value={filters.unit} options={unitFilters} openFilter={openFilter} onToggle={(id) => setOpenFilter((current) => current === id ? '' : id)} onChange={(value) => updateColumnFilter('unit', value)} /></th><th className="px-3 py-4 whitespace-nowrap"><ColumnFilter id="status" label="Status" value={filters.status} options={employeeStatusFilters} openFilter={openFilter} onToggle={(id) => setOpenFilter((current) => current === id ? '' : id)} onChange={(value) => updateColumnFilter('status', value)} /></th></tr></thead><tbody>{isLoading ? <tr><td colSpan="10" className="p-10 text-center text-sm text-slate-500">Memuat data karyawan...</td></tr> : rows.length ? rows.map((employee) => <tr key={employee.id} className="border-t border-slate-200 text-[13px] text-black"><td className="px-3 py-3"><div className="flex flex-col items-center text-[9px] text-slate-400">{employee.photo ? <img src={employee.photo} alt="" className="size-10 rounded-full object-cover ring-1 ring-slate-200" /> : <span className="size-10 rounded-full bg-slate-100 ring-1 ring-slate-200" />}</div></td><td className="px-3 py-4 font-bold uppercase">{employee.name}</td><td className="px-3 py-4 font-semibold">{employee.phone || "-"}</td><td className="px-3 py-4 font-semibold">{employee.email || "-"}</td><td className="px-3 py-4 font-semibold">{titleCase(employee.role)}</td><td className="px-3 py-4 font-semibold">{positionLabel(employee.position)}</td><td className="px-3 py-4 font-semibold">{employee.manager || "-"}</td><td className="px-3 py-4 font-semibold">{employee.division}</td><td className="px-3 py-4 font-semibold">{employee.unit}</td><td className="px-3 py-4"><StatusBadge status={employee.status} /></td></tr>) : <tr><td colSpan="10" className="p-10 text-center text-sm text-slate-500">Data karyawan tidak ditemukan.</td></tr>}</tbody></table>}</div>}</section>{!errorMessage && !isEditMode && totalPages > 1 && <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm"><button type="button" disabled={currentPage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-full px-3 py-2 font-semibold text-[#1E93AB] transition hover:bg-[#EDF9FC] disabled:pointer-events-none disabled:text-slate-300 disabled:opacity-70">Sebelumnya</button>{pageItems.map((item, index) => item === '...' ? <span key={`${item}-${index}`} className="px-2 py-2 text-slate-400">...</span> : <button key={item} type="button" onClick={() => setPage(item)} className={cn('grid size-9 place-items-center rounded-full text-sm font-semibold transition', Number(currentPage) === item ? 'bg-[#EF2427] text-white shadow-sm' : 'text-[#1E93AB] hover:bg-[#EDF9FC]')}>{item}</button>)}<button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-full px-3 py-2 font-semibold text-[#1E93AB] transition hover:bg-[#EDF9FC] disabled:pointer-events-none disabled:text-slate-300 disabled:opacity-70">Berikutnya</button></div>}<div className="mt-7 flex justify-end gap-4">{isEditMode ? <><button type="button" onClick={save} disabled={isSaving} className="h-10 min-w-[140px] rounded-full bg-[#EF2427] px-7 text-[13px] font-bold text-white disabled:opacity-50">{saveLabel || 'Simpan'}</button><button type="button" onClick={cancel} disabled={isSaving} className="h-10 min-w-[140px] rounded-full border border-[#FFB1B1] bg-[#FDE8E8] px-7 text-[13px] font-bold text-[#EF2427] disabled:opacity-50">Batal</button></> : <><button type="button" onClick={() => setCreateOpen(true)} disabled={isLoading} className="flex h-10 items-center gap-3 rounded-full bg-[#EF2427] px-7 text-[13px] font-bold text-white disabled:opacity-50"><Plus size={16} />Tambah Karyawan</button><button type="button" onClick={startEditing} disabled={isLoading} className="flex h-10 items-center gap-3 rounded-full bg-[#EF2427] px-7 text-[13px] font-bold text-white disabled:opacity-50"><img src={penIcon} alt="" className="size-4 brightness-0 invert" />Edit Konfigurasi</button></>}</div>{exportMessage && <p className="mt-3 text-right text-sm font-medium text-[#1E93AB]">{exportMessage}</p>}{saveError && <p className="mt-3 text-right text-sm font-medium text-[#EF2427]">{saveError}</p>}<EmployeeCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreate={create} onRetryUpload={retryCreateUpload} managerOptions={managerOptions} /></div>
}




