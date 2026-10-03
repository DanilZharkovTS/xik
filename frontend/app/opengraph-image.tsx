import { ImageResponse } from 'next/og'

export const alt = 'XIK — AI Products, Agents & Engineering Services'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

// Загальна картка для соцмереж: той самий знак, що й у іконці вкладки (X і синій курсор).
export default function OpenGraphImage(): ImageResponse {
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
          padding: '72px 80px',
          width: '100%',
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: 14 }}>
          <div style={{ background: '#2997ff', borderRadius: 4, display: 'flex', height: 10, width: 36 }} />
          <span style={{ color: '#a1a1a6', fontSize: 30, letterSpacing: '0.04em' }}>xik.app</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ alignItems: 'flex-end', display: 'flex' }}>
            <span style={{ fontSize: 210, fontWeight: 800, letterSpacing: '-0.06em', lineHeight: 0.9 }}>XIK</span>
            <div style={{ background: '#2997ff', borderRadius: 10, display: 'flex', height: 26, marginBottom: 14, marginLeft: 14, width: 120 }} />
          </div>
          <span style={{ color: '#a1a1a6', fontSize: 46, marginTop: 28 }}>
            Product & AI Lab: building things that should exist.
          </span>
        </div>
      </div>
    ),
    size,
  )
}
