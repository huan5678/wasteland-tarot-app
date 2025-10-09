/**
 * use3DTilt Hook - 3D 傾斜效果核心 Hook
 *
 * 統一管理桌面滑鼠追蹤與行動陀螺儀感應，計算 3D 傾斜角度並輸出 CSS transform 值
 */

'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import type { Use3DTiltOptions, Use3DTiltReturn, TiltState } from '@/types/tilt'
import { useDeviceCapabilities } from './useDeviceCapabilities'
import { useGyroscopePermission } from './useGyroscopePermission'
import { useIntersectionTilt } from './useIntersectionTilt'
import { useTiltConfigOptional } from '@/contexts/TiltConfigContext'
import { supports3DTransforms } from '@/utils/browserCompat'

// Throttle 輔助函式（簡化版）
function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 3D 傾斜效果 Hook
 *
 * 統一管理桌面滑鼠追蹤與行動陀螺儀感應，計算 3D 傾斜角度並輸出 CSS transform 值。
 * 自動整合全域配置（TiltConfigProvider）、效能偵測、無障礙支援與瀏覽器相容性檢查。
 *
 * @param options - 傾斜效果配置選項
 * @param options.enable3DTilt - 是否啟用 3D 傾斜效果（預設: true）
 * @param options.tiltMaxAngle - 最大傾斜角度（度），預設 15° 或從 TiltConfigProvider 取得
 * @param options.tiltTransitionDuration - 復原動畫時長（毫秒），預設 400ms
 * @param options.enableGyroscope - 是否啟用陀螺儀（行動裝置），預設 true 或從 TiltConfigProvider 取得
 * @param options.enableGloss - 是否啟用光澤效果，預設 true 或從 TiltConfigProvider 取得
 * @param options.size - 卡片尺寸（small 會自動減少角度至 60%），預設 'medium'
 * @param options.isFlipping - 是否正在進行翻牌動畫（停用傾斜），預設 false
 * @param options.loading - 是否處於 loading 狀態（停用傾斜），預設 false
 *
 * @returns Use3DTiltReturn 物件，包含 ref、事件處理器、狀態與樣式
 *
 * @remarks
 * - 桌面：滑鼠懸停時，卡片根據游標位置產生 3D 傾斜（-15° ~ +15°）
 * - 行動：陀螺儀感應裝置方向，卡片根據傾斜角度產生 3D 效果（-20° ~ +20°）
 * - 效能優化：使用 requestAnimationFrame、throttle、IntersectionObserver
 * - 無障礙：自動停用 prefers-reduced-motion 使用者的動畫效果
 * - 瀏覽器相容性：自動偵測並降級不支援 3D transforms 的瀏覽器
 * - 記憶體管理：自動清理事件監聽器與 RAF，防止記憶體洩漏
 *
 * @example
 * 基本使用（桌面滑鼠追蹤）
 * ```tsx
 * const { tiltRef, tiltHandlers, tiltStyle } = use3DTilt({
 *   enable3DTilt: true,
 *   tiltMaxAngle: 15
 * })
 *
 * return (
 *   <div ref={tiltRef} {...tiltHandlers} style={tiltStyle}>
 *     卡片內容
 *   </div>
 * )
 * ```
 *
 * @example
 * 完整使用（滑鼠追蹤 + 陀螺儀 + 光澤效果）
 * ```tsx
 * const { tiltRef, tiltHandlers, tiltStyle, glossStyle, gyroscopePermission } = use3DTilt({
 *   enable3DTilt: true,
 *   tiltMaxAngle: 15,
 *   enableGyroscope: true,
 *   enableGloss: true
 * })
 *
 * return (
 *   <>
 *     {gyroscopePermission.status === 'prompt' && (
 *       <button onClick={gyroscopePermission.requestPermission}>
 *         啟用傾斜效果
 *       </button>
 *     )}
 *     <div ref={tiltRef} {...tiltHandlers} style={tiltStyle}>
 *       <div style={glossStyle} className="gloss-overlay" />
 *       卡片內容
 *     </div>
 *   </>
 * )
 * ```
 *
 * @example
 * 小尺寸卡片（自動減少角度至 60%）
 * ```tsx
 * const { tiltRef, tiltHandlers, tiltStyle } = use3DTilt({
 *   size: 'small', // 最大角度自動減至 9°（15° * 0.6）
 *   enableGloss: false // 縮圖通常不需要光澤
 * })
 * ```
 *
 * @see {@link Use3DTiltOptions} 選項介面定義
 * @see {@link Use3DTiltReturn} 返回值介面定義
 * @see {@link TiltConfigProvider} 全域配置 Provider
 * @see {@link useDeviceCapabilities} 裝置能力偵測
 * @see {@link useGyroscopePermission} 陀螺儀權限管理
 * @see {@link useIntersectionTilt} 可視區域偵測
 */
