/**
 * useEntranceAnimation Hook
 * 專門處理頁面載入時的入場動畫（不使用 ScrollTrigger）
 * Refactored to use @gsap/react useGSAP hook
 */

import { useState, useEffect } from 'react';
import type { RefObject } from 'react';
import { useReducedMotion } from './useReducedMotion';
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
  const [timeline, setTimeline] = useState<gsap.core.Timeline | null>(null);

  // Check reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Early return if not enabled or no container
    if (!enabled || !containerRef.current || !animations || animations.length === 0) {
      setIsReady(false);
      return;
    }

    try {
      // ✅ Immediately set initial 'from' state to prevent flash of unstyled content (FOUC)
      animations.forEach((animation) => {
        const { target, from } = animation;
        if (from) {
          gsap.set(target, from); // Set initial state before animation starts
        }
      });

      // Create Timeline with delay (paused initially to prevent immediate play)
      const tl = gsap.timeline({
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
            tl.fromTo(target, from, toVars, position);
          } else {
            tl.fromTo(target, from, toVars);
          }
        } else {
          // to animation only
          if (position !== undefined) {
            tl.to(target, toVars, position);
          } else {
            tl.to(target, toVars);
          }
        }
      });

      // Store timeline
      setTimeline(tl);

      // Play timeline after setup
      requestAnimationFrame(() => {
          tl.play();
      });

      // Mark as ready
      setIsReady(true);

      // ✅ Cleanup function
      return () => {
        tl.kill();
        setTimeline(null);
        setIsReady(false);
      };

    } catch (error) {
      console.error('[useEntranceAnimation] Failed to initialize GSAP animation:', error);
      setIsReady(false);
    }
  }, [
    containerRef,
    // ❌ Removed: animations (causes infinite loop when passed as inline array literal)
    delay,
    enabled,
    prefersReducedMotion,
  ]);

  // Control functions
  const play = () => {
    if (timeline) {
      timeline.play();
    }
  };

  const pause = () => {
    if (timeline) {
      timeline.pause();
    }
  };

  return {
    timeline,
    isReady,
    play,
    pause,
  };
}

