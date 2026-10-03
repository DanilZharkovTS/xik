import type { PublicBlock } from './blog.types'

export interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

// Якір для заголовка: літери будь-якої мови лишаються (кирилиця теж), решта стає дефісом.
const toAnchor = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'section'

// Унікальні якорі в межах статті: повторний заголовок отримує суфікс -2, -3.
export function tableOfContents(blocks: PublicBlock[]): { items: TocItem[]; ids: Map<string, string> } {
  const used = new Map<string, number>()
  const ids = new Map<string, string>()
  const items: TocItem[] = []

  for (const block of blocks) {
    if (block.type !== 'heading') continue

    const base = toAnchor(block.text)
    const count = (used.get(base) ?? 0) + 1
    used.set(base, count)

    const id = count === 1 ? base : `${base}-${count}`
    ids.set(block.id, id)
    items.push({ id, text: block.text, level: block.level })
  }

  return { items, ids }
}
