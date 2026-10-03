import Link from 'next/link'
import { ArrowUpRight, Info, Lightbulb, TriangleAlert } from 'lucide-react'
import type { ReactElement } from 'react'

import { formatPrice, productHref } from '@/src/features/catalog/catalog-product'
import type { Locale } from '@/src/shared/i18n/i18n-store'
import { withLocale } from '@/src/shared/i18n/paths'
import { translate } from '@/src/shared/i18n/translate'
import type { PublicBlock } from '../blog.types'
import { RichText } from '../rich-text'
import { ArticleImage } from './ArticleImage'
import { CodeBlock } from './CodeBlock'
import { VideoEmbed } from './VideoEmbed'

const isInternal = (url: string): boolean => url.startsWith('/') && !url.startsWith('//')

function Block({
  block,
  locale,
  anchors,
}: {
  block: PublicBlock
  locale: Locale
  anchors: Map<string, string>
}): ReactElement | null {
  switch (block.type) {
    case 'text':
      return <RichText text={block.text} locale={locale} />

    case 'heading': {
      const id = anchors.get(block.id)
      return block.level === 2 ? (
        <h2 id={id} className="mb-3 mt-12 scroll-mt-24 text-2xl font-bold tracking-tight text-[var(--t)] md:text-3xl">
          {block.text}
        </h2>
      ) : (
        <h3 id={id} className="mb-2 mt-9 scroll-mt-24 text-xl font-bold tracking-tight text-[var(--t)]">
          {block.text}
        </h3>
      )
    }

    case 'image':
      return <ArticleImage url={block.url} width={block.width} height={block.height} alt={block.alt} caption={block.caption} />

    case 'video':
      return <VideoEmbed block={block} />

    case 'code':
      return (
        <div className="lg:-mx-12">
          <CodeBlock code={block.code} language={block.language} />
        </div>
      )

    case 'callout': {
      const tone = {
        info: { Icon: Info, box: 'border-sky-500/40 bg-sky-500/10' },
        tip: { Icon: Lightbulb, box: 'border-emerald-500/40 bg-emerald-500/10' },
        warning: { Icon: TriangleAlert, box: 'border-amber-500/50 bg-amber-500/10' },
      }[block.tone]
      return (
        <aside className={`my-8 flex gap-3 rounded-2xl border p-4 md:p-5 ${tone.box}`}>
          <tone.Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0 text-base leading-relaxed">
            <p className="font-semibold text-[var(--t)]">{block.title || translate(locale, `blog.callout.${block.tone}` as 'blog.callout.info')}</p>
            <div className="[&>p]:my-2 [&>ul]:my-2">
              <RichText text={block.text} locale={locale} />
            </div>
          </div>
        </aside>
      )
    }

    case 'quote':
      return (
        <blockquote className="my-8 border-l-4 border-[var(--b)] pl-5 text-xl font-medium leading-snug text-[var(--t)] md:text-2xl">
          <p>{block.text}</p>
          {block.author && <footer className="mt-3 text-sm font-normal text-[var(--m)]">— {block.author}</footer>}
        </blockquote>
      )

    case 'cta': {
      const className =
        'mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--t)] bg-[var(--t)] px-6 text-sm font-semibold text-[var(--bg)] transition-opacity hover:opacity-90'
      return (
        <aside className="my-10 rounded-3xl border border-[var(--l)] bg-[var(--s)] p-6 md:p-8">
          <p className="text-2xl font-bold tracking-tight text-[var(--t)]">{block.title}</p>
          {block.text && <p className="mt-2 text-base leading-relaxed text-[var(--m)]">{block.text}</p>}
          {isInternal(block.url) ? (
            <Link href={withLocale(block.url, locale)} className={className}>
              {block.buttonLabel}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          ) : (
            <a href={block.url} target="_blank" rel="noopener noreferrer" className={className}>
              {block.buttonLabel}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </aside>
      )
    }

    case 'product': {
      const { product } = block
      const price = formatPrice(product, locale)
      return (
        <Link
          href={withLocale(productHref(product), locale)}
          className="group my-8 flex items-center justify-between gap-4 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-5 transition-colors hover:border-[var(--m)]"
        >
          <div className="min-w-0">
            <p className="text-lg font-bold text-[var(--t)] transition-colors group-hover:text-[var(--b)]">{product.name}</p>
            <p className="mt-1 line-clamp-2 text-sm text-[var(--m)]">{product.shortDescription}</p>
            <p className="mt-2 text-xs font-semibold text-[var(--b)]">
              {translate(locale, 'blog.product.view')}
              {price && <span className="ml-2 text-[var(--t)]">{price}</span>}
            </p>
          </div>
          <ArrowUpRight className="h-5 w-5 shrink-0 text-[var(--m)] transition-colors group-hover:text-[var(--b)]" />
        </Link>
      )
    }
  }
}

export function ArticleBlocks({
  blocks,
  locale,
  anchors,
}: {
  blocks: PublicBlock[]
  locale: Locale
  anchors: Map<string, string>
}): ReactElement {
  return (
    <div className="text-[17px] leading-[1.75] text-[var(--t)]/90">
      {blocks.map((block) => (
        <Block key={block.id} block={block} locale={locale} anchors={anchors} />
      ))}
    </div>
  )
}
