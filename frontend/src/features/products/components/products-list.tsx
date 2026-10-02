'use client'

import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { productsService } from '@/src/features/products/services/products.service'
import { SectionReveal } from '@/src/shared/motion/section-reveal'
import { PageContainer } from '@/src/shared/ui/pixel/page-container'
import { PixelHeading } from '@/src/shared/ui/pixel/pixel-heading'

import { ProductCard } from './product-card'
import { ProductsSearch } from './ProductsSearch'
import { Product } from '../types'
import useAuthStore from '../../auth/store'

export interface ProductsResponse {
  products: Product[]
  lastId: string | null
  lastCreatedAt: string | null
}

export function ProductsList(): ReactElement {
  const searchParams = useSearchParams()
  const search = searchParams.get('search') ?? ''

  const token = useAuthStore((state) => state.accessToken)

  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productsService.findProducts(search, token)

        setProducts(data.products)
      } catch (error) {
        console.error('Failed to fetch products:', error)
        setProducts([])
      }
    }

    fetchProducts()
  }, [search, token])

  const handleDelete = (productId: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== productId))
  }

  return (
    <section aria-labelledby="products-title" className="py-section">
      <PageContainer>
        <SectionReveal>
          <header className="max-w-3xl">
            <PixelHeading as="h1" id="products-title" size="page">
              AI Products
            </PixelHeading>

            <p className="mt-5 text-xl leading-relaxed text-foreground-muted md:text-2xl">
              Independent AI tools built to remove friction from development and
              creative work.
            </p>

            <ProductsSearch />
          </header>
        </SectionReveal>

        <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                onDelete={() => handleDelete(product.id)}
              />
            </li>
          ))}
        </ul>
      </PageContainer>
    </section>
  )
}
