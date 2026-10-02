import type { ReactElement } from 'react'

import type { ProductIconName } from '../types'

type ProductIconProps = {
  readonly name: ProductIconName
}

export function ProductIcon({ name }: ProductIconProps): ReactElement {
  if (name === 'code') {
    return (
      <svg
        aria-hidden="true"
        className="size-12 md:size-14"
        focusable="false"
        viewBox="0 0 32 32"
      >
        <path
          d="M4 4h24v4H4V4Zm0 4h4v16H4V8Zm20 0h4v16h-4V8ZM4 24h24v4H4v-4Zm8-12h4v4h-4v-4Zm-4 4h4v4H8v-4Zm4 4h4v4h-4v-4Zm8-8h4v4h-4v-4Zm-4 4h4v4h-4v-4Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className="size-12 md:size-14"
      focusable="false"
      viewBox="0 0 32 32"
    >
      <path
        d="M4 4h24v4H4V4Zm0 8h16v4H4v-4Zm0 8h24v4H4v-4Zm0 8h16v4H4v-4Zm20-16h4v4h-4v-4Zm0 16h4v4h-4v-4Z"
        fill="currentColor"
      />
    </svg>
  )
}
