'use client'

/**
 * 快速占卜頁面 - 供訪客使用，無需登入
 *
 * 功能：
 * - 允許未登入用戶體驗占卜功能
 * - Carousel 瀏覽與翻牌互動
 * - localStorage 狀態持久化
 * - Modal 解牌介面與語音播放
 * - CTA 導流至註冊/登入
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PixelIcon } from '@/components/ui/icons'
import { enhancedWastelandCards } from '@/data/enhancedCards'
import type { DetailedTarotCard } from '@/components/tarot/CardDetailModal'
import { QuickReadingStorage } from '@/lib/quickReadingStorage'
import { CarouselContainer } from '@/components/readings/CarouselContainer'
import dynamic from 'next/dynamic'

// Dynamic import CardDetailModal to reduce initial bundle size
const CardDetailModal = dynamic(
  () => import('@/components/tarot/CardDetailModal').then((mod) => ({ default: mod.CardDetailModal })),
  { ssr: false }
)

// Dynamic import TarotCardWithDailyBack to reduce initial bundle size
const TarotCardWithDailyBack = dynamic(
  () => import('@/components/tarot/TarotCardWithDailyBack').then((mod) => ({ default: mod.TarotCardWithDailyBack })),
  { ssr: false }
)

// 初始化 storage 服務
const storage = new QuickReadingStorage()

export default function QuickReadingPage() {
  const router = useRouter()

  // 狀態管理
  const [cardPool, setCardPool] = useState<DetailedTarotCard[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  /**
   * 從 enhancedCards 中隨機選取 3-5 張大阿爾克納
   */
  const initializeCardPool = useCallback((): DetailedTarotCard[] => {
    // 篩選大阿爾克納
    const majorArcana = enhancedWastelandCards.filter(
      (card) => card.suit === '大阿爾克那'
    )

    if (majorArcana.length === 0) {
      console.error('No Major Arcana cards found in enhancedWastelandCards')
      setError('卡牌資料載入失敗')
      return []
    }

    // 使用所有可用的大阿爾克納（3-5 張）
    const availableCount = Math.min(majorArcana.length, 5)
    const selectedCards: DetailedTarotCard[] = []
    const usedIndices = new Set<number>()

    // 隨機選取（確保不重複）
    while (selectedCards.length < availableCount && selectedCards.length < 100) {
      const randomIndex = Math.floor(Math.random() * majorArcana.length)
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex)
        selectedCards.push(majorArcana[randomIndex])
      }
    }

    console.log(`Initialized card pool with ${selectedCards.length} cards:`, selectedCards.map(c => c.name))
    return selectedCards
  }, [])

  /**
   * 頁面載入時初始化卡牌池與載入已保存狀態
   */
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true)

      // 檢查 localStorage 是否可用
      if (!storage.isAvailable()) {
        console.warn('localStorage not available, using memory-only state')
      }

      // 嘗試載入已保存的狀態
      const loadResult = storage.load()

      if (loadResult.success && loadResult.value) {
        const savedData = loadResult.value
        console.log('Loaded saved state from localStorage:', savedData)

        // 重建卡牌池
        const allMajorArcana = enhancedWastelandCards.filter(
          (card) => card.suit === '大阿爾克那'
        )

        const restoredCardPool = savedData.cardPoolIds
          .map((id) => allMajorArcana.find((card) => card.id === id))
          .filter((card): card is DetailedTarotCard => card !== undefined)

        // 驗證恢復的卡牌池
        if (restoredCardPool.length === savedData.cardPoolIds.length) {
          setCardPool(restoredCardPool)
          setSelectedCardId(savedData.selectedCardId)
          console.log('Successfully restored card pool and selection')
        } else {
          console.warn('Some cards not found, reinitializing...')
          const newCardPool = initializeCardPool()
          setCardPool(newCardPool)
          setSelectedCardId(null)
        }
      } else {
        // 無保存記錄或資料損壞，重新初始化
        const newCardPool = initializeCardPool()
        setCardPool(newCardPool)
        setSelectedCardId(null)
      }

      setIsLoading(false)
    }

    initialize()
  }, [initializeCardPool])

  /**
   * 處理卡牌翻轉
   */
  const handleCardFlip = useCallback(
    (cardId: string) => {
      if (selectedCardId) {
        // 已經選中卡牌，不允許再翻其他卡
        return
      }

      console.log('Card flipped:', cardId)
      setSelectedCardId(cardId)

      // 儲存至 localStorage
      const saveData = {
        selectedCardId: cardId,
        cardPoolIds: cardPool.map((c) => c.id.toString()),
        timestamp: Date.now(),
      }

      const saveResult = storage.save(saveData)
      if (!saveResult.success) {
        console.error('Failed to save to localStorage:', saveResult.error)
      }
    },
    [selectedCardId, cardPool]
  )

  /**
   * 處理點擊已翻開的卡牌（開啟 Modal）
   */
  const handleCardClick = useCallback(
    (card: DetailedTarotCard) => {
      if (card.id.toString() === selectedCardId) {
        console.log('Opening modal for card:', card.name)
        setIsModalOpen(true)
      }
    },
    [selectedCardId]
  )

  /**
   * 關閉 Modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  /**
   * 導航至註冊頁面
   */
  const handleRegister = useCallback(() => {
    router.push('/auth/register')
  }, [router])

  /**
   * 導航至登入頁面
   */
  const handleLogin = useCallback(() => {
    router.push('/auth/login')
  }, [router])

  /**
   * 返回首頁
   */
  const handleGoBack = useCallback(() => {
    router.push('/')
  }, [router])

  // 取得選中的卡牌物件
  const selectedCard = selectedCardId
    ? cardPool.find((c) => c.id.toString() === selectedCardId)
    : null

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="min-h-screen text-pip-boy-green flex items-center justify-center">
        <div className="text-center">
          <PixelIcon name="card-stack" size={48} className="mx-auto mb-4 text-pip-boy-green animate-pulse" decorative />
          <p className="text-sm text-pip-boy-green animate-pulse">
            正在初始化廢土塔羅系統...
          </p>
        </div>
      </div>
    )
  }

  // 錯誤狀態
  if (error || cardPool.length === 0) {
    return (
      <div className="min-h-screen text-pip-boy-green flex items-center justify-center p-4">
        <div className="max-w-md text-center border-2 border-red-400 p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">系統錯誤</h1>
          <p className="text-sm text-pip-boy-green/70 mb-6">
            {error || '無法載入卡牌資料'}
          </p>
          <button
            onClick={handleGoBack}
            className="border-2 border-pip-boy-green px-6 py-3 text-pip-boy-green hover:bg-pip-boy-green hover:text-black transition-all"
          >
            返回首頁
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-pip-boy-green p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div
          className="border-2 border-pip-boy-green p-4 mb-8"
          style={{ backgroundColor: 'var(--color-pip-boy-green-10)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="text-pip-boy-green hover:text-cyan-400 transition-colors"
                aria-label="返回首頁"
              >
                <PixelIcon name="arrow-left" size={24} aria-label="返回首頁" />
              </button>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span>快速占卜模式</span>
                  <span>|</span>
                  <span>訪客體驗</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleRegister}
              className="flex items-center gap-2 text-xs text-pip-boy-green hover:text-cyan-400 transition-colors px-3 py-1 border border-pip-boy-green"
            >
              <PixelIcon name="user-plus" size={16} aria-label="註冊 Vault 帳號" />
              註冊 Vault 帳號
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div
          className="border-2 border-pip-boy-green p-8"
          style={{ backgroundColor: 'var(--color-pip-boy-green-5)' }}
        >
          <div className="text-center mb-8">
            <PixelIcon name="card-stack" size={64} className="mx-auto mb-4 text-pip-boy-green" decorative />
            <h1 className="text-3xl font-bold text-pip-boy-green mb-2">
              快速占卜
            </h1>
            <p className="text-sm text-text-muted">
              無需登入，立即體驗廢土塔羅的智慧
            </p>
          </div>

          {/* Carousel with Cards - 僅在未選卡時顯示 */}
          {!selectedCardId ? (
            <CarouselContainer
              cards={cardPool}
              selectedCardId={selectedCardId}
              activeIndex={activeCardIndex}
              onIndexChange={setActiveCardIndex}
              onCardFlip={handleCardFlip}
              onCardClick={handleCardClick}
              isDisabled={false}
            >
              {(card, index, isActive) => (
                <TarotCardWithDailyBack
                  card={card}
                  isRevealed={card.id.toString() === selectedCardId}
                  position="upright"
                  size="large"
                  flipStyle="kokonut"
                  onClick={() => {
                    if (!selectedCardId) {
                      // 卡背狀態，點擊翻牌
                      handleCardFlip(card.id.toString())
                    } else if (card.id.toString() === selectedCardId) {
                      // 已翻開的卡牌，點擊開啟 Modal
                      handleCardClick(card)
                    }
                  }}
                  isSelectable={!selectedCardId}
                  isSelected={card.id.toString() === selectedCardId}
                  showGlow={card.id.toString() === selectedCardId}
                  enableHaptic={true}
                  className={
                    selectedCardId && card.id.toString() !== selectedCardId
                      ? 'opacity-50 pointer-events-none'
                      : ''
                  }
                />
              )}
            </CarouselContainer>
          ) : (
            /* 已選卡時僅顯示單張卡片 */
            <div className="flex justify-center py-8">
              <TarotCardWithDailyBack
                card={selectedCard!}
                isRevealed={true}
                position="upright"
                size="large"
                flipStyle="kokonut"
                onClick={() => handleCardClick(selectedCard!)}
                isSelectable={false}
                isSelected={true}
                showGlow={true}
                enableHaptic={true}
              />
            </div>
          )}

          {/* 主要 CTA - 翻牌後顯示 */}
          {selectedCardId && (
            <div className="mt-8 border-2 border-pip-boy-green p-6 animate-pulse-border">
              <div className="flex items-center gap-3 mb-4">
                <PixelIcon name="card-stack" size={32} className="text-pip-boy-green animate-pulse" decorative />
                <h3 className="text-xl text-pip-boy-green">
                  這是你的專屬命運展示 - 僅此一次
                </h3>
              </div>

              <p className="text-sm text-pip-boy-green/70 mb-4">
                想要探索更多可能性？註冊後可獲得：
              </p>

              <ul className="space-y-2 mb-6 text-sm text-pip-boy-green/80">
                <li className="flex items-center gap-2">
                  <PixelIcon name="check" size={16} className="text-pip-boy-green flex-shrink-0" decorative />
                  <span><span className="text-pip-boy-green font-bold">無限次抽卡</span>，探索完整塔羅智慧</span>
                </li>
                <li className="flex items-center gap-2">
                  <PixelIcon name="check" size={16} className="text-pip-boy-green flex-shrink-0" decorative />
                  <span>個人化 AI 解讀（Karma & Faction 系統）</span>
                </li>
                <li className="flex items-center gap-2">
                  <PixelIcon name="check" size={16} className="text-pip-boy-green flex-shrink-0" decorative />
                  <span>占卜記錄保存與歷史追蹤</span>
                </li>
                <li className="flex items-center gap-2">
                  <PixelIcon name="check" size={16} className="text-pip-boy-green flex-shrink-0" decorative />
                  <span>多種牌陣選擇（三卡、Celtic Cross）</span>
                </li>
                <li className="flex items-center gap-2">
                  <PixelIcon name="check" size={16} className="text-pip-boy-green flex-shrink-0" decorative />
                  <span>角色語音解讀（Pip-Boy, Mr. Handy, Scribe）</span>
                </li>
              </ul>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleRegister}
                  className="flex-1 border-2 border-pip-boy-green px-6 py-3 text-pip-boy-green hover:bg-pip-boy-green hover:text-black transition-all"
                >
                  立即註冊 - 解鎖完整體驗
                </button>
                <button
                  onClick={handleLogin}
                  className="text-sm text-pip-boy-green hover:text-cyan-400 transition-colors"
                >
                  已有帳號？立即登入 →
                </button>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div
            className="mt-8 border border-pip-boy-green p-4"
            style={{ backgroundColor: 'var(--color-pip-boy-green-5)' }}
          >
            <p className="text-xs text-text-muted text-center flex items-center justify-center gap-2">
              <PixelIcon name="file-text" size={16} className="text-pip-boy-green flex-shrink-0" decorative />
              <span>註冊 Vault 帳號後，你可以：儲存占卜歷史 | 使用高級牌陣 | 獲得 AI 詳細解讀 | 追蹤 Karma 變化</span>
            </p>
          </div>
        </div>
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          position="upright"
          isGuestMode={true}
        />
      )}
    </div>
  )
}
