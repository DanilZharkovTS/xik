'use client'

import { useState } from 'react'
import type { FormEvent, ReactElement, ReactNode } from 'react'
import { toast } from 'sonner'

import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { Button } from '@/src/shared/ui/button'
import { SelectField } from '@/src/shared/ui/select-field'
import { Sheet } from '@/src/shared/ui/sheet'
import { TextareaField } from '@/src/shared/ui/textarea-field'
import { TextField } from '@/src/shared/ui/text-field'
import { adminProductsService } from '../admin-products.service'
import { CATEGORIES, CURRENCIES } from '../admin-products.types'
import type { AdminProduct, Category } from '../admin-products.types'
import { EMPTY_FORM, slugify, toForm, toInput } from '../product-form'
import type { FormValues } from '../product-form'

type ProductFormSheetProps = {
  // null і isOpen=false — закрито; isOpen=true без product — створення.
  isOpen: boolean
  product: AdminProduct | null
  token: string
  onClose: () => void
  onSaved: () => Promise<void>
}

const TEXTAREA = "min-h-24"

function Group({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <fieldset className="space-y-3 rounded-2xl border border-[var(--l)] p-3 md:p-4">
      <legend className="px-1 text-xs uppercase tracking-wider text-[var(--m)]">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

export function ProductFormSheet(props: ProductFormSheetProps): ReactElement | null {
  const { isOpen, product } = props

  // key скидає стан форми при зміні продукту без ефектів.
  return (
    <Sheet
      title={product ? `Edit ${product.name}` : 'New product'}
      isOpen={isOpen}
      onClose={props.onClose}
      size="lg"
    >
      <ProductForm key={product?.id ?? 'new'} {...props} />
    </Sheet>
  )
}

function ProductForm({
  product,
  token,
  onClose,
  onSaved,
}: ProductFormSheetProps): ReactElement {
  const [form, setForm] = useState<FormValues>(product ? toForm(product) : EMPTY_FORM)
  const [slugTouched, setSlugTouched] = useState(product !== null)
  const [isSaving, setIsSaving] = useState(false)

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const toggleCategory = (category: Category) =>
    set(
      'categories',
      form.categories.includes(category)
        ? form.categories.filter((item) => item !== category)
        : [...form.categories, category],
    )

  const submit = async (event: FormEvent) => {
    event.preventDefault()

    if (form.categories.length === 0) {
      toast.error('Pick at least one category')
      return
    }

    try {
      setIsSaving(true)
      const input = toInput(form)

      if (product) {
        await adminProductsService.update(product.id, input, token)
      } else {
        await adminProductsService.create(input, token)
      }

      toast.success(product ? 'Product saved' : 'Product created')
      await onSaved()
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const priceChanged = product !== null && Number(form.price) !== Number(product.price)

  return (
    <form onSubmit={submit} className="space-y-4">
      <Group title="Basics">
        <TextField
          label="Name"
          required
          maxLength={60}
          value={form.name}
          onChange={(e) => {
            set('name', e.target.value)
            if (!slugTouched) set('slug', slugify(e.target.value))
          }}
        />
        <TextField
          label="Slug (URL)"
          required
          maxLength={50}
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true)
            set('slug', e.target.value)
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Block on site"
            value={form.kind}
            onChange={(e) => set('kind', e.target.value as FormValues['kind'])}
          >
            <option value="product">Product</option>
            <option value="agent">Agent</option>
          </SelectField>
          <SelectField
            label="Status"
            value={form.status}
            onChange={(e) => set('status', e.target.value as FormValues['status'])}
          >
            <option value="production">Production</option>
            <option value="active">Active</option>
            <option value="beta">Beta</option>
            <option value="build">Build</option>
          </SelectField>
        </div>
        <TextField
          label="Short description"
          required
          maxLength={160}
          value={form.shortDescription}
          onChange={(e) => set('shortDescription', e.target.value)}
        />
        <TextareaField
          label="Description"
          required
          maxLength={2000}
          className={TEXTAREA}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </Group>

      <Group title="Price and Stripe">
        <div className="grid grid-cols-3 gap-3">
          <TextField
            label="Price"
            required
            inputMode="decimal"
            type="number"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
          />
          <SelectField
            label="Currency"
            value={form.currency}
            onChange={(e) => set('currency', e.target.value as FormValues['currency'])}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Per"
            value={form.billingPeriod}
            onChange={(e) =>
              set('billingPeriod', e.target.value as FormValues['billingPeriod'])
            }
          >
            <option value="week">week</option>
            <option value="month">month</option>
            <option value="year">year</option>
          </SelectField>
        </div>

        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={form.showPrice}
            onChange={(e) => set('showPrice', e.target.checked)}
          />
          <span className="text-base">Show price on the product page</span>
        </label>
        <p className="text-sm text-[var(--m)]">
          {form.showPrice
            ? 'Visitors see the price before they pay.'
            : 'The price appears only at checkout.'}
        </p>

        {priceChanged && (
          <p className="rounded-xl border border-[var(--l)] bg-[var(--s)] px-3 py-2 text-sm">
            A new Stripe price will be created; existing subscribers keep the old one.
          </p>
        )}
      </Group>

      <Group title="Categories">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => {
            const isOn = form.categories.includes(category)
            return (
              <button
                key={category}
                type="button"
                aria-pressed={isOn}
                onClick={() => toggleCategory(category)}
                className={`min-h-9 rounded-full border px-3 text-sm transition-colors ${
                  isOn
                    ? 'border-[var(--t)] bg-[var(--t)] text-[var(--bg)]'
                    : 'border-[var(--l)] text-[var(--m)] hover:border-[var(--t)]'
                }`}
              >
                {category}
              </button>
            )
          })}
        </div>
      </Group>

      <Group title="Page content">
        <TextField
          label="Tagline"
          maxLength={200}
          value={form.tagline}
          onChange={(e) => set('tagline', e.target.value)}
        />
        <TextField
          label="Category label"
          maxLength={80}
          value={form.categoryLabel}
          onChange={(e) => set('categoryLabel', e.target.value)}
        />
        <TextareaField
          label="Features (one per line)"
          required
          className={TEXTAREA}
          value={form.features}
          onChange={(e) => set('features', e.target.value)}
        />
        <TextareaField
          label="Highlights (one per line)"
          className={TEXTAREA}
          value={form.highlights}
          onChange={(e) => set('highlights', e.target.value)}
        />
        <TextareaField
          label="Capabilities (Title: description, one per line)"
          className={TEXTAREA}
          value={form.capabilities}
          onChange={(e) => set('capabilities', e.target.value)}
        />
        <TextField
          label="Protocols (comma separated)"
          value={form.protocols}
          onChange={(e) => set('protocols', e.target.value)}
        />
        <TextField
          label="Demo URL"
          type="url"
          inputMode="url"
          value={form.demoUrl}
          onChange={(e) => set('demoUrl', e.target.value)}
        />
        <TextField
          label="Sort order"
          type="number"
          inputMode="numeric"
          min="0"
          max="9999"
          value={form.sortOrder}
          onChange={(e) => set('sortOrder', e.target.value)}
        />
      </Group>

      <Group title="Architecture (optional)">
        <TextField
          label="Stack (comma separated)"
          value={form.stack}
          onChange={(e) => set('stack', e.target.value)}
        />
        <TextField
          label="Runtime"
          value={form.runtime}
          onChange={(e) => set('runtime', e.target.value)}
        />
        <TextField
          label="Deployment"
          value={form.deployment}
          onChange={(e) => set('deployment', e.target.value)}
        />
        <TextField
          label="Latency"
          value={form.latency}
          onChange={(e) => set('latency', e.target.value)}
        />
      </Group>

      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-[var(--l)] bg-[var(--bg)] px-4 pb-1 pt-3 md:-mx-6 md:px-6">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isSaving}>
          {isSaving ? 'Saving...' : product ? 'Save' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
