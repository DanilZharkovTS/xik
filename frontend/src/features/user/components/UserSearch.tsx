'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

import { UsersSearchProps } from '../user.types'

export const UserSearch: React.FC<UsersSearchProps> = ({ search }) => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(search)

  const onSearch = () => {
    const value = searchTerm.trim()

    if (!value) {
      router.push('/admin/users')
      return
    }

    router.push(`/admin/users?search=${encodeURIComponent(value)}`)
  }

  return (
    <div className="flex gap-2">
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSearch()
          }
        }}
        placeholder="Search users..."
        className="min-w-0 flex-1 border-pixel border-border bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-foreground-muted focus:border-foreground"
      />

      <button
        type="button"
        onClick={onSearch}
        className="border-pixel border-border px-5 py-3 text-sm transition-colors hover:bg-muted"
      >
        Search
      </button>
    </div>
  )
}