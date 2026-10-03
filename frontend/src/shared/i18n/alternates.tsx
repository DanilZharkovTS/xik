'use client'

import { useEffect } from 'react'
import { create } from 'zustand'

import type { Locale } from './i18n-store'

type AlternatesState = {
  paths: Partial<Record<Locale, string>> | null
  set: (paths: Partial<Record<Locale, string>> | null) => void
}

// Сторінки, чиї адреси різні в кожній мові (стаття має власний slug), повідомляють перемикачу
// мови, куди вести. Без цього перемикач просто міняв би префікс і потрапляв би на 404.
export const useAlternatesStore = create<AlternatesState>((set) => ({
  paths: null,
  set: (paths) => set({ paths }),
}))

export function LocaleAlternates({ paths }: { paths: Partial<Record<Locale, string>> }) {
  const set = useAlternatesStore((state) => state.set)
  const key = JSON.stringify(paths)

  useEffect(() => {
    set(JSON.parse(key) as Partial<Record<Locale, string>>)
    return () => set(null)
  }, [key, set])

  return null
}
