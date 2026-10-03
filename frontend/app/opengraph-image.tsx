import { ImageResponse } from 'next/og'

export const alt = 'XIK — AI Products, Agents & Engineering Services'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

// Загальна картка для соцмереж: той самий знак X][K_, що й у шапці сайту (у картинці без анімації).
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
        <span style={{ color: '#a1a1a6', fontSize: 30, letterSpacing: '0.04em' }}>xik.app</span>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ alignItems: 'baseline', display: 'flex', fontSize: 210, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 0.95 }}>
            <span>X</span>
            <span style={{ color: '#a1a1a6' }}>][</span>
            <span>K</span>
            <span style={{ color: '#2997ff' }}>_</span>
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
