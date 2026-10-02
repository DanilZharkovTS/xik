import type { ReactElement } from 'react'

import { formatDateTime, formatRelative } from '../format-date'
import type { TargetDetail, TargetEvent } from '../outreach.types'
import { CHANNEL_LABELS } from '../outreach.types'
import { IdentifierLink } from './IdentifierLink'

const EVENT_LABELS: Record<TargetEvent['type'], string> = {
  first: 'First contact',
  repeat: 'Repeat contact',
  reply: 'Reply',
  publication: 'Publication',
}

export function TargetDetailCard({ target }: { target: TargetDetail }): ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-lg font-medium">{target.displayName}</p>
        <p className="text-sm text-[var(--m)]">
          Owner: {target.owner.name} · first contact{' '}
          <span title={formatDateTime(target.firstContactedAt)}>
            {formatRelative(target.firstContactedAt)}
          </span>
          {' · '}last contact{' '}
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
        <p className="mb-2 text-xs uppercase tracking-wider text-[var(--m)]">History</p>

        <ol className="divide-y divide-[var(--l)] overflow-hidden rounded-xl border border-[var(--l)] bg-[var(--bg)]">
          {target.events.map((event) => (
            <li key={event.id} className="space-y-0.5 px-3 py-2 text-sm">
              <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-medium">
                  {EVENT_LABELS[event.type]}
                  {event.channel ? ` · ${CHANNEL_LABELS[event.channel]}` : ''}
                </span>
                <time dateTime={event.occurredAt} className="text-[var(--m)]">
                  {formatDateTime(event.occurredAt)}
                </time>
              </p>
              <p className="text-[var(--m)]">by {event.author}</p>
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
