/**
 * usePerformanceMonitoring Hook
 * 需求 9.3, 9.5: 整合效能監控至應用程式
 */

import { useEffect, useState } from 'react';
import { PerformanceMonitor } from '@/lib/audio/PerformanceMonitor';

export function usePerformanceMonitoring(enabled: boolean = true) {
  const [performanceMonitor] = useState(() => PerformanceMonitor.getInstance());
  const [fps, setFps] = useState(60);
  const [isDegraded, setIsDegraded] = useState(false);
  const [audioMemory, setAudioMemory] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    performanceMonitor.start();

    // 定期更新狀態
    const updateInterval = setInterval(() => {
      const metrics = performanceMonitor.getMetrics();
      setFps(metrics.fps);
      setIsDegraded(performanceMonitor.isDegradedMode());
      setAudioMemory(metrics.audioMemory);
    }, 1000);

    return () => {
      clearInterval(updateInterval);
      performanceMonitor.stop();
    };
  }, [enabled, performanceMonitor]);

  return {
    fps,
    isDegraded,
    audioMemory: (audioMemory / 1024 / 1024).toFixed(2), // 轉換為 MB
  };
}
