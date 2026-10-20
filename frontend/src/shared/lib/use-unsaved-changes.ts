'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

import { useConfirm } from '@/src/shared/ui/confirm'
import type { ConfirmOptions } from '@/src/shared/ui/confirm'

// Попереджає перед втратою незбережених змін: закриття вкладки чи перезавантаження
// (системне вікно браузера) і перехід за будь-яким посиланням усередині сайту
// (наше вікно підтвердження). Кнопку "назад" браузера App Router перехопити не дає,
// тому редактор ще й зберігає локальну чернетку.
export function useUnsavedChanges(isDirty: boolean, options: ConfirmOptions): void {
  const router = useRouter()
  const confirm = useConfirm()
  const state = useRef({ isDirty, options })

  useEffect(() => {
    state.current = { isDirty, options }
  })

  useEffect(() => {
    if (!isDirty) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      // Старі браузери показують вікно лише з returnValue.
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!state.current.isDirty) return
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return

      event.preventDefault()
      event.stopPropagation()

      void confirm(state.current.options).then((leave) => {
        if (leave) {
          state.current.isDirty = false
          router.push(`${url.pathname}${url.search}${url.hash}`)
        }
      })
    }

    // Фаза перехоплення: спрацьовує раніше за обробник next/link.
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [confirm, router])
}
