import { timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

import { CATALOG_TAG } from '@/src/features/catalog/catalog-api'

const matches = (given: string | null, expected: string): boolean => {
  if (!given) return false

  const a = Buffer.from(given)
  const b = Buffer.from(expected)

  return a.length === b.length && timingSafeEqual(a, b)
}

// Бекенд викликає після будь-якої зміни продукту. Без секрету ендпоінт вимкнений.
export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.REVALIDATE_SECRET

  if (!secret) {
    return NextResponse.json({ revalidated: false, reason: 'disabled' }, { status: 503 })
  }

  if (!matches(request.headers.get('x-revalidate-secret'), secret)) {
    return NextResponse.json({ revalidated: false }, { status: 401 })
  }

  revalidateTag(CATALOG_TAG, 'max')

  return NextResponse.json({ revalidated: true })
}
