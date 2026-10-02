import type { ComponentPropsWithoutRef, ReactElement } from 'react'

import { cn } from '@/src/shared/lib/cn'

type ButtonVariant = 'primary' | 'secondary'

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant
}

// Мінімум 44px заввишки: у кнопку легко влучити пальцем.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'border-[var(--t)] bg-[var(--t)] text-[var(--bg)] hover:opacity-90',
  secondary:
    'border-[var(--l)] bg-transparent text-[var(--t)] hover:border-[var(--t)]',
}

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ButtonProps): ReactElement {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-full border px-5 py-2 text-base font-medium transition-all',
        'active:scale-95 disabled:pointer-events-none disabled:opacity-50',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  )
}
