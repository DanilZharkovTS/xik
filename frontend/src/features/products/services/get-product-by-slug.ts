import { PRODUCTS } from '../data/products'
import { Product } from '../types'

export function getProductBySlug(slug: string): Product | null {
  return PRODUCTS.find((product: Product) => product.slug === slug) ?? null
}
