'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Cpu,
  Layers,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'

import { useI18n, useLocalePath } from '@/src/shared/i18n/use-i18n'
import type { CatalogItem } from '../data/catalog-items'
import { PurchaseButton } from './PurchaseButton'
import { SaveButton } from './SaveButton'

export interface RelatedItem {
  href: string
  title: string
  subtitle: string
}

export interface PurchaseInfo {
  productId: string
  // Порожній рядок означає, що ціну сховано: користувач побачить її на оплаті.
  priceLabel: string
}

interface CatalogItemDetailProps {
  item: CatalogItem
  related?: RelatedItem[]
  // Є лише в продуктів, придатних до оплати.
  purchase?: PurchaseInfo
}

export function CatalogItemDetail({ item, related = [], purchase }: CatalogItemDetailProps) {
  const { t } = useI18n()
  const href = useLocalePath()
  const { architecture } = item
  const hasSpecs =
    architecture.stack.length > 0 ||
    architecture.runtime !== '' ||
    architecture.deployment !== '' ||
    item.protocols.length > 0

  const parentSection =
    item.type === 'product'
      ? { label: t('detail.section.product'), href: href('/#products') }
      : item.type === 'agent'
      ? { label: t('detail.section.agent'), href: href('/#ai') }
      : { label: t('detail.section.service'), href: href('/#services') }

  return (
    <div className="relative min-h-[calc(100svh-var(--header-height,52px))] pb-28">
      {/* Background ambient radial highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0, 113, 227, 0.14), transparent)',
        }}
      />

      <div className="mx-auto max-w-[1180px] px-6 pt-8">
        {/* Breadcrumb & Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--l)] pb-5">
          <nav aria-label={t('site.breadcrumb')} className="flex items-center gap-2 text-xs text-[var(--m)]">
            <Link href={href('/')} className="transition-colors hover:text-[var(--t)]">
              {t('site.home')}
            </Link>
            <span>/</span>
            <Link
              href={parentSection.href}
              className="transition-colors hover:text-[var(--t)]"
            >
              {parentSection.label}
            </Link>
            <span>/</span>
            <span className="font-semibold text-[var(--t)]">{item.title}</span>
          </nav>

          <Link
            href={parentSection.href}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--m)] transition-colors hover:text-[var(--t)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('detail.back', { section: parentSection.label })}
          </Link>
        </div>

        {/* Hero Header Section */}
        <div className="mt-9 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-[var(--l)] bg-[var(--s)] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
                {item.typeLabel}
              </span>
              <span className="rounded-full border border-[var(--l)] bg-[var(--s)] px-3 py-1 text-xs font-medium text-[var(--m)]">
                {item.category}
              </span>
            </div>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--t)] sm:text-6xl md:text-[68px] leading-[0.98]">
              {item.title}
            </h1>

            <p className="mt-4 text-lg font-medium text-[var(--t)]/85 sm:text-xl">
              {item.subtitle}
            </p>

            <p className="mt-3 text-sm leading-relaxed text-[var(--m)] sm:text-base max-w-2xl">
              {item.description}
            </p>

            {/* Highlights metric pills */}
            <div className="mt-6 flex flex-wrap gap-2" hidden={item.highlights.length === 0}>
              {item.highlights.map((highlight) => (
                <span
                  key={highlight}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--l)] bg-[var(--bg)] px-3.5 py-1.5 text-xs font-medium text-[var(--t)] shadow-2xs"
                >
                  <Zap className="h-3 w-3 text-[var(--b)]" />
                  {highlight}
                </span>
              ))}
            </div>
          </div>

          {/* Status badge */}
          <div className="flex shrink-0 items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--l)] bg-[var(--s)] px-4 py-2 text-xs font-medium text-[var(--t)] shadow-2xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  item.status === 'build' ? 'bg-[#ff9f0a] animate-pulse' : 'bg-emerald-500 animate-pulse'
                }`}
              />
              {item.statusLabel}
            </span>
          </div>
        </div>

        {/* Main Content 2-Column Grid */}
        <div className="mt-12 grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
          {/* Main Content Column */}
          <div className="space-y-12">
            {/* Visual Showcase Card with 3D Orb */}
            <div className="group relative overflow-hidden rounded-3xl border border-[var(--l)] bg-[var(--s)]/75 p-8 shadow-xs backdrop-blur-md transition-all sm:p-12">
              {/* 3D Floating Orb background */}
              <div className="card-orb opacity-90 transition-transform duration-700 group-hover:scale-105" />

              <div className="relative z-10 max-w-lg space-y-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--l)] bg-[var(--bg)] text-[var(--b)] shadow-xs">
                  <Sparkles className="h-6 w-6" />
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
                    {t('detail.architecture')}
                  </span>
                  <p className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--t)] sm:text-3xl">
                    {item.tagline}
                  </p>
                </div>

                <p className="text-sm leading-relaxed text-[var(--m)]">
                  {t('detail.engineered')}
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {item.architecture.runtime && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--l)] bg-[var(--bg)]/90 px-3 py-1 text-xs font-medium text-[var(--t)]">
                    <Cpu className="h-3.5 w-3.5 text-indigo-500" />
                    {item.architecture.runtime}
                  </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--l)] bg-[var(--bg)]/90 px-3 py-1 text-xs font-medium text-[var(--t)]">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    {t('detail.guardrails')}
                  </span>
                  {item.architecture.latency && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--l)] bg-[var(--bg)]/90 px-3 py-1 text-xs font-medium text-[var(--t)]">
                    <Layers className="h-3.5 w-3.5 text-[var(--b)]" />
                    {item.architecture.latency}
                  </span>
                  )}
                </div>
              </div>
            </div>

            {/* Core Capabilities */}
            <section aria-labelledby="capabilities-heading" hidden={item.capabilities.length === 0}>
              <div className="flex items-center justify-between border-b border-[var(--l)] pb-4">
                <h2
                  id="capabilities-heading"
                  className="text-2xl font-bold tracking-tight text-[var(--t)]"
                >
                  {t('detail.capabilities')}
                </h2>
                <span className="text-xs text-[var(--m)]">
                  {t('detail.modules', { count: item.capabilities.length })}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {item.capabilities.map((cap) => (
                  <div
                    key={cap.title}
                    className="flex items-start gap-4 rounded-2xl border border-[var(--l)] bg-[var(--s)]/60 p-5 shadow-2xs transition-all hover:border-[var(--m)] hover:bg-[var(--s)]"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--b)]/10 text-[var(--b)]">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--t)]">
                        {cap.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--m)]">
                        {cap.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Technical Specifications */}
            <section aria-labelledby="specs-heading" hidden={!hasSpecs}>
              <h2
                id="specs-heading"
                className="text-2xl font-bold tracking-tight text-[var(--t)] border-b border-[var(--l)] pb-4"
              >
                {t('detail.specs')}
              </h2>

              <dl className="mt-6 divide-y divide-[var(--l)] rounded-2xl border border-[var(--l)] bg-[var(--s)]/40 overflow-hidden">
                <div className="grid grid-cols-3 px-4 py-4 text-xs sm:px-6 sm:text-sm">
                  <dt className="font-medium text-[var(--m)]">{t('detail.identifier')}</dt>
                  <dd className="col-span-2 font-mono text-[var(--t)]">{item.slug}</dd>
                </div>
                {architecture.stack.length > 0 && (
                <div className="grid grid-cols-3 px-4 py-4 text-xs sm:px-6 sm:text-sm">
                  <dt className="font-medium text-[var(--m)]">{t('detail.stack')}</dt>
                  <dd className="col-span-2 text-[var(--t)]">{architecture.stack.join(', ')}</dd>
                </div>
                )}
                {architecture.runtime && (
                <div className="grid grid-cols-3 px-4 py-4 text-xs sm:px-6 sm:text-sm">
                  <dt className="font-medium text-[var(--m)]">{t('detail.runtime')}</dt>
                  <dd className="col-span-2 text-[var(--t)]">{architecture.runtime}</dd>
                </div>
                )}
                {architecture.deployment && (
                <div className="grid grid-cols-3 px-4 py-4 text-xs sm:px-6 sm:text-sm">
                  <dt className="font-medium text-[var(--m)]">{t('detail.deployment')}</dt>
                  <dd className="col-span-2 text-[var(--t)]">{architecture.deployment}</dd>
                </div>
                )}
                {item.protocols.length > 0 && (
                <div className="grid grid-cols-3 px-4 py-4 text-xs sm:px-6 sm:text-sm">
                  <dt className="font-medium text-[var(--m)]">{t('detail.interfaces')}</dt>
                  <dd className="col-span-2 flex flex-wrap gap-1.5">
                    {item.protocols.map((proto) => (
                      <span
                        key={proto}
                        className="rounded-md border border-[var(--l)] bg-[var(--bg)] px-2 py-0.5 text-xs text-[var(--t)]"
                      >
                        {proto}
                      </span>
                    ))}
                  </dd>
                </div>
                )}
              </dl>
            </section>
          </div>

          {/* Sticky Sidebar Action Card */}
          <aside
            aria-label={t('detail.aside')}
            className="order-first space-y-6 lg:sticky lg:top-20 lg:order-none"
          >
            <div className="rounded-3xl border border-[var(--l)] bg-[var(--s)]/90 p-7 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
                  {t('detail.access')}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-[var(--t)]">
                  {t('detail.verified')}
                </span>
              </div>

              <div className="mt-5">
                <div className="text-2xl font-bold tracking-tight text-[var(--t)] sm:text-3xl">
                  {purchase
                    ? purchase.priceLabel || t('detail.subscription')
                    : item.type === 'product'
                    ? t('detail.license')
                    : item.type === 'agent'
                    ? t('detail.autonomous')
                    : t('detail.service')}
                </div>
                <p className="mt-1.5 text-xs text-[var(--m)]">
                  {purchase
                    ? purchase.priceLabel
                      ? t('detail.billed')
                      : t('detail.priceAtCheckout')
                    : t('detail.available')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {purchase && <PurchaseButton productId={purchase.productId} label={t('detail.subscribe')} />}

                {purchase && <SaveButton productId={purchase.productId} />}

                {item.demoUrl && (
                  <a
                    href={item.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--l)] bg-[var(--bg)] px-6 text-sm font-medium text-[var(--t)] transition-colors hover:bg-[var(--s)]"
                  >
                    {t('detail.demo')}
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}

                <a
                  href={`mailto:contact@xik.app?subject=${encodeURIComponent(
                    t('detail.inquiry', { title: item.title, type: item.typeLabel })
                  )}`}
                  className={
                    purchase
                      ? 'inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--l)] bg-[var(--bg)] px-6 text-sm font-medium text-[var(--t)] transition-colors hover:bg-[var(--s)]'
                      : 'inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--b)] px-6 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.99]'
                  }
                >
                  {purchase ? t('detail.ask') : t('detail.request')}
                  <ArrowUpRight className="h-4 w-4" />
                </a>

                <Link
                  href={href('/#products')}
                  className="inline-flex w-full items-center justify-center rounded-full border border-[var(--l)] bg-[var(--bg)] px-5 py-2.5 text-xs font-medium text-[var(--t)] transition-colors hover:bg-[var(--s)]"
                >
                  {t('detail.overview')}
                </Link>
              </div>

              {/* Value Guarantees */}
              <div className="mt-6 border-t border-[var(--l)] pt-5">
                <ul className="space-y-2 text-xs text-[var(--m)]">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {t('detail.g1')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {t('detail.g2')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {t('detail.g3')}
                  </li>
                </ul>
              </div>

              <div className="mt-6 rounded-2xl bg-[var(--bg)] p-3.5 text-center text-xs text-[var(--m)]">
                {t('detail.custom')}{' '}
                <a
                  href="mailto:contact@xik.app"
                  className="font-medium text-[var(--b)] hover:underline"
                >
                  contact@xik.app
                </a>
              </div>
            </div>
          </aside>
        </div>

        {/* Related Studio Items */}
        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-14">
            <h2 id="related-heading" className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
              {t('detail.more')}
            </h2>

            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {related.map((other) => (
                <li key={other.href}>
                  <Link
                    href={other.href}
                    className="group flex h-full min-h-16 items-center justify-between gap-3 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-4 transition-all hover:border-[var(--m)]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--t)] transition-colors group-hover:text-[var(--b)]">
                        {other.title}
                      </p>
                      <p className="line-clamp-2 text-xs text-[var(--m)]">{other.subtitle}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--m)] transition-colors group-hover:text-[var(--b)]" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
