import { ImageResponse } from 'next/og'

export const alt = 'XIK — AI Tools With Pixel Soul'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage(): ImageResponse {
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
            fontSize: 32,
            justifyContent: 'space-between',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <span>Independent AI products</span>
          <span>xik.app</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <span
            style={{
              fontSize: 180,
              fontWeight: 700,
              letterSpacing: '0.08em',
              lineHeight: 0.8,
            }}
          >
            XIK
          </span>
          <span
            style={{
              borderTop: '8px solid #f5f5f5',
              fontSize: 54,
              letterSpacing: '0.08em',
              paddingTop: 24,
              textTransform: 'uppercase',
            }}
          >
            AI tools with pixel soul
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((pixel) => (
            <span
              key={pixel}
              style={{
                background: pixel % 2 === 0 ? '#f5f5f5' : '#525252',
                display: 'flex',
                height: 20,
                width: 20,
              }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  )
}
