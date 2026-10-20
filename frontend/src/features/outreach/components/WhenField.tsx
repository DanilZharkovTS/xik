'use client'

import type { ReactElement } from 'react'

import { TextField } from '@/src/shared/ui/text-field'
import { useI18n } from '@/src/shared/i18n/use-i18n'

const pad = (value: number) => String(value).padStart(2, '0')

// Значення для datetime-local у часовому поясі браузера.
const toLocalInput = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`

// Порожнє поле означає "зараз"; заповнене переводиться в ISO з поясом браузера.
export const whenToIso = (value: string): string | undefined => {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

// Коли це було: для роботи, яку вносять пізніше (вчорашні повідомлення, відповідь у вихідні).
export function WhenField({ value, onChange }: { value: string; onChange: (value: string) => void }): ReactElement {
  const { t } = useI18n()

  return (
    <div className="space-y-1">
      <TextField
        label={t('when.label')}
        type="datetime-local"
        value={value}
        max={toLocalInput(new Date())}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-sm text-[var(--m)]">{t('when.hint')}</p>
    </div>
  )
}
