/**
 * useStagger Hook
 * Simplifies staggered entrance animations using GSAP Timeline
 * 簡化錯開入場動畫實作，統一管理 stagger 時序
 */

import { useEffect, useRef } from 'react';
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

  /** 子元素選擇器（預設 "> *"） */
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
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 *
 * useStagger({
 *   containerRef,
 *   childrenSelector: '.card',
 *   stagger: 0.15,
 * });
 *
 * return (
 *   <div ref={containerRef}>
 *     <div className="card">Card 1</div>
 *     <div className="card">Card 2</div>
 *     <div className="card">Card 3</div>
 *   </div>
 * );
 * ```
 */
export function useStagger(options: UseStaggerOptions): void {
  const {
    containerRef,
    childrenSelector = '> *',
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
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    // Early return if disabled
    if (!enabled) {
      return;
    }

    // Early return if container is null
    if (!containerRef.current) {
      console.warn('[useStagger] Container ref is null');
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
    if (typeof scroller === 'string') {
      const scrollerElement = document.querySelector(scroller);
      if (!scrollerElement) {
        console.warn(`[useStagger] Scroller element "${scroller}" not found. Animation will not be initialized.`);
        return;
      }
    }

    // ✅ Use setTimeout to ensure DOM is fully ready (more aggressive than requestAnimationFrame)
    const timerId = setTimeout(() => {
      // ✅ Get scroller element reference (not string)
      let scrollerElement: HTMLElement | Window | undefined = undefined;
      if (typeof scroller === 'string') {
        const el = document.querySelector(scroller);
        if (!el) {
          console.error(`[useStagger] Scroller element "${scroller}" not found after delay`);
          return;
        }
        scrollerElement = el as HTMLElement;
      } else if (scroller) {
        scrollerElement = scroller;
      }

      console.log('[useStagger] Using scroller:', scrollerElement);

      // ✅ Determine stagger delay based on viewport width
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
    const finalStagger = isMobile
      ? (stagger ?? gsapConfig.staggers.normal) * 0.5  // Mobile: reduce by 50%
      : (stagger ?? gsapConfig.staggers.normal);       // Desktop/Tablet: normal

    const finalDuration = prefersReducedMotion ? 0 : (duration ?? gsapConfig.durations.normal);

    console.log('[useStagger] Creating animation:', {
      container,
      containerTag: container.tagName,
      containerClass: container.className,
      containerId: container.id,
      childrenCount: children.length,
      isMobile,
      finalStagger,
      finalDuration,
      start,
      end,
      scrub,
      once,
    });

    // ✅ Create timeline with ScrollTrigger (no pin)
    const toggleActions = once ? 'play none none none' : 'play reverse play reverse';

    timelineRef.current = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start,
        end,
        toggleActions,
        scrub: scrub || false,
        scroller: scrollerElement, // ✅ Pass element reference, not string
        markers: false, // ✅ Disable markers for production
        id: `stagger-anim-${Date.now()}`,
        onEnter: () => console.log('[useStagger] ScrollTrigger ENTER'),
        onLeave: () => console.log('[useStagger] ScrollTrigger LEAVE'),
        onEnterBack: () => console.log('[useStagger] ScrollTrigger ENTER BACK'),
        onLeaveBack: () => console.log('[useStagger] ScrollTrigger LEAVE BACK'),
      },
    });

    console.log('[useStagger] Timeline created:', {
      timeline: timelineRef.current,
      scrollTrigger: timelineRef.current.scrollTrigger,
    });

    // ✅ Immediately refresh ScrollTrigger after creation
    if (timelineRef.current.scrollTrigger) {
      requestAnimationFrame(() => {
        timelineRef.current?.scrollTrigger?.refresh();
        console.log('[useStagger] ScrollTrigger refreshed immediately after creation');
      });
    }

    // ✅ Add stagger animation to timeline
    timelineRef.current.fromTo(
      children,
      from ?? { opacity: 0, y: 40 },
      {
        ...(to ?? { opacity: 1, y: 0 }),
        duration: finalDuration,
        stagger: finalStagger,
        ease: gsapConfig.easings.out,
      }
    );

    // ⚠️ 2025 GSAP 最佳實踐：延遲 safe refresh 確保 DOM 完全渲染
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh(true); // true = safe refresh (等待 scroll 結束後才 refresh)
      console.log('[useStagger] ScrollTrigger refreshed (safe mode) after 300ms');
    }, 300); // 增加延遲到 300ms

    // 額外：在 window load 後再次 refresh（確保所有資源載入完成）
    const handleLoad = () => {
      ScrollTrigger.refresh(true);
      console.log('[useStagger] ScrollTrigger refreshed after window load');
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('load', handleLoad, { once: true });
    }

      // Cleanup function
      return () => {
        clearTimeout(refreshTimer);
        if (typeof window !== 'undefined') {
          window.removeEventListener('load', handleLoad);
        }
        if (timelineRef.current) {
          timelineRef.current.kill();
          timelineRef.current = null;
        }
      };
    }, 300); // ✅ 300ms delay to ensure DOM is ready and painted

    // Cleanup on unmount
    return () => {
      clearTimeout(timerId);
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
