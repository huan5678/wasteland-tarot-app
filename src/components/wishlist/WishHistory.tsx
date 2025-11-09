'use client'

import { useWishlistStore } from '@/stores/wishlistStore'
import WishCard from './WishCard'
import { PixelIcon } from '@/components/ui/icons'

/**
 * WishHistory Props
 */
export interface WishHistoryProps {
  /** 自訂樣式類別 */
  className?: string
}

/**
 * WishHistory 元件
 *
 * **功能**:
 * - 從 wishlistStore 取得 wishes 陣列
 * - 按時間降序顯示（最新的在最上方）
 * - 渲染 WishCard 元件列表
 * - 處理空狀態（無願望時顯示提示訊息）
 * - 顯示載入指示器
 *
 * **使用範例**:
 * ```tsx
 * <WishHistory className="max-h-96 overflow-y-auto" />
 * ```
 */
export default function WishHistory({
  className = '',
}: WishHistoryProps) {
  const { wishes, isLoading, updateWish } = useWishlistStore()

  // 處理編輯願望
  const handleEditWish = async (wishId: string, content: string) => {
    await updateWish(wishId, content)
  }

  // 載入中狀態
  if (isLoading && wishes.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center gap-4 p-8 ${className}`}>
        <PixelIcon
          name="loader-4"
          animation="spin"
          variant="primary"
          sizePreset="lg"
          decorative
        />
        <p className="text-pip-boy-green/70 text-sm">載入願望歷史中...</p>
      </div>
    )
  }

  // 空狀態
  if (wishes.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center gap-4 p-8 border border-pip-boy-green/30 rounded-lg bg-black/20 ${className}`}>
        <PixelIcon
          name="inbox"
          variant="muted"
          sizePreset="xl"
          decorative
        />
        <div className="text-center">
          <p className="text-pip-boy-green/70 text-base font-bold mb-2">
            尚無許願記錄
          </p>
          <p className="text-pip-boy-green/50 text-sm">
            開始許下你的第一個願望吧！
          </p>
        </div>
      </div>
    )
  }

  // 顯示願望列表（按時間降序）
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {wishes.map((wish) => (
        <WishCard
          key={wish.id}
          wish={wish}
          onEdit={handleEditWish}
          isLoading={isLoading}
        />
      ))}
    </div>
  )
}
