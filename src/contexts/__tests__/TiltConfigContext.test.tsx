/**
 * TiltConfigContext 測試
 */

import React from 'react'
import { renderHook } from '@testing-library/react'
import { TiltConfigProvider, useTiltConfig, useTiltConfigOptional } from '../TiltConfigContext'

describe('TiltConfigProvider', () => {
  // 保存原始 navigator 以便恢復
  const originalNavigator = global.navigator

  afterEach(() => {
    // 恢復原始 navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true
    })
  })

  describe('低效能裝置偵測', () => {
    it('應該偵測低效能裝置（CPU 核心數 < 4）', () => {
      // Mock 低效能裝置
      Object.defineProperty(global, 'navigator', {
        value: {
          hardwareConcurrency: 2,
          deviceMemory: 4
        },
        writable: true,
        configurable: true
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TiltConfigProvider>{children}</TiltConfigProvider>
      )

      const { result } = renderHook(() => useTiltConfig(), { wrapper })

      expect(result.current.isLowPerformanceDevice).toBe(true)
      expect(result.current.performanceDegradation.reduceAngle).toBe(true)
      expect(result.current.performanceDegradation.disableGloss).toBe(true)
    })

    it('應該偵測低效能裝置（記憶體 < 4GB）', () => {
      // Mock 低記憶體裝置
      Object.defineProperty(global, 'navigator', {
        value: {
          hardwareConcurrency: 8,
          deviceMemory: 2
        },
        writable: true,
        configurable: true
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TiltConfigProvider>{children}</TiltConfigProvider>
      )

      const { result } = renderHook(() => useTiltConfig(), { wrapper })

      expect(result.current.isLowPerformanceDevice).toBe(true)
    })

    it('應該偵測高效能裝置', () => {
      // Mock 高效能裝置
      Object.defineProperty(global, 'navigator', {
        value: {
          hardwareConcurrency: 8,
          deviceMemory: 8
        },
        writable: true,
        configurable: true
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TiltConfigProvider>{children}</TiltConfigProvider>
      )

      const { result } = renderHook(() => useTiltConfig(), { wrapper })

      expect(result.current.isLowPerformanceDevice).toBe(false)
      expect(result.current.performanceDegradation.reduceAngle).toBe(false)
      expect(result.current.performanceDegradation.disableGloss).toBe(false)
    })

    it('應該在高效能裝置上啟用光澤效果', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          hardwareConcurrency: 8,
          deviceMemory: 8
        },
        writable: true,
        configurable: true
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TiltConfigProvider>{children}</TiltConfigProvider>
      )

      const { result } = renderHook(() => useTiltConfig(), { wrapper })

      expect(result.current.enableGlossGlobal).toBe(true)
    })

    it('應該在低效能裝置上停用光澤效果', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          hardwareConcurrency: 2,
          deviceMemory: 2
        },
        writable: true,
        configurable: true
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TiltConfigProvider>{children}</TiltConfigProvider>
      )

      const { result } = renderHook(() => useTiltConfig(), { wrapper })

      expect(result.current.enableGlossGlobal).toBe(false)
    })
  })

  describe('預設配置', () => {
    it('應該提供預設配置值', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          hardwareConcurrency: 8,
          deviceMemory: 8
        },
        writable: true,
        configurable: true
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TiltConfigProvider>{children}</TiltConfigProvider>
      )

      const { result } = renderHook(() => useTiltConfig(), { wrapper })

      expect(result.current.defaultMaxAngle).toBe(15)
      expect(result.current.enableGyroscopeGlobal).toBe(true)
      expect(result.current.performanceDegradation.disableGyroscope).toBe(false)
    })
  })

  describe('自訂配置', () => {
    it('應該允許覆蓋預設配置', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          hardwareConcurrency: 8,
          deviceMemory: 8
        },
        writable: true,
        configurable: true
      })

      const customConfig = {
        defaultMaxAngle: 20,
        enableGyroscopeGlobal: false
      }

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TiltConfigProvider config={customConfig}>{children}</TiltConfigProvider>
      )

      const { result } = renderHook(() => useTiltConfig(), { wrapper })

      expect(result.current.defaultMaxAngle).toBe(20)
      expect(result.current.enableGyroscopeGlobal).toBe(false)
    })

    it('應該允許覆蓋 performanceDegradation 設定', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          hardwareConcurrency: 2, // 低效能
          deviceMemory: 2
        },
        writable: true,
        configurable: true
      })

      const customConfig = {
        performanceDegradation: {
          disableGloss: false // 強制啟用光澤（即使低效能）
        }
      }

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TiltConfigProvider config={customConfig}>{children}</TiltConfigProvider>
      )

      const { result } = renderHook(() => useTiltConfig(), { wrapper })

      expect(result.current.performanceDegradation.disableGloss).toBe(false)
    })
  })

  describe('useTiltConfig Hook', () => {
    it('應該在 Provider 外拋出錯誤', () => {
      // 抑制 console.error 輸出
      const consoleError = console.error
      console.error = jest.fn()

      expect(() => {
        renderHook(() => useTiltConfig())
      }).toThrow('useTiltConfig must be used within TiltConfigProvider')

      console.error = consoleError
    })
  })

  describe('useTiltConfigOptional Hook', () => {
    it('應該在 Provider 外返回 null', () => {
      const { result } = renderHook(() => useTiltConfigOptional())

      expect(result.current).toBeNull()
    })

    it('應該在 Provider 內返回配置', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          hardwareConcurrency: 8,
          deviceMemory: 8
        },
        writable: true,
        configurable: true
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TiltConfigProvider>{children}</TiltConfigProvider>
      )

      const { result } = renderHook(() => useTiltConfigOptional(), { wrapper })

      expect(result.current).not.toBeNull()
      expect(result.current?.defaultMaxAngle).toBe(15)
    })
  })

  describe('陀螺儀設定', () => {
    it('應該始終啟用陀螺儀（即使低效能）', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          hardwareConcurrency: 2,
          deviceMemory: 2
        },
        writable: true,
        configurable: true
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TiltConfigProvider>{children}</TiltConfigProvider>
      )

      const { result } = renderHook(() => useTiltConfig(), { wrapper })

      expect(result.current.performanceDegradation.disableGyroscope).toBe(false)
    })
  })
})
