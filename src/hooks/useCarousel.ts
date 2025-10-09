/**
 * useCarousel Hook
 *
 * 管理輪播邏輯、自動播放、互動偵測與分頁可見性整合
 *
 * @example
 * ```tsx
 * const { currentIndex, goToIndex, next, pause, resume } = useCarousel({
 *   totalCount: 5,
 *   autoPlay: true,
 *   interval: 8000,
 *   pauseOnInteraction: true
 * });
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { usePageVisibility } from './usePageVisibility';

/**
 * Hook 選項
 */
export interface UseCarouselOptions {
  /** 文案總數 */
  totalCount: number;
  /** 自動播放（預設 true） */
  autoPlay?: boolean;
  /** 間隔時間（毫秒，預設 8000） */
  interval?: number;
  /** 互動時暫停（預設 true） */
  pauseOnInteraction?: boolean;
  /** 索引變更回調 */
  onIndexChange?: (index: number) => void;
  /** 初始索引（預設 0） */
  initialIndex?: number;
}

/**
 * Hook 返回值
 */
export interface UseCarouselReturn {
  /** 當前索引 */
  currentIndex: number;
  /** 跳轉至指定索引 */
  goToIndex: (index: number) => void;
  /** 下一個 */
  next: () => void;
  /** 上一個 */
  previous: () => void;
  /** 暫停自動播放 */
  pause: () => void;
  /** 恢復自動播放 */
  resume: () => void;
  /** 是否正在播放 */
  isPlaying: boolean;
}

/**
 * useCarousel Hook
 */
export function useCarousel(options: UseCarouselOptions): UseCarouselReturn {
  const {
    totalCount,
    autoPlay = true,
    interval = 8000,
    pauseOnInteraction = true,
    onIndexChange,
    initialIndex = 0,
  } = options;

  // 頁面可見性
  const isPageVisible = usePageVisibility();

  // 狀態管理
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // 使用 ref 管理計時器
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 清除計時器
   */
  const clearTimer = useCallback(() => {
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, []);

  /**
   * 清除互動超時
   */
  const clearInteractionTimeout = useCallback(() => {
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
      interactionTimeoutRef.current = null;
    }
  }, []);

  /**
   * 跳轉至指定索引
   */
  const goToIndex = useCallback(
    (index: number) => {
      // 索引循環處理
      const validIndex = ((index % totalCount) + totalCount) % totalCount;

      setCurrentIndex(validIndex);
      onIndexChange?.(validIndex);

      // 重置計時器
      clearTimer();
      if (isPlaying && isPageVisible) {
        timerIdRef.current = setTimeout(() => {
          goToIndex(validIndex + 1);
        }, interval);
      }
    },
    [totalCount, isPlaying, isPageVisible, interval, onIndexChange, clearTimer]
  );

  /**
   * 下一個
   */
  const next = useCallback(() => {
    goToIndex(currentIndex + 1);
  }, [currentIndex, goToIndex]);

  /**
   * 上一個
   */
  const previous = useCallback(() => {
    goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  /**
   * 暫停自動播放
   */
  const pause = useCallback(() => {
    setIsPlaying(false);
    clearTimer();
  }, [clearTimer]);

  /**
   * 恢復自動播放
   */
  const resume = useCallback(() => {
    setIsPlaying(true);
  }, []);

  /**
   * 自動播放邏輯
   */
  useEffect(() => {
    // 只有在播放、頁面可見、且總數 > 1 時才啟動自動播放
    if (!isPlaying || !isPageVisible || totalCount <= 1) {
      clearTimer();
      return;
    }

    // 設定計時器
    timerIdRef.current = setTimeout(() => {
      next();
    }, interval);

    // Cleanup
    return () => {
      clearTimer();
    };
  }, [isPlaying, isPageVisible, totalCount, interval, currentIndex, next, clearTimer]);

  /**
   * 頁面可見性變更處理
   */
  useEffect(() => {
    if (!isPageVisible) {
      // 頁面隱藏時清除計時器
      clearTimer();
    }
    // 頁面恢復可見時，自動播放會由上面的 effect 重新啟動
  }, [isPageVisible, clearTimer]);

  /**
   * 互動暫停邏輯
   */
  useEffect(() => {
    if (!pauseOnInteraction || !autoPlay) {
      return;
    }

    /**
     * 處理使用者互動
     */
    const handleInteraction = () => {
      // 暫停自動播放
      pause();

      // 清除現有超時
      clearInteractionTimeout();

      // 5 秒後恢復
      interactionTimeoutRef.current = setTimeout(() => {
        resume();
      }, 5000);
    };

    // 監聽滑鼠移動與觸控事件
    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      clearInteractionTimeout();
    };
  }, [pauseOnInteraction, autoPlay, pause, resume, clearInteractionTimeout]);

  /**
   * 元件卸載時清理
   */
  useEffect(() => {
    return () => {
      clearTimer();
      clearInteractionTimeout();
    };
  }, [clearTimer, clearInteractionTimeout]);

  return {
    currentIndex,
    goToIndex,
    next,
    previous,
    pause,
    resume,
    isPlaying,
  };
}
