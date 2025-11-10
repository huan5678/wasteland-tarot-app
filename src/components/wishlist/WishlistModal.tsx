'use client'

import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useWishlistStore } from '@/stores/wishlistStore'
import MarkdownEditor from './MarkdownEditor'
import WishHistory from './WishHistory'
import { PixelIcon } from '@/components/ui/icons'

/**
 * WishlistModal Props
 */
export interface WishlistModalProps {
  /** 彈窗開啟狀態 */
  open: boolean

  /** 狀態變更回調 */
  onOpenChange: (open: boolean) => void
}

/**
 * WishlistModal 元件
 *
 * **功能**:
 * - 願望功能的主要彈窗元件
 * - 使用 @radix-ui/react-dialog 作為基礎
 * - 上半部輸入區域：根據 hasSubmittedToday 狀態顯示編輯器或「今日已許願」訊息
 * - 下半部歷史列表：顯示 WishHistory 元件，設定固定高度並可滾動
 * - 彈窗開啟時自動呼叫 fetchUserWishes()
 *
 * **使用範例**:
 * ```tsx
 * <WishlistModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 * ```
 */
export default function WishlistModal({
  open,
  onOpenChange,
}: WishlistModalProps) {
  const {
    hasSubmittedToday,
    isLoading,
    fetchUserWishes,
    submitWish,
  } = useWishlistStore()

  // 彈窗開啟時自動呼叫 fetchUserWishes()
  useEffect(() => {
    if (open) {
      console.log('[WishlistModal] 彈窗開啟，載入使用者願望列表...')
      fetchUserWishes()
    }
  }, [open, fetchUserWishes])

  // 處理願望提交
  const handleSubmitWish = async (content: string) => {
    try {
      await submitWish(content)
      console.log('[WishlistModal] 願望提交成功')
    } catch (error) {
      console.error('[WishlistModal] 願望提交失敗:', error)
      // 錯誤已由 wishlistStore 處理並推送至 errorStore
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-4xl max-h-[85vh] flex flex-col gap-6 bg-black border-2 border-pip-boy-green p-6 shadow-[0_0_30px_rgba(0,255,136,0.3)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          aria-labelledby="wishlist-modal-title"
          aria-describedby="wishlist-modal-description"
        >
          {/* 彈窗標題 */}
          <div className="flex items-center justify-between border-b border-pip-boy-green/50 pb-4">
            <Dialog.Title
              id="wishlist-modal-title"
              className="flex items-center gap-3 text-2xl font-bold text-pip-boy-green"
            >
              <PixelIcon
                name="heart"
                sizePreset="md"
                variant="primary"
                decorative
              />
              <span>願望許願池</span>
            </Dialog.Title>

            <Dialog.Close className="flex items-center justify-center w-10 h-10 rounded border border-pip-boy-green/50 hover:bg-pip-boy-green/10 transition-colors">
              <PixelIcon
                name="close"
                sizePreset="sm"
                variant="primary"
                aria-label="關閉彈窗"
              />
            </Dialog.Close>
          </div>

          {/* 彈窗描述 */}
          <Dialog.Description
            id="wishlist-modal-description"
            className="text-sm text-pip-boy-green/70 -mt-3"
          >
            每日限制一則願望，管理員將回覆您的期待
          </Dialog.Description>

          {/* 上半部：輸入區域 */}
          <div className="flex-shrink-0">
            {hasSubmittedToday ? (
              <div className="flex flex-col items-center justify-center gap-4 p-8 border border-pip-boy-green/50 rounded-lg bg-pip-boy-green/5">
                <PixelIcon
                  name="checkbox-circle"
                  sizePreset="xl"
                  variant="success"
                  decorative
                />
                <div className="text-center">
                  <p className="text-pip-boy-green text-lg font-bold mb-2">
                    今日已許願
                  </p>
                  <p className="text-pip-boy-green/70 text-sm">
                    感謝你的願望！明日再來許下新的期待吧
                  </p>
                </div>
              </div>
            ) : (
              <div className="border border-pip-boy-green/50 rounded-lg p-6 bg-black/30">
                <MarkdownEditor
                  maxLength={500}
                  submitButtonText="提交願望"
                  onSubmit={handleSubmitWish}
                  isLoading={isLoading}
                  placeholder="分享你對平台的願望與期待...\n\n支援 Markdown 格式：\n- **粗體**、*斜體*\n- 清單、連結、程式碼區塊等"
                />
              </div>
            )}
          </div>

          {/* 下半部：歷史列表（可滾動） */}
          <div className="flex-1 min-h-0 flex flex-col">
            <h3 className="text-lg font-bold text-pip-boy-green mb-4 flex items-center gap-2">
              <PixelIcon
                name="history"
                sizePreset="sm"
                variant="primary"
                decorative
              />
              <span>願望歷史</span>
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              <WishHistory />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
