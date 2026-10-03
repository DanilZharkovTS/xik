// Генерує іконки сайту з одного опису: app/icon.svg, app/favicon.ico, app/apple-icon.png, public/icon-192.png, public/icon-512.png.
//   node scripts/generate-icons.mjs
import { writeFileSync } from 'node:fs'
import sharp from 'sharp'

const mark = `
  <path d="M16 15 44 43M44 15 16 43" stroke="#f5f5f7" stroke-width="9.5" stroke-linecap="round" fill="none"/>
  <rect x="36" y="47" width="18" height="6.5" rx="3.25" fill="#2997ff"/>`

const background = `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#22232b"/>
      <stop offset="1" stop-color="#050507"/>
    </linearGradient>
  </defs>`

// Для вкладки браузера: заокруглений квадрат.
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${background}
  <rect width="64" height="64" rx="15" fill="url(#g)"/>${mark}
</svg>
`

// Для iOS і маніфесту: суцільний квадрат (платформа сама заокруглює), знак трохи менший, щоб не різався маскою.
const square = (inset) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${background}
  <rect width="64" height="64" fill="url(#g)"/>
  <g transform="translate(${32 - 32 * inset} ${32 - 32 * inset}) scale(${inset})">${mark}</g>
</svg>
`

writeFileSync('app/icon.svg', rounded)

const png = (svg, size) => sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer()

writeFileSync('app/apple-icon.png', await png(square(0.82), 180))
writeFileSync('public/icon-192.png', await png(square(0.82), 192))
writeFileSync('public/icon-512.png', await png(square(0.82), 512))

// favicon.ico з PNG-кадрами 16, 32 і 48 px (формат ICO дозволяє PNG усередині).
const sizes = [16, 32, 48]
const frames = await Promise.all(sizes.map((size) => png(rounded, size)))
const header = Buffer.alloc(6 + 16 * sizes.length)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
let offset = header.length
sizes.forEach((size, index) => {
  const entry = 6 + 16 * index
  header.writeUInt8(size, entry)
  header.writeUInt8(size, entry + 1)
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(frames[index].length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += frames[index].length
})
writeFileSync('app/favicon.ico', Buffer.concat([header, ...frames]))
console.log('icons generated')
