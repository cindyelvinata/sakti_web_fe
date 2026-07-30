import { cn } from '@/lib/utils'
export function Avatar({className,children}) { return <div className={cn('flex size-9 items-center justify-center overflow-hidden rounded-full',className)}>{children}</div> }
