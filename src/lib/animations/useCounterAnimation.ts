/**
 * useCounterAnimation Hook
 * 實作數字滾動動畫（Stats Section 專用）
 *
 * Features:
 * - GSAP onUpdate callback 更新 React state
 * - 數字從 0 滾動至目標值
 * - 根據數字大小自動調整 duration
 * - Intl.NumberFormat 格式化（千位分隔）
 * - 整合 useReducedMotion（減少動畫時直接顯示最終數字）
 */

import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useReducedMotion } from './useReducedMotion';
import { gsapConfig } from './gsapConfig';

// ✅ Import GSAP directly (like useStagger does)
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugin immediately
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Number formatting options (Intl.NumberFormat compatible)
 */
export interface NumberFormatOptions {
  /** Use thousand separators (default: true) */
  useGrouping?: boolean;
  /** Minimum fraction digits (default: 0) */
  minimumFractionDigits?: number;
  /** Maximum fraction digits (default: 0) */
  maximumFractionDigits?: number;
  /** Locale (default: 'zh-TW') */
  locale?: string;
}

/**
 * ScrollTrigger configuration for counter animation
 */
export interface CounterScrollTriggerConfig {
  /** Trigger start position (default: "top 60%") */
  start?: string;
  /** Trigger end position (optional) */
  end?: string;
  /** Toggle actions (default: "play none none none") */
  toggleActions?: string;
  /** Additional ScrollTrigger properties */
  [key: string]: any;
}

/**
 * useCounterAnimation hook options
 */
export interface UseCounterAnimationOptions {
  /** ScrollTrigger 觸發元素的 ref */
  triggerRef: RefObject<HTMLElement>;
  /** 目標數值 */
  targetValue: number;
  /** 動畫持續時間（可選，會根據數值大小自動計算） */
  duration?: number;
  /** 數字格式化選項 */
  formatOptions?: NumberFormatOptions;
  /** ScrollTrigger 配置 */
  scrollTriggerConfig?: CounterScrollTriggerConfig;
  /** Scroller element (預設 window，傳入 '#main-content' 使用 main content scrollbar) */
  scroller?: string | HTMLElement;
  /** 是否啟用（預設 true） */
  enabled?: boolean;
}

/**
 * useCounterAnimation hook return value
 */
export interface UseCounterAnimationReturn {
  /** 當前數值（原始數字） */
  currentValue: number;
  /** 格式化後的數值（字串，包含千位分隔符等） */
  formattedValue: string;
  /** ScrollTrigger 實例 */
  scrollTrigger: ScrollTrigger | null;
  /** GSAP tween 實例 */
  tween: gsap.core.Tween | null;
  /** 動畫是否已完成 */
  isComplete: boolean;
}

/**
 * Calculate animation duration based on value magnitude
 * Small numbers (< 100): 1.2s
 * Medium numbers (100-10,000): 1.5s
 * Large numbers (> 10,000): 2s
 */
function getAnimationDuration(value: number): number {
  const absValue = Math.abs(value);
  if (absValue < 100) return gsapConfig.durations.counter.small;
  if (absValue <= 10000) return gsapConfig.durations.counter.medium;
  return gsapConfig.durations.counter.large;
}

/**
 * useCounterAnimation - 數字滾動動畫
 *
 * @param options - Counter animation configuration
 * @returns Current value, formatted value, and control instances
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * const { formattedValue } = useCounterAnimation({
 *   triggerRef: ref,
 *   targetValue: 1234,
 *   formatOptions: { useGrouping: true }
 * });
 *
 * return <div ref={ref}>{formattedValue}</div>;
 * ```
 */
