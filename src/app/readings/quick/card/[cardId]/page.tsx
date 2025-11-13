/**
 * Quick Reading Card Detail Page (移動端)
 * 路由: /readings/quick/card/[cardId]
 *
 * 功能：
 * - 從 localStorage 讀取快速解讀 session 資料
 * - 從 enhancedCards 資料中取得卡片完整資訊
 * - 顯示單張卡牌的完整詳情 with AI streaming interpretation
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
import { StreamingInterpretation } from '@/components/readings/StreamingInterpretation'

// 初始化 storage 服務
const storage = new QuickReadingStorage()

// Default question for quick readings (no stored question)
const DEFAULT_QUICK_READING_QUESTION = '請為我解讀這張卡牌'

/**
 * QuickCardDetailPage 組件
 */
export default function QuickCardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const cardId = params.cardId as string

  const [card, setCard] = useState<DetailedTarotCard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [streamingComplete, setStreamingComplete] = useState(false)
  const [interpretationText, setInterpretationText] = useState<string>('')
  const [streamingError, setStreamingError] = useState<Error | null>(null)

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
   * StreamingInterpretation callbacks
   */
  const handleInterpretationComplete = (text: string) => {
    console.log('[QuickCardDetail] Streaming interpretation complete')
    setStreamingComplete(true)
    setInterpretationText(text)
  }

  const handleInterpretationError = (error: Error) => {
    console.error('[QuickCardDetail] Streaming interpretation error:', error)
    setStreamingError(error)
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
   * 渲染卡牌詳情 + AI Streaming Interpretation
   */
  return (
    <div className="min-h-screen bg-black">
      {/* Card Information Section */}
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

      {/* AI Streaming Interpretation Section */}
      <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
        <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 rounded-lg p-6">
          <h3 className="text-pip-boy-green font-bold text-lg mb-4 flex items-center gap-2">
            <PixelIcon name="lightbulb" size={20} decorative />
            AI 智慧解讀
          </h3>

          <StreamingInterpretation
            cardId={cardId}
            question={DEFAULT_QUICK_READING_QUESTION}
            characterVoice="pip_boy"
            karmaAlignment={card.karma_alignment?.toLowerCase() || 'neutral'}
            factionAlignment={null}
            positionMeaning={card.position === 'reversed' ? '逆位' : '正位'}
            apiUrl="/api/v1/readings/interpretation/stream"
            enabled={true}
            charsPerSecond={40}
            onComplete={handleInterpretationComplete}
            onError={handleInterpretationError}
          />

          {/* Error display */}
          {streamingError && (
            <div className="mt-4 bg-red-900/20 border border-red-600/50 rounded p-4">
              <p className="text-red-400 text-sm">
                解讀生成時發生錯誤，請稍後重試
              </p>
            </div>
          )}

          {/* Completion indicator (for debugging) */}
          {streamingComplete && (
            <div className="mt-4 text-pip-boy-green/60 text-xs">
              ✓ AI 解讀完成 ({interpretationText.length} 字元)
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
