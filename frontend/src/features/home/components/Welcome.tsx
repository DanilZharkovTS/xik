import type { ReactElement } from 'react'

import { fetchCatalog } from '@/src/features/catalog/catalog-api'
import { ModernHome } from './modern/ModernHome'

// Продукти й агенти це один список з API; тип лише вирішує, в якому блоці головної вони стоять.
export async function Welcome(): Promise<ReactElement> {
  const [products, agents] = await Promise.all([fetchCatalog('product'), fetchCatalog('agent')])

  return <ModernHome products={products} agents={agents} />
}
