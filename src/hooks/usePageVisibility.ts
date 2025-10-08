/**
 * usePageVisibility Hook
 *
 * 偵測頁面可見性狀態，用於在分頁切換時暫停/恢復動畫
 *
 * @example
 * ```tsx
 * const isVisible = usePageVisibility();
 *
 * useEffect(() => {
 *   if (isVisible) {
 *     // 恢復動畫
 *   } else {
 *     // 暫停動畫
 *   }
 * }, [isVisible]);
 * ```
 */

import { useState, useEffect } from 'react';

/**
 * Hook 返回值：頁面是否可見
 */
export function usePageVisibility(): boolean {
  // 初始狀態：根據當前文檔可見性設定
  const [isVisible, setIsVisible] = useState(() => {
    // SSR 安全檢查
    if (typeof document === 'undefined') {
      return true;
    }
    return document.visibilityState === 'visible';
  });

  useEffect(() => {
    // SSR 安全檢查
    if (typeof document === 'undefined') {
      return;
    }

    /**
     * 處理可見性變更事件
     */
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    // 註冊事件監聽器
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup: 移除事件監聽器
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
