/**
 * usePasskeyUpgradePrompt Hook (Task 6.2)
 *
 * 管理 Passkey 升級引導流程的核心邏輯
 *
 * 功能：
 * - 智能提醒邏輯（skipCount < 3 且距離上次跳過超過 7 天）
 * - WebAuthn 註冊流程整合
 * - 狀態追蹤（skipCount, lastSkippedAt）
 * - 錯誤處理和瀏覽器不支援降級
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/lib/authStore'
import { isWebAuthnSupported, startRegistration } from '@/lib/webauthn'
import * as webauthnAPI from '@/lib/webauthnAPI'
import {
  trackPasskeyUpgradeAccepted,
  trackPasskeyUpgradeSkipped,
  trackPasskeyUpgradeCompleted,
} from '@/lib/analytics/authEventTracker'

const STORAGE_KEY = 'passkey-upgrade-prompt'
const REMIND_INTERVAL_DAYS = 7
const MAX_SKIP_COUNT = 3

interface PasskeyUpgradePromptProps {
  hasPasskey: boolean
  authMethod: 'passkey' | 'password' | 'oauth' | null
  lastSkippedAt: string | null
  skipCount: number
}

interface PasskeyUpgradePromptState {
  showModal: boolean
  isLoading: boolean
  error: string | null
  handleSetupPasskey: () => Promise<void>
  handleSkip: () => void
  setShowModal: (show: boolean) => void
}

interface StorageData {
  skipCount: number
  lastSkippedAt: string | null
}

/**
 * 從 localStorage 載入跳過記錄
 */
function loadSkipRecord(): StorageData {
  if (typeof window === 'undefined') {
    return { skipCount: 0, lastSkippedAt: null }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return { skipCount: 0, lastSkippedAt: null }
    }

    const data = JSON.parse(stored) as StorageData
    return {
      skipCount: data.skipCount || 0,
      lastSkippedAt: data.lastSkippedAt || null,
    }
  } catch (error) {
    console.warn('Failed to load skip record:', error)
    return { skipCount: 0, lastSkippedAt: null }
  }
}

/**
 * 儲存跳過記錄至 localStorage
 */
function saveSkipRecord(data: StorageData): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save skip record:', error)
  }
}

/**
 * 檢查是否應顯示引導 modal
 *
 * 規則：
 * 1. hasPasskey = true → 不顯示
 * 2. authMethod 不是 'oauth' → 不顯示
 * 3. skipCount >= MAX_SKIP_COUNT → 不顯示（永久停止）
 * 4. skipCount < MAX_SKIP_COUNT 且距離上次跳過超過 REMIND_INTERVAL_DAYS 天 → 顯示
 * 5. 首次顯示（skipCount = 0 且 lastSkippedAt = null）→ 顯示
 */
function shouldShowModal(
  hasPasskey: boolean,
  authMethod: string | null,
  skipCount: number,
  lastSkippedAt: string | null
): boolean {
  // Rule 1: 已有 Passkey，不顯示
  if (hasPasskey) {
    return false
  }

  // Rule 2: 非 OAuth 認證，不顯示
  if (authMethod !== 'oauth') {
    return false
  }

  // Rule 3: 跳過次數達上限，永久停止
  if (skipCount >= MAX_SKIP_COUNT) {
    return false
  }

  // Rule 5: 首次顯示
  if (skipCount === 0 && lastSkippedAt === null) {
    return true
  }

  // Rule 4: 檢查距離上次跳過的天數
  if (lastSkippedAt) {
    const lastSkipped = new Date(lastSkippedAt)
    const now = new Date()
    const daysSinceSkip = Math.floor((now.getTime() - lastSkipped.getTime()) / (1000 * 60 * 60 * 24))

    return daysSinceSkip >= REMIND_INTERVAL_DAYS
  }

  // 預設不顯示
  return false
}

/**
 * Passkey 升級引導 Hook
 */
export function usePasskeyUpgradePrompt(
  props: PasskeyUpgradePromptProps
): PasskeyUpgradePromptState {
  const { hasPasskey, authMethod, lastSkippedAt: propLastSkippedAt, skipCount: propSkipCount } = props
  const authStore = useAuthStore()

  // 從 localStorage 載入實際的 skip 記錄
  const storedData = loadSkipRecord()
  const actualSkipCount = storedData.skipCount
  const actualLastSkippedAt = storedData.lastSkippedAt

  // 決定是否顯示 modal
  const [showModal, setShowModal] = useState(() =>
    shouldShowModal(hasPasskey, authMethod, actualSkipCount, actualLastSkippedAt)
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 處理 Passkey 註冊流程
   */
  const handleSetupPasskey = useCallback(async () => {
    // 立即設定 loading 狀態
    setIsLoading(true)
    setError(null)

    // 追蹤事件：使用者接受 Passkey 升級
    const storedData = loadSkipRecord()
    trackPasskeyUpgradeAccepted(storedData.skipCount).catch(console.warn)

    try {
      // Step 1: 檢查瀏覽器支援度
      if (!isWebAuthnSupported()) {
        const errorMsg = '您的裝置不支援 Passkey，可以繼續使用 Google 登入'
        setError(errorMsg)
        setIsLoading(false)

        // 5 秒後自動關閉 modal
        setTimeout(() => {
          setShowModal(false)
        }, 5000)

        return
      }

      // Step 2: 取得註冊選項
      const options = await webauthnAPI.getRegistrationOptions()

      // Step 3: 觸發瀏覽器 WebAuthn
      const credential = await startRegistration(options)

      // Step 4: 驗證註冊回應
      const result = await webauthnAPI.verifyRegistration(credential, 'My Passkey')

      if (result.success) {
        // 更新 authStore 狀態
        authStore.setAuthMethodsState({
          hasPasskey: true,
          hasPassword: authStore.hasPassword,
          hasOAuth: authStore.hasOAuth,
        })

        // 追蹤事件：Passkey 註冊成功（來源：OAuth 引導）
        trackPasskeyUpgradeCompleted('oauth_prompt').catch(console.warn)

        setIsLoading(false)

        // 立即關閉 modal（不需要延遲，UI 元件會處理成功訊息顯示）
        setShowModal(false)
      } else {
        throw new Error('註冊驗證失敗')
      }
    } catch (err: any) {
      console.error('Passkey 註冊失敗:', err)
      setError(err.message || '註冊失敗，請重試')
      setIsLoading(false)
    }
  }, [authStore])

  /**
   * 處理跳過引導
   */
  const handleSkip = useCallback(() => {
    const storedData = loadSkipRecord()
    const newSkipCount = storedData.skipCount + 1
    const now = new Date().toISOString()

    // 追蹤事件：使用者跳過 Passkey 升級
    trackPasskeyUpgradeSkipped(newSkipCount).catch(console.warn)

    // 儲存至 localStorage
    saveSkipRecord({
      skipCount: newSkipCount,
      lastSkippedAt: now,
    })

    // 關閉 modal
    setShowModal(false)
  }, [])

  return {
    showModal,
    isLoading,
    error,
    handleSetupPasskey,
    handleSkip,
    setShowModal,
  }
}
