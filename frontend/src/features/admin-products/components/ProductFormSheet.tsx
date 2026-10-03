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
import { useI18n } from '@/src/shared/i18n/use-i18n'

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
  const { t } = useI18n()
  const { isOpen, product } = props

  // key скидає стан форми при зміні продукту без ефектів.
  return (
    <Sheet
      title={product ? t('products.form.edit', { name: product.name }) : t('products.form.new')}
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
  const { t } = useI18n()
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
      toast.error(t('products.form.pickCategory'))
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

      toast.success(product ? t('products.form.saved') : t('products.form.created'))
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
      <Group title={t('products.form.basics')}>
        <TextField
          label={t('products.form.name')}
          required
          maxLength={60}
          value={form.name}
          onChange={(e) => {
            set('name', e.target.value)
            if (!slugTouched) set('slug', slugify(e.target.value))
          }}
        />
        <TextField
          label={t('products.form.slug')}
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
            label={t('products.form.block')}
            value={form.kind}
            onChange={(e) => set('kind', e.target.value as FormValues['kind'])}
          >
            <option value="product">{t('products.badge.product')}</option>
            <option value="agent">{t('products.badge.agent')}</option>
          </SelectField>
          <SelectField
            label={t('products.form.status')}
            value={form.status}
            onChange={(e) => set('status', e.target.value as FormValues['status'])}
          >
            <option value="production">{t('products.form.status.production')}</option>
            <option value="active">{t('products.form.status.active')}</option>
            <option value="beta">{t('products.form.status.beta')}</option>
            <option value="build">{t('products.form.status.build')}</option>
          </SelectField>
        </div>
        <TextField
          label={t('products.form.short')}
          required
          maxLength={160}
          value={form.shortDescription}
          onChange={(e) => set('shortDescription', e.target.value)}
        />
        <TextareaField
          label={t('products.form.description')}
          required
          maxLength={2000}
          className={TEXTAREA}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </Group>

      <Group title={t('products.form.priceGroup')}>
        <div className="grid grid-cols-3 gap-3">
          <TextField
            label={t('products.form.price')}
            required
            inputMode="decimal"
            type="number"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
          />
          <SelectField
            label={t('products.form.currency')}
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
            label={t('products.form.per')}
            value={form.billingPeriod}
            onChange={(e) =>
              set('billingPeriod', e.target.value as FormValues['billingPeriod'])
            }
          >
            <option value="week">{t('products.perPeriod.week')}</option>
            <option value="month">{t('products.perPeriod.month')}</option>
            <option value="year">{t('products.perPeriod.year')}</option>
          </SelectField>
        </div>

        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={form.showPrice}
            onChange={(e) => set('showPrice', e.target.checked)}
          />
          <span className="text-base">{t('products.form.showPrice')}</span>
        </label>
        <p className="text-sm text-[var(--m)]">
          {form.showPrice
            ? t('products.form.priceShownHint')
            : t('products.form.priceHiddenHint')}
        </p>

        {priceChanged && (
          <p className="rounded-xl border border-[var(--l)] bg-[var(--s)] px-3 py-2 text-sm">
            {t('products.form.newStripePrice')}
          </p>
        )}
      </Group>

      <Group title={t('products.form.categories')}>
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

      <Group title={t('products.form.content')}>
        <TextField
          label={t('products.form.tagline')}
          maxLength={200}
          value={form.tagline}
          onChange={(e) => set('tagline', e.target.value)}
        />
        <TextField
          label={t('products.form.categoryLabel')}
          maxLength={80}
          value={form.categoryLabel}
          onChange={(e) => set('categoryLabel', e.target.value)}
        />
        <TextareaField
          label={t('products.form.features')}
          required
          className={TEXTAREA}
          value={form.features}
          onChange={(e) => set('features', e.target.value)}
        />
        <TextareaField
          label={t('products.form.highlights')}
          className={TEXTAREA}
          value={form.highlights}
          onChange={(e) => set('highlights', e.target.value)}
        />
        <TextareaField
          label={t('products.form.capabilities')}
          className={TEXTAREA}
          value={form.capabilities}
          onChange={(e) => set('capabilities', e.target.value)}
        />
        <TextField
          label={t('products.form.protocols')}
          value={form.protocols}
          onChange={(e) => set('protocols', e.target.value)}
        />
        <TextField
          label={t('products.form.demo')}
          type="url"
          inputMode="url"
          value={form.demoUrl}
          onChange={(e) => set('demoUrl', e.target.value)}
        />
        <TextField
          label={t('products.form.sort')}
          type="number"
          inputMode="numeric"
          min="0"
          max="9999"
          value={form.sortOrder}
          onChange={(e) => set('sortOrder', e.target.value)}
        />
      </Group>

      <Group title={t('products.form.architecture')}>
        <TextField
          label={t('products.form.stack')}
          value={form.stack}
          onChange={(e) => set('stack', e.target.value)}
        />
        <TextField
          label={t('products.form.runtime')}
          value={form.runtime}
          onChange={(e) => set('runtime', e.target.value)}
        />
        <TextField
          label={t('products.form.deployment')}
          value={form.deployment}
          onChange={(e) => set('deployment', e.target.value)}
        />
        <TextField
          label={t('products.form.latency')}
          value={form.latency}
          onChange={(e) => set('latency', e.target.value)}
        />
      </Group>

      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-[var(--l)] bg-[var(--bg)] px-4 pb-1 pt-3 md:-mx-6 md:px-6">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isSaving}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" className="flex-1" disabled={isSaving}>
          {isSaving ? t('products.form.saving') : product ? t('common.save') : t('products.form.create')}
        </Button>
      </div>
    </form>
  )
}
