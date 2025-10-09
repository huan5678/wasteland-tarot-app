/**
 * use3DTilt Hook Unit Tests
 * 測試 3D 傾斜效果核心 Hook 的各種功能
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { use3DTilt } from '../use3DTilt'
import * as browserCompat from '@/utils/browserCompat'

// Mock dependencies
jest.mock('../useDeviceCapabilities')
jest.mock('../useGyroscopePermission')
jest.mock('../useIntersectionTilt')
jest.mock('@/contexts/TiltConfigContext')
jest.mock('@/utils/browserCompat')

const mockUseDeviceCapabilities = require('../useDeviceCapabilities')
const mockUseGyroscopePermission = require('../useGyroscopePermission')
const mockUseIntersectionTilt = require('../useIntersectionTilt')
const mockUseTiltConfigOptional = require('@/contexts/TiltConfigContext')

describe('use3DTilt', () => {
  beforeEach(() => {
    // 預設 mock 值
    mockUseDeviceCapabilities.useDeviceCapabilities.mockReturnValue({
      isTouchDevice: false,
      prefersReducedMotion: false,
      isIOS: false
    })

    mockUseGyroscopePermission.useGyroscopePermission.mockReturnValue({
      status: 'unsupported',
      requestPermission: jest.fn(),
      error: null
    })

    mockUseIntersectionTilt.useIntersectionTilt.mockReturnValue({
      isIntersecting: true,
      observerRef: { current: null }
    })

    mockUseTiltConfigOptional.useTiltConfigOptional.mockReturnValue(null)

    // Mock supports3DTransforms to return true by default
    jest.spyOn(browserCompat, 'supports3DTransforms').mockReturnValue(true)

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn((cb) => {
      cb(0)
      return 0
    })
    global.cancelAnimationFrame = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('初始化', () => {
    it('應該返回必要的 API', () => {
      const { result } = renderHook(() => use3DTilt())

      expect(result.current).toHaveProperty('tiltRef')
      expect(result.current).toHaveProperty('tiltHandlers')
      expect(result.current).toHaveProperty('tiltState')
      expect(result.current).toHaveProperty('tiltStyle')
      expect(result.current).toHaveProperty('glossStyle')
      expect(result.current).toHaveProperty('gyroscopePermission')
    })

    it('初始狀態應該是水平（無傾斜）', () => {
      const { result } = renderHook(() => use3DTilt())

      expect(result.current.tiltState).toEqual({
        rotateX: 0,
        rotateY: 0,
        isActive: false,
        isTilted: false,
        source: null
      })
    })

    it('tiltHandlers 應該包含滑鼠事件處理器', () => {
      const { result } = renderHook(() => use3DTilt())

      expect(result.current.tiltHandlers).toHaveProperty('onMouseEnter')
      expect(result.current.tiltHandlers).toHaveProperty('onMouseMove')
      expect(result.current.tiltHandlers).toHaveProperty('onMouseLeave')
      expect(typeof result.current.tiltHandlers.onMouseEnter).toBe('function')
      expect(typeof result.current.tiltHandlers.onMouseMove).toBe('function')
      expect(typeof result.current.tiltHandlers.onMouseLeave).toBe('function')
    })
  })

  describe('滑鼠追蹤計算', () => {
    it('滑鼠在中心位置時應產生零角度', () => {
      const { result } = renderHook(() => use3DTilt({ tiltMaxAngle: 15 }))

      // Mock getBoundingClientRect
      const mockRef = {
        current: {
          getBoundingClientRect: jest.fn(() => ({
            left: 0,
            top: 0,
            width: 200,
            height: 300,
            right: 200,
            bottom: 300
          }))
        }
      }

      // 將 ref 設為 mock
      ;(result.current.tiltRef as any).current = mockRef.current

      // 觸發 mouseEnter
      act(() => {
        result.current.tiltHandlers.onMouseEnter()
      })

      // 滑鼠在中心 (100, 150)
      const mouseEvent = {
        clientX: 100,
        clientY: 150
      } as React.MouseEvent

      act(() => {
        result.current.tiltHandlers.onMouseMove(mouseEvent)
      })

      // 使用 waitFor 等待 RAF 完成
      waitFor(() => {
        expect(result.current.tiltState.rotateX).toBeCloseTo(0, 1)
        expect(result.current.tiltState.rotateY).toBeCloseTo(0, 1)
        expect(result.current.tiltState.isTilted).toBe(true)
      })
    })

    it('滑鼠在右上角時應產生正確的角度', () => {
      const { result } = renderHook(() => use3DTilt({ tiltMaxAngle: 15 }))

      const mockRef = {
        current: {
          getBoundingClientRect: jest.fn(() => ({
            left: 0,
            top: 0,
            width: 200,
            height: 300,
            right: 200,
            bottom: 300
          }))
        }
      }

      ;(result.current.tiltRef as any).current = mockRef.current

      act(() => {
        result.current.tiltHandlers.onMouseEnter()
      })

      // 滑鼠在右上角 (200, 0)
      const mouseEvent = {
        clientX: 200,
        clientY: 0
      } as React.MouseEvent

      act(() => {
        result.current.tiltHandlers.onMouseMove(mouseEvent)
      })

      waitFor(() => {
        // rotateY 應該是正值（右傾）
        expect(result.current.tiltState.rotateY).toBeGreaterThan(0)
        expect(result.current.tiltState.rotateY).toBeLessThanOrEqual(15)

        // rotateX 應該是正值（向上傾）
        expect(result.current.tiltState.rotateX).toBeGreaterThan(0)
        expect(result.current.tiltState.rotateX).toBeLessThanOrEqual(15)
      })
    })

    it('滑鼠離開時應復原至零角度', () => {
      const { result } = renderHook(() => use3DTilt())

      const mockRef = {
        current: {
          getBoundingClientRect: jest.fn(() => ({
            left: 0,
            top: 0,
            width: 200,
            height: 300,
            right: 200,
            bottom: 300
          }))
        }
      }

      ;(result.current.tiltRef as any).current = mockRef.current

      act(() => {
        result.current.tiltHandlers.onMouseEnter()
      })

      act(() => {
        result.current.tiltHandlers.onMouseMove({
          clientX: 200,
          clientY: 0
        } as React.MouseEvent)
      })

      act(() => {
        result.current.tiltHandlers.onMouseLeave()
      })

      expect(result.current.tiltState.rotateX).toBe(0)
      expect(result.current.tiltState.rotateY).toBe(0)
      expect(result.current.tiltState.isTilted).toBe(false)
      expect(result.current.tiltState.isActive).toBe(false)
    })
  })

  describe('Props 配置', () => {
    it('enable3DTilt=false 應停用效果', () => {
      const { result } = renderHook(() => use3DTilt({ enable3DTilt: false }))

      const mockRef = {
        current: {
          getBoundingClientRect: jest.fn(() => ({
            left: 0,
            top: 0,
            width: 200,
            height: 300,
            right: 200,
            bottom: 300
          }))
        }
      }

      ;(result.current.tiltRef as any).current = mockRef.current

      act(() => {
        result.current.tiltHandlers.onMouseEnter()
      })

      act(() => {
        result.current.tiltHandlers.onMouseMove({
          clientX: 200,
          clientY: 0
        } as React.MouseEvent)
      })

      // 應該保持零角度
      expect(result.current.tiltState.isTilted).toBe(false)
    })

    it('tiltMaxAngle 應限制最大傾斜角度', () => {
      const { result } = renderHook(() => use3DTilt({ tiltMaxAngle: 10 }))

      const mockRef = {
        current: {
          getBoundingClientRect: jest.fn(() => ({
            left: 0,
            top: 0,
            width: 200,
            height: 300,
            right: 200,
            bottom: 300
          }))
        }
      }

      ;(result.current.tiltRef as any).current = mockRef.current

      act(() => {
        result.current.tiltHandlers.onMouseEnter()
      })

      act(() => {
        result.current.tiltHandlers.onMouseMove({
          clientX: 200,
          clientY: 0
        } as React.MouseEvent)
      })

      waitFor(() => {
        expect(Math.abs(result.current.tiltState.rotateX)).toBeLessThanOrEqual(10)
        expect(Math.abs(result.current.tiltState.rotateY)).toBeLessThanOrEqual(10)
      })
    })

    it('isFlipping=true 應停用傾斜效果', () => {
      const { result } = renderHook(() => use3DTilt({ isFlipping: true }))

      act(() => {
        result.current.tiltHandlers.onMouseEnter()
      })

      expect(result.current.tiltState.isTilted).toBe(false)
    })

    it('loading=true 應停用傾斜效果', () => {
      const { result } = renderHook(() => use3DTilt({ loading: true }))

      act(() => {
        result.current.tiltHandlers.onMouseEnter()
      })

      expect(result.current.tiltState.isTilted).toBe(false)
    })

    it('size="small" 應減少傾斜角度至 60%', () => {
      const { result } = renderHook(() =>
        use3DTilt({ size: 'small', tiltMaxAngle: 15 })
      )

      const mockRef = {
        current: {
          getBoundingClientRect: jest.fn(() => ({
            left: 0,
            top: 0,
            width: 200,
            height: 300,
            right: 200,
            bottom: 300
          }))
        }
      }

      ;(result.current.tiltRef as any).current = mockRef.current

      act(() => {
        result.current.tiltHandlers.onMouseEnter()
      })

      act(() => {
        result.current.tiltHandlers.onMouseMove({
          clientX: 200,
          clientY: 0
        } as React.MouseEvent)
      })

      waitFor(() => {
        // 最大角度應該是 15 * 0.6 = 9
        expect(Math.abs(result.current.tiltState.rotateX)).toBeLessThanOrEqual(9)
        expect(Math.abs(result.current.tiltState.rotateY)).toBeLessThanOrEqual(9)
      })
    })
  })

  describe('prefers-reduced-motion', () => {
    it('prefersReducedMotion=true 應停用效果', () => {
      mockUseDeviceCapabilities.useDeviceCapabilities.mockReturnValue({
        isTouchDevice: false,
        prefersReducedMotion: true,
        isIOS: false
      })

      const { result } = renderHook(() => use3DTilt())

      act(() => {
        result.current.tiltHandlers.onMouseEnter()
      })

      expect(result.current.tiltState.isTilted).toBe(false)
      expect(result.current.tiltStyle).toEqual({})
    })
  })

  describe('陀螺儀功能', () => {
    it('應該在支援陀螺儀的裝置上監聽 deviceorientation', () => {
      mockUseDeviceCapabilities.useDeviceCapabilities.mockReturnValue({
        isTouchDevice: true,
        prefersReducedMotion: false,
        isIOS: true
      })

      mockUseGyroscopePermission.useGyroscopePermission.mockReturnValue({
        status: 'granted',
        requestPermission: jest.fn(),
        error: null
      })

      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')

      renderHook(() => use3DTilt({ enableGyroscope: true }))

      // 檢查是否註冊了 deviceorientation 事件監聽器
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'deviceorientation',
        expect.any(Function)
      )
    })

    it('陀螺儀權限未授予時不應監聽事件', () => {
      mockUseDeviceCapabilities.useDeviceCapabilities.mockReturnValue({
        isTouchDevice: true,
        prefersReducedMotion: false,
        isIOS: true
      })

      mockUseGyroscopePermission.useGyroscopePermission.mockReturnValue({
        status: 'denied',
        requestPermission: jest.fn(),
        error: null
      })

      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      addEventListenerSpy.mockClear()

      renderHook(() => use3DTilt({ enableGyroscope: true }))

      // 不應該註冊 deviceorientation 事件
      const deviceOrientationCalls = addEventListenerSpy.mock.calls.filter(
        (call) => call[0] === 'deviceorientation'
      )
      expect(deviceOrientationCalls.length).toBe(0)
    })
  })

  describe('CSS transform 計算', () => {
    it('應該產生正確的 perspective transform', () => {
      const { result } = renderHook(() => use3DTilt())

      const mockRef = {
        current: {
          getBoundingClientRect: jest.fn(() => ({
            left: 0,
            top: 0,
            width: 200,
            height: 300,
            right: 200,
            bottom: 300
          }))
        }
      }

      ;(result.current.tiltRef as any).current = mockRef.current

      act(() => {
        result.current.tiltHandlers.onMouseEnter()
      })

      act(() => {
        result.current.tiltHandlers.onMouseMove({
          clientX: 150,
          clientY: 100
        } as React.MouseEvent)
      })

      waitFor(() => {
        expect(result.current.tiltStyle.transform).toMatch(/perspective\(1000px\)/)
        expect(result.current.tiltStyle.transform).toMatch(/rotateX\([^)]+deg\)/)
        expect(result.current.tiltStyle.transform).toMatch(/rotateY\([^)]+deg\)/)
        expect(result.current.tiltStyle.transform).toMatch(/scale3d\(1\.02, 1\.02, 1\.02\)/)
      })
    })

    it('傾斜時應無 transition', () => {
      const { result } = renderHook(() => use3DTilt())

      const mockRef = {
        current: {
          getBoundingClientRect: jest.fn(() => ({
            left: 0,
            top: 0,
            width: 200,
            height: 300,
            right: 200,
            bottom: 300
          }))
        }
      }

      ;(result.current.tiltRef as any).current = mockRef.current

      act(() => {
        result.current.tiltHandlers.onMouseEnter()
      })

      act(() => {
        result.current.tiltHandlers.onMouseMove({
          clientX: 150,
          clientY: 100
        } as React.MouseEvent)
      })

      waitFor(() => {
        expect(result.current.tiltStyle.transition).toBe('none')
      })
    })

    it('復原時應有 transition', () => {
      const { result } = renderHook(() => use3DTilt({ tiltTransitionDuration: 400 }))

      act(() => {
        result.current.tiltHandlers.onMouseLeave()
      })

      expect(result.current.tiltStyle.transition).toMatch(/transform 400ms ease-out/)
    })

    it('傾斜時 willChange 應為 transform', () => {
      const { result } = renderHook(() => use3DTilt())

      const mockRef = {
        current: {
          getBoundingClientRect: jest.fn(() => ({
            left: 0,
            top: 0,
            width: 200,
            height: 300,
            right: 200,
            bottom: 300
          }))
        }
      }

      ;(result.current.tiltRef as any).current = mockRef.current

      act(() => {
        result.current.tiltHandlers.onMouseEnter()
      })

      act(() => {
        result.current.tiltHandlers.onMouseMove({
          clientX: 150,
          clientY: 100
        } as React.MouseEvent)
      })

      waitFor(() => {
        expect(result.current.tiltStyle.willChange).toBe('transform')
      })
    })
  })

  describe('光澤效果計算', () => {
    it('enableGloss=false 時應無光澤', () => {
      const { result } = renderHook(() => use3DTilt({ enableGloss: false }))

      const mockRef = {
        current: {
          getBoundingClientRect: jest.fn(() => ({
            left: 0,
            top: 0,
            width: 200,
            height: 300,
            right: 200,
            bottom: 300
          }))
        }
      }

      ;(result.current.tiltRef as any).current = mockRef.current

      act(() => {
        result.current.tiltHandlers.onMouseEnter()
      })

      act(() => {
        result.current.tiltHandlers.onMouseMove({
          clientX: 150,
          clientY: 100
        } as React.MouseEvent)
      })

      waitFor(() => {
        expect(result.current.glossStyle.opacity).toBe(0)
      })
    })

    it('傾斜時應產生光澤效果', () => {
      const { result } = renderHook(() => use3DTilt({ enableGloss: true }))

      const mockRef = {
        current: {
          getBoundingClientRect: jest.fn(() => ({
            left: 0,
            top: 0,
            width: 200,
            height: 300,
            right: 200,
            bottom: 300
          }))
        }
      }

      ;(result.current.tiltRef as any).current = mockRef.current

      act(() => {
        result.current.tiltHandlers.onMouseEnter()
      })

      act(() => {
        result.current.tiltHandlers.onMouseMove({
          clientX: 150,
          clientY: 100
        } as React.MouseEvent)
      })

      waitFor(() => {
        expect(result.current.glossStyle.opacity).toBe(0.6)
        expect(result.current.glossStyle.background).toMatch(/radial-gradient/)
        expect(result.current.glossStyle.mixBlendMode).toBe('overlay')
      })
    })
  })

  describe('記憶體清理', () => {
    it('卸載時應取消 RAF', () => {
      const { unmount } = renderHook(() => use3DTilt())

      unmount()

      expect(global.cancelAnimationFrame).toHaveBeenCalled()
    })

    it('卸載時應移除事件監聽器', () => {
      mockUseDeviceCapabilities.useDeviceCapabilities.mockReturnValue({
        isTouchDevice: true,
        prefersReducedMotion: false,
        isIOS: true
      })

      mockUseGyroscopePermission.useGyroscopePermission.mockReturnValue({
        status: 'granted',
        requestPermission: jest.fn(),
        error: null
      })

      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => use3DTilt({ enableGyroscope: true }))

      unmount()

      // 檢查是否移除了 deviceorientation 事件監聽器
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'deviceorientation',
        expect.any(Function)
      )
    })
  })

  describe('瀏覽器相容性', () => {
    it('不支援 3D transforms 時應停用效果', () => {
      jest.spyOn(browserCompat, 'supports3DTransforms').mockReturnValue(false)

      const { result } = renderHook(() => use3DTilt())

      const mockRef = {
        current: {
          getBoundingClientRect: jest.fn(() => ({
            left: 0,
            top: 0,
            width: 200,
            height: 300,
            right: 200,
            bottom: 300
          }))
        }
      }

      ;(result.current.tiltRef as any).current = mockRef.current

      act(() => {
        result.current.tiltHandlers.onMouseEnter()
      })

      act(() => {
        result.current.tiltHandlers.onMouseMove({
          clientX: 200,
          clientY: 0
        } as React.MouseEvent)
      })

      // 應該保持無效果
      expect(result.current.tiltState.isTilted).toBe(false)
      expect(result.current.tiltStyle).toEqual({})
    })
  })
})