export function use3DTilt(options: Use3DTiltOptions = {}): Use3DTiltReturn {
  // 1. 載入全域配置（可選）
  const globalConfig = useTiltConfigOptional()

  const {
    enable3DTilt = true,
    tiltMaxAngle: userMaxAngle,
    tiltTransitionDuration = 400,
    enableGyroscope: userEnableGyroscope,
    enableGloss: userEnableGloss,
    size = 'medium',
    isFlipping = false,
    loading = false
  } = options

  // 2. 裝置能力偵測
  const { isTouchDevice, prefersReducedMotion } = useDeviceCapabilities()
  const tiltRef = useRef<HTMLDivElement>(null)
  const { isIntersecting } = useIntersectionTilt(tiltRef)
  const gyroscopePermission = useGyroscopePermission()

  // 3. 合併全域配置與 props（props 優先）
  const baseMaxAngle = userMaxAngle ?? globalConfig?.defaultMaxAngle ?? 15

  // 4. 根據全域配置調整設定
  const enableGyroscope =
    userEnableGyroscope ??
    (globalConfig?.enableGyroscopeGlobal && !globalConfig?.performanceDegradation.disableGyroscope) ??
    true

  const enableGloss =
    userEnableGloss ??
    (globalConfig?.enableGlossGlobal && !globalConfig?.performanceDegradation.disableGloss) ??
    true

  // 5. 根據 size 調整最大角度（small 減至 60%）
  let tiltMaxAngle = size === 'small' ? baseMaxAngle * 0.6 : baseMaxAngle

  // 6. 低效能裝置自動降級（減少角度至 60%）
  if (globalConfig?.performanceDegradation.reduceAngle) {
    tiltMaxAngle = tiltMaxAngle * 0.6
  }

  // 7. 狀態管理
  const [tiltState, setTiltState] = useState<TiltState>({
    rotateX: 0,
    rotateY: 0,
    isActive: false,
    isTilted: false,
    source: null
  })

  const rafId = useRef<number | null>(null)
  const [isHovered, setIsHovered] = useState(false)

  // 8. 檢查是否應該啟用效果（包含瀏覽器相容性檢查）
  const shouldEnable =
    enable3DTilt &&
    !prefersReducedMotion &&
    !isFlipping &&
    !loading &&
    isIntersecting &&
    (typeof window === 'undefined' || supports3DTransforms())

  // 9. 滑鼠事件處理（桌面）
  const handleMouseEnter = useCallback(() => {
    if (!shouldEnable) return
    setIsHovered(true)
  }, [shouldEnable])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!shouldEnable || !isHovered) return

      const rect = tiltRef.current?.getBoundingClientRect()
      if (!rect) return

      // 計算相對位置 (0 ~ 1)
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height

      // 轉換為角度 (-tiltMaxAngle ~ +tiltMaxAngle)
      const rotateY = (x - 0.5) * 2 * tiltMaxAngle
      const rotateX = -(y - 0.5) * 2 * tiltMaxAngle

      // 使用 RAF 平滑更新
      if (rafId.current) cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(() => {
        setTiltState({
          rotateX,
          rotateY,
          isActive: true,
          isTilted: true,
          source: 'mouse'
        })
      })
    },
    [shouldEnable, isHovered, tiltMaxAngle]
  )

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    if (rafId.current) cancelAnimationFrame(rafId.current)
    setTiltState({
      rotateX: 0,
      rotateY: 0,
      isActive: false,
      isTilted: false,
      source: null
    })
  }, [])

  // 10. 陀螺儀事件處理（行動）
  useEffect(() => {
    if (!shouldEnable || !enableGyroscope || !isTouchDevice) return
    if (gyroscopePermission.status !== 'granted') return

    const throttledHandler = throttle((event: DeviceOrientationEvent) => {
      if (!isIntersecting) return

      const beta = event.beta ?? 0 // 前後傾斜 -180~180
      const gamma = event.gamma ?? 0 // 左右傾斜 -90~90

      // 限制角度範圍（手機用 ±20°）
      const rotateX = -Math.max(-20, Math.min(20, beta / 4))
      const rotateY = Math.max(-20, Math.min(20, gamma / 4))

      if (rafId.current) cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(() => {
        setTiltState({
          rotateX,
          rotateY,
          isActive: true,
          isTilted: true,
          source: 'gyroscope'
        })
      })
    }, 33) // 30fps

    window.addEventListener('deviceorientation', throttledHandler as any)

    // Page Visibility API - 背景暫停
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (rafId.current) cancelAnimationFrame(rafId.current)
        setTiltState({
          rotateX: 0,
          rotateY: 0,
          isActive: false,
          isTilted: false,
          source: null
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('deviceorientation', throttledHandler as any)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [shouldEnable, enableGyroscope, isTouchDevice, gyroscopePermission.status, isIntersecting])

  // 11. 計算 CSS transform style
  const tiltStyle = useMemo<React.CSSProperties>(() => {
    if (!shouldEnable) {
      return {}
    }

    return {
      transform: `perspective(1000px) rotateX(${tiltState.rotateX}deg) rotateY(${tiltState.rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: tiltState.isTilted ? 'none' : `transform ${tiltTransitionDuration}ms ease-out`,
      willChange: tiltState.isActive ? 'transform' : 'auto'
    }
  }, [tiltState, tiltTransitionDuration, shouldEnable])

  // 12. 計算光澤 style
  const glossStyle = useMemo<React.CSSProperties>(() => {
    if (!enableGloss || !tiltState.isTilted || !shouldEnable) {
      return { opacity: 0 }
    }

    // 光澤位置根據傾斜角度移動
    const glossX = 50 + tiltState.rotateY * 2 // 50% ~ 80%
    const glossY = 50 - tiltState.rotateX * 2 // 20% ~ 50%

    return {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: `radial-gradient(circle at ${glossX}% ${glossY}%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
      opacity: 0.6,
      transition: 'opacity 0.3s ease-out',
      mixBlendMode: 'overlay'
    } as React.CSSProperties
  }, [enableGloss, tiltState, shouldEnable])

  return {
    tiltRef,
    tiltHandlers: {
      onMouseEnter: handleMouseEnter,
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave
    },
    tiltState,
    tiltStyle,
    glossStyle,
    gyroscopePermission
  }
}
