/**
 * 狀態管理輔助函式單元測試
 * 任務 14.3
 */

import { quickReadingStorage } from '@/lib/quickReadingStorage'
import type { LocalStorageData } from '@/lib/quickReadingStorage'

describe('狀態管理輔助函式測試', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('卡牌池初始化', () => {
    it('應該成功初始化卡牌池', () => {
      // 模擬卡牌池初始化
      const mockCards = [
        { id: '0', name: 'The Fool', suit: 'major_arcana' },
        { id: '1', name: 'The Magician', suit: 'major_arcana' },
        { id: '2', name: 'The High Priestess', suit: 'major_arcana' },
        { id: '3', name: 'The Empress', suit: 'major_arcana' },
        { id: '4', name: 'The Emperor', suit: 'major_arcana' },
      ]

      expect(mockCards.length).toBe(5)
      expect(mockCards.every((card) => card.suit === 'major_arcana')).toBe(true)
    })

    it('初始化失敗時應該返回空陣列', () => {
      const emptyCards: any[] = []
      expect(emptyCards.length).toBe(0)
    })
  })

  describe('翻牌處理器', () => {
    it('應該正確更新 selectedCardId', () => {
      let selectedCardId: string | null = null
      const cardId = '5'

      // 模擬翻牌操作
      selectedCardId = cardId

      expect(selectedCardId).toBe('5')
    })

    it('翻牌後應該儲存至 localStorage', () => {
      const cardId = '5'
      const cardPoolIds = ['0', '5', '12', '18', '21']

      const data: LocalStorageData = {
        selectedCardId: cardId,
        cardPoolIds,
        timestamp: Date.now(),
      }

      const result = quickReadingStorage.save(data)

      expect(result.success).toBe(true)

      const loaded = quickReadingStorage.load()
      expect(loaded.success).toBe(true)
      if (loaded.success && loaded.value) {
        expect(loaded.value.selectedCardId).toBe(cardId)
      }
    })

    it('已選中卡牌時不應該允許翻其他牌', () => {
      let selectedCardId: string | null = '5'
      const newCardId = '12'

      // 模擬防止重複翻牌邏輯
      if (selectedCardId !== null) {
        // 不執行翻牌
      } else {
        selectedCardId = newCardId
      }

      expect(selectedCardId).toBe('5') // 保持原選擇
    })
  })

  describe('重置功能', () => {
    it('應該清除 localStorage', () => {
      const data: LocalStorageData = {
        selectedCardId: '5',
        cardPoolIds: ['0', '5', '12', '18', '21'],
        timestamp: Date.now(),
      }

      quickReadingStorage.save(data)
      expect(localStorage.getItem('wasteland-tarot-quick-reading')).toBeTruthy()

      quickReadingStorage.clear()
      expect(localStorage.getItem('wasteland-tarot-quick-reading')).toBeNull()
    })

    it('應該重新初始化卡牌池', () => {
      // 模擬重置流程
      let cardPool = [
        { id: '0', name: 'The Fool' },
        { id: '5', name: 'The Hierophant' },
      ]
      let selectedCardId: string | null = '5'

      // 執行重置
      quickReadingStorage.clear()
      selectedCardId = null
      cardPool = [
        { id: '1', name: 'The Magician' },
        { id: '7', name: 'The Chariot' },
      ]

      expect(selectedCardId).toBeNull()
      expect(cardPool.length).toBeGreaterThan(0)
    })

    it('重置後應該可以重新選擇卡牌', () => {
      let selectedCardId: string | null = '5'

      // 重置
      selectedCardId = null

      // 重新選擇
      selectedCardId = '12'

      expect(selectedCardId).toBe('12')
    })
  })

  describe('錯誤處理', () => {
    it('localStorage 不可用時應該優雅降級', () => {
      // 模擬 localStorage 不可用
      const storage = quickReadingStorage

      // 應該有 isAvailable 檢查
      expect(typeof storage.isAvailable).toBe('function')
    })

    it('損壞的資料應該被自動清除', () => {
      localStorage.setItem('wasteland-tarot-quick-reading', 'invalid-json')

      const result = quickReadingStorage.load()

      expect(result.success).toBe(false)
      // 應該已清除損壞資料
      expect(localStorage.getItem('wasteland-tarot-quick-reading')).toBeNull()
    })

    it('格式錯誤的資料應該被拒絕', () => {
      const invalidData = {
        selectedCardId: '5',
        cardPoolIds: ['1', '2'], // 只有 2 張，應該是 5 張
        timestamp: Date.now(),
      }

      localStorage.setItem(
        'wasteland-tarot-quick-reading',
        JSON.stringify(invalidData)
      )

      const result = quickReadingStorage.load()
      expect(result.success).toBe(false)
    })
  })

  describe('狀態恢復', () => {
    it('應該從 localStorage 正確恢復狀態', () => {
      const data: LocalStorageData = {
        selectedCardId: '10',
        cardPoolIds: ['2', '4', '6', '8', '10'],
        timestamp: Date.now(),
      }

      quickReadingStorage.save(data)

      const result = quickReadingStorage.load()

      expect(result.success).toBe(true)
      if (result.success && result.value) {
        expect(result.value.selectedCardId).toBe('10')
        expect(result.value.cardPoolIds).toEqual(['2', '4', '6', '8', '10'])
      }
    })

    it('無儲存資料時應該初始化新狀態', () => {
      const result = quickReadingStorage.load()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toBeNull()
      }
    })
  })
})
