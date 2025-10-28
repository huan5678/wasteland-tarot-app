/**
 * @jest-environment jsdom
 *
 * 認證方式管理區塊的單元測試
 *
 * 測試範圍：
 * - 顯示當前啟用的認證方式狀態
 * - hasOAuth=true 時顯示「已連結 Google 帳號」標籤
 * - hasPasskey=true 時顯示 Passkeys 清單
 * - hasPassword=true 時顯示「已設定密碼」標籤
 * - hasOAuth=false 時顯示「連結 Google 帳號」按鈕
 * - hasPasskey=false 時顯示「新增 Passkey」按鈕
 * - hasPassword=false 且 hasOAuth=true 時顯示「設定密碼」按鈕
 * - 移除認證方式時檢查至少保留一種
 */

import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthMethodsManagement } from '../AuthMethodsManagement'
import { useAuthStore } from '@/lib/authStore'
import { authAPI } from '@/lib/api'
import { useOAuth } from '@/hooks/useOAuth'
import { usePasskey } from '@/hooks/usePasskey'

// Mock dependencies
jest.mock('@/lib/authStore')
jest.mock('@/lib/api')
jest.mock('@/hooks/useOAuth')
jest.mock('@/hooks/usePasskey')
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    promise: jest.fn((promise) => promise),
    loading: jest.fn()
  }
}))

// Mock PixelIcon
jest.mock('@/components/ui/icons', () => ({
  PixelIcon: ({ name, 'aria-label': ariaLabel }: any) => (
    <span data-testid={`icon-${name}`} aria-label={ariaLabel}>{name}</span>
  )
}))

