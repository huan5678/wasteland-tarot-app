/**
 * useStagger Hook
 * Simplifies staggered entrance animations using GSAP Timeline
 * 簡化錯開入場動畫實作，統一管理 stagger 時序
 * Refactored to use @gsap/react useGSAP hook
 */

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsapConfig } from './gsapConfig';
import { useReducedMotion } from './useReducedMotion';

/**
 * useStagger Options
 */
export interface UseStaggerOptions {
  /** 容器元素 ref */
  containerRef: React.RefObject<HTMLElement>;

  /** 子元素選擇器（預設 ":scope > *"） */
  childrenSelector?: string;

  /** Stagger delay（預設使用 gsapConfig.staggers.normal） */
  stagger?: number;

  /** 從何處開始（預設 { opacity: 0, y: 40 }） */
  from?: gsap.TweenVars;

  /** 到何處結束（預設 { opacity: 1, y: 0 }） */
  to?: gsap.TweenVars;

  /** 動畫持續時間（預設 0.6s） */
  duration?: number;

  /** ScrollTrigger start 位置（預設 'top 80%'） */
  start?: string;

  /** ScrollTrigger end 位置（預設 'bottom 30%'） */
  end?: string;

  /** Scrub 平滑度（預設 false，不使用 scrub） */
  scrub?: boolean | number;

  /** 只播放一次（預設 true） */
  once?: boolean;

  /** 是否啟用動畫（預設 true） */
  enabled?: boolean;

  /** Scroller element (預設 window，傳入 '#main-content' 使用 main content scrollbar) */
  scroller?: string | HTMLElement;
}

/**
 * useStagger Hook
 * 為一組元素建立錯開入場動畫（fade in + translate up）
 */
export function useStagger(options: UseStaggerOptions): void {
  const {
    containerRef,
    childrenSelector = ':scope > *', // ✅ Fixed: use `:scope >` instead of `>`
    stagger,
    from,
    to,
    duration,
    start = 'top 80%',
    end = 'bottom 30%',
    scrub = false,
    once = true,
    enabled = true,
    scroller,
  } = options;

  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Early return if disabled or no container
    if (!enabled || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const children = container.querySelectorAll(childrenSelector);

    // Early return if no children found
    if (children.length === 0) {
      console.warn('[useStagger] No children found with selector:', childrenSelector);
      return;
    }

    // ✅ Check if scroller element exists (if scroller is a string selector)
    let scrollerElement: HTMLElement | Window | undefined = undefined;
    if (typeof scroller === 'string') {
      const el = document.querySelector(scroller);
      if (!el) {
        console.warn(`[useStagger] Scroller element "${scroller}" not found. Animation will not be initialized.`);
        return;
      }
      scrollerElement = el as HTMLElement;
    } else if (scroller) {
      scrollerElement = scroller;
    }

    // Determine stagger delay based on viewport width
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
    const finalStagger = isMobile
      ? (stagger ?? gsapConfig.staggers.normal) * 0.5  // Mobile: reduce by 50%
      : (stagger ?? gsapConfig.staggers.normal);       // Desktop/Tablet: normal

    const finalDuration = prefersReducedMotion ? 0 : (duration ?? gsapConfig.durations.normal);

    // ✅ Create timeline with ScrollTrigger (no pin)
    const toggleActions = once ? 'play none none none' : 'play reverse play reverse';

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start,
        end,
        toggleActions,
        scrub: scrub || false,
        scroller: scrollerElement,
        markers: false,
        id: `stagger-anim-${Date.now()}`,
      },
    });

    // ✅ Add stagger animation to timeline
    tl.fromTo(
      children,
      from ?? { opacity: 0, y: 40 },
      {
        ...(to ?? { opacity: 1, y: 0 }),
        duration: finalDuration,
        stagger: finalStagger,
        ease: gsapConfig.easings.out,
      }
    );

    // ✅ Immediately refresh ScrollTrigger after creation
    if (tl.scrollTrigger) {
      requestAnimationFrame(() => {
        tl.scrollTrigger?.refresh();
      });
    }

    // ✅ Cleanup function
    return () => {
      tl.kill();
      if (tl.scrollTrigger) {
        tl.scrollTrigger.kill();
      }
    };
  }, [
    containerRef,
    childrenSelector,
    stagger,
    from,
    to,
    duration,
    start,
    end,
    scrub,
    once,
    enabled,
    scroller,
    prefersReducedMotion,
  ]);
}

