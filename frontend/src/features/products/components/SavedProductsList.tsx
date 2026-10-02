'use client'

import Link from 'next/link'

import { useEffect, useState } from 'react'

import { PixelHeading } from '@/src/shared/ui/pixel/pixel-heading'
import { PixelPanel } from '@/src/shared/ui/pixel/pixel-panel'

import type { SavedProduct } from '../types'
import { productsService } from '../services/products.service'
import { toast } from 'sonner'
import useAuthStore from '../../auth/store'
import { ToggleSaveProduct } from './ToggleSaveProduct'

export const SavedProductsList = () => {
  const token = useAuthStore((state) => state.accessToken)

  const [saved, setSaved] = useState<SavedProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return

    const getSavedProducts = async () => {
      try {
        const res = await productsService.findSavedProducts(token)

        setSaved(res.products)
      } catch (err) {
        if (err instanceof Error) {
          toast.error(err.message)
        }

        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    getSavedProducts()
  }, [token])

  const handleToggleSave = async (id: string) => {
    setSaved((prev) =>
      prev.map((save) => {
        if (save.product.id === id) {
          return {
            ...save,
            product: {
              ...save.product,
              isSaved: !save.product.isSaved,
            },
          }
        }

        return save
      }),
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <PixelPanel key={index} className="animate-pulse p-5">
            <div className="h-7 w-1/3 bg-surface-muted" />
            <div className="mt-3 h-5 w-2/3 bg-surface-muted" />
            <div className="mt-5 h-4 w-1/4 bg-surface-muted" />
          </PixelPanel>
        ))}
      </div>
    )
  }

  if (saved.length === 0) {
    return (
      <PixelPanel className="p-8 text-center">
        <PixelHeading as="h2" size="section">
          No saved products
        </PixelHeading>

        <p className="mt-3 text-foreground-muted">
          You {"haven't"} saved any products yet.
        </p>

        <Link
          href="/products"
          className="mt-6 inline-block border-pixel border-border px-5 py-3 uppercase tracking-pixel transition-colors duration-step hover:bg-foreground hover:text-background"
        >
          Browse products
        </Link>
      </PixelPanel>
    )
  }

  return (
    <div className="space-y-4">
      {saved.map((s) => (
        <Link
          key={s.product.id}
          href={`/products/${s.product.slug}`}
          className="block"
        >
          <PixelPanel
            className="p-5 transition-transform duration-step hover:-translate-y-1"
            hasShadow
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <PixelHeading as="h2" size="section">
                  {s.product.name}
                </PixelHeading>

                <p className="mt-2 line-clamp-2 text-foreground-muted">
                  {s.product.shortDescription}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {s.product.categories.map((category) => (
                    <span
                      key={category}
                      className="border-pixel border-border px-2 py-1 text-xs uppercase tracking-pixel text-foreground-muted"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-5 md:ml-auto">
                <ToggleSaveProduct
                  product={s.product}
                  onToggleSave={() => handleToggleSave(s.product.id)}
                />

                <div className="shrink-0 border-l-pixel border-border pl-5 md:pl-6">
                  <p className="text-sm uppercase tracking-pixel text-foreground-muted">
                    Price
                  </p>

                  <p className="mt-1 whitespace-nowrap text-xl tracking-pixel">
                    {s.product.price} {s.product.currency}
                  </p>
                </div>
              </div>
            </div>
          </PixelPanel>
        </Link>
      ))}
    </div>
  )
}