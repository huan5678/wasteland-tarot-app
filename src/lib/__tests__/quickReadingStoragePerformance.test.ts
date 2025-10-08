/**
 * localStorage 操作效能測試
 * 任務 17.3 - localStorage 操作效能測試
 *
 * 測試目標：
 * - save() 操作 < 10ms
 * - load() 操作 < 20ms
 * - 驗證與反序列化 < 5ms
 */

import { quickReadingStorage, LocalStorageData } from '../quickReadingStorage'

describe('localStorage 操作效能測試', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('save() 效能測試', () => {
    it('單次 save() 操作應該 < 10ms', () => {
      const data: LocalStorageData = {
        selectedCardId: '5',
        cardPoolIds: ['0', '5', '12', '18', '21'],
        timestamp: Date.now(),
      }

      const startTime = performance.now()
      const result = quickReadingStorage.save(data)
      const endTime = performance.now()

      const duration = endTime - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(10)

      console.log(`  save() 執行時間: ${duration.toFixed(3)}ms`)
    })

    it('連續 100 次 save() 操作平均應該 < 10ms', () => {
      const data: LocalStorageData = {
        selectedCardId: '5',
        cardPoolIds: ['0', '5', '12', '18', '21'],
        timestamp: Date.now(),
      }

      const durations: number[] = []

      for (let i = 0; i < 100; i++) {
        const startTime = performance.now()
        quickReadingStorage.save(data)
        const endTime = performance.now()

        durations.push(endTime - startTime)
      }

      const avgDuration =
        durations.reduce((a, b) => a + b, 0) / durations.length
      const maxDuration = Math.max(...durations)
      const minDuration = Math.min(...durations)

      expect(avgDuration).toBeLessThan(10)

      console.log(`  100次 save() 平均執行時間: ${avgDuration.toFixed(3)}ms`)
      console.log(`  最快: ${minDuration.toFixed(3)}ms`)
      console.log(`  最慢: ${maxDuration.toFixed(3)}ms`)
    })

    it('大量資料 save() 操作應該 < 15ms', () => {
      // 創建較大的資料集（模擬極端情況）
      const data: LocalStorageData = {
        selectedCardId: '5'.repeat(100), // 模擬長 ID
        cardPoolIds: Array(50)
          .fill(0)
          .map((_, i) => `card-${i}`), // 50 張卡
        timestamp: Date.now(),
      }

      const startTime = performance.now()
      const result = quickReadingStorage.save(data)
      const endTime = performance.now()

      const duration = endTime - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(15) // 大量資料允許稍長

      console.log(`  大量資料 save() 執行時間: ${duration.toFixed(3)}ms`)
    })
  })

  describe('load() 效能測試', () => {
    beforeEach(() => {
      // 預先儲存資料
      const data: LocalStorageData = {
        selectedCardId: '5',
        cardPoolIds: ['0', '5', '12', '18', '21'],
        timestamp: Date.now(),
      }
      quickReadingStorage.save(data)
    })

    it('單次 load() 操作應該 < 20ms', () => {
      const startTime = performance.now()
      const result = quickReadingStorage.load()
      const endTime = performance.now()

      const duration = endTime - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(20)

      console.log(`  load() 執行時間: ${duration.toFixed(3)}ms`)
    })

    it('連續 100 次 load() 操作平均應該 < 20ms', () => {
      const durations: number[] = []

      for (let i = 0; i < 100; i++) {
        const startTime = performance.now()
        quickReadingStorage.load()
        const endTime = performance.now()

        durations.push(endTime - startTime)
      }

      const avgDuration =
        durations.reduce((a, b) => a + b, 0) / durations.length
      const maxDuration = Math.max(...durations)
      const minDuration = Math.min(...durations)

      expect(avgDuration).toBeLessThan(20)

      console.log(`  100次 load() 平均執行時間: ${avgDuration.toFixed(3)}ms`)
      console.log(`  最快: ${minDuration.toFixed(3)}ms`)
      console.log(`  最慢: ${maxDuration.toFixed(3)}ms`)
    })

    it('load() 操作在無資料時應該 < 5ms', () => {
      localStorage.clear()

      const startTime = performance.now()
      const result = quickReadingStorage.load()
      const endTime = performance.now()

      const duration = endTime - startTime

      expect(result.success).toBe(true)
      expect(result.value).toBeNull()
      expect(duration).toBeLessThan(5)

      console.log(`  無資料 load() 執行時間: ${duration.toFixed(3)}ms`)
    })
  })

  describe('驗證與反序列化效能測試', () => {
    it('JSON 解析應該 < 5ms', () => {
      const data: LocalStorageData = {
        selectedCardId: '5',
        cardPoolIds: ['0', '5', '12', '18', '21'],
        timestamp: Date.now(),
      }

      const jsonString = JSON.stringify(data)

      const startTime = performance.now()
      const parsed = JSON.parse(jsonString)
      const endTime = performance.now()

      const duration = endTime - startTime

      expect(parsed).toEqual(data)
      expect(duration).toBeLessThan(5)

      console.log(`  JSON 解析執行時間: ${duration.toFixed(3)}ms`)
    })

    it('資料驗證應該 < 5ms', () => {
      const data: LocalStorageData = {
        selectedCardId: '5',
        cardPoolIds: ['0', '5', '12', '18', '21'],
        timestamp: Date.now(),
      }

      const startTime = performance.now()

      // 模擬驗證邏輯
      const isValid =
        typeof data.selectedCardId === 'string' &&
        Array.isArray(data.cardPoolIds) &&
        data.cardPoolIds.length === 5 &&
        typeof data.timestamp === 'number'

      const endTime = performance.now()

      const duration = endTime - startTime

      expect(isValid).toBe(true)
      expect(duration).toBeLessThan(5)

      console.log(`  資料驗證執行時間: ${duration.toFixed(3)}ms`)
    })

    it('完整 load() + 驗證流程應該 < 25ms', () => {
      // 預先儲存
      const data: LocalStorageData = {
        selectedCardId: '5',
        cardPoolIds: ['0', '5', '12', '18', '21'],
        timestamp: Date.now(),
      }
      quickReadingStorage.save(data)

      const startTime = performance.now()

      // 模擬完整流程
      const result = quickReadingStorage.load()

      if (result.success && result.value) {
        // 驗證資料
        const isValid =
          typeof result.value.selectedCardId === 'string' &&
          Array.isArray(result.value.cardPoolIds) &&
          result.value.cardPoolIds.length === 5
      }

      const endTime = performance.now()

      const duration = endTime - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(25)

      console.log(`  完整流程執行時間: ${duration.toFixed(3)}ms`)
    })
  })

  describe('clear() 效能測試', () => {
    beforeEach(() => {
      const data: LocalStorageData = {
        selectedCardId: '5',
        cardPoolIds: ['0', '5', '12', '18', '21'],
        timestamp: Date.now(),
      }
      quickReadingStorage.save(data)
    })

    it('clear() 操作應該 < 5ms', () => {
      const startTime = performance.now()
      const result = quickReadingStorage.clear()
      const endTime = performance.now()

      const duration = endTime - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(5)

      console.log(`  clear() 執行時間: ${duration.toFixed(3)}ms`)
    })

    it('連續 100 次 clear() 操作平均應該 < 5ms', () => {
      const durations: number[] = []

      for (let i = 0; i < 100; i++) {
        // 重新儲存資料
        const data: LocalStorageData = {
          selectedCardId: `${i}`,
          cardPoolIds: ['0', '5', '12', '18', '21'],
          timestamp: Date.now(),
        }
        quickReadingStorage.save(data)

        const startTime = performance.now()
        quickReadingStorage.clear()
        const endTime = performance.now()

        durations.push(endTime - startTime)
      }

      const avgDuration =
        durations.reduce((a, b) => a + b, 0) / durations.length

      expect(avgDuration).toBeLessThan(5)

      console.log(`  100次 clear() 平均執行時間: ${avgDuration.toFixed(3)}ms`)
    })
  })

  describe('isAvailable() 效能測試', () => {
    it('isAvailable() 檢查應該 < 1ms', () => {
      const startTime = performance.now()
      const available = quickReadingStorage.isAvailable()
      const endTime = performance.now()

      const duration = endTime - startTime

      expect(available).toBe(true)
      expect(duration).toBeLessThan(1)

      console.log(`  isAvailable() 執行時間: ${duration.toFixed(3)}ms`)
    })
  })

  describe('綜合效能測試', () => {
    it('完整讀寫循環應該 < 35ms', () => {
      const data: LocalStorageData = {
        selectedCardId: '5',
        cardPoolIds: ['0', '5', '12', '18', '21'],
        timestamp: Date.now(),
      }

      const startTime = performance.now()

      // 1. Save
      const saveResult = quickReadingStorage.save(data)
      expect(saveResult.success).toBe(true)

      // 2. Load
      const loadResult = quickReadingStorage.load()
      expect(loadResult.success).toBe(true)

      // 3. Clear
      const clearResult = quickReadingStorage.clear()
      expect(clearResult.success).toBe(true)

      const endTime = performance.now()

      const duration = endTime - startTime

      expect(duration).toBeLessThan(35) // save(10) + load(20) + clear(5)

      console.log(`  完整讀寫循環執行時間: ${duration.toFixed(3)}ms`)
    })

    it('1000 次循環操作應該保持穩定效能', () => {
      const durations: number[] = []

      for (let i = 0; i < 1000; i++) {
        const data: LocalStorageData = {
          selectedCardId: `card-${i}`,
          cardPoolIds: Array(5)
            .fill(0)
            .map((_, j) => `${i}-${j}`),
          timestamp: Date.now(),
        }

        const startTime = performance.now()

        quickReadingStorage.save(data)
        quickReadingStorage.load()
        if (i % 10 === 0) {
          quickReadingStorage.clear()
        }

        const endTime = performance.now()

        durations.push(endTime - startTime)
      }

      const avgDuration =
        durations.reduce((a, b) => a + b, 0) / durations.length
      const maxDuration = Math.max(...durations)

      expect(avgDuration).toBeLessThan(35)
      expect(maxDuration).toBeLessThan(50) // 最慢的單次操作

      console.log(`  1000次循環平均執行時間: ${avgDuration.toFixed(3)}ms`)
      console.log(`  最慢單次操作: ${maxDuration.toFixed(3)}ms`)
    })
  })
})
