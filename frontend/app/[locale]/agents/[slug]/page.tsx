import { redirect } from 'next/navigation'

import { withLocale } from '@/src/shared/i18n/paths'
import { localeFromParams } from '@/src/shared/i18n/server'

type AgentPageProps = {
  params: Promise<{
    locale: string
    slug: string
  }>
}

export default async function AgentSlugRedirect({ params }: AgentPageProps) {
  const { slug } = await params
  redirect(withLocale(`/ai/${slug}`, await localeFromParams(params)))
}
