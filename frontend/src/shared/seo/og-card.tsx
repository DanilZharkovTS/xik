import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 } as const

type OgCardInput = {
  readonly eyebrow: string
  readonly title: string
  readonly subtitle: string
}

// Картка для соцмереж: у кожного продукту свій заголовок, а не спільна заглушка.
export function renderOgCard({ eyebrow, title, subtitle }: OgCardInput): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'stretch',
          background: '#050505',
          border: '16px solid #f5f5f5',
          color: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'monospace',
          height: '100%',
          justifyContent: 'space-between',
          padding: '64px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            justifyContent: 'space-between',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <span>{eyebrow}</span>
          <span>xik.app</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <span style={{ fontSize: title.length > 18 ? 88 : 120, fontWeight: 700, lineHeight: 1 }}>
            {title}
          </span>
          <span
            style={{
              borderTop: '8px solid #f5f5f5',
              fontSize: 40,
              lineHeight: 1.25,
              paddingTop: 24,
            }}
          >
            {subtitle}
          </span>
        </div>
      </div>
    ),
    OG_SIZE,
  )
}
