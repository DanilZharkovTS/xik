import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 } as const

type OgCardInput = {
  readonly eyebrow: string
  readonly title: string
  readonly subtitle: string
}

// Картка для соцмереж: у кожної сторінки свій заголовок, фірмовий стиль спільний з іконкою (X і синій курсор).
export function renderOgCard({ eyebrow, title, subtitle }: OgCardInput): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #22232b 0%, #050507 70%)',
          color: '#f5f5f7',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          height: '100%',
          justifyContent: 'space-between',
          padding: '64px 72px',
          width: '100%',
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 14 }}>
            <div style={{ alignItems: 'baseline', display: 'flex', fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em' }}>
              <span>X</span>
              <span style={{ color: '#a1a1a6' }}>][</span>
              <span>K</span>
              <span style={{ color: '#2997ff' }}>_</span>
            </div>
            <span style={{ color: '#a1a1a6', fontSize: 28, marginLeft: 18 }}>{eyebrow}</span>
          </div>
          <span style={{ color: '#a1a1a6', fontSize: 28 }}>xik.app</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <span style={{ fontSize: title.length > 18 ? 84 : 112, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.02 }}>
            {title}
          </span>
          <span style={{ color: '#a1a1a6', fontSize: 38, lineHeight: 1.3 }}>{subtitle}</span>
        </div>
      </div>
    ),
    OG_SIZE,
  )
}
