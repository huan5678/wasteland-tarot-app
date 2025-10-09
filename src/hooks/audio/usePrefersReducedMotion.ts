/**
 * usePrefersReducedMotion Hook
 * 需求 10.3: prefers-reduced-motion 支援
 */

import { useEffect } from 'react';
import { useAudioStore } from '@/lib/audio/audioStore';
import { logger } from '@/lib/logger';

export function usePrefersReducedMotion() {
  const { prefersReducedMotion, setPrefersReducedMotion } = useAudioStore();

  useEffect(() => {
    // 檢測 CSS media query
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // 設定初始狀態
    setPrefersReducedMotion(mediaQuery.matches);

    if (mediaQuery.matches) {
      logger.info('[PrefersReducedMotion] Reduced motion preference detected');
    }

    // 監聽變化
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      logger.info(`[PrefersReducedMotion] Preference changed: ${e.matches}`);
    };

    // 使用新的 API 或降級到舊的 API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // 舊版瀏覽器
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [setPrefersReducedMotion]);

  return prefersReducedMotion;
}
