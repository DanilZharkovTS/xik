'use client'

import { useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { toast } from 'sonner'

import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { Button } from '@/src/shared/ui/button'
import { Sheet } from '@/src/shared/ui/sheet'
import { teamService } from '../team.service'
import { generatePassword } from '../generate-password'
import { PasswordField } from './PasswordField'
import type { Moderator } from '../team.types'
import { useI18n } from '@/src/shared/i18n/use-i18n'

type ResetPasswordSheetProps = {
  moderator: Moderator | null
  token: string
  onClose: () => void
}

export function ResetPasswordSheet({
  moderator,
  token,
  onClose,
}: ResetPasswordSheetProps): ReactElement | null {
  const { t } = useI18n()
  const [password, setPassword] = useState(() => generatePassword())
  const [isSaving, setIsSaving] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const close = () => {
    setPassword(generatePassword())
    setIsDone(false)
    onClose()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!moderator) return

    try {
      setIsSaving(true)
      await teamService.resetPassword(moderator.id, password, token)
      setIsDone(true)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet
      title={t('team.reset.title')}
      isOpen={moderator !== null}
      onClose={close}
    >
      <p className="mb-4 break-all text-sm text-[var(--m)]">
        {moderator?.name} · {moderator?.email}
      </p>

      {isDone ? (
        <div className="space-y-4">
          <p className="text-base">
            {t('team.reset.done')}
          </p>

          <PasswordField value={password} onChange={() => undefined} />

          <Button className="min-h-11 w-full" onClick={close}>
            {t('team.done')}
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <PasswordField value={password} onChange={setPassword} />

          <Button
            type="submit"
            className="min-h-11 w-full"
            disabled={isSaving}
          >
            {isSaving ? t('team.reset.submitting') : t('team.reset.submit')}
          </Button>
        </form>
      )}
    </Sheet>
  )
}
