import type { ReactElement } from 'react'

import { cn } from '@/src/shared/lib/cn'

// Сірі заглушки на місці контенту, поки він вантажиться: макет не стрибає.
export function Skeleton({ className }: { className?: string }): ReactElement {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-[var(--l)]', className)} />
}

export function CardGridSkeleton({ count = 6, label }: { count?: number; label: string }): ReactElement {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <ul aria-hidden="true" className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <li key={index} className="space-y-3 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-3 md:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-2/3 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-1.5">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function RowsSkeleton({ rows = 6, label }: { rows?: number; label: string }): ReactElement {
  return (
    <div role="status" aria-live="polite" className="space-y-2">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-2xl" />
      ))}
    </div>
  )
}
