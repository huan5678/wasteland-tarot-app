/**
 * useTestimonialAnimation Hook
 * Task 10.1: 卡片浮入動畫（整合 useScrollAnimation 或 useStagger）
 *
 * Features:
 * - Float-in animation: opacity 0→1, y: 60→0
 * - Stagger delay: 0.2s
 * - Easing: power3.out
 * - Duration: 0.8s
 */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsapConfig } from '@/lib/animations/gsapConfig';
import { useReducedMotion } from '@/lib/animations/useReducedMotion';

export interface UseTestimonialAnimationOptions {
  /** Container element ref */
  containerRef: React.RefObject<HTMLElement>;

  /** Children selector (default: '.testimonial-card') */
  childrenSelector?: string;

  /** Stagger delay (default: 0.2s) */
  stagger?: number;

  /** Animation duration (default: 0.8s) */
  duration?: number;

  /** ScrollTrigger start position (default: 'top 80%') */
  start?: string;

  /** ScrollTrigger end position (default: 'bottom 30%') */
  end?: string;

  /** Scrub smoothness (default: false) */
  scrub?: boolean | number;

  /** Play once (default: true) */
  once?: boolean;

  /** Enable animation (default: true) */
  enabled?: boolean;

  /** Scroller element (預設 window，傳入 '#main-content' 使用 main content scrollbar) */
  scroller?: string | HTMLElement;
}

/**
 * useTestimonialAnimation Hook
 * Applies float-in animation to testimonial cards with stagger effect
 */
export function useTestimonialAnimation(
  options: UseTestimonialAnimationOptions
): void {
  const {
    containerRef,
    childrenSelector = '.testimonial-card',
    stagger = 0.2,
    duration = 0.8,
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

    if (!containerRef.current) {
      console.warn('[useTestimonialAnimation] Container ref is null');
      return;
    }

    const container = containerRef.current;
    const children = container.querySelectorAll(childrenSelector);

    if (children.length === 0) {
      console.warn(
        '[useTestimonialAnimation] No children found with selector:',
        childrenSelector
      );
      return;
    }

    // ✅ Check if scroller element exists (if scroller is a string selector)
    if (typeof scroller === 'string') {
      const scrollerElement = document.querySelector(scroller);
      if (!scrollerElement) {
        console.warn(`[useTestimonialAnimation] Scroller element "${scroller}" not found. Animation will not be initialized.`);
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
          console.error(`[useTestimonialAnimation] Scroller element "${scroller}" not found after delay`);
          return;
        }
        scrollerElement = el as HTMLElement;
      } else if (scroller) {
        scrollerElement = scroller;
      }

      console.log('[useTestimonialAnimation] Using scroller:', scrollerElement);

      const finalDuration = prefersReducedMotion ? 0 : duration;

    console.log('[useTestimonialAnimation] Initializing animation:', {
      container,
      containerTag: container.tagName,
      containerClass: container.className,
      containerId: container.id,
      childrenCount: children.length,
      start,
      end,
      scrub,
      once,
      duration: finalDuration,
      stagger,
    });

    // ✅ Create GSAP timeline with ScrollTrigger (no pin)
    const toggleActions = once ? 'play none none none' : 'play reverse play reverse';

    timelineRef.current = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start,
        end,
        toggleActions,
        scrub: scrub || false,
        scroller: scrollerElement, // ✅ Pass element reference, not string
        id: 'testimonials-anim',
        onEnter: () => console.log('[useTestimonialAnimation] ScrollTrigger ENTER'),
        onLeave: () => console.log('[useTestimonialAnimation] ScrollTrigger LEAVE'),
        onEnterBack: () => console.log('[useTestimonialAnimation] ScrollTrigger ENTER BACK'),
        onLeaveBack: () => console.log('[useTestimonialAnimation] ScrollTrigger LEAVE BACK'),
      },
    });

    console.log('[useTestimonialAnimation] Timeline created:', {
      timeline: timelineRef.current,
      scrollTrigger: timelineRef.current.scrollTrigger,
    });

    // ✅ Immediately refresh ScrollTrigger after creation
    if (timelineRef.current.scrollTrigger) {
      requestAnimationFrame(() => {
        timelineRef.current?.scrollTrigger?.refresh();
        console.log('[useTestimonialAnimation] ScrollTrigger refreshed immediately after creation');
      });
    }

    // ✅ Add float-in animation with stagger to timeline
    timelineRef.current.fromTo(
      children,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: finalDuration,
        stagger,
        ease: 'power3.out',
      }
    );

    // ⚠️ 2025 GSAP 最佳實踐：延遲 safe refresh 確保 DOM 完全渲染
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh(true); // true = safe refresh
      console.log('[useTestimonialAnimation] ScrollTrigger refreshed (safe mode) after 300ms');
    }, 300);

    // 額外：在 window load 後再次 refresh
    const handleLoad = () => {
      ScrollTrigger.refresh(true);
      console.log('[useTestimonialAnimation] ScrollTrigger refreshed after window load');
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('load', handleLoad, { once: true });
    }

      // Cleanup
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
