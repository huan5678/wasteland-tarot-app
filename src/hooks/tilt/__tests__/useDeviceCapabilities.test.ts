/**
 * useDeviceCapabilities Hook 測試
 */

import { renderHook } from '@testing-library/react'
import { useDeviceCapabilities } from '../useDeviceCapabilities'

describe('useDeviceCapabilities', () => {
  // 保存原始值以便恢復
  const originalNavigator = global.navigator
  const originalMatchMedia = global.matchMedia

  afterEach(() => {
    // 恢復原始值
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true
    })
    global.matchMedia = originalMatchMedia
  })

  describe('isTouchDevice', () => {
    it('should detect touch device correctly using maxTouchPoints', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...originalNavigator,
          maxTouchPoints: 5
        },
        writable: true
      })

      const { result } = renderHook(() => useDeviceCapabilities())
      expect(result.current.isTouchDevice).toBe(true)
    })

    it('should detect non-touch device', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...originalNavigator,
          maxTouchPoints: 0
        },
        writable: true
      })

      const { result } = renderHook(() => useDeviceCapabilities())
      expect(result.current.isTouchDevice).toBe(false)
    })
  })

  describe('prefersReducedMotion', () => {
    it('should detect prefers-reduced-motion: reduce', () => {
      global.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }))

      const { result } = renderHook(() => useDeviceCapabilities())
      expect(result.current.prefersReducedMotion).toBe(true)
    })

    it('should detect no motion preference', () => {
      global.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }))

      const { result } = renderHook(() => useDeviceCapabilities())
      expect(result.current.prefersReducedMotion).toBe(false)
    })
  })

  describe('isIOS', () => {
    it('should detect iOS device', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
        },
        writable: true
      })

      const { result } = renderHook(() => useDeviceCapabilities())
      expect(result.current.isIOS).toBe(true)
    })

    it('should detect iPad as iOS', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)'
        },
        writable: true
      })

      const { result } = renderHook(() => useDeviceCapabilities())
      expect(result.current.isIOS).toBe(true)
    })

    it('should detect non-iOS device', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...originalNavigator,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        writable: true
      })

      const { result } = renderHook(() => useDeviceCapabilities())
      expect(result.current.isIOS).toBe(false)
    })
  })

  describe('hardwareConcurrency', () => {
    it('should detect hardware concurrency', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...originalNavigator,
          hardwareConcurrency: 8
        },
        writable: true
      })

      const { result } = renderHook(() => useDeviceCapabilities())
      expect(result.current.hardwareConcurrency).toBe(8)
    })

    it('should default to 4 if hardwareConcurrency is undefined', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...originalNavigator,
          hardwareConcurrency: undefined
        },
        writable: true
      })

      const { result } = renderHook(() => useDeviceCapabilities())
      expect(result.current.hardwareConcurrency).toBe(4)
    })
  })

  describe('deviceMemory', () => {
    it('should detect device memory if supported', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...originalNavigator,
          deviceMemory: 8
        },
        writable: true
      })

      const { result } = renderHook(() => useDeviceCapabilities())
      expect(result.current.deviceMemory).toBe(8)
    })

    it('should return undefined if device memory is not supported', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...originalNavigator,
          deviceMemory: undefined
        },
        writable: true
      })

      const { result } = renderHook(() => useDeviceCapabilities())
      expect(result.current.deviceMemory).toBeUndefined()
    })
  })

  describe('screenSize', () => {
    it('should detect mobile screen size', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...originalNavigator,
          maxTouchPoints: 5,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
        },
        writable: true
      })

      global.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(max-width: 640px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }))

      const { result } = renderHook(() => useDeviceCapabilities())
      expect(result.current.screenSize).toBe('mobile')
    })

    it('should detect tablet screen size', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...originalNavigator,
          maxTouchPoints: 5,
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)'
        },
        writable: true
      })

      global.matchMedia = jest.fn().mockImplementation((query) => {
        if (query === '(max-width: 1024px)') return { matches: true, media: query, onchange: null, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn() }
        if (query === '(max-width: 640px)') return { matches: false, media: query, onchange: null, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn() }
        return { matches: false, media: query, onchange: null, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn() }
      })

      const { result } = renderHook(() => useDeviceCapabilities())
      expect(result.current.screenSize).toBe('tablet')
    })

    it('should detect desktop screen size', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...originalNavigator,
          maxTouchPoints: 0,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        writable: true
      })

      global.matchMedia = jest.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }))

      const { result } = renderHook(() => useDeviceCapabilities())
      expect(result.current.screenSize).toBe('desktop')
    })
  })
})
