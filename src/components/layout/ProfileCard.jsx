import { Avatar } from '@/components/ui/avatar'
import { Link } from 'react-router-dom'
import personIcon from '@/assets/icons/person_icons.svg'
import { ROUTES } from '@/constants/routes'
export default function ProfileCard(){return <Link to={ROUTES.profile} className="flex items-center gap-3 rounded-2xl bg-[#FBC0C0] p-3 transition hover:bg-[#F8B2B2]"><Avatar className="bg-[#E62727]"><img src={personIcon} alt="" className="size-[18px] brightness-0 invert"/></Avatar><div><p className="text-xs font-bold">Admin</p><p className="text-[10px] text-slate-600">Administrator</p></div></Link>}
