import type { Metadata } from 'next'

import { Auth } from "@/src/features/auth/components/Auth"
import { localeFromParams } from '@/src/shared/i18n/server'
import { translate } from '@/src/shared/i18n/translate'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = await localeFromParams(params)
  return {
    title: translate(locale, 'site.signIn'),
    robots: {
      index: false,
      follow: false,
    },
  }
}

const LoginPage = () => {
  return <Auth />
}

export default LoginPage
