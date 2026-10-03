'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { toast } from 'sonner'

import useAuthStore from '@/src/features/auth/store'
import { siteConfig } from '@/src/config/site'
import { Button } from '@/src/shared/ui/button'
import { Sheet } from '@/src/shared/ui/sheet'
import { TextField } from '@/src/shared/ui/text-field'
import { findUnfilled, renderTemplate } from '../render-template'
import type { OutreachProduct, Template } from '../outreach.types'
import { templateChannelLabel } from '../outreach.types'
import { useI18n } from '@/src/shared/i18n/use-i18n'

type CopyTemplateSheetProps = {
  template: Template | null
  product: OutreachProduct | null
  onClose: () => void
}

// Менеджер підставляє імʼя, бачить готовий текст і копіює його одним дотиком.
export function CopyTemplateSheet({
  template,
  product,
  onClose,
}: CopyTemplateSheetProps): ReactElement {
  const { t } = useI18n()
  const managerName = useAuthStore((state) => state.user?.name)
  const [recipient, setRecipient] = useState('')
  const [copied, setCopied] = useState<'subject' | 'body' | null>(null)

  const values = {
    name: recipient,
    product_name: product?.name,
    product_link: product ? `${siteConfig.origin}/products/${product.slug}` : undefined,
    manager_name: managerName,
  }

  const subject = template?.subject ? renderTemplate(template.subject, values) : null
  const body = template ? renderTemplate(template.body, values) : ''
  const unfilled = findUnfilled(`${subject ?? ''}\n${body}`)

  const close = () => {
    setCopied(null)
    onClose()
  }

  const copy = async (what: 'subject' | 'body') => {
    try {
      await navigator.clipboard.writeText(what === 'subject' ? (subject ?? '') : body)
      setCopied(what)
    } catch {
      toast.error(t('tpl.copySheet.copyFailed'))
    }
  }

  return (
    <Sheet title={t('tpl.copySheet.title')} isOpen={template !== null} onClose={close}>
      {template && (
        <div className="space-y-4">
          <div>
            <p className="break-words font-medium">{template.title}</p>
            <p className="text-sm text-[var(--m)]">
              {templateChannelLabel(template.channel)} · v{template.version}
            </p>
          </div>

          <TextField
            label={t('tpl.copySheet.recipient', { tag: '{{name}}' })}
            value={recipient}
            autoComplete="off"
            onChange={(event) => {
              setCopied(null)
              setRecipient(event.target.value)
            }}
          />

          {subject !== null && (
            <div className="space-y-1.5">
              <p className="text-sm text-[var(--m)]">{t('tpl.copySheet.subject')}</p>
              <p className="break-words rounded-xl border border-[var(--l)] bg-[var(--bg)] px-3 py-2">
                {subject}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-sm text-[var(--m)]">{t('tpl.copySheet.text')}</p>
            <p className="max-h-60 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-[var(--l)] bg-[var(--bg)] px-3 py-2">
              {body}
            </p>
          </div>

          {unfilled.length > 0 && (
            <p className="text-sm text-amber-500" role="status">
              {t('tpl.copySheet.unfilled', { names: unfilled.map((name) => `{{${name}}}`).join(', ') })}
            </p>
          )}

          <div className="grid gap-2">
            {subject !== null && (
              <Button variant="secondary" onClick={() => copy('subject')}>
                {copied === 'subject' ? t('tpl.copySheet.subjectCopied') : t('tpl.copySheet.copySubject')}
              </Button>
            )}

            <Button className="min-h-11" onClick={() => copy('body')}>
              {copied === 'body' ? t('tpl.copySheet.textCopied') : t('tpl.copySheet.copyText')}
            </Button>
          </div>

          <p className="text-sm text-[var(--m)]">
            {t('tpl.copySheet.after')}
          </p>
        </div>
      )}
    </Sheet>
  )
}
