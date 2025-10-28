/**
 * Passkey 升級引導整合範例 (Task 6 使用範例)
 *
 * 此檔案展示如何在登入流程中整合 Passkey 升級引導功能
 *
 * 使用場景：
 * - OAuth 登入成功後檢查是否需要顯示 Passkey 升級引導
 * - 自動判斷顯示時機（首次登入、距離上次跳過超過 7 天等）
 * - 提供完整的使用者體驗（成功訊息、錯誤處理、重試選項）
 *
 * 整合步驟：
 * 1. 在登入頁面或 OAuth 回調頁面引入此範例
 * 2. 確保 authStore 已正確設定 hasPasskey、authMethod 等狀態
 * 3. 在登入成功後呼叫此元件檢查是否顯示引導
 */

'use client'

import React, { useEffect } from 'react'
import { useAuthStore } from '@/lib/authStore'
import { usePasskeyUpgradePrompt } from '@/hooks/usePasskeyUpgradePrompt'
import { PasskeyUpgradeModal } from './PasskeyUpgradeModal'

/**
 * Passkey 升級引導整合元件
 *
 * 使用範例：
 *
 * ```tsx
 * // 在登入頁面或 OAuth 回調頁面
 * import { PasskeyUpgradeGuide } from '@/components/auth/PasskeyUpgradeExample'
 *
 * export default function LoginPage() {
 *   const authStore = useAuthStore()
 *
 *   return (
 *     <div>
 *       {/* 登入表單 *\/}
 *       <LoginForm />
 *
 *       {/* Passkey 升級引導（登入成功後自動顯示）*\/}
 *       {authStore.user && <PasskeyUpgradeGuide />}
 *     </div>
 *   )
 * }
 * ```
 */
export function PasskeyUpgradeGuide() {
  const authStore = useAuthStore()

  // 從 authStore 取得認證狀態
  const { hasPasskey, authMethod } = authStore

  // 使用 Passkey 升級引導 Hook
  const {
    showModal,
    isLoading,
    error,
    handleSetupPasskey,
    handleSkip,
    setShowModal,
  } = usePasskeyUpgradePrompt({
    hasPasskey,
    authMethod,
    lastSkippedAt: null, // 實際使用時從 localStorage 載入
    skipCount: 0, // 實際使用時從 localStorage 載入
  })

  // 可選：追蹤事件（用於分析）
  useEffect(() => {
    if (showModal) {
      // 追蹤 Passkey 升級引導顯示事件
      console.log('[Analytics] Passkey upgrade prompt shown', {
        authMethod,
        hasPasskey,
      })
    }
  }, [showModal, authMethod, hasPasskey])

  return (
    <PasskeyUpgradeModal
      open={showModal}
      onOpenChange={setShowModal}
      onSetupPasskey={handleSetupPasskey}
      onSkip={handleSkip}
      isLoading={isLoading}
      error={error}
    />
  )
}

/**
 * 進階使用範例：自訂顯示邏輯
 *
 * 如果需要更精細的控制，可以手動管理 showModal 狀態：
 *
 * ```tsx
 * export function CustomPasskeyUpgradeGuide() {
 *   const authStore = useAuthStore()
 *   const [customShowModal, setCustomShowModal] = useState(false)
 *
 *   const {
 *     isLoading,
 *     error,
 *     handleSetupPasskey,
 *     handleSkip,
 *   } = usePasskeyUpgradePrompt({
 *     hasPasskey: authStore.hasPasskey,
 *     authMethod: authStore.authMethod,
 *     lastSkippedAt: null,
 *     skipCount: 0,
 *   })
 *
 *   // 自訂顯示邏輯（例如：延遲顯示）
 *   useEffect(() => {
 *     if (authStore.user && authStore.authMethod === 'oauth' && !authStore.hasPasskey) {
 *       // 延遲 2 秒後顯示引導
 *       const timer = setTimeout(() => {
 *         setCustomShowModal(true)
 *       }, 2000)
 *
 *       return () => clearTimeout(timer)
 *     }
 *   }, [authStore.user, authStore.authMethod, authStore.hasPasskey])
 *
 *   return (
 *     <PasskeyUpgradeModal
 *       open={customShowModal}
 *       onOpenChange={setCustomShowModal}
 *       onSetupPasskey={async () => {
 *         await handleSetupPasskey()
 *         // 成功後執行自訂邏輯
 *         console.log('Passkey setup completed!')
 *       }}
 *       onSkip={() => {
 *         handleSkip()
 *         setCustomShowModal(false)
 *       }}
 *       isLoading={isLoading}
 *       error={error}
 *     />
 *   )
 * }
 * ```
 */

/**
 * 測試用範例：手動觸發引導
 *
 * 用於開發和測試階段手動觸發 Passkey 升級引導：
 *
 * ```tsx
 * export function ManualPasskeyUpgradeTrigger() {
 *   const [show, setShow] = useState(false)
 *
 *   return (
 *     <div>
 *       <button onClick={() => setShow(true)}>
 *         測試 Passkey 升級引導
 *       </button>
 *
 *       <PasskeyUpgradeModal
 *         open={show}
 *         onOpenChange={setShow}
 *         onSetupPasskey={async () => {
 *           console.log('開始 Passkey 註冊流程...')
 *         }}
 *         onSkip={() => {
 *           console.log('使用者跳過 Passkey 升級')
 *           setShow(false)
 *         }}
 *       />
 *     </div>
 *   )
 * }
 * ```
 */
