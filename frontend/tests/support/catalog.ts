// Очікувані дані для e2e: продукти й агенти тепер живуть у БД, а їхній вміст береться з того самого
// seed-файлу, який імпортує `npm run products:import` у бекенді. Для цих тестів бекенд має бути запущений
// з імпортованим каталогом.
import catalog from '../../../backend/prisma/seed/catalog.json'

const products = catalog.filter((item) => item.kind === 'product')
const agents = catalog.filter((item) => item.kind === 'agent')

export const PRODUCTS = products.map((item) => ({
  slug: item.slug,
  name: item.name,
  description: item.description,
  features: item.features,
}))

export const MODERN_PRODUCTS = products.map((item) => ({ slug: item.slug, title: item.name }))

export const MODERN_AI_CARDS = agents.map((item) => ({ slug: item.slug, title: item.name }))
