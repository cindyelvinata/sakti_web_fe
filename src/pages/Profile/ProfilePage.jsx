import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import personIcon from '@/assets/icons/person_icons.svg'
import emailIcon from '@/assets/icons/email_icons.svg'
import callIcon from '@/assets/icons/call_icons.svg'
import bagIcon from '@/assets/icons/bag_icons.svg'
import penIcon from '@/assets/icons/pen.svg'
import { ROUTES } from '@/constants/routes'
import { authStorage } from '@/lib/authStorage'
import { getEmployees, updateEmployee } from '@/services/employeeService'

const positions = [
  { label: 'Staff', value: 'staff' },
  { label: 'Kepala Unit', value: 'ka_unit' },
  { label: 'Officer', value: 'officer' },
  { label: 'Manager', value: 'manager' },
  { label: 'HRD', value: 'hrd' },
  { label: 'General Manager', value: 'gm' },
  { label: 'Supervisor', value: 'spv' },
]

const detailMeta = [
  { label: 'Nama', key: 'nama_lengkap', icon: personIcon, iconAlt: 'Ikon pengguna', iconClassName: 'size-[21px] icon-profile-detail' },
  { label: 'Email', key: 'email', icon: emailIcon, iconAlt: 'Ikon email', iconClassName: 'size-6 object-contain icon-profile-detail' },
  { label: 'Nomor Telepon', key: 'nomor_telepon', icon: callIcon, iconAlt: 'Ikon telepon', iconClassName: 'size-6' },
  { label: 'Jabatan', key: 'level_jabatan', icon: bagIcon, iconAlt: 'Ikon jabatan', iconClassName: 'size-[26px]' },
]

function normalize(value) {
  return String(value ?? '').trim().toLowerCase()
}

function sameUser(employee, currentUser) {
  if (!employee || !currentUser) return false
  if (employee.id != null && currentUser.id != null && String(employee.id) === String(currentUser.id)) return true
  return normalize(employee.email) && normalize(employee.email) === normalize(currentUser.email)
}

