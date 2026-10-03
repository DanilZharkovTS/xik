'use client'

import { useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { Button } from '@/src/shared/ui/button'
import { TextField } from '@/src/shared/ui/text-field'
import { outreachService } from '../outreach.service'
import { CHANNELS, CHANNEL_LABELS } from '../outreach.types'
import type { Channel, CheckResult, TargetDetail } from '../outreach.types'
import { useOutreachContext } from '../use-outreach-context'
import { CheckResultCard } from './CheckResultCard'

export function CheckScreen(): ReactElement {
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
        toast.error(err.response.data.message)
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
      toast.error('Could not read the clipboard. Paste manually.')
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
        <h1 className="text-2xl font-medium md:text-4xl">Check</h1>
        <p className="mt-0.5 text-sm text-[var(--m)] md:mt-1 md:text-base">
          Paste a Telegram username, email, LinkedIn, Facebook or website link to see
          whether anyone has already written to them.
        </p>
      </div>

      <form onSubmit={runCheck} className="space-y-3">
        <TextField
          label="Username, email or link"
          value={value}
          placeholder="@username, name@company.com, https://..."
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
            Paste
          </Button>

          <div>
            <label htmlFor="channel" className="sr-only">
              Channel
            </label>
            <select
              id="channel"
              value={channel}
              onChange={(event) => setChannel(event.target.value as Channel | '')}
              className="min-h-11 w-full rounded-full border border-[var(--l)] bg-[var(--bg)] px-4 text-base outline-none focus:border-[var(--t)]"
            >
              <option value="">Auto-detect</option>
              {CHANNELS.map((item) => (
                <option key={item} value={item}>
                  {CHANNEL_LABELS[item]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {needsChannel && (
          <p className="text-sm text-amber-500" role="status">
            Could not recognize the value. Choose the channel and check again.
          </p>
        )}

        <Button
          type="submit"
          className="min-h-11 w-full"
          disabled={isChecking || !value.trim() || !productId}
        >
          {isChecking ? 'Checking...' : 'Check'}
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
