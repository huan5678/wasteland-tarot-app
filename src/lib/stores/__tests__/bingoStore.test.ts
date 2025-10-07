/**
 * Zustand BingoStore Tests
 * Tests for daily bingo check-in state management
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import {
  mockBingoStatus,
  mockBingoStatusNoCard,
  mockBingoStatusWithThreeLines,
  mockClaimResult,
  mockClaimResultWithReward,
  mockClaimResultAlreadyClaimed,
  mockBingoCard
} from '@/test/mocks/fixtures/bingoData'
import { bingoTestHelpers } from '@/test/mocks/handlers/bingo'

// Mock the actual store implementation
// This will need to be replaced with the actual import once implemented
interface BingoStore {
  // State
  dailyNumber: number | null
  userCard: number[][] | null
  claimedNumbers: Set<number>
  lineCount: number
  hasReward: boolean
  hasClaimedToday: boolean
  isLoading: boolean
  error: string | null

  // Actions
  fetchBingoStatus: () => Promise<void>
  createCard: (numbers: number[][]) => Promise<void>
  claimDailyNumber: () => Promise<void>
  checkLines: () => Promise<void>
  reset: () => void
}

// Mock implementation for testing
const createMockBingoStore = (): BingoStore => {
  let state = {
    dailyNumber: null as number | null,
    userCard: null as number[][] | null,
    claimedNumbers: new Set<number>(),
    lineCount: 0,
    hasReward: false,
    hasClaimedToday: false,
    isLoading: false,
    error: null as string | null
  }

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

  return {
    get dailyNumber() { return state.dailyNumber },
    get userCard() { return state.userCard },
    get claimedNumbers() { return state.claimedNumbers },
    get lineCount() { return state.lineCount },
    get hasReward() { return state.hasReward },
    get hasClaimedToday() { return state.hasClaimedToday },
    get isLoading() { return state.isLoading },
    get error() { return state.error },

    fetchBingoStatus: async () => {
      state.isLoading = true
      state.error = null

      try {
        const response = await fetch(`${API_BASE}/api/v1/bingo/status`, {
          headers: { Authorization: 'Bearer mock-token' }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch bingo status')
        }

        const data = await response.json()

        state.dailyNumber = data.daily_number
        state.userCard = data.card_data
        state.claimedNumbers = new Set(data.claimed_numbers)
        state.lineCount = data.line_count
        state.hasReward = data.has_reward
        state.hasClaimedToday = data.has_claimed_today
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Unknown error'
      } finally {
        state.isLoading = false
      }
    },

    createCard: async (numbers: number[][]) => {
      state.isLoading = true
      state.error = null

      try {
        const response = await fetch(`${API_BASE}/api/v1/bingo/card`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ numbers })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to create card')
        }

        const data = await response.json()
        state.userCard = data.card.card_data
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Unknown error'
        throw error
      } finally {
        state.isLoading = false
      }
    },

    claimDailyNumber: async () => {
      state.isLoading = true
      state.error = null

      try {
        const response = await fetch(`${API_BASE}/api/v1/bingo/claim`, {
          method: 'POST',
          headers: { Authorization: 'Bearer mock-token' }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to claim number')
        }

        const data = await response.json()

        if (data.success) {
          state.claimedNumbers.add(data.daily_number)
          state.lineCount = data.line_count
          state.hasReward = data.has_reward
          state.hasClaimedToday = true
        }
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Unknown error'
        throw error
      } finally {
        state.isLoading = false
      }
    },

    checkLines: async () => {
      state.isLoading = true
      state.error = null

      try {
        const response = await fetch(`${API_BASE}/api/v1/bingo/lines`, {
          headers: { Authorization: 'Bearer mock-token' }
        })

        if (!response.ok) {
          throw new Error('Failed to check lines')
        }

        const data = await response.json()
        state.lineCount = data.line_count
        state.hasReward = data.has_three_lines
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Unknown error'
      } finally {
        state.isLoading = false
      }
    },

    reset: () => {
      state = {
        dailyNumber: null,
        userCard: null,
        claimedNumbers: new Set<number>(),
        lineCount: 0,
        hasReward: false,
        hasClaimedToday: false,
        isLoading: false,
        error: null
      }
    }
  }
}

describe('BingoStore', () => {
  let useBingoStore: () => BingoStore

  beforeEach(() => {
    // Reset handlers and create new store instance
    bingoTestHelpers.reset()
    useBingoStore = createMockBingoStore
  })

  describe('Initial State', () => {
    it('應該有正確的初始狀態', () => {
      const store = useBingoStore()

      expect(store.dailyNumber).toBeNull()
      expect(store.userCard).toBeNull()
      expect(store.claimedNumbers.size).toBe(0)
      expect(store.lineCount).toBe(0)
      expect(store.hasReward).toBe(false)
      expect(store.hasClaimedToday).toBe(false)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchBingoStatus', () => {
    it('應該成功獲取賓果狀態', async () => {
      const store = useBingoStore()

      await act(async () => {
        await store.fetchBingoStatus()
      })

      expect(store.dailyNumber).toBe(mockBingoStatus.daily_number)
      expect(store.userCard).toEqual(mockBingoStatus.card_data)
      expect(store.claimedNumbers.size).toBe(mockBingoStatus.claimed_numbers.length)
      expect(store.lineCount).toBe(mockBingoStatus.line_count)
      expect(store.hasReward).toBe(mockBingoStatus.has_reward)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('應該處理無賓果卡的情況', async () => {
      bingoTestHelpers.setHasCard(false)
      const store = useBingoStore()

      await act(async () => {
        await store.fetchBingoStatus()
      })

      expect(store.userCard).toBeNull()
      expect(store.dailyNumber).toBe(mockBingoStatusNoCard.daily_number)
    })

    it('應該處理 API 錯誤', async () => {
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            { error: 'Server Error' },
            { status: 500 }
          )
        })
      )

      const store = useBingoStore()

      await act(async () => {
        await store.fetchBingoStatus()
      })

      expect(store.error).toBeTruthy()
      expect(store.isLoading).toBe(false)
    })

    it('應該在請求時設定 loading 狀態', async () => {
      const store = useBingoStore()

      let loadingDuringFetch = false

      const promise = act(async () => {
        const fetchPromise = store.fetchBingoStatus()
        loadingDuringFetch = store.isLoading
        await fetchPromise
      })

      await promise

      expect(loadingDuringFetch).toBe(true)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('createCard', () => {
    beforeEach(() => {
      bingoTestHelpers.setHasCard(false)
    })

    it('應該成功建立賓果卡', async () => {
      const store = useBingoStore()

      await act(async () => {
        await store.createCard(mockBingoCard)
      })

      expect(store.userCard).toEqual(mockBingoCard)
      expect(store.error).toBeNull()
    })

    it('應該驗證號碼數量', async () => {
      const store = useBingoStore()
      const invalidCard = [[1, 2, 3]] // 只有 3 個號碼

      await act(async () => {
        try {
          await store.createCard(invalidCard)
        } catch (error) {
          // Expected error
        }
      })

      expect(store.error).toBeTruthy()
      expect(store.error).toContain('25')
    })

    it('應該驗證號碼不重複', async () => {
      const store = useBingoStore()
      const duplicateCard = [
        [1, 1, 2, 3, 4],
        [5, 6, 7, 8, 9],
        [10, 11, 12, 13, 14],
        [15, 16, 17, 18, 19],
        [20, 21, 22, 23, 24]
      ]

      await act(async () => {
        try {
          await store.createCard(duplicateCard)
        } catch (error) {
          // Expected error
        }
      })

      expect(store.error).toBeTruthy()
      expect(store.error).toContain('重複')
    })

    it('應該驗證號碼範圍 1-25', async () => {
      const store = useBingoStore()
      const invalidRangeCard = [
        [0, 1, 2, 3, 4], // 0 is invalid
        [5, 6, 7, 8, 9],
        [10, 11, 12, 13, 14],
        [15, 16, 17, 18, 19],
        [20, 21, 22, 23, 24]
      ]

      await act(async () => {
        try {
          await store.createCard(invalidRangeCard)
        } catch (error) {
          // Expected error
        }
      })

      expect(store.error).toBeTruthy()
    })

    it('應該處理已存在賓果卡的錯誤', async () => {
      bingoTestHelpers.setHasCard(true)
      const store = useBingoStore()

      await act(async () => {
        try {
          await store.createCard(mockBingoCard)
        } catch (error) {
          // Expected error
        }
      })

      expect(store.error).toBeTruthy()
      expect(store.error).toContain('已設定')
    })
  })

  describe('claimDailyNumber', () => {
    beforeEach(() => {
      bingoTestHelpers.setHasCard(true)
      bingoTestHelpers.setHasClaimedToday(false)
    })

    it('應該成功領取每日號碼', async () => {
      const store = useBingoStore()

      await act(async () => {
        await store.claimDailyNumber()
      })

      expect(store.hasClaimedToday).toBe(true)
      expect(store.claimedNumbers.has(mockClaimResult.daily_number)).toBe(true)
      expect(store.lineCount).toBeGreaterThanOrEqual(0)
      expect(store.error).toBeNull()
    })

    it('應該處理達成三連線並獲得獎勵', async () => {
      const store = useBingoStore()

      // 設定已領取多個號碼，接近三連線
      bingoTestHelpers.setCurrentStatus(mockBingoStatusWithThreeLines)

      await act(async () => {
        await store.claimDailyNumber()
      })

      expect(store.lineCount).toBe(3)
      expect(store.hasReward).toBe(true)
    })

    it('應該處理已領取的錯誤', async () => {
      bingoTestHelpers.setHasClaimedToday(true)
      const store = useBingoStore()

      await act(async () => {
        try {
          await store.claimDailyNumber()
        } catch (error) {
          // Expected error
        }
      })

      expect(store.error).toBeTruthy()
      expect(store.error).toContain('已領取')
    })

    it('應該處理無賓果卡的錯誤', async () => {
      bingoTestHelpers.setHasCard(false)
      const store = useBingoStore()

      await act(async () => {
        try {
          await store.claimDailyNumber()
        } catch (error) {
          // Expected error
        }
      })

      expect(store.error).toBeTruthy()
    })
  })

  describe('checkLines', () => {
    it('應該成功檢查連線狀態', async () => {
      const store = useBingoStore()

      await act(async () => {
        await store.checkLines()
      })

      expect(store.lineCount).toBeGreaterThanOrEqual(0)
      expect(store.error).toBeNull()
    })

    it('應該處理三連線狀態', async () => {
      bingoTestHelpers.setCurrentStatus(mockBingoStatusWithThreeLines)
      const store = useBingoStore()

      await act(async () => {
        await store.checkLines()
      })

      expect(store.lineCount).toBe(3)
      expect(store.hasReward).toBe(true)
    })
  })

  describe('reset', () => {
    it('應該重置所有狀態', async () => {
      const store = useBingoStore()

      // 先設定一些狀態
      await act(async () => {
        await store.fetchBingoStatus()
      })

      expect(store.dailyNumber).not.toBeNull()

      // 重置
      act(() => {
        store.reset()
      })

      expect(store.dailyNumber).toBeNull()
      expect(store.userCard).toBeNull()
      expect(store.claimedNumbers.size).toBe(0)
      expect(store.lineCount).toBe(0)
      expect(store.hasReward).toBe(false)
      expect(store.hasClaimedToday).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('應該處理網路錯誤', async () => {
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.error()
        })
      )

      const store = useBingoStore()

      await act(async () => {
        await store.fetchBingoStatus()
      })

      expect(store.error).toBeTruthy()
    })

    it('應該處理未授權錯誤', async () => {
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            { error: 'UNAUTHORIZED', message: '未授權' },
            { status: 401 }
          )
        })
      )

      const store = useBingoStore()

      await act(async () => {
        await store.fetchBingoStatus()
      })

      expect(store.error).toBeTruthy()
    })
  })

  describe('Number Validation', () => {
    it('應該正確驗證有效的賓果卡號碼', () => {
      const validNumbers = mockBingoCard.flat()
      expect(validNumbers.length).toBe(25)
      expect(new Set(validNumbers).size).toBe(25)
      expect(validNumbers.every(n => n >= 1 && n <= 25)).toBe(true)
    })

    it('應該檢測重複號碼', () => {
      const duplicateNumbers = [1, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
      expect(new Set(duplicateNumbers).size).toBeLessThan(25)
    })

    it('應該檢測超出範圍的號碼', () => {
      const invalidNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
      expect(invalidNumbers.some(n => n < 1 || n > 25)).toBe(true)
    })
  })
})
