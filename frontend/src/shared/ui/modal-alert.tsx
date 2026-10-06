'use client'

import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ReactElement, ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/src/shared/ui/button'

export type ModalAlertProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger'
  icon?: ReactNode
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function ModalAlert({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  icon,
  isLoading = false,
  onConfirm,
}: ModalAlertProps): ReactElement | null {
  const titleId = useId()
  const descId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!isOpen) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = [
        ...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ].filter((element) => element.offsetParent !== null)
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement

      if (!first || !last) {
        event.preventDefault()
        return
      }

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
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [isOpen, isLoading])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isLoading) onClose()
        }}
      />

      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-3xl border border-[var(--l)] bg-[var(--bg)] p-5 shadow-2xl outline-none md:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {icon && <div className="shrink-0">{icon}</div>}
            <h2 id={titleId} className="text-lg font-semibold md:text-xl text-[var(--t)]">
              {title}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Close"
            disabled={isLoading}
            onClick={onClose}
            className="-mr-1.5 -mt-1.5 flex h-9 w-9 items-center justify-center rounded-full text-[var(--m)] transition-colors hover:bg-[var(--s)] hover:text-[var(--t)] disabled:pointer-events-none"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {description && (
          <div id={descId} className="mt-3 text-sm leading-relaxed text-[var(--m)]">
            {description}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>

          <Button
            variant={confirmVariant === 'danger' ? 'primary' : 'primary'}
            onClick={onConfirm}
            disabled={isLoading}
            className={
              confirmVariant === 'danger'
                ? 'w-full border-red-600 bg-red-600 text-white hover:bg-red-700 sm:w-auto'
                : 'w-full sm:w-auto'
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
