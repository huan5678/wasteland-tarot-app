/**
 * RegisterForm Component Tests
 * Fallout-themed registration form for new Vault dwellers
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterForm } from '../RegisterForm'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock auth hook
const mockRegister = jest.fn()
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    register: mockRegister,
    loading: false,
    error: null,
  }),
}))

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Vault-Tec Registration Interface', () => {
    it('should render with Pip-Boy registration theme', () => {
      render(<RegisterForm />)

      expect(screen.getByText(/vault-tec registration/i)).toBeInTheDocument()
      expect(screen.getByText(/welcome to the vault/i)).toBeInTheDocument()

      const form = screen.getByRole('form')
      expect(form).toHavePipBoyStyle()
    })

    it('should display radiation safety notice', () => {
      render(<RegisterForm />)

      expect(screen.getByText(/radiation exposure warning/i)).toBeInTheDocument()
      expect(screen.getByText(/vault-tec cannot guarantee/i)).toBeInTheDocument()
    })

    it('should show terms of service link', () => {
      render(<RegisterForm />)

      const termsLink = screen.getByRole('link', { name: /vault-tec terms of service/i })
      expect(termsLink).toHaveAttribute('href', '/terms')
    })
  })

  describe('Form Fields and Validation', () => {
    it('should validate all required fields', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const submitButton = screen.getByRole('button', { name: /register for vault-tec/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/vault dweller id is required/i)).toBeInTheDocument()
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/access code is required/i)).toBeInTheDocument()
      })
    })

    it('should validate username format', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const usernameInput = screen.getByLabelText(/vault dweller id/i)

      // Test too short
      await user.type(usernameInput, 'ab')
      fireEvent.blur(usernameInput)

      await waitFor(() => {
        expect(screen.getByText(/vault dweller id must be at least 3 characters/i)).toBeInTheDocument()
      })

      // Test invalid characters
      await user.clear(usernameInput)
      await user.type(usernameInput, 'user@invalid!')
      fireEvent.blur(usernameInput)

      await waitFor(() => {
        expect(screen.getByText(/contaminated characters detected/i)).toBeInTheDocument()
      })
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid-email')
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
      })
    })

    it('should validate password strength with Wasteland requirements', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const passwordInput = screen.getByLabelText(/access code/i)

      // Test weak password
      await user.type(passwordInput, 'weak')
      fireEvent.blur(passwordInput)

      await waitFor(() => {
        expect(screen.getByText(/access code must be at least 8 characters/i)).toBeInTheDocument()
      })

      // Test missing requirements
      await user.clear(passwordInput)
      await user.type(passwordInput, 'weakpassword')
      fireEvent.blur(passwordInput)

      await waitFor(() => {
        expect(screen.getByText(/access code must contain uppercase/i)).toBeInTheDocument()
        expect(screen.getByText(/access code must contain digit/i)).toBeInTheDocument()
        expect(screen.getByText(/access code must contain special character/i)).toBeInTheDocument()
      })
    })

    it('should validate password confirmation', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const passwordInput = screen.getByLabelText(/^access code$/i)
      const confirmInput = screen.getByLabelText(/confirm access code/i)

      await user.type(passwordInput, 'StrongPass123!')
      await user.type(confirmInput, 'DifferentPass123!')
      fireEvent.blur(confirmInput)

      await waitFor(() => {
        expect(screen.getByText(/access codes do not match/i)).toBeInTheDocument()
      })
    })
  })

  describe('Fallout-specific Fields', () => {
    it('should render faction alignment selector', () => {
      render(<RegisterForm />)

      expect(screen.getByLabelText(/faction alignment/i)).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /brotherhood of steel/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /ncr/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /unaffiliated/i })).toBeInTheDocument()
    })

    it('should validate vault number format', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const vaultInput = screen.getByLabelText(/vault number/i)
      await user.type(vaultInput, '9999') // Invalid vault number

      fireEvent.blur(vaultInput)

      await waitFor(() => {
        expect(screen.getByText(/invalid vault number/i)).toBeInTheDocument()
      })
    })

    it('should provide wasteland location suggestions', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const locationInput = screen.getByLabelText(/wasteland location/i)
      await user.type(locationInput, 'comm')

      await waitFor(() => {
        expect(screen.getByText(/commonwealth/i)).toBeInTheDocument()
        expect(screen.getByText(/capital wasteland/i)).toBeInTheDocument()
      })
    })
  })

  describe('Registration Process', () => {
    const validFormData = {
      username: 'new_dweller',
      email: 'dweller@vault101.gov',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
      displayName: 'New Vault Dweller',
      factionAlignment: 'BROTHERHOOD_OF_STEEL',
      vaultNumber: '101',
      wastelandLocation: 'Capital Wasteland'
    }

    it('should submit registration with all form data', async () => {
      const user = userEvent.setup()
      mockRegister.mockResolvedValue({ success: true })

      render(<RegisterForm />)

      // Fill out form
      await user.type(screen.getByLabelText(/vault dweller id/i), validFormData.username)
      await user.type(screen.getByLabelText(/email address/i), validFormData.email)
      await user.type(screen.getByLabelText(/^access code$/i), validFormData.password)
      await user.type(screen.getByLabelText(/confirm access code/i), validFormData.confirmPassword)
      await user.type(screen.getByLabelText(/display name/i), validFormData.displayName)
      await user.selectOptions(screen.getByLabelText(/faction alignment/i), validFormData.factionAlignment)
      await user.type(screen.getByLabelText(/vault number/i), validFormData.vaultNumber)
      await user.type(screen.getByLabelText(/wasteland location/i), validFormData.wastelandLocation)

      // Accept terms
      await user.click(screen.getByLabelText(/i accept the vault-tec terms/i))

      // Submit
      await user.click(screen.getByRole('button', { name: /register for vault-tec/i }))

      expect(mockRegister).toHaveBeenCalledWith({
        username: validFormData.username,
        email: validFormData.email,
        password: validFormData.password,
        display_name: validFormData.displayName,
        faction_alignment: validFormData.factionAlignment,
        vault_number: parseInt(validFormData.vaultNumber),
        wasteland_location: validFormData.wastelandLocation
      })
    })

    it('should redirect to verification page on successful registration', async () => {
      const user = userEvent.setup()
      mockRegister.mockResolvedValue({
        success: true,
        message: 'Registration successful - Check your Pip-Boy for verification'
      })

      render(<RegisterForm />)

      // Fill minimum required fields and submit
      await user.type(screen.getByLabelText(/vault dweller id/i), validFormData.username)
      await user.type(screen.getByLabelText(/email address/i), validFormData.email)
      await user.type(screen.getByLabelText(/^access code$/i), validFormData.password)
      await user.type(screen.getByLabelText(/confirm access code/i), validFormData.confirmPassword)
      await user.click(screen.getByLabelText(/i accept the vault-tec terms/i))
      await user.click(screen.getByRole('button', { name: /register for vault-tec/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/verify-email')
      })
    })

    it('should display registration errors in Pip-Boy style', async () => {
      const user = userEvent.setup()
      mockRegister.mockRejectedValue(new Error('Username already exists in the Vault registry'))

      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/vault dweller id/i), 'taken_username')
      await user.type(screen.getByLabelText(/email address/i), validFormData.email)
      await user.type(screen.getByLabelText(/^access code$/i), validFormData.password)
      await user.type(screen.getByLabelText(/confirm access code/i), validFormData.confirmPassword)
      await user.click(screen.getByLabelText(/i accept the vault-tec terms/i))
      await user.click(screen.getByRole('button', { name: /register for vault-tec/i }))

      await waitFor(() => {
        expect(screen.getByText(/username already exists in the vault registry/i)).toBeInTheDocument()
      })
    })
  })

  describe('Terms of Service Validation', () => {
    it('should require terms acceptance', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const submitButton = screen.getByRole('button', { name: /register for vault-tec/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/you must accept the vault-tec terms/i)).toBeInTheDocument()
      })
    })

    it('should enable registration button only when terms are accepted', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const submitButton = screen.getByRole('button', { name: /register for vault-tec/i })
      const termsCheckbox = screen.getByLabelText(/i accept the vault-tec terms/i)

      expect(submitButton).toBeDisabled()

      await user.click(termsCheckbox)
      expect(submitButton).toBeEnabled()

      await user.click(termsCheckbox)
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Loading States', () => {
    it('should show Pip-Boy processing animation during registration', () => {
      jest.mocked(require('@/hooks/useAuth').useAuth).mockReturnValue({
        register: mockRegister,
        loading: true,
        error: null,
      })

      render(<RegisterForm />)

      expect(screen.getByText(/processing vault-tec registration/i)).toBeInTheDocument()
      expect(screen.getByTestId('pip-boy-processing-spinner')).toBeInTheDocument()
    })

    it('should disable form during registration process', () => {
      jest.mocked(require('@/hooks/useAuth').useAuth).mockReturnValue({
        register: mockRegister,
        loading: true,
        error: null,
      })

      render(<RegisterForm />)

      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        expect(input).toBeDisabled()
      })

      expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should be accessible for all vault dwellers', () => {
      render(<RegisterForm />)

      expect(screen.getByRole('form')).toBeAccessibleInVault()

      // Check required field labels
      expect(screen.getByLabelText(/vault dweller id/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/^access code$/i)).toHaveAttribute('aria-required', 'true')
    })

    it('should provide password strength feedback', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const passwordInput = screen.getByLabelText(/^access code$/i)
      await user.type(passwordInput, 'Str0ng!')

      expect(screen.getByRole('progressbar', { name: /password strength/i })).toBeInTheDocument()
      expect(screen.getByText(/strong/i)).toBeInTheDocument()
    })

    it('should announce validation errors', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const submitButton = screen.getByRole('button', { name: /register for vault-tec/i })
      await user.click(submitButton)

      const errorContainer = screen.getByRole('alert')
      expect(errorContainer).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Pip-Boy Sound Effects', () => {
    it('should play confirmation sound on successful registration', async () => {
      const user = userEvent.setup()
      const mockPlaySound = jest.fn()
      global.WastelandTarot.PipBoyInterface.playSound = mockPlaySound
      mockRegister.mockResolvedValue({ success: true })

      render(<RegisterForm />)

      // Submit valid form
      await user.type(screen.getByLabelText(/vault dweller id/i), 'new_dweller')
      await user.type(screen.getByLabelText(/email address/i), 'test@vault.com')
      await user.type(screen.getByLabelText(/^access code$/i), 'StrongPass123!')
      await user.type(screen.getByLabelText(/confirm access code/i), 'StrongPass123!')
      await user.click(screen.getByLabelText(/i accept the vault-tec terms/i))
      await user.click(screen.getByRole('button', { name: /register for vault-tec/i }))

      await waitFor(() => {
        expect(mockPlaySound).toHaveBeenCalledWith('registration-success')
      })
    })

    it('should play error sound on registration failure', async () => {
      const user = userEvent.setup()
      const mockPlaySound = jest.fn()
      global.WastelandTarot.PipBoyInterface.playSound = mockPlaySound
      mockRegister.mockRejectedValue(new Error('Registration failed'))

      render(<RegisterForm />)

      await user.type(screen.getByLabelText(/vault dweller id/i), 'test')
      await user.type(screen.getByLabelText(/email address/i), 'test@vault.com')
      await user.type(screen.getByLabelText(/^access code$/i), 'StrongPass123!')
      await user.type(screen.getByLabelText(/confirm access code/i), 'StrongPass123!')
      await user.click(screen.getByLabelText(/i accept the vault-tec terms/i))
      await user.click(screen.getByRole('button', { name: /register for vault-tec/i }))

      await waitFor(() => {
        expect(mockPlaySound).toHaveBeenCalledWith('error-beep')
      })
    })
  })

  describe('Login Link', () => {
    it('should provide link to login for existing vault dwellers', () => {
      render(<RegisterForm />)

      const loginLink = screen.getByRole('link', { name: /already have a pip-boy/i })
      expect(loginLink).toHaveAttribute('href', '/auth/login')
    })
  })
})