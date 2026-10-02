import type {
  ComponentPropsWithoutRef,
  ReactElement,
  ReactNode,
} from 'react'

import { cn } from '@/src/shared/lib/cn'

type HeadingLevel = 'h1' | 'h2' | 'h3'
type HeadingSize = 'page' | 'section' | 'card'

type PixelHeadingProps = Omit<
  ComponentPropsWithoutRef<'h1'>,
  'children'
> & {
  as: HeadingLevel
  children: ReactNode
  size?: HeadingSize
}

const SIZE_CLASSES: Record<HeadingSize, string> = {
  page: 'text-5xl leading-[0.9] md:text-7xl lg:text-8xl',
  section: 'text-4xl leading-none md:text-6xl',
  card: 'text-3xl leading-none md:text-5xl',
}

export function PixelHeading({
  as: Heading,
  children,
  className,
  size = 'section',
  ...props
}: PixelHeadingProps): ReactElement {
  return (
    <Heading
      className={cn(
        'uppercase tracking-pixel text-balance',
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {children}
    </Heading>
  )
}
