import type { ReactElement } from 'react'

type JsonLdProps = {
  readonly data: Record<string, unknown>
  readonly id: string
}

function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function JsonLd({ data, id }: JsonLdProps): ReactElement {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
      id={id}
      type="application/ld+json"
    />
  )
}
