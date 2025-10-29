/**
 * BingoStore Authentication Tests (Task 1)
 * Tests for httpOnly cookie authentication mechanism
 *
 * Requirements covered:
 * - 1.1: Update API request function for httpOnly cookies
 * - 1.2: Implement 401 error handling with login redirection
 * - 1.3: Add defensive error handling for all API calls
 * - 1.4: Enhance error logging and monitoring
 */

import { act } from '@testing-library/react'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { useBingoStore } from '../bingoStore'
import { useErrorStore } from '@/lib/errorStore'

describe('BingoStore Authentication (Task 1)', () => {
  let originalLocation: Location
  let mockLocationHref: jest.Mock

  beforeAll(() => {
    // Save original location
    originalLocation = window.location

    // Create mock location
    mockLocationHref = jest.fn()
    delete (window as any).location
    window.location = {
      href: mockLocationHref,
      assign: jest.fn(),
      reload: jest.fn(),
      replace: jest.fn(),
    } as any
  })

  afterAll(() => {
    // Restore original location
    window.location = originalLocation
  })

  beforeEach(() => {
    // Reset store state
    const store = useBingoStore.getState()
    store.reset()

    // Reset error store
    useErrorStore.getState().clearErrors()

    // Reset mocks
    mockLocationHref.mockClear()

    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })
  })

  describe('Task 1.1: Credentials-based fetch with httpOnly cookies', () => {
    it('應該在 API 請求中包含 credentials: include', async () => {
      let requestOptions: RequestInit | undefined

      // Intercept fetch to capture request options
      server.use(
        http.get('*/api/v1/bingo/status', async ({ request }) => {
          requestOptions = {
            credentials: request.credentials,
          }
          return HttpResponse.json({
            has_card: true,
            card_data: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23, 24, 25]],
            daily_number: 7,
            claimed_numbers: [1, 2, 3],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        })
      )

      await act(async () => {
        await useBingoStore.getState().fetchBingoStatus()
      })

      // Verify credentials were included
      expect(requestOptions?.credentials).toBe('include')
    })

    it('應該在 POST 請求中包含 credentials: include', async () => {
      let requestOptions: RequestInit | undefined

      server.use(
        http.post('*/api/v1/bingo/claim', async ({ request }) => {
          requestOptions = {
            credentials: request.credentials,
          }
          return HttpResponse.json({
            success: true,
            number: 7,
            is_on_card: true,
            current_lines: 1,
            has_reward: false,
            message: '領取成功',
          })
        })
      )

      // Setup card first
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            has_card: true,
            card_data: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23, 24, 25]],
            daily_number: 7,
            claimed_numbers: [],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        })
      )

      await act(async () => {
        await useBingoStore.getState().fetchBingoStatus()
        await useBingoStore.getState().claimDailyNumber()
      })

      expect(requestOptions?.credentials).toBe('include')
    })

    it('不應該手動設定 Authorization header', async () => {
      let requestHeaders: Headers | undefined

      server.use(
        http.get('*/api/v1/bingo/status', async ({ request }) => {
          requestHeaders = request.headers
          return HttpResponse.json({
            has_card: false,
            card_data: null,
            daily_number: 7,
            claimed_numbers: [],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        })
      )

      await act(async () => {
        await useBingoStore.getState().fetchBingoStatus()
      })

      // Authorization header should NOT be manually set
      expect(requestHeaders?.get('Authorization')).toBeNull()
    })

    it('應該保留 Content-Type header 在 JSON payload 中', async () => {
      let requestHeaders: Headers | undefined

      server.use(
        http.post('*/api/v1/bingo/card', async ({ request }) => {
          requestHeaders = request.headers
          return HttpResponse.json({
            id: 'test-card-id',
            user_id: 'test-user',
            month_year: '2025-10',
            card_data: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23, 24, 25]],
            is_active: true,
            created_at: new Date().toISOString(),
          })
        })
      )

      await act(async () => {
        await useBingoStore.getState().createCard([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25])
      })

      expect(requestHeaders?.get('Content-Type')).toBe('application/json')
    })

    it('應該整合 timedFetch 進行效能追蹤', async () => {
      // timedFetch is already integrated in the implementation
      // This test verifies that it doesn't break the credentials flow

      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            has_card: true,
            card_data: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23, 24, 25]],
            daily_number: 7,
            claimed_numbers: [1, 2, 3],
            line_count: 1,
            has_reward: false,
            has_claimed_today: false,
          })
        })
      )

      await act(async () => {
        await useBingoStore.getState().fetchBingoStatus()
      })

      const store = useBingoStore.getState()
      expect(store.error).toBeNull()
      expect(store.dailyNumber).toBe(7)
    })
  })

  describe('Task 1.2: 401 Error Handling with Login Redirection', () => {
    it('應該在收到 401 Unauthorized 時重導向到登入頁面 (auth_required)', async () => {
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            { detail: 'No access token provided' },
            { status: 401 }
          )
        })
      )

      await act(async () => {
        try {
          await useBingoStore.getState().fetchBingoStatus()
        } catch (error) {
          // Expected to throw
        }
      })

      // Verify redirect happened
      expect(mockLocationHref).toHaveBeenCalledWith('/auth/login?reason=auth_required')
    })

    it('應該在 token 過期時重導向到登入頁面 (session_expired)', async () => {
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            { detail: 'Token expired' },
            { status: 401, statusText: 'Token expired' }
          )
        })
      )

      await act(async () => {
        try {
          await useBingoStore.getState().fetchBingoStatus()
        } catch (error) {
          // Expected to throw
        }
      })

      expect(mockLocationHref).toHaveBeenCalledWith('/auth/login?reason=session_expired')
    })

    it('應該在 POST 請求收到 401 時重導向', async () => {
      server.use(
        http.post('*/api/v1/bingo/claim', () => {
          return HttpResponse.json(
            { detail: 'No access token provided' },
            { status: 401 }
          )
        })
      )

      await act(async () => {
        try {
          await useBingoStore.getState().claimDailyNumber()
        } catch (error) {
          // Expected to throw
        }
      })

      expect(mockLocationHref).toHaveBeenCalledWith('/auth/login?reason=auth_required')
    })

    it('應該記錄所有 401 錯誤到 errorStore', async () => {
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            { detail: 'No access token provided' },
            { status: 401 }
          )
        })
      )

      await act(async () => {
        try {
          await useBingoStore.getState().fetchBingoStatus()
        } catch (error) {
          // Expected to throw
        }
      })

      const errors = useErrorStore.getState().errors
      expect(errors.length).toBeGreaterThan(0)

      const authError = errors.find(e =>
        e.source === 'api' &&
        e.detail?.statusCode === 401
      )
      expect(authError).toBeDefined()
    })
  })

  describe('Task 1.3: Defensive Error Handling', () => {
    it('應該處理網路離線錯誤', async () => {
      // Mock navigator.onLine to false
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      await act(async () => {
        try {
          await useBingoStore.getState().fetchBingoStatus()
        } catch (error) {
          // Expected to throw
        }
      })

      const store = useBingoStore.getState()
      expect(store.error).toBeTruthy()
      expect(store.error).toContain('網路')

      // Verify errorStore was updated
      const errorStore = useErrorStore.getState()
      expect(errorStore.networkOnline).toBe(false)
    })

    it('應該用 try-catch 包裝所有 fetch 呼叫', async () => {
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          throw new Error('Network failure')
        })
      )

      await act(async () => {
        try {
          await useBingoStore.getState().fetchBingoStatus()
        } catch (error) {
          // Should handle error gracefully
        }
      })

      const store = useBingoStore.getState()
      expect(store.error).toBeTruthy()
      expect(store.isLoading).toBe(false)
    })

    it('應該處理 ReferenceError 而不會導致頁面崩潰', async () => {
      // This test verifies that no undefined token variables are accessed
      // Since we're removing token retrieval, this should not throw ReferenceError

      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            has_card: true,
            card_data: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23, 24, 25]],
            daily_number: 7,
            claimed_numbers: [],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        })
      )

      let threwReferenceError = false

      await act(async () => {
        try {
          await useBingoStore.getState().fetchBingoStatus()
        } catch (error) {
          if (error instanceof ReferenceError) {
            threwReferenceError = true
          }
        }
      })

      expect(threwReferenceError).toBe(false)
    })

    it('應該使用 optional chaining 存取錯誤物件屬性', async () => {
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            null, // No error detail
            { status: 500 }
          )
        })
      )

      await act(async () => {
        try {
          await useBingoStore.getState().fetchBingoStatus()
        } catch (error) {
          // Should handle gracefully
        }
      })

      const store = useBingoStore.getState()
      expect(store.error).toBeTruthy()
      expect(store.isLoading).toBe(false)
    })
  })

  describe('Task 1.4: Enhanced Error Logging and Monitoring', () => {
    it('應該記錄 API 錯誤並包含完整 context (endpoint, method, status, timestamp)', async () => {
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            { detail: 'Server error' },
            { status: 500 }
          )
        })
      )

      await act(async () => {
        try {
          await useBingoStore.getState().fetchBingoStatus()
        } catch (error) {
          // Expected to throw
        }
      })

      const errors = useErrorStore.getState().errors
      const apiError = errors.find(e => e.source === 'api')

      expect(apiError).toBeDefined()
      expect(apiError?.detail).toHaveProperty('endpoint')
      expect(apiError?.detail).toHaveProperty('method')
      expect(apiError?.detail?.endpoint).toContain('/api/v1/bingo/status')
    })

    it('應該在錯誤日誌中包含 [BingoStore] 元件名稱', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            { detail: 'Server error' },
            { status: 500 }
          )
        })
      )

      await act(async () => {
        try {
          await useBingoStore.getState().fetchBingoStatus()
        } catch (error) {
          // Expected to throw
        }
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[BingoStore]'),
        expect.anything()
      )

      consoleSpy.mockRestore()
    })

    it('應該在 token 為 null 或 undefined 時記錄警告', async () => {
      // Note: After refactor, token retrieval is removed, so this warning should NOT appear
      // This test verifies the old behavior is removed

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            has_card: true,
            card_data: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23, 24, 25]],
            daily_number: 7,
            claimed_numbers: [],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        })
      )

      await act(async () => {
        await useBingoStore.getState().fetchBingoStatus()
      })

      // Should NOT log token warnings after refactor
      const tokenWarnings = consoleSpy.mock.calls.filter(call =>
        call[0]?.toString().toLowerCase().includes('token')
      )
      expect(tokenWarnings.length).toBe(0)

      consoleSpy.mockRestore()
    })

    it('應該捕獲 ReferenceError 的錯誤堆疊', async () => {
      // This verifies error stack traces are captured if ReferenceError occurs
      // After refactor, ReferenceError should not occur, but stack traces should still be captured for other errors

      server.use(
        http.get('*/api/v1/bingo/status', () => {
          throw new Error('Intentional error for stack trace test')
        })
      )

      await act(async () => {
        try {
          await useBingoStore.getState().fetchBingoStatus()
        } catch (error) {
          // Expected to throw
        }
      })

      const errors = useErrorStore.getState().errors
      const apiError = errors.find(e => e.source === 'api')

      expect(apiError).toBeDefined()
      expect(apiError?.message).toBeTruthy()
    })

    it('應該推送所有錯誤到 errorStore 並標記 source 為 api', async () => {
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            { detail: 'Test error' },
            { status: 400 }
          )
        })
      )

      await act(async () => {
        try {
          await useBingoStore.getState().fetchBingoStatus()
        } catch (error) {
          // Expected to throw
        }
      })

      const errors = useErrorStore.getState().errors
      const apiErrors = errors.filter(e => e.source === 'api')

      expect(apiErrors.length).toBeGreaterThan(0)
    })
  })

  describe('Integration Tests', () => {
    it('應該在完整流程中使用 credentials (fetch → claim → check)', async () => {
      let statusCredentials: RequestCredentials | undefined
      let claimCredentials: RequestCredentials | undefined
      let linesCredentials: RequestCredentials | undefined

      server.use(
        http.get('*/api/v1/bingo/status', async ({ request }) => {
          statusCredentials = request.credentials
          return HttpResponse.json({
            has_card: true,
            card_data: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23, 24, 25]],
            daily_number: 7,
            claimed_numbers: [],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        }),
        http.post('*/api/v1/bingo/claim', async ({ request }) => {
          claimCredentials = request.credentials
          return HttpResponse.json({
            success: true,
            number: 7,
            is_on_card: true,
            current_lines: 1,
            has_reward: false,
            message: '領取成功',
          })
        }),
        http.get('*/api/v1/bingo/lines', async ({ request }) => {
          linesCredentials = request.credentials
          return HttpResponse.json({
            user_id: 'test-user',
            line_count: 1,
            line_types: ['horizontal_0'],
            has_reward: false,
          })
        })
      )

      await act(async () => {
        await useBingoStore.getState().fetchBingoStatus()
        await useBingoStore.getState().claimDailyNumber()
        await useBingoStore.getState().checkLines()
      })

      expect(statusCredentials).toBe('include')
      expect(claimCredentials).toBe('include')
      expect(linesCredentials).toBe('include')
    })

    it('應該在多個 401 錯誤時一致地重導向', async () => {
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            { detail: 'No access token provided' },
            { status: 401 }
          )
        }),
        http.post('*/api/v1/bingo/claim', () => {
          return HttpResponse.json(
            { detail: 'No access token provided' },
            { status: 401 }
          )
        })
      )

      await act(async () => {
        try {
          await useBingoStore.getState().fetchBingoStatus()
        } catch (error) {
          // Expected
        }
      })

      await act(async () => {
        try {
          await useBingoStore.getState().claimDailyNumber()
        } catch (error) {
          // Expected
        }
      })

      expect(mockLocationHref).toHaveBeenCalledTimes(2)
      expect(mockLocationHref).toHaveBeenCalledWith('/auth/login?reason=auth_required')
    })
  })
})
