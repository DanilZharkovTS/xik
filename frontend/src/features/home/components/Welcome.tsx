import type { ReactElement } from 'react'

import { fetchCatalog } from '@/src/features/catalog/catalog-api'
import type { Locale } from '@/src/shared/i18n/i18n-store'
import { ModernHome } from './modern/ModernHome'

// Продукти й агенти це один список з API; тип лише вирішує, в якому блоці головної вони стоять.
export async function Welcome({ locale }: { locale: Locale }): Promise<ReactElement> {
  const [products, agents] = await Promise.all([
    fetchCatalog('product', locale),
    fetchCatalog('agent', locale),
  ])

  return <ModernHome products={products} agents={agents} />
}
