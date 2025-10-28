/**
 * usePasskeyUpgradePrompt Hook 單元測試 (Task 6.1)
 *
 * 測試 Passkey 升級引導 Hook 的智能提醒邏輯
 *
 * 測試範圍：
 * - 首次 OAuth 登入且 hasPasskey=false 時顯示 modal
 * - skipCount < 3 且距離上次跳過超過 7 天時再次顯示
 * - skipCount >= 3 時不再自動顯示
 * - 點擊「立即設定 Passkey」觸發註冊流程
 * - 點擊「稍後再說」更新 skipCount 和 lastSkippedAt
 * - Passkey 註冊成功後更新 authStore.hasPasskey=true
 * - 瀏覽器不支援 WebAuthn 時顯示訊息並自動關閉
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { usePasskeyUpgradePrompt } from './usePasskeyUpgradePrompt'
import { useAuthStore } from '@/lib/authStore'
import * as webauthnAPI from '@/lib/webauthnAPI'
import * as webauthn from '@/lib/webauthn'

// Mock dependencies
jest.mock('@/lib/authStore', () => ({
  useAuthStore: jest.fn()
}))
jest.mock('@/lib/webauthnAPI', () => ({
  getRegistrationOptions: jest.fn(),
  verifyRegistration: jest.fn(),
  registerPasskey: jest.fn()
}))
jest.mock('@/lib/webauthn', () => ({
  isWebAuthnSupported: jest.fn(),
  startRegistration: jest.fn(),
  base64URLEncode: jest.fn((buf) => 'mock-base64'),
  base64URLDecode: jest.fn((str) => new ArrayBuffer(8))
}))

// Mock navigator.credentials
const mockNavigatorCredentials = {
  create: jest.fn(),
  get: jest.fn()
}

describe('usePasskeyUpgradePrompt', () => {
  // Mock authStore
  const mockSetAuthMethodsState = jest.fn()
  const mockAuthStore = {
    hasPasskey: false,
    hasPassword: true,
    hasOAuth: false,
    setAuthMethodsState: mockSetAuthMethodsState
  }

  // Internal storage for localStorage mock
  const storageData: Record<string, string> = {}

  beforeAll(() => {
    // Ensure global window exists
    if (typeof window === 'undefined') {
      (global as any).window = {}
    }

    // Ensure localStorage exists
    if (!global.localStorage) {
      global.localStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn(),
      } as any
    }

    // Setup localStorage mock implementation
    ;(global.localStorage.getItem as jest.Mock).mockImplementation((key: string) => storageData[key] || null)
    ;(global.localStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
      storageData[key] = value
    })
    ;(global.localStorage.removeItem as jest.Mock).mockImplementation((key: string) => {
      delete storageData[key]
    })
    ;(global.localStorage.clear as jest.Mock).mockImplementation(() => {
      Object.keys(storageData).forEach(key => delete storageData[key])
    })

    // Ensure window.navigator exists
    if (!window.navigator) {
      (window as any).navigator = {}
    }

    // Ensure window.PublicKeyCredential exists
    if (!window.PublicKeyCredential) {
      (window as any).PublicKeyCredential = jest.fn()
    }

    // Setup navigator.credentials mock
    Object.defineProperty(window.navigator, 'credentials', {
      value: mockNavigatorCredentials,
      writable: true,
      configurable: true
    })
  })

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    // Clear localStorage data
    Object.keys(storageData).forEach(key => delete storageData[key])

    // Setup authStore mock
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue(mockAuthStore)

    // Setup webauthn mocks - default to supported
    ;(webauthn.isWebAuthnSupported as jest.Mock).mockReturnValue(true)

    // Reset navigator.credentials mocks
    mockNavigatorCredentials.create.mockClear()
    mockNavigatorCredentials.get.mockClear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('智能提醒邏輯', () => {
    it('首次 OAuth 登入且 hasPasskey=false 時應顯示 modal', () => {
      // Arrange
      const props = {
        hasPasskey: false,
        authMethod: 'oauth' as const,
        lastSkippedAt: null,
        skipCount: 0
      }

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      // Assert
      expect(result.current.showModal).toBe(true)
    })

    it('hasPasskey=true 時不應顯示 modal', () => {
      // Arrange
      const props = {
        hasPasskey: true,
        authMethod: 'oauth' as const,
        lastSkippedAt: null,
        skipCount: 0
      }

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      // Assert
      expect(result.current.showModal).toBe(false)
    })

    it('skipCount < 3 且距離上次跳過超過 7 天時應再次顯示', () => {
      // Arrange
      const eightDaysAgo = new Date()
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8)

      const props = {
        hasPasskey: false,
        authMethod: 'oauth' as const,
        lastSkippedAt: eightDaysAgo.toISOString(),
        skipCount: 2
      }

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      // Assert
      expect(result.current.showModal).toBe(true)
    })

    it('skipCount < 3 但距離上次跳過未超過 7 天時不應顯示', () => {
      // Arrange
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      const props = {
        hasPasskey: false,
        authMethod: 'oauth' as const,
        lastSkippedAt: threeDaysAgo.toISOString(),
        skipCount: 1
      }

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      // Assert
      expect(result.current.showModal).toBe(false)
    })

    it('skipCount >= 3 時不應再自動顯示（永久停止）', () => {
      // Arrange
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

      const props = {
        hasPasskey: false,
        authMethod: 'oauth' as const,
        lastSkippedAt: tenDaysAgo.toISOString(),
        skipCount: 3
      }

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      // Assert
      expect(result.current.showModal).toBe(false)
    })

    it('非 OAuth 認證方式不應顯示 modal', () => {
      // Arrange
      const props = {
        hasPasskey: false,
        authMethod: 'password' as const,
        lastSkippedAt: null,
        skipCount: 0
      }

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      // Assert
      expect(result.current.showModal).toBe(false)
    })
  })

  describe('Passkey 註冊流程', () => {
    it('點擊「立即設定 Passkey」應觸發 WebAuthn 註冊流程', async () => {
      // Arrange
      const props = {
        hasPasskey: false,
        authMethod: 'oauth' as const,
        lastSkippedAt: null,
        skipCount: 0
      }

      const mockRegistrationOptions = {
        challenge: 'mock-challenge',
        rp: { name: 'Wasteland Tarot', id: 'localhost' },
        user: {
          id: 'mock-user-id',
          name: 'test@example.com',
          displayName: 'Test User'
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        timeout: 60000,
        attestation: 'none' as const
      }

      const mockCredential = {
        id: 'mock-credential-id',
        rawId: 'mock-raw-id',
        response: {
          clientDataJSON: 'mock-client-data',
          attestationObject: 'mock-attestation',
          transports: []
        },
        type: 'public-key',
        clientExtensionResults: {},
        authenticatorAttachment: 'platform'
      }

      ;(webauthnAPI.getRegistrationOptions as jest.Mock).mockResolvedValue(mockRegistrationOptions)
      ;(webauthn.startRegistration as jest.Mock).mockResolvedValue(mockCredential)
      ;(webauthnAPI.verifyRegistration as jest.Mock).mockResolvedValue({ success: true, credential_id: 'mock-cred-id' })

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      await act(async () => {
        await result.current.handleSetupPasskey()
      })

      // Assert
      expect(webauthnAPI.getRegistrationOptions).toHaveBeenCalled()
      expect(webauthn.startRegistration).toHaveBeenCalledWith(mockRegistrationOptions)
      expect(webauthnAPI.verifyRegistration).toHaveBeenCalledWith(mockCredential, 'My Passkey')
    })

    it('Passkey 註冊成功後應更新 authStore.hasPasskey=true', async () => {
      // Arrange
      const props = {
        hasPasskey: false,
        authMethod: 'oauth' as const,
        lastSkippedAt: null,
        skipCount: 0
      }

      const mockRegistrationOptions = {
        challenge: 'mock-challenge',
        rp: { name: 'Wasteland Tarot', id: 'localhost' },
        user: {
          id: 'mock-user-id',
          name: 'test@example.com',
          displayName: 'Test User'
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        timeout: 60000,
        attestation: 'none' as const
      }

      const mockCredential = {
        id: 'mock-credential-id',
        rawId: 'mock-raw-id',
        response: {
          clientDataJSON: 'mock-client-data',
          attestationObject: 'mock-attestation',
          transports: []
        },
        type: 'public-key',
        clientExtensionResults: {},
        authenticatorAttachment: 'platform'
      }

      ;(webauthnAPI.getRegistrationOptions as jest.Mock).mockResolvedValue(mockRegistrationOptions)
      ;(webauthn.startRegistration as jest.Mock).mockResolvedValue(mockCredential)
      ;(webauthnAPI.verifyRegistration as jest.Mock).mockResolvedValue({ success: true, credential_id: 'mock-cred-id' })

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      await act(async () => {
        await result.current.handleSetupPasskey()
      })

      // Assert
      await waitFor(() => {
        expect(mockSetAuthMethodsState).toHaveBeenCalledWith({
          hasPasskey: true,
          hasPassword: true,
          hasOAuth: false
        })
      })
    })

    it('Passkey 註冊成功後應關閉 modal', async () => {
      // Arrange
      const props = {
        hasPasskey: false,
        authMethod: 'oauth' as const,
        lastSkippedAt: null,
        skipCount: 0
      }

      const mockRegistrationOptions = {
        challenge: 'mock-challenge',
        rp: { name: 'Wasteland Tarot', id: 'localhost' },
        user: {
          id: 'mock-user-id',
          name: 'test@example.com',
          displayName: 'Test User'
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        timeout: 60000,
        attestation: 'none' as const
      }

      const mockCredential = {
        id: 'mock-credential-id',
        rawId: 'mock-raw-id',
        response: {
          clientDataJSON: 'mock-client-data',
          attestationObject: 'mock-attestation',
          transports: []
        },
        type: 'public-key',
        clientExtensionResults: {},
        authenticatorAttachment: 'platform'
      }

      ;(webauthnAPI.getRegistrationOptions as jest.Mock).mockResolvedValue(mockRegistrationOptions)
      ;(webauthn.startRegistration as jest.Mock).mockResolvedValue(mockCredential)
      ;(webauthnAPI.verifyRegistration as jest.Mock).mockResolvedValue({ success: true, credential_id: 'mock-cred-id' })

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      expect(result.current.showModal).toBe(true)

      await act(async () => {
        await result.current.handleSetupPasskey()
      })

      // Assert
      await waitFor(() => {
        expect(result.current.showModal).toBe(false)
      })
    })
  })

  describe('跳過引導功能', () => {
    it('點擊「稍後再說」應更新 skipCount', () => {
      // Arrange
      const props = {
        hasPasskey: false,
        authMethod: 'oauth' as const,
        lastSkippedAt: null,
        skipCount: 0
      }

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      act(() => {
        result.current.handleSkip()
      })

      // Assert
      const storedData = JSON.parse(storageData['passkey-upgrade-prompt'] || '{}')
      expect(storedData.skipCount).toBe(1)
    })

    it('點擊「稍後再說」應更新 lastSkippedAt', () => {
      // Arrange
      const props = {
        hasPasskey: false,
        authMethod: 'oauth' as const,
        lastSkippedAt: null,
        skipCount: 0
      }

      const beforeSkip = new Date()

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      act(() => {
        result.current.handleSkip()
      })

      const afterSkip = new Date()

      // Assert
      const storedData = JSON.parse(storageData['passkey-upgrade-prompt'] || '{}')
      const lastSkippedAt = new Date(storedData.lastSkippedAt)

      expect(lastSkippedAt.getTime()).toBeGreaterThanOrEqual(beforeSkip.getTime())
      expect(lastSkippedAt.getTime()).toBeLessThanOrEqual(afterSkip.getTime())
    })

    it('點擊「稍後再說」應關閉 modal', () => {
      // Arrange
      const props = {
        hasPasskey: false,
        authMethod: 'oauth' as const,
        lastSkippedAt: null,
        skipCount: 0
      }

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      expect(result.current.showModal).toBe(true)

      act(() => {
        result.current.handleSkip()
      })

      // Assert
      expect(result.current.showModal).toBe(false)
    })

    it('skipCount 應該只增不減（持久化）', () => {
      // Arrange
      storageData['passkey-upgrade-prompt'] = JSON.stringify({
        skipCount: 2,
        lastSkippedAt: new Date().toISOString()
      })

      const props = {
        hasPasskey: false,
        authMethod: 'oauth' as const,
        lastSkippedAt: null,
        skipCount: 0
      }

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      act(() => {
        result.current.handleSkip()
      })

      // Assert
      const storedData = JSON.parse(storageData['passkey-upgrade-prompt'] || '{}')
      expect(storedData.skipCount).toBe(3)
    })
  })

  describe('瀏覽器不支援 WebAuthn', () => {
    it('瀏覽器不支援時應顯示錯誤訊息', async () => {
      // Arrange
      // Mock isWebAuthnSupported to return false
      ;(webauthn.isWebAuthnSupported as jest.Mock).mockReturnValue(false)

      Object.defineProperty(window.navigator, 'credentials', {
        value: undefined,
        writable: true,
        configurable: true
      })

      const props = {
        hasPasskey: false,
        authMethod: 'oauth' as const,
        lastSkippedAt: null,
        skipCount: 0
      }

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      await act(async () => {
        await result.current.handleSetupPasskey()
      })

      // Assert
      expect(result.current.error).toBeTruthy()
      expect(result.current.error).toContain('不支援')
    })

    it('瀏覽器不支援時 modal 應自動關閉（5 秒後）', async () => {
      // Arrange
      jest.useFakeTimers()

      // Mock isWebAuthnSupported to return false
      ;(webauthn.isWebAuthnSupported as jest.Mock).mockReturnValue(false)

      Object.defineProperty(window.navigator, 'credentials', {
        value: undefined,
        writable: true,
        configurable: true
      })

      const props = {
        hasPasskey: false,
        authMethod: 'oauth' as const,
        lastSkippedAt: null,
        skipCount: 0
      }

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      expect(result.current.showModal).toBe(true)

      await act(async () => {
        await result.current.handleSetupPasskey()
      })

      // Fast-forward 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      // Assert
      expect(result.current.showModal).toBe(false)

      jest.useRealTimers()
    })
  })

  describe('錯誤處理', () => {
    it('WebAuthn 註冊失敗時應顯示錯誤訊息', async () => {
      // Arrange
      const props = {
        hasPasskey: false,
        authMethod: 'oauth' as const,
        lastSkippedAt: null,
        skipCount: 0
      }

      // 確保 WebAuthn 支援
      Object.defineProperty(window.navigator, 'credentials', {
        value: mockNavigatorCredentials,
        writable: true,
        configurable: true
      })

      ;(webauthnAPI.getRegistrationOptions as jest.Mock).mockRejectedValue(
        new Error('註冊失敗')
      )

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      await act(async () => {
        await result.current.handleSetupPasskey()
      })

      // Assert
      expect(result.current.error).toBeTruthy()
      expect(result.current.error).toContain('註冊失敗')
    })

    it('錯誤發生時 modal 不應關閉（允許重試）', async () => {
      // Arrange
      const props = {
        hasPasskey: false,
        authMethod: 'oauth' as const,
        lastSkippedAt: null,
        skipCount: 0
      }

      ;(webauthnAPI.getRegistrationOptions as jest.Mock).mockRejectedValue(
        new Error('網路錯誤')
      )

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      expect(result.current.showModal).toBe(true)

      await act(async () => {
        await result.current.handleSetupPasskey()
      })

      // Assert
      expect(result.current.showModal).toBe(true)
      expect(result.current.error).toBeTruthy()
    })

    it('使用者取消生物辨識時應保持 modal 開啟', async () => {
      // Arrange
      const props = {
        hasPasskey: false,
        authMethod: 'oauth' as const,
        lastSkippedAt: null,
        skipCount: 0
      }

      const mockRegistrationOptions = {
        challenge: 'mock-challenge',
        rp: { name: 'Wasteland Tarot', id: 'localhost' },
        user: {
          id: 'mock-user-id',
          name: 'test@example.com',
          displayName: 'Test User'
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        timeout: 60000,
        attestation: 'none' as const
      }

      ;(webauthnAPI.getRegistrationOptions as jest.Mock).mockResolvedValue(mockRegistrationOptions)
      ;(webauthn.startRegistration as jest.Mock).mockRejectedValue(
        new Error('User cancelled')
      )

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      expect(result.current.showModal).toBe(true)

      await act(async () => {
        await result.current.handleSetupPasskey()
      })

      // Assert
      expect(result.current.showModal).toBe(true)
    })
  })

  describe('isLoading 狀態', () => {
    it('註冊過程中 isLoading 應為 true', async () => {
      // Arrange
      const props = {
        hasPasskey: false,
        authMethod: 'oauth' as const,
        lastSkippedAt: null,
        skipCount: 0
      }

      let resolveRegistration: () => void
      const registrationPromise = new Promise<any>((resolve) => {
        resolveRegistration = () => resolve({
          challenge: 'mock-challenge',
          rp: { name: 'Wasteland Tarot', id: 'localhost' },
          user: {
            id: 'mock-user-id',
            name: 'test@example.com',
            displayName: 'Test User'
          }
        })
      })

      ;(webauthnAPI.getRegistrationOptions as jest.Mock).mockReturnValue(registrationPromise)

      // Act
      const { result } = renderHook(() => usePasskeyUpgradePrompt(props))

      // Start registration
      act(() => {
        result.current.handleSetupPasskey()
      })

      // Assert - should be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolve the promise
      act(() => {
        resolveRegistration!()
      })

      // Assert - should no longer be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })
})
