import { create } from 'zustand'

interface ModalState {
  id: string
  isOpen: boolean
  data?: any
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  createdAt: number
}

interface UIState {
  loadingCount: number
  modals: Record<string, ModalState>
  notifications: Notification[]
  startLoading: () => void
  stopLoading: () => void
  openModal: (id: string, data?: any) => void
  closeModal: (id: string) => void
  pushNotification: (type: Notification['type'], message: string) => void
  dismissNotification: (id: string) => void
  isGlobalLoading: () => boolean
}

export const useUIStore = create<UIState>((set, get) => ({
  loadingCount: 0,
  modals: {},
  notifications: [],

  startLoading: () => set(state => ({ loadingCount: state.loadingCount + 1 })),
  stopLoading: () => set(state => ({ loadingCount: Math.max(0, state.loadingCount - 1) })),

  openModal: (id, data) => set(state => ({
    modals: { ...state.modals, [id]: { id, isOpen: true, data } }
  })),

  closeModal: (id) => set(state => ({
    modals: { ...state.modals, [id]: { ...(state.modals[id] || { id }), isOpen: false } }
  })),

  pushNotification: (type, message) => set(state => ({
    notifications: [...state.notifications, { id: Math.random().toString(36).slice(2), type, message, createdAt: Date.now() }]
  })),

  dismissNotification: (id) => set(state => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  isGlobalLoading: () => get().loadingCount > 0
}))
