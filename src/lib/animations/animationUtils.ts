/**
 * Animation System Utility Functions
 * Provides shared utilities for animation system
 * 動畫系統工具函式
 */

/**
 * 檢測元素是否在 viewport 內
 * @param element - 目標元素
 * @param threshold - 可見度閾值（0-1，預設 0.5 表示 50% 可見）
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
 * 效能監控：計算當前 FPS
 * 使用 requestAnimationFrame 測量
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
 * @returns 'mobile' | 'tablet' | 'desktop'
 */
export function getViewportCategory(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Graceful Degradation：檢查 GSAP 是否可用
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
 */
export function getElementFullHeight(element: HTMLElement): number {
  const styles = window.getComputedStyle(element);
  const margin = parseFloat(styles.marginTop) + parseFloat(styles.marginBottom);
  return element.offsetHeight + margin;
}
