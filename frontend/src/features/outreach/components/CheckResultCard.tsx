'use client'

import { useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { toast } from 'sonner'

import type { MessageKey } from '@/src/shared/i18n/messages'
import { cn } from '@/src/shared/lib/cn'
import { Button } from '@/src/shared/ui/button'
import { TextareaField } from '@/src/shared/ui/textarea-field'
import { TextField } from '@/src/shared/ui/text-field'
import { OptionalDetails } from './OptionalDetails'
import { formatDateTime, formatRelative } from '../format-date'
import { outreachService } from '../outreach.service'
import type {
  Channel,
  CheckInput,
  CheckResult,
  CheckStatus,
  RegisterOutcome,
  TargetDetail,
} from '../outreach.types'
import { IdentifierLink } from './IdentifierLink'
import { TargetActions } from './TargetActions'
import { TemplateSelect } from './TemplateSelect'
import { TargetDetailCard } from './TargetDetailCard'
import { useI18n } from '@/src/shared/i18n/use-i18n'

const STATUS_STYLES: Record<CheckStatus, { titleKey: MessageKey; className: string }> = {
  free: {
    titleKey: 'result.free',
    className: 'border-emerald-500/60 bg-emerald-500/10',
  },
  mine: {
    titleKey: 'result.mine',
    className: 'border-sky-500/60 bg-sky-500/10',
  },
  foreign: {
    titleKey: 'result.foreign',
    className: 'border-amber-500/60 bg-amber-500/10',
  },
  do_not_contact: {
    titleKey: 'result.doNotContact',
    className: 'border-red-500/60 bg-red-500/10',
  },
}

type CheckResultCardProps = {
  result: CheckResult
  token: string
  productId: string
  registerInput: CheckInput
  onTarget: (target: TargetDetail) => void
  onTaken: (result: CheckResult) => void
  onError: (err: unknown) => Promise<void>
}

export function CheckResultCard({
  result,
  token,
  productId,
  registerInput,
  onTarget,
  onTaken,
  onError,
}: CheckResultCardProps): ReactElement {
  const { t } = useI18n()
  const { titleKey, className } = STATUS_STYLES[result.status]

  return (
    <section
      aria-live="polite"
      className={cn('space-y-4 rounded-2xl border p-4', className)}
    >
      <div className="space-y-2">
        <h2 className="text-xl font-medium">{t(titleKey)}</h2>
        {/* Коли показано повну картку цілі, ідентифікатор уже є в її списку. */}
        {!result.target && (
          <IdentifierLink
            channel={result.normalized.channel}
            value={result.normalized.value}
          />
        )}
      </div>

      {result.status === 'free' && (
        <RegisterForm
          token={token}
          productId={productId}
          input={registerInput}
          channel={result.normalized.channel}
          onTarget={onTarget}
          onTaken={onTaken}
          onError={onError}
        />
      )}

      {(result.status === 'foreign' || result.status === 'do_not_contact') &&
        !result.target && (
          <p>
            {result.status === 'do_not_contact'
              ? t('result.askedNot')
              : t('result.notAllowed')}
            {result.owner && (
              <>
                {' '}
                {t('result.owner')} <strong>{result.owner.name}</strong>
                {result.firstContactedAt && (
                  <>
                    , {t('result.firstContact')}{' '}
                    <span title={formatDateTime(result.firstContactedAt)}>
                      {formatRelative(result.firstContactedAt)}
                    </span>
                  </>
                )}
                .
              </>
            )}
          </p>
        )}

      {result.target && (
        <>
          <TargetDetailCard target={result.target} />

          <TargetActions
            target={result.target}
            token={token}
            productId={productId}
            onUpdated={onTarget}
            onError={onError}
          />

          {result.target.permissions.canAddIdentifier && (
            <AddIdentifierForm
              targetId={result.target.id}
              token={token}
              productId={productId}
              onTarget={onTarget}
              onTaken={onTaken}
              onError={onError}
            />
          )}
        </>
      )}
    </section>
  )
}

type FormCallbacks = {
  token: string
  productId: string
  onTarget: (target: TargetDetail) => void
  onTaken: (result: CheckResult) => void
  onError: (err: unknown) => Promise<void>
}

function RegisterForm({
  token,
  productId,
  input,
  channel,
  onTarget,
  onTaken,
  onError,
}: FormCallbacks & { input: CheckInput; channel: Channel }): ReactElement {
  const { t } = useI18n()
  const [displayName, setDisplayName] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [url, setUrl] = useState('')
  const [comment, setComment] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()

    try {
      setIsSaving(true)
      const outcome = await outreachService.register(
        {
          ...input,
          templateId: templateId || undefined,
          displayName: displayName.trim() || undefined,
          url: url.trim() || undefined,
          comment: comment.trim() || undefined,
        },
        token,
        productId,
      )
      applyOutcome(outcome, onTarget, onTaken, t('result.registered'), t('result.faster'))
    } catch (err) {
      await onError(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <TextareaField
        label={t('result.comment')}
        value={comment}
        rows={3}
        maxLength={1000}
        placeholder={t('result.commentPlaceholder')}
        autoComplete="off"
        onChange={(event) => setComment(event.target.value)}
      />
      <TemplateSelect
        token={token}
        productId={productId}
        channel={channel}
        value={templateId}
        onChange={setTemplateId}
      />
      <OptionalDetails summary={t('result.nameAndProof')}>
        <TextField
          label={t('result.name')}
          value={displayName}
          maxLength={100}
          autoComplete="off"
          onChange={(event) => setDisplayName(event.target.value)}
        />
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
        {isSaving ? t('result.registering') : t('result.register')}
      </Button>
    </form>
  )
}

function AddIdentifierForm({
  targetId,
  token,
  productId,
  onTarget,
  onTaken,
  onError,
}: FormCallbacks & { targetId: string }): ReactElement {
  const { t } = useI18n()
  const [value, setValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!value.trim()) return

    try {
      setIsSaving(true)
      const outcome = await outreachService.addIdentifier(
        targetId,
        { value: value.trim() },
        token,
        productId,
      )
      if (outcome.kind === 'created') setValue('')
      applyOutcome(outcome, onTarget, onTaken, t('result.channelAdded'), t('result.faster'))
    } catch (err) {
      await onError(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 border-t border-[var(--l)] pt-4">
      <TextField
        label={t('result.addChannelLabel')}
        value={value}
        placeholder={t('result.addChannelPlaceholder')}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        onChange={(event) => setValue(event.target.value)}
      />

      <Button
        type="submit"
        variant="secondary"
        className="w-full"
        disabled={isSaving || !value.trim()}
      >
        {isSaving ? t('result.adding') : t('result.addChannel')}
      </Button>
    </form>
  )
}

function applyOutcome(
  outcome: RegisterOutcome,
  onTarget: (target: TargetDetail) => void,
  onTaken: (result: CheckResult) => void,
  successMessage: string,
  fasterMessage: string,
): void {
  if (outcome.kind === 'created') {
    onTarget(outcome.target)
    toast.success(successMessage)
    return
  }

  toast.error(fasterMessage)
  onTaken(outcome.result)
}
