/**
 * useDeviceCapabilities Hook - 裝置能力偵測
 *
 * 偵測裝置的各種能力，包括：
 * - 是否為觸控裝置
 * - 使用者是否偏好減少動畫
 * - 是否為 iOS 裝置
 * - CPU 核心數
 * - 記憶體容量（若支援）
 * - 螢幕尺寸類型
 */

'use client'

import { useMemo } from 'react'
import type { DeviceCapabilities } from '@/types/tilt'

/**
 * 裝置能力偵測 Hook
 *
 * @example
 * ```tsx
 * const { isTouchDevice, prefersReducedMotion, isIOS } = useDeviceCapabilities()
 *
 * if (prefersReducedMotion) {
 *   // 停用動畫效果
 * }
 * ```
 *
 * @returns DeviceCapabilities 物件，包含所有偵測到的裝置能力
 */
export function useDeviceCapabilities(): DeviceCapabilities {
  const capabilities = useMemo<DeviceCapabilities>(() => {
    // 檢測是否在瀏覽器環境
    if (typeof window === 'undefined') {
      return {
        isTouchDevice: false,
        prefersReducedMotion: false,
        screenSize: 'desktop',
        isIOS: false,
        hardwareConcurrency: 4,
        deviceMemory: undefined
      }
    }

    // 1. 偵測是否為觸控裝置（使用 maxTouchPoints）
    const isTouchDevice = navigator.maxTouchPoints > 0

    // 2. 偵測使用者是否偏好減少動畫
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // 3. 偵測是否為 iOS（iPhone、iPad、iPod）
    const userAgent = navigator.userAgent || ''
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent)

    // 4. 偵測 CPU 核心數（預設為 4）
    const hardwareConcurrency = navigator.hardwareConcurrency ?? 4

    // 5. 偵測記憶體容量（GB，Chrome/Edge 支援）
    const deviceMemory = (navigator as any).deviceMemory as number | undefined

    // 6. 偵測螢幕尺寸類型
    let screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop'
    if (window.matchMedia('(max-width: 640px)').matches) {
      screenSize = 'mobile'
    } else if (window.matchMedia('(max-width: 1024px)').matches) {
      screenSize = 'tablet'
    }

    return {
      isTouchDevice,
      prefersReducedMotion,
      screenSize,
      isIOS,
      hardwareConcurrency,
      deviceMemory
    }
  }, []) // 空依賴陣列，只在初始化時執行一次

  return capabilities
}
