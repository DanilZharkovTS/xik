'use client'

import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { toast } from 'sonner'

import { Button } from '@/src/shared/ui/button'
import { SelectField } from '@/src/shared/ui/select-field'
import { Sheet } from '@/src/shared/ui/sheet'
import { TextField } from '@/src/shared/ui/text-field'
import { formatDateTime, formatRelative } from '../format-date'
import { outreachService } from '../outreach.service'
import {
  PUBLICATION_CHANNELS,
  PUBLICATION_CHANNEL_LABELS,
  PUBLICATION_KINDS,
  PUBLICATION_KIND_LABELS,
} from '../outreach.types'
import type {
  Publication,
  PublicationChannel,
  PublicationKind,
} from '../outreach.types'
import { useOutreachContext } from '../use-outreach-context'

export function PublicationsScreen(): ReactElement {
  const { token, productId, handleError } = useOutreachContext()

  const [publications, setPublications] = useState<Publication[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (!token || !productId) return

    let isCancelled = false

    outreachService
      .listPublications(token, productId)
      .then((page) => {
        if (isCancelled) return
        setPublications(page.publications)
        setNextCursor(page.nextCursor)
        setIsLoading(false)
      })
      .catch(async (err: unknown) => {
        if (isCancelled) return
        setIsLoading(false)
        await handleError(err)
      })

    return () => {
      isCancelled = true
    }
  }, [token, productId, handleError])

  const loadMore = useCallback(async () => {
    if (!token || !productId || !nextCursor) return

    try {
      setIsLoadingMore(true)
      const page = await outreachService.listPublications(token, productId, nextCursor)
      setPublications((current) => [...current, ...page.publications])
      setNextCursor(page.nextCursor)
    } catch (err) {
      await handleError(err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [token, productId, nextCursor, handleError])

  return (
    <div className="space-y-3 md:space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium md:text-4xl">Publications</h1>
          <p className="mt-0.5 text-sm text-[var(--m)] md:mt-1 md:text-base">
            Posts, ads and articles you placed for this product.
          </p>
        </div>

        <Button className="shrink-0" disabled={!token || !productId} onClick={() => setIsAdding(true)}>
          Add
        </Button>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-[var(--m)]">Loading...</p>
      ) : publications.length === 0 ? (
        <div className="rounded-2xl border border-[var(--l)] px-4 py-12 text-center">
          <p className="font-medium">No publications yet</p>
          <p className="mt-1 text-sm text-[var(--m)]">
            Record a post or ad with a link, so your work is visible.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {publications.map((publication) => (
              <li
                key={publication.id}
                className="space-y-2 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {PUBLICATION_CHANNEL_LABELS[publication.channel]} ·{' '}
                    {PUBLICATION_KIND_LABELS[publication.kind]}
                  </p>
                  <time
                    dateTime={publication.occurredAt}
                    title={formatDateTime(publication.occurredAt)}
                    className="text-sm text-[var(--m)]"
                  >
                    {formatRelative(publication.occurredAt)}
                  </time>
                </div>

                <a
                  href={publication.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block break-all text-sm underline"
                >
                  {publication.url}
                </a>

                {publication.comment && (
                  <p className="break-words text-sm">{publication.comment}</p>
                )}

                <p className="text-sm text-[var(--m)]">by {publication.author}</p>
              </li>
            ))}
          </ul>

          {nextCursor && (
            <Button variant="secondary" className="w-full" disabled={isLoadingMore} onClick={loadMore}>
              {isLoadingMore ? 'Loading...' : 'Load more'}
            </Button>
          )}
        </>
      )}

      {token && productId && (
        <AddPublicationSheet
          isOpen={isAdding}
          token={token}
          productId={productId}
          onClose={() => setIsAdding(false)}
          onCreated={(publication) => setPublications((current) => [publication, ...current])}
          onError={handleError}
        />
      )}
    </div>
  )
}

type AddPublicationSheetProps = {
  isOpen: boolean
  token: string
  productId: string
  onClose: () => void
  onCreated: (publication: Publication) => void
  onError: (err: unknown) => Promise<void>
}

function AddPublicationSheet({
  isOpen,
  token,
  productId,
  onClose,
  onCreated,
  onError,
}: AddPublicationSheetProps): ReactElement {
  const [channel, setChannel] = useState<PublicationChannel>('facebook')
  const [kind, setKind] = useState<PublicationKind>('post')
  const [url, setUrl] = useState('')
  const [comment, setComment] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()

    try {
      setIsSaving(true)
      const outcome = await outreachService.createPublication(
        { channel, kind, url: url.trim(), comment: comment.trim() || undefined },
        token,
        productId,
      )

      if (outcome.kind === 'duplicate') {
        const who = outcome.existing
          ? ` by ${outcome.existing.author} on ${formatDateTime(outcome.existing.occurredAt)}`
          : ''
        toast.error(`This publication is already recorded${who}.`)
        return
      }

      onCreated(outcome.publication)
      toast.success('Publication saved.')
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
    <Sheet title="Add publication" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <SelectField
          label="Where"
          value={channel}
          onChange={(event) => setChannel(event.target.value as PublicationChannel)}
        >
          {PUBLICATION_CHANNELS.map((item) => (
            <option key={item} value={item}>
              {PUBLICATION_CHANNEL_LABELS[item]}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="What"
          value={kind}
          onChange={(event) => setKind(event.target.value as PublicationKind)}
        >
          {PUBLICATION_KINDS.map((item) => (
            <option key={item} value={item}>
              {PUBLICATION_KIND_LABELS[item]}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Link to the publication"
          type="url"
          inputMode="url"
          value={url}
          required
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

        <Button type="submit" className="min-h-11 w-full" disabled={isSaving || !url.trim()}>
          {isSaving ? 'Saving...' : 'Save publication'}
        </Button>
      </form>
    </Sheet>
  )
}
