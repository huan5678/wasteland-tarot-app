/**
 * useMediaQuery - Media Query Hook
 * 媒體查詢 Hook
 *
 * Task 25: 實作 Drawer 與 Sheet 的協調邏輯
 * Requirements 7.1, 7.2: 響應式設計、行動裝置適配
 *
 * Features:
 * - 偵測桌面/行動裝置
 * - 響應式媒體查詢
 * - SSR 安全（hydration mismatch prevention）
 */

'use client';

import { useState, useEffect } from 'react';

/**
 * useMediaQuery - 偵測媒體查詢是否匹配
 *
 * @param query - CSS 媒體查詢字串（例如: '(min-width: 768px)'）
 * @returns boolean - 是否匹配該媒體查詢
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isDesktop = useMediaQuery('(min-width: 768px)');
 *
 *   return (
 *     <div>
 *       {isDesktop ? 'Desktop View' : 'Mobile View'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMediaQuery(query: string): boolean {
  // SSR 預設為 false（mobile-first approach）
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 標記已掛載（避免 hydration mismatch）
    setMounted(true);

    // 檢查瀏覽器是否支援 matchMedia
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    // 建立 MediaQueryList 物件
    const mediaQueryList = window.matchMedia(query);

    // 設定初始值
    setMatches(mediaQueryList.matches);

    // 定義事件處理器
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 新版 API (addEventListener)
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);

      return () => {
        mediaQueryList.removeEventListener('change', handleChange);
      };
    }
    // 舊版 API (addListener) - 向後相容
    else if (mediaQueryList.addListener) {
      mediaQueryList.addListener(handleChange);

      return () => {
        mediaQueryList.removeListener(handleChange);
      };
    }
  }, [query]);

  // 防止 hydration mismatch：掛載前回傳 false
  if (!mounted) {
    return false;
  }

  return matches;
}

/**
 * useIsDesktop - 偵測是否為桌面裝置
 *
 * @returns boolean - 是否為桌面裝置 (>= 768px)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isDesktop = useIsDesktop();
 *
 *   return <div>{isDesktop ? 'Desktop' : 'Mobile'}</div>;
 * }
 * ```
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)');
}

/**
 * useIsMobile - 偵測是否為行動裝置
 *
 * @returns boolean - 是否為行動裝置 (< 768px)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *
 *   return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>;
 * }
 * ```
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * useIsTablet - 偵測是否為平板裝置
 *
 * @returns boolean - 是否為平板裝置 (768px - 1023px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * useBreakpoint - 取得當前斷點
 *
 * @returns 'mobile' | 'tablet' | 'desktop'
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const breakpoint = useBreakpoint();
 *
 *   return <div>Current: {breakpoint}</div>;
 * }
 * ```
 */
export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  if (isDesktop) return 'desktop';
  if (isTablet) return 'tablet';
  return 'mobile';
}

/**
 * usePrefersDarkMode - 偵測使用者是否偏好深色模式
 *
 * @returns boolean - 是否偏好深色模式
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * usePrefersReducedMotion - 偵測使用者是否偏好減少動畫
 *
 * @returns boolean - 是否偏好減少動畫
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const prefersReducedMotion = usePrefersReducedMotion();
 *
 *   return (
 *     <motion.div
 *       animate={prefersReducedMotion ? {} : { scale: 1.2 }}
 *     />
 *   );
 * }
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
