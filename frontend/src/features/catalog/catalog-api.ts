import type { Locale } from '@/src/shared/i18n/i18n-store'
import type { ApiCatalogProduct, ApiProductDetail, ProductKind } from './catalog.types'

// У Docker сервер Next.js звертається до бекенду за внутрішньою адресою (http://backend:5001),
// а браузер за публічною (NEXT_PUBLIC_API_URL). Поза Docker обидві збігаються.
const apiBase = (): string => {
  const base =
    process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001'

  return `${base.replace(/\/$/, '')}/api`
}

// Каталог кешується з тегом: сторінки віддаються швидко, а після змін в адмінці бекенд
// викликає /api/revalidate, і кеш скидається одразу. Година це страховка, якщо виклик не дійшов.
const REVALIDATE_SECONDS = 3600
export const CATALOG_TAG = 'catalog'

const cached = (extraTags: string[] = []): RequestInit => ({
  next: { revalidate: REVALIDATE_SECONDS, tags: [CATALOG_TAG, ...extraTags] },
})

// Блоки сайту не повинні падати разом із бекендом: без даних блок просто порожній.
export async function fetchCatalog(kind?: ProductKind, locale: Locale = 'en'): Promise<ApiCatalogProduct[]> {
  try {
    const query = new URLSearchParams({ lang: locale })
    if (kind) query.set('kind', kind)
    const url = `${apiBase()}/products/catalog?${query}`
    const res = await fetch(url, cached())

    if (!res.ok) {
      console.error(`Catalog request failed: ${res.status}`)
      return []
    }

    return (await res.json()).products as ApiCatalogProduct[]
  } catch (err) {
    console.error('Catalog request failed:', err instanceof Error ? err.message : err)
    return []
  }
}

// null означає, що продукту немає (404). Збій бекенду кидає помилку, а не маскується під "не знайдено".
export async function fetchProduct(slug: string, locale: Locale = 'en'): Promise<ApiProductDetail | null> {
  const res = await fetch(
    `${apiBase()}/products/${encodeURIComponent(slug)}?lang=${locale}`,
    cached([`product:${slug}`]),
  )

  if (res.status === 404) return null

  if (!res.ok) {
    throw new Error(`Product request failed: ${res.status}`)
  }

  return (await res.json()).product as ApiProductDetail
}
