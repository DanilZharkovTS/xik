import type { ComponentPropsWithoutRef, ReactElement } from 'react'

import { cn } from '@/src/shared/lib/cn'

type PixelCardProps = ComponentPropsWithoutRef<'article'>

export function PixelCard({
  className,
  ...props
}: PixelCardProps): ReactElement {
  return (
    <article
      className={cn(
        'border-pixel border-border bg-surface',
        'transition-[transform,border-color,box-shadow] duration-step ease-step',
        'hover:-translate-y-pixel-step hover:border-border-bright hover:shadow-pixel-small',
        'focus-within:-translate-y-pixel-step focus-within:border-border-bright focus-within:shadow-pixel-small',
        className,
      )}
      {...props}
    />
  )
}
