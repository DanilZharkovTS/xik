'use client'

import React from 'react'
import type { ApiCatalogProduct } from '@/src/features/catalog/catalog.types'
import { ModernHero } from './ModernHero'
import { ModernProducts } from './ModernProducts'
import { ModernAi } from './ModernAi'
import { ModernServices } from './ModernServices'
import { ModernAbout } from './ModernAbout'

type ModernHomeProps = {
  products: ApiCatalogProduct[]
  agents: ApiCatalogProduct[]
}

export function ModernHome({ products, agents }: ModernHomeProps) {
  return (
    <div className="relative w-full overflow-hidden">
      <ModernHero />
      <ModernProducts products={products} />
      <ModernAi agents={agents} />
      <ModernServices />
      <ModernAbout />
    </div>
  )
}
