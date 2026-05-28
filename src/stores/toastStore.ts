import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message?: string
  linkCommand?: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (t: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

let counter = 0

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (t) => {
    const id = `toast-${Date.now()}-${++counter}`
    const toast: Toast = { ...t, id }
    set(state => ({ toasts: [...state.toasts, toast] }))

    const duration = t.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        set(state => ({ toasts: state.toasts.filter(x => x.id !== id) }))
      }, duration)
    }
  },

  removeToast: (id) => set(state => ({
    toasts: state.toasts.filter(t => t.id !== id)
  }))
}))
