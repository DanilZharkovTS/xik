'use client'

import { useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { toast } from 'sonner'

import { cn } from '@/src/shared/lib/cn'
import { Button } from '@/src/shared/ui/button'
import { TextField } from '@/src/shared/ui/text-field'
import { formatDateTime, formatRelative } from '../format-date'
import { outreachService } from '../outreach.service'
import type {
  CheckInput,
  CheckResult,
  CheckStatus,
  RegisterOutcome,
  TargetDetail,
} from '../outreach.types'
import { IdentifierLink } from './IdentifierLink'
import { TargetActions } from './TargetActions'
import { TargetDetailCard } from './TargetDetailCard'

const STATUS_STYLES: Record<CheckStatus, { title: string; className: string }> = {
  free: {
    title: 'Free: nobody has written to this yet',
    className: 'border-emerald-500/60 bg-emerald-500/10',
  },
  mine: {
    title: 'You already wrote to this',
    className: 'border-sky-500/60 bg-sky-500/10',
  },
  foreign: {
    title: 'Already taken by another moderator',
    className: 'border-amber-500/60 bg-amber-500/10',
  },
  do_not_contact: {
    title: 'Do not contact',
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
  const { title, className } = STATUS_STYLES[result.status]

  return (
    <section
      aria-live="polite"
      className={cn('space-y-4 rounded-2xl border p-4', className)}
    >
      <div className="space-y-2">
        <h2 className="text-xl font-medium">{title}</h2>
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
          onTarget={onTarget}
          onTaken={onTaken}
          onError={onError}
        />
      )}

      {(result.status === 'foreign' || result.status === 'do_not_contact') &&
        !result.target && (
          <p>
            {result.status === 'do_not_contact'
              ? 'This contact asked not to be contacted. Do not write to them.'
              : 'Writing to them again is not allowed.'}
            {result.owner && (
              <>
                {' '}
                Owner: <strong>{result.owner.name}</strong>
                {result.firstContactedAt && (
                  <>
                    , first contact{' '}
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
  onTarget,
  onTaken,
  onError,
}: FormCallbacks & { input: CheckInput }): ReactElement {
  const [displayName, setDisplayName] = useState('')
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
          displayName: displayName.trim() || undefined,
          url: url.trim() || undefined,
          comment: comment.trim() || undefined,
        },
        token,
        productId,
      )
      applyOutcome(outcome, onTarget, onTaken, 'Registered. This contact is now yours.')
    } catch (err) {
      await onError(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <TextField
        label="Name (optional)"
        value={displayName}
        maxLength={100}
        autoComplete="off"
        onChange={(event) => setDisplayName(event.target.value)}
      />
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
        {isSaving ? 'Registering...' : 'Register first contact'}
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
      applyOutcome(outcome, onTarget, onTaken, 'Channel added to this contact.')
    } catch (err) {
      await onError(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 border-t border-[var(--l)] pt-4">
      <TextField
        label="Add another channel to this contact"
        value={value}
        placeholder="@username, email, site, profile link"
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
        {isSaving ? 'Adding...' : 'Add channel'}
      </Button>
    </form>
  )
}

function applyOutcome(
  outcome: RegisterOutcome,
  onTarget: (target: TargetDetail) => void,
  onTaken: (result: CheckResult) => void,
  successMessage: string,
): void {
  if (outcome.kind === 'created') {
    onTarget(outcome.target)
    toast.success(successMessage)
    return
  }

  toast.error('Someone was faster: this identifier is already registered.')
  onTaken(outcome.result)
}
