'use client'

import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { toast } from 'sonner'

import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { cn } from '@/src/shared/lib/cn'
import { Button } from '@/src/shared/ui/button'
import { SelectField } from '@/src/shared/ui/select-field'
import { Sheet } from '@/src/shared/ui/sheet'
import type { TargetListItem } from '@/src/features/outreach/outreach.types'
import { teamService } from '../team.service'
import type { Moderator, TeamProduct } from '../team.types'

type TransferTargetsSheetProps = {
  source: Moderator | null
  moderators: Moderator[]
  products: TeamProduct[]
  token: string
  onClose: () => void
  onDone: () => Promise<void>
}

type Mode = 'all' | 'selected'

// Передача цілей: адмін вибирає продукт, одержувача й усі цілі або вибрані. Історія не переписується.
export function TransferTargetsSheet(props: TransferTargetsSheetProps): ReactElement {
  const { source, onClose } = props

  return (
    <Sheet title="Transfer targets" isOpen={source !== null} onClose={onClose}>
      {/* key перемонтовує форму зі свіжим станом для кожного модератора. */}
      {source && <TransferForm key={source.id} {...props} source={source} />}
    </Sheet>
  )
}

function TransferForm({
  source,
  moderators,
  products,
  token,
  onClose,
  onDone,
}: Omit<TransferTargetsSheetProps, 'source'> & { source: Moderator }): ReactElement {
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [toUserId, setToUserId] = useState('')
  const [mode, setMode] = useState<Mode>('all')
  const [targets, setTargets] = useState<TargetListItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loadedFor, setLoadedFor] = useState('')
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const isLoading = productId !== '' && loadedFor !== productId

  useEffect(() => {
    if (!productId) return

    let isCancelled = false

    teamService
      .listOwnedTargets(token, productId, source.id)
      .then((page) => {
        if (isCancelled) return
        setTargets(page.targets)
        setNextCursor(page.nextCursor)
        setSelected(new Set())
        setLoadedFor(productId)
      })
      .catch((err: unknown) => {
        if (isCancelled) return
        toast.error(getErrorMessage(err))
        setLoadedFor(productId)
      })

    return () => {
      isCancelled = true
    }
  }, [token, productId, source.id])

  // Одержувач має працювати в цьому продукті й бути активним: інакше сервер відхилить передачу.
  const recipients = useMemo(
    () =>
      moderators.filter(
        (moderator) =>
          moderator.id !== source.id &&
          moderator.deactivatedAt === null &&
          moderator.products.some((product) => product.id === productId),
      ),
    [moderators, source.id, productId],
  )

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const loadMore = async () => {
    if (!nextCursor) return

    try {
      setIsLoadingMore(true)
      const page = await teamService.listOwnedTargets(token, productId, source.id, nextCursor)
      setTargets((current) => [...current, ...page.targets])
      setNextCursor(page.nextCursor)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoadingMore(false)
    }
  }

  const count = mode === 'all' ? targets.length : selected.size
  const countLabel = mode === 'all' && nextCursor ? `${targets.length}+` : String(count)
  const canSubmit = !isSaving && toUserId !== '' && targets.length > 0 && (mode === 'all' || selected.size > 0)
  const recipient = recipients.find((moderator) => moderator.id === toUserId)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    const what = mode === 'all' ? 'all targets' : `${selected.size} selected target(s)`
    if (!window.confirm(`Transfer ${what} of ${source.name} to ${recipient?.name}? The history is kept.`)) return

    try {
      setIsSaving(true)
      const transferred = await teamService.transferTargets(
        {
          productId,
          fromUserId: source.id,
          toUserId,
          targetIds: mode === 'selected' ? [...selected] : undefined,
        },
        token,
      )
      toast.success(`Transferred ${transferred} target(s) to ${recipient?.name}.`)
      await onDone()
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="break-all text-sm text-[var(--m)]">
        From {source.name} · {source.email}. Targets stay with their owner until you
        transfer them.
      </p>

      <SelectField
        label="Product"
        value={productId}
        onChange={(event) => {
          setProductId(event.target.value)
          setToUserId('')
        }}
      >
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </SelectField>

      <SelectField label="Transfer to" value={toUserId} onChange={(event) => setToUserId(event.target.value)}>
        <option value="">{recipients.length === 0 ? 'No eligible moderators' : 'Choose a moderator'}</option>
        {recipients.map((moderator) => (
          <option key={moderator.id} value={moderator.id}>
            {moderator.name}
          </option>
        ))}
      </SelectField>

      {isLoading ? (
        <p className="py-4 text-center text-[var(--m)]">Loading...</p>
      ) : targets.length === 0 ? (
        <p className="rounded-xl border border-[var(--l)] px-3 py-4 text-center text-sm text-[var(--m)]">
          {source.name} has no targets in this product.
        </p>
      ) : (
        <>
          <div role="group" aria-label="What to transfer" className="grid grid-cols-2 rounded-full border border-[var(--l)] p-1">
            {(['all', 'selected'] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={mode === item}
                onClick={() => setMode(item)}
                className={cn(
                  'min-h-10 rounded-full px-2 text-sm font-medium',
                  mode === item ? 'bg-[var(--t)] text-[var(--bg)]' : 'text-[var(--m)]',
                )}
              >
                {item === 'all' ? 'All targets' : 'Choose targets'}
              </button>
            ))}
          </div>

          {mode === 'selected' && (
            <div className="space-y-2">
              <ul className="max-h-64 divide-y divide-[var(--l)] overflow-y-auto rounded-xl border border-[var(--l)]">
                {targets.map((target) => (
                  <li key={target.id}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(target.id)}
                        onChange={() => toggle(target.id)}
                        className="h-5 w-5 shrink-0 accent-[var(--t)]"
                      />
                      <span className="min-w-0">
                        <span className="block break-words font-medium">{target.displayName}</span>
                        <span className="block break-all text-xs text-[var(--m)]">
                          {target.identifiers.map((identifier) => identifier.value).join(', ')}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setSelected(selected.size === targets.length ? new Set() : new Set(targets.map((t) => t.id)))
                  }
                >
                  {selected.size === targets.length ? 'Clear' : 'Select all'}
                </Button>
                {nextCursor && (
                  <Button variant="secondary" disabled={isLoadingMore} onClick={loadMore}>
                    {isLoadingMore ? 'Loading...' : 'Load more'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <Button type="submit" className="min-h-11 w-full" disabled={!canSubmit}>
        {isSaving ? 'Transferring...' : `Transfer ${countLabel} target${count === 1 ? '' : 's'}`}
      </Button>
    </form>
  )
}
