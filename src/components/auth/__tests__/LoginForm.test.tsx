/**
 * LoginForm Component Tests
 * Fallout-themed login form with Pip-Boy styling
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../LoginForm'

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}))

// Mock auth context/hook
const mockLogin = jest.fn()
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    loading: false,
    error: null,
  }),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Pip-Boy Interface Styling', () => {
    it('should render with Fallout Pip-Boy theme', () => {
      render(<LoginForm />)

      const form = screen.getByRole('form')
      expect(form).toHavePipBoyStyle()
      expect(form).toHaveClass('bg-vault-dark', 'border-pip-boy-green')
    })

    it('should display Vault-Tec branding', () => {
      render(<LoginForm />)

      expect(screen.getByText(/vault-tec/i)).toBeInTheDocument()
      expect(screen.getByText(/pip-boy authentication/i)).toBeInTheDocument()
    })

    it('should have terminal-style font for inputs', () => {
      render(<LoginForm />)

      const usernameInput = screen.getByLabelText(/vault dweller id/i)
      const passwordInput = screen.getByLabelText(/access code/i)

      expect(usernameInput).toHaveClass('font-mono')
      expect(passwordInput).toHaveClass('font-mono')
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: /initialize pip-boy/i })
      await user.click(submitButton)

      expect(screen.getByText(/vault dweller id is required/i)).toBeInTheDocument()
      expect(screen.getByText(/access code is required/i)).toBeInTheDocument()
    })

    it('should validate username format', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const usernameInput = screen.getByLabelText(/vault dweller id/i)
      await user.type(usernameInput, 'ab') // Too short

      fireEvent.blur(usernameInput)

      await waitFor(() => {
        expect(screen.getByText(/vault dweller id must be at least 3 characters/i)).toBeInTheDocument()
      })
    })

    it('should show radiation warning for invalid characters', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const usernameInput = screen.getByLabelText(/vault dweller id/i)
      await user.type(usernameInput, 'user@invalid!')

      fireEvent.blur(usernameInput)

      await waitFor(() => {
        expect(screen.getByText(/contaminated characters detected/i)).toBeInTheDocument()
      })
    })
  })

  describe('Authentication Flow', () => {
    it('should call login function with correct credentials', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue({ success: true })

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/vault dweller id/i), 'vault_dweller')
      await user.type(screen.getByLabelText(/access code/i), 'password123!')
      await user.click(screen.getByRole('button', { name: /initialize pip-boy/i }))

      expect(mockLogin).toHaveBeenCalledWith({
        username: 'vault_dweller',
        password: 'password123!'
      })
    })

    it('should redirect to dashboard on successful login', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue({ success: true })

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/vault dweller id/i), 'vault_dweller')
      await user.type(screen.getByLabelText(/access code/i), 'password123!')
      await user.click(screen.getByRole('button', { name: /initialize pip-boy/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should display Pip-Boy error message on failed login', async () => {
      const user = userEvent.setup()
      mockLogin.mockRejectedValue(new Error('Invalid access codes - Pip-Boy authentication failed'))

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/vault dweller id/i), 'vault_dweller')
      await user.type(screen.getByLabelText(/access code/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /initialize pip-boy/i }))

      await waitFor(() => {
        expect(screen.getByText(/pip-boy authentication failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading animation during authentication', async () => {
      const user = userEvent.setup()
      // Mock loading state
      jest.mocked(require('@/hooks/useAuth').useAuth).mockReturnValue({
        login: mockLogin,
        loading: true,
        error: null,
      })

      render(<LoginForm />)

      expect(screen.getByText(/authenticating pip-boy/i)).toBeInTheDocument()
      expect(screen.getByTestId('pip-boy-loading-spinner')).toBeInTheDocument()
    })

    it('should disable form during loading', async () => {
      jest.mocked(require('@/hooks/useAuth').useAuth).mockReturnValue({
        login: mockLogin,
        loading: true,
        error: null,
      })

      render(<LoginForm />)

      const usernameInput = screen.getByLabelText(/vault dweller id/i)
      const passwordInput = screen.getByLabelText(/access code/i)
      const submitButton = screen.getByRole('button', { name: /authenticating/i })

      expect(usernameInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should be accessible for Vault dwellers with disabilities', () => {
      render(<LoginForm />)

      expect(screen.getByRole('form')).toBeAccessibleInVault()
      expect(screen.getByLabelText(/vault dweller id/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/access code/i)).toHaveAttribute('aria-required', 'true')
    })

    it('should provide clear error announcements', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: /initialize pip-boy/i })
      await user.click(submitButton)

      const errorContainer = screen.getByRole('alert')
      expect(errorContainer).toBeInTheDocument()
      expect(errorContainer).toHaveAttribute('aria-live', 'polite')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const usernameInput = screen.getByLabelText(/vault dweller id/i)
      const passwordInput = screen.getByLabelText(/access code/i)
      const submitButton = screen.getByRole('button', { name: /initialize pip-boy/i })

      // Tab navigation
      await user.tab()
      expect(usernameInput).toHaveFocus()

      await user.tab()
      expect(passwordInput).toHaveFocus()

      await user.tab()
      expect(submitButton).toHaveFocus()
    })
  })

  describe('Pip-Boy Sound Effects', () => {
    it('should play button click sound', async () => {
      const user = userEvent.setup()
      const mockPlaySound = jest.fn()
      global.WastelandTarot.PipBoyInterface.playSound = mockPlaySound

      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: /initialize pip-boy/i })
      await user.click(submitButton)

      expect(mockPlaySound).toHaveBeenCalledWith('button-click')
    })

    it('should play error sound on authentication failure', async () => {
      const user = userEvent.setup()
      const mockPlaySound = jest.fn()
      global.WastelandTarot.PipBoyInterface.playSound = mockPlaySound
      mockLogin.mockRejectedValue(new Error('Authentication failed'))

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/vault dweller id/i), 'test')
      await user.type(screen.getByLabelText(/access code/i), 'wrong')
      await user.click(screen.getByRole('button', { name: /initialize pip-boy/i }))

      await waitFor(() => {
        expect(mockPlaySound).toHaveBeenCalledWith('error-beep')
      })
    })
  })

  describe('Remember Me Feature', () => {
    it('should store credentials in localStorage when remember me is checked', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue({ success: true })

      render(<LoginForm />)

      await user.type(screen.getByLabelText(/vault dweller id/i), 'vault_dweller')
      await user.click(screen.getByLabelText(/remember me/i))
      await user.click(screen.getByRole('button', { name: /initialize pip-boy/i }))

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'pip-boy-remember',
        JSON.stringify({ username: 'vault_dweller' })
      )
    })

    it('should pre-fill username from localStorage', () => {
      localStorage.getItem = jest.fn().mockReturnValue(
        JSON.stringify({ username: 'saved_dweller' })
      )

      render(<LoginForm />)

      expect(screen.getByDisplayValue('saved_dweller')).toBeInTheDocument()
      expect(screen.getByLabelText(/remember me/i)).toBeChecked()
    })
  })

  describe('Registration Link', () => {
    it('should provide link to registration for new vault dwellers', () => {
      render(<LoginForm />)

      const registerLink = screen.getByRole('link', { name: /join vault-tec/i })
      expect(registerLink).toHaveAttribute('href', '/auth/register')
    })
  })

  describe('Password Reset', () => {
    it('should provide forgot password link', () => {
      render(<LoginForm />)

      const forgotLink = screen.getByRole('link', { name: /forgot access code/i })
      expect(forgotLink).toHaveAttribute('href', '/auth/forgot-password')
    })
  })
})