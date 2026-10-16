'use client'

import React from 'react'
import type { ApiCatalogProduct } from '@/src/features/catalog/catalog.types'
import type { ArticleCard } from '@/src/features/blog/blog.types'
import { ModernHero } from './ModernHero'
import { ModernProducts } from './ModernProducts'
import { ModernAi } from './ModernAi'
import { ModernServices } from './ModernServices'
import { ModernBlogSection } from './ModernBlogSection'
import { ModernAbout } from './ModernAbout'
import { ModernCta } from './ModernCta'

type ModernHomeProps = {
  products: ApiCatalogProduct[]
  agents: ApiCatalogProduct[]
  articles?: ArticleCard[]
}

export function ModernHome({ products, agents, articles = [] }: ModernHomeProps) {
  return (
    <div className="relative w-full overflow-hidden">
      <ModernHero />
      <ModernProducts products={products} />
      <ModernAi agents={agents} />
      <ModernServices />
      <ModernBlogSection articles={articles} />
      <ModernAbout />
      <ModernCta />
    </div>
  )
}
