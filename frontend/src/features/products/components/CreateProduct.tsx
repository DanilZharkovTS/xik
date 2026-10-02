'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import useAuthStore from '../../auth/store'

import {
  PRODUCT_BILLING_PERIODS,
  PRODUCT_CATEGORIES,
  PRODUCT_CURRENCIES,
} from '@/src/features/products/data/products'

import { PixelButton } from '@/src/shared/ui/pixel/pixel-button'
import { PixelCard } from '@/src/shared/ui/pixel/pixel-card'
import { PixelHeading } from '@/src/shared/ui/pixel/pixel-heading'

import {
  CreateProductDto,
  createProductSchema,
} from '../products.schema'

import { productsService } from '../services/products.service'

export const CreateProduct = () => {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.accessToken)

  const [form, setForm] = useState<CreateProductDto>({
    slug: '',
    name: '',
    shortDescription: '',
    description: '',
    categories: [],
    features: [''],
    price: 0,
    currency: 'USD',
    billingPeriod: 'month',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleChange = (
    field: keyof CreateProductDto,
    value: string | number,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCategoryToggle = (
    category: CreateProductDto['categories'][number],
  ) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((item) => item !== category)
        : [...prev.categories, category],
    }))
  }

  const handleFeatureChange = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.map((feature, featureIndex) =>
        featureIndex === index ? value : feature,
      ),
    }))
  }

  const addFeature = () => {
    setForm((prev) => ({
      ...prev,
      features: [...prev.features, ''],
    }))
  }

  const removeFeature = (index: number) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter(
        (_, featureIndex) => featureIndex !== index,
      ),
    }))
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (user?.role !== 'admin' || !token) {
      return
    }

    const result = createProductSchema.safeParse({
      ...form,
      features: form.features.filter((feature) => feature.trim()),
    })

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}

      result.error.issues.forEach((issue) => {
        const field = issue.path[0]?.toString()

        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      })

      setErrors(fieldErrors)
      return
    }

    try {
      setErrors({})
      setLoading(true)

      await productsService.createProduct(result.data, token)

      toast.success('Product created successfully')

      setForm({
        slug: '',
        name: '',
        shortDescription: '',
        description: '',
        categories: [],
        features: [''],
        price: 0,
        currency: 'USD',
        billingPeriod: 'month',
      })
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      }

      console.error('Failed to create product:', error)
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <section className="py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="mb-2 text-sm uppercase tracking-pixel text-foreground-muted">
            ADMIN / PRODUCTS
          </p>

          <PixelHeading as="h1" size="page">
            Create Product
          </PixelHeading>

          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-foreground-muted">
            Add a new AI product to the platform catalog.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* BASIC INFORMATION */}
          <PixelCard className="p-6 md:p-8">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-pixel text-foreground-muted">
                01 / BASIC INFORMATION
              </p>

              <PixelHeading
                as="h2"
                size="card"
                className="mt-2"
              >
                Product details
              </PixelHeading>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium uppercase tracking-wide"
                >
                  Name
                </label>

                <input
                  id="name"
                  value={form.name}
                  onChange={(event) =>
                    handleChange('name', event.target.value)
                  }
                  placeholder="AI Code Helper"
                  className="w-full border-pixel border-border bg-background px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-foreground"
                />

                {errors.name && (
                  <p className="text-sm text-red-500">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="slug"
                  className="text-sm font-medium uppercase tracking-wide"
                >
                  Slug
                </label>

                <input
                  id="slug"
                  value={form.slug}
                  onChange={(event) =>
                    handleChange('slug', event.target.value)
                  }
                  placeholder="ai-code-helper"
                  className="w-full border-pixel border-border bg-background px-4 py-3 font-mono text-base text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-foreground"
                />

                <p className="text-xs text-foreground-muted">
                  Used in the product URL.
                </p>

                {errors.slug && (
                  <p className="text-sm text-red-500">
                    {errors.slug}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="shortDescription"
                  className="text-sm font-medium uppercase tracking-wide"
                >
                  Short description
                </label>

                <input
                  id="shortDescription"
                  value={form.shortDescription}
                  onChange={(event) =>
                    handleChange(
                      'shortDescription',
                      event.target.value,
                    )
                  }
                  placeholder="Your AI pair programmer."
                  maxLength={160}
                  className="w-full border-pixel border-border bg-background px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-foreground"
                />

                <div className="flex justify-between text-xs text-foreground-muted">
                  <span>Maximum 160 characters</span>
                  <span>{form.shortDescription.length}/160</span>
                </div>

                {errors.shortDescription && (
                  <p className="text-sm text-red-500">
                    {errors.shortDescription}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="description"
                  className="text-sm font-medium uppercase tracking-wide"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  value={form.description}
                  onChange={(event) =>
                    handleChange('description', event.target.value)
                  }
                  placeholder="Describe what this product does..."
                  rows={7}
                  maxLength={2000}
                  className="w-full resize-y border-pixel border-border bg-background px-4 py-3 text-base leading-relaxed text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-foreground"
                />

                <div className="flex justify-between text-xs text-foreground-muted">
                  <span>Maximum 2000 characters</span>
                  <span>{form.description.length}/2000</span>
                </div>

                {errors.description && (
                  <p className="text-sm text-red-500">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </PixelCard>

          {/* CATEGORIES */}
          <PixelCard className="p-6 md:p-8">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-pixel text-foreground-muted">
                02 / CLASSIFICATION
              </p>

              <PixelHeading
                as="h2"
                size="card"
                className="mt-2"
              >
                Categories
              </PixelHeading>

              <p className="mt-2 text-sm text-foreground-muted">
                Select all categories that describe this product.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRODUCT_CATEGORIES.map((category) => {
                const selected = form.categories.includes(category)

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryToggle(category)}
                    className={`border-pixel px-4 py-2 text-sm uppercase tracking-wide transition-colors ${
                      selected
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background text-foreground-muted hover:border-foreground hover:text-foreground'
                    }`}
                  >
                    {category}
                  </button>
                )
              })}
            </div>

            {errors.categories && (
              <p className="mt-4 text-sm text-red-500">
                {errors.categories}
              </p>
            )}
          </PixelCard>

          {/* FEATURES */}
          <PixelCard className="p-6 md:p-8">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-pixel text-foreground-muted">
                03 / FEATURES
              </p>

              <PixelHeading
                as="h2"
                size="card"
                className="mt-2"
              >
                Product features
              </PixelHeading>
            </div>

            <div className="flex flex-col gap-3">
              {form.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex gap-3"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center border-pixel border-border text-sm text-foreground-muted">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <input
                    value={feature}
                    onChange={(event) =>
                      handleFeatureChange(
                        index,
                        event.target.value,
                      )
                    }
                    placeholder="Smart code completion"
                    maxLength={50}
                    className="min-w-0 flex-1 border-pixel border-border bg-background px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-foreground"
                  />

                  {form.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="border-pixel border-border px-4 text-sm uppercase text-foreground-muted transition-colors hover:border-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addFeature}
                className="mt-2 self-start border-pixel border-border px-4 py-2 text-sm uppercase tracking-wide text-foreground-muted transition-colors hover:border-foreground hover:text-foreground"
              >
                + Add feature
              </button>
            </div>

            {errors.features && (
              <p className="mt-4 text-sm text-red-500">
                {errors.features}
              </p>
            )}
          </PixelCard>

          {/* PRICING */}
          <PixelCard className="p-6 md:p-8">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-pixel text-foreground-muted">
                04 / PRICING
              </p>

              <PixelHeading
                as="h2"
                size="card"
                className="mt-2"
              >
                Pricing
              </PixelHeading>
            </div>

            <div className="flex flex-col gap-6 md:flex-row">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <label
                  htmlFor="price"
                  className="text-sm font-medium uppercase tracking-wide"
                >
                  Price
                </label>

                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    handleChange(
                      'price',
                      Number(event.target.value),
                    )
                  }
                  className="w-full border-pixel border-border bg-background px-4 py-3 font-mono text-base text-foreground outline-none transition-colors focus:border-foreground"
                />

                {errors.price && (
                  <p className="text-sm text-red-500">
                    {errors.price}
                  </p>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <label
                  htmlFor="currency"
                  className="text-sm font-medium uppercase tracking-wide"
                >
                  Currency
                </label>

                <select
                  id="currency"
                  value={form.currency}
                  onChange={(event) =>
                    handleChange(
                      'currency',
                      event.target.value as CreateProductDto['currency'],
                    )
                  }
                  className="w-full appearance-none border-pixel border-border bg-background px-4 py-3 text-base text-foreground outline-none focus:border-foreground"
                >
                  {PRODUCT_CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>

                {errors.currency && (
                  <p className="text-sm text-red-500">
                    {errors.currency}
                  </p>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <label
                  htmlFor="billingPeriod"
                  className="text-sm font-medium uppercase tracking-wide"
                >
                  Billing period
                </label>

                <select
                  id="billingPeriod"
                  value={form.billingPeriod}
                  onChange={(event) =>
                    handleChange(
                      'billingPeriod',
                      event.target.value as CreateProductDto['billingPeriod'],
                    )
                  }
                  className="w-full appearance-none border-pixel border-border bg-background px-4 py-3 text-base text-foreground outline-none focus:border-foreground"
                >
                  {PRODUCT_BILLING_PERIODS.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>

                {errors.billingPeriod && (
                  <p className="text-sm text-red-500">
                    {errors.billingPeriod}
                  </p>
                )}
              </div>
            </div>
          </PixelCard>

          {/* SUBMIT */}
          <div className="flex flex-col gap-4 border-pixel border-border bg-background p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-pixel text-foreground-muted">
                READY TO DEPLOY
              </p>

              <p className="mt-1 text-sm text-foreground-muted">
                Review the information before creating the product.
              </p>
            </div>

            <PixelButton
              type="submit"
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? 'Creating...' : 'Create product'}
            </PixelButton>
          </div>
        </form>
      </div>
    </section>
  )
}