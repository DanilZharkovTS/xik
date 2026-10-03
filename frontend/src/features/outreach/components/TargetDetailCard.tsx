import type { ReactElement } from 'react'

import type { MessageKey } from '@/src/shared/i18n/messages'
import { formatDateTime, formatRelative } from '../format-date'
import type { TargetDetail, TargetEvent } from '../outreach.types'
import { channelLabel } from '../outreach.types'
import { IdentifierLink } from './IdentifierLink'
import { useI18n } from '@/src/shared/i18n/use-i18n'

const EVENT_KEYS: Record<TargetEvent['type'], MessageKey> = {
  first: 'event.first',
  repeat: 'event.repeat',
  reply: 'event.reply',
  publication: 'event.publication',
  status: 'event.status',
}

export function TargetDetailCard({ target }: { target: TargetDetail }): ReactElement {
  const { t } = useI18n()

  return (
    <div className="space-y-4">
      <div>
        <p className="text-lg font-medium">{target.displayName}</p>
        <p className="text-sm text-[var(--m)]">
          {t('detail.owner')} {target.owner.name} · {t('detail.firstContact')}{' '}
          <span title={formatDateTime(target.firstContactedAt)}>
            {formatRelative(target.firstContactedAt)}
          </span>
          {' · '}{t('detail.lastContact')}{' '}
          <span title={formatDateTime(target.lastContactedAt)}>
            {formatRelative(target.lastContactedAt)}
          </span>
        </p>
      </div>

      <ul className="flex flex-wrap gap-2">
        {target.identifiers.map((identifier) => (
          <li key={`${identifier.channel}:${identifier.value}`} className="max-w-full">
            <IdentifierLink {...identifier} />
          </li>
        ))}
      </ul>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-[var(--m)]">{t('detail.history')}</p>

        <ol className="divide-y divide-[var(--l)] overflow-hidden rounded-xl border border-[var(--l)] bg-[var(--bg)]">
          {target.events.map((event) => (
            <li key={event.id} className="space-y-0.5 px-3 py-2 text-sm">
              <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-medium">
                  {t(EVENT_KEYS[event.type])}
                  {event.channel ? ` · ${channelLabel(event.channel)}` : ''}
                </span>
                <time dateTime={event.occurredAt} className="text-[var(--m)]">
                  {formatDateTime(event.occurredAt)}
                </time>
              </p>
              <p className="text-[var(--m)]">{t('detail.by', { name: event.author })}</p>
              {event.template && (
                <p className="text-[var(--m)]">
                  {t('detail.template', { title: event.template.title })}
                  {event.template.version ? ` (v${event.template.version})` : ''}
                </p>
              )}
              {event.comment && <p className="break-words">{event.comment}</p>}
              {event.url && (
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block break-all underline"
                >
                  {event.url}
                </a>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
