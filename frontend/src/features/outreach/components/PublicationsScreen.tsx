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
  publicationChannelLabel,
  PUBLICATION_KINDS,
  publicationKindLabel,
} from '../outreach.types'
import type {
  Publication,
  PublicationChannel,
  PublicationKind,
} from '../outreach.types'
import { useOutreachContext } from '../use-outreach-context'
import { useI18n } from '@/src/shared/i18n/use-i18n'

export function PublicationsScreen(): ReactElement {
  const { t } = useI18n()
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
          <h1 className="text-2xl font-medium md:text-4xl">{t('pubs.title')}</h1>
          <p className="mt-0.5 text-sm text-[var(--m)] md:mt-1 md:text-base">
            {t('pubs.intro')}
          </p>
        </div>

        <Button className="shrink-0" disabled={!token || !productId} onClick={() => setIsAdding(true)}>
          {t('pubs.add')}
        </Button>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-[var(--m)]">{t('common.loading')}</p>
      ) : publications.length === 0 ? (
        <div className="rounded-2xl border border-[var(--l)] px-4 py-12 text-center">
          <p className="font-medium">{t('pubs.emptyTitle')}</p>
          <p className="mt-1 text-sm text-[var(--m)]">
            {t('pubs.emptyText')}
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
                    {publicationChannelLabel(publication.channel)} ·{' '}
                    {publicationKindLabel(publication.kind)}
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

                <p className="text-sm text-[var(--m)]">{t('pubs.by', { name: publication.author })}</p>
              </li>
            ))}
          </ul>

          {nextCursor && (
            <Button variant="secondary" className="w-full" disabled={isLoadingMore} onClick={loadMore}>
              {isLoadingMore ? t('common.loading') : t('pubs.loadMore')}
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
  const { t } = useI18n()
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
          ? t('pubs.duplicateWho', {
              name: outcome.existing.author,
              date: formatDateTime(outcome.existing.occurredAt),
            })
          : ''
        toast.error(t('pubs.duplicate', { who }))
        return
      }

      onCreated(outcome.publication)
      toast.success(t('pubs.saved'))
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
    <Sheet title={t('pubs.addTitle')} isOpen={isOpen} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <SelectField
          label={t('pubs.where')}
          value={channel}
          onChange={(event) => setChannel(event.target.value as PublicationChannel)}
        >
          {PUBLICATION_CHANNELS.map((item) => (
            <option key={item} value={item}>
              {publicationChannelLabel(item)}
            </option>
          ))}
        </SelectField>

        <SelectField
          label={t('pubs.what')}
          value={kind}
          onChange={(event) => setKind(event.target.value as PublicationKind)}
        >
          {PUBLICATION_KINDS.map((item) => (
            <option key={item} value={item}>
              {publicationKindLabel(item)}
            </option>
          ))}
        </SelectField>

        <TextField
          label={t('pubs.link')}
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
          label={t('pubs.comment')}
          value={comment}
          maxLength={1000}
          autoComplete="off"
          onChange={(event) => setComment(event.target.value)}
        />

        <Button type="submit" className="min-h-11 w-full" disabled={isSaving || !url.trim()}>
          {isSaving ? t('pubs.saving') : t('pubs.save')}
        </Button>
      </form>
    </Sheet>
  )
}
