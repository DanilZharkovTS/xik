'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'

import { useI18n } from '@/src/shared/i18n/use-i18n'
import { ModalAlert } from './modal-alert'

export type ConfirmOptions = {
  title: string
  description?: ReactNode
  confirmLabel: string
  // danger: червона кнопка для дій, які щось прибирають або забирають доступ.
  tone?: 'primary' | 'danger'
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

// Підтвердження в стилі сайту замість системного window.confirm.
// const confirm = useConfirm(); if (!(await confirm({...}))) return
export function ConfirmProvider({ children }: { children: ReactNode }): ReactElement {
  const { t } = useI18n()
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((value: boolean) => void) | null>(null)

  const settle = (value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOptions(null)
  }

  const confirm = useCallback<ConfirmFn>((next) => {
    // Якщо попереднє питання ще відкрите, воно вважається скасованим.
    resolver.current?.(false)
    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ModalAlert
        isOpen={options !== null}
        title={options?.title ?? ''}
        description={options?.description}
        confirmLabel={options?.confirmLabel ?? ''}
        cancelLabel={t('common.cancel')}
        confirmVariant={options?.tone === 'danger' ? 'danger' : 'primary'}
        onClose={() => settle(false)}
        onConfirm={() => settle(true)}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext)

  // Поза провайдером (наприклад, в ізольованому тесті) лишається системне вікно.
  return (
    confirm ??
    (async (options) =>
      window.confirm(typeof options.description === 'string' ? `${options.title}\n\n${options.description}` : options.title))
  )
}
