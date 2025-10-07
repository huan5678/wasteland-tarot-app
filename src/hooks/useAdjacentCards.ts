/**
 * useAdjacentCards Hook
 * 取得相鄰卡牌 (上一張/下一張)
 */

import { useState, useEffect } from 'react'
import { useCardsStore } from '@/stores/cardsStore'
import type { TarotCard } from '@/types/api'

/**
 * 相鄰卡牌 Hook
 *
 * @param suit - 花色
 * @param cardId - 當前卡牌 ID
 * @returns 上一張與下一張卡牌
 */
export function useAdjacentCards(suit: string, cardId: string) {
  const { fetchCardsBySuit } = useCardsStore()
  const [previousCard, setPreviousCard] = useState<TarotCard | null>(null)
  const [nextCard, setNextCard] = useState<TarotCard | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAdjacentCards = async () => {
      try {
        setIsLoading(true)

        // 載入該花色的所有卡牌 (從第一頁開始,實際應該載入全部)
        // 這裡簡化處理,假設單頁足夠或需要載入多頁
        const allCards: TarotCard[] = []
        let page = 1
        let hasMore = true

        while (hasMore && page <= 10) {
          // 最多載入 10 頁
          const cards = await fetchCardsBySuit(suit, page)
          allCards.push(...cards)

          // 簡單判斷:如果回傳卡牌數少於 12(預設頁面大小),則沒有更多頁面
          hasMore = cards.length >= 12
          page++
        }

        // 找到當前卡牌的索引
        const currentIndex = allCards.findIndex((card) => card.id === cardId)

        if (currentIndex === -1) {
          setPreviousCard(null)
          setNextCard(null)
          return
        }

        // 設定上一張與下一張卡牌
        setPreviousCard(currentIndex > 0 ? allCards[currentIndex - 1] : null)
        setNextCard(currentIndex < allCards.length - 1 ? allCards[currentIndex + 1] : null)
      } catch (error) {
        console.error('[useAdjacentCards] Error loading adjacent cards:', error)
        setPreviousCard(null)
        setNextCard(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadAdjacentCards()
  }, [suit, cardId, fetchCardsBySuit])

  return {
    previousCard,
    nextCard,
    isLoading,
  }
}
