'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAdvancedDeviceCapabilities } from './useAdvancedGestures'

// Performance monitoring hook
export function useMobilePerformance() {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    memoryUsage: 0,
    connectionSpeed: 'unknown',
    isLowPerformanceDevice: false,
    batteryLevel: null as number | null,
    isCharging: false
  })

  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const { screenSize, pixelRatio } = useAdvancedDeviceCapabilities()

  // FPS monitoring
  useEffect(() => {
    let animationId: number

    const measureFPS = () => {
      const now = performance.now()
      frameCountRef.current++

      if (now - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current))

        setPerformanceMetrics(prev => ({
          ...prev,
          fps
        }))

        frameCountRef.current = 0
        lastTimeRef.current = now
      }

      animationId = requestAnimationFrame(measureFPS)
    }

    animationId = requestAnimationFrame(measureFPS)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  // Memory usage monitoring
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const memoryUsage = Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100)

        setPerformanceMetrics(prev => ({
          ...prev,
          memoryUsage
        }))
      }
    }

    updateMemoryUsage()
    const interval = setInterval(updateMemoryUsage, 5000)

    return () => clearInterval(interval)
  }, [])

  // Connection speed detection
  useEffect(() => {
    const updateConnectionSpeed = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        setPerformanceMetrics(prev => ({
          ...prev,
          connectionSpeed: connection?.effectiveType || 'unknown'
        }))
      }
    }

    updateConnectionSpeed()

    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection?.addEventListener('change', updateConnectionSpeed)

      return () => {
        connection?.removeEventListener('change', updateConnectionSpeed)
      }
    }
  }, [])

  // Battery status monitoring
  useEffect(() => {
    const updateBatteryStatus = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery()

          setPerformanceMetrics(prev => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100),
            isCharging: battery.charging
          }))

          const handleBatteryChange = () => {
            setPerformanceMetrics(prev => ({
              ...prev,
              batteryLevel: Math.round(battery.level * 100),
              isCharging: battery.charging
            }))
          }

          battery.addEventListener('levelchange', handleBatteryChange)
          battery.addEventListener('chargingchange', handleBatteryChange)

          return () => {
            battery.removeEventListener('levelchange', handleBatteryChange)
            battery.removeEventListener('chargingchange', handleBatteryChange)
          }
        } catch (error) {
          console.log('Battery API not available:', error)
        }
      }
    }

    updateBatteryStatus()
  }, [])

  // Determine if device is low performance
  useEffect(() => {
    const isLowPerformanceDevice =
      screenSize === 'mobile' &&
      (performanceMetrics.fps < 45 ||
       performanceMetrics.memoryUsage > 80 ||
       performanceMetrics.connectionSpeed === 'slow-2g' ||
       performanceMetrics.connectionSpeed === '2g')

    setPerformanceMetrics(prev => ({
      ...prev,
      isLowPerformanceDevice
    }))
  }, [performanceMetrics.fps, performanceMetrics.memoryUsage, performanceMetrics.connectionSpeed, screenSize])

  return performanceMetrics
}

// Image optimization hook for mobile
export function useMobileImageOptimization() {
  const { screenSize, pixelRatio } = useAdvancedDeviceCapabilities()
  const { isLowPerformanceDevice, connectionSpeed } = useMobilePerformance()

  const getOptimizedImageUrl = useCallback((
    baseUrl: string,
    options: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'jpeg' | 'png' | 'auto'
    } = {}
  ) => {
    const {
      width = 400,
      height = 600,
      quality = 80,
      format = 'auto'
    } = options

    // Adjust quality based on performance and connection
    let adjustedQuality = quality
    if (isLowPerformanceDevice || connectionSpeed === '2g' || connectionSpeed === 'slow-2g') {
      adjustedQuality = Math.max(50, quality * 0.7)
    }

    // Adjust dimensions based on screen size and pixel ratio
    const screenMultiplier = {
      mobile: 1,
      tablet: 1.5,
      desktop: 2
    }[screenSize] || 1

    const finalWidth = Math.round(width * screenMultiplier * Math.min(pixelRatio, 2))
    const finalHeight = Math.round(height * screenMultiplier * Math.min(pixelRatio, 2))

    // For now, return the original URL
    // In a real implementation, this would integrate with an image optimization service
    return baseUrl
  }, [screenSize, pixelRatio, isLowPerformanceDevice, connectionSpeed])

  const preloadImage = useCallback((src: string) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = reject
      img.src = src
    })
  }, [])

  const lazyLoadImage = useCallback((
    element: HTMLImageElement,
    src: string,
    options: {
      placeholder?: string
      threshold?: number
    } = {}
  ) => {
    const { placeholder, threshold = 0.1 } = options

    if (placeholder) {
      element.src = placeholder
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = src
            observer.unobserve(img)
          }
        })
      },
      { threshold }
    )

    observer.observe(element)

    return () => observer.unobserve(element)
  }, [])

  return {
    getOptimizedImageUrl,
    preloadImage,
    lazyLoadImage
  }
}

