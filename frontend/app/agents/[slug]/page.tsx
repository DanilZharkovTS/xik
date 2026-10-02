import { redirect } from 'next/navigation'

type AgentPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function AgentSlugRedirect({ params }: AgentPageProps) {
  const { slug } = await params
  redirect(`/ai/${slug}`)
}
