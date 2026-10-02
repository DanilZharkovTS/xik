import type { ComponentPropsWithoutRef, ReactElement } from 'react'

import { cn } from '@/src/shared/lib/cn'

type PixelPanelProps = ComponentPropsWithoutRef<'div'> & {
  hasShadow?: boolean
}

export function PixelPanel({
  className,
  hasShadow = false,
  ...props
}: PixelPanelProps): ReactElement {
  return (
    <div
      className={cn(
        'border-pixel border-border bg-surface',
        hasShadow && 'shadow-pixel',
        className,
      )}
      {...props}
    />
  )
}
