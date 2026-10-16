import { redirect } from 'next/navigation'

export default async function AuthLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(locale === 'en' ? '/login' : `/${locale}/login`)
}