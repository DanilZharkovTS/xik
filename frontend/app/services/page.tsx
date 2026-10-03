import type { Metadata } from 'next'

import { CatalogListPage } from '@/src/features/catalog/components/CatalogListPage'
import { getItemsByType } from '@/src/features/catalog/data/catalog-items'
import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'

export const metadata: Metadata = createPageMetadata({
  title: 'Engineering Services',
  description:
    'XIK engineering services: AI development, AI security audits, backend engineering, observability, identity integrations and legacy modernization.',
  pathname: '/services',
})

export default function ServicesPage() {
  const services = getItemsByType('service')

  return (
    <CatalogListPage
      pathname="/services"
      eyebrow="Services"
      title="Engineering Services"
      intro="The systems underneath: AI development, security audits, backend and identity engineering, observability and legacy modernization delivered by the team that builds XIK."
      cta="View service"
      emptyText="Services are coming soon."
      entries={services.map((service) => ({
        href: `/services/${service.slug}`,
        name: service.title,
        description: service.subtitle,
        eyebrow: service.category,
      }))}
    />
  )
}
