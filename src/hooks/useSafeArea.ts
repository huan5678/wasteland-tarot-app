/**
 * useSafeArea - Safe Area Insets Hook
 * Spec: mobile-native-app-layout
 * Phase 1: Safe Area Integration
 * 
 * Provides safe area inset values for iOS notch and home indicator support
 */

'use client';

import { useState, useEffect } from 'react';

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Hook to get safe area inset values
 * Returns the safe area insets for iOS devices with notch/Dynamic Island
 * 
 * @returns SafeAreaInsets object with top, right, bottom, left values in pixels
 */
export function useSafeArea(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const computedStyle = getComputedStyle(document.documentElement);

    const getInsetValue = (property: string): number => {
      const value = computedStyle.getPropertyValue(property);
      return parseFloat(value) || 0;
    };

    const updateInsets = () => {
      setInsets({
        top: getInsetValue('--safe-area-top'),
        right: getInsetValue('--safe-area-right'),
        bottom: getInsetValue('--safe-area-bottom'),
        left: getInsetValue('--safe-area-left')
      });
    };

    // Initial update
    updateInsets();

    // Update on resize (for device rotation)
    window.addEventListener('resize', updateInsets);
    
    return () => {
      window.removeEventListener('resize', updateInsets);
    };
  }, []);

  return insets;
}

/**
 * Hook to get app shell dimensions (header + bottom nav heights)
 */
export function useAppShellDimensions() {
  const safeArea = useSafeArea();
  
  return {
    appBarHeight: 56,
    bottomNavHeight: 64,
    appBarTotalHeight: 56 + safeArea.top,
    bottomNavTotalHeight: 64 + safeArea.bottom,
    contentAvailableHeight: `calc(100vh - ${56 + safeArea.top}px - ${64 + safeArea.bottom}px)`
  };
}
