'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'

import useAuthStore from '../../auth/store'

import {
  PRODUCT_BILLING_PERIODS,
  PRODUCT_CATEGORIES,
  PRODUCT_CURRENCIES,
} from '@/src/features/products/data/products'

import { updateProductSchema, type UpdateProductDto } from '../products.schema'

import { productsService } from '../services/products.service'
import type { Product, ProductCategory } from '../types'

type UpdateProductProps = {
  product: Product
}

export const UpdateProduct = ({ product }: UpdateProductProps) => {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.accessToken)

  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState<UpdateProductDto>({
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    categories: product.categories,
    features: product.features,
    price: Number(product.price),
    currency: product.currency,
    billingPeriod: product.billingPeriod,
  })

  // Lock background scroll while the modal is open, and keep it
  // anchored to the real viewport instead of a transformed ancestor.
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  const handleChange = (
    field: keyof UpdateProductDto,
    value: string | number
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCategoryToggle = (category: ProductCategory) => {
    setForm((prev) => {
      const categories = prev.categories ?? []

      return {
        ...prev,
        categories: categories.includes(category)
          ? categories.filter((item) => item !== category)
          : [...categories, category],
      }
    })
  }

  const handleFeatureChange = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      features: (prev.features ?? []).map((feature, featureIndex) =>
        featureIndex === index ? value : feature
      ),
    }))
  }

  const addFeature = () => {
    setForm((prev) => ({
      ...prev,
      features: [...(prev.features ?? []), ''],
    }))
  }

  const removeFeature = (index: number) => {
    setForm((prev) => ({
      ...prev,
      features: (prev.features ?? []).filter(
        (_, featureIndex) => featureIndex !== index
      ),
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (user?.role !== 'admin' || !token) {
      return
    }

    const result = updateProductSchema.safeParse({
      ...form,
      features: form.features?.filter((feature) => feature.trim()),
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

      await productsService.updateProduct(product.id, result.data, token)

      toast.success('Product updated successfully')

      setIsOpen(false)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      }

      console.error('Failed to update product:', error)
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'admin') {
    return null
  }

  const modal = isOpen ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => {
        if (!loading) {
          setIsOpen(false)
        }
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col border-pixel border-border bg-background"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b-pixel border-border p-5">
          <div>
            <p className="text-xs uppercase tracking-pixel text-foreground-muted">
              ADMIN / PRODUCT
            </p>

            <h2 className="mt-1 text-xl font-bold uppercase">
              Edit product
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            disabled={loading}
            className="flex size-9 items-center justify-center border-pixel border-border text-xl text-foreground-muted transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 overflow-y-auto p-5"
        >
          <section className="flex flex-col gap-5">
            <div className="border-b-pixel border-border pb-2">
              <p className="text-xs uppercase tracking-pixel text-foreground-muted">
                General
              </p>
            </div>

            <div>
              <label
                htmlFor="edit-product-name"
                className="text-xs uppercase tracking-pixel text-foreground-muted"
              >
                Name
              </label>

              <input
                id="edit-product-name"
                value={form.name ?? ''}
                onChange={(event) =>
                  handleChange('name', event.target.value)
                }
                className="mt-2 w-full border-pixel border-border bg-background px-4 py-3 outline-none transition-colors focus:border-foreground"
              />

              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="edit-product-slug"
                className="text-xs uppercase tracking-pixel text-foreground-muted"
              >
                Slug
              </label>

              <input
                id="edit-product-slug"
                value={form.slug ?? ''}
                onChange={(event) =>
                  handleChange('slug', event.target.value)
                }
                className="mt-2 w-full border-pixel border-border bg-background px-4 py-3 outline-none transition-colors focus:border-foreground"
              />

              {errors.slug && (
                <p className="mt-1 text-sm text-red-500">{errors.slug}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="edit-product-short-description"
                className="text-xs uppercase tracking-pixel text-foreground-muted"
              >
                Short description
              </label>

              <input
                id="edit-product-short-description"
                value={form.shortDescription ?? ''}
                onChange={(event) =>
                  handleChange('shortDescription', event.target.value)
                }
                className="mt-2 w-full border-pixel border-border bg-background px-4 py-3 outline-none transition-colors focus:border-foreground"
              />

              {errors.shortDescription && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.shortDescription}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="edit-product-description"
                className="text-xs uppercase tracking-pixel text-foreground-muted"
              >
                Description
              </label>

              <textarea
                id="edit-product-description"
                value={form.description ?? ''}
                onChange={(event) =>
                  handleChange('description', event.target.value)
                }
                rows={5}
                className="mt-2 w-full resize-none border-pixel border-border bg-background px-4 py-3 outline-none transition-colors focus:border-foreground"
              />

              {errors.description && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.description}
                </p>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <div className="border-b-pixel border-border pb-2">
              <p className="text-xs uppercase tracking-pixel text-foreground-muted">
                Classification
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-pixel text-foreground-muted">
                Categories
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {PRODUCT_CATEGORIES.map((category) => {
                  const selected = form.categories?.includes(category)

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryToggle(category)}
                      className={`border-pixel px-3 py-2 text-xs uppercase transition-colors ${
                        selected
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border text-foreground-muted hover:border-foreground hover:text-foreground'
                      }`}
                    >
                      {category}
                    </button>
                  )
                })}
              </div>

              {errors.categories && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.categories}
                </p>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b-pixel border-border pb-2">
              <p className="text-xs uppercase tracking-pixel text-foreground-muted">
                Features
              </p>

              <button
                type="button"
                onClick={addFeature}
                className="border-pixel border-border px-3 py-2 text-xs uppercase text-foreground-muted transition-colors hover:border-foreground hover:text-foreground"
              >
                + Add
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {(form.features ?? []).map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={feature}
                    onChange={(event) =>
                      handleFeatureChange(index, event.target.value)
                    }
                    placeholder={`Feature ${index + 1}`}
                    className="min-w-0 flex-1 border-pixel border-border bg-background px-4 py-3 outline-none transition-colors focus:border-foreground"
                  />

                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    aria-label={`Remove feature ${index + 1}`}
                    className="flex size-12 shrink-0 items-center justify-center border-pixel border-border text-lg text-foreground-muted transition-colors hover:border-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {errors.features && (
              <p className="text-sm text-red-500">{errors.features}</p>
            )}
          </section>

          <section className="flex flex-col gap-5">
            <div className="border-b-pixel border-border pb-2">
              <p className="text-xs uppercase tracking-pixel text-foreground-muted">
                Pricing
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="edit-product-price"
                  className="text-xs uppercase tracking-pixel text-foreground-muted"
                >
                  Price
                </label>

                <input
                  id="edit-product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price ?? ''}
                  onChange={(event) =>
                    handleChange('price', Number(event.target.value))
                  }
                  className="mt-2 w-full border-pixel border-border bg-background px-4 py-3 outline-none transition-colors focus:border-foreground"
                />
              </div>

              <div className="md:w-28">
                <label
                  htmlFor="edit-product-currency"
                  className="text-xs uppercase tracking-pixel text-foreground-muted"
                >
                  Currency
                </label>

                <select
                  id="edit-product-currency"
                  value={form.currency ?? ''}
                  onChange={(event) =>
                    handleChange('currency', event.target.value)
                  }
                  className="mt-2 w-full border-pixel border-border bg-background px-4 py-3 outline-none transition-colors focus:border-foreground"
                >
                  {PRODUCT_CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:w-36">
                <label
                  htmlFor="edit-product-billing-period"
                  className="text-xs uppercase tracking-pixel text-foreground-muted"
                >
                  Period
                </label>

                <select
                  id="edit-product-billing-period"
                  value={form.billingPeriod ?? ''}
                  onChange={(event) =>
                    handleChange('billingPeriod', event.target.value)
                  }
                  className="mt-2 w-full border-pixel border-border bg-background px-4 py-3 outline-none transition-colors focus:border-foreground"
                >
                  {PRODUCT_BILLING_PERIODS.map((period) => (
                    <option key={period} value={period}>
                      / {period}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {errors.price && (
              <p className="text-sm text-red-500">{errors.price}</p>
            )}
          </section>

          <div className="flex justify-end gap-3 border-t-pixel border-border pt-5">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="border-pixel border-border px-5 py-3 text-sm uppercase text-foreground-muted hover:border-foreground hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="border-pixel border-foreground bg-foreground px-5 py-3 text-sm uppercase text-background disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="border-pixel border-border px-4 py-2 text-sm uppercase tracking-wide text-foreground-muted transition-colors hover:border-foreground hover:text-foreground"
      >
        Edit
      </button>

      {modal && createPortal(modal, document.body)}
    </>
  )
}