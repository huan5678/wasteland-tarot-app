/**
 * useRippleEffect - Material Design Ripple Effect Hook
 * Spec: mobile-native-app-layout
 * Phase 4: Android Ripple Effects
 *
 * Provides JavaScript-driven ripple effect for Android devices
 * CSS-only ripple available as fallback
 *
 * Requirements: AC-7.2 (Android ripple effects)
 */

'use client';

import { useCallback, useRef } from 'react';
import { useIsAndroid } from './usePlatform';

export interface RippleOptions {
  color?: string;
  duration?: number;
  disabled?: boolean;
}

/**
 * Hook to add Material Design ripple effect to elements
 *
 * @param options - Ripple configuration
 * @returns Event handlers and ref to attach to target element
 */
export function useRippleEffect(options: RippleOptions = {}) {
  const {
    color = 'rgba(255, 255, 255, 0.3)',
    duration = 600,
    disabled = false
  } = options;

  const isAndroid = useIsAndroid();
  const rippleRef = useRef<HTMLElement | null>(null);

  const createRipple = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    // Only create ripple on Android devices and when enabled
    if (disabled || !isAndroid || !rippleRef.current) return;

    const element = rippleRef.current;
    const rect = element.getBoundingClientRect();

    // Calculate click/touch position
    let clientX: number;
    let clientY: number;

    if ('touches' in event) {
      // Touch event
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      // Mouse event
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Create ripple element
    const ripple = document.createElement('span');
    ripple.className = 'ripple-element';

    // Calculate ripple size (cover entire element)
    const size = Math.max(rect.width, rect.height) * 2;

    // Style ripple
    Object.assign(ripple.style, {
      position: 'absolute',
      left: `${x - size / 2}px`,
      top: `${y - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: color,
      transform: 'scale(0)',
      opacity: '0.5',
      pointerEvents: 'none',
      animation: `ripple ${duration}ms ease-out`,
      zIndex: '1'
    });

    // Add ripple to element
    element.style.position = element.style.position || 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, duration);
  }, [color, duration, disabled, isAndroid]);

  return {
    rippleRef,
    onMouseDown: createRipple,
    onTouchStart: createRipple
  };
}

/**
 * Predefined ripple variants
 */
export const RippleVariants = {
  light: { color: 'rgba(255, 255, 255, 0.4)' },
  dark: { color: 'rgba(0, 0, 0, 0.2)' },
  pipBoy: { color: 'rgba(0, 255, 136, 0.3)' },
  primary: { color: 'rgba(0, 255, 136, 0.3)' },
  secondary: { color: 'rgba(255, 136, 0, 0.3)' },
  success: { color: 'rgba(0, 255, 65, 0.3)' },
  error: { color: 'rgba(239, 68, 68, 0.3)' }
} as const;
