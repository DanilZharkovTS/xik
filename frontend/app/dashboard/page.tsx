'use client'

import Link from 'next/link'
import type { ReactElement } from 'react'

import useAuthStore from '@/src/features/auth/store'

type DashboardLink = {
  href: string
  title: string
  description: string
}

const JOURNAL_LINKS: DashboardLink[] = [
  {
    href: '/outreach/check',
    title: 'Journal',
    description: 'Check a contact, log outreach, templates and publications.',
  },
  {
    href: '/outreach/reports',
    title: 'Reports',
    description: 'Your work by period, channel and product.',
  },
]

const ADMIN_LINKS: DashboardLink[] = [
  {
    href: '/admin/team',
    title: 'Team',
    description: 'Moderators, their products and passwords, transfer of targets.',
  },
  {
    href: '/admin/products',
    title: 'Products',
    description: 'Create and edit the product catalog.',
  },
  {
    href: '/admin/users',
    title: 'Users',
    description: 'Find users and change their roles.',
  },
]

function LinkCards({ title, links }: { title: string; links: DashboardLink[] }): ReactElement {
  return (
    <section className="space-y-3">
      <h2 className="text-sm uppercase tracking-wider text-[var(--m)]">{title}</h2>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block h-full rounded-2xl border border-[var(--l)] bg-[var(--s)] p-4 transition-colors hover:border-[var(--t)]"
            >
              <span className="block text-lg font-medium">{link.title}</span>
              <span className="mt-1 block text-sm text-[var(--m)]">{link.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

const Dashboard = () => {
  const user = useAuthStore((state) => state.user)

  const isAdmin = user?.role === 'admin'
  const canUseJournal = isAdmin || user?.role === 'moderator'

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 md:py-10">
      <div>
        <h1 className="text-3xl font-medium">{isAdmin ? 'Admin dashboard' : 'Dashboard'}</h1>
        {user && (
          <p className="mt-1 break-all text-[var(--m)]">
            {user.name ? `${user.name} · ` : ''}
            {user.email}
          </p>
        )}
      </div>

      {canUseJournal && <LinkCards title="Journal" links={JOURNAL_LINKS} />}
      {isAdmin && <LinkCards title="Administration" links={ADMIN_LINKS} />}

    </div>
  )
}

export default Dashboard
