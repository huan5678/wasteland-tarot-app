import { renderHook, act, waitFor } from '@testing-library/react'
import { useAchievementStore } from '../achievementStore'
import { useErrorStore } from '@/lib/errorStore'
import * as metricsModule from '@/lib/metrics'

// Mock dependencies
jest.mock('@/lib/errorStore', () => ({
  useErrorStore: {
    getState: jest.fn(),
  },
}))

jest.mock('@/lib/metrics', () => ({
  timedFetch: jest.fn(),
}))

describe('AchievementStore - Authentication Mechanism (Task 2)', () => {
  // Mock implementations
  const mockPushError = jest.fn()
  const mockSetNetworkOnline = jest.fn()

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Setup error store mocks
    ;(useErrorStore.getState as jest.Mock).mockReturnValue({
      pushError: mockPushError,
      setNetworkOnline: mockSetNetworkOnline,
    })

    // Setup metrics mock
    ;(metricsModule.timedFetch as jest.Mock).mockClear()

    // Mock window.location (check if exists first for test environment)
    if (typeof window !== 'undefined') {
      delete (window as any).location
      window.location = { href: '' } as any
    }

    // Mock navigator.onLine (check if exists first)
    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true,
      })
    }

    // Reset store state
    const { result} = renderHook(() => useAchievementStore())
    act(() => {
      result.current.reset()
    })
  })

  describe('Subtask 2.1: API Request with httpOnly Cookies', () => {
    it('should use credentials: "include" in fetch calls', async () => {
      // Arrange
      ;(metricsModule.timedFetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          achievements: [],
          total: 0,
          category_filter: null,
        }),
      })

      const { result } = renderHook(() => useAchievementStore())

      // Act
      await act(async () => {
        await result.current.fetchAchievements()
      })

      // Assert
      expect(metricsModule.timedFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include',
        })
      )
    })

    it('should NOT include Authorization header in requests', async () => {
      // Arrange
      ;(metricsModule.timedFetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: 'test-user',
          total_achievements: 0,
          unlocked_count: 0,
          claimed_count: 0,
          in_progress_count: 0,
          completion_percentage: 0,
          achievements: [],
        }),
      })

      const { result } = renderHook(() => useAchievementStore())

      // Act
      await act(async () => {
        await result.current.fetchUserProgress()
      })

      // Assert
      const callHeaders = metricsModule.timedFetch.mock.calls[0][1].headers
      expect(callHeaders).not.toHaveProperty('Authorization')
    })

    it('should preserve Content-Type header for JSON payloads', async () => {
      // Arrange
      metricsModule.timedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          achievement_code: 'FIRST_READING',
          rewards: { karma: 10 },
          message: 'Reward claimed',
          claimed_at: '2025-10-29T00:00:00Z',
        }),
      })

      const { result } = renderHook(() => useAchievementStore())

      // Act
      await act(async () => {
        await result.current.claimReward('FIRST_READING')
      })

      // Assert
      const callHeaders = metricsModule.timedFetch.mock.calls[0][1].headers
      expect(callHeaders).toHaveProperty('Content-Type', 'application/json')
    })

    it('should maintain network check integration', async () => {
      // Arrange
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      const { result } = renderHook(() => useAchievementStore())

      // Act & Assert
      await act(async () => {
        await expect(result.current.fetchAchievements()).rejects.toThrow('網路連線中斷')
      })

      expect(mockSetNetworkOnline).toHaveBeenCalledWith(false)
    })

    it('should integrate with timedFetch for performance tracking', async () => {
      // Arrange
      metricsModule.timedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          achievements: [],
          total: 0,
          category_filter: null,
        }),
      })

      const { result } = renderHook(() => useAchievementStore())

      // Act
      await act(async () => {
        await result.current.fetchAchievements()
      })

      // Assert
      expect(metricsModule.timedFetch).toHaveBeenCalled()
    })
  })

  describe('Subtask 2.2: 401 Error Handling with Login Redirection', () => {
    it('should detect 401 Unauthorized responses', async () => {
      // Arrange
      metricsModule.timedFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'No access token provided' }),
      })

      const { result } = renderHook(() => useAchievementStore())

      // Act & Assert
      await act(async () => {
        await expect(result.current.fetchUserProgress()).rejects.toThrow()
      })

      expect(window.location.href).toContain('/auth/login')
    })

    it('should redirect to login with reason=auth_required when token is missing', async () => {
      // Arrange
      metricsModule.timedFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'No access token provided' }),
      })

      const { result } = renderHook(() => useAchievementStore())

      // Act
      await act(async () => {
        await result.current.fetchSummary().catch(() => {})
      })

      // Assert
      expect(window.location.href).toBe('/auth/login?reason=auth_required')
    })

    it('should redirect to login with reason=session_expired when token is expired', async () => {
      // Arrange
      metricsModule.timedFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Token expired',
        json: async () => ({ detail: 'Token expired' }),
      })

      const { result } = renderHook(() => useAchievementStore())

      // Act
      await act(async () => {
        await result.current.claimReward('TEST_CODE').catch(() => {})
      })

      // Assert
      expect(window.location.href).toBe('/auth/login?reason=session_expired')
    })

    it('should log 401 errors to errorStore with full context', async () => {
      // Arrange
      metricsModule.timedFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'No access token provided' }),
      })

      const { result } = renderHook(() => useAchievementStore())

      // Act
      await act(async () => {
        await result.current.fetchAchievements().catch(() => {})
      })

      // Assert
      expect(mockPushError).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'api',
          message: '認證失敗',
          detail: expect.objectContaining({
            statusCode: 401,
            reason: 'auth_required',
            endpoint: expect.stringContaining('/api/v1/achievements'),
          }),
        })
      )
    })
  })

  describe('Subtask 2.3: Defensive Error Handling', () => {
    it('should wrap fetch calls in try-catch blocks', async () => {
      // Arrange
      metricsModule.timedFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useAchievementStore())

      // Act & Assert
      await act(async () => {
        await expect(result.current.fetchUserProgress()).rejects.toThrow()
      })

      // Should not crash, error is handled
      expect(result.current.error).toBeTruthy()
    })

    it('should handle network offline errors', async () => {
      // Arrange
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      const { result } = renderHook(() => useAchievementStore())

      // Act
      await act(async () => {
        await result.current.fetchSummary().catch(() => {})
      })

      // Assert
      expect(mockSetNetworkOnline).toHaveBeenCalledWith(false)
      expect(result.current.error).toContain('網路連線中斷')
    })

    it('should catch ReferenceError for undefined token variables', async () => {
      // Arrange
      metricsModule.timedFetch.mockImplementationOnce(() => {
        throw new ReferenceError('token is not defined')
      })

      const { result } = renderHook(() => useAchievementStore())

      // Act
      await act(async () => {
        await result.current.claimReward('TEST').catch(() => {})
      })

      // Assert
      expect(mockPushError).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'api',
          message: expect.stringContaining('token is not defined'),
        })
      )
    })

    it('should use optional chaining for error object properties', async () => {
      // Arrange
      metricsModule.timedFetch.mockRejectedValueOnce(null) // null error

      const { result } = renderHook(() => useAchievementStore())

      // Act & Assert - should not crash when accessing null.message
      await act(async () => {
        await result.current.fetchAchievements().catch(() => {})
      })

      expect(result.current.error).toBeTruthy()
    })

    it('should handle malformed error responses gracefully', async () => {
      // Arrange
      metricsModule.timedFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      const { result } = renderHook(() => useAchievementStore())

      // Act
      await act(async () => {
        await result.current.fetchUserProgress().catch(() => {})
      })

      // Assert - should fall back to default error message
      expect(result.current.error).toBeTruthy()
    })
  })

  describe('Subtask 2.4: Enhanced Error Logging', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    beforeEach(() => {
      consoleErrorSpy.mockClear()
    })

    afterAll(() => {
      consoleErrorSpy.mockRestore()
    })

    it('should log API errors with full context', async () => {
      // Arrange
      metricsModule.timedFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ detail: 'Server error' }),
      })

      const { result } = renderHook(() => useAchievementStore())

      // Act
      await act(async () => {
        await result.current.fetchAchievements().catch(() => {})
      })

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AchievementStore]'),
        expect.objectContaining({
          endpoint: expect.any(String),
          method: expect.any(String),
          timestamp: expect.any(String),
        })
      )
    })

    it('should include component name [AchievementStore] in logs', async () => {
      // Arrange
      metricsModule.timedFetch.mockRejectedValueOnce(new Error('Test error'))

      const { result } = renderHook(() => useAchievementStore())

      // Act
      await act(async () => {
        await result.current.fetchSummary().catch(() => {})
      })

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AchievementStore]'),
        expect.any(Object)
      )
    })

    it('should capture error stack traces', async () => {
      // Arrange
      const testError = new Error('Test error with stack')
      metricsModule.timedFetch.mockRejectedValueOnce(testError)

      const { result } = renderHook(() => useAchievementStore())

      // Act
      await act(async () => {
        await result.current.claimReward('TEST').catch(() => {})
      })

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          stack: expect.any(String),
        })
      )
    })

    it('should push all errors to errorStore with source "api"', async () => {
      // Arrange
      metricsModule.timedFetch.mockRejectedValueOnce(new Error('API failure'))

      const { result } = renderHook(() => useAchievementStore())

      // Act
      await act(async () => {
        await result.current.fetchUserProgress().catch(() => {})
      })

      // Assert
      expect(mockPushError).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'api',
        })
      )
    })

    it('should log method and status code for HTTP errors', async () => {
      // Arrange
      metricsModule.timedFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: 'Achievement not found' }),
      })

      const { result } = renderHook(() => useAchievementStore())

      // Act
      await act(async () => {
        await result.current.claimReward('INVALID_CODE').catch(() => {})
      })

      // Assert
      expect(mockPushError).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            method: 'POST',
            statusCode: 404,
          }),
        })
      )
    })
  })

  describe('Legacy Code Removal Verification', () => {
    it('should not have getAuthToken function', () => {
      // This test verifies the function was removed
      // The achievementStore module should not export or reference getAuthToken
      const storeCode = require('fs').readFileSync(
        require.resolve('../achievementStore'),
        'utf-8'
      )

      expect(storeCode).not.toContain('getAuthToken')
    })

    it('should not have createAuthHeaders function', () => {
      const storeCode = require('fs').readFileSync(
        require.resolve('../achievementStore'),
        'utf-8'
      )

      expect(storeCode).not.toContain('createAuthHeaders')
    })

    it('should not access localStorage for pip-boy-token', () => {
      const storeCode = require('fs').readFileSync(
        require.resolve('../achievementStore'),
        'utf-8'
      )

      expect(storeCode).not.toContain("localStorage.getItem('pip-boy-token')")
    })

    it('should not construct Authorization headers manually', () => {
      const storeCode = require('fs').readFileSync(
        require.resolve('../achievementStore'),
        'utf-8'
      )

      // Should not have manual Authorization header construction pattern
      expect(storeCode).not.toMatch(/Authorization.*Bearer/)
    })
  })
})