export function useCounterAnimation(
  options: UseCounterAnimationOptions
): UseCounterAnimationReturn {
  const {
    triggerRef,
    targetValue,
    duration,
    formatOptions = {},
    scrollTriggerConfig = {},
    scroller,
    enabled = true,
  } = options;

  // State
  const [currentValue, setCurrentValue] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Refs to store GSAP instances
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Check reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  // Format number using Intl.NumberFormat
  const {
    useGrouping = true,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    locale = 'zh-TW',
  } = formatOptions;

  const formatter = new Intl.NumberFormat(locale, {
    useGrouping,
    minimumFractionDigits,
    maximumFractionDigits,
  });

  const formattedValue = formatter.format(currentValue);

  useLayoutEffect(() => {
    // Early return if not enabled
    if (!enabled) return;

    // Check if triggerRef is valid
    if (!triggerRef.current) {
      console.warn('[useCounterAnimation] triggerRef.current is null.');
      return;
    }

    // ✅ Check if scroller element exists (if scroller is a string selector)
    if (typeof scroller === 'string') {
      const scrollerElement = document.querySelector(scroller);
      if (!scrollerElement) {
        console.warn(`[useCounterAnimation] Scroller element "${scroller}" not found. Animation will not be initialized.`);
        return;
      }
    }

    // ✅ Use setTimeout to ensure DOM is fully ready (more aggressive than requestAnimationFrame)
    const timerId = setTimeout(() => {
      // ✅ Double-check scroller element exists before initializing
      if (typeof scroller === 'string') {
        const scrollerElement = document.querySelector(scroller);
        if (!scrollerElement) {
          console.warn(`[useCounterAnimation] Scroller element "${scroller}" still not found after delay. Aborting.`);
          return;
        }
      }

      try {
        // Calculate duration
        const animDuration = duration ?? getAnimationDuration(targetValue);

        // If reduced motion, show final value immediately
        if (prefersReducedMotion) {
          setCurrentValue(targetValue);
          setIsComplete(true);
          console.log('[useCounterAnimation] Reduced motion: showing final value immediately');
          return;
        }

        // ✅ Get scroller element reference (not string)
        let scrollerElement: HTMLElement | Window | undefined = undefined;
        if (typeof scroller === 'string') {
          const el = document.querySelector(scroller);
          if (!el) {
            console.error(`[useCounterAnimation] Scroller element "${scroller}" not found after delay`);
            return;
          }
          scrollerElement = el as HTMLElement;
        } else if (scroller) {
          scrollerElement = scroller;
        }

        console.log('[useCounterAnimation] Using scroller:', scrollerElement);
        console.log('[useCounterAnimation] Initializing:', {
          targetValue,
          duration: animDuration,
          trigger: triggerRef.current,
          triggerTag: triggerRef.current?.tagName,
          triggerClass: triggerRef.current?.className,
          triggerId: triggerRef.current?.id,
          scrollTriggerConfig,
        });

        // Create counter object for GSAP to animate
        const counter = { value: 0 };

        // Create GSAP tween with onUpdate callback
        // Note: When using scrub, ScrollTrigger controls the tween progress
        const tween = gsap.to(counter, {
          value: targetValue,
          duration: animDuration,
          ease: gsapConfig.easings.out,
          onUpdate: () => {
            setCurrentValue(Math.round(counter.value * 100) / 100); // Round to 2 decimal places
          },
          onComplete: () => {
            setIsComplete(true);
            setCurrentValue(targetValue); // Ensure final value is exact
            console.log('[useCounterAnimation] Animation complete:', targetValue);
          },
        });

        console.log('[useCounterAnimation] Tween created:', {
          targetValue,
          paused: tween.paused(),
          progress: tween.progress(),
        });

        // Create ScrollTrigger to trigger animation when section enters viewport
        const scrollTrigger = ScrollTrigger.create({
          trigger: triggerRef.current,
          animation: tween,
          // ✅ Use start/end from gsapConfig, but override scrub for one-time play
          start: gsapConfig.scrollTrigger.start,
          end: gsapConfig.scrollTrigger.end,
          toggleActions: gsapConfig.scrollTrigger.toggleActions,
          scrub: false, // ✅ Disable scrub for one-time animation (not scroll-linked)
          scroller: scrollerElement, // ✅ Pass element reference, not string
          onEnter: () => console.log('[useCounterAnimation] ScrollTrigger ENTER - starting animation'),
          onLeave: () => console.log('[useCounterAnimation] ScrollTrigger LEAVE'),
          onUpdate: (self) => console.log('[useCounterAnimation] ScrollTrigger progress:', self.progress),
          // ✅ scrollTriggerConfig can override defaults
          ...scrollTriggerConfig,
        });

        console.log('[useCounterAnimation] ScrollTrigger created:', {
          start: scrollTrigger.start,
          progress: scrollTrigger.progress,
          isActive: scrollTrigger.isActive,
        });

        // ✅ Immediately refresh ScrollTrigger after creation
        if (scrollTrigger) {
          requestAnimationFrame(() => {
            scrollTrigger?.refresh();
            console.log('[useCounterAnimation] ScrollTrigger refreshed immediately after creation');
          });
        }

        // Store instances
        tweenRef.current = tween;
        scrollTriggerRef.current = scrollTrigger;

        // Setup cleanup
        cleanupRef.current = () => {
          tween.kill();
          scrollTrigger.kill();
        };
      } catch (error) {
        console.error('[useCounterAnimation] Failed to initialize:', error);
        setCurrentValue(targetValue);
        setIsComplete(true);
      }
    }, 300); // ✅ 300ms delay to ensure DOM is ready and painted

    // Cleanup on unmount
    return () => {
      clearTimeout(timerId);
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [
    // ❌ Removed triggerRef - ref objects should not be in dependency array
    // The ref.current value is checked inside the effect
    targetValue,
    duration,
    enabled,
    prefersReducedMotion,
    scrollTriggerConfig,
    scroller,
  ]);

  return {
    currentValue,
    formattedValue,
    scrollTrigger: scrollTriggerRef.current,
    tween: tweenRef.current,
    isComplete,
  };
}
