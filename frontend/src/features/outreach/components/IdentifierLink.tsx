import type { ReactElement } from 'react'

import { channelLabel } from '../outreach.types'
import type { Channel } from '../outreach.types'

// Кожен ідентифікатор відкривається за посиланням одним дотиком.
export function IdentifierLink({
  channel,
  value,
  href,
}: {
  channel: Channel
  value: string
  href?: string
}): ReactElement {
  const content = (
    <>
      <span className="text-[var(--m)]">{channelLabel(channel)}</span>
      <span className="min-w-0 break-all font-medium">{value}</span>
    </>
  )

  const className =
    'inline-flex min-h-9 max-w-full items-center gap-2 rounded-full border border-[var(--l)] bg-[var(--bg)] px-3 py-1 text-sm'

  if (!href) return <span className={className}>{content}</span>

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} hover:border-[var(--t)]`}
    >
      {content}
    </a>
  )
}
