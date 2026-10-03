'use client'

import { useRef, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { toast } from 'sonner'

import { Button } from '@/src/shared/ui/button'
import { SelectField } from '@/src/shared/ui/select-field'
import { Sheet } from '@/src/shared/ui/sheet'
import { TextField } from '@/src/shared/ui/text-field'
import { TextareaField } from '@/src/shared/ui/textarea-field'
import { outreachService } from '../outreach.service'
import { TEMPLATE_VARIABLES } from '../render-template'
import { CHANNELS, TEMPLATE_CHANNEL_LABELS } from '../outreach.types'
import type { Template, TemplateChannel } from '../outreach.types'

type TemplateEditorSheetProps = {
  isOpen: boolean
  // null означає створення нового шаблону.
  template: Template | null
  token: string
  productId: string
  onClose: () => void
  onSaved: (template: Template) => void
  onError: (err: unknown) => Promise<void>
}

const CHANNEL_OPTIONS: TemplateChannel[] = ['any', ...CHANNELS]

// Тіло форми окремим компонентом: key перемонтовує його зі свіжими полями при кожному відкритті.
export function TemplateEditorSheet(props: TemplateEditorSheetProps): ReactElement {
  const { isOpen, template, onClose } = props

  return (
    <Sheet
      title={template ? 'Edit template' : 'New template'}
      isOpen={isOpen}
      onClose={onClose}
    >
      <EditorForm key={template?.id ?? 'new'} {...props} />
    </Sheet>
  )
}

function EditorForm({
  template,
  token,
  productId,
  onClose,
  onSaved,
  onError,
}: TemplateEditorSheetProps): ReactElement {
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const [channel, setChannel] = useState<TemplateChannel>(template?.channel ?? 'any')
  const [title, setTitle] = useState(template?.title ?? '')
  const [subject, setSubject] = useState(template?.subject ?? '')
  const [body, setBody] = useState(template?.body ?? '')
  const [version, setVersion] = useState(template?.version ?? 1)
  const [isSaving, setIsSaving] = useState(false)

  const hasSubject = channel === 'email' || channel === 'any'

  const insertVariable = (name: string) => {
    const textarea = bodyRef.current
    const token = `{{${name}}}`
    const start = textarea?.selectionStart ?? body.length
    const end = textarea?.selectionEnd ?? body.length

    setBody(body.slice(0, start) + token + body.slice(end))

    // Курсор після вставленої змінної, щоб можна було продовжити друкувати.
    requestAnimationFrame(() => {
      textarea?.focus()
      textarea?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()

    try {
      setIsSaving(true)
      const fields = {
        channel,
        title: title.trim(),
        subject: hasSubject ? subject.trim() || undefined : undefined,
        body: body.trim(),
      }

      if (!template) {
        onSaved(await outreachService.createTemplate(fields, token, productId))
        toast.success('Template created.')
        onClose()
        return
      }

      const outcome = await outreachService.updateTemplate(
        template.id,
        {
          ...fields,
          subject: hasSubject ? subject.trim() || null : null,
          expectedVersion: version,
        },
        token,
        productId,
      )

      if (outcome.kind === 'stale') {
        // Не затираємо чужі правки: підтягуємо актуальну версію, користувач перевіряє й зберігає ще раз.
        if (outcome.template) {
          setChannel(outcome.template.channel)
          setTitle(outcome.template.title)
          setSubject(outcome.template.subject ?? '')
          setBody(outcome.template.body)
          setVersion(outcome.template.version)
          onSaved(outcome.template)
        }
        toast.error('This template was changed meanwhile. The latest version is loaded: review it and save again.')
        return
      }

      onSaved(outcome.template)
      toast.success('Template saved.')
      onClose()
    } catch (err) {
      await onError(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <TextField
        label="Title"
        value={title}
        maxLength={100}
        required
        autoComplete="off"
        onChange={(event) => setTitle(event.target.value)}
      />

      <SelectField
        label="Channel"
        value={channel}
        onChange={(event) => setChannel(event.target.value as TemplateChannel)}
      >
        {CHANNEL_OPTIONS.map((item) => (
          <option key={item} value={item}>
            {TEMPLATE_CHANNEL_LABELS[item]}
          </option>
        ))}
      </SelectField>

      {hasSubject && (
        <TextField
          label="Subject (email)"
          value={subject}
          maxLength={200}
          autoComplete="off"
          onChange={(event) => setSubject(event.target.value)}
        />
      )}

      <TextareaField
        ref={bodyRef}
        label="Text"
        value={body}
        maxLength={5000}
        required
        onChange={(event) => setBody(event.target.value)}
      />

      <div>
        <p className="mb-1.5 text-sm text-[var(--m)]">Insert variable</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_VARIABLES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => insertVariable(name)}
              className="min-h-11 rounded-full border border-[var(--l)] px-3 font-mono text-sm hover:border-[var(--t)]"
            >
              {`{{${name}}}`}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-[var(--m)]">
        Do not put personal data into templates. The text is shared with everyone in
        this product.
      </p>

      <Button
        type="submit"
        className="min-h-11 w-full"
        disabled={isSaving || !title.trim() || !body.trim()}
      >
        {isSaving ? 'Saving...' : template ? 'Save changes' : 'Create template'}
      </Button>
    </form>
  )
}
