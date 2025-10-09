/**
 * useGlitch Hook
 *
 * 管理 Colour Shift Glitch 效果的隨機觸發邏輯。
 *
 * 功能：
 * - 隨機觸發 glitch 效果（8-15 秒間隔）
 * - 整合 Page Visibility API（分頁隱藏時停用）
 * - 偵測 prefers-reduced-motion（完全停用）
 * - 行動裝置降低觸發頻率（間隔 x2）
 * - 自動清理計時器資源
 *
 * @example
 * ```tsx
 * const { isGlitching } = useGlitch({
 *   minInterval: 8000,
 *   maxInterval: 15000,
 *   enabled: true,
 *   isMobile: false,
 * });
 *
 * <h1 className={isGlitching ? styles['hero-title-glitching'] : ''}>
 *   {title}
 * </h1>
 * ```
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { usePageVisibility } from './usePageVisibility';

/**
 * useGlitch Hook 選項
 */
export interface UseGlitchOptions {
  /** 最小觸發間隔（毫秒，預設 8000） */
  minInterval?: number;
  /** 最大觸發間隔（毫秒，預設 15000） */
  maxInterval?: number;
  /** 是否啟用 glitch（預設 true） */
  enabled?: boolean;
  /** 是否為行動裝置（降低觸發頻率，預設 false） */
  isMobile?: boolean;
}

/**
 * useGlitch Hook 返回值
 */
export interface UseGlitchReturn {
  /** 當前是否正在執行 glitch 效果 */
  isGlitching: boolean;
}

/**
 * Glitch 效果持續時間（毫秒）
 * 符合 CSS 動畫的 250ms 持續時間
 */
const GLITCH_DURATION = 250;

/**
 * useGlitch Hook
 *
 * 提供隨機觸發的 Colour Shift Glitch 效果控制。
 *
 * @param options - Hook 選項
 * @returns { isGlitching } - 當前 glitch 狀態
 */
export function useGlitch({
  minInterval = 8000,
  maxInterval = 15000,
  enabled = true,
  isMobile = false,
}: UseGlitchOptions = {}): UseGlitchReturn {
  const [isGlitching, setIsGlitching] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const glitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isVisible = usePageVisibility();

  // 偵測 prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    // 停用條件：未啟用、偏好減少動畫、分頁隱藏
    if (!enabled || prefersReducedMotion || !isVisible) {
      // 清理現有計時器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (glitchTimeoutRef.current) {
        clearTimeout(glitchTimeoutRef.current);
        glitchTimeoutRef.current = null;
      }

      // 重置 glitching 狀態
      setIsGlitching(false);
      return;
    }

    // 行動裝置降低觸發頻率（間隔 x2）
    const adjustedMinInterval = isMobile ? minInterval * 2 : minInterval;
    const adjustedMaxInterval = isMobile ? maxInterval * 2 : maxInterval;

    /**
     * 排程下一次 glitch 觸發
     * 使用隨機間隔在 adjustedMinInterval 和 adjustedMaxInterval 之間
     */
    const scheduleNextGlitch = () => {
      const randomDelay =
        Math.random() * (adjustedMaxInterval - adjustedMinInterval) +
        adjustedMinInterval;

      timeoutRef.current = setTimeout(() => {
        // 觸發 glitch 效果
        setIsGlitching(true);

        // Glitch 持續 250ms 後重置
        glitchTimeoutRef.current = setTimeout(() => {
          setIsGlitching(false);
          // 排程下一次觸發
          scheduleNextGlitch();
        }, GLITCH_DURATION);
      }, randomDelay);
    };

    // 啟動首次排程
    scheduleNextGlitch();

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (glitchTimeoutRef.current) {
        clearTimeout(glitchTimeoutRef.current);
        glitchTimeoutRef.current = null;
      }
    };
  }, [
    enabled,
    prefersReducedMotion,
    isVisible,
    minInterval,
    maxInterval,
    isMobile,
  ]);

  return { isGlitching };
}
