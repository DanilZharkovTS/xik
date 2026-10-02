import type { ReactElement } from 'react'

export interface BreakdownRow {
  key: string
  label: string
  value: number
}

type BreakdownListProps = {
  title: string
  rows: BreakdownRow[]
  // Скільки рядків показати окремо; решту згортаємо в "Other".
  limit?: number
}

const BAR_HEIGHT = 10

// Одна серія: один колір для всіх смуг. Довжина вже несе величину, тому без градієнта.
// Значення стоїть над смугою, а не всередині неї, тож жоден підпис не обрізається.
export function BreakdownList({ title, rows, limit = 8 }: BreakdownListProps): ReactElement {
  const visible = rows.slice(0, limit)
  const rest = rows.slice(limit)
  const shown: BreakdownRow[] =
    rest.length > 0
      ? [
          ...visible,
          {
            key: 'other',
            label: `Other (${rest.length})`,
            value: rest.reduce((sum, row) => sum + row.value, 0),
          },
        ]
      : visible
  const max = Math.max(1, ...shown.map((row) => row.value))

  return (
    <section className="viz-root rounded-2xl border border-[var(--l)] bg-[var(--viz-surface)] p-4">
      <h2 className="mb-3 text-base font-medium text-[var(--viz-text)]">{title}</h2>

      {shown.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--viz-muted)]">No activity in this period</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((row) => (
            <li key={row.key}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 break-words text-[var(--viz-text-2)]">{row.label}</span>
                <strong className="shrink-0 font-semibold text-[var(--viz-text)]">
                  {row.value.toLocaleString()}
                </strong>
              </div>
              <div
                className="rounded-r"
                style={{
                  height: BAR_HEIGHT,
                  width: `${Math.max(2, (row.value / max) * 100)}%`,
                  background: 'var(--viz-seq)',
                  borderRadius: '0 4px 4px 0',
                }}
                role="presentation"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
