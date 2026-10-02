'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/src/shared/ui/button'
import { UsersSearchProps } from '../user.types'

export const UserSearch: React.FC<UsersSearchProps> = ({ search }) => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(search)

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const value = searchTerm.trim()

    router.push(value ? `/admin/users?search=${encodeURIComponent(value)}` : '/admin/users')
  }

  return (
    <form onSubmit={onSearch} className="flex gap-2">
      <input
        type="search"
        aria-label="Search users"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by name"
        className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--l)] bg-[var(--bg)] px-3 text-base outline-none focus:border-[var(--t)]"
      />

      <Button type="submit" variant="secondary">
        Search
      </Button>
    </form>
  )
}
