import { create } from 'zustand'
import type { DownloadConfig, DownloadItem, SkillCategory } from '../types/skill'

const defaultConfig: DownloadConfig = {
  sourceType: 'url',
  urls: [],
  githubRepo: '',
  githubBranch: 'main',
  githubPath: '',
  gistId: '',
  targetCategory: 'global',
  targetDir: ''
}

interface DownloadStore {
  isOpen: boolean
  config: DownloadConfig
  items: DownloadItem[]
  isDownloading: boolean
  selectedIds: string[]

  setOpen: (open: boolean) => void
  setConfig: (patch: Partial<DownloadConfig>) => void
  setItems: (items: DownloadItem[]) => void
  updateItem: (id: string, patch: Partial<DownloadItem>) => void
  clearItems: () => void
  setIsDownloading: (v: boolean) => void
  toggleSelected: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  isOpen: false,
  config: { ...defaultConfig },
  items: [],
  isDownloading: false,
  selectedIds: [],

  setOpen: (open) => {
    set({ isOpen: open })
    if (!open) {
      set({ config: { ...defaultConfig }, items: [], selectedIds: [], isDownloading: false })
    }
  },

  setConfig: (patch) => set(state => ({ config: { ...state.config, ...patch } })),

  setItems: (items) => set({ items, selectedIds: items.map(i => i.id) }),

  updateItem: (id, patch) => set(state => ({
    items: state.items.map(i => i.id === id ? { ...i, ...patch } : i)
  })),

  clearItems: () => set({ items: [], selectedIds: [] }),

  setIsDownloading: (v) => set({ isDownloading: v }),

  toggleSelected: (id) => set(state => ({
    selectedIds: state.selectedIds.includes(id)
      ? state.selectedIds.filter(s => s !== id)
      : [...state.selectedIds, id]
  })),

  selectAll: () => set(state => ({
    selectedIds: state.items.map(i => i.id)
  })),

  clearSelection: () => set({ selectedIds: [] })
}))
