'use client'

import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '@/src/shared/i18n/use-i18n'
import type { ReactElement, ReactNode } from 'react'
import { X } from 'lucide-react'

type SheetProps = {
  title: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  // 'lg' для довгих форм: на десктопі ширше вікно.
  size?: 'md' | 'lg'
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

// Відкриті вікна по порядку відкриття: Escape і Tab належать лише верхньому
// (шторка вибору поверх форми не закриває форму).
const openSheets: symbol[] = []

// На телефоні виїжджає знизу (дотягується великим пальцем), на десктопі стає модальним вікном.
// Поки відкрите: фокус усередині й не виходить за межі, Escape закриває, фон не прокручується,
// після закриття фокус повертається на елемент, що відкрив вікно.
export function Sheet({
  title,
  isOpen,
  onClose,
  children,
  size = 'md',
}: SheetProps): ReactElement | null {
  const { t } = useI18n()
  const titleId = useId()
  const sheetKey = useRef(Symbol('sheet'))
  const panelRef = useRef<HTMLDivElement>(null)
  // onClose змінюється при кожному рендері батька; ефект не має перезапускатися й красти фокус.
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!isOpen) return

    const key = sheetKey.current
    openSheets.push(key)
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (openSheets[openSheets.length - 1] !== key) return

      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null,
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement

      if (!first || !last) {
        event.preventDefault()
        return
      }

      // Tab з кінця вертає на початок і навпаки; з самого вікна йде на перший елемент.
      if (event.shiftKey && (current === first || current === panelRef.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && current === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      openSheets.splice(openSheets.indexOf(key), 1)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  // Портал у body: transform батьківського вікна ламає position: fixed вкладеної шторки.
  return createPortal(
    <div className="fixed inset-0 z-[110]">
      <button
        type="button"
        aria-label={t('common.close')}
        tabIndex={-1}
        className="absolute inset-0 h-full w-full cursor-default bg-black/60"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-3xl border-t border-[var(--l)] bg-[var(--bg)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 outline-none md:inset-auto md:left-1/2 md:top-1/2 ${size === 'lg' ? 'md:w-[44rem]' : 'md:w-[30rem]'} md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:border md:p-6`}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-xl font-medium">
            {title}
          </h2>

          <button
            type="button"
            aria-label={t('common.close')}
            onClick={onClose}
            className="-mr-2 flex h-11 w-11 items-center justify-center text-[var(--m)] hover:text-[var(--t)]"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  )
}
