'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { areaOf } from '@/src/shared/i18n/paths'
import type { JSX } from 'react'

const SITE_KEY = 'xik-app'

declare global {
  interface Window {
    AgentPlatformWidget?: {
      mount(siteKey: string, target?: HTMLElement): Promise<HTMLIFrameElement | null>
      unmount(siteKey: string): void
    }
  }
}

function mountPublicChat(): void {
  // Check the current URL: the script may finish after navigation to an account page.
  if (areaOf(window.location.pathname) !== 'public') return
  void window.AgentPlatformWidget?.mount(SITE_KEY).catch(() => {
    // Chat availability must not interrupt the public website.
  })
}

export function PublicChatWidget(): JSX.Element | null {
  const isPublic = areaOf(usePathname()) === 'public'

  useEffect(() => {
    if (isPublic) mountPublicChat()
    return () => window.AgentPlatformWidget?.unmount(SITE_KEY)
  }, [isPublic])

  if (!isPublic) return null

  return (
    <Script
      id="xik-public-chat"
      src="https://agent.xik.app/public/v1/widget.js"
      strategy="lazyOnload"
      onReady={mountPublicChat}
    />
  )
}
