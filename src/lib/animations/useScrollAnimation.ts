/**
 * useScrollAnimation Hook
 * 統一管理 GSAP ScrollTrigger 滾動動畫（移除 pin 功能）
 * Refactored to use @gsap/react useGSAP hook
 */

import { useRef, useState, useEffect } from 'react';
import type { RefObject } from 'react';
import { useReducedMotion } from './useReducedMotion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugin immediately
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Animation configuration for a single element
 */
export interface AnimationConfig {
  /** CSS selector (scoped to trigger element) 或 element ref */
  target: string | HTMLElement;
  /** Starting state (optional) */
  from?: gsap.TweenVars;
  /** Ending state (required) */
  to: gsap.TweenVars;
  /** Timeline position marker (e.g., '+=0.3', '<', '>') */
  position?: string | number;
}

/**
 * useScrollAnimation hook options
 */
export interface UseScrollAnimationOptions {
  /** ScrollTrigger 觸發元素的 ref */
  triggerRef: RefObject<HTMLElement>;
  /** 動畫目標元素的 ref（可選，預設為 triggerRef） */
  targetRef?: RefObject<HTMLElement>;
  /** GSAP Timeline 動畫配置 */
  animations: AnimationConfig[];
  /** ScrollTrigger start position (default: 'top 80%') */
  start?: string;
  /** ScrollTrigger end position (default: 'bottom 30%') */
  end?: string;
  /** Scrub animation to scroll (default: false) */
  scrub?: boolean | number;
  /** Play once (default: true) */
  once?: boolean;
  /** Enable animation (default: true) */
  enabled?: boolean;
  /** Show markers in development (default: false) */
  markers?: boolean;
  /** Scroller element (預設 window，傳入 '#main-content' 使用 main content scrollbar) */
  scroller?: string | HTMLElement;
}

/**
 * useScrollAnimation hook return value
 */
export interface UseScrollAnimationReturn {
  /** ScrollTrigger 實例（供手動控制） */
  scrollTrigger: ScrollTrigger | null;
  /** GSAP Timeline 實例（供手動控制） */
  timeline: gsap.core.Timeline | null;
  /** 動畫是否已初始化 */
  isReady: boolean;
  /** 手動重新整理 ScrollTrigger（窗口 resize 時使用） */
  refresh: () => void;
}

/**
 * useScrollAnimation - 統一 GSAP 滾動動畫管理（無 pin 功能）
 */
export function useScrollAnimation(
  options: UseScrollAnimationOptions
): UseScrollAnimationReturn {
  const {
    triggerRef,
    targetRef,
    animations,
    start = 'top 80%',
    end = 'bottom 30%',
    scrub = false,
    once = true,
    enabled = true,
    markers = false,
    scroller,
  } = options;

  // State
  const [isReady, setIsReady] = useState(false);

  // Refs to store GSAP instances
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  // Check reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Early return if not enabled or no trigger
    if (!enabled || !triggerRef.current || !animations || animations.length === 0) {
      setIsReady(false);
      return;
    }

    // ✅ Check if scroller element exists (if scroller is a string selector)
    let scrollerElement: HTMLElement | Window | undefined = undefined;
    if (typeof scroller === 'string') {
      const el = document.querySelector(scroller);
      if (!el) {
        console.warn(`[useScrollAnimation] Scroller element "${scroller}" not found. Animation will not be initialized.`);
        setIsReady(false);
        return;
      }
      scrollerElement = el as HTMLElement;
    } else if (scroller) {
      scrollerElement = scroller;
    }

    try {
      // Determine toggleActions based on once parameter
      const toggleActions = once ? 'play none none none' : 'play reverse play reverse';

      console.log('[useScrollAnimation] Initializing animation:', {
        trigger: triggerRef.current,
        scroller: scrollerElement,
      });

      // ✅ Create Timeline with embedded ScrollTrigger (no pin)
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: triggerRef.current,
          start,
          end,
          toggleActions,
          scrub: scrub || false,
          scroller: scrollerElement,
          markers,
          id: `scroll-anim-${Math.random()}`,
        },
      });

      // ✅ Apply animations to timeline
      animations.forEach((animation, index) => {
        const { target, from, to, position } = animation;

        // Clone the 'to' object to avoid mutation
        const toVars = { ...to };

        // Override duration to 0 if reduced motion is enabled
        if (prefersReducedMotion && 'duration' in toVars) {
          toVars.duration = 0;
        }

        // Use .fromTo() if 'from' is provided, otherwise use .to()
        if (from) {
          if (position !== undefined) {
            timeline.fromTo(target, from, toVars, position);
          } else {
            timeline.fromTo(target, from, toVars);
          }
        } else {
          if (position !== undefined) {
            timeline.to(target, toVars, position);
          } else {
            timeline.to(target, toVars);
          }
        }
      });

      // Store timeline in ref
      timelineRef.current = timeline;
      scrollTriggerRef.current = timeline.scrollTrigger || null;

      // Mark as ready
      setIsReady(true);

      // ✅ Cleanup function
      return () => {
        timeline.kill();
        if (timeline.scrollTrigger) {
          timeline.scrollTrigger.kill();
        }
        timelineRef.current = null;
        scrollTriggerRef.current = null;
        setIsReady(false);
      };

    } catch (error) {
      console.error('[useScrollAnimation] Failed to initialize GSAP animation:', error);
      setIsReady(false);
    }
  }, [
    triggerRef,
    targetRef,
    // ❌ Removed: animations (causes infinite loop when passed as inline array literal)
    start,
    end,
    scrub,
    once,
    enabled,
    markers,
    scroller,
    prefersReducedMotion,
  ]);

  // Refresh function
  const refresh = () => {
    if (scrollTriggerRef.current) {
      scrollTriggerRef.current.refresh();
    } else {
      ScrollTrigger.refresh();
    }
  };

  return {
    scrollTrigger: scrollTriggerRef.current,
    timeline: timelineRef.current,
    isReady,
    refresh,
  };
}

