'use client'

import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

// Ширина контейнера для SVG-графіка: перемальовуємо при зміні розміру (поворот телефона, вікно).
export function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width))
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [ref])

  return width
}
