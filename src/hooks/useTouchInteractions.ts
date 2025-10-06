'use client'

import { useCallback, useRef, useEffect } from 'react'

export interface TouchInteractionOptions {
  enableHaptic?: boolean
  longPressDelay?: number
  swipeThreshold?: number
  enableDoubleTap?: boolean
}

export interface TouchInteractionHandlers {
  onTap?: (event: TouchEvent | MouseEvent) => void
  onLongPress?: (event: TouchEvent | MouseEvent) => void
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', event: TouchEvent) => void
  onDoubleTap?: (event: TouchEvent | MouseEvent) => void
}

export function useTouchInteractions(
  handlers: TouchInteractionHandlers,
  options: TouchInteractionOptions = {}
) {
  const {
    enableHaptic = true,
    longPressDelay = 500,
    swipeThreshold = 50,
    enableDoubleTap = false
  } = options

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTapRef = useRef<number>(0)
  const isLongPressRef = useRef(false)

  // Enhanced haptic feedback with different patterns
  const triggerHaptic = useCallback((pattern: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHaptic || typeof navigator === 'undefined' || !navigator.vibrate) return

    try {
      const patterns = {
        light: [10],
        medium: [10, 20, 10],
        heavy: [20, 50, 20]
      }
      navigator.vibrate(patterns[pattern])
    } catch (e) {
      // Silently fail on unsupported browsers
    }
  }, [enableHaptic])

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0]
    if (!touch) return

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    isLongPressRef.current = false

    // Set up long press detection
    if (handlers.onLongPress) {
      longPressTimeoutRef.current = setTimeout(() => {
        isLongPressRef.current = true
        triggerHaptic('heavy')
        handlers.onLongPress!(event)
      }, longPressDelay)
    }
  }, [handlers.onLongPress, longPressDelay, triggerHaptic])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    // Cancel long press if user moves finger
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }
  }, [])

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }

    if (isLongPressRef.current) {
      // Long press was already handled
      return
    }

    const touchStart = touchStartRef.current
    if (!touchStart) return

    const touch = event.changedTouches[0]
    if (!touch) return

    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    const deltaTime = Date.now() - touchStart.time
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Check for swipe
    if (handlers.onSwipe && distance > swipeThreshold && deltaTime < 300) {
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      let direction: 'left' | 'right' | 'up' | 'down'
      if (absDeltaX > absDeltaY) {
        direction = deltaX > 0 ? 'right' : 'left'
      } else {
        direction = deltaY > 0 ? 'down' : 'up'
      }

      triggerHaptic('medium')
      handlers.onSwipe(direction, event)
      return
    }

    // Check for tap (not moved much and quick)
    if (distance < 10 && deltaTime < 300) {
      const now = Date.now()

      // Check for double tap
      if (enableDoubleTap && now - lastTapRef.current < 300) {
        if (handlers.onDoubleTap) {
          triggerHaptic('heavy')
          handlers.onDoubleTap(event)
          lastTapRef.current = 0 // Reset to prevent triple tap
          return
        }
      }

      lastTapRef.current = now

      // Single tap
      setTimeout(() => {
        if (now === lastTapRef.current && handlers.onTap) {
          triggerHaptic('light')
          handlers.onTap(event)
        }
      }, enableDoubleTap ? 300 : 0)
    }

    touchStartRef.current = null
  }, [
    handlers.onSwipe,
    handlers.onTap,
    handlers.onDoubleTap,
    swipeThreshold,
    enableDoubleTap,
    triggerHaptic
  ])

  // Mouse event handlers for desktop compatibility
  const handleMouseDown = useCallback((event: MouseEvent) => {
    touchStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      time: Date.now()
    }

    isLongPressRef.current = false

    if (handlers.onLongPress) {
      longPressTimeoutRef.current = setTimeout(() => {
        isLongPressRef.current = true
        handlers.onLongPress!(event)
      }, longPressDelay)
    }
  }, [handlers.onLongPress, longPressDelay])

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }

    if (isLongPressRef.current) {
      return
    }

    const touchStart = touchStartRef.current
    if (!touchStart) return

    const deltaTime = Date.now() - touchStart.time
    const deltaX = event.clientX - touchStart.x
    const deltaY = event.clientY - touchStart.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (distance < 10 && deltaTime < 300) {
      const now = Date.now()

      if (enableDoubleTap && now - lastTapRef.current < 300) {
        if (handlers.onDoubleTap) {
          handlers.onDoubleTap(event)
          lastTapRef.current = 0
          return
        }
      }

      lastTapRef.current = now

      setTimeout(() => {
        if (now === lastTapRef.current && handlers.onTap) {
          handlers.onTap(event)
        }
      }, enableDoubleTap ? 300 : 0)
    }

    touchStartRef.current = null
  }, [handlers.onTap, handlers.onDoubleTap, enableDoubleTap])

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
      }
    }
  }, [])

  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    mouseHandlers: {
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
    },
    triggerHaptic
  }
}

// Hook for detecting device capabilities
export function useDeviceCapabilities() {
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window
  const hasHapticFeedback = typeof navigator !== 'undefined' && !!navigator.vibrate
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return {
    isTouchDevice,
    hasHapticFeedback,
    prefersReducedMotion
  }
}