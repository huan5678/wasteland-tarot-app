/**
 * TiltConfigProvider - 3D 傾斜全域配置 Context
 *
 * 提供全域配置、效能偵測與自動降級機制
 */

'use client'

import React, { createContext, useContext, useMemo, ReactNode } from 'react'
import type { TiltConfig } from '@/types/tilt'

const TiltConfigContext = createContext<TiltConfig | null>(null)

export interface TiltConfigProviderProps {
  children: ReactNode
  /** 覆蓋預設配置（可選） */
  config?: Partial<TiltConfig>
}

/**
 * 3D 傾斜全域配置 Provider
 *
 * 自動偵測裝置效能並設定降級策略
 *
 * @example
 * ```tsx
 * <TiltConfigProvider>
 *   <App />
 * </TiltConfigProvider>
 * ```
 */
export function TiltConfigProvider({ children, config: userConfig }: TiltConfigProviderProps) {
  const config = useMemo<TiltConfig>(() => {
    // 偵測低效能裝置
    const hardwareConcurrency = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 4 : 4
    const deviceMemory =
      typeof navigator !== 'undefined' && 'deviceMemory' in navigator
        ? (navigator as any).deviceMemory ?? 4
        : 4 // GB

    const isLowPerformanceDevice = hardwareConcurrency < 4 || deviceMemory < 4

    const defaultConfig: TiltConfig = {
      defaultMaxAngle: 15,
      enableGyroscopeGlobal: true,
      enableGlossGlobal: !isLowPerformanceDevice,
      isLowPerformanceDevice,
      performanceDegradation: {
        reduceAngle: isLowPerformanceDevice,
        disableGloss: isLowPerformanceDevice,
        disableGyroscope: false // 陀螺儀開銷低，不停用
      }
    }

    // 合併使用者自訂配置
    return {
      ...defaultConfig,
      ...userConfig,
      performanceDegradation: {
        ...defaultConfig.performanceDegradation,
        ...(userConfig?.performanceDegradation ?? {})
      }
    }
  }, [userConfig])

  return <TiltConfigContext.Provider value={config}>{children}</TiltConfigContext.Provider>
}

/**
 * 使用 3D 傾斜全域配置 Hook
 *
 * @throws 如果未在 TiltConfigProvider 中使用，將拋出錯誤
 *
 * @example
 * ```tsx
 * const config = useTiltConfig()
 * const maxAngle = config.defaultMaxAngle
 * ```
 */
export function useTiltConfig(): TiltConfig {
  const context = useContext(TiltConfigContext)
  if (!context) {
    throw new Error('useTiltConfig must be used within TiltConfigProvider')
  }
  return context
}

/**
 * 使用 3D 傾斜全域配置 Hook（可選版本）
 *
 * 如果未在 TiltConfigProvider 中使用，將返回 null 而不拋出錯誤
 *
 * @example
 * ```tsx
 * const config = useTiltConfigOptional()
 * const maxAngle = config?.defaultMaxAngle ?? 15
 * ```
 */
export function useTiltConfigOptional(): TiltConfig | null {
  return useContext(TiltConfigContext)
}