describe('AuthMethodsManagement', () => {
  const mockRefreshAuthMethods = jest.fn()
  const mockSignInWithGoogle = jest.fn()
  const mockRegisterPasskey = jest.fn()
  const mockDeleteCredential = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      hasOAuth: false,
      hasPasskey: false,
      hasPassword: false,
      oauthProvider: null,
      profilePicture: null,
      refreshAuthMethods: mockRefreshAuthMethods
    })

    // Mock useOAuth hook
    ;(useOAuth as jest.Mock).mockReturnValue({
      signInWithGoogle: mockSignInWithGoogle,
      loading: false,
      error: null,
      handleOAuthCallback: jest.fn(),
      clearError: jest.fn()
    })

    // Mock usePasskey hook
    ;(usePasskey as jest.Mock).mockReturnValue({
      registerPasskey: mockRegisterPasskey,
      deleteCredential: mockDeleteCredential,
      isLoading: false,
      error: null,
      isSupported: true,
      registerNewUserWithPasskey: jest.fn(),
      authenticateWithPasskey: jest.fn(),
      listCredentials: jest.fn(),
      updateCredentialName: jest.fn(),
      clearError: jest.fn()
    })

    // 預設 mock authAPI.getAuthMethods 回應
    ;(authAPI.getAuthMethods as jest.Mock).mockResolvedValue({
      has_oauth: false,
      has_passkey: false,
      has_password: false,
      oauth_provider: null,
      profile_picture: null,
      passkey_credentials: []
    })
  })

  describe('顯示當前啟用的認證方式狀態', () => {
    it('應該顯示所有已啟用的認證方式', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        hasOAuth: true,
        hasPasskey: true,
        hasPassword: true,
        oauthProvider: 'google',
        profilePicture: 'https://example.com/pic.jpg',
        refreshAuthMethods: mockRefreshAuthMethods
      })

      ;(authAPI.getAuthMethods as jest.Mock).mockResolvedValue({
        has_oauth: true,
        has_passkey: true,
        has_password: true,
        oauth_provider: 'google',
        profile_picture: 'https://example.com/pic.jpg',
        passkey_credentials: []
      })

      render(<AuthMethodsManagement />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.queryByText(/載入認證方式.../i)).not.toBeInTheDocument()
      })

      // 應該顯示三種認證方式
      expect(screen.getByText(/已連結 Google 帳號/i)).toBeInTheDocument()
      expect(screen.getByText(/已設定密碼/i)).toBeInTheDocument()
      expect(screen.getByText(/生物辨識掃描儀/i)).toBeInTheDocument()
    })

    it('應該在沒有任何認證方式時顯示警告', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        hasOAuth: false,
        hasPasskey: false,
        hasPassword: false,
        oauthProvider: null,
        profilePicture: null,
        refreshAuthMethods: mockRefreshAuthMethods
      })

      render(<AuthMethodsManagement />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.queryByText(/載入認證方式.../i)).not.toBeInTheDocument()
      })

      // 應該至少顯示一個新增按鈕
      expect(screen.getByRole('button', { name: /連結 Google 帳號/i })).toBeInTheDocument()
    })
  })

  describe('OAuth 認證方式顯示', () => {
    it('hasOAuth=true 時應該顯示「已連結 Google 帳號」標籤', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        hasOAuth: true,
        hasPasskey: false,
        hasPassword: false,
        oauthProvider: 'google',
        profilePicture: 'https://example.com/pic.jpg',
        refreshAuthMethods: mockRefreshAuthMethods
      })

      ;(authAPI.getAuthMethods as jest.Mock).mockResolvedValue({
        has_oauth: true,
        has_passkey: false,
        has_password: false,
        oauth_provider: 'google',
        profile_picture: 'https://example.com/pic.jpg',
        passkey_credentials: []
      })

      render(<AuthMethodsManagement />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.queryByText(/載入認證方式.../i)).not.toBeInTheDocument()
      })

      expect(screen.getByText(/已連結 Google 帳號/i)).toBeInTheDocument()

      // 應該顯示 OAuth 圖示
      expect(screen.getByTestId('icon-google')).toBeInTheDocument()
    })

    it('應該顯示 profile picture（若存在）', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        hasOAuth: true,
        hasPasskey: false,
        hasPassword: false,
        oauthProvider: 'google',
        profilePicture: 'https://example.com/avatar.jpg',
        refreshAuthMethods: mockRefreshAuthMethods
      })

      // Mock API 回應 - profile_picture 需要在這裡設定
      ;(authAPI.getAuthMethods as jest.Mock).mockResolvedValue({
        has_oauth: true,
        has_passkey: false,
        has_password: false,
        oauth_provider: 'google',
        profile_picture: 'https://example.com/avatar.jpg',
        passkey_credentials: []
      })

      render(<AuthMethodsManagement />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.queryByText(/載入認證方式.../i)).not.toBeInTheDocument()
      })

      const avatar = screen.getByAltText(/Google 頭像/i)
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('hasOAuth=false 時應該顯示「連結 Google 帳號」按鈕', async () => {
      render(<AuthMethodsManagement />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.queryByText(/載入認證方式.../i)).not.toBeInTheDocument()
      })

      const linkButton = screen.getByRole('button', { name: /連結 Google 帳號/i })
      expect(linkButton).toBeInTheDocument()
      expect(linkButton).not.toBeDisabled()
    })
  })

  describe('Passkey 認證方式顯示', () => {
    it('hasPasskey=true 時應該顯示 Passkeys 清單', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        hasOAuth: false,
        hasPasskey: true,
        hasPassword: false,
        oauthProvider: null,
        profilePicture: null,
        refreshAuthMethods: mockRefreshAuthMethods
      })

      // Mock API 回傳 credentials
      ;(authAPI.getAuthMethods as jest.Mock).mockResolvedValue({
        has_oauth: false,
        has_passkey: true,
        has_password: false,
        passkey_credentials: [
          {
            id: 'cred-1',
            name: 'iPhone 15 Pro',
            created_at: '2025-01-15T10:00:00Z',
            last_used_at: '2025-01-20T14:30:00Z',
            device_type: 'mobile'
          },
          {
            id: 'cred-2',
            name: 'MacBook Pro',
            created_at: '2025-01-16T12:00:00Z',
            last_used_at: null,
            device_type: 'desktop'
          }
        ]
      })

      render(<AuthMethodsManagement />)

      // 等待 credentials 載入
      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
      })

      expect(screen.getByText('MacBook Pro')).toBeInTheDocument()

      // 應該顯示裝置圖示
      expect(screen.getByTestId('icon-mobile')).toBeInTheDocument()
      expect(screen.getByTestId('icon-desktop')).toBeInTheDocument()
    })

    it('hasPasskey=false 時應該顯示「新增 Passkey」按鈕', async () => {
      render(<AuthMethodsManagement />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.queryByText(/載入認證方式.../i)).not.toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /新增 Passkey/i })
      expect(addButton).toBeInTheDocument()
      expect(addButton).not.toBeDisabled()
    })

    it('應該顯示「新增 Passkey」按鈕即使已有 Passkey（允許多個）', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        hasOAuth: false,
        hasPasskey: true,
        hasPassword: false,
        oauthProvider: null,
        profilePicture: null,
        refreshAuthMethods: mockRefreshAuthMethods
      })

      ;(authAPI.getAuthMethods as jest.Mock).mockResolvedValue({
        has_oauth: false,
        has_passkey: true,
        has_password: false,
        passkey_credentials: [
          { id: 'cred-1', name: 'iPhone 15 Pro', created_at: '2025-01-15T10:00:00Z', last_used_at: null, device_type: 'mobile' }
        ]
      })

      render(<AuthMethodsManagement />)

      await waitFor(() => {
        expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
      })

      // 應該仍然顯示「新增 Passkey」按鈕
      expect(screen.getByRole('button', { name: /新增 Passkey/i })).toBeInTheDocument()
    })
  })

  describe('密碼認證方式顯示', () => {
    it('hasPassword=true 時應該顯示「已設定密碼」標籤', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        hasOAuth: false,
        hasPasskey: false,
        hasPassword: true,
        oauthProvider: null,
        profilePicture: null,
        refreshAuthMethods: mockRefreshAuthMethods
      })

      // Mock API 回應也要設定 has_password
      ;(authAPI.getAuthMethods as jest.Mock).mockResolvedValue({
        has_oauth: false,
        has_passkey: false,
        has_password: true,
        oauth_provider: null,
        profile_picture: null,
        passkey_credentials: []
      })

      render(<AuthMethodsManagement />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.queryByText(/載入認證方式.../i)).not.toBeInTheDocument()
      })

      expect(screen.getByText(/已設定密碼/i)).toBeInTheDocument()
      expect(screen.getByTestId('icon-lock')).toBeInTheDocument()
    })

    it('hasPassword=false 且 hasOAuth=true 時應該顯示「設定密碼」按鈕', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        hasOAuth: true,
        hasPasskey: false,
        hasPassword: false,
        oauthProvider: 'google',
        profilePicture: null,
        refreshAuthMethods: mockRefreshAuthMethods
      })

      // Mock API 回應
      ;(authAPI.getAuthMethods as jest.Mock).mockResolvedValue({
        has_oauth: true,
        has_passkey: false,
        has_password: false,
        oauth_provider: 'google',
        profile_picture: null,
        passkey_credentials: []
      })

      render(<AuthMethodsManagement />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.queryByText(/載入認證方式.../i)).not.toBeInTheDocument()
      })

      const setPasswordButton = screen.getByRole('button', { name: /設定密碼/i })
      expect(setPasswordButton).toBeInTheDocument()
      expect(setPasswordButton).not.toBeDisabled()
    })

    it('hasPassword=false 且 hasOAuth=false 時不應該顯示「設定密碼」按鈕', () => {
      render(<AuthMethodsManagement />)

      // 只有 OAuth 使用者才能設定備用密碼
      expect(screen.queryByRole('button', { name: /設定密碼/i })).not.toBeInTheDocument()
    })
  })

  describe('移除認證方式的安全驗證', () => {
    it('只有一種認證方式時，應該阻止移除操作', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        hasOAuth: true,
        hasPasskey: false,
        hasPassword: false,
        oauthProvider: 'google',
        profilePicture: null,
        refreshAuthMethods: mockRefreshAuthMethods
      })

      // Mock API 回應
      ;(authAPI.getAuthMethods as jest.Mock).mockResolvedValue({
        has_oauth: true,
        has_passkey: false,
        has_password: false,
        oauth_provider: 'google',
        profile_picture: null,
        passkey_credentials: []
      })

      render(<AuthMethodsManagement />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.queryByText(/載入認證方式.../i)).not.toBeInTheDocument()
      })

      // 找到移除按鈕（應該被禁用或不存在）
      const oauthCard = screen.getByText(/已連結 Google 帳號/i).closest('div')

      // 檢查是否有移除按鈕
      const removeButtons = within(oauthCard!).queryAllByRole('button', { name: /移除|取消連結/i })

      if (removeButtons.length > 0) {
        // 如果有移除按鈕，應該被禁用
        expect(removeButtons[0]).toBeDisabled()
      } else {
        // 或者完全不顯示移除按鈕
        expect(removeButtons).toHaveLength(0)
      }
    })

    it('有兩種認證方式時，應該允許移除其中一種', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        hasOAuth: true,
        hasPasskey: false,
        hasPassword: true,
        oauthProvider: 'google',
        profilePicture: null,
        refreshAuthMethods: mockRefreshAuthMethods
      })

      // Mock API 回應
      ;(authAPI.getAuthMethods as jest.Mock).mockResolvedValue({
        has_oauth: true,
        has_passkey: false,
        has_password: true,
        oauth_provider: 'google',
        profile_picture: null,
        passkey_credentials: []
      })

      render(<AuthMethodsManagement />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.queryByText(/載入認證方式.../i)).not.toBeInTheDocument()
      })

      // 找到「取消連結」按鈕（使用 getByText 更可靠）
      const removeButton = screen.getByRole('button', { name: /取消連結/i })

      // 應該被啟用
      expect(removeButton).not.toBeDisabled()
    })

    it('點擊移除按鈕時應該顯示確認對話框', async () => {
      const user = userEvent.setup()

      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        hasOAuth: true,
        hasPasskey: false,
        hasPassword: true,
        oauthProvider: 'google',
        profilePicture: null,
        refreshAuthMethods: mockRefreshAuthMethods
      })

      // Mock API 回應
      ;(authAPI.getAuthMethods as jest.Mock).mockResolvedValue({
        has_oauth: true,
        has_passkey: false,
        has_password: true,
        oauth_provider: 'google',
        profile_picture: null,
        passkey_credentials: []
      })

      render(<AuthMethodsManagement />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.queryByText(/載入認證方式.../i)).not.toBeInTheDocument()
      })

      // 點擊「取消連結」按鈕
      const removeButton = screen.getByRole('button', { name: /取消連結/i })
      await user.click(removeButton)

      // 應該顯示確認對話框
      await waitFor(() => {
        expect(screen.getByText(/確定要取消 Google 帳號連結/i)).toBeInTheDocument()
      })

      // 應該有「確定」和「取消」按鈕（在對話框內查找）
      const dialog = screen.getByText(/確定要取消 Google 帳號連結/i).closest('div')
      expect(within(dialog!).getByRole('button', { name: /確定/i })).toBeInTheDocument()
      expect(within(dialog!).getByRole('button', { name: /取消/i })).toBeInTheDocument()
    })

    it('在確認對話框中點擊「取消」應該關閉對話框', async () => {
      const user = userEvent.setup()

      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        hasOAuth: true,
        hasPasskey: false,
        hasPassword: true,
        oauthProvider: 'google',
        profilePicture: null,
        refreshAuthMethods: mockRefreshAuthMethods
      })

      // Mock API 回應
      ;(authAPI.getAuthMethods as jest.Mock).mockResolvedValue({
        has_oauth: true,
        has_passkey: false,
        has_password: true,
        oauth_provider: 'google',
        profile_picture: null,
        passkey_credentials: []
      })

      render(<AuthMethodsManagement />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.queryByText(/載入認證方式.../i)).not.toBeInTheDocument()
      })

      // 點擊「取消連結」按鈕
      const removeButton = screen.getByRole('button', { name: /取消連結/i })
      await user.click(removeButton)

      // 等待對話框出現
      await waitFor(() => {
        expect(screen.getByText(/確定要取消 Google 帳號連結/i)).toBeInTheDocument()
      })

      // 點擊取消按鈕（在對話框內查找）
      const dialog = screen.getByText(/確定要取消 Google 帳號連結/i).closest('div')
      const cancelButton = within(dialog!).getByRole('button', { name: /取消/i })
      await user.click(cancelButton)

      // 對話框應該消失
      await waitFor(() => {
        expect(screen.queryByText(/確定要取消 Google 帳號連結/i)).not.toBeInTheDocument()
      })

      // OAuth 仍然應該存在
      expect(screen.getByText(/已連結 Google 帳號/i)).toBeInTheDocument()
    })
  })

  describe('Pip-Boy 風格 UI', () => {
    it('應該使用廢土主題卡片標題', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        hasOAuth: true,
        hasPasskey: true,
        hasPassword: true,
        oauthProvider: 'google',
        profilePicture: null,
        refreshAuthMethods: mockRefreshAuthMethods
      })

      ;(authAPI.getAuthMethods as jest.Mock).mockResolvedValue({
        has_oauth: true,
        has_passkey: true,
        has_password: true,
        passkey_credentials: []
      })

      render(<AuthMethodsManagement />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.queryByText(/載入認證方式.../i)).not.toBeInTheDocument()
      })

      // 檢查廢土主題標題
      expect(screen.getByText(/Vault-Tec 授權連結/i)).toBeInTheDocument()
      expect(screen.getByText(/生物辨識掃描儀/i)).toBeInTheDocument()
      expect(screen.getByText(/傳統安全協議/i)).toBeInTheDocument()
    })

    it('主要 CTA 按鈕應該使用 Radiation Orange 樣式', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        hasOAuth: false,
        hasPasskey: false,
        hasPassword: false,
        oauthProvider: null,
        profilePicture: null,
        refreshAuthMethods: mockRefreshAuthMethods
      })

      render(<AuthMethodsManagement />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.queryByText(/載入認證方式.../i)).not.toBeInTheDocument()
      })

      // 「新增 Passkey」是主要 CTA
      const addPasskeyButton = screen.getByRole('button', { name: /新增 Passkey/i })

      // 檢查是否有對應的樣式 class（實際樣式會在實作時定義）
      expect(addPasskeyButton.className).toMatch(/btn-primary|bg-radiation-orange/i)
    })
  })

  describe('無障礙性', () => {
    it('所有圖示應該有正確的 aria-label', async () => {
      ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
        hasOAuth: true,
        hasPasskey: false,
        hasPassword: true,
        oauthProvider: 'google',
        profilePicture: null,
        refreshAuthMethods: mockRefreshAuthMethods
      })

      render(<AuthMethodsManagement />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.queryByText(/載入認證方式.../i)).not.toBeInTheDocument()
      })

      // Google 圖示（可能有多個）
      const googleIcons = screen.getAllByTestId('icon-google')
      expect(googleIcons.length).toBeGreaterThan(0)
      expect(googleIcons[0]).toHaveAttribute('aria-label', 'Google')

      // 密碼圖示
      const lockIcons = screen.getAllByTestId('icon-lock')
      expect(lockIcons.length).toBeGreaterThan(0)
      expect(lockIcons[0]).toHaveAttribute('aria-label', '密碼')
    })

    it('按鈕應該有描述性的 aria-label', async () => {
      render(<AuthMethodsManagement />)

      // 等待載入完成
      await waitFor(() => {
        expect(screen.queryByText(/載入認證方式.../i)).not.toBeInTheDocument()
      })

      // 檢查主要按鈕
      expect(screen.getByRole('button', { name: /連結 Google 帳號/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /新增 Passkey/i })).toBeInTheDocument()
    })
  })
})
