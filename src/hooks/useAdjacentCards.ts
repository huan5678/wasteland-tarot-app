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
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAdjacentCards = async () => {
      try {
        setIsLoading(true)

        // 載入該花色的所有卡牌（跨頁載入）
        const allCards: TarotCard[] = []
        let page = 1
        let totalCount = 0
        let pageSize = 8 // 預設頁面大小

        while (true) {
          const cards = await fetchCardsBySuit(suit, page)

          // 如果沒有卡片，停止載入
          if (cards.length === 0) {
            console.log(`[useAdjacentCards] Page ${page} returned 0 cards, stopping`)
            break
          }

          console.log(`[useAdjacentCards] Page ${page} loaded ${cards.length} cards`)
          allCards.push(...cards)

          // 第一頁時，嘗試從 store 的 pagination 中獲取總數資訊
          if (page === 1) {
            const store = useCardsStore.getState()
            if (store.pagination) {
              totalCount = store.pagination.totalItems
              pageSize = store.pagination.itemsPerPage
              console.log(`[useAdjacentCards] Got pagination info: totalCount=${totalCount}, pageSize=${pageSize}`)
            }
          }

          // 判斷是否需要繼續載入
          // 方式1：如果我們知道總數，檢查是否已載入完所有卡片
          if (totalCount > 0 && allCards.length >= totalCount) {
            console.log(`[useAdjacentCards] Loaded all ${allCards.length} cards`)
            break
          }

          // 方式2：如果返回的卡片數少於頁面大小，表示這是最後一頁
          if (cards.length < pageSize) {
            console.log(`[useAdjacentCards] Last page (${cards.length} < ${pageSize})`)
            break
          }

          // 方式3：安全機制 - 最多載入 20 頁（避免無限迴圈）
          if (page >= 20) {
            console.warn('[useAdjacentCards] Reached maximum page limit (20)')
            break
          }

          page++
        }

        // 找到當前卡牌的索引
        const currentIndex = allCards.findIndex((card) => card.id === cardId)

        if (currentIndex === -1) {
          setPreviousCard(null)
          setNextCard(null)
          setCurrentPage(1)
          return
        }

        // 計算當前卡片所在的頁碼（基於索引和頁面大小）
        const calculatedPage = Math.floor(currentIndex / pageSize) + 1
        setCurrentPage(calculatedPage)
        console.log(`[useAdjacentCards] Current card at index ${currentIndex}, page ${calculatedPage}`)

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
    currentPage,
    isLoading,
  }
}
