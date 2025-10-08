/**
 * 卡牌池選取邏輯單元測試
 * 任務 14.2
 */

import { enhancedWastelandCards } from '@/data/enhancedCards'

describe('卡牌池選取邏輯測試', () => {
  /**
   * 篩選大阿爾克納卡牌
   */
  const getMajorArcanaCards = () => {
    return enhancedWastelandCards.filter((card) => card.suit === '大阿爾克那')
  }

  /**
   * 隨機選取不重複卡牌
   */
  const selectRandomCards = (cards: any[], count: number = 5) => {
    if (cards.length === 0) {
      return []
    }

    const actualCount = Math.min(count, cards.length)
    const selected = new Set<any>()
    let attempts = 0
    const maxAttempts = 1000

    while (selected.size < actualCount && attempts < maxAttempts) {
      const randomIndex = Math.floor(Math.random() * cards.length)
      selected.add(cards[randomIndex])
      attempts++
    }

    if (selected.size < actualCount) {
      return cards.slice(0, actualCount)
    }

    return Array.from(selected)
  }

  describe('getMajorArcanaCards', () => {
    it('應該只返回大阿爾克那卡牌', () => {
      const majorArcana = getMajorArcanaCards()

      expect(majorArcana.length).toBeGreaterThan(0)
      expect(majorArcana.every((card) => card.suit === '大阿爾克那')).toBe(true)
    })

    it('應該返回至少 22 張卡牌', () => {
      const majorArcana = getMajorArcanaCards()
      expect(majorArcana.length).toBeGreaterThanOrEqual(22)
    })

    it('每張卡牌都應該有必要的屬性', () => {
      const majorArcana = getMajorArcanaCards()

      majorArcana.forEach((card) => {
        expect(card).toHaveProperty('id')
        expect(card).toHaveProperty('name')
        expect(card).toHaveProperty('suit')
        expect(card).toHaveProperty('image_url')
      })
    })
  })

  describe('selectRandomCards', () => {
    const majorArcana = getMajorArcanaCards()

    it('應該選取正確數量的卡牌', () => {
      const selected = selectRandomCards(majorArcana, 5)
      expect(selected.length).toBe(5)
    })

    it('選取的卡牌應該不重複', () => {
      const selected = selectRandomCards(majorArcana, 5)
      const ids = selected.map((card) => card.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(5)
    })

    it('當卡牌數量不足時，應該返回所有可用卡牌', () => {
      const fewCards = majorArcana.slice(0, 3)
      const selected = selectRandomCards(fewCards, 5)
      expect(selected.length).toBe(3)
    })

    it('當傳入空陣列時，應該返回空陣列', () => {
      const selected = selectRandomCards([], 5)
      expect(selected.length).toBe(0)
    })

    it('應該從提供的卡牌池中選取', () => {
      const selected = selectRandomCards(majorArcana, 5)
      selected.forEach((card) => {
        expect(majorArcana).toContainEqual(card)
      })
    })

    it('多次選取應該產生不同的結果', () => {
      const selection1 = selectRandomCards(majorArcana, 5)
      const selection2 = selectRandomCards(majorArcana, 5)

      const ids1 = selection1.map((c) => c.id).sort()
      const ids2 = selection2.map((c) => c.id).sort()

      // 至少應該有一些差異（雖然有小概率相同）
      const areDifferent = ids1.some((id, index) => id !== ids2[index])
      // 這個測試可能偶爾失敗，但概率極低
      expect(areDifferent || ids1.length !== ids2.length).toBe(true)
    })

    it('選取的卡牌應該保留原始屬性', () => {
      const selected = selectRandomCards(majorArcana, 5)

      selected.forEach((card) => {
        expect(card).toHaveProperty('id')
        expect(card).toHaveProperty('name')
        expect(card).toHaveProperty('suit')
        expect(card.suit).toBe('大阿爾克那')
      })
    })
  })

  describe('邊界情況測試', () => {
    it('請求 0 張卡牌應該返回空陣列', () => {
      const majorArcana = getMajorArcanaCards()
      const selected = selectRandomCards(majorArcana, 0)
      expect(selected.length).toBe(0)
    })

    it('請求負數張卡牌應該返回空陣列', () => {
      const majorArcana = getMajorArcanaCards()
      const selected = selectRandomCards(majorArcana, -5)
      expect(selected.length).toBe(0)
    })

    it('請求超過可用數量的卡牌應該返回所有卡牌', () => {
      const majorArcana = getMajorArcanaCards()
      const selected = selectRandomCards(majorArcana, 100)
      expect(selected.length).toBe(majorArcana.length)
    })
  })
})
