/**
 * useEntranceAnimation Hook
 * 專門處理頁面載入時的入場動畫（不使用 ScrollTrigger）
 *
 * 適用於：
 * - Hero Section（頁面頂部）
 * - 任何一開始就在 viewport 內的元素
 *
 * 與 useScrollAnimation 的差異：
 * - useEntranceAnimation: 頁面載入後立即播放
 * - useScrollAnimation: 滾動到指定位置時才觸發
 */

import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useReducedMotion } from './useReducedMotion';
import { gsapConfig } from './gsapConfig';

// ✅ Import GSAP directly (like useStagger does)
import { gsap } from 'gsap';

/**
 * Animation configuration for entrance animation
 */
export interface EntranceAnimationConfig {
  /** CSS selector (scoped to container) 或 element ref */
  target: string | HTMLElement;
  /** Starting state (optional) */
  from?: gsap.TweenVars;
  /** Ending state (required) */
  to: gsap.TweenVars;
  /** Timeline position marker (e.g., '+=0.3', '<', '>') */
  position?: string | number;
}

/**
 * useEntranceAnimation hook options
 */
export interface UseEntranceAnimationOptions {
  /** 容器元素的 ref（用於限定選擇器範圍） */
  containerRef: RefObject<HTMLElement>;
  /** GSAP Timeline 動畫配置 */
  animations: EntranceAnimationConfig[];
  /** 延遲播放時間（秒，預設 0） */
  delay?: number;
  /** 是否啟用（支援條件式動畫） */
  enabled?: boolean;
}

/**
 * useEntranceAnimation hook return value
 */
export interface UseEntranceAnimationReturn {
  /** GSAP Timeline 實例（供手動控制） */
  timeline: gsap.core.Timeline | null;
  /** 動畫是否已初始化 */
  isReady: boolean;
  /** 手動播放動畫 */
  play: () => void;
  /** 手動暫停動畫 */
  pause: () => void;
}

/**
 * useEntranceAnimation - 頁面載入時的入場動畫（無 ScrollTrigger）
 *
 * @param options - Animation configuration options
 * @returns Animation control instances and status
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 *
 * useEntranceAnimation({
 *   containerRef,
 *   animations: [
 *     {
 *       target: '.hero-title',
 *       from: { opacity: 0, y: -20 },
 *       to: { opacity: 1, y: 0, duration: 0.8 }
 *     },
 *     {
 *       target: '.hero-cta',
 *       to: { opacity: 1, scale: 1, duration: 0.6 },
 *       position: '+=0.3'
 *     }
 *   ],
 *   delay: 0.2 // 延遲 0.2 秒播放
 * });
 * ```
 */
export function useEntranceAnimation(
  options: UseEntranceAnimationOptions
): UseEntranceAnimationReturn {
  const {
    containerRef,
    animations,
    delay = 0,
    enabled = true,
  } = options;

  // State
  const [isReady, setIsReady] = useState(false);

  // Refs to store GSAP instances
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Check reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  // Cleanup function stored in ref
  const cleanupRef = useRef<(() => void) | null>(null);

  // useLayoutEffect to initialize animations after DOM is ready
  useLayoutEffect(() => {
    // Early return if not enabled
    if (!enabled) {
      setIsReady(false);
      return;
    }

    // Check if containerRef is valid
    if (!containerRef.current) {
      console.warn(
        '[useEntranceAnimation] containerRef.current is null. Animation will not be initialized.'
      );
      setIsReady(false);
      return;
    }

    // Check if animations array is not empty
    if (!animations || animations.length === 0) {
      console.warn('[useEntranceAnimation] No animations provided.');
      setIsReady(false);
      return;
    }

    try {

      // ✅ Use gsap.context() to scope selectors to container element
      const ctx = gsap.context(() => {
        // Create Timeline with delay (paused initially to prevent immediate play)
        const timeline = gsap.timeline({
          paused: true, // Start paused, will play after delay
          delay: delay,
        });

        // Apply animations to timeline (selectors are scoped to containerRef.current)
        animations.forEach((animation) => {
          const { target, from, to, position } = animation;

          // Clone the 'to' object to avoid mutation
          const toVars = { ...to };

          // Override duration to 0 if reduced motion is enabled
          if (prefersReducedMotion && 'duration' in toVars) {
            toVars.duration = 0;
          }

          // Apply animation based on whether 'from' is provided
          if (from) {
            // fromTo animation
            if (position !== undefined) {
              timeline.fromTo(target, from, toVars, position);
            } else {
              timeline.fromTo(target, from, toVars);
            }
          } else {
            // to animation only
            if (position !== undefined) {
              timeline.to(target, toVars, position);
            } else {
              timeline.to(target, toVars);
            }
          }
        });

        // Store timeline in ref
        timelineRef.current = timeline;

        // Play timeline after setup
        requestAnimationFrame(() => {
          timeline.play();
        });
      }, containerRef); // ✅ Scope context to containerRef

      // Mark as ready
      setIsReady(true);

      // Setup cleanup function
      cleanupRef.current = () => {
        if (timelineRef.current) {
          timelineRef.current.kill();
        }
        // gsap.context() auto-cleanup will handle the rest
      };
    } catch (error) {
      console.error('[useEntranceAnimation] Failed to initialize GSAP animation:', error);
      setIsReady(false);
    }

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [
    containerRef,
    animations,
    delay,
    enabled,
    prefersReducedMotion,
  ]);

  // Control functions
  const play = () => {
    if (timelineRef.current) {
      timelineRef.current.play();
    }
  };

  const pause = () => {
    if (timelineRef.current) {
      timelineRef.current.pause();
    }
  };

  return {
    timeline: timelineRef.current,
    isReady,
    play,
    pause,
  };
}
