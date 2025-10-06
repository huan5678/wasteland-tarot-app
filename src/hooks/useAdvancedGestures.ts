'use client'

import { useCallback, useRef, useEffect, useMemo } from 'react'
import { useGesture } from '@use-gesture/react'
import { useSpring } from '@react-spring/web'

export interface AdvancedGestureOptions {
  enablePinch?: boolean
  enableSwipe?: boolean
  enableDoubleTap?: boolean
  enableHaptic?: boolean
  swipeThreshold?: number
  longPressDelay?: number
  doubleTapDelay?: number
  preventScroll?: boolean
  bounds?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
  rubberband?: boolean
}

export interface AdvancedGestureHandlers {
  onTap?: (event: any) => void
  onDoubleTap?: (event: any) => void
  onLongPress?: (event: any) => void
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', event: any) => void
  onPinch?: (scale: number, event: any) => void
  onPinchStart?: (event: any) => void
  onPinchEnd?: (event: any) => void
  onDrag?: (position: { x: number; y: number }, event: any) => void
  onDragStart?: (event: any) => void
  onDragEnd?: (event: any) => void
  onPan?: (delta: { x: number; y: number }, event: any) => void
}

export function useAdvancedGestures(
  handlers: AdvancedGestureHandlers,
  options: AdvancedGestureOptions = {}
) {
  const {
    enablePinch = true,
    enableSwipe = true,
    enableDoubleTap = true,
    enableHaptic = true,
    swipeThreshold = 50,
    longPressDelay = 600,
    doubleTapDelay = 300,
    preventScroll = false,
    bounds,
    rubberband = true
  } = options

  // Animation springs for smooth transitions
  const [{ x, y, scale, rotate }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    config: { mass: 1, tension: 280, friction: 60 }
  }))

  // State refs for gesture tracking
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTapRef = useRef<number>(0)
  const isPinchingRef = useRef(false)
  const initialScaleRef = useRef(1)
  const gestureStateRef = useRef({
    isDragging: false,
    isPinching: false,
    isLongPressing: false
  })

  // Enhanced haptic feedback with different patterns
  const triggerHaptic = useCallback((pattern: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
    if (!enableHaptic || typeof navigator === 'undefined' || !navigator.vibrate) return

    try {
      const patterns = {
        light: [10],
        medium: [10, 20, 10],
        heavy: [20, 50, 20],
        success: [10, 20, 10, 20, 10],
        error: [100, 50, 100]
      }
      navigator.vibrate(patterns[pattern])
    } catch (e) {
      // Silently fail on unsupported browsers
    }
  }, [enableHaptic])

  // Gesture binding using @use-gesture/react
  const bind = useGesture(
    {
      // Drag gestures for panning and positioning
      onDrag: ({ active, offset: [ox, oy], velocity: [vx, vy], direction: [dx, dy], ...state }) => {
        gestureStateRef.current.isDragging = active

        if (active) {
          api.start({
            x: ox,
            y: oy,
            immediate: true
          })

          handlers.onDrag?.({ x: ox, y: oy }, state)
        } else {
          // Handle momentum on release
          const momentumX = ox + vx * 50
          const momentumY = oy + vy * 50

          api.start({
            x: bounds ? Math.max(bounds.left || -Infinity, Math.min(bounds.right || Infinity, momentumX)) : momentumX,
            y: bounds ? Math.max(bounds.top || -Infinity, Math.min(bounds.bottom || Infinity, momentumY)) : momentumY
          })

          handlers.onDragEnd?.(state)
        }
      },
      onDragStart: (state) => {
        handlers.onDragStart?.(state)
        triggerHaptic('light')
      },

      // Pinch gestures for zooming
      onPinch: ({ offset: [scale], origin, first, last, ...state }) => {
        if (!enablePinch) return

        if (first) {
          isPinchingRef.current = true
          initialScaleRef.current = scale
          gestureStateRef.current.isPinching = true
          handlers.onPinchStart?.(state)
          triggerHaptic('medium')
        }

        api.start({
          scale: Math.max(0.1, Math.min(5, scale)),
          immediate: !last
        })

        handlers.onPinch?.(scale, state)

        if (last) {
          isPinchingRef.current = false
          gestureStateRef.current.isPinching = false
          handlers.onPinchEnd?.(state)
          triggerHaptic('light')
        }
      },

      // Wheel gestures for desktop zoom
      onWheel: ({ event, delta: [, dy], ...state }) => {
        if (!enablePinch) return

        event.preventDefault()

        const scaleChange = -dy / 1000
        api.start({
          scale: Math.max(0.1, Math.min(5, scale.get() + scaleChange))
        })

        handlers.onPinch?.(scale.get() + scaleChange, state)
      },

      // Move gestures for hover effects
      onMove: ({ xy: [mx, my], ...state }) => {
        if (!gestureStateRef.current.isDragging && !gestureStateRef.current.isPinching) {
          handlers.onPan?.({ x: mx, y: my }, state)
        }
      }
    },
    {
      drag: {
        from: () => [x.get(), y.get()],
        bounds: bounds ? {
          left: bounds.left || -Infinity,
          right: bounds.right || Infinity,
          top: bounds.top || -Infinity,
          bottom: bounds.bottom || Infinity
        } : undefined,
        rubberband: rubberband,
        threshold: 5,
        preventScroll,
        filterTaps: true
      },
      pinch: {
        scaleBounds: { min: 0.1, max: 5 },
        rubberband: true,
        from: () => [scale.get(), 0]
      },
      wheel: {
        modifierKey: null // Allow wheel without modifier keys
      }
    }
  )

  // Enhanced touch handlers for tap gestures
  const touchHandlers = useMemo(() => ({
    onTouchStart: (event: React.TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return

      // Set up long press detection
      if (handlers.onLongPress) {
        longPressTimeoutRef.current = setTimeout(() => {
          gestureStateRef.current.isLongPressing = true
          triggerHaptic('heavy')
          handlers.onLongPress!(event)
        }, longPressDelay)
      }
    },

    onTouchMove: () => {
      // Cancel long press if user moves finger
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
        longPressTimeoutRef.current = null
      }
    },

    onTouchEnd: (event: React.TouchEvent) => {
      // Clear long press timeout
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
        longPressTimeoutRef.current = null
      }

      if (gestureStateRef.current.isLongPressing) {
        gestureStateRef.current.isLongPressing = false
        return
      }

      // Handle tap and double tap
      const now = Date.now()
      const timeSinceLastTap = now - lastTapRef.current

      if (enableDoubleTap && timeSinceLastTap < doubleTapDelay) {
        // Double tap detected
        triggerHaptic('success')
        handlers.onDoubleTap?.(event)
        lastTapRef.current = 0 // Reset to prevent triple tap
      } else {
        // Single tap
        lastTapRef.current = now
        setTimeout(() => {
          if (lastTapRef.current === now) {
            triggerHaptic('light')
            handlers.onTap?.(event)
          }
        }, enableDoubleTap ? doubleTapDelay : 0)
      }
    }
  }), [handlers, longPressDelay, doubleTapDelay, enableDoubleTap, triggerHaptic])

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
      }
    }
  }, [])

  // Reset function to return to initial state
  const reset = useCallback(() => {
    api.start({
      x: 0,
      y: 0,
      scale: 1,
      rotate: 0
    })
  }, [api])

  // Animate to specific values
  const animateTo = useCallback((values: Partial<{ x: number; y: number; scale: number; rotate: number }>) => {
    api.start(values)
  }, [api])

  return {
    bind,
    touchHandlers,
    animations: { x, y, scale, rotate },
    api,
    reset,
    animateTo,
    triggerHaptic,
    gestureState: gestureStateRef.current
  }
}

// Hook for detecting advanced device capabilities
export function useAdvancedDeviceCapabilities() {
  const capabilities = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        isTouchDevice: false,
        hasHapticFeedback: false,
        prefersReducedMotion: false,
        supportsPinch: false,
        supportsOrientation: false,
        isIOS: false,
        isAndroid: false,
        screenSize: 'desktop' as 'mobile' | 'tablet' | 'desktop',
        pixelRatio: 1
      }
    }

    const userAgent = navigator.userAgent
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const hasHaptic = !!navigator.vibrate
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const supportsPinch = isTouch && 'TouchEvent' in window
    const supportsOrientation = 'orientation' in window
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    const isAndroid = /Android/.test(userAgent)
    const pixelRatio = window.devicePixelRatio || 1

    // Determine screen size category
    const screenWidth = window.innerWidth
    let screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop'
    if (screenWidth < 640) screenSize = 'mobile'
    else if (screenWidth < 1024) screenSize = 'tablet'

    return {
      isTouchDevice: isTouch,
      hasHapticFeedback: hasHaptic,
      prefersReducedMotion: prefersReduced,
      supportsPinch,
      supportsOrientation,
      isIOS,
      isAndroid,
      screenSize,
      pixelRatio
    }
  }, [])

  return capabilities
}