import { create } from 'zustand'
import type { Skill } from '../types/skill'
import { scanSkills } from '../services/skillScanner'
import { useSettingsStore } from './settingsStore'

interface SkillStore {
  skills: Skill[]
  openTabs: string[]
  activeTabId: string | null
  loading: boolean
  error: string | null
  viewMode: 'tree' | 'list'

  openSkill: (id: string) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  setViewMode: (mode: 'tree' | 'list') => void
  refreshSkills: () => Promise<void>
}

export const useSkillStore = create<SkillStore>((set) => ({
  skills: [],
  openTabs: [],
  activeTabId: null,
  loading: false,
  error: null,
  viewMode: 'tree',

  openSkill: (id) => set(state => {
    if (state.openTabs.includes(id)) {
      return { activeTabId: id }
    }
    return { openTabs: [...state.openTabs, id], activeTabId: id }
  }),

  closeTab: (id) => set(state => {
    const idx = state.openTabs.indexOf(id)
    const newTabs = state.openTabs.filter(t => t !== id)
    if (state.activeTabId !== id) {
      return { openTabs: newTabs }
    }
    if (newTabs.length === 0) return { openTabs: [], activeTabId: null }
    const newIdx = Math.min(idx, newTabs.length - 1)
    return { openTabs: newTabs, activeTabId: newTabs[newIdx] }
  }),

  setActiveTab: (id) => set({ activeTabId: id }),

  setViewMode: (mode) => set({ viewMode: mode }),

  refreshSkills: async () => {
    const { skillDirectories } = useSettingsStore.getState()
    const enabledDirs = skillDirectories.filter(d => d.enabled)

    set({ loading: true, error: null })
    try {
      const skills = await scanSkills(enabledDirs)
      set({ skills, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  }
}))
