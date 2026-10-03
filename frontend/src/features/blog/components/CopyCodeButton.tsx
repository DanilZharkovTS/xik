'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { Check, Copy } from 'lucide-react'

import { useI18n } from '@/src/shared/i18n/use-i18n'

export function CopyCodeButton({ code }: { code: string }): ReactElement {
  const { t } = useI18n()
  const [isCopied, setIsCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      // Буфер обміну недоступний (наприклад, http): користувач скопіює вручну.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-[var(--m)] transition-colors hover:text-[var(--t)]"
    >
      {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {isCopied ? t('blog.code.copied') : t('blog.code.copy')}
    </button>
  )
}
