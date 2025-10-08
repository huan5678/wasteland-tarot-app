import { QuickReadingStorage } from '../quickReadingStorage'
import type { LocalStorageData } from '../quickReadingStorage'

describe('QuickReadingStorage - localStorage 服務層', () => {
  let storage: QuickReadingStorage

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    storage = new QuickReadingStorage()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('isAvailable', () => {
    it('應該檢測 localStorage 是否可用', () => {
      const available = storage.isAvailable()
      expect(available).toBe(true)
    })
  })

  describe('save', () => {
    it('應該成功儲存資料至 localStorage', () => {
      const data: LocalStorageData = {
        selectedCardId: '5',
        cardPoolIds: ['0', '5', '12', '18', '21'],
        timestamp: Date.now(),
      }

      const result = storage.save(data)

      expect(result.success).toBe(true)
      expect(localStorage.getItem('wasteland-tarot-quick-reading')).toBeTruthy()
    })

    it('應該正確序列化資料', () => {
      const data: LocalStorageData = {
        selectedCardId: '12',
        cardPoolIds: ['1', '3', '5', '7', '9'],
        timestamp: 1234567890000,
      }

      storage.save(data)

      const stored = localStorage.getItem('wasteland-tarot-quick-reading')
      expect(stored).toBeTruthy()

      const parsed = JSON.parse(stored!)
      expect(parsed.selectedCardId).toBe('12')
      expect(parsed.cardPoolIds).toEqual(['1', '3', '5', '7', '9'])
      expect(parsed.timestamp).toBe(1234567890000)
    })

    it('應該處理 QuotaExceededError', () => {
      // Mock localStorage.setItem to throw QuotaExceededError
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = jest.fn(() => {
        const error: any = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      })

      const data: LocalStorageData = {
        selectedCardId: '0',
        cardPoolIds: ['0', '1', '2', '3', '4'],
        timestamp: Date.now(),
      }

      const result = storage.save(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('QUOTA_EXCEEDED')
      }

      // Restore
      Storage.prototype.setItem = originalSetItem
    })
  })

  describe('load', () => {
    it('應該成功從 localStorage 讀取資料', () => {
      const data: LocalStorageData = {
        selectedCardId: '10',
        cardPoolIds: ['2', '4', '6', '8', '10'],
        timestamp: Date.now(),
      }

      localStorage.setItem('wasteland-tarot-quick-reading', JSON.stringify(data))

      const result = storage.load()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value?.selectedCardId).toBe('10')
        expect(result.value?.cardPoolIds).toEqual(['2', '4', '6', '8', '10'])
      }
    })

    it('當無儲存資料時應該返回 null', () => {
      const result = storage.load()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toBeNull()
      }
    })

    it('應該驗證並拒絕損壞的資料', () => {
      // 儲存無效的 JSON
      localStorage.setItem('wasteland-tarot-quick-reading', 'invalid-json')

      const result = storage.load()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_DATA')
      }
    })

    it('應該驗證資料格式', () => {
      // 儲存格式錯誤的資料
      const invalidData = {
        selectedCardId: '5',
        // 缺少 cardPoolIds
        timestamp: Date.now(),
      }

      localStorage.setItem(
        'wasteland-tarot-quick-reading',
        JSON.stringify(invalidData)
      )

      const result = storage.load()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_DATA')
      }
    })

    it('應該驗證 cardPoolIds 長度為 5', () => {
      const invalidData = {
        selectedCardId: '5',
        cardPoolIds: ['1', '2', '3'], // 只有 3 張
        timestamp: Date.now(),
      }

      localStorage.setItem(
        'wasteland-tarot-quick-reading',
        JSON.stringify(invalidData)
      )

      const result = storage.load()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_DATA')
      }
    })
  })

  describe('clear', () => {
    it('應該清除儲存的資料', () => {
      const data: LocalStorageData = {
        selectedCardId: '7',
        cardPoolIds: ['0', '1', '2', '3', '4'],
        timestamp: Date.now(),
      }

      storage.save(data)
      expect(localStorage.getItem('wasteland-tarot-quick-reading')).toBeTruthy()

      const result = storage.clear()

      expect(result.success).toBe(true)
      expect(localStorage.getItem('wasteland-tarot-quick-reading')).toBeNull()
    })
  })

  describe('validate', () => {
    it('應該驗證有效的資料', () => {
      const validData = {
        selectedCardId: '5',
        cardPoolIds: ['0', '5', '12', '18', '21'],
        timestamp: Date.now(),
      }

      const isValid = storage['validate'](validData)
      expect(isValid).toBe(true)
    })

    it('應該拒絕缺少欄位的資料', () => {
      const invalidData = {
        selectedCardId: '5',
        cardPoolIds: ['0', '1', '2', '3', '4'],
        // 缺少 timestamp
      }

      const isValid = storage['validate'](invalidData)
      expect(isValid).toBe(false)
    })

    it('應該拒絕型別錯誤的資料', () => {
      const invalidData = {
        selectedCardId: 123, // 應該是 string
        cardPoolIds: ['0', '1', '2', '3', '4'],
        timestamp: Date.now(),
      }

      const isValid = storage['validate'](invalidData)
      expect(isValid).toBe(false)
    })

    it('應該拒絕 cardPoolIds 不是陣列的資料', () => {
      const invalidData = {
        selectedCardId: '5',
        cardPoolIds: 'not-an-array',
        timestamp: Date.now(),
      }

      const isValid = storage['validate'](invalidData)
      expect(isValid).toBe(false)
    })
  })
})
