import { create } from 'zustand'

import type { OutreachProduct } from './outreach.types'

const STORAGE_KEY = 'outreach:selectedProductId'

// Сховище може бути недоступним (приватне вікно, заблоковані дані): тоді просто не запамʼятовуємо.
export const readSavedProductId = (): string | null => {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

const saveProductId = (id: string | null): void => {
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id)
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // нічого: вибір просто не збережеться
  }
}

interface OutreachState {
  status: 'loading' | 'ready' | 'error'
  products: OutreachProduct[]
  selectedProductId: string | null

  setProducts: (products: OutreachProduct[]) => void
  setError: () => void
  selectProduct: (id: string) => void
}

// Вибраний продукт лише зручність інтерфейсу: сервер у кожному запиті звіряє його із членством.
export const useOutreachStore = create<OutreachState>((set, get) => ({
  status: 'loading',
  products: [],
  selectedProductId: null,

  setProducts: (products) => {
    const saved = get().selectedProductId ?? readSavedProductId()
    const selected =
      products.find((product) => product.id === saved)?.id ?? products[0]?.id ?? null

    saveProductId(selected)
    set({ status: 'ready', products, selectedProductId: selected })
  },
  setError: () => set({ status: 'error' }),
  selectProduct: (id) => {
    saveProductId(id)
    set({ selectedProductId: id })
  },
}))
