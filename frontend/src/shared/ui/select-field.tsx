import { useId } from 'react'
import type { ComponentPropsWithoutRef, ReactElement } from 'react'

import { cn } from '@/src/shared/lib/cn'

type SelectFieldProps = ComponentPropsWithoutRef<'select'> & {
  label: string
}

export function SelectField({
  label,
  className,
  id,
  children,
  ...props
}: SelectFieldProps): ReactElement {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="block text-sm text-[var(--m)]">
        {label}
      </label>

      <select
        id={selectId}
        className={cn(
          'min-h-10 w-full rounded-xl md:min-h-11 border border-[var(--l)] bg-[var(--bg)] px-3 text-base outline-none',
          'focus:border-[var(--t)]',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
