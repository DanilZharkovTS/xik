'use client'

import { useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { Button } from '@/src/shared/ui/button'
import { SelectField } from '@/src/shared/ui/select-field'
import { TextField } from '@/src/shared/ui/text-field'
import { outreachService } from '../outreach.service'
import { CHANNELS, channelLabel } from '../outreach.types'
import type { Channel, CheckResult, TargetDetail } from '../outreach.types'
import { useOutreachContext } from '../use-outreach-context'
import { CheckResultCard } from './CheckResultCard'
import { useI18n } from '@/src/shared/i18n/use-i18n'

export function CheckScreen(): ReactElement {
  const { t } = useI18n()
  const { token, productId, handleError } = useOutreachContext()

  const [value, setValue] = useState('')
  const [channel, setChannel] = useState<Channel | ''>('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [needsChannel, setNeedsChannel] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const input = () => ({ value: value.trim(), channel: channel || undefined })

  const runCheck = async (event: FormEvent) => {
    event.preventDefault()
    if (!token || !productId || !value.trim()) return

    try {
      setIsChecking(true)
      setNeedsChannel(false)
      setResult(await outreachService.check(input(), token, productId))
    } catch (err) {
      setResult(null)

      if (isAxiosError(err) && err.response?.data?.code === 'INVALID_IDENTIFIER') {
        setNeedsChannel(true)
        toast.error(getErrorMessage(err))
      } else {
        await handleError(err)
      }
    } finally {
      setIsChecking(false)
    }
  }

  const paste = async () => {
    try {
      setValue(await navigator.clipboard.readText())
      setResult(null)
    } catch {
      toast.error(t('check.clipboardFailed'))
    }
  }

  // Після реєстрації чи додавання каналу показуємо ту саму картку, але вже як "мій".
  const showTarget = (target: TargetDetail) => {
    const normalized = result?.normalized
    if (!normalized) return

    setResult({
      normalized,
      status: target.status === 'do_not_contact' ? 'do_not_contact' : target.isMine ? 'mine' : 'foreign',
      owner: target.owner,
      firstContactedAt: target.firstContactedAt,
      target,
    })
  }

  return (
    <div className="space-y-3 md:space-y-5">
      <div>
        <h1 className="text-2xl font-medium md:text-4xl">{t('check.title')}</h1>
        <p className="mt-0.5 text-sm text-[var(--m)] md:mt-1 md:text-base">
          {t('check.intro')}
        </p>
      </div>

      <form onSubmit={runCheck} className="space-y-3">
        <TextField
          label={t('check.input')}
          value={value}
          placeholder={t('check.placeholder')}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => {
            setValue(event.target.value)
            setResult(null)
          }}
        />

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={paste}>
            {t('check.paste')}
          </Button>

          <SelectField
            label={t('check.channel')}
            hideLabel
            pill
            value={channel}
            onChange={(event) => setChannel(event.target.value as Channel | '')}
          >
            <option value="">{t('check.auto')}</option>
            {CHANNELS.map((item) => (
              <option key={item} value={item}>
                {channelLabel(item)}
              </option>
            ))}
          </SelectField>
        </div>

        {needsChannel && (
          <p className="text-sm text-amber-500" role="status">
            {t('check.needChannel')}
          </p>
        )}

        <Button
          type="submit"
          className="min-h-11 w-full"
          disabled={isChecking || !value.trim() || !productId}
        >
          {isChecking ? t('check.checking') : t('check.submit')}
        </Button>
      </form>

      {result && token && productId && (
        <CheckResultCard
          result={result}
          token={token}
          productId={productId}
          registerInput={input()}
          onTarget={showTarget}
          onTaken={setResult}
          onError={handleError}
        />
      )}
    </div>
  )
}
