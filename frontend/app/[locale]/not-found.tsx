'use client'

import Image from 'next/image'

import { useI18n, useLocalePath } from '@/src/shared/i18n/use-i18n'

import { PageContainer } from '@/src/shared/ui/pixel/page-container'
import { PixelButton } from '@/src/shared/ui/pixel/pixel-button'
import { PixelHeading } from '@/src/shared/ui/pixel/pixel-heading'

export default function NotFound(): React.ReactElement {
  const { t } = useI18n()
  const href = useLocalePath()

  return (
    <PageContainer className="flex min-h-[calc(100dvh-var(--header-height))] items-center py-section">
      <section
        aria-labelledby="not-found-title"
        className="mx-auto flex w-full max-w-5xl flex-col items-center text-center"
      >
        <PixelHeading as="h1" id="not-found-title" size="page">
          404
        </PixelHeading>
        <p className="mt-3 text-2xl uppercase tracking-pixel text-foreground-muted md:text-4xl">
          {t('notfound.title')}
        </p>

        <Image
          alt=""
          className="theme-sensitive-art pixelated mt-8 h-auto w-full max-w-[41.75rem]"
          height={373}
          sizes="(min-width: 700px) 668px, calc(100vw - 2rem)"
          src="/not-found-castle.png"
          width={668}
        />

        <PixelButton
          className="mt-8 min-w-48"
          href={href('/')}
          prefetch={false}
        >
          {t('notfound.home')}
        </PixelButton>
      </section>
    </PageContainer>
  )
}
