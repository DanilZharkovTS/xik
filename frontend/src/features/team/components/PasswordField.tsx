'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { toast } from 'sonner'

import { Button } from '@/src/shared/ui/button'
import { TextField } from '@/src/shared/ui/text-field'
import { generatePassword } from '../generate-password'
import { useI18n } from '@/src/shared/i18n/use-i18n'

type PasswordFieldProps = {
  value: string
  onChange: (value: string) => void
}

// Пароль генерується в браузері й показується відкритим: адмін має його скопіювати й передати.
export function PasswordField({
  value,
  onChange,
}: PasswordFieldProps): ReactElement {
  const { t } = useI18n()
  const [isCopied, setIsCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setIsCopied(true)
    } catch {
      toast.error(t('team.pw.copyFailed'))
    }
  }

  return (
    <div className="space-y-2">
      <TextField
        label={t('team.pw.label')}
        type="text"
        value={value}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        minLength={8}
        maxLength={72}
        required
        className="font-mono"
        onChange={(event) => {
          setIsCopied(false)
          onChange(event.target.value)
        }}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          className="min-h-11"
          onClick={() => {
            setIsCopied(false)
            onChange(generatePassword())
          }}
        >
          {t('team.pw.generate')}
        </Button>

        <Button
          variant="secondary"
          className="min-h-11"
          disabled={!value}
          onClick={copy}
        >
          {isCopied ? t('team.pw.copied') : t('team.pw.copy')}
        </Button>
      </div>
    </div>
  )
}
