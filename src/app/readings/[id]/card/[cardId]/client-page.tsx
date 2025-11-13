'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CardDetailModal } from '@/components/tarot/CardDetailModal'
import type { DetailedTarotCard, ReadingContext } from '@/components/tarot/CardDetailModal'
import { PixelIcon } from '@/components/ui/icons'
import { readingsAPI } from '@/lib/api'
import type { Reading } from '@/lib/api'
import { useAuthStore } from '@/lib/authStore'
import { getCardImageUrl } from '@/lib/utils/cardImages'

/**
 * 工具函數：取得牌陣名稱
 */
const getSpreadTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    'single': '單張牌',
    'three_card': '三張牌',
    'celtic_cross': '凱爾特十字',
    'past_present_future': '過去現在未來'
  }
  return typeMap[type] || type
}

/**
 * ReadingCardDetailClientPage 組件
 */
export default function ReadingCardDetailClientPage() {
  const params = useParams()
  const router = useRouter()
  const readingId = params.id as string
  const cardId = params.cardId as string

  const [reading, setReading] = useState<Reading | null>(null)
  const [card, setCard] = useState<DetailedTarotCard | null>(null)
  const [cardIndex, setCardIndex] = useState<number>(-1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Auth state
  const user = useAuthStore((s) => s.user)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const initialize = useAuthStore((s) => s.initialize)

  /**
   * 認證檢查
   */
  useEffect(() => {
    if (!isInitialized) {
      initialize()
      return
    }

    if (isInitialized && !user) {
      console.log('[ReadingCardDetail] 🔀 Redirecting to login')
      router.push(`/auth/login?returnUrl=%2Freadings%2F${readingId}%2Fcard%2F${cardId}`)
    }
  }, [user, isInitialized, initialize, router, readingId, cardId])

  /**
   * 載入占卜記錄資料
   */
  useEffect(() => {
    const fetchReadingAndCard = async () => {
      if (!isInitialized || !user) {
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // 載入完整的占卜記錄
        const data = await readingsAPI.getById(readingId)

        if (!data) {
          throw new Error('找不到此占卜記錄')
        }

        setReading(data)

        // 從 card_positions 或 cards_drawn 中尋找卡牌
        let foundCard: any = null
        let foundIndex = -1

        // 新資料結構：card_positions
        if ('card_positions' in data && data.card_positions && data.card_positions.length > 0) {
          foundIndex = data.card_positions.findIndex((pos) => String(pos.card_id) === String(cardId))

          if (foundIndex !== -1) {
            const position = data.card_positions[foundIndex]
            const cardData = position.card

            if (cardData) {
              console.log('[ReadingCardDetail] 🔍 Card data from API:', {
                name: cardData.name,
                hasCharacterVoices: !!cardData.character_voices,
                characterVoicesKeys: cardData.character_voices ? Object.keys(cardData.character_voices) : []
              })

              foundCard = {
                id: cardData.id,
                name: cardData.name,
                suit: cardData.suit,
                number: cardData.number || cardData.card_number,
                card_number: cardData.card_number || cardData.number,
                image_url: cardData.visuals?.image_url || cardData.image_url || getCardImageUrl(cardData as any),
                upright_meaning: cardData.upright_meaning,
                reversed_meaning: cardData.reversed_meaning,
                keywords: cardData.keywords || [],
                fallout_reference: cardData.fallout_easter_egg || cardData.nuka_cola_reference,
                radiation_factor: cardData.metadata?.radiation_level || cardData.radiation_factor || 0,
                karma_alignment: cardData.karma_alignment,
                element: cardData.element,
                astrological_association: cardData.astrological_association,
                symbolism: cardData.symbolism,
                description: cardData.upright_meaning,
                // 重要：包含完整的 CardDetailModal 所需欄位
                character_voices: cardData.character_voices || {},
                vault_reference: cardData.vault_reference,
                threat_level: cardData.threat_level,
                wasteland_humor: cardData.wasteland_humor,
                rarity_level: cardData.rarity_level || 'common',
                pip_boy_interpretation: cardData.pip_boy_interpretation,
                audio_cue_url: cardData.audio_cue_url,
                created_at: cardData.created_at,
                updated_at: cardData.updated_at
              }
            }
          }
        }
        // 舊資料結構：cards_drawn
        else if ('cards_drawn' in data && (data as any).cards_drawn) {
          foundIndex = (data as any).cards_drawn.findIndex((c: any) =>
            String(c.card_id || c.id) === String(cardId)
          )

          if (foundIndex !== -1) {
            const cardData = (data as any).cards_drawn[foundIndex]
            foundCard = {
              id: cardData.card_id || cardData.id,
              name: cardData.name || cardData.card_name,
              suit: cardData.suit,
              number: cardData.number || cardData.card_number,
              card_number: cardData.card_number || cardData.number,
              image_url: cardData.image_url || getCardImageUrl(cardData as any),
              upright_meaning: cardData.upright_meaning,
              reversed_meaning: cardData.reversed_meaning,
              keywords: cardData.keywords || [],
              fallout_reference: cardData.fallout_reference,
              radiation_factor: cardData.radiation_factor || 0,
              karma_alignment: cardData.karma_alignment,
              element: cardData.element,
              astrological_association: cardData.astrological_association,
              symbolism: cardData.symbolism,
              description: cardData.description,
              // 重要：包含完整的 CardDetailModal 所需欄位
              character_voices: cardData.character_voices || {},
              vault_reference: cardData.vault_reference,
              threat_level: cardData.threat_level,
              wasteland_humor: cardData.wasteland_humor,
              rarity_level: cardData.rarity_level || 'common',
              pip_boy_interpretation: cardData.pip_boy_interpretation,
              audio_cue_url: cardData.audio_cue_url,
              created_at: cardData.created_at,
              updated_at: cardData.updated_at
            }
          }
        }

        if (!foundCard) {
          throw new Error('找不到此卡牌')
        }

        setCard(foundCard)
        setCardIndex(foundIndex)
        setIsLoading(false)
      } catch (err: any) {
        console.error('[ReadingCardDetail] Error:', err)

        // 404 錯誤直接返回占卜列表
        if (err.status === 404) {
          router.push('/readings')
          return
        }

        setError(err.message || '無法載入卡牌資料')
        setIsLoading(false)
      }
    }

    fetchReadingAndCard()
  }, [readingId, cardId, isInitialized, user, router])

  /**
   * 建立占卜情境資訊
   */
  const readingContext = useMemo<ReadingContext | undefined>(() => {
    if (!reading || cardIndex === -1) return undefined

    const totalCards = ('card_positions' in reading && reading.card_positions)
      ? reading.card_positions.length
      : ('cards_drawn' in reading && (reading as any).cards_drawn)
        ? (reading as any).cards_drawn.length
        : 0

    // 取得 position 資訊
    let positionName = ''
    let positionMeaning = ''

    if ('card_positions' in reading && reading.card_positions) {
      const position = reading.card_positions[cardIndex]
      positionName = position?.position_name || `位置 ${cardIndex + 1}`
      positionMeaning = position?.position_meaning || ''
    }

    return {
      question: reading.question,
      spreadType: reading.spread_type ? getSpreadTypeName(reading.spread_type) : undefined,
      positionName,
      positionMeaning,
      cardIndex,
      totalCards
    }
  }, [reading, cardIndex])

  /**
   * 返回處理
   */
  const handleClose = () => {
    router.push(`/readings/${readingId}`)
  }

  /**
   * Loading 狀態
   */
  if (!isInitialized || isLoading) {
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
          <p className="text-pip-boy-green mt-4 text-sm">
            {!isInitialized ? '驗證認證狀態...' : '載入卡牌資料...'}
          </p>
        </div>
      </div>
    )
  }

  /**
   * 錯誤狀態
   */
  if (error || !card) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="border-2 border-red-500 bg-red-500/10 p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <PixelIcon
              name="alert-triangle"
              sizePreset="lg"
              variant="error"
              animation="pulse"
              decorative
            />
            <h2 className="text-xl font-bold text-red-400 uppercase">錯誤</h2>
          </div>
          <p className="text-red-300 mb-6">{error || '找不到此卡牌'}</p>
          <button
            onClick={handleClose}
            className="w-full px-4 py-3 bg-pip-boy-green/10 border-2 border-pip-boy-green hover:bg-pip-boy-green/20 text-pip-boy-green transition-all font-bold uppercase tracking-wider"
          >
            返回占卜記錄
          </button>
        </div>
      </div>
    )
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
      readingContext={readingContext}
      isGuestMode={!user}
      enableAudio={true}
      showQuickActions={true}
      showBookmark={!!user}
      showShare={true}
      showPersonalNotes={!!user}
      factionInfluence={reading?.faction_influence}
    />
  )
}
