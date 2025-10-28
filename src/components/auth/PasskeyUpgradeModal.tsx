/**
 * Passkey 升級引導 Modal UI (Task 6.3)
 *
 * Vault-Tec 風格的 Passkey 升級引導 modal
 *
 * 功能：
 * - 顯示升級標題和說明
 * - 提供「立即設定 Passkey」主要 CTA (Radiation Orange)
 * - 提供「稍後再說」次要選項
 * - 生物辨識載入動畫（Pip-Boy 風格齒輪）
 * - 成功訊息顯示（Sonner toast）
 * - 錯誤處理和重試選項
 */

'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PixelIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PasskeyUpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSetupPasskey: () => Promise<void>
  onSkip: () => void
  isLoading?: boolean
  error?: string | null
}

export function PasskeyUpgradeModal({
  open,
  onOpenChange,
  onSetupPasskey,
  onSkip,
  isLoading = false,
  error = null,
}: PasskeyUpgradeModalProps) {
  const handleSetupClick = async () => {
    try {
      await onSetupPasskey()

      // 顯示成功訊息（Sonner toast）
      toast.success('Passkey 設定完成！', {
        description: '下次您可以使用生物辨識快速登入',
        duration: 3000,
      })
    } catch (err) {
      // 錯誤已在 Hook 中處理
      console.error('Passkey setup failed:', err)
    }
  }

  const handleSkipClick = () => {
    onSkip()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Vault-Tec 風格
          'bg-[#0a1f1f] border-2 border-[#00ff88]/30',
          'max-w-md',
          // Pip-Boy 字體（自動繼承 Cubic 11）
          'text-[#00ff88]',
          // 掃描線效果
          'relative overflow-hidden',
          'before:absolute before:inset-0 before:pointer-events-none',
          'before:bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,136,0.03)_2px,rgba(0,255,136,0.03)_4px)]',
          'before:animate-[scanline_8s_linear_infinite]'
        )}
      >
        {/* 標題區塊 */}
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            {/* 圖示 */}
            <div className="flex-shrink-0">
              <PixelIcon
                name="fingerprint"
                sizePreset="lg"
                variant="primary"
                aria-hidden="true"
              />
            </div>

            {/* 標題 */}
            <DialogTitle className="text-2xl font-bold text-[#00ff88]">
              升級至更快速的生物辨識登入
            </DialogTitle>
          </div>

          {/* 說明 */}
          <DialogDescription className="text-[#00ff88]/80 text-base leading-relaxed">
            使用指紋或 Face ID 登入，無需每次點擊 Google 按鈕
          </DialogDescription>
        </DialogHeader>

        {/* 錯誤訊息區塊 */}
        {error && (
          <div
            className={cn(
              'flex items-start gap-2 p-3 rounded-md',
              'bg-red-900/20 border border-red-500/30',
              'text-red-400'
            )}
            role="alert"
          >
            <PixelIcon
              name="alert-triangle"
              sizePreset="sm"
              variant="error"
              animation="wiggle"
              aria-hidden="true"
            />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* 按鈕區塊 */}
        <DialogFooter className="flex-col sm:flex-col gap-3">
          {/* 主要 CTA：立即設定 Passkey */}
          <button
            onClick={handleSetupClick}
            disabled={isLoading}
            className={cn(
              // Radiation Orange CTA
              'w-full px-6 py-3 rounded-md',
              'bg-[#ff8800] hover:bg-[#ff8800]/90',
              'text-black font-bold text-base',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              // Pip-Boy 風格邊框
              'border-2 border-[#ff8800]/50',
              // 陰影效果
              'shadow-[0_0_10px_rgba(255,136,0,0.3)]',
              'hover:shadow-[0_0_20px_rgba(255,136,0,0.5)]',
              // 載入狀態
              isLoading && 'cursor-wait'
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <PixelIcon
                  name="loader"
                  sizePreset="sm"
                  animation="spin"
                  decorative
                />
                <span>正在掃描生物特徵...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <PixelIcon
                  name="check"
                  sizePreset="sm"
                  decorative
                />
                <span>立即設定 Passkey</span>
              </span>
            )}
          </button>

          {/* 次要選項：稍後再說 */}
          <button
            onClick={handleSkipClick}
            disabled={isLoading}
            className={cn(
              'w-full px-4 py-2 rounded-md',
              'text-[#00ff88]/70 hover:text-[#00ff88]',
              'text-sm',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              // 無背景，純文字連結風格
              'hover:underline'
            )}
          >
            稍後再說
          </button>

          {/* 底部提示 */}
          <p className="text-xs text-[#00ff88]/50 text-center mt-2">
            您隨時可以在帳號設定中新增 Passkey
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
