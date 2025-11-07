/**
 * usePlatform - Platform Detection Hook
 * Spec: mobile-native-app-layout
 * Phase 1: Platform Detection
 * 
 * Detects the operating system platform (iOS, Android, or Web)
 * for platform-specific UI adaptations
 */

'use client';

import { useState, useEffect } from 'react';

export type Platform = 'ios' | 'android' | 'web';

/**
 * Hook to detect the current platform
 * 
 * @returns 'ios' | 'android' | 'web'
 */
export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>('web');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios');
    } else if (/android/.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('web');
    }
  }, []);

  return platform;
}

/**
 * Hook to check if device is iOS
 */
export function useIsIOS(): boolean {
  return usePlatform() === 'ios';
}

/**
 * Hook to check if device is Android
 */
export function useIsAndroid(): boolean {
  return usePlatform() === 'android';
}

/**
 * Hook to check if device has Dynamic Island (iPhone 14 Pro+)
 */
export function useHasDynamicIsland(): boolean {
  const isIOS = useIsIOS();
  const safeAreaTop = useSafeAreaTop();
  
  // Dynamic Island devices have safe-area-inset-top > 50px
  return isIOS && safeAreaTop > 50;
}

/**
 * Helper hook to get safe-area-inset-top value
 */
function useSafeAreaTop(): number {
  const [top, setTop] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const computedStyle = getComputedStyle(document.documentElement);
    const value = computedStyle.getPropertyValue('--safe-area-top');
    setTop(parseFloat(value) || 0);
  }, []);

  return top;
}
