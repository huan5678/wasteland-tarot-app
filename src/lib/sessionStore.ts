/**
 * Session Store - Reading Save & Resume State Management
 *
 * Zustand store for managing incomplete reading sessions with
 * automatic saving, offline sync, and conflict resolution.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { sessionsAPI } from '@/lib/api/sessions'
import type {
  ReadingSession,
  SessionMetadata,
  SessionCreateRequest,
  SessionUpdateRequest,
  OfflineSessionSync,
  SyncQueueItem,
  ConflictInfo,
  ConflictResolution,
  AutoSaveStatus,
  SessionStoreState,
  SessionStoreActions,
} from '@/types/session'

interface SessionStore extends SessionStoreState, SessionStoreActions {}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      // Initial state
      activeSession: null,
      autoSaveEnabled: true,
      autoSaveStatus: 'idle',
      lastSavedAt: null,

      incompleteSessions: [],
      totalSessions: 0,

      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      syncQueue: [],
      pendingSyncs: 0,

      activeConflict: null,

      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,

      // Session CRUD
      createSession: async (data: SessionCreateRequest) => {
        set({ isCreating: true, error: null })
        try {
          const session = await sessionsAPI.create(data)
          set({
            activeSession: session,
            isCreating: false,
            lastSavedAt: new Date(),
          })
          return session
        } catch (error: any) {
          const errorMsg = error.message || '建立會話失敗'
          set({ error: errorMsg, isCreating: false })
          throw error
        }
      },

      getSession: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          const session = await sessionsAPI.getById(id)
          set({ isLoading: false })
          return session
        } catch (error: any) {
          const errorMsg = error.message || '取得會話失敗'
          set({ error: errorMsg, isLoading: false })
          return null
        }
      },

      updateSession: async (id: string, data: SessionUpdateRequest) => {
        set({ isUpdating: true, error: null, autoSaveStatus: 'saving' })
        try {
          const expectedUpdatedAt = get().activeSession?.updated_at
          const session = await sessionsAPI.update(id, data, expectedUpdatedAt)

          // Update active session if it's the one being updated
          if (get().activeSession?.id === id) {
            set({ activeSession: session })
          }

          set({
            isUpdating: false,
            autoSaveStatus: 'saved',
            lastSavedAt: new Date(),
          })

          // Reset status after 2 seconds
          setTimeout(() => {
            if (get().autoSaveStatus === 'saved') {
              set({ autoSaveStatus: 'idle' })
            }
          }, 2000)

          return session
        } catch (error: any) {
          // Handle 404 Not Found (session was deleted or doesn't exist)
          if (error.status === 404) {
            console.warn('Session 不存在，可能已被刪除，清除並停止自動儲存')
            set({
              activeSession: null,
              autoSaveStatus: 'idle',
              isUpdating: false,
              error: null, // Don't show error for deleted session
            })
            return null as any // Return null to indicate session was cleared
          }
          // Handle 403 Forbidden (session doesn't belong to user)
          else if (error.status === 403) {
            console.warn('Session 不屬於當前用戶，清除並停止自動儲存')
            set({
              activeSession: null,
              autoSaveStatus: 'idle',
              isUpdating: false,
              error: null, // Don't show error for ownership mismatch
            })
            // Clear persisted session from localStorage
            localStorage.removeItem('active_session_id')
            return null as any // Return null to indicate session was cleared
          }
          // Check for conflict error (409) - Auto-resolve by fetching latest version
          else if (error.status === 409) {
            console.warn('Session 衝突偵測到，正在重新獲取最新版本...')
            try {
              // Fetch the latest version from server
              const latestSession = await sessionsAPI.getById(id)

              // Update our local copy with the latest version
              set({
                activeSession: latestSession,
                isUpdating: false,
                autoSaveStatus: 'idle',
              })

              console.log('已自動解決衝突，使用伺服器最新版本')
              return latestSession
            } catch (fetchError: any) {
              console.error('無法獲取最新 session:', fetchError)
              set({
                error: '自動解決衝突失敗',
                autoSaveStatus: 'error',
                isUpdating: false,
              })
              throw error
            }
          } else if (!navigator.onLine) {
            // Offline - add to sync queue
            const queueItem: SyncQueueItem = {
              id: `sync-${Date.now()}`,
              session_id: id,
              action: 'update',
              data,
              retry_count: 0,
              last_attempt: new Date().toISOString(),
            }
            set({
              syncQueue: [...get().syncQueue, queueItem],
              pendingSyncs: get().pendingSyncs + 1,
              autoSaveStatus: 'offline',
              isUpdating: false,
            })
            throw new Error('離線模式：會話已加入同步佇列')
          } else {
            const errorMsg = error.message || '更新會話失敗'
            set({
              error: errorMsg,
              autoSaveStatus: 'error',
              isUpdating: false,
            })
            throw error
          }
          throw error
        }
      },

      deleteSession: async (id: string) => {
        set({ isDeleting: true, error: null })
        try {
          await sessionsAPI.delete(id)

          // Remove from active session if it's the one being deleted
          if (get().activeSession?.id === id) {
            set({ activeSession: null })
          }

          // Remove from incomplete sessions list
          set({
            incompleteSessions: get().incompleteSessions.filter(s => s.id !== id),
            totalSessions: get().totalSessions - 1,
            isDeleting: false,
          })
        } catch (error: any) {
          const errorMsg = error.message || '刪除會話失敗'
          set({ error: errorMsg, isDeleting: false })
          throw error
        }
      },

      completeSession: async (id: string, data?: {
        interpretation?: string
        character_voice?: string
        karma_context?: string
        faction_influence?: string
      }) => {
        console.log('[SessionStore] completeSession called with id:', id, 'data:', data)
        console.log('[SessionStore] sessionsAPI:', sessionsAPI)
        console.log('[SessionStore] sessionsAPI.complete:', sessionsAPI.complete)
        set({ isUpdating: true, error: null })
        try {
          // Disable auto-save BEFORE completing to prevent race condition
          set({ autoSaveEnabled: false })

          console.log('[SessionStore] Calling sessionsAPI.complete...')
          const result = await sessionsAPI.complete(id, data || {})
          console.log('[SessionStore] completeSession result:', result)

          // Remove from active session
          if (get().activeSession?.id === id) {
            set({ activeSession: null })
          }

          // Remove from incomplete sessions list
          set({
            incompleteSessions: get().incompleteSessions.filter(s => s.id !== id),
            totalSessions: get().totalSessions - 1,
            isUpdating: false,
          })

          return result
        } catch (error: any) {
          const errorMsg = error.message || '完成會話失敗'
          set({ error: errorMsg, isUpdating: false, autoSaveEnabled: true })
          throw error
        }
      },

      // Session list
      loadIncompleteSessions: async (limit = 10, offset = 0) => {
        set({ isLoading: true, error: null })
        try {
          const response = await sessionsAPI.list({ limit, offset })
          set({
            incompleteSessions: response.sessions,
            totalSessions: response.total,
            isLoading: false,
          })
        } catch (error: any) {
          const errorMsg = error.message || '載入會話列表失敗'
          set({ error: errorMsg, isLoading: false })
        }
      },

      refreshSessions: async () => {
        const { loadIncompleteSessions } = get()
        await loadIncompleteSessions()
      },

      // Active session management
      setActiveSession: (session: ReadingSession | null) => {
        set({ activeSession: session })
      },

      resumeSession: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          const session = await sessionsAPI.getById(id)

          // Verify ownership: Check if session belongs to current user
          // If 403 or ownership mismatch, clear active session and localStorage
          set({
            activeSession: session,
            isLoading: false,
            autoSaveEnabled: true,
          })
        } catch (error: any) {
          // Handle 404 Not Found (session was deleted or doesn't exist)
          if (error.status === 404) {
            console.warn('Session 不存在，可能已被刪除，清除並開始新會話')
            set({
              activeSession: null,
              isLoading: false,
              error: null, // Don't show error for deleted session
            })
            // Clear persisted session from localStorage
            localStorage.removeItem('active_session_id')
            return
          }
          // Handle 403 Forbidden (session doesn't belong to user)
          else if (error.status === 403) {
            console.warn('Session 不屬於當前用戶，清除並開始新會話')
            set({
              activeSession: null,
              isLoading: false,
              error: null, // Don't show error for ownership mismatch
            })
            // Clear persisted session from localStorage
            localStorage.removeItem('active_session_id')
            return
          }

          const errorMsg = error.message || '恢復會話失敗'
          set({ error: errorMsg, isLoading: false })
          throw error
        }
      },

      pauseSession: async () => {
        const session = get().activeSession
        if (!session) return

        try {
          await get().updateSession(session.id, { status: 'paused' })
        } catch (error: any) {
          console.error('暫停會話失敗:', error)
        }
      },

      // Auto-save
      enableAutoSave: () => {
        set({ autoSaveEnabled: true })
      },

      disableAutoSave: () => {
        set({ autoSaveEnabled: false })
      },

      triggerAutoSave: async () => {
        const { activeSession, autoSaveEnabled, updateSession } = get()

        if (!activeSession || !autoSaveEnabled) return

        try {
          await updateSession(activeSession.id, {
            session_state: activeSession.session_state,
            last_accessed_at: new Date().toISOString(),
          })
        } catch (error: any) {
          console.error('自動儲存失敗:', error)
        }
      },

      // Offline sync
      syncOfflineSession: async (data: OfflineSessionSync) => {
        set({ isUpdating: true, error: null })
        try {
          const response = await sessionsAPI.syncOffline(data)

          if (response.status === 'conflict') {
            // Conflict detected
            set({
              activeConflict: response.conflicts || null,
              isUpdating: false,
            })
          } else {
            // Sync successful
            set({
              activeSession: response.session,
              isUpdating: false,
            })
          }

          return response
        } catch (error: any) {
          const errorMsg = error.message || '同步失敗'
          set({ error: errorMsg, isUpdating: false })
          throw error
        }
      },

      resolveConflict: async (resolution: ConflictResolution) => {
        set({ isUpdating: true, error: null })
        try {
          const session = await sessionsAPI.resolveConflict(resolution)
          set({
            activeSession: session,
            activeConflict: null,
            isUpdating: false,
          })
          return session
        } catch (error: any) {
          const errorMsg = error.message || '解決衝突失敗'
          set({ error: errorMsg, isUpdating: false })
          throw error
        }
      },

      processSyncQueue: async () => {
        const { syncQueue, updateSession } = get()

        if (syncQueue.length === 0) return

        const results: SyncQueueItem[] = []

        for (const item of syncQueue) {
          try {
            if (item.action === 'update' && item.data) {
              await updateSession(item.session_id, item.data as SessionUpdateRequest)
            }
            // Successfully synced, don't add back to queue
          } catch (error: any) {
            // Sync failed, add back with incremented retry count
            results.push({
              ...item,
              retry_count: item.retry_count + 1,
              last_attempt: new Date().toISOString(),
              error: error.message,
            })
          }
        }

        // Update queue with failed items
        set({
          syncQueue: results,
          pendingSyncs: results.length,
        })
      },

      // Network status
      setOnline: (online: boolean) => {
        const wasOffline = !get().isOnline
        set({ isOnline: online })

        // If coming back online, process sync queue
        if (online && wasOffline) {
          get().processSyncQueue()
        }
      },

      // Error handling
      clearError: () => {
        set({ error: null })
      },

      setError: (error: string) => {
        set({ error })
      },
    }),
    {
      name: 'session-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        activeSession: state.activeSession,
        syncQueue: state.syncQueue,
        autoSaveEnabled: state.autoSaveEnabled,
      }),
    }
  )
)

// Network status listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useSessionStore.getState().setOnline(true)
  })

  window.addEventListener('offline', () => {
    useSessionStore.getState().setOnline(false)
  })
}
