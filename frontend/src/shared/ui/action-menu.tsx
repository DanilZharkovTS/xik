'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { MoreHorizontal } from 'lucide-react'

import { cn } from '@/src/shared/lib/cn'

export type ActionMenuItem = {
  label: string
  onSelect: () => void
  tone?: 'default' | 'danger'
  disabled?: boolean
}

// Кнопка "⋯" з другорядними діями картки. Стрілки рухають фокус, Escape закриває,
// клік поза меню теж. Небезпечні дії червоні й відокремлені від решти.
export function ActionMenu({
  label,
  items,
  disabled,
}: {
  label: string
  items: ActionMenuItem[]
  disabled?: boolean
}): ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (!isOpen) return

    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    itemRefs.current.find((item) => item && !item.disabled)?.focus()

    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  const moveFocus = (from: number, step: 1 | -1) => {
    const enabled = itemRefs.current.filter((item): item is HTMLButtonElement => Boolean(item && !item.disabled))
    if (enabled.length === 0) return
    const position = enabled.indexOf(itemRefs.current[from]!)
    enabled[(position + step + enabled.length) % enabled.length].focus()
  }

  const firstDanger = items.findIndex((item) => item.tone === 'danger')

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--m)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--t)] disabled:opacity-50"
      >
        <MoreHorizontal aria-hidden="true" className="h-5 w-5" />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="absolute right-0 top-10 z-30 min-w-52 overflow-hidden rounded-2xl border border-[var(--l)] bg-[var(--bg)] py-1 shadow-xl"
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              ref={(element) => {
                itemRefs.current[index] = element
              }}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  moveFocus(index, 1)
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  moveFocus(index, -1)
                } else if (event.key === 'Tab') {
                  setIsOpen(false)
                }
              }}
              onClick={() => {
                setIsOpen(false)
                item.onSelect()
              }}
              className={cn(
                'flex min-h-10 w-full items-center px-4 text-left text-sm transition-colors hover:bg-[var(--s)] focus:bg-[var(--s)] focus:outline-none disabled:opacity-50',
                item.tone === 'danger' ? 'text-red-500' : 'text-[var(--t)]',
                index === firstDanger && index > 0 && 'mt-1 border-t border-[var(--l)] pt-1',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
