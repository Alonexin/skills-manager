import { create } from 'zustand'
import type { SyncJob, ToolType } from '../types/skill'

interface SyncStore {
  jobs: SyncJob[]
  selectedSourceIds: string[]
  selectedTargetTools: ToolType[]
  isRunning: boolean
  showPreview: boolean
  previewContent: string | null
  syncedMap: Record<string, ToolType[]>

  setSelectedSourceIds: (ids: string[]) => void
  setSelectedTargetTools: (tools: ToolType[]) => void
  toggleSource: (id: string) => void
  toggleTarget: (tool: ToolType) => void
  addJob: (job: SyncJob) => void
  updateJob: (id: string, update: Partial<SyncJob>) => void
  setShowPreview: (show: boolean) => void
  setPreviewContent: (content: string | null) => void
  setIsRunning: (running: boolean) => void
  clearJobs: () => void
  markSynced: (skillId: string, tool: ToolType) => void
  clearSynced: () => void
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  jobs: [],
  selectedSourceIds: [],
  selectedTargetTools: [],
  isRunning: false,
  showPreview: false,
  previewContent: null,
  syncedMap: {},

  setSelectedSourceIds: (ids) => set({ selectedSourceIds: ids }),
  setSelectedTargetTools: (tools) => set({ selectedTargetTools: tools }),

  toggleSource: (id) => {
    const { selectedSourceIds } = get()
    const exists = selectedSourceIds.includes(id)
    set({
      selectedSourceIds: exists
        ? selectedSourceIds.filter(x => x !== id)
        : [...selectedSourceIds, id]
    })
  },

  toggleTarget: (tool) => {
    const { selectedTargetTools } = get()
    const exists = selectedTargetTools.includes(tool)
    set({
      selectedTargetTools: exists
        ? selectedTargetTools.filter(x => x !== tool)
        : [...selectedTargetTools, tool]
    })
  },

  addJob: (job) => set(s => ({ jobs: [...s.jobs, job] })),
  updateJob: (id, update) => set(s => ({
    jobs: s.jobs.map(j => j.id === id ? { ...j, ...update } : j)
  })),
  setShowPreview: (show) => set({ showPreview: show }),
  setPreviewContent: (content) => set({ previewContent: content }),
  setIsRunning: (running) => set({ isRunning: running }),
  clearJobs: () => set({ jobs: [], selectedSourceIds: [], selectedTargetTools: [] }),

  markSynced: (skillId, tool) => set(s => {
    const current = s.syncedMap[skillId] || []
    if (current.includes(tool)) return s
    return { syncedMap: { ...s.syncedMap, [skillId]: [...current, tool] } }
  }),

  clearSynced: () => set({ syncedMap: {} })
}))
