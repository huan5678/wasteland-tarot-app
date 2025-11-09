/**
 * Quick Reading Card Detail Page (移動端)
 * 路由: /readings/quick/card/[cardId]
 *
 * 功能：
 * - 從 localStorage 讀取快速解讀 session 資料
 * - 從 enhancedCards 資料中取得卡片完整資訊
 * - 顯示單張卡牌的完整詳情
 * - 支援返回到 /readings/quick
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CardDetailModal } from '@/components/tarot/CardDetailModal'
import type { DetailedTarotCard } from '@/components/tarot/CardDetailModal'
import { PixelIcon } from '@/components/ui/icons'
import { QuickReadingStorage } from '@/lib/quickReadingStorage'
import { enhancedWastelandCards } from '@/data/enhancedCards'

// 初始化 storage 服務
const storage = new QuickReadingStorage()

/**
 * QuickCardDetailPage 組件
 */
export default function QuickCardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const cardId = params.cardId as string

  const [card, setCard] = useState<DetailedTarotCard | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log('[QuickCardDetail] Loading card:', cardId)

    // 從 localStorage 讀取快速解讀資料
    const savedState = storage.load()

    if (!savedState.success || !savedState.value) {
      console.warn('[QuickCardDetail] No saved state found, redirecting to /readings/quick')
      router.replace('/readings/quick')
      return
    }

    const { selectedCardId, cardPoolIds } = savedState.value

    // 驗證 cardId 是否在此次解讀中（可以是選中的卡或池中的任一張）
    const isValidCard =
      String(selectedCardId) === String(cardId) ||
      cardPoolIds.some(id => String(id) === String(cardId))

    if (!isValidCard) {
      console.warn('[QuickCardDetail] Card not in current reading:', cardId)
      router.replace('/readings/quick')
      return
    }

    // 從 enhancedWastelandCards 中找出對應的卡片
    const foundCard = enhancedWastelandCards.find((c) => String(c.id) === String(cardId))

    if (!foundCard) {
      console.error('[QuickCardDetail] Card not found in data:', cardId)
      router.replace('/readings/quick')
      return
    }

    console.log('[QuickCardDetail] Card loaded:', foundCard.name)
    setCard(foundCard as DetailedTarotCard)
    setIsLoading(false)
  }, [cardId, router])

  /**
   * 返回處理
   */
  const handleClose = () => {
    router.push('/readings/quick')
  }

  /**
   * Loading 狀態
   */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <PixelIcon
            name="loader"
            animation="spin"
            sizePreset="xl"
            variant="primary"
            decorative
          />
          <p className="text-pip-boy-green mt-4 text-sm">載入卡牌資料...</p>
        </div>
      </div>
    )
  }

  /**
   * 無卡牌資料
   */
  if (!card) {
    return null // 已經 redirect，不應該看到這個
  }

  /**
   * 渲染卡牌詳情
   */
  return (
    <CardDetailModal
      card={card}
      isOpen={true}
      isFullPage={true}  // 全頁模式
      onClose={handleClose}
      isGuestMode={true}  // 快速解讀視為訪客模式
      enableAudio={true}
      showQuickActions={false}
      showBookmark={false}
      showShare={true}
      showPersonalNotes={false}
    />
  )
}