// Gesture debouncing hook for performance
export function useMobileGestureDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 16
): T {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastArgsRef = useRef<Parameters<T>>()

  // Update the callback ref when callback changes
  callbackRef.current = callback

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...lastArgsRef.current!)
      }, delay)
    },
    [delay]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback as T
}

// Animation frame optimization hook
export function useAnimationFrame(callback: (deltaTime: number) => void) {
  const requestRef = useRef<number>()
  const previousTimeRef = useRef<number>()
  const callbackRef = useRef(callback)

  callbackRef.current = callback

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current
      callbackRef.current(deltaTime)
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [animate])
}

// Memory leak detection and cleanup
export function useMobileMemoryManagement() {
  const cleanupFunctionsRef = useRef<Array<() => void>>([])
  const { memoryUsage } = useMobilePerformance()

  const addCleanupFunction = useCallback((cleanup: () => void) => {
    cleanupFunctionsRef.current.push(cleanup)
  }, [])

  const removeCleanupFunction = useCallback((cleanup: () => void) => {
    const index = cleanupFunctionsRef.current.indexOf(cleanup)
    if (index > -1) {
      cleanupFunctionsRef.current.splice(index, 1)
    }
  }, [])

  const performCleanup = useCallback(() => {
    cleanupFunctionsRef.current.forEach(cleanup => {
      try {
        cleanup()
      } catch (error) {
        console.warn('Cleanup function failed:', error)
      }
    })
  }, [])

  // Perform cleanup when memory usage is high
  useEffect(() => {
    if (memoryUsage > 85) {
      console.log('High memory usage detected, performing cleanup')
      performCleanup()
    }
  }, [memoryUsage, performCleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      performCleanup()
    }
  }, [performCleanup])

  return {
    addCleanupFunction,
    removeCleanupFunction,
    performCleanup,
    memoryUsage
  }
}

// Adaptive quality hook based on performance
export function useAdaptiveQuality() {
  const { fps, isLowPerformanceDevice, connectionSpeed, memoryUsage } = useMobilePerformance()
  const [qualityLevel, setQualityLevel] = useState<'low' | 'medium' | 'high'>('high')

  useEffect(() => {
    let newQuality: 'low' | 'medium' | 'high' = 'high'

    if (isLowPerformanceDevice ||
        fps < 30 ||
        memoryUsage > 80 ||
        connectionSpeed === '2g' ||
        connectionSpeed === 'slow-2g') {
      newQuality = 'low'
    } else if (fps < 50 ||
               memoryUsage > 60 ||
               connectionSpeed === '3g') {
      newQuality = 'medium'
    }

    setQualityLevel(newQuality)
  }, [fps, isLowPerformanceDevice, connectionSpeed, memoryUsage])

  const getQualitySettings = useCallback(() => {
    const settings = {
      low: {
        animationDuration: 0.2,
        imageQuality: 50,
        enableParticles: false,
        enableShadows: false,
        maxConcurrentAnimations: 2
      },
      medium: {
        animationDuration: 0.3,
        imageQuality: 70,
        enableParticles: true,
        enableShadows: false,
        maxConcurrentAnimations: 4
      },
      high: {
        animationDuration: 0.5,
        imageQuality: 90,
        enableParticles: true,
        enableShadows: true,
        maxConcurrentAnimations: 8
      }
    }

    return settings[qualityLevel]
  }, [qualityLevel])

  return {
    qualityLevel,
    settings: getQualitySettings()
  }
}