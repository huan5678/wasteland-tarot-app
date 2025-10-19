/**
 * useActivityTracker Hook
 *
 * 混合模式活躍度追蹤：
 * 1. 頁面 focus 狀態追蹤
 * 2. 每 5 分鐘檢查使用者互動（滑鼠/鍵盤/觸控）
 * 3. 累積活躍時間，每達到 30 分鐘自動延長 token
 * 4. 每日重置累計時間（登入時檢查日期）
 *
 * 安全機制：
 * - 只在已登入狀態下運作
 * - 防止重複延長（debounce）
 * - 自動處理錯誤與重試
 * - localStorage 持久化，換日重置
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '@/lib/authStore'

// 常數定義
const ACTIVITY_THRESHOLD = 30 * 60 * 1000  // 30 分鐘（毫秒）
const INTERACTION_CHECK_INTERVAL = 5 * 60 * 1000  // 5 分鐘（毫秒）
const HEARTBEAT_INTERVAL = 60 * 1000  // 1 分鐘（毫秒）
const UI_UPDATE_INTERVAL = 1000  // 1 秒（用於 UI 即時更新）
const STORAGE_KEY = 'pip-boy-activity-tracker'  // localStorage key

interface ActivityTrackerState {
  isActive: boolean
  totalActiveTime: number
  currentSessionTime: number  // 當前活躍期間的時間（用於即時顯示）
  lastExtensionTime: number | null
  lastDate: string  // 最後活動日期（YYYY-MM-DD）
}

interface StorageData {
  totalActiveTime: number
  lastExtensionTime: number | null
  lastDate: string
}

/**
 * 取得今天的日期字串（YYYY-MM-DD）
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * 從 localStorage 載入資料
 */
function loadFromStorage(userId: string | undefined): StorageData {
  if (!userId || typeof window === 'undefined') {
    return {
      totalActiveTime: 0,
      lastExtensionTime: null,
      lastDate: getTodayString(),
    }
  }

  try {
    const key = `${STORAGE_KEY}-${userId}`
    const stored = localStorage.getItem(key)

    if (!stored) {
      return {
        totalActiveTime: 0,
        lastExtensionTime: null,
        lastDate: getTodayString(),
      }
    }

    const data: StorageData = JSON.parse(stored)
    const today = getTodayString()

    // 檢查是否換日
    if (data.lastDate !== today) {
      console.log('📅 New day detected, resetting activity time')
      return {
        totalActiveTime: 0,
        lastExtensionTime: null,
        lastDate: today,
      }
    }

    console.log('📂 Loaded activity data:', {
      totalActiveTime: Math.floor(data.totalActiveTime / 1000),
      lastDate: data.lastDate,
    })

    return data
  } catch (error) {
    console.error('Failed to load activity data:', error)
    return {
      totalActiveTime: 0,
      lastExtensionTime: null,
      lastDate: getTodayString(),
    }
  }
}

/**
 * 儲存資料至 localStorage
 */
function saveToStorage(userId: string | undefined, data: StorageData): void {
  if (!userId || typeof window === 'undefined') return

  try {
    const key = `${STORAGE_KEY}-${userId}`
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save activity data:', error)
  }
}

