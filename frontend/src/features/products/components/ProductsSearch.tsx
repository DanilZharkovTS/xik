'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useState } from 'react'

export const ProductsSearch = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [search, setSearch] = useState(searchParams.get('search') ?? '')

  const handleSearch = (value: string) => {
  setSearch(value)

  if (timerRef.current) {
    clearTimeout(timerRef.current)
  }

  timerRef.current = setTimeout(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (value.trim()) {
      params.set('search', value.trim())
    } else {
      params.delete('search')
    }

    const query = params.toString()

    router.replace(query ? `/products?${query}` : '/products')
  }, 500)
}

  return (
    <div className="mt-8">
      <input
        type="search"
        value={search}
        onChange={(event) => handleSearch(event.target.value)}
        placeholder="Search AI products..."
        className="w-full rounded-full border border-border bg-surface px-5 py-3 text-foreground shadow-sm outline-none transition-colors placeholder:text-foreground-muted focus:border-[var(--b)]"
      />
    </div>
  )
}
