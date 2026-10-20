import type { ReactElement } from 'react'

import { cn } from '@/src/shared/lib/cn'
import { ActionMenu } from '@/src/shared/ui/action-menu'
import type { Moderator } from '../team.types'
import { useI18n } from '@/src/shared/i18n/use-i18n'

type ModeratorCardProps = {
  moderator: Moderator
  isBusy: boolean
  onProducts: () => void
  onPassword: () => void
  onTransfer: () => void
  onToggleActive: () => void
}

const DAY_MS = 24 * 60 * 60 * 1000

// "сьогодні", "вчора", "3 дн. тому" або дата: на картці важливо, чи людина взагалі працює.
const useRelative = () => {
  const { t, locale } = useI18n()

  return (value: string | null | undefined): string => {
    if (!value) return t('team.activity.never')
    const date = new Date(value)
    const days = Math.floor((Date.now() - date.getTime()) / DAY_MS)
    if (days <= 0) return t('team.activity.today')
    if (days === 1) return t('team.activity.yesterday')
    if (days < 30) return t('team.activity.daysAgo', { count: days })
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
  }
}

// Уся картка відкриває найчастішу дію (доступ до продуктів); решта в меню "⋯".
export function ModeratorCard({
  moderator,
  isBusy,
  onProducts,
  onPassword,
  onTransfer,
  onToggleActive,
}: ModeratorCardProps): ReactElement {
  const { t } = useI18n()
  const relative = useRelative()
  const isActive = moderator.deactivatedAt === null
  const activity = moderator.activity

  return (
    <li
      className={cn(
        'relative min-w-0 space-y-3 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-3 transition-colors hover:border-[var(--m)] md:p-4',
        !isActive && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onProducts}
            disabled={isBusy}
            className="block max-w-full truncate text-left text-lg font-medium after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[var(--t)]"
          >
            {moderator.name}
          </button>
          <p className="truncate text-sm text-[var(--m)]">{moderator.email}</p>
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-1">
          <span
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-xs font-medium',
              isActive ? 'border-[var(--t)]' : 'border-[var(--l)] text-[var(--m)]',
            )}
          >
            {isActive ? t('team.active') : t('team.deactivated')}
          </span>
          <ActionMenu
            label={t('team.actionsFor', { name: moderator.name })}
            disabled={isBusy}
            items={[
              { label: t('team.manageProducts'), onSelect: onProducts },
              { label: t('team.password'), onSelect: onPassword },
              { label: t('team.transfer'), onSelect: onTransfer },
              isActive
                ? { label: t('team.deactivate'), onSelect: onToggleActive, tone: 'danger' }
                : { label: t('team.activate'), onSelect: onToggleActive },
            ]}
          />
        </div>
      </div>

      {activity && (
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-xs text-[var(--m)]">{t('team.activity.week')}</dt>
            <dd className="font-medium">{activity.weekEvents}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--m)]">{t('team.activity.lastEvent')}</dt>
            <dd className="truncate font-medium">{relative(activity.lastEventAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--m)]">{t('team.activity.lastSignIn')}</dt>
            <dd className="truncate font-medium">{relative(activity.lastSignInAt)}</dd>
          </div>
        </dl>
      )}

      <div>
        <p className="mb-1.5 text-xs uppercase tracking-wider text-[var(--m)]">{t('team.products')}</p>

        {moderator.products.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {moderator.products.map((product) => (
              <li
                key={product.id}
                className="rounded-full border border-[var(--l)] bg-[var(--bg)] px-3 py-1 text-sm"
              >
                {product.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm font-medium text-amber-600">{t('team.noProductsWarning')}</p>
        )}
      </div>
    </li>
  )
}
