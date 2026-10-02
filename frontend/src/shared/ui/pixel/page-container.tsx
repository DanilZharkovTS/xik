import type { ComponentPropsWithoutRef, ReactElement } from 'react'

import { cn } from '@/src/shared/lib/cn'

type PageContainerProps = ComponentPropsWithoutRef<'div'>

export function PageContainer({
  className,
  ...props
}: PageContainerProps): ReactElement {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-site px-page-gutter',
        className,
      )}
      {...props}
    />
  )
}
