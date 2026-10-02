'use client'

import { animate } from 'motion/mini'
import { useEffect } from 'react'

import type { ReactElement, RefObject } from 'react'

import {
  PIXEL_REVEAL_DURATION_SECONDS,
  REDUCED_MOTION_MEDIA_QUERY,
} from './motion-policy'

type SectionRevealEnhancerProps = {
  readonly containerRef: RefObject<HTMLDivElement | null>
}

export function SectionRevealEnhancer({
  containerRef,
}: SectionRevealEnhancerProps): ReactElement | null {
  useEffect(() => {
    const container = containerRef.current

    if (
      !container ||
      window.matchMedia(REDUCED_MOTION_MEDIA_QUERY).matches
    ) {
      return
    }

    let animation: ReturnType<typeof animate> | null = null
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return
        }

        observer.disconnect()
        animation = animate(
          container,
          {
            opacity: [0.78, 0.78, 0.9, 0.9, 1],
            transform: [
              'translateY(8px)',
              'translateY(8px)',
              'translateY(4px)',
              'translateY(4px)',
              'translateY(0)',
            ],
          },
          {
            duration: PIXEL_REVEAL_DURATION_SECONDS,
            ease: 'linear',
            times: [0, 0.24, 0.25, 0.64, 0.65],
          },
        )
      },
      {
        threshold: 0.2,
      },
    )

    observer.observe(container)

    return () => {
      observer.disconnect()
      animation?.stop()
    }
  }, [containerRef])

  return null
}