function titleCase(value) {
  return String(value || '-').split(/[\s_-]+/).filter(Boolean).map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`).join(' ') || '-'
}

function positionLabel(value) {
  return positions.find((position) => position.value === value)?.label || titleCase(value)
}

function profileDraft(profile) {
  return {
    foto_url: profile?.foto_url || '',
    nama_lengkap: profile?.nama_lengkap || '',
    email: profile?.email || '',
    nomor_telepon: profile?.nomor_telepon || '',
    level_jabatan: profile?.level_jabatan || '',
  }
}

function changedPayload(profile, draft) {
  return Object.entries(draft).reduce((payload, [key, value]) => {
    if (String(value || '') !== String(profile?.[key] || '')) payload[key] = value
    return payload
  }, {})
}

function syncSessionProfile(currentUser, profile) {
  authStorage.setSession({
    accessToken: authStorage.getAccessToken(),
    user: {
      ...currentUser,
      nama_lengkap: profile.nama_lengkap,
      name: profile.nama_lengkap,
      email: profile.email,
      foto_url: profile.foto_url,
      level_jabatan: profile.level_jabatan,
    },
  })
}

function ProfileFieldInput({ fieldKey, value, onChange, disabled }) {
  if (fieldKey === 'level_jabatan') {
    return <select value={value ?? ''} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="mt-0.5 w-full bg-transparent text-[15px] font-semibold text-black outline-none">
      <option value="">Pilih jabatan</option>
      {positions.map((position) => <option key={position.value} value={position.value}>{position.label}</option>)}
    </select>
  }

  return <input required={fieldKey === 'nama_lengkap' || fieldKey === 'email'} type={fieldKey === 'email' ? 'email' : 'text'} value={value ?? ''} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="mt-0.5 w-full bg-transparent text-[15px] font-semibold text-black outline-none" />
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [draft, setDraft] = useState(() => profileDraft(null))
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const loadProfile = useCallback(async () => {
    const currentUser = authStorage.getUser()

    if (!currentUser) {
      authStorage.clearSession()
      navigate(ROUTES.login, { replace: true })
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const adminResult = await getEmployees({ page: 1, limit: 100, role: 'admin' })
      let currentAdmin = adminResult.items.find((employee) => sameUser(employee, currentUser))

      if (!currentAdmin && currentUser.email) {
        const searchResult = await getEmployees({ page: 1, limit: 10, role: 'admin', search: currentUser.email })
        currentAdmin = searchResult.items.find((employee) => sameUser(employee, currentUser))
      }

      if (!currentAdmin) throw new Error('Data profil admin tidak ditemukan.')

      setProfile(currentAdmin)
      setDraft(profileDraft(currentAdmin))
      syncSessionProfile(currentUser, currentAdmin)
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        authStorage.clearSession()
        navigate(ROUTES.login, { replace: true })
        return
      }

      setErrorMessage(error.response?.data?.message || error.message || 'Gagal memuat profil admin.')
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  const setDraftField = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setActionMessage('')
  }

  const startEdit = () => {
    setDraft(profileDraft(profile))
    setIsEditing(true)
    setActionMessage('')
  }

  const cancelEdit = () => {
    setDraft(profileDraft(profile))
    setIsEditing(false)
    setActionMessage('')
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setActionMessage('')

    try {
      const currentUser = authStorage.getUser()
      if (!currentUser?.id) throw new Error('Session admin tidak memiliki ID user.')

      const payload = changedPayload(profile, draft)

      if (!Object.keys(payload).length) {
        setActionMessage('Tidak ada perubahan profil.')
        return
      }

      await updateEmployee(currentUser.id, payload)

      syncSessionProfile(currentUser, { ...profile, ...payload })

      await loadProfile()
      setIsEditing(false)
      setActionMessage('Profil berhasil diperbarui.')
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        authStorage.clearSession()
        navigate(ROUTES.login, { replace: true })
        return
      }

      setActionMessage(error.response?.data?.message || error.message || 'Gagal menyimpan profil admin.')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    // Profile data is loaded from the authenticated admin session.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile()
  }, [loadProfile])

  const details = useMemo(() => detailMeta.map((item) => ({
    ...item,
    value: item.key === 'level_jabatan' ? positionLabel(profile?.[item.key]) : profile?.[item.key] || '-',
  })), [profile])

  return <div className="max-w-[1000px]">
    <h2 className="text-[26px] font-bold leading-none text-slate-950">Informasi Profil</h2>
    <section className="mx-auto mt-7 max-w-[980px]">
      {isLoading ? <p className="p-10 text-center text-sm text-slate-500">Memuat profil admin...</p> : errorMessage ? <div className="p-10 text-center text-sm text-[#EF2427]"><p>{errorMessage}</p><button type="button" onClick={loadProfile} className="mt-3 font-semibold text-[#1E93AB]">Coba lagi</button></div> : <>
        <form onSubmit={saveProfile}>
          <div className="text-center"><div className="mx-auto grid size-[200px] place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#77B1DB] to-[#244A74]">{(isEditing ? draft.foto_url : profile?.foto_url) ? <img src={isEditing ? draft.foto_url : profile.foto_url} alt="Foto profil Admin" className="size-full object-cover" /> : <img src={personIcon} alt="Foto profil Admin" className="size-[94px] brightness-0 invert"/>}</div><h3 className="mt-6 text-2xl font-bold text-black">{isEditing ? draft.nama_lengkap || 'Admin' : profile?.nama_lengkap || 'Admin'}</h3><p className="mt-1 text-lg text-slate-500">{titleCase(profile?.role || 'Administrator')}</p>{isEditing && <label className="mx-auto mt-5 block max-w-[520px] rounded-2xl border border-slate-400 bg-[#FBFCFD] px-6 py-3.5 text-left text-[12px] font-semibold text-slate-700">URL Foto<input value={draft.foto_url} onChange={(event) => setDraftField('foto_url', event.target.value)} placeholder="https://..." disabled={isSaving} className="mt-1 w-full bg-transparent text-[15px] font-normal text-slate-800 outline-none" /></label>}</div>
          <div className="mt-7 space-y-7">{details.map(({ label, value, key, icon, iconAlt, iconClassName }) => <article key={label} className={`flex min-h-[90px] items-center gap-7 rounded-2xl border bg-[#FCFDFE] px-6 py-4 ${isEditing ? 'border-slate-400' : 'border-slate-300'}`}><div className="grid size-[54px] shrink-0 place-items-center rounded-lg bg-[#B7DFE9]"><img src={icon} alt={iconAlt} className={iconClassName}/></div><div className="min-w-0 flex-1"><p className="text-sm text-slate-500">{label}</p>{isEditing ? <ProfileFieldInput fieldKey={key} value={draft[key]} onChange={(nextValue) => setDraftField(key, nextValue)} disabled={isSaving} /> : <p className="mt-1 text-[15px] font-semibold text-black">{value}</p>}</div></article>)}</div>
          {actionMessage && <p className={`mt-5 text-right text-sm font-medium ${actionMessage.includes('berhasil') ? 'text-[#1E93AB]' : 'text-[#EF2427]'}`}>{actionMessage}</p>}
          <div className="mt-7 flex justify-end gap-4">{isEditing ? <><button type="submit" disabled={isSaving} className="h-10 min-w-[144px] rounded-full bg-[#EF2427] text-[13px] font-bold text-white disabled:opacity-60">{isSaving ? 'Menyimpan...' : 'Simpan'}</button><button type="button" onClick={cancelEdit} disabled={isSaving} className="h-10 min-w-[144px] rounded-full border border-red-200 bg-red-50 text-[13px] font-bold text-[#EF2427] disabled:opacity-60">Batal</button></> : <button type="button" onClick={startEdit} className="flex h-10 min-w-[144px] items-center justify-center gap-3 rounded-full bg-[#EF2427] px-7 text-[13px] font-bold text-white"><img src={penIcon} alt="" className="size-4 brightness-0 invert" />Edit Profil</button>}</div>
        </form>
      </>}
    </section>
  </div>
}
