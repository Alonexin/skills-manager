import { create } from 'zustand'

interface SearchStore {
  query: string
  isOpen: boolean
  filters: {
    category: 'all' | 'global' | 'project'
    toolType: string
  }

  setQuery: (q: string) => void
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  setFilter: (key: 'category' | 'toolType', value: string) => void
  reset: () => void
}

export const useSearchStore = create<SearchStore>((set) => ({
  query: '',
  isOpen: false,
  filters: {
    category: 'all',
    toolType: 'all'
  },

  setQuery: (q) => set({ query: q }),
  setOpen: (open) => set({ isOpen: open }),
  toggleOpen: () => set(s => ({ isOpen: !s.isOpen })),
  setFilter: (key, value) => set(s => ({
    filters: { ...s.filters, [key]: value }
  })),
  reset: () => set({ query: '', filters: { category: 'all', toolType: 'all' } })
}))
