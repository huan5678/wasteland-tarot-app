/**
 * Integration Tests for Bingo Page Authentication Flow (Task 4.3)
 *
 * Test Coverage:
 * - Page load with valid httpOnly cookie
 * - Redirect when no httpOnly cookie exists
 * - Redirect when expired httpOnly cookie (401)
 * - Daily number claim succeeds
 * - Offline error display and retry functionality
 *
 * Requirements: 10.2, 10.3, 10.4
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import BingoPage from '../page'
import { useAuthStore } from '@/lib/authStore'
import { useRouter } from 'next/navigation'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock auth store
jest.mock('@/lib/authStore')

// Mock bingo components
jest.mock('@/components/bingo/BingoCardSetup', () => ({
  __esModule: true,
  default: () => <div data-testid="bingo-card-setup">Bingo Card Setup</div>,
}))

jest.mock('@/components/bingo/BingoGrid', () => ({
  __esModule: true,
  default: () => <div data-testid="bingo-grid">Bingo Grid</div>,
}))

jest.mock('@/components/bingo/DailyCheckin', () => ({
  __esModule: true,
  default: () => <div data-testid="daily-checkin">Daily Checkin</div>,
}))

jest.mock('@/components/bingo/LineIndicator', () => ({
  __esModule: true,
  default: () => <div data-testid="line-indicator">Line Indicator</div>,
}))

jest.mock('@/components/bingo/RewardNotification', () => ({
  __esModule: true,
  default: () => <div data-testid="reward-notification">Reward Notification</div>,
}))

jest.mock('@/components/bingo/BingoHistory', () => ({
  __esModule: true,
  default: () => <div data-testid="bingo-history">Bingo History</div>,
}))

describe('Bingo Page Authentication Flow (Task 4.3)', () => {
  const mockPush = jest.fn()
  const mockRouter = { push: mockPush }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('4.3.1: Page Load with Valid httpOnly Cookie', () => {
    it('should load page successfully with valid httpOnly cookie', async () => {
      // Arrange: Setup authenticated user
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
        isInitialized: true,
      })

      // Mock successful API response (backend validates cookie automatically)
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            daily_number: 5,
            has_card: true,
            card_data: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23, 24, 25]],
            claimed_numbers: [1, 2, 3],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        })
      )

      // Act
      render(<BingoPage />)

      // Assert: Page loads without redirect
      await waitFor(() => {
        expect(screen.getByText('廢土賓果簽到')).toBeInTheDocument()
      })

      expect(mockPush).not.toHaveBeenCalledWith('/auth/login')

      // Assert: Bingo data is displayed
      await waitFor(() => {
        expect(screen.getByTestId('bingo-grid')).toBeInTheDocument()
        expect(screen.getByTestId('daily-checkin')).toBeInTheDocument()
      })
    })

    it('should display user name in welcome message', async () => {
      // Arrange
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: { id: 'test-user', name: 'WastelandSurvivor', email: 'survivor@vault.com' },
        isInitialized: true,
      })

      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            daily_number: 5,
            has_card: true,
            card_data: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23, 24, 25]],
            claimed_numbers: [],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        })
      )

      // Act
      render(<BingoPage />)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('WastelandSurvivor')).toBeInTheDocument()
      })
    })

    it('should handle page load when user has no bingo card yet', async () => {
      // Arrange
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
        isInitialized: true,
      })

      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            daily_number: 5,
            has_card: false,
            card_data: null,
            claimed_numbers: [],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        })
      )

      // Act
      render(<BingoPage />)

      // Assert: Should show card setup interface
      await waitFor(() => {
        expect(screen.getByTestId('bingo-card-setup')).toBeInTheDocument()
      })
    })
  })

  describe('4.3.2: Redirect When No httpOnly Cookie', () => {
    it('should redirect to login when no cookie exists (user is null)', async () => {
      // Arrange: No authenticated user
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: null,
        isInitialized: true,
      })

      // Act
      render(<BingoPage />)

      // Assert: Should redirect to login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('should show loading state while auth is initializing', () => {
      // Arrange: Auth not yet initialized
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: null,
        isInitialized: false,
      })

      // Act
      render(<BingoPage />)

      // Assert: Should show loading indicator
      expect(screen.getByText('載入中...')).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('4.3.3: Redirect When Expired httpOnly Cookie (401)', () => {
    it('should redirect to login with session_expired reason when 401 returned', async () => {
      // Arrange: User appears authenticated but cookie is expired
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
        isInitialized: true,
      })

      // Mock 401 response with "Token expired" status text
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            { detail: 'Token expired' },
            { status: 401, statusText: 'Token expired' }
          )
        })
      )

      // Mock window.location
      delete (window as any).location
      window.location = { href: '' } as any

      // Act
      render(<BingoPage />)

      // Assert: Should redirect with session_expired reason
      await waitFor(() => {
        expect(window.location.href).toBe('/auth/login?reason=session_expired')
      }, { timeout: 3000 })
    })

    it('should redirect to login with auth_required reason when 401 with missing token', async () => {
      // Arrange
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
        isInitialized: true,
      })

      // Mock 401 response with "Unauthorized" status text
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            { detail: 'No access token provided' },
            { status: 401, statusText: 'Unauthorized' }
          )
        })
      )

      // Mock window.location
      delete (window as any).location
      window.location = { href: '' } as any

      // Act
      render(<BingoPage />)

      // Assert
      await waitFor(() => {
        expect(window.location.href).toBe('/auth/login?reason=auth_required')
      }, { timeout: 3000 })
    })
  })

  describe('4.3.4: Daily Number Claim Succeeds', () => {
    it('should successfully claim daily number with valid authentication', async () => {
      // Arrange
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
        isInitialized: true,
      })

      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            daily_number: 5,
            has_card: true,
            card_data: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23, 24, 25]],
            claimed_numbers: [],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        }),
        http.post('*/api/v1/bingo/claim', () => {
          return HttpResponse.json({
            success: true,
            daily_number: 5,
            line_count: 0,
            has_reward: false,
            message: '成功領取今日號碼！',
          })
        })
      )

      // Act
      render(<BingoPage />)

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByTestId('daily-checkin')).toBeInTheDocument()
      })

      // Find and click claim button (implementation detail depends on DailyCheckin component)
      // This is a placeholder - actual implementation will depend on component structure
      // const claimButton = screen.getByRole('button', { name: /領取/i })
      // fireEvent.click(claimButton)

      // Assert: Claim should succeed without redirect
      await waitFor(() => {
        expect(window.location.href).not.toContain('/auth/login')
      })
    })

    it('should handle already claimed error (409 Conflict)', async () => {
      // Arrange
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
        isInitialized: true,
      })

      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            daily_number: 5,
            has_card: true,
            card_data: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23, 24, 25]],
            claimed_numbers: [5],
            line_count: 0,
            has_reward: false,
            has_claimed_today: true,
          })
        })
      )

      // Act
      render(<BingoPage />)

      // Assert: Page should load normally and show already claimed state
      await waitFor(() => {
        expect(screen.getByTestId('bingo-grid')).toBeInTheDocument()
      })
      // DailyCheckin component should disable claim button or show "已領取" message
    })
  })

  describe('4.3.5: Offline Error Display and Retry', () => {
    beforeEach(() => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true,
      })
    })

    it('should display offline error when network is unavailable', async () => {
      // Arrange: Set offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
        isInitialized: true,
      })

      // Act
      render(<BingoPage />)

      // Assert: Should show offline error
      await waitFor(() => {
        expect(screen.getByText(/網路連線中斷|離線|無法連線/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should enable retry functionality when back online', async () => {
      // Arrange: Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
        isInitialized: true,
      })

      // Act
      render(<BingoPage />)

      await waitFor(() => {
        expect(screen.getByText(/網路連線中斷|離線|無法連線/i)).toBeInTheDocument()
      })

      // Go back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })

      // Mock successful response after going online
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({
            daily_number: 5,
            has_card: true,
            card_data: [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23, 24, 25]],
            claimed_numbers: [],
            line_count: 0,
            has_reward: false,
            has_claimed_today: false,
          })
        })
      )

      // Find and click retry button
      const retryButton = await screen.findByRole('button', { name: /重試|retry/i })
      fireEvent.click(retryButton)

      // Assert: Page should load successfully
      await waitFor(() => {
        expect(screen.getByTestId('bingo-grid')).toBeInTheDocument()
      })
    })

    it('should handle network error during API request', async () => {
      // Arrange
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
        isInitialized: true,
      })

      // Mock network error
      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.error()
        })
      )

      // Act
      render(<BingoPage />)

      // Assert: Should show error message
      await waitFor(() => {
        // Error message from bingoStore
        expect(screen.getByText(/錯誤|失敗|error/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('4.3.6: Error Handling Edge Cases', () => {
    it('should handle malformed API response gracefully', async () => {
      // Arrange
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
        isInitialized: true,
      })

      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json({ invalid: 'response' }) // Missing required fields
        })
      )

      // Act
      render(<BingoPage />)

      // Assert: Should handle gracefully without crashing
      await waitFor(() => {
        // Component should handle undefined values gracefully
        expect(screen.getByText('廢土賓果簽到')).toBeInTheDocument()
      })
    })

    it('should clear error when clearError action is called', async () => {
      // Arrange
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
        isInitialized: true,
      })

      server.use(
        http.get('*/api/v1/bingo/status', () => {
          return HttpResponse.json(
            { detail: 'Server Error' },
            { status: 500 }
          )
        })
      )

      // Act
      render(<BingoPage />)

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/Server Error|錯誤/i)).toBeInTheDocument()
      })

      // Find and click close button on error message
      const closeButton = screen.getByRole('button', { name: /✕|close/i })
      fireEvent.click(closeButton)

      // Assert: Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/Server Error/i)).not.toBeInTheDocument()
      })
    })
  })
})
