'use client'

import { useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { toast } from 'sonner'

import { Button } from '@/src/shared/ui/button'
import { SelectField } from '@/src/shared/ui/select-field'
import { Sheet } from '@/src/shared/ui/sheet'
import { TextField } from '@/src/shared/ui/text-field'
import { outreachService } from '../outreach.service'
import { CHANNELS, CHANNEL_LABELS } from '../outreach.types'
import type { Channel, TargetDetail } from '../outreach.types'
import { TemplateSelect } from './TemplateSelect'

type TargetActionsProps = {
  target: TargetDetail
  token: string
  productId: string
  onUpdated: (target: TargetDetail) => void
  onError: (err: unknown) => Promise<void>
}

type OpenSheet = 'repeat' | 'reply' | 'do-not-contact' | null

// Які кнопки показати, визначає сервер (permissions), інтерфейс нічого не вгадує за роллю.
export function TargetActions({
  target,
  token,
  productId,
  onUpdated,
  onError,
}: TargetActionsProps): ReactElement | null {
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null)
  const [isBusy, setIsBusy] = useState(false)
  const { permissions } = target

  const close = () => setOpenSheet(null)

  const release = async () => {
    if (!window.confirm(`Release ${target.displayName} from "Do not contact"?`)) return

    try {
      setIsBusy(true)
      onUpdated(await outreachService.release(target.id, token, productId))
      toast.success('Released. Writing to this contact is allowed again.')
    } catch (err) {
      await onError(err)
    } finally {
      setIsBusy(false)
    }
  }

  const hasActions =
    permissions.canRepeat ||
    permissions.canReply ||
    permissions.canMarkDoNotContact ||
    permissions.canRelease

  if (!hasActions) return null

  return (
    <div className="space-y-2 border-t border-[var(--l)] pt-4">
      {target.status === 'do_not_contact' && (
        <p className="text-sm">
          {`Repeat contact is blocked while this contact is marked "Do not contact".${
            target.statusReason ? ` Reason: ${target.statusReason}.` : ''
          }`}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {permissions.canRepeat && (
          <Button className="min-h-12" onClick={() => setOpenSheet('repeat')}>
            Repeat contact
          </Button>
        )}

        {permissions.canReply && (
          <Button variant="secondary" onClick={() => setOpenSheet('reply')}>
            Log reply
          </Button>
        )}

        {permissions.canMarkDoNotContact && (
          <Button
            variant="secondary"
            className="border-red-500/60 text-red-500 hover:border-red-500"
            onClick={() => setOpenSheet('do-not-contact')}
          >
            Do not contact
          </Button>
        )}

        {permissions.canRelease && (
          <Button variant="secondary" disabled={isBusy} onClick={release}>
            {isBusy ? 'Releasing...' : 'Release (admin)'}
          </Button>
        )}
      </div>

      <ActivitySheet
        type={openSheet === 'repeat' || openSheet === 'reply' ? openSheet : null}
        target={target}
        token={token}
        productId={productId}
        onClose={close}
        onUpdated={onUpdated}
        onError={onError}
      />

      <DoNotContactSheet
        isOpen={openSheet === 'do-not-contact'}
        target={target}
        token={token}
        productId={productId}
        onClose={close}
        onUpdated={onUpdated}
        onError={onError}
      />
    </div>
  )
}

type SheetProps = Pick<
  TargetActionsProps,
  'target' | 'token' | 'productId' | 'onUpdated' | 'onError'
> & { onClose: () => void }

function ActivitySheet({
  type,
  target,
  token,
  productId,
  onClose,
  onUpdated,
  onError,
}: SheetProps & { type: 'repeat' | 'reply' | null }): ReactElement {
  const [channel, setChannel] = useState<Channel | ''>('')
  const [templateId, setTemplateId] = useState('')
  const [url, setUrl] = useState('')
  const [comment, setComment] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!type) return

    try {
      setIsSaving(true)
      const updated = await outreachService.addActivity(
        target.id,
        {
          type,
          channel: channel || undefined,
          templateId: templateId || undefined,
          url: url.trim() || undefined,
          comment: comment.trim() || undefined,
        },
        token,
        productId,
      )
      onUpdated(updated)
      toast.success(type === 'repeat' ? 'Repeat contact saved.' : 'Reply saved.')
      setChannel('')
      setTemplateId('')
      setUrl('')
      setComment('')
      onClose()
    } catch (err) {
      await onError(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet
      title={type === 'reply' ? 'Log reply' : 'Repeat contact'}
      isOpen={type !== null}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <p className="break-words text-sm text-[var(--m)]">{target.displayName}</p>

        <SelectField
          label="Channel (optional)"
          value={channel}
          onChange={(event) => setChannel(event.target.value as Channel | '')}
        >
          <option value="">Not specified</option>
          {CHANNELS.map((item) => (
            <option key={item} value={item}>
              {CHANNEL_LABELS[item]}
            </option>
          ))}
        </SelectField>

        {type === 'repeat' && (
          <TemplateSelect
            token={token}
            productId={productId}
            channel={channel}
            value={templateId}
            onChange={setTemplateId}
          />
        )}

        <TextField
          label="Proof link (optional)"
          type="url"
          inputMode="url"
          value={url}
          autoComplete="off"
          autoCapitalize="off"
          placeholder="https://..."
          onChange={(event) => setUrl(event.target.value)}
        />

        <TextField
          label="Comment (optional)"
          value={comment}
          maxLength={1000}
          autoComplete="off"
          onChange={(event) => setComment(event.target.value)}
        />

        <Button type="submit" className="min-h-12 w-full text-lg" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </Sheet>
  )
}

function DoNotContactSheet({
  isOpen,
  target,
  token,
  productId,
  onClose,
  onUpdated,
  onError,
}: SheetProps & { isOpen: boolean }): ReactElement {
  const [reason, setReason] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()

    try {
      setIsSaving(true)
      onUpdated(
        await outreachService.markDoNotContact(
          target.id,
          reason.trim() || undefined,
          token,
          productId,
        ),
      )
      toast.success('Marked "Do not contact". Everyone will see it.')
      setReason('')
      onClose()
    } catch (err) {
      await onError(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet title="Do not contact" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-base">
          Nobody will be able to write to <strong>{target.displayName}</strong> again.
          Only an administrator can undo this.
        </p>

        <TextField
          label="Reason (optional, visible to you and admins)"
          value={reason}
          maxLength={500}
          autoComplete="off"
          onChange={(event) => setReason(event.target.value)}
        />

        <Button
          type="submit"
          className="min-h-12 w-full border-red-500 bg-red-500 text-lg text-white"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Mark as Do not contact'}
        </Button>
      </form>
    </Sheet>
  )
}
