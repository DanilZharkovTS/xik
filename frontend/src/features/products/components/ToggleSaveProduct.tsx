'use client'

import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useState } from 'react'

import { productsService } from '../services/products.service'
import useAuthStore from '../../auth/store'

import type { Product } from '../types'
import { useRouter } from 'next/navigation'

interface ToggleSaveProductProps {
  product: Product
  onToggleSave: () => void
}

export const ToggleSaveProduct: React.FC<ToggleSaveProductProps> = ({
  product,
  onToggleSave,
}) => {
  const router = useRouter()
  const token = useAuthStore((state) => state.accessToken)
  const status = useAuthStore((state) => state.status)

  const [saved, setSaved] = useState(product.isSaved)
  const [loading, setLoading] = useState(false)

  const handleToggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (!token || status !== 'authenticated') {
      router.push('/auth/login')
      return
    }

    if (loading) return

    try {
      setLoading(true)

      const res = await productsService.toggleSaveProduct(product.id, token)

      if (res.status === 200) {
        setSaved(!saved)
      }

      if (res.status === 401) {
        router.push('/auth/login')
      }
      onToggleSave()
    } finally {
      setLoading(false)
    }
  }

  const Icon = saved ? BookmarkCheck : Bookmark

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleToggle}
      aria-label={saved ? 'Remove from saved' : 'Save product'}
      title={saved ? 'Remove from saved' : 'Save product'}
      className={[
        'group shrink-0 border-pixel border-border p-3',
        'transition-colors duration-step',
        saved ? 'bg-foreground text-background' : 'bg-background',
      ].join(' ')}
    >
      <Icon
        size={20}
        strokeWidth={2}
        className={[
          'transition-transform duration-step',
          'group-hover:scale-110',
          loading ? 'animate-pulse' : '',
        ].join(' ')}
      />
    </button>
  )
}
