'use client'

import React, { useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { useErrorStore } from '@/lib/errorStore'
import { PixelIcon } from '@/components/ui/icons'

/**
 * GlobalErrorDisplay - 使用 Sonner toast 顯示全域錯誤
 *
 * 特點:
 * - 使用 Shadcn Sonner 的優雅 toast 通知
 * - 自動監聽 errorStore 並顯示錯誤
 * - 支援離線狀態提示
 * - 支援重試功能
 * - 位於右下角顯示
 */
export function GlobalErrorDisplay() {
  const errors = useErrorStore(s => s.errors)
  const online = useErrorStore(s => s.networkOnline)
  const dismiss = useErrorStore(s => s.dismissError)

  // 監聽網路狀態變化
  useEffect(() => {
    if (!online) {
      toast.warning('離線模式', {
        description: '偵測到網路中斷，請檢查連線。',
        icon: <PixelIcon name="wifi-off" sizePreset="xs" variant="warning" animation="pulse" decorative />,
        duration: Infinity, // 保持顯示直到網路恢復
        id: 'network-offline',
        classNames: {
          toast: 'border-2 border-[#ffdd00] bg-[#443300] backdrop-blur-sm',
          title: 'text-[#ffff33] font-bold',
          description: 'text-[#ffff33]/80 text-xs',
          closeButton: 'text-[#ffdd00]/60 hover:text-[#ffdd00]',
        }
      })
    } else {
      // 網路恢復時關閉離線通知
      toast.dismiss('network-offline')
    }
  }, [online])

  // 監聽錯誤變化並顯示 toast
  useEffect(() => {
    if (errors.length === 0) return

    // 只顯示最新的錯誤
    const latestError = errors[errors.length - 1]

    toast.error(latestError.message, {
      id: latestError.id,
      description: latestError.statusCode ? `狀態碼: ${latestError.statusCode}` : undefined,
      icon: <PixelIcon name="close" sizePreset="xs" variant="error" animation="wiggle" decorative />,
      duration: 5000,
      action: latestError.retry ? {
        label: (
          <div className="flex items-center gap-1">
            <PixelIcon name="reload" sizePreset="xs" className="text-white" decorative />
            <span>重試</span>
          </div>
        ),
        onClick: async () => {
          if (latestError.retry) {
            await latestError.retry()
            dismiss(latestError.id)
          }
        }
      } : undefined,
      onDismiss: () => dismiss(latestError.id),
      classNames: {
        toast: 'border-2 border-[#cc3333] bg-[#441111] backdrop-blur-sm',
        title: 'text-[#ff6666] font-bold',
        description: 'text-[#ff6666]/70 text-xs',
        actionButton: 'bg-[#ff4444] text-white hover:bg-[#cc3333]',
        closeButton: 'text-[#ff6666]/60 hover:text-[#ff6666]',
      }
    })
  }, [errors, dismiss])

  return (
    <Toaster
      position="bottom-right"
      expand={false}
      richColors={false}
      closeButton
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'p-4 rounded-none shadow-lg flex items-start gap-3',
          title: 'font-bold text-base',
          description: 'text-xs mt-1',
          actionButton: 'px-3 py-1.5 rounded-none transition-colors',
          closeButton: 'transition-colors',
        },
      }}
    />
  )
}
