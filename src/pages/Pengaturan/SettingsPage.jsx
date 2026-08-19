import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Building2, ImageUp, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import penIcon from '@/assets/icons/pen.svg'
import HolidayCreateDialog from '@/components/dialogs/HolidayCreateDialog'
import { createHoliday, deleteHoliday, getHolidays, getWorkConfiguration, updateHoliday, updateWorkConfiguration, uploadWorkConfigurationLogo } from '@/services/settingsService'

const emptyConfiguration = { nama_kantor: '', radius_kantor: '', jam_masuk: '', jam_minimal_masuk: '', jam_pulang: '', jam_minimal_pulang: '', lat_kantor: '', long_kantor: '', logo_kantor: '' }
const fields = [['nama_kantor', 'Nama Kantor'], ['radius_kantor', 'Batas Radius'], ['jam_masuk', 'Jam Masuk'], ['jam_minimal_masuk', 'Batas Jam Masuk'], ['jam_pulang', 'Jam Keluar'], ['jam_minimal_pulang', 'Batas Jam Keluar'], ['lat_kantor', 'Latitude'], ['long_kantor', 'Longitude']]
const timeFields = new Set(['jam_masuk', 'jam_minimal_masuk', 'jam_pulang', 'jam_minimal_pulang'])
const logoTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']

