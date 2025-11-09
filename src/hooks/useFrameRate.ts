'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

/**
 * Frame rate monitoring configuration
 */
interface FrameRateConfig {
  sampleWindow?: number // Time window for FPS calculation (ms)
  warningThreshold?: number // FPS below which to warn (default: 45)
  criticalThreshold?: number // FPS below which to take action (default: 30)
  enableLogging?: boolean // Enable console logging
}

/**
 * Frame rate monitoring result
 */
interface FrameRateMetrics {
  currentFps: number // Current frames per second
  averageFps: number // Average FPS over sample window
  minFps: number // Minimum FPS recorded
  maxFps: number // Maximum FPS recorded
  isPerformanceWarning: boolean // FPS below warning threshold
  isPerformanceCritical: boolean // FPS below critical threshold
  frameDropCount: number // Number of dropped frames detected
  lastFrameTime: number // Timestamp of last frame
}

/**
 * Hook for monitoring frame rate performance
 *
 * @param config - Configuration options
 * @returns Frame rate metrics
 *
 * @example
 * ```tsx
 * const { currentFps, isPerformanceCritical } = useFrameRate({
 *   warningThreshold: 45,
 *   criticalThreshold: 30,
 *   enableLogging: true
 * })
 *
 * if (isPerformanceCritical) {
 *   // Reduce animation quality
 * }
 * ```
 */
export function useFrameRate(config: FrameRateConfig = {}): FrameRateMetrics {
  const {
    sampleWindow = 1000, // 1 second window
    warningThreshold = 45,
    criticalThreshold = 30,
    enableLogging = false
  } = config

  // State for FPS metrics
  const [metrics, setMetrics] = useState<FrameRateMetrics>({
    currentFps: 60,
    averageFps: 60,
    minFps: 60,
    maxFps: 60,
    isPerformanceWarning: false,
    isPerformanceCritical: false,
    frameDropCount: 0,
    lastFrameTime: 0
  })

  // Refs for performance tracking
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const fpsHistoryRef = useRef<number[]>([])
  const animationFrameIdRef = useRef<number>()
  const frameDropCountRef = useRef(0)

  /**
   * Calculate FPS and update metrics
   */
  const measureFPS = useCallback(() => {
    const now = performance.now()
    const deltaTime = now - lastTimeRef.current

    frameCountRef.current++

    // Calculate FPS every sample window
    if (deltaTime >= sampleWindow) {
      const fps = Math.round((frameCountRef.current * 1000) / deltaTime)

      // Add to history
      fpsHistoryRef.current.push(fps)

      // Keep only last 10 samples
      if (fpsHistoryRef.current.length > 10) {
        fpsHistoryRef.current.shift()
      }

      // Calculate average FPS
      const averageFps = Math.round(
        fpsHistoryRef.current.reduce((sum, f) => sum + f, 0) / fpsHistoryRef.current.length
      )

      // Calculate min/max
      const minFps = Math.min(...fpsHistoryRef.current)
      const maxFps = Math.max(...fpsHistoryRef.current)

      // Detect frame drops (FPS significantly lower than expected 60fps)
      if (fps < 55) {
        frameDropCountRef.current++
      }

      // Determine performance state
      const isPerformanceWarning = fps < warningThreshold
      const isPerformanceCritical = fps < criticalThreshold

      // Log if enabled
      if (enableLogging) {
        if (isPerformanceCritical) {
          console.warn(`⚠️ Critical FPS: ${fps} (threshold: ${criticalThreshold})`)
        } else if (isPerformanceWarning) {
          console.warn(`⚠️ Low FPS: ${fps} (threshold: ${warningThreshold})`)
        } else {
          console.log(`✓ FPS: ${fps} (avg: ${averageFps})`)
        }
      }

      // Update metrics
      setMetrics({
        currentFps: fps,
        averageFps,
        minFps,
        maxFps,
        isPerformanceWarning,
        isPerformanceCritical,
        frameDropCount: frameDropCountRef.current,
        lastFrameTime: now
      })

      // Reset counters
      frameCountRef.current = 0
      lastTimeRef.current = now
    }

    // Continue measuring
    animationFrameIdRef.current = requestAnimationFrame(measureFPS)
  }, [sampleWindow, warningThreshold, criticalThreshold, enableLogging])

  // Start FPS monitoring
  useEffect(() => {
    lastTimeRef.current = performance.now()
    animationFrameIdRef.current = requestAnimationFrame(measureFPS)

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [measureFPS])

  return metrics
}

/**
 * Hook for dynamic animation quality based on frame rate
 *
 * @returns Animation quality level and settings
 *
 * @example
 * ```tsx
 * const { quality, settings, shouldReduceMotion } = useAnimationQuality()
 *
 * <motion.div
 *   animate={{ opacity: 1 }}
 *   transition={{ duration: settings.duration }}
 * />
 * ```
 */
export function useAnimationQuality() {
  const { currentFps, averageFps, isPerformanceCritical } = useFrameRate({
    warningThreshold: 45,
    criticalThreshold: 30
  })

  // Check for prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Determine quality level
  const quality = (() => {
    if (prefersReducedMotion) return 'none'
    if (isPerformanceCritical || averageFps < 30) return 'low'
    if (averageFps < 45) return 'medium'
    return 'high'
  })() as 'none' | 'low' | 'medium' | 'high'

  // Quality settings
  const settings = {
    none: {
      duration: 0,
      enableBlur: false,
      enableTransform: false,
      enableOpacity: true,
      enableScale: false,
      stiffness: 0,
      damping: 0,
      maxConcurrentAnimations: 0
    },
    low: {
      duration: 0.15,
      enableBlur: false,
      enableTransform: true,
      enableOpacity: true,
      enableScale: false,
      stiffness: 400,
      damping: 40,
      maxConcurrentAnimations: 2
    },
    medium: {
      duration: 0.25,
      enableBlur: false,
      enableTransform: true,
      enableOpacity: true,
      enableScale: true,
      stiffness: 300,
      damping: 30,
      maxConcurrentAnimations: 4
    },
    high: {
      duration: 0.35,
      enableBlur: true,
      enableTransform: true,
      enableOpacity: true,
      enableScale: true,
      stiffness: 300,
      damping: 25,
      maxConcurrentAnimations: 8
    }
  }[quality]

  return {
    quality,
    settings,
    currentFps,
    averageFps,
    shouldReduceMotion: quality === 'none' || quality === 'low',
    isPerformanceCritical
  }
}

/**
 * Hook for monitoring and optimizing animation performance
 * Automatically applies GPU acceleration hints
 *
 * @returns GPU acceleration utilities
 */
export function useGPUAcceleration() {
  const { quality } = useAnimationQuality()

  /**
   * Get CSS properties for GPU acceleration
   */
  const getAccelerationStyles = useCallback((forceAcceleration: boolean = true) => {
    if (quality === 'none') {
      return {}
    }

    return {
      willChange: 'transform, opacity',
      transform: forceAcceleration ? 'translateZ(0)' : undefined,
      backfaceVisibility: 'hidden' as const,
      perspective: 1000
    }
  }, [quality])

  /**
   * Check if an element is GPU accelerated
   */
  const isGPUAccelerated = useCallback((element: HTMLElement): boolean => {
    if (typeof window === 'undefined') return false

    const styles = window.getComputedStyle(element)
    const transform = styles.transform
    const willChange = styles.willChange

    // Check for 3D transform or will-change
    return (
      transform !== 'none' ||
      willChange.includes('transform') ||
      willChange.includes('opacity')
    )
  }, [])

  return {
    getAccelerationStyles,
    isGPUAccelerated,
    quality
  }
}
