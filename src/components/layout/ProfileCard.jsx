import { Avatar } from '@/components/ui/avatar'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import personIcon from '@/assets/icons/person_icons.svg'
import { ROUTES } from '@/constants/routes'
import { authStorage } from '@/lib/authStorage'

const positions = [
  { label: 'Staff', value: 'staff' },
  { label: 'Kepala Unit', value: 'ka_unit' },
  { label: 'Officer', value: 'officer' },
  { label: 'Manager', value: 'manager' },
  { label: 'HRD', value: 'hrd' },
  { label: 'General Manager', value: 'gm' },
  { label: 'Supervisor', value: 'spv' },
]

function titleCase(value) {
  return String(value || '-').split(/[\s_-]+/).filter(Boolean).map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`).join(' ') || '-'
}

function positionLabel(value) {
  return positions.find((position) => position.value === value)?.label || titleCase(value)
}

function displayName(user) {
  return user?.nama_lengkap || user?.name || user?.email || 'Admin'
}

export default function ProfileCard(){
  const [user, setUser] = useState(() => authStorage.getUser())

  useEffect(() => {
    const refreshUser = () => setUser(authStorage.getUser())
    window.addEventListener('admin-auth:session-changed', refreshUser)
    window.addEventListener('storage', refreshUser)
    return () => {
      window.removeEventListener('admin-auth:session-changed', refreshUser)
      window.removeEventListener('storage', refreshUser)
    }
  }, [])

  return <Link to={ROUTES.profile} className="flex items-center gap-3 rounded-2xl bg-[#FBC0C0] p-3 transition hover:bg-[#F8B2B2]"><Avatar className="bg-[#E62727]">{user?.foto_url?<img src={user.foto_url} alt="" className="size-full object-cover"/>:<img src={personIcon} alt="" className="size-[18px] brightness-0 invert"/>}</Avatar><div className="min-w-0"><p className="truncate text-xs font-bold">{displayName(user)}</p><p className="truncate text-[10px] text-slate-600">{user?.level_jabatan ? positionLabel(user.level_jabatan) : 'Administrator'}</p></div></Link>
}
