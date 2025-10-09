import { create } from 'zustand'

export interface AppError {
  id: string
  source: 'api' | 'ui' | 'auth' | 'network' | 'unknown'
  message: string
  detail?: any
  statusCode?: number
  time: number
  retry?: () => Promise<void> | void
}

interface ErrorState {
  errors: AppError[]
  lastError?: AppError
  networkOnline: boolean
  pushError: (err: Omit<AppError, 'id' | 'time'>) => string
  dismissError: (id: string) => void
  clearAll: () => void
  setNetworkOnline: (online: boolean) => void
}

export const useErrorStore = create<ErrorState>((set, get) => ({
  errors: [],
  lastError: undefined,
  networkOnline: true,

  pushError: (err) => {
    const id = Math.random().toString(36).slice(2)
    const full: AppError = { id, time: Date.now(), ...err }
    set(state => ({ errors: [...state.errors, full], lastError: full }))
    return id
  },
  dismissError: (id) => set(state => ({ errors: state.errors.filter(e => e.id !== id) })),
  clearAll: () => set({ errors: [], lastError: undefined }),
  setNetworkOnline: (online) => set({ networkOnline: online })
}))
