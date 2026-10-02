import type { ReactElement } from 'react'

import { PixelButton } from '@/src/shared/ui/pixel/pixel-button'
import { PixelCard } from '@/src/shared/ui/pixel/pixel-card'
import { PixelHeading } from '@/src/shared/ui/pixel/pixel-heading'

import { ProductIcon } from './product-icon'

import type { Product } from '../types'
import { UpdateProduct } from './updateProduct'
import { DeleteProduct } from './DeleteProduct'

export type ProductCardProps = {
  readonly headingAs?: 'h2' | 'h3'
  readonly moduleMode?: boolean
  readonly product: Product
  readonly onDelete?: (id: string) => void
}

export function ProductCard({
  headingAs = 'h2',
  moduleMode = false,
  product,
  onDelete,
}: ProductCardProps): ReactElement {
  return (
    <PixelCard
      className={`group product-card-motion flex h-full flex-col p-5 md:min-h-[32rem] md:p-8 ${
        moduleMode ? 'home-product-module' : ''
      }`}
      data-product-module={moduleMode ? '' : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="product-card-icon flex size-20 shrink-0 items-center justify-center border-pixel border-border bg-background text-foreground md:size-24">
          <ProductIcon name={product.slug} />
        </div>

        <div className="flex shrink-0 gap-2">
          <UpdateProduct product={product} />

          {onDelete && (
            <DeleteProduct
              product={product}
              onDelete={onDelete}
            />
          )}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-lg uppercase tracking-pixel text-foreground-muted">
          {product.categories[0]}
        </p>

        <PixelHeading as={headingAs} size="card">
          {product.name}
        </PixelHeading>

        <p className="mt-4 text-xl leading-relaxed text-foreground-muted">
          {product.shortDescription}
        </p>

        <p className="mt-3 text-lg leading-relaxed text-foreground-muted md:text-xl">
          {product.description}
        </p>
      </div>

      <p
        aria-hidden="true"
        className="product-card-status mt-6 text-lg uppercase tracking-pixel text-foreground-muted"
      >
        <span className="product-card-status-idle">
          {moduleMode ? 'Module: standby' : 'Status: indexed'}
        </span>

        <span className="product-card-status-active">
          {moduleMode
            ? 'Module loaded / Press enter'
            : 'Status: signal locked'}
        </span>
      </p>

      <PixelButton
        className="mt-8 w-full md:mt-auto md:w-fit"
        href={`/products/${product.slug}`}
      >
        View Product
      </PixelButton>
    </PixelCard>
  )
}