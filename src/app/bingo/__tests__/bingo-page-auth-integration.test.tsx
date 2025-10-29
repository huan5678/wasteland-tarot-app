/**
 * Bingo Page Authentication Integration Tests (Task 4.3)
 *
 * Tests complete authentication flow for Bingo page:
 * - Page load with valid httpOnly cookie
 * - Redirect when no cookie
 * - Redirect when expired cookie (401)
 * - Daily number claim succeeds
 * - Offline error display and retry
 *
 * Requirements covered: 10.2, 10.3, 10.4
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import BingoPage from '../page'
import { useAuthStore } from '@/lib/authStore'
import { useBingoStore } from '@/lib/stores/bingoStore'

// Mock Next.js router
const mockPush = jest.fn()
const mockRouter = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

describe('Bingo Page Authentication Integration (Task 4.3)', () => {
  let originalLocation: Location | undefined
  let mockLocationHref: string

  beforeAll(() => {
    // Setup window location mock if in browser environment
    if (typeof window !== 'undefined') {
      originalLocation = window.location
      delete (window as any).location
      window.location = {
        ...originalLocation,
        href: 'http://localhost:3000/bingo',
      } as any

      Object.defineProperty(window.location, 'href', {
        writable: true,
        value: 'http://localhost:3000/bingo',
      })
    }
  })

  afterAll(() => {
    // Restore window location
    if (typeof window !== 'undefined' && originalLocation) {
      window.location = originalLocation
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockLocationHref = 'http://localhost:3000/bingo'

    // Reset stores
    useAuthStore.getState().setUser(null)
    useAuthStore.setState({ isInitialized: true })
    useBingoStore.getState().reset()

    // Mock navigator.onLine
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true,
      })
    }
  })

  describe('Subtask 4.3.1: Successful page load with valid httpOnly cookie', () => {
    it('should load page successfully with valid authentication', async () => {
      // Mock authenticated user
      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      // Mock successful bingo status API
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            has_card: true,
            card_data: [
              [1, 2, 3, 4, 5],
              [6, 7, 8, 9, 10],
              [11, 12, 13, 14, 15],
              [16, 17, 18, 19, 20],
              [21, 22, 23, 24, 25],
            ],
            daily_number: 7,
            claimed_numbers: [1, 2, 3],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        })
      )

      render(<BingoPage />)

      // Wait for data to load
      await waitFor(() => {
        expect(useBingoStore.getState().hasCard).toBe(true)
      })

      // Verify page displays bingo card
      expect(useBingoStore.getState().userCard).toBeTruthy()
      expect(useBingoStore.getState().dailyNumber).toBe(7)
      expect(useBingoStore.getState().isLoading).toBe(false)
      expect(useBingoStore.getState().error).toBeNull()
    })

    it('should display bingo grid with correct data', async () => {
      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            has_card: true,
            card_data: [
              [1, 2, 3, 4, 5],
              [6, 7, 8, 9, 10],
              [11, 12, 13, 14, 15],
              [16, 17, 18, 19, 20],
              [21, 22, 23, 24, 25],
            ],
            daily_number: 15,
            claimed_numbers: [1, 2, 15],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        })
      )

      render(<BingoPage />)

      await waitFor(() => {
        expect(useBingoStore.getState().hasCard).toBe(true)
      })

      // Verify claimed numbers are stored
      const claimedNumbers = useBingoStore.getState().claimedNumbers
      expect(claimedNumbers.size).toBe(3)
      expect(claimedNumbers.has(1)).toBe(true)
      expect(claimedNumbers.has(2)).toBe(true)
      expect(claimedNumbers.has(15)).toBe(true)
    })
  })

  describe('Subtask 4.3.2: Redirect when no httpOnly cookie', () => {
    it('should redirect to login when user is not authenticated', async () => {
      // Mock unauthenticated state
      useAuthStore.getState().setUser(null)

      render(<BingoPage />)

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('should not fetch bingo data when unauthenticated', async () => {
      useAuthStore.getState().setUser(null)

      const fetchSpy = jest.spyOn(useBingoStore.getState(), 'fetchBingoStatus')

      render(<BingoPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })

      // Should not attempt to fetch data
      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  describe('Subtask 4.3.3: Redirect when expired cookie (401)', () => {
    it('should redirect to login when API returns 401', async () => {
      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      // Mock 401 response
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            { detail: 'Token expired' },
            { status: 401, statusText: 'Token expired' }
          )
        })
      )

      // Mock window.location.href setter
      if (typeof window !== 'undefined') {
        Object.defineProperty(window.location, 'href', {
          writable: true,
          value: 'http://localhost:3000/bingo',
        })
      }

      render(<BingoPage />)

      await waitFor(() => {
        // Verify redirect happened
        if (typeof window !== 'undefined') {
          expect(window.location.href).toContain('/auth/login?reason=session_expired')
        }
      }, { timeout: 5000 })
    })

    it('should handle 401 with missing token reason', async () => {
      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            { detail: 'No access token provided' },
            { status: 401 }
          )
        })
      )

      render(<BingoPage />)

      await waitFor(() => {
        if (typeof window !== 'undefined') {
          expect(window.location.href).toContain('/auth/login?reason=auth_required')
        }
      }, { timeout: 5000 })
    })
  })

  describe('Subtask 4.3.4: Daily number claim succeeds', () => {
    it('should successfully claim daily number with valid authentication', async () => {
      const user = userEvent.setup()

      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      // Mock initial status - has card, not claimed today
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            has_card: true,
            card_data: [
              [1, 2, 3, 4, 5],
              [6, 7, 8, 9, 10],
              [11, 12, 13, 14, 15],
              [16, 17, 18, 19, 20],
              [21, 22, 23, 24, 25],
            ],
            daily_number: 7,
            claimed_numbers: [],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        }),
        http.post('*/api/v1/bingo/claim', () => {
          return HttpResponse.json({
            success: true,
            number: 7,
            is_on_card: true,
            current_lines: 0,
            has_reward: false,
            message: '領取成功！',
          })
        })
      )

      render(<BingoPage />)

      // Wait for page to load
      await waitFor(() => {
        expect(useBingoStore.getState().hasCard).toBe(true)
      })

      // Claim daily number
      await act(async () => {
        await useBingoStore.getState().claimDailyNumber()
      })

      // Verify claim succeeded
      await waitFor(() => {
        expect(useBingoStore.getState().hasClaimed).toBe(true)
        expect(useBingoStore.getState().claimedNumbers.has(7)).toBe(true)
      })
    })

    it('should handle already claimed error (409)', async () => {
      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            has_card: true,
            card_data: [
              [1, 2, 3, 4, 5],
              [6, 7, 8, 9, 10],
              [11, 12, 13, 14, 15],
              [16, 17, 18, 19, 20],
              [21, 22, 23, 24, 25],
            ],
            daily_number: 7,
            claimed_numbers: [7],
            line_count: 0,
            has_reward: false,
            has_claimed_today: true,
          })
        }),
        http.post('*/api/v1/bingo/claim', () => {
          return HttpResponse.json(
            { detail: '今日已領取' },
            { status: 409 }
          )
        })
      )

      render(<BingoPage />)

      await waitFor(() => {
        expect(useBingoStore.getState().hasCard).toBe(true)
      })

      // Try to claim (should fail)
      await act(async () => {
        try {
          await useBingoStore.getState().claimDailyNumber()
        } catch (error) {
          // Expected to throw
        }
      })

      // Verify error is displayed
      expect(useBingoStore.getState().error).toBeTruthy()
    })
  })

  describe('Subtask 4.3.5: Offline error display and retry', () => {
    it('should display offline error when network is unavailable', async () => {
      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      // Mock offline state
      if (typeof navigator !== 'undefined') {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        })
      }

      render(<BingoPage />)

      await act(async () => {
        try {
          await useBingoStore.getState().fetchBingoStatus()
        } catch (error) {
          // Expected to throw
        }
      })

      // Verify offline error
      await waitFor(() => {
        expect(useBingoStore.getState().error).toContain('網路')
      })
    })

    it('should allow retry when connection is restored', async () => {
      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      // Start offline
      if (typeof navigator !== 'undefined') {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        })
      }

      render(<BingoPage />)

      // Attempt to fetch (should fail)
      await act(async () => {
        try {
          await useBingoStore.getState().fetchBingoStatus()
        } catch (error) {
          // Expected
        }
      })

      expect(useBingoStore.getState().error).toBeTruthy()

      // Go back online
      if (typeof navigator !== 'undefined') {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true,
        })
      }

      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            has_card: true,
            card_data: [
              [1, 2, 3, 4, 5],
              [6, 7, 8, 9, 10],
              [11, 12, 13, 14, 15],
              [16, 17, 18, 19, 20],
              [21, 22, 23, 24, 25],
            ],
            daily_number: 10,
            claimed_numbers: [],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        })
      )

      // Retry fetch
      await act(async () => {
        await useBingoStore.getState().fetchBingoStatus()
      })

      // Verify success
      await waitFor(() => {
        expect(useBingoStore.getState().hasCard).toBe(true)
        expect(useBingoStore.getState().error).toBeNull()
      })
    })
  })

  describe('Integration: Complete user flow', () => {
    it('should handle full authenticated flow: load → claim → check lines', async () => {
      useAuthStore.getState().setUser({
        id: 'test-user-123',
        email: 'test@example.com',
        username: 'TestUser',
      })

      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            has_card: true,
            card_data: [
              [1, 2, 3, 4, 5],
              [6, 7, 8, 9, 10],
              [11, 12, 13, 14, 15],
              [16, 17, 18, 19, 20],
              [21, 22, 23, 24, 25],
            ],
            daily_number: 5,
            claimed_numbers: [1, 2, 3, 4],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        }),
        http.post('*/api/v1/bingo/claim', () => {
          return HttpResponse.json({
            success: true,
            number: 5,
            is_on_card: true,
            current_lines: 1,
            has_reward: false,
            message: '領取成功！你完成了一條連線！',
          })
        }),
        http.get('*/api/v1/bingo/lines', () => {
          return HttpResponse.json({
            user_id: 'test-user-123',
            line_count: 1,
            line_types: ['horizontal_0'],
            has_reward: false,
          })
        })
      )

      render(<BingoPage />)

      // 1. Load page
      await waitFor(() => {
        expect(useBingoStore.getState().hasCard).toBe(true)
      })

      // 2. Claim daily number
      await act(async () => {
        await useBingoStore.getState().claimDailyNumber()
      })

      await waitFor(() => {
        expect(useBingoStore.getState().hasClaimed).toBe(true)
      })

      // 3. Check lines
      await act(async () => {
        await useBingoStore.getState().checkLines()
      })

      await waitFor(() => {
        expect(useBingoStore.getState().lineCount).toBe(1)
      })
    })
  })
})
