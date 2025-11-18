/**
 * Performance Utilities for Animation System
 * Task 14: Performance Optimization (14.1-14.6)
 *
 * Provides utilities for:
 * - GPU-accelerated property validation
 * - Lazy initialization with Intersection Observer
 * - FPS monitoring and auto-degradation
 */

/**
 * GPU-accelerated CSS properties (Task 14.1)
 * These properties trigger GPU acceleration and do NOT cause layout reflow
 */
export const GPU_ACCELERATED_PROPERTIES = [
  'transform',
  'opacity',
  'x',
  'y',
  'scale',
  'scaleX',
  'scaleY',
  'rotation',
  'rotationX',
  'rotationY',
  'rotationZ',
  'translateX',
  'translateY',
  'translateZ',
  'skewX',
  'skewY',
] as const;

/**
 * Properties that trigger layout reflow (FORBIDDEN in animations)
 * These should NEVER be used in GSAP or Framer Motion animations
 */
export const LAYOUT_TRIGGERING_PROPERTIES = [
  'width',
  'height',
  'top',
  'left',
  'right',
  'bottom',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'padding',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'border',
  'borderWidth',
  'fontSize',
  'lineHeight',
] as const;

/**
 * Validate if animation properties are GPU-accelerated
 * @param properties - Animation properties to validate
 * @returns Array of non-GPU properties found
 */
export function validateGPUProperties(properties: Record<string, any>): string[] {
  const nonGPUProps: string[] = [];

  for (const key of Object.keys(properties)) {
    // Skip non-property keys (like 'duration', 'ease', 'delay')
    if (['duration', 'ease', 'delay', 'stagger', 'onComplete', 'onUpdate', 'onStart'].includes(key)) {
      continue;
    }

    // Check if property is in allowed list
    if (
      !GPU_ACCELERATED_PROPERTIES.includes(key as any) &&
      LAYOUT_TRIGGERING_PROPERTIES.includes(key as any)
    ) {
      nonGPUProps.push(key);
    }
  }

  return nonGPUProps;
}

/**
 * Task 14.2: Lazy Initialization with Intersection Observer
 * Creates an Intersection Observer for lazy-loading animations
 */
export interface LazyAnimationObserverOptions {
  /** Threshold for triggering (0-1, default 0.1 = 10% visible) */
  threshold?: number;
  /** Root margin (default '50px' = trigger 50px before entering viewport) */
  rootMargin?: string;
  /** Callback when element enters viewport */
  onEnter: (element: Element) => void;
  /** Callback when element exits viewport (optional) */
  onExit?: (element: Element) => void;
}

/**
 * Create lazy animation observer for intersection-based initialization
 * @param options - Observer configuration
 * @returns IntersectionObserver instance
 */
export function createLazyAnimationObserver(
  options: LazyAnimationObserverOptions
): IntersectionObserver {
  const { threshold = 0.1, rootMargin = '50px', onEnter, onExit } = options;

  if (typeof IntersectionObserver === 'undefined') {
    // Fallback: Call onEnter immediately if IntersectionObserver not supported
    console.warn('[LazyAnimationObserver] IntersectionObserver not supported, falling back to immediate initialization');
    return {
      observe: (element: Element) => onEnter(element),
      unobserve: () => {},
      disconnect: () => {},
    } as IntersectionObserver;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          onEnter(entry.target);
        } else if (onExit) {
          onExit(entry.target);
        }
      });
    },
    {
      threshold,
      rootMargin,
    }
  );

  return observer;
}

/**
 * Task 14.5: FPS Monitoring and Auto-Degradation
 * Monitors FPS and provides degradation strategies
 */
export interface FPSDegradationStrategy {
  /** Current FPS (updated every second) */
  fps: number;
  /** Is FPS below threshold? */
  shouldDegrade: boolean;
  /** Degradation level (0 = no degradation, 1 = light, 2 = aggressive) */
  degradationLevel: number;
  /** Suggested stagger reduction (0-1, 0 = no reduction, 1 = disable all stagger) */
  staggerReduction: number;
  /** Suggested parallax simplification (higher = faster parallax) */
  parallaxSpeedAdjustment: number;
}

/**
 * FPS Monitor with auto-degradation logic
 */
export class PerformanceMonitor {
  private fpsHistory: number[] = [];
  private lowFPSCount: number = 0;
  private readonly LOW_FPS_THRESHOLD = 50;
  private readonly CONSECUTIVE_LOW_FPS_THRESHOLD = 3; // 3 seconds of low FPS triggers degradation

  /**
   * Record FPS measurement
   * @param fps - Current FPS value
   */
  recordFPS(fps: number): void {
    this.fpsHistory.push(fps);

    // Keep only last 10 measurements (10 seconds)
    if (this.fpsHistory.length > 10) {
      this.fpsHistory.shift();
    }

    // Track consecutive low FPS
    if (fps < this.LOW_FPS_THRESHOLD) {
      this.lowFPSCount++;
    } else {
      this.lowFPSCount = 0;
    }
  }

  /**
   * Get current degradation strategy
   * @returns Degradation strategy object
   */
  getDegradationStrategy(): FPSDegradationStrategy {
    const avgFPS = this.fpsHistory.length > 0
      ? this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length
      : 60;

    const shouldDegrade = this.lowFPSCount >= this.CONSECUTIVE_LOW_FPS_THRESHOLD;

    let degradationLevel = 0;
    let staggerReduction = 0;
    let parallaxSpeedAdjustment = 1.0;

    if (shouldDegrade) {
      if (avgFPS < 30) {
        // Aggressive degradation (FPS < 30)
        degradationLevel = 2;
        staggerReduction = 0.75; // Reduce stagger to 25% of original
        parallaxSpeedAdjustment = 0.8; // Speed up parallax (less movement)
      } else if (avgFPS < 50) {
        // Light degradation (30 <= FPS < 50)
        degradationLevel = 1;
        staggerReduction = 0.5; // Reduce stagger to 50% of original
        parallaxSpeedAdjustment = 0.9; // Slightly speed up parallax
      }
    }

    return {
      fps: avgFPS,
      shouldDegrade,
      degradationLevel,
      staggerReduction,
      parallaxSpeedAdjustment,
    };
  }

  /**
   * Reset monitoring state
   */
  reset(): void {
    this.fpsHistory = [];
    this.lowFPSCount = 0;
  }

  /**
   * Log performance warning to console (dev mode only)
   */
  logPerformanceWarning(strategy: FPSDegradationStrategy): void {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn(
        `[PerformanceMonitor] Low FPS detected (${Math.round(strategy.fps)}fps). ` +
        `Applying degradation level ${strategy.degradationLevel}. ` +
        `Stagger reduction: ${(strategy.staggerReduction * 100).toFixed(0)}%, ` +
        `Parallax speed: ${strategy.parallaxSpeedAdjustment.toFixed(2)}x`
      );
    }
  }
}
