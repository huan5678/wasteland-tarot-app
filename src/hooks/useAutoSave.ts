/**
 * useAutoSave Hook - Automatic Session Saving
 *
 * Debounced auto-save with immediate save on critical events.
 * Integrates with session store for conflict detection and offline support.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useSessionStore } from '@/lib/sessionStore'
import type { ReadingSession } from '@/types/session'

interface UseAutoSaveOptions {
  /**
   * Debounce delay in milliseconds (default: 2000ms)
   */
  debounceMs?: number

  /**
   * Enable auto-save (default: true)
   */
  enabled?: boolean

  /**
   * Events that trigger immediate save (bypass debounce)
   */
  immediateSaveEvents?: string[]

  /**
   * Callback on save success
   */
  onSaveSuccess?: (session: ReadingSession) => void

  /**
   * Callback on save error
   */
  onSaveError?: (error: Error) => void
}

/**
 * Auto-save hook with debouncing and immediate save triggers
 *
 * @example
 * ```tsx
 * const { triggerSave, saveNow, status } = useAutoSave({
 *   debounceMs: 2000,
 *   enabled: true,
 *   immediateSaveEvents: ['card-drawn', 'interpretation-complete'],
 *   onSaveSuccess: (session) => console.log('Saved:', session.id),
 * })
 *
 * // Trigger debounced save
 * const handleChange = () => {
 *   triggerSave()
 * }
 *
 * // Trigger immediate save
 * const handleCardDraw = () => {
 *   saveNow()
 * }
 * ```
 */
export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const {
    debounceMs = 2000,
    enabled = true,
    immediateSaveEvents = [],
    onSaveSuccess,
    onSaveError,
  } = options

  const {
    activeSession,
    autoSaveEnabled,
    autoSaveStatus,
    triggerAutoSave,
  } = useSessionStore()

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveRef = useRef<Date | null>(null)

  /**
   * Clear existing debounce timer
   */
  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
  }, [])

  /**
   * Perform the actual save
   */
  const performSave = useCallback(async () => {
    if (!activeSession || !enabled || !autoSaveEnabled) {
      return
    }

    try {
      await triggerAutoSave()
      lastSaveRef.current = new Date()

      if (onSaveSuccess && activeSession) {
        onSaveSuccess(activeSession)
      }
    } catch (error: any) {
      console.error('Auto-save failed:', error)
      if (onSaveError) {
        onSaveError(error)
      }
    }
  }, [activeSession, enabled, autoSaveEnabled, triggerAutoSave, onSaveSuccess, onSaveError])

  /**
   * Trigger debounced save
   */
  const triggerSave = useCallback(() => {
    if (!enabled || !autoSaveEnabled) return

    clearDebounceTimer()

    debounceTimerRef.current = setTimeout(() => {
      performSave()
    }, debounceMs)
  }, [enabled, autoSaveEnabled, debounceMs, clearDebounceTimer, performSave])

  /**
   * Trigger immediate save (bypass debounce)
   */
  const saveNow = useCallback(async () => {
    clearDebounceTimer()
    await performSave()
  }, [clearDebounceTimer, performSave])

  /**
   * Check if should save based on time elapsed
   */
  const shouldSave = useCallback(() => {
    if (!lastSaveRef.current) return true

    const timeSinceLastSave = Date.now() - lastSaveRef.current.getTime()
    return timeSinceLastSave >= debounceMs
  }, [debounceMs])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearDebounceTimer()
    }
  }, [clearDebounceTimer])

  /**
   * Save on page unload/navigation
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeSession && enabled && autoSaveEnabled) {
        // Trigger synchronous save (best effort)
        saveNow()

        // Optionally show confirmation dialog
        // e.preventDefault()
        // e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [activeSession, enabled, autoSaveEnabled, saveNow])

  return {
    /**
     * Trigger debounced save
     */
    triggerSave,

    /**
     * Trigger immediate save
     */
    saveNow,

    /**
     * Current auto-save status
     */
    status: autoSaveStatus,

    /**
     * Last save timestamp
     */
    lastSavedAt: lastSaveRef.current,

    /**
     * Check if enough time has passed to save again
     */
    shouldSave,

    /**
     * Clear pending debounce timer
     */
    clearPending: clearDebounceTimer,
  }
}

/**
 * Session change tracker hook
 *
 * Automatically triggers auto-save when session state changes.
 *
 * @example
 * ```tsx
 * const { activeSession } = useSessionStore()
 * const { triggerSave } = useAutoSave()
 *
 * useSessionChangeTracker(activeSession, {
 *   onChange: triggerSave,
 *   watchFields: ['session_state', 'question'],
 * })
 * ```
 */
export function useSessionChangeTracker(
  session: ReadingSession | null,
  options: {
    onChange: () => void
    watchFields?: (keyof ReadingSession)[]
  }
) {
  const { onChange, watchFields } = options
  const prevSessionRef = useRef<ReadingSession | null>(null)

  useEffect(() => {
    if (!session) {
      prevSessionRef.current = null
      return
    }

    const prevSession = prevSessionRef.current

    // First load, no change
    if (!prevSession) {
      prevSessionRef.current = session
      return
    }

    // Check if watched fields changed
    let hasChanged = false

    if (watchFields) {
      // Only watch specific fields
      for (const field of watchFields) {
        if (JSON.stringify(session[field]) !== JSON.stringify(prevSession[field])) {
          hasChanged = true
          break
        }
      }
    } else {
      // Watch entire session
      if (JSON.stringify(session) !== JSON.stringify(prevSession)) {
        hasChanged = true
      }
    }

    if (hasChanged) {
      onChange()
    }

    prevSessionRef.current = session
  }, [session, onChange, watchFields])
}
