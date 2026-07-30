import { cn } from '@/lib/utils'
export function Badge({className,children}) { return <span className={cn('inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold',className)}>{children}</span> }
