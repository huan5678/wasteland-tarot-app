/**
 * useOAuth Hook 測試
 */

import { describe, it, expect, beforeEach, afterEach, jest } from 'bun:test'
import { renderHook, waitFor } from '@testing-library/react'
import { useOAuth } from '../useOAuth'

// Mock Supabase client module
const mockSupabaseClient = {
  auth: {
    signInWithOAuth: jest.fn(),
    exchangeCodeForSession: jest.fn(),
  },
}

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

// Mock window.location (只在瀏覽器環境)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'location', {
    value: {
      origin: 'http://localhost:3000',
    },
    writable: true,
  })
}

describe('useOAuth', () => {
  let mockFetch: any

  beforeEach(() => {
    // Reset mocks
    mockSupabaseClient.auth.signInWithOAuth = jest.fn()
    mockSupabaseClient.auth.exchangeCodeForSession = jest.fn()

    // Mock global fetch
    mockFetch = jest.fn()
    global.fetch = mockFetch

    // Mock sound system (只在瀏覽器環境)
    if (typeof window !== 'undefined') {
      ;(window as any).WastelandTarot = {
        PipBoyInterface: {
          playSound: jest.fn(),
        },
      }
    }
  })

  afterEach(() => {
    // No jest.clearAllMocks in bun:test
  })

  describe('signInWithGoogle', () => {
    it('應該成功啟動 Google OAuth 流程', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null,
      })

      const { result } = renderHook(() => useOAuth())

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)

      const response = await result.current.signInWithGoogle()

      await waitFor(() => {
        expect(response.success).toBe(true)
      })

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
    })

    it('應該處理 OAuth 啟動失敗', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'OAuth provider not configured' },
      })

      const { result } = renderHook(() => useOAuth())

      const response = await result.current.signInWithGoogle()

      await waitFor(() => {
        expect(response.success).toBe(false)
        expect(response.error).toBe('OAuth provider not configured')
      })

      expect(result.current.error).toBe('OAuth provider not configured')
      expect((window as any).WastelandTarot.PipBoyInterface.playSound).toHaveBeenCalledWith('error-beep')
    })
  })

  describe('handleOAuthCallback', () => {
    it('應該成功處理 OAuth 回調', async () => {
      const mockCode = 'test-auth-code-123'
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
        },
      }

      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: {
          session: { access_token: 'token-123' },
          user: mockUser,
        },
        error: null,
      })

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            oauth_provider: 'google',
            profile_picture_url: 'https://example.com/avatar.jpg',
          },
        }),
      })

      const { result } = renderHook(() => useOAuth())

      const response = await result.current.handleOAuthCallback(mockCode)

      await waitFor(() => {
        expect(response.success).toBe(true)
      })

      expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith(mockCode)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/oauth/callback'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            code: mockCode,
            provider: 'google',
          }),
        })
      )

      expect(response.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        oauth_provider: 'google',
        profile_picture_url: 'https://example.com/avatar.jpg',
      })

      expect((window as any).WastelandTarot.PipBoyInterface.playSound).toHaveBeenCalledWith('login-success')
    })

    it('應該處理會話交換失敗', async () => {
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid authorization code' },
      })

      const { result } = renderHook(() => useOAuth())

      const response = await result.current.handleOAuthCallback('invalid-code')

      await waitFor(() => {
        expect(response.success).toBe(false)
        expect(response.error).toBe('Invalid authorization code')
      })

      expect(result.current.error).toBe('Invalid authorization code')
    })

    it('應該處理缺少 email 的情況', async () => {
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: {
          session: { access_token: 'token-123' },
          user: { id: 'user-123' }, // 無 email
        },
        error: null,
      })

      const { result } = renderHook(() => useOAuth())

      const response = await result.current.handleOAuthCallback('test-code')

      await waitFor(() => {
        expect(response.success).toBe(false)
        expect(response.error).toBe('Google 帳號未提供 Email')
      })
    })

    it('應該處理後端 API 錯誤', async () => {
      mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({
        data: {
          session: { access_token: 'token-123' },
          user: { id: 'user-123', email: 'test@example.com' },
        },
        error: null,
      })

      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ detail: '後端伺服器錯誤' }),
      })

      const { result } = renderHook(() => useOAuth())

      const response = await result.current.handleOAuthCallback('test-code')

      await waitFor(() => {
        expect(response.success).toBe(false)
        expect(response.error).toBe('後端伺服器錯誤')
      })
    })
  })

  describe('clearError', () => {
    it('應該清除錯誤訊息', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: { message: 'Test error' },
      })

      const { result } = renderHook(() => useOAuth())

      // 觸發錯誤
      await result.current.signInWithGoogle()

      await waitFor(() => {
        expect(result.current.error).toBe('Test error')
      })

      // 清除錯誤
      result.current.clearError()

      await waitFor(() => {
        expect(result.current.error).toBe(null)
      })
    })
  })
})
