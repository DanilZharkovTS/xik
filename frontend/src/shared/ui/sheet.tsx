'use client'

import { useEffect, useId } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { X } from 'lucide-react'

type SheetProps = {
  title: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

// На телефоні виїжджає знизу (дотягується великим пальцем), на десктопі стає модальним вікном.
export function Sheet({
  title,
  isOpen,
  onClose,
  children,
}: SheetProps): ReactElement | null {
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110]">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 h-full w-full cursor-default bg-black/60"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-3xl border-t border-[var(--l)] bg-[var(--bg)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 md:inset-auto md:left-1/2 md:top-1/2 md:w-[30rem] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:border md:p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-xl font-medium">
            {title}
          </h2>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-mr-2 flex h-11 w-11 items-center justify-center text-[var(--m)] hover:text-[var(--t)]"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
