/**
 * 類型定義測試 - 確保 TypeScript 類型正確編譯
 */

import type {
  TiltState,
  GyroscopePermissionStatus,
  DeviceCapabilities,
  TiltComponentProps,
  Use3DTiltOptions,
  Use3DTiltReturn,
  UseGyroscopePermissionReturn,
  UseIntersectionTiltReturn,
  TiltConfig,
  TiltVisualEffectsProps,
  DeviceOrientationEventiOS
} from '../tilt'

describe('Tilt Types', () => {
  describe('TiltState', () => {
    it('should have correct structure', () => {
      const tiltState: TiltState = {
        rotateX: 0,
        rotateY: 0,
        isActive: false,
        isTilted: false,
        source: null
      }

      expect(tiltState).toBeDefined()
      expect(typeof tiltState.rotateX).toBe('number')
      expect(typeof tiltState.rotateY).toBe('number')
      expect(typeof tiltState.isActive).toBe('boolean')
      expect(typeof tiltState.isTilted).toBe('boolean')
    })

    it('should accept valid source values', () => {
      const mouseSource: TiltState = {
        rotateX: 10,
        rotateY: 5,
        isActive: true,
        isTilted: true,
        source: 'mouse'
      }

      const gyroscopeSource: TiltState = {
        rotateX: 10,
        rotateY: 5,
        isActive: true,
        isTilted: true,
        source: 'gyroscope'
      }

      expect(mouseSource.source).toBe('mouse')
      expect(gyroscopeSource.source).toBe('gyroscope')
    })
  })

  describe('GyroscopePermissionStatus', () => {
    it('should accept valid permission statuses', () => {
      const statuses: GyroscopePermissionStatus[] = [
        'prompt',
        'granted',
        'denied',
        'unsupported'
      ]

      statuses.forEach(status => {
        expect(status).toBeDefined()
      })
    })
  })

  describe('DeviceCapabilities', () => {
    it('should have correct structure', () => {
      const capabilities: DeviceCapabilities = {
        isTouchDevice: true,
        prefersReducedMotion: false,
        screenSize: 'mobile',
        isIOS: true,
        hardwareConcurrency: 4,
        deviceMemory: 8
      }

      expect(capabilities).toBeDefined()
      expect(typeof capabilities.isTouchDevice).toBe('boolean')
      expect(typeof capabilities.prefersReducedMotion).toBe('boolean')
      expect(['mobile', 'tablet', 'desktop']).toContain(capabilities.screenSize)
      expect(typeof capabilities.isIOS).toBe('boolean')
      expect(typeof capabilities.hardwareConcurrency).toBe('number')
    })

    it('should allow optional deviceMemory', () => {
      const capabilitiesWithoutMemory: DeviceCapabilities = {
        isTouchDevice: false,
        prefersReducedMotion: false,
        screenSize: 'desktop',
        isIOS: false,
        hardwareConcurrency: 8
      }

      expect(capabilitiesWithoutMemory.deviceMemory).toBeUndefined()
    })
  })

  describe('TiltComponentProps', () => {
    it('should have correct structure with all optional fields', () => {
      const props: TiltComponentProps = {
        enable3DTilt: true,
        tiltMaxAngle: 15,
        tiltTransitionDuration: 400,
        enableGyroscope: true,
        enableGloss: true,
        size: 'medium'
      }

      expect(props).toBeDefined()
      expect(typeof props.enable3DTilt).toBe('boolean')
      expect(typeof props.tiltMaxAngle).toBe('number')
      expect(typeof props.tiltTransitionDuration).toBe('number')
    })

    it('should allow empty props', () => {
      const emptyProps: TiltComponentProps = {}
      expect(emptyProps).toEqual({})
    })
  })

  describe('Use3DTiltOptions', () => {
    it('should extend TiltComponentProps', () => {
      const options: Use3DTiltOptions = {
        enable3DTilt: true,
        tiltMaxAngle: 15,
        isFlipping: false,
        loading: false
      }

      expect(options).toBeDefined()
      expect(typeof options.isFlipping).toBe('boolean')
      expect(typeof options.loading).toBe('boolean')
    })
  })

  describe('Use3DTiltReturn', () => {
    it('should have correct structure', () => {
      // 模擬 Hook 返回值結構（不需要實際實作）
      const mockReturn = {
        tiltRef: { current: null },
        tiltHandlers: {
          onMouseEnter: jest.fn(),
          onMouseMove: jest.fn(),
          onMouseLeave: jest.fn()
        },
        tiltState: {
          rotateX: 0,
          rotateY: 0,
          isActive: false,
          isTilted: false,
          source: null
        },
        tiltStyle: {},
        glossStyle: {},
        gyroscopePermission: {
          status: 'prompt' as GyroscopePermissionStatus,
          requestPermission: jest.fn(),
          error: null
        }
      }

      expect(mockReturn.tiltHandlers.onMouseEnter).toBeDefined()
      expect(mockReturn.tiltHandlers.onMouseMove).toBeDefined()
      expect(mockReturn.tiltHandlers.onMouseLeave).toBeDefined()
      expect(mockReturn.gyroscopePermission.status).toBe('prompt')
    })
  })

  describe('TiltConfig', () => {
    it('should have correct structure', () => {
      const config: TiltConfig = {
        defaultMaxAngle: 15,
        enableGyroscopeGlobal: true,
        enableGlossGlobal: true,
        isLowPerformanceDevice: false,
        performanceDegradation: {
          reduceAngle: false,
          disableGloss: false,
          disableGyroscope: false
        }
      }

      expect(config).toBeDefined()
      expect(typeof config.defaultMaxAngle).toBe('number')
      expect(typeof config.isLowPerformanceDevice).toBe('boolean')
      expect(config.performanceDegradation).toBeDefined()
      expect(typeof config.performanceDegradation.reduceAngle).toBe('boolean')
    })
  })

  describe('TiltVisualEffectsProps', () => {
    it('should have correct structure', () => {
      const props: TiltVisualEffectsProps = {
        tiltState: {
          rotateX: 10,
          rotateY: 5,
          isActive: true,
          isTilted: true,
          source: 'mouse'
        },
        enableGloss: true,
        className: 'custom-class'
      }

      expect(props).toBeDefined()
      expect(props.tiltState).toBeDefined()
      expect(typeof props.enableGloss).toBe('boolean')
      expect(typeof props.className).toBe('string')
    })
  })
})
