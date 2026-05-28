import { create } from 'zustand'
import type { SyncRecord, ToolType } from '../types/skill'

const STORAGE_KEY = 'skills-manager-sync-history'
const MAX_RECORDS = 200

function loadRecords(): SyncRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveRecords(records: SyncRecord[]) {
  try {
    const trimmed = records.slice(0, MAX_RECORDS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {}
}

interface SyncHistoryStore {
  records: SyncRecord[]
  addRecord: (r: Omit<SyncRecord, 'id'>) => void
  removeRecord: (id: string) => void
  clearRecords: () => void
}

export const useSyncHistoryStore = create<SyncHistoryStore>((set) => ({
  records: loadRecords(),

  addRecord: (r) => {
    const record: SyncRecord = {
      ...r,
      id: `sr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    }
    set(state => {
      const records = [record, ...state.records]
      saveRecords(records)
      return { records }
    })
  },

  removeRecord: (id) => set(state => {
    const records = state.records.filter(r => r.id !== id)
    saveRecords(records)
    return { records }
  }),

  clearRecords: () => {
    saveRecords([])
    set({ records: [] })
  }
}))
