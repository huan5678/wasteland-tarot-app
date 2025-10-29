/**
 * Test Suite: LoginForm Reason Parameter Handling (Task 3.1)
 * Tests login page reason parameter parsing and message display
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { LoginForm } from '../LoginForm'
import { useSearchParams } from 'next/navigation'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
}))

// Mock Zustand stores
jest.mock('@/lib/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    login: jest.fn(),
  })),
}))

jest.mock('@/lib/errorStore', () => ({
  useErrorStore: jest.fn(() => ({
    pushError: jest.fn(),
  })),
}))

// Mock hooks
jest.mock('@/hooks/useOAuth', () => ({
  useOAuth: jest.fn(() => ({
    signInWithGoogle: jest.fn(),
    loading: false,
    error: null,
  })),
}))

jest.mock('@/hooks/usePasskey', () => ({
  usePasskey: jest.fn(() => ({
    authenticateWithPasskey: jest.fn(),
    isLoading: false,
    error: null,
    isSupported: true,
    clearError: jest.fn(),
  })),
}))

jest.mock('@/hooks/useAuthErrorHandling', () => ({
  useAuthErrorHandling: jest.fn(() => ({
    serviceAvailability: { oauth: true },
    checkServiceAvailability: jest.fn(),
    loginAttempts: { count: 0, lockedUntil: null },
    isLocked: false,
    incrementLoginAttempts: jest.fn(),
    resetLoginAttempts: jest.fn(),
    handleRetry: jest.fn(),
    showErrorToast: jest.fn(),
    showWarningToast: jest.fn(),
  })),
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}))

describe('LoginForm - Reason Parameter Handling (Task 3.1)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Requirement 5.3: Parse reason parameter from URL', () => {
    it('should parse auth_required reason from URL query parameter', async () => {
      const mockSearchParams = {
        get: jest.fn((key: string) => key === 'reason' ? 'auth_required' : null),
      }
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      render(<LoginForm />)

      await waitFor(() => {
        expect(mockSearchParams.get).toHaveBeenCalledWith('reason')
      })
    })

    it('should parse session_expired reason from URL query parameter', async () => {
      const mockSearchParams = {
        get: jest.fn((key: string) => key === 'reason' ? 'session_expired' : null),
      }
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      render(<LoginForm />)

      await waitFor(() => {
        expect(mockSearchParams.get).toHaveBeenCalledWith('reason')
      })
    })

    it('should handle missing reason parameter gracefully', () => {
      const mockSearchParams = {
        get: jest.fn(() => null),
      }
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      render(<LoginForm />)

      // Should not crash, no reason message displayed
      expect(mockSearchParams.get).toHaveBeenCalledWith('reason')
    })
  })

  describe('Requirement 5.4: Display auth_required message', () => {
    it('should display "請先登入以存取此功能" for auth_required reason', async () => {
      const mockSearchParams = {
        get: jest.fn((key: string) => key === 'reason' ? 'auth_required' : null),
      }
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      render(<LoginForm />)

      await waitFor(() => {
        expect(screen.getByText(/請先登入以存取此功能/i)).toBeInTheDocument()
      })
    })

    it('should display auth_required message in Fallout-styled alert banner', async () => {
      const mockSearchParams = {
        get: jest.fn((key: string) => key === 'reason' ? 'auth_required' : null),
      }
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      render(<LoginForm />)

      await waitFor(() => {
        const message = screen.getByText(/請先登入以存取此功能/i)
        const banner = message.closest('div[role="alert"]')
        expect(banner).toBeInTheDocument()
        expect(banner).toHaveAttribute('aria-live', 'polite')
      })
    })
  })

  describe('Requirement 5.5: Display session_expired message', () => {
    it('should display "您的登入已過期，請重新登入" for session_expired reason', async () => {
      const mockSearchParams = {
        get: jest.fn((key: string) => key === 'reason' ? 'session_expired' : null),
      }
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      render(<LoginForm />)

      await waitFor(() => {
        expect(screen.getByText(/您的登入已過期，請重新登入/i)).toBeInTheDocument()
      })
    })

    it('should display session_expired message in Fallout-styled alert banner', async () => {
      const mockSearchParams = {
        get: jest.fn((key: string) => key === 'reason' ? 'session_expired' : null),
      }
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      render(<LoginForm />)

      await waitFor(() => {
        const message = screen.getByText(/您的登入已過期，請重新登入/i)
        const banner = message.closest('div[role="alert"]')
        expect(banner).toBeInTheDocument()
        expect(banner).toHaveAttribute('aria-live', 'polite')
      })
    })
  })

  describe('Requirement 5.3: Clear reason parameter after display', () => {
    it('should clear reason parameter from URL after message is displayed', async () => {
      const mockReplace = jest.fn()
      const mockSearchParams = {
        get: jest.fn((key: string) => key === 'reason' ? 'auth_required' : null),
      }
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      // Mock useRouter
      jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
        push: jest.fn(),
        replace: mockReplace,
      })

      render(<LoginForm />)

      await waitFor(() => {
        expect(screen.getByText(/請先登入以存取此功能/i)).toBeInTheDocument()
      })

      // Should call router.replace to clear query parameter
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/auth/login', undefined)
      }, { timeout: 3000 })
    })
  })

  describe('Edge Cases', () => {
    it('should handle unknown reason parameter gracefully', () => {
      const mockSearchParams = {
        get: jest.fn((key: string) => key === 'reason' ? 'unknown_reason' : null),
      }
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      render(<LoginForm />)

      // Should not crash, no specific message displayed
      expect(() => render(<LoginForm />)).not.toThrow()
    })

    it('should not display message when no reason parameter', () => {
      const mockSearchParams = {
        get: jest.fn(() => null),
      }
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      render(<LoginForm />)

      expect(screen.queryByText(/請先登入以存取此功能/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/您的登入已過期，請重新登入/i)).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for reason message banner', async () => {
      const mockSearchParams = {
        get: jest.fn((key: string) => key === 'reason' ? 'auth_required' : null),
      }
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      render(<LoginForm />)

      await waitFor(() => {
        const banner = screen.getByRole('alert')
        expect(banner).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('should include icon with decorative ARIA label', async () => {
      const mockSearchParams = {
        get: jest.fn((key: string) => key === 'reason' ? 'auth_required' : null),
      }
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)

      render(<LoginForm />)

      await waitFor(() => {
        const message = screen.getByText(/請先登入以存取此功能/i)
        const banner = message.closest('div[role="alert"]')
        // PixelIcon renders as <i> with RemixIcon classes
        const icon = banner?.querySelector('i[aria-hidden="true"]')
        expect(icon).toBeInTheDocument()
      })
    })
  })
})
