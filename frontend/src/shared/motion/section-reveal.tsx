'use client'

import dynamic from 'next/dynamic'
import { useRef } from 'react'

import type { ReactElement, ReactNode } from 'react'

import { cn } from '@/src/shared/lib/cn'

type SectionRevealProps = {
  readonly children: ReactNode
  readonly className?: string
}

const SectionRevealEnhancer = dynamic(
  () =>
    import('./section-reveal-enhancer').then(
      (module) => module.SectionRevealEnhancer,
    ),
  {
    ssr: false,
  },
)

export function SectionReveal({
  children,
  className,
}: SectionRevealProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className={cn('transform-gpu', className)}>
      {children}
      <SectionRevealEnhancer containerRef={containerRef} />
    </div>
  )
}
