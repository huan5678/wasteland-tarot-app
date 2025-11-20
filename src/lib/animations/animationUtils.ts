/**
 * Animation System Utility Functions Module
 *
 * @module lib/animations/animationUtils
 * @description 提供動畫系統共用工具函式（效能監控、viewport 檢測、裝置檢測等）
 *
 * @example
 * ```typescript
 * import {
 *   isInViewport,
 *   FPSMonitor,
 *   isTouchDevice,
 *   getViewportCategory,
 *   isGSAPAvailable
 * } from '@/lib/animations/animationUtils';
 *
 * // 檢測元素是否在 viewport
 * if (isInViewport(element, 0.5)) {
 *   console.log('Element is 50% visible');
 * }
 *
 * // 啟動 FPS 監控
 * const monitor = new FPSMonitor();
 * monitor.start();
 * console.log(monitor.getFPS());
 * monitor.stop();
 *
 * // 檢測裝置類型
 * const isMobile = getViewportCategory() === 'mobile';
 * const hasTouch = isTouchDevice();
 * ```
 *
 * @remarks
 * - 所有函式提供 SSR 安全檢查（`typeof window === 'undefined'`）
 * - FPSMonitor 使用 `requestAnimationFrame` 測量效能
 * - `isGSAPAvailable()` 用於 graceful degradation
 */

/**
 * 檢測元素是否在 viewport 內
 *
 * @param {HTMLElement} element - 目標元素
 * @param {number} [threshold=0.5] - 可見度閾值（0-1，預設 0.5 表示 50% 可見）
 * @returns {boolean} true 表示元素在 viewport 內
 *
 * @example
 * ```typescript
 * const element = document.querySelector('.my-element');
 * if (isInViewport(element, 0.8)) {
 *   console.log('Element is 80% visible');
 * }
 * ```
 */
export function isInViewport(
  element: HTMLElement,
  threshold: number = 0.5
): boolean {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  const vertInView = rect.top <= windowHeight && rect.top + rect.height * threshold >= 0;
  const horInView = rect.left <= windowWidth && rect.left + rect.width * threshold >= 0;

  return vertInView && horInView;
}

/**
 * FPS Monitor Class
 *
 * 效能監控工具，計算當前 FPS（Frames Per Second）
 * 使用 `requestAnimationFrame` 測量實時幀率
 *
 * @class
 *
 * @example
 * ```typescript
 * const monitor = new FPSMonitor();
 * monitor.start();
 *
 * setInterval(() => {
 *   const fps = monitor.getFPS();
 *   console.log(`Current FPS: ${fps}`);
 *   if (fps < 50) {
 *     console.warn('Performance degradation detected!');
 *   }
 * }, 1000);
 *
 * // Clean up
 * monitor.stop();
 * ```
 *
 * @remarks
 * - 使用 `performance.now()` 獲取高精度時間戳
 * - 每秒更新一次 FPS 值
 * - 適用於開發模式效能監控
 *
 * @method start - 開始監控
 * @method stop - 停止監控
 * @method getFPS - 獲取當前 FPS 值
 */
export class FPSMonitor {
  private fps: number = 60;
  private lastTime: number = performance.now();
  private frames: number = 0;
  private rafId: number | null = null;

  start() {
    const measure = (time: number) => {
      this.frames++;
      if (time >= this.lastTime + 1000) {
        this.fps = Math.round((this.frames * 1000) / (time - this.lastTime));
        this.frames = 0;
        this.lastTime = time;
      }
      this.rafId = requestAnimationFrame(measure);
    };
    this.rafId = requestAnimationFrame(measure);
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getFPS(): number {
    return this.fps;
  }
}

/**
 * 檢測裝置是否為觸控裝置
 *
 * @returns {boolean} true 表示裝置支援觸控
 *
 * @example
 * ```typescript
 * if (isTouchDevice()) {
 *   // 使用 whileTap 替代 whileHover
 *   console.log('Touch device detected');
 * }
 * ```
 *
 * @remarks
 * - SSR 安全：Server 端返回 `false`
 * - 檢測方式：'ontouchstart' in window, navigator.maxTouchPoints, msMaxTouchPoints
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * 取得當前 viewport 尺寸分類
 *
 * @returns {'mobile' | 'tablet' | 'desktop'} Viewport 分類
 *   - 'mobile': < 768px
 *   - 'tablet': 768px - 1023px
 *   - 'desktop': >= 1024px
 *
 * @example
 * ```typescript
 * const category = getViewportCategory();
 * if (category === 'mobile') {
 *   // 停用視差效果
 *   disableParallax();
 * }
 * ```
 *
 * @remarks
 * - SSR 安全：Server 端返回 'desktop'
 * - 斷點與 Tailwind CSS 一致
 */
export function getViewportCategory(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * 檢查 GSAP 是否可用（Graceful Degradation）
 *
 * @returns {boolean} true 表示 GSAP 已載入並可用
 *
 * @example
 * ```typescript
 * if (!isGSAPAvailable()) {
 *   console.warn('GSAP not available, falling back to CSS animations');
 *   return;
 * }
 *
 * // 安全使用 GSAP
 * gsap.to('.element', { opacity: 1 });
 * ```
 *
 * @remarks
 * - 用於 graceful degradation 策略
 * - SSR 安全：Server 端返回 `false`
 * - 檢查 `window.gsap` 是否存在
 */
export function isGSAPAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 'gsap' in window;
  } catch {
    return false;
  }
}

/**
 * 計算元素的實際高度（包含 margin）
 *
 * @param {HTMLElement} element - 目標元素
 * @returns {number} 元素高度（offsetHeight + marginTop + marginBottom）單位為 px
 *
 * @example
 * ```typescript
 * const element = document.querySelector('.card');
 * const fullHeight = getElementFullHeight(element);
 * console.log(`Full height: ${fullHeight}px`);
 * ```
 *
 * @remarks
 * - 使用 `getComputedStyle` 獲取實際 margin 值
 * - 返回值包含 border、padding、content、margin
 */
export function getElementFullHeight(element: HTMLElement): number {
  const styles = window.getComputedStyle(element);
  const margin = parseFloat(styles.marginTop) + parseFloat(styles.marginBottom);
  return element.offsetHeight + margin;
}
