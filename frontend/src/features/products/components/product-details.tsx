'use client'

import Image from 'next/image'
import Link from 'next/link'

import { useEffect, useState } from 'react'

import { PageContainer } from '@/src/shared/ui/pixel/page-container'
import { PixelHeading } from '@/src/shared/ui/pixel/pixel-heading'
import { PixelPanel } from '@/src/shared/ui/pixel/pixel-panel'

import type { Product } from '../types'
import { productsService } from '../services/products.service'
import { toast } from 'sonner'
import { ToggleSaveProduct } from './ToggleSaveProduct'
import useAuthStore from '../../auth/store'

interface ProductDetailsProps {
  slug: string
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ slug }) => {
  const token = useAuthStore((state) => state.accessToken)

  const [product, setProduct] = useState<Product | null>(null)

  useEffect(() => {
    const getProduct = async () => {
      try {
        const { product } = await productsService.findProduct(slug, token)

        setProduct(product)
      } catch (err) {
        if (err instanceof Error) {
          toast.error(err.message)
        }

        console.error(err)
      }
    }

    getProduct()
  }, [slug, token])

  const handleToggleSave = () => {
    setProduct((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        isSaved: !prev.isSaved,
      }
    })
  }

  if (!product) {
    return (
      <PageContainer className="py-section">
        <div className="animate-pulse">
          <div className="h-5 w-64 bg-surface-muted" />

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-16">
            <article>
              <div className="flex gap-2">
                <div className="h-8 w-28 bg-surface-muted" />
                <div className="h-8 w-24 bg-surface-muted" />
              </div>

              <div className="my-8 h-px bg-border" />

              <div className="h-16 w-3/4 bg-surface-muted" />

              <div className="mt-6 space-y-3">
                <div className="h-6 w-full bg-surface-muted" />
                <div className="h-6 w-5/6 bg-surface-muted" />
                <div className="h-6 w-2/3 bg-surface-muted" />
              </div>

              <section className="mt-14">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-48 bg-surface-muted" />
                  <span className="h-px flex-1 bg-border" />
                </div>

                <ul className="mt-7 space-y-3">
                  <li className="h-16 bg-surface-muted" />
                  <li className="h-16 bg-surface-muted" />
                  <li className="h-16 bg-surface-muted" />
                </ul>
              </section>
            </article>

            <aside>
              <PixelPanel className="overflow-hidden" hasShadow>
                <div className="aspect-video bg-surface-muted" />

                <div className="space-y-6 p-5 md:p-7">
                  <div>
                    <div className="h-4 w-20 bg-surface-muted" />
                    <div className="mt-3 h-8 w-40 bg-surface-muted" />
                  </div>

                  <div className="border-t-pixel border-border pt-6">
                    <div className="h-4 w-16 bg-surface-muted" />
                    <div className="mt-3 h-9 w-32 bg-surface-muted" />
                    <div className="mt-2 h-4 w-24 bg-surface-muted" />
                  </div>

                  <div className="border-t-pixel border-border pt-5">
                    <div className="h-5 w-full bg-surface-muted" />
                    <div className="mt-2 h-5 w-4/5 bg-surface-muted" />
                  </div>
                </div>
              </PixelPanel>
            </aside>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="py-section">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-base uppercase tracking-pixel text-foreground-muted md:text-lg">
          <li>
            <Link
              className="transition-colors duration-step hover:text-foreground"
              href="/"
              prefetch={false}
            >
              Home
            </Link>
          </li>

          <li aria-hidden="true">/</li>

          <li>
            <Link
              className="transition-colors duration-step hover:text-foreground"
              href="/products"
              prefetch={false}
            >
              Products
            </Link>
          </li>

          <li aria-hidden="true">/</li>

          <li
            aria-current="page"
            className="max-w-48 truncate text-foreground md:max-w-none"
          >
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="mt-6">
        <ToggleSaveProduct
          product={product}
          onToggleSave={handleToggleSave}
        />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-16">
        <article>
          <div className="flex flex-wrap gap-2">
            {product.categories.map((category) => (
              <span
                key={category}
                className="border-pixel border-border px-3 py-1 text-sm uppercase tracking-pixel text-foreground-muted"
              >
                {category}
              </span>
            ))}
          </div>

          <div className="my-8 h-px bg-border" />

          <PixelHeading as="h1" size="page">
            {product.name}
          </PixelHeading>

          <p className="mt-6 max-w-3xl text-xl leading-relaxed text-foreground-muted md:text-2xl">
            {product.description}
          </p>

          <section aria-labelledby="features-title" className="mt-14">
            <div className="flex items-center gap-4">
              <PixelHeading as="h2" id="features-title" size="section">
                What it does
              </PixelHeading>

              <span
                aria-hidden="true"
                className="h-px flex-1 bg-border"
              />
            </div>

            <ul className="mt-7 space-y-3">
              {product.features.map((feature) => (
                <li
                  key={feature}
                  className="flex gap-4 border-pixel border-border p-4 text-lg md:text-xl"
                >
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-foreground-muted"
                  >
                    &gt;
                  </span>

                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <aside
          aria-label={`${product.name} availability`}
          className="lg:sticky lg:top-8"
        >
          <PixelPanel className="overflow-hidden" hasShadow>
            <figure>
              <div className="relative aspect-video overflow-hidden bg-surface-muted">
                <Image
                  alt=""
                  className="pixelated h-full w-full object-cover"
                  fill
                  sizes="(min-width: 1024px) 24rem, calc(100vw - 2rem)"
                  src="/product-placeholder.jpg"
                />

                <div
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="border-pixel border-border bg-background px-4 py-2 text-sm uppercase tracking-pixel">
                    Preview
                  </span>
                </div>
              </div>

              <figcaption className="border-t-pixel border-border px-5 py-3 text-sm uppercase tracking-pixel text-foreground-muted">
                Product preview coming soon
              </figcaption>
            </figure>

            <div className="space-y-6 p-5 md:p-7">
              <div>
                <p className="text-sm uppercase tracking-pixel text-foreground-muted">
                  Status
                </p>

                <div className="mt-2 flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 animate-pulse bg-foreground"
                  />

                  <p className="text-2xl uppercase tracking-pixel">
                    Coming Soon
                  </p>
                </div>
              </div>

              <div className="border-t-pixel border-border pt-6">
                <p className="text-sm uppercase tracking-pixel text-foreground-muted">
                  Price
                </p>

                <p className="mt-2 text-3xl tracking-pixel">
                  {product.price} {product.currency}
                </p>

                <p className="mt-1 text-sm uppercase tracking-pixel text-foreground-muted">
                  per {product.billingPeriod}
                </p>
              </div>

              <p className="border-t-pixel border-border pt-5 text-base leading-relaxed text-foreground-muted">
                Demo access and purchasing are not available yet.
              </p>
            </div>
          </PixelPanel>
        </aside>
      </div>
    </PageContainer>
  )
}