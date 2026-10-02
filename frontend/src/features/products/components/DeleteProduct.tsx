'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import useAuthStore from '../../auth/store'
import { productsService } from '../services/products.service'
import type { Product } from '../types'

type DeleteProductProps = {
  product: Product
  onDelete: (productId: string) => void
}

export const DeleteProduct = ({
  product,
  onDelete
}: DeleteProductProps) => {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.accessToken)

  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (user?.role !== 'admin' || !token || loading) {
      return
    }

    try {
      setLoading(true)

      await productsService.deleteProduct(product.id, token)

      toast.success('Product deleted successfully')

      onDelete(product.id)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      }

      console.error('Failed to delete product:', error)
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'admin') {
    return null
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="border-pixel border-border px-4 py-2 text-sm uppercase tracking-wide text-foreground-muted transition-colors hover:border-red-500 hover:text-red-500 disabled:opacity-50"
    >
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  )
}
