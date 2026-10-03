'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { toast } from 'sonner'

import { Button } from '@/src/shared/ui/button'
import { TextField } from '@/src/shared/ui/text-field'
import { generatePassword } from '../generate-password'

type PasswordFieldProps = {
  value: string
  onChange: (value: string) => void
}

// Пароль генерується в браузері й показується відкритим: адмін має його скопіювати й передати.
export function PasswordField({
  value,
  onChange,
}: PasswordFieldProps): ReactElement {
  const [isCopied, setIsCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setIsCopied(true)
    } catch {
      toast.error('Could not copy. Select the password and copy it manually.')
    }
  }

  return (
    <div className="space-y-2">
      <TextField
        label="Password (8-72 characters)"
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
          Generate
        </Button>

        <Button
          variant="secondary"
          className="min-h-11"
          disabled={!value}
          onClick={copy}
        >
          {isCopied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  )
}
