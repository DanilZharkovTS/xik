import type { ApiCatalogProduct, ApiProductDetail, ProductKind } from './catalog.types'

// У Docker сервер Next.js звертається до бекенду за внутрішньою адресою (http://backend:5001),
// а браузер за публічною (NEXT_PUBLIC_API_URL). Поза Docker обидві збігаються.
const apiBase = (): string => {
  const base =
    process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001'

  return `${base.replace(/\/$/, '')}/api`
}

// Без кешу: архівований продукт мусить зникнути одразу, а зміна showPrice чи ціни бути видимою
// одразу. Запит дешевий; кеш можна повернути пізніше разом із явним скиданням з адмінки.
const NO_CACHE = { cache: 'no-store' } as const

// Блоки сайту не повинні падати разом із бекендом: без даних блок просто порожній.
export async function fetchCatalog(kind?: ProductKind): Promise<ApiCatalogProduct[]> {
  try {
    const url = `${apiBase()}/products/catalog${kind ? `?kind=${kind}` : ''}`
    const res = await fetch(url, NO_CACHE)

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
export async function fetchProduct(slug: string): Promise<ApiProductDetail | null> {
  const res = await fetch(`${apiBase()}/products/${encodeURIComponent(slug)}`, NO_CACHE)

  if (res.status === 404) return null

  if (!res.ok) {
    throw new Error(`Product request failed: ${res.status}`)
  }

  return (await res.json()).product as ApiProductDetail
}
