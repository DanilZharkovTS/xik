'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { ArrowUp } from 'lucide-react'

import { useI18n } from '@/src/shared/i18n/use-i18n'

// Тонка смужка прогресу під шапкою (за статтею, а не за всією сторінкою) і кнопка "вгору".
export function ReadingProgress({ targetId }: { targetId: string }): ReactElement {
  const { t } = useI18n()
  const bar = useRef<HTMLDivElement>(null)
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const target = document.getElementById(targetId)
      if (!target || !bar.current) return

      const rect = target.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1

      // Напряму в DOM: без повторного рендеру на кожен піксель прокрутки.
      bar.current.style.transform = `scaleX(${progress})`
      setShowTop(window.scrollY > 900)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [targetId])

  const toTop = () => {
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
  }

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-[52px] z-40 h-[3px]">
        <div ref={bar} className="h-full origin-left bg-[var(--b)]" style={{ transform: 'scaleX(0)' }} />
      </div>

      {showTop && (
        <button
          type="button"
          onClick={toTop}
          aria-label={t('blog.toTop')}
          className="fixed bottom-5 right-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--l)] bg-[var(--bg)] text-[var(--t)] shadow-lg transition-colors hover:border-[var(--t)] sm:right-6"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </>
  )
}
