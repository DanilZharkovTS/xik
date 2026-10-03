'use client'

import { useId, useState } from 'react'
import type { ReactElement } from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { cn } from '@/src/shared/lib/cn'
import { useI18n } from '@/src/shared/i18n/use-i18n'
import { Sheet } from './sheet'

export type PickerOption = { value: string; label: string }

type PickerProps = {
  label: string
  value: string
  options: PickerOption[]
  onChange: (value: string) => void
  // Підпис лишається для екранних читачів, але не займає місця.
  hideLabel?: boolean
  // Заокруглення "пігулкою" для вибору в панелях фільтрів.
  pill?: boolean
  className?: string
  disabled?: boolean
}

// Замість рідного select: його список малює браузер, виходить за екран і не стилізується.
// Вибір іде у шторку: знизу на телефоні, модальним вікном на десктопі.
export function Picker({
  label,
  value,
  options,
  onChange,
  hideLabel,
  pill,
  className,
  disabled,
}: PickerProps): ReactElement {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const buttonId = useId()
  const selected = options.find((option) => option.value === value)

  return (
    <div className={cn('min-w-0', !hideLabel && 'space-y-1.5')}>
      <label
        htmlFor={buttonId}
        className={hideLabel ? 'sr-only' : 'block text-sm text-[var(--m)]'}
      >
        {label}
      </label>

      <button
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex min-h-10 w-full items-center justify-between gap-2 border border-[var(--l)] bg-[var(--bg)] px-3 text-left text-base outline-none focus-visible:border-[var(--t)] disabled:opacity-50 md:min-h-11',
          pill ? 'rounded-full px-4' : 'rounded-xl',
          className,
        )}
      >
        <span className={cn('truncate', !selected && 'text-[var(--m)]')}>
          {selected?.label ?? t('common.select')}
        </span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--m)]" />
      </button>

      <Sheet title={label} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ul className="-mx-1 space-y-0.5">
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <li key={option.value}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-base',
                    isSelected ? 'bg-[var(--s)] font-medium' : 'hover:bg-[var(--s)]',
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check aria-hidden="true" className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      </Sheet>
    </div>
  )
}
