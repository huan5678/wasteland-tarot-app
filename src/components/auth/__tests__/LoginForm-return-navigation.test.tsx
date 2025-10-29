/**
 * Test Suite: LoginForm Return Navigation (Task 3.2)
 * Tests post-login return navigation with sessionStorage
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '../LoginForm'
import { useRouter } from 'next/navigation'

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
}))

// Mock Zustand stores
const mockLogin = jest.fn()
jest.mock('@/lib/authStore', () => ({
  useAuthStore: jest.fn((selector) => {
    const store = {
      login: mockLogin,
      user: null,
      isAuthenticated: false,
    }
    return selector ? selector(store) : store
  }),
}))

jest.mock('@/lib/errorStore', () => ({
  useErrorStore: jest.fn((selector) => {
    const store = {
      pushError: jest.fn(),
      errors: [],
    }
    return selector ? selector(store) : store
  }),
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

describe('LoginForm - Return Navigation (Task 3.2)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    // Mock window.location.href setter
    delete (window as any).location
    ;(window as any).location = {
      href: '',
      origin: 'http://localhost',
      pathname: '/',
    }
  })

  describe('Requirement 5.6: Store and retrieve return URL', () => {
    it('should redirect to stored URL after successful login', async () => {
      sessionStorage.setItem('auth-return-url', '/bingo')
      mockLogin.mockResolvedValue(undefined)

      render(<LoginForm />)

      // Enable traditional form
      const switchButton = screen.getByRole('switch')
      fireEvent.click(switchButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/Email 信箱/i)).toBeInTheDocument()
      })

      // Fill form
      const emailInput = screen.getByLabelText(/Email 信箱/i)
      const passwordInput = screen.getByLabelText(/存取密碼/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /初始化 Pip-Boy/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })

      // Should redirect to stored URL
      await waitFor(() => {
        expect(window.location.href).toBe('/bingo')
      }, { timeout: 3000 })
    })

    it('should redirect to dashboard if no returnUrl stored', async () => {
      // No sessionStorage value set
      mockLogin.mockResolvedValue(undefined)

      render(<LoginForm />)

      // Enable traditional form
      const switchButton = screen.getByRole('switch')
      fireEvent.click(switchButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/Email 信箱/i)).toBeInTheDocument()
      })

      // Fill form
      const emailInput = screen.getByLabelText(/Email 信箱/i)
      const passwordInput = screen.getByLabelText(/存取密碼/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /初始化 Pip-Boy/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })

      // Should redirect to dashboard (default)
      await waitFor(() => {
        expect(window.location.href).toBe('/dashboard')
      }, { timeout: 3000 })
    })

    it('should clear returnUrl from sessionStorage after redirect', async () => {
      sessionStorage.setItem('auth-return-url', '/achievements')
      mockLogin.mockResolvedValue(undefined)
      const removeSpy = jest.spyOn(Storage.prototype, 'removeItem')

      render(<LoginForm />)

      // Enable traditional form
      const switchButton = screen.getByRole('switch')
      fireEvent.click(switchButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/Email 信箱/i)).toBeInTheDocument()
      })

      // Fill form
      const emailInput = screen.getByLabelText(/Email 信箱/i)
      const passwordInput = screen.getByLabelText(/存取密碼/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /初始化 Pip-Boy/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })

      // Should clear sessionStorage
      await waitFor(() => {
        expect(removeSpy).toHaveBeenCalledWith('auth-return-url')
      }, { timeout: 3000 })

      removeSpy.mockRestore()
    })

    it('should fallback to dashboard if stored URL is invalid', async () => {
      // Invalid URL (e.g., external link)
      sessionStorage.setItem('auth-return-url', 'https://evil.com/phishing')
      mockLogin.mockResolvedValue(undefined)

      render(<LoginForm />)

      // Enable traditional form
      const switchButton = screen.getByRole('switch')
      fireEvent.click(switchButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/Email 信箱/i)).toBeInTheDocument()
      })

      // Fill form
      const emailInput = screen.getByLabelText(/Email 信箱/i)
      const passwordInput = screen.getByLabelText(/存取密碼/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /初始化 Pip-Boy/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })

      // Should fallback to dashboard (ignore invalid URL)
      await waitFor(() => {
        expect(window.location.href).toBe('/dashboard')
      }, { timeout: 3000 })
    })
  })

  describe('Integration with 401 redirects (from Task 1-2)', () => {
    it('should work with returnUrl set by bingoStore 401 handler', async () => {
      // Simulate bingoStore setting returnUrl before redirect
      sessionStorage.setItem('auth-return-url', '/bingo')
      mockLogin.mockResolvedValue(undefined)

      render(<LoginForm />)

      // Enable traditional form
      const switchButton = screen.getByRole('switch')
      fireEvent.click(switchButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/Email 信箱/i)).toBeInTheDocument()
      })

      // Fill form
      const emailInput = screen.getByLabelText(/Email 信箱/i)
      const passwordInput = screen.getByLabelText(/存取密碼/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /初始化 Pip-Boy/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })

      // Should redirect back to /bingo
      await waitFor(() => {
        expect(window.location.href).toBe('/bingo')
      }, { timeout: 3000 })
    })

    it('should work with returnUrl set by achievementStore 401 handler', async () => {
      // Simulate achievementStore setting returnUrl before redirect
      sessionStorage.setItem('auth-return-url', '/achievements')
      mockLogin.mockResolvedValue(undefined)

      render(<LoginForm />)

      // Enable traditional form
      const switchButton = screen.getByRole('switch')
      fireEvent.click(switchButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/Email 信箱/i)).toBeInTheDocument()
      })

      // Fill form
      const emailInput = screen.getByLabelText(/Email 信箱/i)
      const passwordInput = screen.getByLabelText(/存取密碼/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /初始化 Pip-Boy/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })

      // Should redirect back to /achievements
      await waitFor(() => {
        expect(window.location.href).toBe('/achievements')
      }, { timeout: 3000 })
    })
  })

  describe('Edge Cases', () => {
    it('should handle login failure without clearing returnUrl', async () => {
      sessionStorage.setItem('auth-return-url', '/bingo')
      mockLogin.mockRejectedValue(new Error('Invalid credentials'))

      render(<LoginForm />)

      // Enable traditional form
      const switchButton = screen.getByRole('switch')
      fireEvent.click(switchButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/Email 信箱/i)).toBeInTheDocument()
      })

      // Fill form
      const emailInput = screen.getByLabelText(/Email 信箱/i)
      const passwordInput = screen.getByLabelText(/存取密碼/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /初始化 Pip-Boy/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'wrongpassword')
      })

      // Should NOT redirect
      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(window.location.href).not.toBe('/bingo')

      // returnUrl should still be in sessionStorage for retry
      expect(sessionStorage.getItem('auth-return-url')).toBe('/bingo')
    })
  })
})
