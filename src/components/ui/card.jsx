import { cn } from '@/lib/utils'
export function Card({className,children,...props}) { return <section className={cn('rounded-2xl border border-slate-200 bg-white',className)} {...props}>{children}</section> }
export function CardContent({className,children,...props}) { return <div className={cn('p-5',className)} {...props}>{children}</div> }
