import type {
  AdminProduct,
  Architecture,
  Capability,
  ProductInput,
} from './admin-products.types'

// Форма працює з текстом: списки вводяться рядками, ціна рядком.
export interface FormValues {
  name: string
  slug: string
  kind: ProductInput['kind']
  status: ProductInput['status']
  shortDescription: string
  description: string
  categories: ProductInput['categories']
  features: string
  categoryLabel: string
  tagline: string
  highlights: string
  capabilities: string
  stack: string
  runtime: string
  deployment: string
  latency: string
  protocols: string
  demoUrl: string
  sortOrder: string
  price: string
  currency: ProductInput['currency']
  billingPeriod: ProductInput['billingPeriod']
  showPrice: boolean
}

export const EMPTY_FORM: FormValues = {
  name: '',
  slug: '',
  kind: 'product',
  status: 'active',
  shortDescription: '',
  description: '',
  categories: [],
  features: '',
  categoryLabel: '',
  tagline: '',
  highlights: '',
  capabilities: '',
  stack: '',
  runtime: '',
  deployment: '',
  latency: '',
  protocols: '',
  demoUrl: '',
  sortOrder: '0',
  price: '',
  currency: 'USD',
  billingPeriod: 'month',
  showPrice: true,
}

const lines = (text: string): string[] =>
  text.split('\n').map((line) => line.trim()).filter(Boolean)

const commas = (text: string): string[] =>
  text.split(',').map((item) => item.trim()).filter(Boolean)

export const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)

// "Назва: опис" на рядок.
const parseCapabilities = (text: string): Capability[] =>
  lines(text).map((line) => {
    const index = line.indexOf(':')
    return index === -1
      ? { title: line, description: line }
      : { title: line.slice(0, index).trim(), description: line.slice(index + 1).trim() }
  })

export const toForm = (product: AdminProduct): FormValues => ({
  name: product.name,
  slug: product.slug,
  kind: product.kind,
  status: product.status,
  shortDescription: product.shortDescription,
  description: product.description,
  categories: product.categories,
  features: product.features.join('\n'),
  categoryLabel: product.categoryLabel ?? '',
  tagline: product.tagline ?? '',
  highlights: product.highlights.join('\n'),
  capabilities: product.capabilities
    .map((item) => `${item.title}: ${item.description}`)
    .join('\n'),
  stack: product.architecture?.stack.join(', ') ?? '',
  runtime: product.architecture?.runtime ?? '',
  deployment: product.architecture?.deployment ?? '',
  latency: product.architecture?.latency ?? '',
  protocols: product.protocols.join(', '),
  demoUrl: product.demoUrl ?? '',
  sortOrder: String(product.sortOrder),
  price: product.price,
  currency: product.currency,
  billingPeriod: product.billingPeriod,
  showPrice: product.showPrice,
})

export const toInput = (form: FormValues): ProductInput => {
  const architecture: Architecture | null =
    form.stack.trim() || form.runtime.trim() || form.deployment.trim() || form.latency.trim()
      ? {
          stack: commas(form.stack),
          runtime: form.runtime.trim(),
          deployment: form.deployment.trim(),
          latency: form.latency.trim(),
        }
      : null

  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    kind: form.kind,
    status: form.status,
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim(),
    categories: form.categories,
    features: lines(form.features),
    categoryLabel: form.categoryLabel.trim() || null,
    tagline: form.tagline.trim() || null,
    highlights: lines(form.highlights),
    capabilities: parseCapabilities(form.capabilities),
    architecture,
    protocols: commas(form.protocols),
    demoUrl: form.demoUrl.trim() || null,
    sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
    price: Number(form.price),
    currency: form.currency,
    billingPeriod: form.billingPeriod,
    showPrice: form.showPrice,
  }
}