export function useActivityTracker() {
  const user = useAuthStore(s => s.user)
  const extendTokenByActivity = useAuthStore(s => s.extendTokenByActivity)
  const isAuthenticated = !!user

  // 初始化時從 localStorage 載入
  const [state, setState] = useState<ActivityTrackerState>(() => {
    const loaded = loadFromStorage(user?.id)
    return {
      isActive: false,
      totalActiveTime: loaded.totalActiveTime,
      currentSessionTime: 0,
      lastExtensionTime: loaded.lastExtensionTime,
      lastDate: loaded.lastDate,
    }
  })

  // Refs
  const activityStartTime = useRef<number | null>(null)
  const lastInteractionTime = useRef<number>(Date.now())
  const isPageFocused = useRef<boolean>(true)
  const hasRecentInteraction = useRef<boolean>(true)
  const intervalRefs = useRef<{
    heartbeat?: NodeJS.Timeout
    interactionCheck?: NodeJS.Timeout
    uiUpdate?: NodeJS.Timeout
  }>({})

  /**
   * 更新互動時間
   */
  const updateInteraction = useCallback(() => {
    lastInteractionTime.current = Date.now()
    hasRecentInteraction.current = true
  }, [])

  /**
   * 檢查是否應該視為活躍
   */
  const checkActivity = useCallback(() => {
    if (!isAuthenticated) return false

    const now = Date.now()
    const timeSinceLastInteraction = now - lastInteractionTime.current
    const hasValidInteraction = timeSinceLastInteraction < INTERACTION_CHECK_INTERVAL

    return isPageFocused.current && hasValidInteraction
  }, [isAuthenticated])

  /**
   * 心跳：更新活躍時間並儲存至 localStorage
   */
  const heartbeat = useCallback(() => {
    const isCurrentlyActive = checkActivity()

    if (isCurrentlyActive) {
      if (!activityStartTime.current) {
        activityStartTime.current = Date.now()
      }

      setState(prev => {
        const today = getTodayString()

        // 檢查是否換日（應該不會在這裡觸發，但保險起見）
        if (prev.lastDate !== today) {
          console.log('📅 Day changed during session, resetting')
          const resetData: StorageData = {
            totalActiveTime: 0,
            lastExtensionTime: null,
            lastDate: today,
          }
          saveToStorage(user?.id, resetData)

          return {
            ...prev,
            totalActiveTime: 0,
            lastExtensionTime: null,
            lastDate: today,
            isActive: true,
          }
        }

        // 累加時間（持續累加，不重置）
        const newTotalTime = prev.totalActiveTime + HEARTBEAT_INTERVAL

        // 儲存至 localStorage
        const storageData: StorageData = {
          totalActiveTime: newTotalTime,
          lastExtensionTime: prev.lastExtensionTime,
          lastDate: today,
        }
        saveToStorage(user?.id, storageData)

        // 檢查是否達到延長門檻（每 30 分鐘觸發一次）
        const shouldExtend =
          newTotalTime >= ACTIVITY_THRESHOLD &&
          (!prev.lastExtensionTime || newTotalTime - prev.lastExtensionTime >= ACTIVITY_THRESHOLD)

        if (shouldExtend) {
          console.log('🎯 Reached 30-minute threshold, extending token...')

          const activityDuration = Math.floor(newTotalTime / 1000)
          extendTokenByActivity(activityDuration)
            .then(() => {
              console.log('✅ Token extended, total active time:', Math.floor(newTotalTime / 60000), 'minutes')
            })
            .catch((error) => {
              console.error('❌ Failed to extend token:', error)
            })

          // 更新 lastExtensionTime 但不重置 totalActiveTime
          const updatedStorageData: StorageData = {
            totalActiveTime: newTotalTime,
            lastExtensionTime: newTotalTime,
            lastDate: today,
          }
          saveToStorage(user?.id, updatedStorageData)

          return {
            ...prev,
            totalActiveTime: newTotalTime,  // 繼續累加，不歸零
            lastExtensionTime: newTotalTime,
            isActive: true,
          }
        }

        return {
          ...prev,
          totalActiveTime: newTotalTime,
          isActive: true,
        }
      })
    } else {
      if (activityStartTime.current) {
        activityStartTime.current = null
      }

      setState(prev => ({
        ...prev,
        isActive: false,
      }))
    }
  }, [checkActivity, extendTokenByActivity, user?.id])

  /**
   * 頁面 focus/blur 處理
   */
  useEffect(() => {
    const handleFocus = () => {
      isPageFocused.current = true
      updateInteraction()
    }

    const handleBlur = () => {
      isPageFocused.current = false
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [updateInteraction])

  /**
   * 使用者互動追蹤
   */
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']

    events.forEach(event => {
      window.addEventListener(event, updateInteraction, { passive: true })
    })

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateInteraction)
      })
    }
  }, [updateInteraction])

  /**
   * 定時器：UI 即時更新（每秒）
   */
  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRefs.current.uiUpdate) {
        clearInterval(intervalRefs.current.uiUpdate)
      }
      console.log('❌ Activity tracker disabled (not authenticated)')
      return
    }

    console.log('✅ Activity tracker enabled (authenticated)')

    intervalRefs.current.uiUpdate = setInterval(() => {
      const isCurrentlyActive = checkActivity()

      if (isCurrentlyActive) {
        if (!activityStartTime.current) {
          activityStartTime.current = Date.now()
          console.log('🟢 Activity started')
        }

        const currentSessionTime = Date.now() - activityStartTime.current

        setState(prev => ({
          ...prev,
          isActive: true,
          currentSessionTime,
        }))
      } else {
        if (activityStartTime.current) {
          activityStartTime.current = null
          console.log('⚪ Activity stopped')
        }

        setState(prev => ({
          ...prev,
          isActive: false,
          currentSessionTime: 0,
        }))
      }
    }, UI_UPDATE_INTERVAL)

    return () => {
      if (intervalRefs.current.uiUpdate) {
        clearInterval(intervalRefs.current.uiUpdate)
      }
    }
  }, [isAuthenticated, checkActivity])

  /**
   * 定時器：心跳 & 互動檢查
   */
  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRefs.current.heartbeat) {
        clearInterval(intervalRefs.current.heartbeat)
      }
      if (intervalRefs.current.interactionCheck) {
        clearInterval(intervalRefs.current.interactionCheck)
      }
      return
    }

    intervalRefs.current.heartbeat = setInterval(heartbeat, HEARTBEAT_INTERVAL)

    intervalRefs.current.interactionCheck = setInterval(() => {
      hasRecentInteraction.current = false
    }, INTERACTION_CHECK_INTERVAL)

    return () => {
      if (intervalRefs.current.heartbeat) {
        clearInterval(intervalRefs.current.heartbeat)
      }
      if (intervalRefs.current.interactionCheck) {
        clearInterval(intervalRefs.current.interactionCheck)
      }
    }
  }, [isAuthenticated, heartbeat])

  /**
   * 使用者變更時重新載入資料
   */
  useEffect(() => {
    if (user?.id) {
      const loaded = loadFromStorage(user.id)
      setState(prev => ({
        ...prev,
        totalActiveTime: loaded.totalActiveTime,
        lastExtensionTime: loaded.lastExtensionTime,
        lastDate: loaded.lastDate,
      }))
    }
  }, [user?.id])

  // 計算顯示用的總時間（累積時間 + 當前期間時間）
  const displayActiveTime = state.totalActiveTime + state.currentSessionTime
  const displayProgress = Math.min(100, (displayActiveTime / ACTIVITY_THRESHOLD) * 100)

  return {
    isActive: state.isActive,
    activeTime: displayActiveTime,
    progress: displayProgress,
  }
}
