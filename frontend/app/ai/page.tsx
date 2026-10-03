import type { Metadata } from 'next'

import { fetchCatalog } from '@/src/features/catalog/catalog-api'
import { formatPrice, productHref, statusLabel } from '@/src/features/catalog/catalog-product'
import { CatalogListPage } from '@/src/features/catalog/components/CatalogListPage'
import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = createPageMetadata({
  title: 'AI Agents',
  description:
    'Autonomous AI agents by XIK: RAG retrieval, Telegram and web chat assistants, voice and video AI, and a multi-agent control plane.',
  pathname: '/ai',
})

export default async function AiPage() {
  const agents = await fetchCatalog('agent')

  return (
    <CatalogListPage
      pathname="/ai"
      eyebrow="AI agents"
      title="AI Agents"
      intro="Autonomous agents with a job: grounded RAG retrieval, Telegram and website assistants, voice and video AI, and a multi-tenant platform to run them."
      cta="Explore agent"
      emptyText="Agents are coming soon."
      entries={agents.map((agent) => ({
        href: productHref(agent),
        name: agent.name,
        description: agent.shortDescription,
        eyebrow: [agent.categoryLabel ?? 'AI agent', statusLabel(agent.status)].join(' · '),
        price: formatPrice(agent) || undefined,
      }))}
    />
  )
}
