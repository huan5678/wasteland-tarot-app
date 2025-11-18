/**
 * useParallax Hook
 * 簡化 Hero Section 視差效果實作，提供 declarative parallax API
 *
 * @module lib/animations/useParallax
 * @description 為背景層與前景層建立不同滾動速率，產生視差深度效果
 *
 * Requirements:
 * - 3.1: 使用 GSAP ScrollTrigger scrub 模式建立視差
 * - 3.2: 從 gsapConfig 讀取預設速率參數
 * - 10.1: Mobile 裝置自動停用視差（避免效能問題）
 * - 10.3: 使用 GSAP matchMedia 實作響應式
 * - 12: 使用 GPU-accelerated transform 屬性
 */

import { useEffect, useRef } from 'react';
import { gsapConfig } from './gsapConfig';
import { getViewportCategory, isGSAPAvailable } from './animationUtils';

/**
 * useParallax Hook Options
 */
export interface UseParallaxOptions {
  /** 背景層 ref（移動速度較慢） */
  backgroundRef: React.RefObject<HTMLElement>;

  /** 前景層 ref（移動速度正常） */
  foregroundRef?: React.RefObject<HTMLElement>;

  /** 背景層滾動速率（預設從 gsapConfig 讀取，0.5 表示 50% 滾動速度） */
  backgroundSpeed?: number;

  /** 前景層滾動速率（預設從 gsapConfig 讀取，1.0 表示正常速度） */
  foregroundSpeed?: number;

  /** 是否在 mobile 裝置停用（預設 true） */
  disableOnMobile?: boolean;
}

/**
 * useParallax Hook
 *
 * 為背景層與前景層建立視差效果，使用 GSAP ScrollTrigger scrub 模式
 *
 * @param options - 視差效果配置選項
 *
 * @example
 * ```tsx
 * const backgroundRef = useRef<HTMLDivElement>(null);
 * const foregroundRef = useRef<HTMLDivElement>(null);
 *
 * useParallax({
 *   backgroundRef,
 *   foregroundRef,
 *   backgroundSpeed: 0.5,
 *   disableOnMobile: true,
 * });
 * ```
 *
 * Preconditions:
 * - backgroundRef.current 必須已渲染
 * - GSAP ScrollTrigger plugin 已載入
 *
 * Postconditions:
 * - 背景層與前景層綁定至 ScrollTrigger，產生視差效果
 * - Mobile 裝置（viewport width < 768px）自動停用視差（若 disableOnMobile: true）
 *
 * Invariants:
 * - 視差效果不影響頁面 layout（使用 transform 而非 position 調整）
 */
export function useParallax(options: UseParallaxOptions): void {
  const {
    backgroundRef,
    foregroundRef,
    backgroundSpeed = gsapConfig.parallax.backgroundSpeed,
    foregroundSpeed = gsapConfig.parallax.foregroundSpeed,
    disableOnMobile = true,
  } = options;

  // 使用 useRef 保持 ScrollTrigger 實例穩定
  const scrollTriggerRef = useRef<any>(null);

  useEffect(() => {
    // Precondition: 檢查 backgroundRef.current 是否存在
    if (!backgroundRef.current) {
      console.warn('[useParallax] backgroundRef.current is null, skipping parallax setup');
      return;
    }

    // Graceful degradation: 檢查 GSAP 是否可用
    if (!isGSAPAvailable()) {
      console.warn('[useParallax] GSAP is not available, skipping parallax setup');
      return;
    }

    // 檢查裝置類型
    const viewportCategory = getViewportCategory();

    // Mobile 停用邏輯
    if (disableOnMobile && viewportCategory === 'mobile') {
      console.log('[useParallax] Mobile device detected, parallax disabled');
      return;
    }

    // 動態 import GSAP (client-side only)
    const setupParallax = async () => {
      try {
        // Import GSAP and ScrollTrigger
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');

        // Register ScrollTrigger plugin
        gsap.registerPlugin(ScrollTrigger);

        // 使用 GSAP matchMedia 實作響應式調整
        const mm = gsap.matchMedia();

        // Desktop & Tablet: 啟用視差
        mm.add(gsapConfig.breakpoints.desktop, () => {
          // 背景層視差效果
          const backgroundAnimation = gsap.to(backgroundRef.current, {
            yPercent: -(100 * (1 - backgroundSpeed)), // 計算視差位移量
            ease: 'none', // 平滑線性（視差效果）
          });

          // 建立 ScrollTrigger（scrub 模式）
          scrollTriggerRef.current = ScrollTrigger.create({
            trigger: backgroundRef.current,
            start: 'top bottom', // 元素頂部進入 viewport 底部時開始
            end: 'bottom top', // 元素底部離開 viewport 頂部時結束
            scrub: true, // 與滾動同步
            animation: backgroundAnimation,
          });

          // 前景層視差效果（若提供）
          if (foregroundRef?.current && foregroundSpeed !== backgroundSpeed) {
            const foregroundAnimation = gsap.to(foregroundRef.current, {
              yPercent: -(100 * (1 - foregroundSpeed)),
              ease: 'none',
            });

            ScrollTrigger.create({
              trigger: foregroundRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
              animation: foregroundAnimation,
            });
          }

          // Cleanup function for this context
          return () => {
            if (scrollTriggerRef.current) {
              scrollTriggerRef.current.kill();
              scrollTriggerRef.current = null;
            }
          };
        });

        // Mobile: 不建立視差（已在上方 early return）
        // Tablet: 可選擇性調整（目前與 desktop 相同）

      } catch (error) {
        console.error('[useParallax] Failed to load GSAP or ScrollTrigger:', error);
      }
    };

    setupParallax();

    // Cleanup function: Kill ScrollTrigger on unmount
    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
    };
  }, [
    backgroundRef,
    foregroundRef,
    backgroundSpeed,
    foregroundSpeed,
    disableOnMobile,
  ]);
}
