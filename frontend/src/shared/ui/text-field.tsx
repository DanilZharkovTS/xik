import { useId } from 'react'
import type { ComponentPropsWithoutRef, ReactElement } from 'react'

import { cn } from '@/src/shared/lib/cn'

type TextFieldProps = ComponentPropsWithoutRef<'input'> & {
  label: string
}

// text-base (16px) і висота 44px: iOS не наближає екран при фокусі, у поле легко влучити.
export function TextField({
  label,
  className,
  id,
  ...props
}: TextFieldProps): ReactElement {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-sm text-[var(--m)]"
      >
        {label}
      </label>

      <input
        id={inputId}
        className={cn(
          'min-h-10 w-full rounded-xl md:min-h-11 border border-[var(--l)] bg-[var(--bg)] px-3 text-base outline-none',
          'focus:border-[var(--t)]',
          className,
        )}
        {...props}
      />
    </div>
  )
}