function asTime(value) { return value ? String(value).slice(0, 5) : '' }
function asDate(value) { return value ? String(value).slice(0, 10) : '' }
function displayDate(value) { const [year, month, day] = asDate(value).split('-'); return year ? `${Number(month)}/${Number(day)}/${year}` : '-' }
function holidayType(value) { return value === 'cuti_bersama' ? 'Cuti Bersama' : 'Nasional' }
function activeValue(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true' || value.trim() === '1'
  return value === 1
}
function toHolidayDraft(item) { return { ...item, tanggal: asDate(item.tanggal), jenis: item.jenis || 'nasional', aktif: activeValue(item.aktif) } }
function holidayPayload(item) { return { tanggal: item.tanggal, nama: item.nama, jenis: item.jenis, aktif: activeValue(item.aktif) } }

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'holiday' ? 'holiday' : 'configuration'
  const logoInputRef = useRef(null)
  const [configuration, setConfiguration] = useState(emptyConfiguration)
  const [draft, setDraft] = useState(emptyConfiguration)
  const [editingConfiguration, setEditingConfiguration] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [isSavingConfiguration, setIsSavingConfiguration] = useState(false)
  const [configurationLoadingLabel, setConfigurationLoadingLabel] = useState('')
  const [holidays, setHolidays] = useState([])
  const [holidayDraft, setHolidayDraft] = useState([])
  const [editingHolidays, setEditingHolidays] = useState(false)
  const [holidayCreateOpen, setHolidayCreateOpen] = useState(false)
  const [isSavingHolidays, setIsSavingHolidays] = useState(false)
  const [deletingHolidayId, setDeletingHolidayId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [actionError, setActionError] = useState('')

  const clearLogoSelection = useCallback(() => {
    setLogoFile(null)
    setLogoPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return ''
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const [config, holidayResult] = await Promise.all([getWorkConfiguration(), getHolidays()])
      setConfiguration(config)
      setDraft(config)
      setHolidays(holidayResult.items.map(toHolidayDraft))
      clearLogoSelection()
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Gagal memuat pengaturan.')
    } finally {
      setLoading(false)
    }
  }, [clearLogoSelection])

  // Initial server load populates settings state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])
  useEffect(() => () => clearLogoSelection(), [clearLogoSelection])

  const changeTab = (nextTab) => setSearchParams((current) => {
    const params = new URLSearchParams(current)
    params.set('tab', nextTab)
    return params
  })

  const selectLogo = (file) => {
    if (!file) return

    if (!logoTypes.includes(file.type)) {
      setActionError('Logo harus berformat jpg, png, jpeg, atau webp.')
      return
    }

    clearLogoSelection()
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setActionError('')
  }

  const saveConfiguration = async () => {
    setActionError('')
    setIsSavingConfiguration(true)
    setConfigurationLoadingLabel(logoFile ? 'Mengupload...' : 'Menyimpan...')

    try {
      const logoUrl = logoFile ? await uploadWorkConfigurationLogo(logoFile) : draft.logo_kantor
      setConfigurationLoadingLabel('Menyimpan...')
      const payload = {
        nama_kantor: draft.nama_kantor,
        lat_kantor: Number(draft.lat_kantor),
        long_kantor: Number(draft.long_kantor),
        radius_kantor: Number(draft.radius_kantor),
        jam_masuk: `${asTime(draft.jam_masuk)}:00`,
        jam_minimal_masuk: `${asTime(draft.jam_minimal_masuk)}:00`,
        jam_pulang: `${asTime(draft.jam_pulang)}:00`,
        jam_minimal_pulang: `${asTime(draft.jam_minimal_pulang)}:00`,
        logo_kantor: logoUrl || undefined,
      }

      await updateWorkConfiguration(payload)
      await load()
      setEditingConfiguration(false)
    } catch (error) {
      setActionError(error.response?.data?.message || error.message || 'Gagal menyimpan konfigurasi kerja.')
    } finally {
      setIsSavingConfiguration(false)
      setConfigurationLoadingLabel('')
    }
  }

  const updateDraftHoliday = (id, key, value) => setHolidayDraft((items) => items.map((item) => item.id === id ? { ...item, [key]: value } : item))
  const startHolidayEdit = () => { setHolidayDraft(holidays.map(toHolidayDraft)); setEditingHolidays(true); setActionError('') }
  const saveHolidays = async () => {
    setActionError('')
    setIsSavingHolidays(true)

    try {
      const updates = holidayDraft.filter((draftItem) => {
        const original = holidays.find((item) => item.id === draftItem.id)
        return original && (original.tanggal !== draftItem.tanggal || original.nama !== draftItem.nama || original.jenis !== draftItem.jenis || Boolean(original.aktif) !== Boolean(draftItem.aktif))
      })

      await Promise.all(updates.map((item) => updateHoliday(item.id, holidayPayload(item))))
      await load()
      setEditingHolidays(false)
    } catch (error) {
      setActionError(error.response?.data?.message || error.message || 'Gagal menyimpan hari libur.')
    } finally {
      setIsSavingHolidays(false)
    }
  }
  const create = async (holiday) => { setActionError(''); await createHoliday({ tanggal: holiday.date, nama: holiday.name, jenis: holiday.type === 'Cuti Bersama' ? 'cuti_bersama' : 'nasional', aktif: true }); await load() }
  const removeHoliday = async (id) => { setActionError(''); setDeletingHolidayId(id); try { await deleteHoliday(id); await load() } catch (error) { setActionError(error.response?.data?.message || error.message || 'Gagal menghapus hari libur.') } finally { setDeletingHolidayId(null) } }
  const logoSrc = logoPreview || draft.logo_kantor || configuration.logo_kantor

  return <div className="max-w-[1120px]">
    <header className="mb-5">
      <h2 className="text-[26px] font-bold leading-none text-slate-950">Pengaturan</h2>
      <p className="mt-2 text-sm text-slate-500">Kelola hari libur dan konfigurasi kerja sebagai acuan sistem</p>
    </header>
    <div className="grid w-full grid-cols-2 gap-3 text-sm font-semibold">
      <button type="button" onClick={() => changeTab('configuration')} className={cn('h-12 rounded-xl bg-red-50 px-6 text-[#EF2427] transition hover:bg-[#FBC0C0] hover:text-slate-950', tab === 'configuration' && 'bg-[#FBC0C0] text-slate-950')}>Konfigurasi Kerja</button>
      <button type="button" onClick={() => changeTab('holiday')} className={cn('h-12 rounded-xl bg-red-50 px-6 text-[#EF2427] transition hover:bg-[#FBC0C0] hover:text-slate-950', tab === 'holiday' && 'bg-[#FBC0C0] text-slate-950')}>Hari Libur</button>
    </div>
    {loading ? <p className="p-10 text-center text-sm text-slate-500">Memuat pengaturan...</p> : errorMessage ? <div className="p-10 text-center text-sm text-[#EF2427]"><p>{errorMessage}</p><button type="button" onClick={load} className="mt-3 font-semibold text-[#1E93AB]">Coba lagi</button></div> : tab === 'configuration' ? <section className="pt-6">
      <form onSubmit={(event) => { event.preventDefault(); saveConfiguration() }}>
        <div className={cn('rounded-2xl border bg-[#FCFDFE] p-5 sm:p-6', editingConfiguration ? 'border-slate-400' : 'border-slate-200')}>
          <div className="flex flex-wrap items-center gap-5 border-b border-slate-200 pb-5">
            {editingConfiguration ? <>
              <button type="button" onClick={() => logoInputRef.current?.click()} disabled={isSavingConfiguration} className="grid size-[88px] place-items-center overflow-hidden rounded-full border border-slate-300 bg-white text-[#1E93AB] transition hover:border-[#1E93AB] disabled:opacity-60">
                {logoSrc ? <img src={logoSrc} alt="Logo kantor" className="size-14 rounded-full object-contain" /> : <ImageUp size={31} />}
              </button>
              <input ref={logoInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => selectLogo(event.target.files?.[0] || null)} className="hidden" disabled={isSavingConfiguration} />
              <div className="self-center"><p className="font-semibold">Logo Kantor</p></div>
            </> : <>
              <div className="grid size-[88px] place-items-center rounded-full border border-slate-300 bg-white">{configuration.logo_kantor ? <img src={configuration.logo_kantor} alt="Logo kantor" className="size-14 rounded-full object-contain" /> : <Building2 size={30} className="text-[#EF2427]" />}</div>
              <div className="self-center"><p className="font-semibold">Logo Kantor</p></div>
            </>}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {fields.map(([key, label]) => <label key={key} className={cn('rounded-2xl border bg-[#FBFCFD] px-6 py-3.5', editingConfiguration ? 'border-slate-400' : 'border-slate-200')}>
              <p className="text-sm font-semibold text-black">{label}</p>
              {editingConfiguration ? <input required value={timeFields.has(key) ? asTime(draft[key]) : draft[key] ?? ''} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} disabled={isSavingConfiguration} className="mt-0.5 w-full bg-transparent text-[15px] text-slate-800 outline-none disabled:text-slate-400" /> : <p className="mt-0.5 text-[15px] text-slate-800">{key === 'radius_kantor' ? `${configuration[key] ?? '-'} m` : timeFields.has(key) ? asTime(configuration[key]) : configuration[key] ?? '-'}</p>}
            </label>)}
          </div>
        </div>
        {editingConfiguration && <div className="mt-5 flex justify-center gap-4">
          <button disabled={isSavingConfiguration} className="h-12 min-w-40 rounded-full bg-[#EF2427] px-7 text-sm font-semibold text-white disabled:opacity-60">{configurationLoadingLabel || 'Simpan'}</button>
          <button type="button" onClick={() => { setDraft(configuration); clearLogoSelection(); setEditingConfiguration(false) }} disabled={isSavingConfiguration} className="h-12 min-w-40 rounded-full border border-red-200 bg-red-50 px-7 text-sm font-semibold text-[#EF2427] disabled:opacity-60">Batal</button>
        </div>}
      </form>
      {!editingConfiguration && <div className="mt-7 flex justify-end"><button type="button" onClick={() => { setDraft(configuration); clearLogoSelection(); setEditingConfiguration(true) }} className="flex h-10 items-center gap-3 rounded-full bg-[#EF2427] px-7 text-[13px] font-bold text-white"><img src={penIcon} alt="" className="size-4 brightness-0 invert" />Edit Konfigurasi</button></div>}
    </section> : <section className="pt-12">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <h3 className="border-b border-slate-200 px-6 py-4 text-[23px] font-bold text-slate-900">Kalender Hari Libur</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-[#F7F8FA] text-[12px] font-bold uppercase text-[#707989]"><tr><th className="px-6 py-4">Nomor</th><th className="px-5 py-4">Tanggal</th><th className="px-5 py-4">Nama</th><th className="px-5 py-4">Jenis Cuti</th><th className="px-5 py-4">Aktif</th>{editingHolidays && <th className="px-5 py-4 text-center">Aksi</th>}</tr></thead>
            <tbody>{(editingHolidays ? holidayDraft : holidays).map((holiday, index) => <tr key={holiday.id} className="border-t border-slate-200 text-[13px] text-black">
              <td className="px-6 py-4 font-semibold">{index + 1}</td>
              <td className="px-5 py-4">{editingHolidays ? <input type="date" value={holiday.tanggal} onChange={(event) => updateDraftHoliday(holiday.id, 'tanggal', event.target.value)} disabled={isSavingHolidays || Boolean(deletingHolidayId)} className="h-9 w-[140px] rounded-xl border border-slate-300 px-3 text-[12px] outline-none disabled:opacity-60" /> : <span className="font-semibold">{displayDate(holiday.tanggal)}</span>}</td>
              <td className="px-5 py-4">{editingHolidays ? <input value={holiday.nama} onChange={(event) => updateDraftHoliday(holiday.id, 'nama', event.target.value)} disabled={isSavingHolidays || Boolean(deletingHolidayId)} className="h-9 w-[220px] rounded-xl border border-slate-300 px-3 text-[12px] outline-none disabled:opacity-60" /> : <span className="font-semibold">{holiday.nama}</span>}</td>
              <td className="px-5 py-4">{editingHolidays ? <select value={holiday.jenis} onChange={(event) => updateDraftHoliday(holiday.id, 'jenis', event.target.value)} disabled={isSavingHolidays || Boolean(deletingHolidayId)} className="h-9 w-[140px] rounded-xl border border-slate-300 px-3 text-[12px] outline-none disabled:opacity-60"><option value="nasional">Nasional</option><option value="cuti_bersama">Cuti Bersama</option></select> : <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-bold uppercase text-[#EF2427]">{holidayType(holiday.jenis)}</span>}</td>
              <td className="px-5 py-4">{editingHolidays ? <div className="flex gap-3"><button type="button" disabled={isSavingHolidays || Boolean(deletingHolidayId)} onClick={() => updateDraftHoliday(holiday.id, 'aktif', true)} className={cn('h-9 rounded-xl border px-3 text-[10px] font-bold disabled:opacity-60', holiday.aktif ? 'border-[#B7DFE9] bg-[#EDF9FC] text-[#1E93AB]' : 'border-slate-300 text-slate-500')}>YA</button><button type="button" disabled={isSavingHolidays || Boolean(deletingHolidayId)} onClick={() => updateDraftHoliday(holiday.id, 'aktif', false)} className={cn('h-9 rounded-xl border px-3 text-[10px] font-bold disabled:opacity-60', !holiday.aktif ? 'border-red-200 bg-red-50 text-[#EF2427]' : 'border-slate-300 text-slate-500')}>TIDAK</button></div> : <span className="rounded-full border border-[#B7DFE9] bg-[#EDF9FC] px-4 py-1 text-[10px] font-bold text-[#1E93AB]">{holiday.aktif ? 'YA' : 'TIDAK'}</span>}</td>
              {editingHolidays && <td className="px-5 py-4 text-center"><button type="button" disabled={isSavingHolidays || Boolean(deletingHolidayId)} onClick={() => removeHoliday(holiday.id)} className="grid size-9 place-items-center rounded-lg border border-red-200 bg-red-50 text-[#EF2427] disabled:opacity-60">{deletingHolidayId === holiday.id ? <span className="text-[9px] font-bold">...</span> : <Trash2 size={14} />}</button></td>}
            </tr>)}</tbody>
          </table>
        </div>
      </div>
      <div className="mt-7 flex justify-end gap-4">{editingHolidays ? <><button type="button" onClick={saveHolidays} disabled={isSavingHolidays || Boolean(deletingHolidayId)} className="h-10 min-w-[144px] rounded-full bg-[#EF2427] text-[13px] font-bold text-white disabled:opacity-60">{isSavingHolidays ? 'Menyimpan...' : 'Simpan'}</button><button type="button" onClick={() => { setHolidayDraft(holidays.map(toHolidayDraft)); setEditingHolidays(false) }} disabled={isSavingHolidays || Boolean(deletingHolidayId)} className="h-10 min-w-[144px] rounded-full border border-red-200 bg-red-50 text-[13px] font-bold text-[#EF2427] disabled:opacity-60">Batal</button></> : <><button type="button" onClick={() => setHolidayCreateOpen(true)} className="flex h-10 items-center gap-3 rounded-full bg-[#EF2427] px-7 text-[13px] font-bold text-white"><Plus size={16} />Tambah Hari Libur</button><button type="button" onClick={startHolidayEdit} className="flex h-10 items-center gap-3 rounded-full border border-red-200 bg-red-50 px-7 text-[13px] font-bold text-[#EF2427]"><img src={penIcon} alt="" className="size-4" />Edit Konfigurasi</button></>}</div>
    </section>}
    {actionError && <p className="mt-4 text-right text-sm font-medium text-[#EF2427]">{actionError}</p>}
    <HolidayCreateDialog open={holidayCreateOpen} onClose={() => setHolidayCreateOpen(false)} onCreate={create} />
  </div>
}
