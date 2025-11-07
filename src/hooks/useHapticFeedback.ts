/**
 * useHapticFeedback - Haptic Feedback Hook
 * Spec: mobile-native-app-layout
 * Phase 2: Haptic Feedback Integration
 * 
 * Provides cross-platform haptic feedback support
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePlatform } from './usePlatform';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

interface HapticFeedbackOptions {
  enabled?: boolean;
}

/**
 * Hook to trigger haptic feedback
 * iOS: Uses UIImpactFeedbackGenerator
 * Android: Uses Vibration API
 * Web: No haptic (graceful degradation)
 */
export function useHapticFeedback(options: HapticFeedbackOptions = {}) {
  const { enabled = true } = options;
  const platform = usePlatform();
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if vibration API is supported
    setIsSupported('vibrate' in navigator);
  }, []);

  const triggerHaptic = useCallback((type: HapticType) => {
    if (!enabled || !isSupported) return;

    try {
      if (platform === 'ios') {
        // iOS-specific haptic patterns
        const patterns: Record<HapticType, number[]> = {
          light: [10],
          medium: [20],
          heavy: [30],
          success: [10, 50, 10],
          error: [30, 50, 30],
          warning: [20, 50, 20]
        };
        navigator.vibrate(patterns[type]);
      } else if (platform === 'android') {
        // Android-specific haptic patterns
        const patterns: Record<HapticType, number[]> = {
          light: [15],
          medium: [25],
          heavy: [40],
          success: [15, 50, 15],
          error: [40, 50, 40],
          warning: [25, 50, 25]
        };
        navigator.vibrate(patterns[type]);
      }
    } catch (error) {
      // Silently fail - haptic feedback is a nice-to-have
      console.debug('Haptic feedback not available:', error);
    }
  }, [enabled, isSupported, platform]);

  return {
    triggerHaptic,
    isSupported
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
