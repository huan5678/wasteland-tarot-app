/**
 * Performance Monitoring Hook
 * Monitors FPS, detects slow network, and manages resource optimization
 *
 * Requirements: 13.2, 13.5, 13.6
 */

import { useEffect, useState, useRef, useCallback } from 'react';

export interface PerformanceMetrics {
  fps: number;
  isSlowNetwork: boolean;
  isTabVisible: boolean;
  shouldDegradeAnimations: boolean;
  networkSpeed: number; // Mbps
}

export interface UsePerformanceMonitorOptions {
  fpsThreshold?: number; // Default: 30
  slowNetworkThreshold?: number; // Default: 1 Mbps
  onPerformanceChange?: (metrics: PerformanceMetrics) => void;
}

/**
 * Hook to monitor performance metrics and automatically optimize
 */
export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const {
    fpsThreshold = 30,
    slowNetworkThreshold = 1,
    onPerformanceChange,
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    isSlowNetwork: false,
    isTabVisible: true,
    shouldDegradeAnimations: false,
    networkSpeed: 10,
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef<number>();

  // FPS Monitoring (13.2)
  const measureFPS = useCallback(() => {
    const now = performance.now();
    const delta = now - lastTimeRef.current;

    if (delta >= 1000) {
      // Calculate FPS
      const fps = Math.round((frameCountRef.current * 1000) / delta);

      setMetrics(prev => ({
        ...prev,
        fps,
        shouldDegradeAnimations: fps < fpsThreshold,
      }));

      frameCountRef.current = 0;
      lastTimeRef.current = now;
    } else {
      frameCountRef.current++;
    }

    rafIdRef.current = requestAnimationFrame(measureFPS);
  }, [fpsThreshold]);

  // Network Speed Detection (13.5)
  const detectNetworkSpeed = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const downlink = connection?.downlink || 10; // Default to good connection

      setMetrics(prev => ({
        ...prev,
        networkSpeed: downlink,
        isSlowNetwork: downlink < slowNetworkThreshold,
      }));
    }
  }, [slowNetworkThreshold]);

  // Page Visibility (13.6)
  const handleVisibilityChange = useCallback(() => {
    const isVisible = document.visibilityState === 'visible';

    setMetrics(prev => ({
      ...prev,
      isTabVisible: isVisible,
    }));

    if (!isVisible) {
      // Pause FPS monitoring when tab is hidden
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    } else {
      // Resume monitoring when tab becomes visible
      lastTimeRef.current = performance.now();
      frameCountRef.current = 0;
      rafIdRef.current = requestAnimationFrame(measureFPS);
    }
  }, [measureFPS]);

  useEffect(() => {
    // Start FPS monitoring
    rafIdRef.current = requestAnimationFrame(measureFPS);

    // Detect network speed
    detectNetworkSpeed();

    // Listen for network changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', detectNetworkSpeed);
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Cleanup
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection?.removeEventListener('change', detectNetworkSpeed);
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [measureFPS, detectNetworkSpeed, handleVisibilityChange]);

  // Notify when performance changes
  useEffect(() => {
    onPerformanceChange?.(metrics);
  }, [metrics, onPerformanceChange]);

  return metrics;
}

/**
 * Hook to automatically pause/resume resources based on tab visibility
 */
export function useTabVisibility(callbacks: {
  onHidden?: () => void;
  onVisible?: () => void;
}) {
  const { onHidden, onVisible } = callbacks;

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        onHidden?.();
      } else {
        onVisible?.();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onHidden, onVisible]);

  return {
    isVisible: !document.hidden,
    visibilityState: document.visibilityState,
  };
}

/**
 * Hook to detect and respond to network conditions
 */
export function useNetworkOptimization() {
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const [networkSpeed, setNetworkSpeed] = useState(10);

  useEffect(() => {
    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const downlink = connection?.downlink || 10;
        const effectiveType = connection?.effectiveType || '4g';

        setNetworkSpeed(downlink);
        setIsSlowNetwork(downlink < 1 || effectiveType === 'slow-2g' || effectiveType === '2g');
      }
    };

    updateNetworkInfo();

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', updateNetworkInfo);

      return () => {
        connection?.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);

  return {
    isSlowNetwork,
    networkSpeed,
    shouldReduceQuality: isSlowNetwork,
    shouldPrioritizeContent: isSlowNetwork,
  };
}

/**
 * Utility to measure component render time
 */
export function measurePerformance(label: string) {
  const mark = `${label}-start`;
  const measure = `${label}-duration`;

  performance.mark(mark);

  return () => {
    const endMark = `${label}-end`;
    performance.mark(endMark);
    performance.measure(measure, mark, endMark);

    const entries = performance.getEntriesByName(measure);
    if (entries.length > 0) {
      const duration = entries[0].duration;
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

      // Clean up marks
      performance.clearMarks(mark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measure);

      return duration;
    }

    return 0;
  };
}
