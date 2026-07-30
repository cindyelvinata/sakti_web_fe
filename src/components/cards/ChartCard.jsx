import { Card,CardContent } from '@/components/ui/card'
export default function ChartCard({title,children}){return <Card className="min-w-0 bg-[#FCFCFD]"><CardContent className="p-4 sm:p-6"><h2 className="mb-4 text-center text-base font-bold text-slate-950 sm:text-xl">{title}</h2><div className="h-[220px] sm:h-[230px]">{children}</div></CardContent></Card>}
