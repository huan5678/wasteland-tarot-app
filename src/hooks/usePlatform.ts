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
 * Hook to get Android device information
 * Detects Android version and gesture navigation
 */
export function useAndroidDeviceInfo() {
  const isAndroid = useIsAndroid();
  const [androidVersion, setAndroidVersion] = useState<number | null>(null);
  const [hasGestureNav, setHasGestureNav] = useState(false);

  useEffect(() => {
    if (!isAndroid || typeof window === 'undefined') return;

    // Detect Android version
    const match = navigator.userAgent.match(/Android (\d+)/);
    if (match) {
      const version = parseInt(match[1], 10);
      setAndroidVersion(version);

      // Android 10+ (API 29+) defaults to gesture navigation
      // Gesture navigation adds ~48px system bar height
      setHasGestureNav(version >= 10);
    }
  }, [isAndroid]);

  return {
    isAndroid,
    androidVersion,
    hasGestureNav,
    // Gesture navigation bar adds extra bottom padding
    gestureNavHeight: hasGestureNav ? 16 : 0,
    // Device supports Material Design 3
    supportsMD3: androidVersion ? androidVersion >= 12 : false
  };
}

/**
 * Hook to check if device has Dynamic Island (iPhone 14 Pro+)
 * Dynamic Island devices have safe-area-inset-top > 50px
 * Standard notch devices (iPhone X-13): ~47px
 * Dynamic Island devices (iPhone 14 Pro+): ~59px
 */
export function useHasDynamicIsland(): boolean {
  const isIOS = useIsIOS();
  const safeAreaTop = useSafeAreaTop();

  // Dynamic Island threshold: > 50px (distinguishes from standard notch)
  return isIOS && safeAreaTop > 50;
}

/**
 * Hook to get iOS model information
 * Detects specific iOS device characteristics for adaptive UI
 */
export function useIOSDeviceInfo() {
  const isIOS = useIsIOS();
  const hasDynamicIsland = useHasDynamicIsland();
  const safeAreaTop = useSafeAreaTop();

  return {
    isIOS,
    hasDynamicIsland,
    safeAreaTop,
    // Determine recommended header height based on device
    recommendedHeaderHeight: hasDynamicIsland ? 59 : safeAreaTop > 0 ? 56 : 56,
    // Device category for UI adaptation
    deviceType: hasDynamicIsland
      ? 'dynamic-island'
      : safeAreaTop > 44
        ? 'notch'
        : safeAreaTop > 0
          ? 'home-indicator-only'
          : 'legacy'
  };
}

/**
 * Hook to detect iOS version
 * Useful for iOS 15-17 compatibility checks
 */
export function useIOSVersion(): number | null {
  const [version, setVersion] = useState<number | null>(null);
  const isIOS = useIsIOS();

  useEffect(() => {
    if (!isIOS || typeof window === 'undefined') return;

    const match = navigator.userAgent.match(/OS (\d+)_/);
    if (match) {
      setVersion(parseInt(match[1], 10));
    }
  }, [isIOS]);

  return version;
}

/**
 * Helper hook to get safe-area-inset-top value
 */
function useSafeAreaTop(): number {
  const [top, setTop] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateTop = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      const value = computedStyle.getPropertyValue('--safe-area-top');
      setTop(parseFloat(value) || 0);
    };

    // Initial update
    updateTop();

    // Update on resize (for device rotation)
    window.addEventListener('resize', updateTop);
    return () => window.removeEventListener('resize', updateTop);
  }, []);

  return top;
}
