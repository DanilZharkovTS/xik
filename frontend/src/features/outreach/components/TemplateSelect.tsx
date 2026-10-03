'use client'

import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'

import { SelectField } from '@/src/shared/ui/select-field'
import { outreachService } from '../outreach.service'
import type { Channel, Template } from '../outreach.types'

type TemplateSelectProps = {
  token: string
  productId: string
  // Показуємо шаблони цього каналу й універсальні; без каналу всі активні.
  channel?: Channel | ''
  value: string
  onChange: (templateId: string) => void
}

// Необовʼязковий вибір шаблону, який менеджер щойно надіслав: журнал запамʼятає його версію.
export function TemplateSelect({
  token,
  productId,
  channel,
  value,
  onChange,
}: TemplateSelectProps): ReactElement | null {
  const [templates, setTemplates] = useState<Template[]>([])

  useEffect(() => {
    let isCancelled = false

    outreachService
      .listTemplates(token, productId)
      .then((loaded) => {
        if (!isCancelled) setTemplates(loaded)
      })
      .catch(() => {
        // Вибір шаблону необовʼязковий: без нього форма працює.
      })

    return () => {
      isCancelled = true
    }
  }, [token, productId])

  const options = templates.filter(
    (template) =>
      !channel || template.channel === channel || template.channel === 'any',
  )

  if (options.length === 0) return null

  return (
    <SelectField
      label="Template used (optional)"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">None</option>
      {options.map((template) => (
        <option key={template.id} value={template.id}>
          {template.title} (v{template.version})
        </option>
      ))}
    </SelectField>
  )
}
