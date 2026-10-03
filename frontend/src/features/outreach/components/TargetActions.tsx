'use client'

import { useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { toast } from 'sonner'

import { Button } from '@/src/shared/ui/button'
import { SelectField } from '@/src/shared/ui/select-field'
import { Sheet } from '@/src/shared/ui/sheet'
import { TextareaField } from '@/src/shared/ui/textarea-field'
import { TextField } from '@/src/shared/ui/text-field'
import { OptionalDetails } from './OptionalDetails'
import { outreachService } from '../outreach.service'
import { CHANNELS, channelLabel } from '../outreach.types'
import type { Channel, TargetDetail } from '../outreach.types'
import { TemplateSelect } from './TemplateSelect'
import { useI18n } from '@/src/shared/i18n/use-i18n'

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
  const { t } = useI18n()
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null)
  const [isBusy, setIsBusy] = useState(false)
  const { permissions } = target

  const close = () => setOpenSheet(null)

  const release = async () => {
    if (!window.confirm(t('actions.confirmRelease', { name: target.displayName }))) return

    try {
      setIsBusy(true)
      onUpdated(await outreachService.release(target.id, token, productId))
      toast.success(t('actions.released'))
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
          {t('actions.blocked')}
          {target.statusReason ? ` ${t('actions.reason', { reason: target.statusReason })}` : ''}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {permissions.canRepeat && (
          <Button className="min-h-11" onClick={() => setOpenSheet('repeat')}>
            {t('actions.repeat')}
          </Button>
        )}

        {permissions.canReply && (
          <Button variant="secondary" onClick={() => setOpenSheet('reply')}>
            {t('actions.reply')}
          </Button>
        )}

        {permissions.canMarkDoNotContact && (
          <Button
            variant="secondary"
            className="border-red-500/60 text-red-500 hover:border-red-500"
            onClick={() => setOpenSheet('do-not-contact')}
          >
            {t('actions.dnc')}
          </Button>
        )}

        {permissions.canRelease && (
          <Button variant="secondary" disabled={isBusy} onClick={release}>
            {isBusy ? t('actions.releasing') : t('actions.release')}
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
  const { t } = useI18n()
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
      toast.success(type === 'repeat' ? t('actions.repeatSaved') : t('actions.replySaved'))
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
      title={type === 'reply' ? t('actions.reply') : t('actions.repeat')}
      isOpen={type !== null}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <p className="break-words text-sm text-[var(--m)]">{target.displayName}</p>

        <SelectField
          label={t('actions.channelOptional')}
          value={channel}
          onChange={(event) => setChannel(event.target.value as Channel | '')}
        >
          <option value="">{t('actions.notSpecified')}</option>
          {CHANNELS.map((item) => (
            <option key={item} value={item}>
              {channelLabel(item)}
            </option>
          ))}
        </SelectField>

        <TextareaField
          label={t('result.comment')}
          value={comment}
          rows={3}
          maxLength={1000}
          autoComplete="off"
          onChange={(event) => setComment(event.target.value)}
        />

        {type === 'repeat' && (
          <TemplateSelect
            token={token}
            productId={productId}
            channel={channel}
            value={templateId}
            onChange={setTemplateId}
          />
        )}

        <OptionalDetails summary={t('result.proofSummary')}>
          <TextField
            label={t('result.proof')}
            type="url"
            inputMode="url"
            value={url}
            autoComplete="off"
            autoCapitalize="off"
            placeholder="https://..."
            onChange={(event) => setUrl(event.target.value)}
          />
        </OptionalDetails>

        <Button type="submit" className="min-h-11 w-full" disabled={isSaving}>
          {isSaving ? t('actions.saving') : t('common.save')}
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
  const { t } = useI18n()
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
      toast.success(t('actions.dncDone'))
      setReason('')
      onClose()
    } catch (err) {
      await onError(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet title={t('actions.dnc')} isOpen={isOpen} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-base">
          {t('actions.dncIntro', { name: target.displayName })}
        </p>

        <TextField
          label={t('actions.dncReason')}
          value={reason}
          maxLength={500}
          autoComplete="off"
          onChange={(event) => setReason(event.target.value)}
        />

        <Button
          type="submit"
          className="min-h-11 w-full border-red-500 bg-red-500 text-white"
          disabled={isSaving}
        >
          {isSaving ? t('actions.saving') : t('actions.dncSubmit')}
        </Button>
      </form>
    </Sheet>
  )
}
