/**
 * Tests for authStore - Authentication Methods (authMethod, hasPasskey, hasPassword, hasOAuth)
 *
 * Testing Strategy (TDD - Red Light):
 * 1. Test authMethod state setting
 * 2. Test hasPasskey/hasPassword/hasOAuth state
 * 3. Test state updates after login
 * 4. Test refreshAuthMethods API call
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuthStore } from '../authStore'
import * as api from '../api'

// Mock API module
jest.mock('../api', () => ({
  authAPI: {
    getAuthMethods: jest.fn(),
    logout: jest.fn().mockResolvedValue({ message: 'success', is_oauth_user: false, oauth_provider: null }),
  },
}))

describe('authStore - Authentication Methods', () => {
  beforeEach(() => {
    // Reset store state
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.logout()
    })
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('authMethod state', () => {
    it('應該初始化 authMethod 為 null', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.authMethod).toBeNull()
    })

    it('應該能夠設定 authMethod 為 passkey', () => {
      const { result } = renderHook(() => useAuthStore())

      const mockUser = {
        id: '1',
        name: '廢土流浪者',
        email: 'wanderer@wasteland.com',
        created_at: new Date().toISOString(),
      }

      act(() => {
        result.current.setUser(mockUser, undefined, 'passkey')
      })

      expect(result.current.authMethod).toBe('passkey')
    })

    it('應該能夠設定 authMethod 為 password', () => {
      const { result } = renderHook(() => useAuthStore())

      const mockUser = {
        id: '1',
        name: '廢土流浪者',
        email: 'wanderer@wasteland.com',
        created_at: new Date().toISOString(),
      }

      act(() => {
        result.current.setUser(mockUser, undefined, 'password')
      })

      expect(result.current.authMethod).toBe('password')
    })

    it('應該能夠設定 authMethod 為 oauth', () => {
      const { result } = renderHook(() => useAuthStore())

      const mockUser = {
        id: '1',
        name: '廢土流浪者',
        email: 'wanderer@wasteland.com',
        created_at: new Date().toISOString(),
        oauthProvider: 'google',
      }

      act(() => {
        result.current.setUser(mockUser, undefined, 'oauth')
      })

      expect(result.current.authMethod).toBe('oauth')
    })

    it('登出後應該清除 authMethod', async () => {
      const { result } = renderHook(() => useAuthStore())

      const mockUser = {
        id: '1',
        name: '廢土流浪者',
        email: 'wanderer@wasteland.com',
        created_at: new Date().toISOString(),
      }

      act(() => {
        result.current.setUser(mockUser, undefined, 'passkey')
      })

      expect(result.current.authMethod).toBe('passkey')

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.authMethod).toBeNull()
    })
  })

  describe('hasPasskey, hasPassword, hasOAuth state', () => {
    it('應該初始化所有認證狀態為 false', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.hasPasskey).toBe(false)
      expect(result.current.hasPassword).toBe(false)
      expect(result.current.hasOAuth).toBe(false)
    })

    it('應該能夠更新 hasPasskey 狀態', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setAuthMethodsState({
          hasPasskey: true,
          hasPassword: false,
          hasOAuth: false,
        })
      })

      expect(result.current.hasPasskey).toBe(true)
      expect(result.current.hasPassword).toBe(false)
      expect(result.current.hasOAuth).toBe(false)
    })

    it('應該能夠更新多個認證狀態', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setAuthMethodsState({
          hasPasskey: true,
          hasPassword: true,
          hasOAuth: false,
        })
      })

      expect(result.current.hasPasskey).toBe(true)
      expect(result.current.hasPassword).toBe(true)
      expect(result.current.hasOAuth).toBe(false)
    })

    it('登出後應該清除所有認證狀態', async () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setAuthMethodsState({
          hasPasskey: true,
          hasPassword: true,
          hasOAuth: true,
        })
      })

      expect(result.current.hasPasskey).toBe(true)

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.hasPasskey).toBe(false)
      expect(result.current.hasPassword).toBe(false)
      expect(result.current.hasOAuth).toBe(false)
    })
  })

  describe('refreshAuthMethods', () => {
    it('應該能夠呼叫 API 並更新認證狀態', async () => {
      const mockApiResponse = {
        has_passkey: true,
        has_password: false,
        has_oauth: true,
      }

      ;(api.authAPI.getAuthMethods as jest.Mock).mockResolvedValue(mockApiResponse)

      const { result } = renderHook(() => useAuthStore())

      const mockUser = {
        id: '1',
        name: '廢土流浪者',
        email: 'wanderer@wasteland.com',
        created_at: new Date().toISOString(),
      }

      act(() => {
        result.current.setUser(mockUser, undefined, 'oauth')
      })

      await act(async () => {
        await result.current.refreshAuthMethods()
      })

      expect(api.authAPI.getAuthMethods).toHaveBeenCalledTimes(1)
      expect(result.current.hasPasskey).toBe(true)
      expect(result.current.hasPassword).toBe(false)
      expect(result.current.hasOAuth).toBe(true)
    })

    it('未登入時不應該呼叫 API', async () => {
      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.refreshAuthMethods()
      })

      expect(api.authAPI.getAuthMethods).not.toHaveBeenCalled()
    })

    it('API 錯誤時應該靜默處理', async () => {
      ;(api.authAPI.getAuthMethods as jest.Mock).mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useAuthStore())

      const mockUser = {
        id: '1',
        name: '廢土流浪者',
        email: 'wanderer@wasteland.com',
        created_at: new Date().toISOString(),
      }

      act(() => {
        result.current.setUser(mockUser, undefined, 'passkey')
      })

      // Should not throw
      await act(async () => {
        await result.current.refreshAuthMethods()
      })

      expect(api.authAPI.getAuthMethods).toHaveBeenCalledTimes(1)
      // State should remain unchanged
      expect(result.current.hasPasskey).toBe(false)
      expect(result.current.hasPassword).toBe(false)
      expect(result.current.hasOAuth).toBe(false)
    })
  })

  describe('Integration: login + authMethod', () => {
    it('Passkey 登入後應該設定正確的 authMethod', () => {
      const { result } = renderHook(() => useAuthStore())

      const mockUser = {
        id: '1',
        name: '廢土流浪者',
        email: 'wanderer@wasteland.com',
        created_at: new Date().toISOString(),
      }
      const tokenExpiresAt = Math.floor(Date.now() / 1000) + 3600

      act(() => {
        result.current.setUser(mockUser, tokenExpiresAt, 'passkey')
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.authMethod).toBe('passkey')
    })

    it('密碼登入後應該設定正確的 authMethod', async () => {
      const { result } = renderHook(() => useAuthStore())

      const mockResponse = {
        user: {
          id: '1',
          name: '廢土流浪者',
          email: 'wanderer@wasteland.com',
          created_at: new Date().toISOString(),
        },
        token_expires_at: Math.floor(Date.now() / 1000) + 3600,
      }

      // Note: 由於 login() 呼叫真實的 API，這裡只測試 setUser
      // 實際的 login 流程會在 integration tests 中測試

      act(() => {
        result.current.setUser(mockResponse.user, mockResponse.token_expires_at, 'password')
      })

      expect(result.current.user).toEqual(mockResponse.user)
      expect(result.current.authMethod).toBe('password')
    })
  })

  describe('Persistence', () => {
    it('authMethod 應該被 persist', () => {
      const { result } = renderHook(() => useAuthStore())

      const mockUser = {
        id: '1',
        name: '廢土流浪者',
        email: 'wanderer@wasteland.com',
        created_at: new Date().toISOString(),
      }

      act(() => {
        result.current.setUser(mockUser, undefined, 'passkey')
      })

      // Check localStorage (note: zustand persist key is 'auth-store')
      const stored = localStorage.getItem('auth-store')
      expect(stored).toBeTruthy()

      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed.state.authMethod).toBe('passkey')
      }
    })

    it('hasPasskey/hasPassword/hasOAuth 應該被 persist', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setAuthMethodsState({
          hasPasskey: true,
          hasPassword: false,
          hasOAuth: true,
        })
      })

      const stored = localStorage.getItem('auth-store')
      expect(stored).toBeTruthy()

      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed.state.hasPasskey).toBe(true)
        expect(parsed.state.hasPassword).toBe(false)
        expect(parsed.state.hasOAuth).toBe(true)
      }
    })
  })
})
