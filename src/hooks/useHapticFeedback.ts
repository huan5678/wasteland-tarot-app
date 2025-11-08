/**
 * useHapticFeedback - Haptic Feedback Hook
 * Spec: mobile-native-app-layout
 * Phase 2: Haptic Feedback Integration
 * Phase 4: Enhanced iOS Native Haptic Support
 *
 * Provides cross-platform haptic feedback support
 *
 * iOS Support:
 * - Attempts to use native UIImpactFeedbackGenerator via webkit API
 * - Falls back to Vibration API for older iOS versions
 * - Supports iOS 15, 16, 17 with appropriate feature detection
 *
 * Android Support:
 * - Uses standard Vibration API
 * - Optimized patterns for Android 11-14
 *
 * Requirements: AC-5.1, AC-7.1 (iOS haptics)
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePlatform, useIOSVersion } from './usePlatform';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';
export type IOSHapticStyle = 'light' | 'medium' | 'heavy';
export type IOSNotificationType = 'success' | 'warning' | 'error';

interface HapticFeedbackOptions {
  enabled?: boolean;
}

// Extended Window interface for iOS webkit haptics
declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        haptic?: {
          postMessage: (message: { type: string; style?: string }) => void;
        };
      };
    };
  }
}

/**
 * Hook to trigger haptic feedback
 * iOS: Attempts native UIImpactFeedbackGenerator, falls back to Vibration API
 * Android: Uses Vibration API
 * Web: No haptic (graceful degradation)
 */
export function useHapticFeedback(options: HapticFeedbackOptions = {}) {
  const { enabled = true } = options;
  const platform = usePlatform();
  const iosVersion = useIOSVersion();
  const [isSupported, setIsSupported] = useState(false);
  const [hasNativeIOSHaptics, setHasNativeIOSHaptics] = useState(false);

  useEffect(() => {
    // Check if vibration API is supported
    const vibrateSupported = 'vibrate' in navigator;
    setIsSupported(vibrateSupported);

    // Check for iOS webkit haptic API (iOS 13+)
    // Note: This is typically only available in WKWebView/PWA contexts
    if (platform === 'ios') {
      const hasWebkitHaptics = Boolean(
        window.webkit?.messageHandlers?.haptic
      );
      setHasNativeIOSHaptics(hasWebkitHaptics);
    }
  }, [platform]);

  const triggerIOSNativeHaptic = useCallback((type: HapticType) => {
    // Attempt to use native iOS haptic feedback via webkit
    try {
      if (window.webkit?.messageHandlers?.haptic) {
        const hapticMap: Record<HapticType, { type: string; style?: string }> = {
          light: { type: 'impact', style: 'light' },
          medium: { type: 'impact', style: 'medium' },
          heavy: { type: 'impact', style: 'heavy' },
          success: { type: 'notification', style: 'success' },
          error: { type: 'notification', style: 'error' },
          warning: { type: 'notification', style: 'warning' }
        };

        window.webkit.messageHandlers.haptic.postMessage(hapticMap[type]);
        return true; // Success
      }
    } catch (error) {
      console.debug('Native iOS haptic API not available:', error);
    }
    return false; // Fall back to vibration
  }, []);

  const triggerHaptic = useCallback((type: HapticType) => {
    if (!enabled || !isSupported) return;

    try {
      if (platform === 'ios') {
        // Try native iOS haptics first (iOS 13+, PWA context)
        const nativeSuccess = hasNativeIOSHaptics && triggerIOSNativeHaptic(type);

        if (!nativeSuccess) {
          // Fall back to Vibration API
          // iOS haptic patterns (optimized for iOS 15-17)
          const patterns: Record<HapticType, number[]> = {
            light: [10],        // Quick tap
            medium: [20],       // Standard tap
            heavy: [30],        // Strong tap
            success: [10, 30, 10],   // Light-pause-light
            error: [30, 30, 30],     // Heavy-pause-heavy
            warning: [20, 30, 20]    // Medium-pause-medium
          };
          navigator.vibrate(patterns[type]);
        }
      } else if (platform === 'android') {
        // Android haptic patterns (optimized for Android 11-14)
        const patterns: Record<HapticType, number[]> = {
          light: [15],        // Quick vibration
          medium: [25],       // Standard vibration
          heavy: [40],        // Strong vibration
          success: [15, 40, 15],   // Quick-pause-quick
          error: [40, 40, 40],     // Strong-pause-strong
          warning: [25, 40, 25]    // Medium-pause-medium
        };
        navigator.vibrate(patterns[type]);
      }
    } catch (error) {
      // Silently fail - haptic feedback is a nice-to-have
      console.debug('Haptic feedback not available:', error);
    }
  }, [enabled, isSupported, platform, hasNativeIOSHaptics, triggerIOSNativeHaptic]);

  return {
    triggerHaptic,
    isSupported,
    hasNativeIOSHaptics,
    iosVersion,
    // Expose platform info for debugging
    platform
  };
}

/**
 * Haptic feedback manager for common UI interactions
 */
export const HapticManager = {
  // Navigation
  onTabSwitch: (trigger: (type: HapticType) => void) => trigger('light'),
  onPageBack: (trigger: (type: HapticType) => void) => trigger('light'),
  
  // Actions
  onButtonClick: (trigger: (type: HapticType) => void) => trigger('medium'),
  onToggle: (trigger: (type: HapticType) => void) => trigger('light'),
  onLongPress: (trigger: (type: HapticType) => void) => trigger('medium'),
  
  // Feedback
  onSuccess: (trigger: (type: HapticType) => void) => trigger('success'),
  onError: (trigger: (type: HapticType) => void) => trigger('error'),
  onWarning: (trigger: (type: HapticType) => void) => trigger('warning'),
  onDelete: (trigger: (type: HapticType) => void) => trigger('heavy'),
  
  // Special
  onPullToRefresh: (trigger: (type: HapticType) => void) => trigger('medium'),
  onSwipeAction: (trigger: (type: HapticType) => void) => trigger('heavy')
};
