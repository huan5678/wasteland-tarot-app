/**
 * Tests for Service Worker utilities
 */
import {
  registerServiceWorker,
  unregisterServiceWorker,
  checkServiceWorkerStatus,
  clearCache,
  getCacheSize,
} from '../serviceWorker'

describe('Service Worker utilities', () => {
  let mockRegistration: any
  let mockServiceWorker: any

  beforeEach(() => {
    mockRegistration = {
      update: jest.fn(),
      unregister: jest.fn().mockResolvedValue(true),
      installing: null,
      addEventListener: jest.fn(),
    }

    mockServiceWorker = {
      register: jest.fn().mockResolvedValue(mockRegistration),
      getRegistration: jest.fn().mockResolvedValue(mockRegistration),
      controller: {},
    }

    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: mockServiceWorker,
    })

    // 設定測試環境為 production
    process.env.NODE_ENV = 'production'
  })

  afterEach(() => {
    jest.clearAllMocks()
    delete process.env.NODE_ENV
  })

  describe('registerServiceWorker', () => {
    it('應該在 production 環境註冊 Service Worker', async () => {
      await registerServiceWorker()

      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
      })
    })

    it('應該不在非 production 環境註冊 Service Worker', async () => {
      process.env.NODE_ENV = 'development'

      await registerServiceWorker()

      expect(mockServiceWorker.register).not.toHaveBeenCalled()
    })

    it('應該設定定期更新檢查', async () => {
      jest.useFakeTimers()

      await registerServiceWorker()

      // 檢查 60 分鐘後是否會呼叫 update
      jest.advanceTimersByTime(60 * 60 * 1000)

      expect(mockRegistration.update).toHaveBeenCalled()

      jest.useRealTimers()
    })

    it('應該處理註冊失敗', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      mockServiceWorker.register.mockRejectedValue(new Error('註冊失敗'))

      await registerServiceWorker()

      expect(consoleError).toHaveBeenCalledWith(
        'Service Worker registration failed:',
        expect.any(Error)
      )

      consoleError.mockRestore()
    })
  })

  describe('unregisterServiceWorker', () => {
    it('應該取消註冊 Service Worker', async () => {
      await unregisterServiceWorker()

      expect(mockServiceWorker.getRegistration).toHaveBeenCalled()
      expect(mockRegistration.unregister).toHaveBeenCalled()
    })

    it('應該處理沒有註冊的情況', async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(undefined)

      await unregisterServiceWorker()

      expect(mockRegistration.unregister).not.toHaveBeenCalled()
    })
  })

  describe('checkServiceWorkerStatus', () => {
    it('應該回傳支援且已註冊的狀態', async () => {
      const status = await checkServiceWorkerStatus()

      expect(status).toEqual({
        supported: true,
        registered: true,
        controller: true,
      })
    })

    it('應該回傳未註冊的狀態', async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(undefined)
      mockServiceWorker.controller = null

      const status = await checkServiceWorkerStatus()

      expect(status).toEqual({
        supported: true,
        registered: false,
        controller: false,
      })
    })

    it('應該處理不支援 Service Worker 的情況', async () => {
      // @ts-ignore
      delete navigator.serviceWorker

      const status = await checkServiceWorkerStatus()

      expect(status).toEqual({
        supported: false,
        registered: false,
        controller: false,
      })
    })
  })

  describe('clearCache', () => {
    let mockCaches: any

    beforeEach(() => {
      mockCaches = {
        delete: jest.fn().mockResolvedValue(true),
        keys: jest.fn().mockResolvedValue(['cache-v1', 'cache-v2']),
      }

      Object.defineProperty(window, 'caches', {
        writable: true,
        value: mockCaches,
      })
    })

    it('應該清除指定的快取', async () => {
      await clearCache('cache-v1')

      expect(mockCaches.delete).toHaveBeenCalledWith('cache-v1')
    })

    it('應該清除所有快取', async () => {
      await clearCache()

      expect(mockCaches.keys).toHaveBeenCalled()
      expect(mockCaches.delete).toHaveBeenCalledWith('cache-v1')
      expect(mockCaches.delete).toHaveBeenCalledWith('cache-v2')
    })
  })

  describe('getCacheSize', () => {
    it('應該回傳快取大小資訊', async () => {
      const mockEstimate = {
        usage: 5242880, // 5 MB
        quota: 52428800, // 50 MB
      }

      Object.defineProperty(navigator, 'storage', {
        writable: true,
        value: {
          estimate: jest.fn().mockResolvedValue(mockEstimate),
        },
      })

      const size = await getCacheSize()

      expect(size).toEqual({
        usage: 5242880,
        quota: 52428800,
        usageInMB: '5.00',
        quotaInMB: '50.00',
      })
    })

    it('應該處理不支援 storage API 的情況', async () => {
      // @ts-ignore
      delete navigator.storage

      const size = await getCacheSize()

      expect(size).toBeNull()
    })
  })
})
