'use client'

import { useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { toast } from 'sonner'

import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { Button } from '@/src/shared/ui/button'
import { Sheet } from '@/src/shared/ui/sheet'
import { TextField } from '@/src/shared/ui/text-field'
import { teamService } from '../team.service'
import { generatePassword } from '../generate-password'
import { PasswordField } from './PasswordField'

type CreateModeratorSheetProps = {
  isOpen: boolean
  token: string
  onClose: () => void
  onCreated: () => Promise<void>
}

export function CreateModeratorSheet({
  isOpen,
  token,
  onClose,
  onCreated,
}: CreateModeratorSheetProps): ReactElement | null {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState(() => generatePassword())
  const [isSaving, setIsSaving] = useState(false)
  // Після створення пароль лишається на екрані, щоб адмін його скопіював.
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)

  const close = () => {
    setName('')
    setEmail('')
    setPassword(generatePassword())
    setCreatedPassword(null)
    onClose()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()

    try {
      setIsSaving(true)
      await teamService.createModerator({ name, email, password }, token)
      setCreatedPassword(password)
      await onCreated()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet title="Add moderator" isOpen={isOpen} onClose={close}>
      {createdPassword ? (
        <div className="space-y-4">
          <p className="text-base">
            Account created. Send these credentials to the moderator. The
            password will not be shown again.
          </p>

          <PasswordField value={createdPassword} onChange={() => undefined} />

          <p className="break-all text-sm text-[var(--m)]">{email}</p>

          <Button className="min-h-11 w-full" onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <TextField
            label="Name"
            value={name}
            maxLength={50}
            required
            autoComplete="off"
            onChange={(event) => setName(event.target.value)}
          />

          <TextField
            label="Email"
            type="email"
            inputMode="email"
            value={email}
            required
            autoComplete="off"
            autoCapitalize="off"
            onChange={(event) => setEmail(event.target.value)}
          />

          <PasswordField value={password} onChange={setPassword} />

          <Button
            type="submit"
            className="min-h-11 w-full"
            disabled={isSaving}
          >
            {isSaving ? 'Creating...' : 'Create moderator'}
          </Button>
        </form>
      )}
    </Sheet>
  )
}
