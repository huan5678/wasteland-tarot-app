/**
 * Tests for authStore (Zustand store)
 */
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '../authStore'

describe('authStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.logout()
    })
    localStorage.clear()
  })

  it('應該初始化為未登入狀態', () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
  })

  it('應該能夠登入並設定用戶資料', () => {
    const { result } = renderHook(() => useAuthStore())

    const mockUser = {
      id: '1',
      username: '廢土流浪者',
      email: 'wanderer@wasteland.com',
    }
    const mockToken = 'mock-token-123'

    act(() => {
      result.current.login(mockUser, mockToken)
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.token).toBe(mockToken)
  })

  it('應該能夠登出並清除用戶資料', () => {
    const { result } = renderHook(() => useAuthStore())

    const mockUser = {
      id: '1',
      username: '廢土流浪者',
      email: 'wanderer@wasteland.com',
    }

    act(() => {
      result.current.login(mockUser, 'token-123')
    })

    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
  })

  it('應該能夠更新用戶資料', () => {
    const { result } = renderHook(() => useAuthStore())

    const mockUser = {
      id: '1',
      username: '廢土流浪者',
      email: 'wanderer@wasteland.com',
    }

    act(() => {
      result.current.login(mockUser, 'token-123')
    })

    const updatedData = {
      username: '避難所居民',
      email: 'vault@wasteland.com',
    }

    act(() => {
      result.current.updateUser(updatedData)
    })

    expect(result.current.user).toEqual({
      ...mockUser,
      ...updatedData,
    })
  })

  it('應該能夠設定載入狀態', () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.isLoading).toBe(false)

    act(() => {
      result.current.setLoading(true)
    })

    expect(result.current.isLoading).toBe(true)

    act(() => {
      result.current.setLoading(false)
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('應該能夠設定錯誤訊息', () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.error).toBeNull()

    act(() => {
      result.current.setError('登入失敗')
    })

    expect(result.current.error).toBe('登入失敗')

    act(() => {
      result.current.setError(null)
    })

    expect(result.current.error).toBeNull()
  })

  it('應該能夠重置狀態', () => {
    const { result } = renderHook(() => useAuthStore())

    const mockUser = {
      id: '1',
      username: '廢土流浪者',
      email: 'wanderer@wasteland.com',
    }

    act(() => {
      result.current.login(mockUser, 'token-123')
      result.current.setError('某個錯誤')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.error).toBe('某個錯誤')

    act(() => {
      result.current.reset()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })
})
