/**
 * useAuthErrorHandling Hook - Task 10.2
 * 處理認證錯誤和降級方案
 * Requirements: 10
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { PixelIcon } from '@/components/ui/icons'

// ============================================================================
// Constants
// ============================================================================

const MAX_RETRY_ATTEMPTS = 3
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes
const OAUTH_SERVICE_CHECK_INTERVAL = 30000 // 30 seconds

// ============================================================================
// Types
// ============================================================================

interface ServiceAvailability {
  oauth: boolean
  passkey: boolean
  password: boolean
}

interface RetryState {
  attempts: number
  lastAttemptAt: number | null
}

interface LoginAttemptsState {
  count: number
  lockedUntil: number | null
}

interface UseAuthErrorHandlingReturn {
  // Service availability
  serviceAvailability: ServiceAvailability
  checkServiceAvailability: () => Promise<void>

  // Retry mechanism
  retryState: RetryState
  canRetry: boolean
  handleRetry: (operation: () => Promise<void>) => Promise<void>
  resetRetryState: () => void

  // Login attempts tracking
  loginAttempts: LoginAttemptsState
  isLocked: boolean
  incrementLoginAttempts: () => void
  resetLoginAttempts: () => void

  // Error display
  showErrorToast: (message: string, options?: { description?: string; retry?: () => void }) => void
  showWarningToast: (message: string, description?: string) => void
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAuthErrorHandling(): UseAuthErrorHandlingReturn {
  // Service availability state
  const [serviceAvailability, setServiceAvailability] = useState<ServiceAvailability>({
    oauth: true, // 假設預設可用
    passkey: typeof window !== 'undefined' && 'credentials' in navigator,
    password: true,
  })

  // Retry state
  const [retryState, setRetryState] = useState<RetryState>({
    attempts: 0,
    lastAttemptAt: null,
  })

  // Login attempts state (persistent in localStorage)
  const [loginAttempts, setLoginAttempts] = useState<LoginAttemptsState>(() => {
    if (typeof window === 'undefined') return { count: 0, lockedUntil: null }

    const stored = localStorage.getItem('login-attempts')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // 檢查是否已過鎖定時間
        if (parsed.lockedUntil && Date.now() > parsed.lockedUntil) {
          return { count: 0, lockedUntil: null }
        }
        return parsed
      } catch {
        return { count: 0, lockedUntil: null }
      }
    }
    return { count: 0, lockedUntil: null }
  })

  // Persist login attempts to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('login-attempts', JSON.stringify(loginAttempts))
    }
  }, [loginAttempts])

  // Check if account is locked
  const isLocked = loginAttempts.lockedUntil !== null && Date.now() < loginAttempts.lockedUntil

  // ========== Service Availability ==========

  /**
   * 檢查 OAuth 服務可用性
   */
  const checkOAuthAvailability = useCallback(async (): Promise<boolean> => {
    try {
      // 嘗試呼叫一個輕量的健康檢查端點
      // 如果後端沒有健康檢查端點，可以透過偵測 OAuth 啟動是否失敗來判斷
      return true // 暫時預設為可用，實際應該呼叫健康檢查 API
    } catch {
      return false
    }
  }, [])

  /**
   * 檢查所有認證服務的可用性
   */
  const checkServiceAvailability = useCallback(async () => {
    const oauthAvailable = await checkOAuthAvailability()
    const passkeyAvailable = typeof window !== 'undefined' && 'credentials' in navigator

    setServiceAvailability({
      oauth: oauthAvailable,
      passkey: passkeyAvailable,
      password: true, // Password 登入應該始終可用（後端服務）
    })

    // 如果 OAuth 不可用，顯示警告
    if (!oauthAvailable) {
      showWarningToast(
        'Google 登入目前無法使用',
        '請使用其他方式登入'
      )
    }
  }, [checkOAuthAvailability])

  // 定期檢查服務可用性（僅在需要時啟用）
  useEffect(() => {
    // 初次檢查
    checkServiceAvailability()

    // 定期檢查（可選）
    // const interval = setInterval(checkServiceAvailability, OAUTH_SERVICE_CHECK_INTERVAL)
    // return () => clearInterval(interval)
  }, [checkServiceAvailability])

  // ========== Retry Mechanism ==========

  const canRetry = retryState.attempts < MAX_RETRY_ATTEMPTS

  /**
   * 處理重試邏輯
   */
  const handleRetry = useCallback(
    async (operation: () => Promise<void>) => {
      if (!canRetry) {
        showErrorToast(
          '已達最大重試次數',
          {
            description: '請稍後再試或改用其他登入方式',
          }
        )
        return
      }

      setRetryState((prev) => ({
        attempts: prev.attempts + 1,
        lastAttemptAt: Date.now(),
      }))

      try {
        await operation()
        // 成功後重置重試狀態
        setRetryState({ attempts: 0, lastAttemptAt: null })
      } catch (error) {
        // 失敗後根據剩餘次數顯示訊息
        const remainingAttempts = MAX_RETRY_ATTEMPTS - (retryState.attempts + 1)
        if (remainingAttempts > 0) {
          showErrorToast(
            '操作失敗',
            {
              description: `剩餘 ${remainingAttempts} 次重試機會`,
              retry: () => handleRetry(operation),
            }
          )
        } else {
          showErrorToast(
            '操作失敗',
            {
              description: '已達最大重試次數，請稍後再試或改用其他登入方式',
            }
          )
        }
      }
    },
    [canRetry, retryState.attempts]
  )

  const resetRetryState = useCallback(() => {
    setRetryState({ attempts: 0, lastAttemptAt: null })
  }, [])

  // ========== Login Attempts Tracking ==========

  /**
   * 增加登入失敗次數
   */
  const incrementLoginAttempts = useCallback(() => {
    setLoginAttempts((prev) => {
      const newCount = prev.count + 1

      // 如果達到 5 次失敗，鎖定帳號
      if (newCount >= MAX_LOGIN_ATTEMPTS) {
        const lockUntil = Date.now() + LOCKOUT_DURATION_MS
        showErrorToast(
          `連續失敗 ${MAX_LOGIN_ATTEMPTS} 次，帳號已鎖定`,
          {
            description: `請 15 分鐘後再試，或使用忘記密碼功能`,
          }
        )
        return { count: newCount, lockedUntil: lockUntil }
      }

      return { ...prev, count: newCount }
    })
  }, [])

  /**
   * 重置登入失敗次數（登入成功時呼叫）
   */
  const resetLoginAttempts = useCallback(() => {
    setLoginAttempts({ count: 0, lockedUntil: null })
  }, [])

  // ========== Error Display ==========

  /**
   * 顯示錯誤 toast（Radiation Orange 配色）
   */
  const showErrorToast = useCallback(
    (
      message: string,
      options?: { description?: string; retry?: () => void }
    ) => {
      toast.error(message, {
        description: options?.description,
        duration: 5000,
        className: 'border-radiation-orange bg-radiation-orange/10',
        action: options?.retry
          ? {
              label: '重試',
              onClick: options.retry,
            }
          : undefined,
      })
    },
    []
  )

  /**
   * 顯示警告 toast（Radiation Orange 配色）
   */
  const showWarningToast = useCallback(
    (message: string, description?: string) => {
      toast.warning(message, {
        description,
        duration: 8000,
        className: 'border-radiation-orange bg-radiation-orange/10',
      })
    },
    []
  )

  return {
    // Service availability
    serviceAvailability,
    checkServiceAvailability,

    // Retry mechanism
    retryState,
    canRetry,
    handleRetry,
    resetRetryState,

    // Login attempts tracking
    loginAttempts,
    isLocked,
    incrementLoginAttempts,
    resetLoginAttempts,

    // Error display
    showErrorToast,
    showWarningToast,
  }
}
