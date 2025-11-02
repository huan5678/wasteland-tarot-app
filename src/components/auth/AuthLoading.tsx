/**
 * AuthLoading Component
 *
 * 認證狀態載入畫面（統一樣式）
 */

'use client'

import { PixelIcon } from '@/components/ui/icons'

interface AuthLoadingProps {
  /** 顯示的訊息 */
  message?: string
  /** 是否為驗證認證狀態（會顯示不同的訊息） */
  isVerifying?: boolean
}

export function AuthLoading({ message, isVerifying = true }: AuthLoadingProps) {
  const defaultMessage = isVerifying ? '驗證認證狀態...' : '載入中...'

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-pip-boy-green">{message || defaultMessage}</p>
      </div>
    </div>
  )
}

/**
 * 簡化版載入畫面（用於區塊內）
 */
export function AuthLoadingInline({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-pip-boy-green text-sm">{message || '載入中...'}</p>
      </div>
    </div>
  )
}
