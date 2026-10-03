import type { ReactElement, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

// Другорядні поля згорнуті, щоб головне (коментар) було першим і форма лишалась короткою.
export function OptionalDetails({
  summary,
  children,
}: {
  summary: string
  children: ReactNode
}): ReactElement {
  return (
    <details className="group rounded-xl border border-[var(--l)] px-3">
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 text-sm text-[var(--m)] [&::-webkit-details-marker]:hidden">
        {summary}
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="space-y-3 pb-3">{children}</div>
    </details>
  )
}
