import type {
  AdminProduct,
  Architecture,
  Capability,
  ProductInput,
  ProductTranslation,
  ProductTranslations,
  TranslationLocale,
} from './admin-products.types'

// Мовні поля вводяться текстом, як і основні; порожнє поле означає "показати англійське".
export interface TranslationForm {
  name: string
  shortDescription: string
  description: string
  tagline: string
  categoryLabel: string
  features: string
  highlights: string
  capabilities: string
  runtime: string
  deployment: string
  latency: string
}

export const TRANSLATION_LOCALES: readonly TranslationLocale[] = ['es', 'uk']

export const EMPTY_TRANSLATION: TranslationForm = {
  name: '',
  shortDescription: '',
  description: '',
  tagline: '',
  categoryLabel: '',
  features: '',
  highlights: '',
  capabilities: '',
  runtime: '',
  deployment: '',
  latency: '',
}

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
  translations: Record<TranslationLocale, TranslationForm>
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
  translations: { es: EMPTY_TRANSLATION, uk: EMPTY_TRANSLATION },
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

const capabilitiesText = (items: Capability[]): string =>
  items.map((item) => `${item.title}: ${item.description}`).join('\n')

const translationToForm = (value: ProductTranslation | undefined): TranslationForm => ({
  name: value?.name ?? '',
  shortDescription: value?.shortDescription ?? '',
  description: value?.description ?? '',
  tagline: value?.tagline ?? '',
  categoryLabel: value?.categoryLabel ?? '',
  features: (value?.features ?? []).join('\n'),
  highlights: (value?.highlights ?? []).join('\n'),
  capabilities: capabilitiesText(value?.capabilities ?? []),
  runtime: value?.architecture?.runtime ?? '',
  deployment: value?.architecture?.deployment ?? '',
  latency: value?.architecture?.latency ?? '',
})

// Лишає тільки заповнені поля: порожні не зберігаються, і сайт бере для них англійський текст.
const translationToInput = (form: TranslationForm): ProductTranslation => {
  const result: ProductTranslation = {}
  const text = (key: 'name' | 'shortDescription' | 'description' | 'tagline' | 'categoryLabel') => {
    const value = form[key].trim()
    if (value) result[key] = value
  }

  text('name')
  text('shortDescription')
  text('description')
  text('tagline')
  text('categoryLabel')

  const features = lines(form.features)
  if (features.length > 0) result.features = features
  const highlights = lines(form.highlights)
  if (highlights.length > 0) result.highlights = highlights
  const capabilities = parseCapabilities(form.capabilities)
  if (capabilities.length > 0) result.capabilities = capabilities

  const architecture: NonNullable<ProductTranslation['architecture']> = {}
  if (form.runtime.trim()) architecture.runtime = form.runtime.trim()
  if (form.deployment.trim()) architecture.deployment = form.deployment.trim()
  if (form.latency.trim()) architecture.latency = form.latency.trim()
  if (Object.keys(architecture).length > 0) result.architecture = architecture

  return result
}

const translationsToInput = (forms: Record<TranslationLocale, TranslationForm>): ProductTranslations => {
  const result: ProductTranslations = {}

  for (const locale of TRANSLATION_LOCALES) {
    const value = translationToInput(forms[locale])
    if (Object.keys(value).length > 0) result[locale] = value
  }

  return result
}

// Переклад показується на сайті, лише коли заповнені короткий опис і опис (так само рахує бекенд).
export const isTranslationReady = (form: TranslationForm): boolean =>
  form.shortDescription.trim() !== '' && form.description.trim() !== ''

export const isTranslationStarted = (form: TranslationForm): boolean =>
  Object.keys(translationToInput(form)).length > 0

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
  translations: {
    es: translationToForm(product.translations?.es),
    uk: translationToForm(product.translations?.uk),
  },
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
    translations: translationsToInput(form.translations),
  }
}
