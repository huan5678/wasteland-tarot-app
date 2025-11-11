/**
 * Performance Optimization Utilities
 * Code splitting, lazy loading, and resource optimization helpers
 *
 * Requirements: 13.1, 13.3, 13.4
 */

import dynamic from 'next/dynamic';
import React, { type ComponentType } from 'react';

/**
 * Performance targets from requirements
 */
export const PERFORMANCE_TARGETS = {
  FCP_DESKTOP: 2000, // ms
  FCP_MOBILE: 3000, // ms
  API_RESPONSE: 5000, // ms
  HISTORY_LOAD: 5000, // ms (500 records)
  FPS_TARGET: 60,
  FPS_MINIMUM: 30,
  VIRTUALIZATION_THRESHOLD: 100, // number of records
} as const;

/**
 * Lazy load a component with loading fallback
 * Implements code splitting (13.1)
 */
export function lazyLoadComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  return dynamic(importFn, {
    loading: () => fallback || React.createElement('div', null, 'Loading...'),
    ssr: false, // Disable SSR for better client-side performance
  });
}

/**
 * Preload critical resources
 * (13.1 - Preload critical fonts and assets)
 */
export function preloadResource(href: string, as: string, type?: string) {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;

  document.head.appendChild(link);
}

/**
 * Preload critical fonts
 * Specifically for Cubic 11 font (13.1)
 */
export function preloadCriticalFonts() {
  if (typeof document === 'undefined') return;

  preloadResource('/fonts/Cubic_11.woff2', 'font', 'font/woff2');
}

/**
 * Optimize image loading with Next.js Image
 * (13.1 - Lazy load card images)
 */
export function getImageProps(src: string, isSlowNetwork: boolean = false) {
  return {
    src,
    loading: 'lazy' as const,
    quality: isSlowNetwork ? 60 : 90, // Reduce quality on slow network
    sizes: isSlowNetwork ? '(max-width: 768px) 50vw, 25vw' : '(max-width: 768px) 100vw, 50vw',
  };
}

/**
 * Check if virtualization should be enabled
 * (13.4 - Virtual scroll threshold)
 */
export function shouldUseVirtualization(recordCount: number): boolean {
  return recordCount >= PERFORMANCE_TARGETS.VIRTUALIZATION_THRESHOLD;
}

/**
 * Estimate item height for virtual scroll
 * (13.4 - Optimize item height estimation)
 */
export function estimateReadingItemHeight(cardCount: number): number {
  // Base calculation from design.md:
  // - Header: 60px (date, spread type, title)
  // - Card thumbnails: cardCount × 40px
  // - Footer: 40px (tags, action buttons)
  // - Padding: 20px
  return 60 + cardCount * 40 + 40 + 20;
}

/**
 * Debounce API calls for better performance
 * (13.3 - Optimize API response times)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle expensive operations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Measure Web Vitals metrics
 * (13.7 - Performance testing and validation)
 */
export interface WebVitals {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

export function measureWebVitals(): Promise<WebVitals> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({});
      return;
    }

    const metrics: WebVitals = {};

    // Try to get metrics from PerformanceObserver
    try {
      // FCP
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntriesByName('first-contentful-paint');
        if (entries.length > 0) {
          metrics.FCP = entries[0].startTime;
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          metrics.LCP = entries[entries.length - 1].startTime;
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Resolve after a short delay to collect metrics
      setTimeout(() => {
        fcpObserver.disconnect();
        lcpObserver.disconnect();
        resolve(metrics);
      }, 3000);
    } catch (e) {
      // Fallback: use performance.timing if PerformanceObserver is not available
      const timing = performance.timing;
      if (timing) {
        metrics.TTFB = timing.responseStart - timing.requestStart;
      }
      resolve(metrics);
    }
  });
}

/**
 * Check if current device is low-end
 * (13.5 - Low-bandwidth optimizations)
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4;
  if (cores < 4) return true;

  // Check device memory (if available)
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory && deviceMemory < 4) return true;

  return false;
}

/**
 * Get optimized animation configuration based on performance
 * (13.2 - Optimize animation performance)
 */
export function getAnimationConfig(fps: number, isSlowNetwork: boolean) {
  const shouldDegrade = fps < PERFORMANCE_TARGETS.FPS_MINIMUM || isSlowNetwork;

  return {
    shouldAnimate: !shouldDegrade,
    duration: shouldDegrade ? 0 : 300, // Instant vs 300ms
    useTransform: !shouldDegrade, // Use transform animations only if performing well
    useOpacity: true, // Always safe to animate
    useWillChange: !shouldDegrade, // Only use will-change when needed
  };
}

/**
 * Cache API responses
 * (13.3 - Implement response caching)
 */
export class APICache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number;

  constructor(ttlSeconds: number = 300) {
    this.ttl = ttlSeconds * 1000;
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear() {
    this.cache.clear();
  }
}

// Global API cache instance
export const apiCache = new APICache(300); // 5 minutes TTL
