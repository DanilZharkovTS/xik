import type { ReactElement } from 'react'

import { highlight } from '../highlight'
import { CopyCodeButton } from './CopyCodeButton'

// Блок коду: підсвічування на сервері, прокрутка вбік замість переносу рядків, кнопка "копіювати".
export function CodeBlock({ code, language }: { code: string; language?: string }): ReactElement {
  const result = highlight(code, language)

  return (
    <figure className="code-block my-8 overflow-hidden rounded-2xl border border-[var(--l)] bg-[var(--s)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--l)] px-4 py-1.5 text-xs text-[var(--m)]">
        <span className="font-mono uppercase tracking-wider">{result.language ?? language ?? 'code'}</span>
        <CopyCodeButton code={code} />
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed" tabIndex={0}>
        <code className="font-mono" dangerouslySetInnerHTML={{ __html: result.html }} />
      </pre>
    </figure>
  )
}
