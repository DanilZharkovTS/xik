import type { ReactElement } from 'react'

// Знак XIK: дужки "][" читаються як "I", підкреслення це курсор, що блимає.
// Назва бренду для читалок і пошуку лишається "XIK".
export function Logo({ className }: { className?: string }): ReactElement {
  return (
    <span role="img" aria-label="XIK" className={className}>
      <span aria-hidden="true">
        X<span className="text-[var(--m)]">][</span>K<span className="logo-cursor text-[var(--b)]">_</span>
      </span>
    </span>
  )
}
