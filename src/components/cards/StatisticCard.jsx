import { Card,CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import upIcon from '@/assets/icons/up_icons.svg'
import downIcon from '@/assets/icons/down_icons.svg'
export default function StatisticCard({label,value,change,trend}){const up=trend==='up';return <Card className="h-[148px] w-full border border-[#B7DFE9] bg-[#EDF9FC] transition duration-200 hover:-translate-y-1 hover:shadow-lg"><CardContent className="relative flex h-full flex-col p-[16px]"><Badge className="ml-auto gap-[2px] bg-[#1E93AB] px-[10px] py-[5px] text-[11px] font-medium leading-none text-white"><img src={up?upIcon:downIcon} alt="" className="size-[13px] brightness-0 invert"/>{change}</Badge><p className="mt-auto text-[48px] font-bold leading-none text-black">{value}</p><p className="mt-[8px] text-[13px] font-normal leading-none text-slate-950">{label}</p></CardContent></Card>}



