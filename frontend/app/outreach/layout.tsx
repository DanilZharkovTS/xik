import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { OutreachShell } from '@/src/features/outreach/components/OutreachShell'

export const metadata: Metadata = {
  title: 'Journal',
  robots: { index: false, follow: false },
}

const OutreachLayout = ({ children }: { children: ReactNode }) => {
  return <OutreachShell>{children}</OutreachShell>
}

export default OutreachLayout
