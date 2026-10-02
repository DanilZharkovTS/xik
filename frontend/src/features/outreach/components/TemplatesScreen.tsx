'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { toast } from 'sonner'

import { cn } from '@/src/shared/lib/cn'
import { Button } from '@/src/shared/ui/button'
import { outreachService } from '../outreach.service'
import { useOutreachStore } from '../outreach-store'
import { CHANNELS, TEMPLATE_CHANNEL_LABELS } from '../outreach.types'
import type { Channel, Template, TemplateStatus } from '../outreach.types'
import { useOutreachContext } from '../use-outreach-context'
import { CopyTemplateSheet } from './CopyTemplateSheet'
import { TemplateEditorSheet } from './TemplateEditorSheet'

export function TemplatesScreen(): ReactElement {
  const { token, productId, handleError } = useOutreachContext()
  const product = useOutreachStore(
    (state) => state.products.find((item) => item.id === state.selectedProductId) ?? null,
  )

  const [templates, setTemplates] = useState<Template[]>([])
  const [status, setStatus] = useState<TemplateStatus>('active')
  const [channel, setChannel] = useState<Channel | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [copying, setCopying] = useState<Template | null>(null)
  const [editing, setEditing] = useState<Template | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  useEffect(() => {
    if (!token || !productId) return

    let isCancelled = false

    outreachService
      .listTemplates(token, productId, { status, channel: channel || undefined })
      .then((loaded) => {
        if (isCancelled) return
        setTemplates(loaded)
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
  }, [token, productId, status, channel, handleError])

  const reload = useCallback(async () => {
    if (!token || !productId) return

    try {
      setTemplates(
        await outreachService.listTemplates(token, productId, {
          status,
          channel: channel || undefined,
        }),
      )
    } catch (err) {
      await handleError(err)
    }
  }, [token, productId, status, channel, handleError])

  const run = async (template: Template, action: 'archive' | 'restore' | 'duplicate') => {
    if (!token || !productId) return

    try {
      setBusyId(template.id)
      await outreachService.templateAction(template.id, action, token, productId)
      toast.success(
        action === 'archive'
          ? 'Archived. You can restore it from the Archived tab.'
          : action === 'restore'
            ? 'Restored.'
            : 'Duplicated. The copy is yours: edit it as you like.',
      )
      await reload()
    } catch (err) {
      await handleError(err)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (template: Template) => {
    if (!token || !productId) return
    if (!window.confirm(`Delete "${template.title}" permanently?`)) return

    try {
      setBusyId(template.id)
      await outreachService.deleteTemplate(template.id, token, productId)
      toast.success('Deleted.')
      await reload()
    } catch (err) {
      await handleError(err)
    } finally {
      setBusyId(null)
    }
  }

  const openEditor = (template: Template | null) => {
    setEditing(template)
    setIsEditorOpen(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium">Templates</h1>
          <p className="mt-1 text-[var(--m)]">
            Ready texts to copy and send, so nobody has to invent them.
          </p>
        </div>

        <Button className="shrink-0" disabled={!token || !productId} onClick={() => openEditor(null)}>
          New
        </Button>
      </div>

      <div className="flex gap-2">
        <div role="group" aria-label="Status" className="flex shrink-0 rounded-full border border-[var(--l)] p-1">
          {(['active', 'archived'] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={status === item}
              onClick={() => {
                setIsLoading(true)
                setStatus(item)
              }}
              className={cn(
                'min-h-9 rounded-full px-3 text-sm font-medium capitalize',
                status === item ? 'bg-[var(--t)] text-[var(--bg)]' : 'text-[var(--m)]',
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <label htmlFor="template-channel" className="sr-only">
          Channel
        </label>
        <select
          id="template-channel"
          value={channel}
          onChange={(event) => {
            setIsLoading(true)
            setChannel(event.target.value as Channel | '')
          }}
          className="min-h-11 min-w-0 flex-1 rounded-full border border-[var(--l)] bg-[var(--bg)] px-4 text-base outline-none focus:border-[var(--t)]"
        >
          <option value="">All channels</option>
          {CHANNELS.map((item) => (
            <option key={item} value={item}>
              {TEMPLATE_CHANNEL_LABELS[item]}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-[var(--m)]">Loading...</p>
      ) : templates.length === 0 ? (
        <div className="rounded-2xl border border-[var(--l)] px-4 py-12 text-center">
          <p className="font-medium">
            {status === 'archived' ? 'No archived templates' : 'No templates yet'}
          </p>
          {status === 'active' && (
            <p className="mt-1 text-sm text-[var(--m)]">
              Create the first one: an email, a Telegram message or a universal text.
            </p>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {templates.map((template) => (
            <li
              key={template.id}
              className="space-y-3 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-lg font-medium">{template.title}</p>
                  <p className="text-sm text-[var(--m)]">
                    {TEMPLATE_CHANNEL_LABELS[template.channel]} · v{template.version} ·{' '}
                    {template.isMine ? 'yours' : template.owner.name}
                  </p>
                </div>
              </div>

              <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm text-[var(--m)]">
                {template.subject ? `${template.subject}\n` : ''}
                {template.body}
              </p>

              <div className="grid grid-cols-2 gap-2">
                {template.status === 'active' && (
                  <Button className="col-span-2 min-h-12" onClick={() => setCopying(template)}>
                    Copy
                  </Button>
                )}

                {template.permissions.canEdit && (
                  <Button variant="secondary" disabled={busyId === template.id} onClick={() => openEditor(template)}>
                    Edit
                  </Button>
                )}

                {template.permissions.canDuplicate && (
                  <Button variant="secondary" disabled={busyId === template.id} onClick={() => run(template, 'duplicate')}>
                    Duplicate
                  </Button>
                )}

                {template.permissions.canArchive && (
                  <Button variant="secondary" disabled={busyId === template.id} onClick={() => run(template, 'archive')}>
                    Archive
                  </Button>
                )}

                {template.permissions.canRestore && (
                  <Button variant="secondary" disabled={busyId === template.id} onClick={() => run(template, 'restore')}>
                    Restore
                  </Button>
                )}

                {template.permissions.canDelete && (
                  <Button
                    variant="secondary"
                    className="border-red-500/60 text-red-500 hover:border-red-500"
                    disabled={busyId === template.id}
                    onClick={() => remove(template)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <CopyTemplateSheet template={copying} product={product} onClose={() => setCopying(null)} />

      {token && productId && (
        <TemplateEditorSheet
          isOpen={isEditorOpen}
          template={editing}
          token={token}
          productId={productId}
          onClose={() => setIsEditorOpen(false)}
          onSaved={() => void reload()}
          onError={handleError}
        />
      )}
    </div>
  )
}
