import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { ReactElement } from 'react'

import { getAbsoluteUrl } from '@/src/config/site'
import { JsonLd } from '@/src/shared/seo/json-ld'

export type CatalogListEntry = {
  readonly href: string
  readonly name: string
  readonly description: string
  readonly eyebrow: string
  readonly price?: string
}

type CatalogListPageProps = {
  readonly pathname: string
  readonly eyebrow: string
  readonly title: string
  readonly intro: string
  readonly cta: string
  readonly entries: readonly CatalogListEntry[]
  readonly emptyText: string
}

// Сторінка-рубрика (/products, /ai, /services): окрема точка входу з пошуку, повний список
// звичайних посилань для краулера й розмітка ItemList.
export function CatalogListPage({
  pathname,
  eyebrow,
  title,
  intro,
  cta,
  entries,
  emptyText,
}: CatalogListPageProps): ReactElement {
  return (
    <>
      <JsonLd
        id="collection-structured-data"
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          description: intro,
          url: getAbsoluteUrl(pathname),
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: entries.length,
            itemListElement: entries.map((entry, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: entry.name,
              url: getAbsoluteUrl(entry.href),
            })),
          },
        }}
      />
      <JsonLd
        id="breadcrumb-structured-data"
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'XIK', item: getAbsoluteUrl('/') },
            { '@type': 'ListItem', position: 2, name: title, item: getAbsoluteUrl(pathname) },
          ],
        }}
      />

      <section className="px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-[1360px]">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--m)]">
            <Link href="/" className="hover:text-[var(--t)]">
              XIK
            </Link>
            <span aria-hidden="true"> / </span>
            <span className="text-[var(--t)]">{title}</span>
          </nav>

          <header className="mb-10 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">{eyebrow}</p>
            <h1 className="mt-2 text-[clamp(34px,5vw,60px)] font-bold leading-[1] tracking-[-0.045em] text-[var(--t)]">
              {title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--m)] md:text-lg">{intro}</p>
          </header>

          {entries.length === 0 ? (
            <p className="rounded-[24px] border border-[var(--l)] bg-[var(--s)] p-8 text-center text-sm text-[var(--m)]">
              {emptyText}
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    className="group flex h-full min-h-[240px] flex-col justify-between rounded-[24px] border border-[var(--l)] bg-[var(--s)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--m)] hover:shadow-xl"
                  >
                    <div>
                      <p className="line-clamp-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--m)]">
                        {entry.eyebrow}
                      </p>
                      <h2 className="my-2.5 text-2xl font-bold tracking-tight text-[var(--t)] transition-colors group-hover:text-[var(--b)]">
                        {entry.name}
                      </h2>
                      <p className="line-clamp-4 text-sm leading-relaxed text-[var(--m)]">
                        {entry.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-4 text-xs font-semibold text-[var(--b)]">
                      <span className="flex items-center gap-1">
                        {cta}
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </span>
                      {entry.price && <span className="text-[var(--t)]">{entry.price}</span>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}
