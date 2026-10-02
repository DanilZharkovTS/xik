import Link from 'next/link'

import type {
  ComponentPropsWithoutRef,
  ReactElement,
  ReactNode,
} from 'react'

import { cn } from '@/src/shared/lib/cn'

type PixelButtonVariant = 'primary' | 'secondary'
type PixelButtonSize = 'default' | 'compact'

type SharedPixelButtonProps = {
  children: ReactNode
  className?: string
  size?: PixelButtonSize
  variant?: PixelButtonVariant
}

type NativeButtonProps = SharedPixelButtonProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof SharedPixelButtonProps> & {
    href?: never
  }

type NextLinkProps = ComponentPropsWithoutRef<typeof Link>

type ButtonLinkProps = SharedPixelButtonProps &
  Omit<NextLinkProps, keyof SharedPixelButtonProps | 'href'> & {
    href: NextLinkProps['href']
  }

export type PixelButtonProps = NativeButtonProps | ButtonLinkProps

const VARIANT_CLASSES: Record<PixelButtonVariant, string> = {
  primary:
    'border-border-bright bg-foreground text-background hover:bg-background hover:text-foreground',
  secondary:
    'border-border bg-background text-foreground hover:border-border-bright hover:bg-foreground hover:text-background',
}

const SIZE_CLASSES: Record<PixelButtonSize, string> = {
  default: 'min-h-12 px-6 py-3 text-xl',
  compact: 'min-h-10 px-4 py-2 text-lg',
}

function getButtonClassName({
  className,
  size = 'default',
  variant = 'primary',
}: Pick<
  SharedPixelButtonProps,
  'className' | 'size' | 'variant'
>): string {
  return cn(
    'inline-flex items-center justify-center border-pixel font-medium uppercase tracking-pixel',
    'shadow-pixel-small transition-[transform,background-color,color,border-color,box-shadow,opacity] duration-step ease-step',
    'hover:-translate-x-pixel-step hover:-translate-y-pixel-step hover:shadow-pixel',
    'active:translate-x-pixel-step active:translate-y-pixel-step active:shadow-none',
    'focus-visible:-translate-x-pixel-step focus-visible:-translate-y-pixel-step focus-visible:shadow-pixel',
    'disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  )
}

function PixelButtonLink({
  children,
  className,
  href,
  size,
  variant,
  ...props
}: ButtonLinkProps): ReactElement {
  return (
    <Link
      className={getButtonClassName({ className, size, variant })}
      href={href}
      {...props}
    >
      {children}
    </Link>
  )
}

function NativePixelButton({
  children,
  className,
  size,
  type = 'button',
  variant,
  ...props
}: NativeButtonProps): ReactElement {
  return (
    <button
      className={getButtonClassName({ className, size, variant })}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}

export function PixelButton(props: PixelButtonProps): ReactElement {
  if (props.href !== undefined) {
    return <PixelButtonLink {...props} />
  }

  return <NativePixelButton {...props} />
}
