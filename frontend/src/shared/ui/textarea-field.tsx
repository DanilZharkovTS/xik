import { forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/src/shared/lib/cn'

type TextareaFieldProps = ComponentPropsWithoutRef<'textarea'> & {
  label: string
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField({ label, className, id, ...props }, ref) {
    const generatedId = useId()
    const textareaId = id ?? generatedId

    return (
      <div className="space-y-1.5">
        <label htmlFor={textareaId} className="block text-sm text-[var(--m)]">
          {label}
        </label>

        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'min-h-20 w-full rounded-xl border border-[var(--l)] bg-[var(--bg)] px-3 py-2 text-base outline-none',
            'focus:border-[var(--t)]',
            className,
          )}
          {...props}
        />
      </div>
    )
  },
)
