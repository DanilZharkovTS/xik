'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import type { ArticleCard } from '@/src/features/blog/blog.types'
import { ArticleCardView } from '@/src/features/blog/components/ArticleCardView'
import { useI18n, useLocalePath } from '@/src/shared/i18n/use-i18n'

type ModernBlogSectionProps = {
  articles: ArticleCard[]
}

export function ModernBlogSection({ articles }: ModernBlogSectionProps) {
  const { t, locale } = useI18n()
  const href = useLocalePath()

  if (!articles || articles.length === 0) {
    return null
  }

  const displayedArticles = articles.slice(0, 3)

  return (
    <section id="blog" className="scroll-mt-14 px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-[1360px]">
        {/* Section Header */}
        <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
              {t('home.blog.eyebrow')}
            </div>
            <h2 className="mt-1.5 text-[clamp(34px,4vw,54px)] font-bold leading-[1] tracking-[-0.045em] text-[var(--t)]">
              {t('home.blog.title')}
            </h2>
          </div>
          <div className="max-w-[480px] text-base leading-relaxed text-[var(--m)]">
            {t('home.blog.desc')}
          </div>
        </div>

        {/* 3 Articles Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {displayedArticles.map((article) => (
            <div key={article.id} className="h-full">
              <ArticleCardView article={article} locale={locale} />
            </div>
          ))}
        </div>

        {/* Footer Link */}
        <div className="mt-10 text-center">
          <Link
            href={href('/blog')}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--l)] px-5 text-sm font-semibold text-[var(--t)] transition-colors hover:border-[var(--t)]"
          >
            {t('home.blog.all')}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
