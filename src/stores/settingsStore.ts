import { create } from 'zustand'
import type { AppSettings, SkillDirectory, TargetToolConfig, ToolType } from '../types/skill'
import { getDefaultDirectories } from '../services/skillScanner'

const defaultTargetTools: TargetToolConfig[] = [
  {
    type: 'cursor',
    name: 'Cursor',
    globalDir: '~/.cursor/rules',
    projectDir: '.cursor/rules'
  },
  {
    type: 'claude',
    name: 'Claude Code',
    globalDir: '~/.claude/skills',
    projectDir: '.claude/skills'
  },
  {
    type: 'trae',
    name: 'Trae',
    globalDir: '~/.trae/rules',
    projectDir: '.trae/rules'
  }
]

const defaultSettings: AppSettings = {
  skillDirectories: getDefaultDirectories(),
  targetTools: defaultTargetTools,
  syncBehavior: 'ask',
  theme: 'dark',
  customCategories: []
}

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem('skills-manager-settings')
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        ...defaultSettings,
        ...parsed,
        skillDirectories: parsed.skillDirectories?.length
          ? parsed.skillDirectories
          : defaultSettings.skillDirectories,
        targetTools: parsed.targetTools?.length
          ? parsed.targetTools
          : defaultSettings.targetTools
      }
    }
  } catch {}
  return defaultSettings
}

function pickSettings(state: SettingsStore): AppSettings {
  return {
    skillDirectories: state.skillDirectories,
    targetTools: state.targetTools,
    syncBehavior: state.syncBehavior,
    theme: state.theme,
    customCategories: state.customCategories,
  }
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem('skills-manager-settings', JSON.stringify(settings))
}

interface SettingsStore extends AppSettings {
  setSkillDirectories: (dirs: SkillDirectory[]) => void
  setTargetTools: (tools: TargetToolConfig[]) => void
  addTargetTool: (tool: TargetToolConfig) => void
  removeTargetTool: (type: ToolType) => void
  updateTargetTool: (type: ToolType, updates: Partial<TargetToolConfig>) => void
  setSyncBehavior: (behavior: 'overwrite' | 'merge' | 'ask' | 'symlink') => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setCustomCategories: (categories: string[]) => void
  resetDirectories: () => void
}

export const useSettingsStore = create<SettingsStore>((set, get) => {
  const loaded = loadSettings()
  return {
    ...loaded,

    setSkillDirectories: (dirs) => {
      set({ skillDirectories: dirs })
      saveSettings(pickSettings({ ...get(), skillDirectories: dirs }))
    },

    setTargetTools: (tools) => {
      set({ targetTools: tools })
      saveSettings(pickSettings({ ...get(), targetTools: tools }))
    },

    addTargetTool: (tool) => {
      const targetTools = [...get().targetTools, tool]
      set({ targetTools })
      saveSettings(pickSettings({ ...get(), targetTools }))
    },

    removeTargetTool: (type) => {
      const targetTools = get().targetTools.filter(t => t.type !== type)
      set({ targetTools })
      saveSettings(pickSettings({ ...get(), targetTools }))
    },

    updateTargetTool: (type, updates) => {
      const targetTools = get().targetTools.map(t =>
        t.type === type ? { ...t, ...updates } : t
      )
      set({ targetTools })
      saveSettings(pickSettings({ ...get(), targetTools }))
    },

    setSyncBehavior: (behavior) => {
      set({ syncBehavior: behavior })
      saveSettings(pickSettings({ ...get(), syncBehavior: behavior }))
    },

    setTheme: (theme) => {
      set({ theme })
      saveSettings(pickSettings({ ...get(), theme }))
      applyTheme(theme)
    },

    setCustomCategories: (categories) => {
      set({ customCategories: categories })
      saveSettings(pickSettings({ ...get(), customCategories: categories }))
    },

    resetDirectories: () => {
      const defaults = getDefaultDirectories()
      set({ skillDirectories: defaults })
      saveSettings(pickSettings({ ...get(), skillDirectories: defaults }))
    }
  }
})

function applyTheme(theme: string) {
  const root = document.documentElement
  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}
