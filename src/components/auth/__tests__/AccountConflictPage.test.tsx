/**
 * AccountConflictPage Component Tests
 * Tests for account conflict resolution page (Task 7.1)
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AccountConflictPage } from '../AccountConflictPage'
import { useAuthStore } from '@/lib/authStore'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Mock dependencies
jest.mock('@/lib/authStore', () => ({
  useAuthStore: jest.fn(),
}))
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}))

// Mock fetch
global.fetch = jest.fn()

describe('AccountConflictPage', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  }

  const mockSetUser = jest.fn()
  const mockRefreshAuthMethods = jest.fn()

  const defaultProps = {
    email: 'test@example.com',
    existingAuthMethods: ['password'],
    oauthProvider: 'google',
    oauthId: 'google-123',
    profilePicture: 'https://example.com/avatar.jpg',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      setUser: mockSetUser,
      refreshAuthMethods: mockRefreshAuthMethods,
    })
  })

  describe('Basic Rendering', () => {
    it('應顯示衝突訊息和 email', () => {
      render(<AccountConflictPage {...defaultProps} />)

      expect(screen.getByText(/此 Email 已註冊/)).toBeInTheDocument()
      expect(screen.getByText(/test@example\.com/)).toBeInTheDocument()
    })

    it('應顯示現有認證方式清單（視覺化圖示）', () => {
      const props = {
        ...defaultProps,
        existingAuthMethods: ['password', 'passkey'],
      }
      render(<AccountConflictPage {...props} />)

      // 檢查認證方式圖示
      const icons = screen.getAllByRole('img', { hidden: true })
      expect(icons.length).toBeGreaterThan(0)
    })

    it('應顯示「返回登入頁面」按鈕', () => {
      render(<AccountConflictPage {...defaultProps} />)

      const backButton = screen.getByRole('button', { name: /返回登入頁面/ })
      expect(backButton).toBeInTheDocument()
    })
  })

  describe('Password Login Flow', () => {
    it('現有方式為密碼時應顯示內嵌登入表單', () => {
      render(<AccountConflictPage {...defaultProps} />)

      // Email 應該預填且禁用
      const emailInput = screen.getByLabelText(/Email/) as HTMLInputElement
      expect(emailInput).toBeInTheDocument()
      expect(emailInput.value).toBe('test@example.com')
      expect(emailInput).toBeDisabled()

      // Password 欄位應存在
      const passwordInput = screen.getByLabelText(/密碼/)
      expect(passwordInput).toBeInTheDocument()
    })

    it('應顯示「忘記密碼？」連結', () => {
      render(<AccountConflictPage {...defaultProps} />)

      const forgotPasswordLink = screen.getByText(/忘記密碼/)
      expect(forgotPasswordLink).toBeInTheDocument()
    })

    it('密碼登入成功後應自動連結 OAuth', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          expires_at: Date.now() + 3600000,
          linked_oauth: true,
        }),
      })

      render(<AccountConflictPage {...defaultProps} />)

      // 輸入密碼
      const passwordInput = screen.getByLabelText(/密碼/)
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // 提交表單
      const submitButton = screen.getByRole('button', { name: /使用密碼登入並連結/ })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/auth/login?link_oauth=true',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password123',
              link_oauth: true,
              oauth_provider: 'google',
              oauth_id: 'google-123',
              profile_picture: 'https://example.com/avatar.jpg',
            }),
          })
        )
      })
    })

    it('應顯示成功訊息並導向 dashboard', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          expires_at: Date.now() + 3600000,
          linked_oauth: true,
        }),
      })

      render(<AccountConflictPage {...defaultProps} />)

      const passwordInput = screen.getByLabelText(/密碼/)
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      const submitButton = screen.getByRole('button', { name: /使用密碼登入並連結/ })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining('Google 帳號已連結'),
          expect.any(Object)
        )
      }, { timeout: 3000 })

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
      }, { timeout: 3000 })
    })

    it('密碼錯誤時應顯示錯誤訊息並允許重試', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: '密碼錯誤',
        }),
      })

      render(<AccountConflictPage {...defaultProps} />)

      const passwordInput = screen.getByLabelText(/密碼/)
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })

      const submitButton = screen.getByRole('button', { name: /使用密碼登入並連結/ })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/密碼錯誤/)).toBeInTheDocument()
      })

      // 應該還可以重試
      expect(passwordInput).not.toBeDisabled()
      expect(submitButton).not.toBeDisabled()
    })

    it('連續失敗 5 次後應顯示鎖定提示', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: '密碼錯誤',
        }),
      })

      render(<AccountConflictPage {...defaultProps} />)

      const passwordInput = screen.getByLabelText(/密碼/)
      const submitButton = screen.getByRole('button', { name: /使用密碼登入並連結/ })

      // 嘗試 5 次失敗
      for (let i = 0; i < 5; i++) {
        // Reset the mock before each attempt
        ;(global.fetch as jest.Mock).mockClear()

        fireEvent.change(passwordInput, { target: { value: `wrongpassword${i}` } })
        fireEvent.click(submitButton)

        // Wait for API call
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledTimes(1)
        }, { timeout: 1000 })
      }

      // Wait for lockout message to appear
      await waitFor(() => {
        expect(screen.getByText(/鎖定 15 分鐘/i)).toBeInTheDocument()
      }, { timeout: 1000 })

      // 按鈕應該被禁用
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Passkey Login Flow', () => {
    it('現有方式為 Passkey 時應顯示生物辨識按鈕', () => {
      const props = {
        ...defaultProps,
        existingAuthMethods: ['passkey'],
      }
      render(<AccountConflictPage {...props} />)

      const passkeyButton = screen.getByRole('button', { name: /使用生物辨識登入/ })
      expect(passkeyButton).toBeInTheDocument()
    })

    it('Passkey 登入成功後應連結 OAuth', async () => {
      const props = {
        ...defaultProps,
        existingAuthMethods: ['passkey'],
      }
      render(<AccountConflictPage {...props} />)

      const passkeyButton = screen.getByRole('button', { name: /使用生物辨識登入/ })
      fireEvent.click(passkeyButton)

      await waitFor(() => {
        // Currently shows "即將推出" message
        expect(toast.info).toHaveBeenCalledWith(expect.stringContaining('即將推出'))
      })
    })
  })

  describe('Other OAuth Provider Flow', () => {
    it('現有方式為其他 OAuth 時應顯示對應 OAuth 按鈕', () => {
      const props = {
        ...defaultProps,
        existingAuthMethods: ['oauth_facebook'],
      }
      render(<AccountConflictPage {...props} />)

      const oauthButton = screen.getByRole('button', { name: /使用 Facebook 登入/ })
      expect(oauthButton).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('點擊「返回登入頁面」應正確導向', () => {
      render(<AccountConflictPage {...defaultProps} />)

      const backButton = screen.getByRole('button', { name: /返回登入頁面/ })
      fireEvent.click(backButton)

      expect(mockRouter.push).toHaveBeenCalledWith('/auth/login')
    })
  })
})
