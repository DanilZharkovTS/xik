import type { ReactElement } from 'react'

import { cn } from '@/src/shared/lib/cn'

type SegmentedProps<T extends string> = {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  className?: string
}

// Короткий вибір із 2-4 варіантів в одному "лотку": видно всі варіанти без відкриття списку.
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedProps<T>): ReactElement {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex rounded-full border border-[var(--l)] bg-[var(--s)] p-0.5', className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'min-h-9 flex-1 whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors',
            value === option.value
              ? 'bg-[var(--t)] text-[var(--bg)]'
              : 'text-[var(--m)] hover:text-[var(--t)]',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
