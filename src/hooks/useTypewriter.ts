/**
 * useTypewriter Hook
 *
 * 管理打字機動畫邏輯，支援打字與刪除雙向動畫
 * 使用 requestAnimationFrame 實作高效能動畫
 *
 * @example
 * ```tsx
 * const { displayText, startTyping, startDeleting } = useTypewriter({
 *   text: 'Hello World',
 *   typingSpeed: 50,
 *   deletingSpeed: 30,
 *   onTypingComplete: () => console.log('Typing done'),
 *   onDeletingComplete: () => console.log('Deleting done')
 * });
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * 動畫模式
 */
export type AnimationMode = 'typing' | 'deleting' | 'idle';

/**
 * Hook 選項
 */
export interface UseTypewriterOptions {
  /** 要顯示的文字 */
  text: string;
  /** 打字速度（毫秒/字元，預設 50） */
  typingSpeed?: number;
  /** 刪除速度（毫秒/字元，預設 30，較快） */
  deletingSpeed?: number;
  /** 打字完成回調 */
  onTypingComplete?: () => void;
  /** 刪除完成回調 */
  onDeletingComplete?: () => void;
  /** 是否啟用動畫（預設 true） */
  enabled?: boolean;
  /** 無障礙：減少動畫（預設 false） */
  prefersReducedMotion?: boolean;
}

/**
 * Hook 返回值
 */
export interface UseTypewriterReturn {
  /** 當前顯示的文字 */
  displayText: string;
  /** 是否正在執行動畫 */
  isAnimating: boolean;
  /** 當前動畫模式 */
  animationMode: AnimationMode;
  /** 進度（0-1） */
  progress: number;
  /** 開始打字 */
  startTyping: () => void;
  /** 開始刪除 */
  startDeleting: () => void;
  /** 重置動畫 */
  reset: () => void;
  /** 暫停動畫 */
  pause: () => void;
  /** 恢復動畫 */
  resume: () => void;
}

/**
 * useTypewriter Hook
 */
export function useTypewriter(options: UseTypewriterOptions): UseTypewriterReturn {
  const {
    text,
    typingSpeed = 50,
    deletingSpeed = 30,
    onTypingComplete,
    onDeletingComplete,
    enabled = true,
    prefersReducedMotion = false,
  } = options;

  // 狀態管理
  const [displayText, setDisplayText] = useState('');
  const [animationMode, setAnimationMode] = useState<AnimationMode>('idle');

  // 使用 ref 避免 re-render
  const charIndexRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const isPausedRef = useRef(false);

  // 計算進度
  const progress = text.length > 0 ? charIndexRef.current / text.length : 0;
  const isAnimating = animationMode !== 'idle';

  /**
   * 取消動畫幀
   */
  const cancelAnimation = useCallback(() => {
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
  }, []);

  /**
   * requestAnimationFrame 動畫迴圈
   */
  const animate = useCallback(
    (timestamp: number) => {
      // 如果暫停中，保持當前幀並繼續下一幀
      if (isPausedRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
        return;
      }

      const currentSpeed = animationMode === 'typing' ? typingSpeed : deletingSpeed;

      // 時間節流：只在達到指定速度間隔時更新
      if (timestamp - lastTimestampRef.current >= currentSpeed) {
        if (animationMode === 'typing') {
          // 打字模式：逐字增加
          if (charIndexRef.current < text.length) {
            charIndexRef.current++;
            setDisplayText(text.slice(0, charIndexRef.current));
            lastTimestampRef.current = timestamp;
          } else {
            // 打字完成
            cancelAnimation();
            setAnimationMode('idle');
            onTypingComplete?.();
            return;
          }
        } else if (animationMode === 'deleting') {
          // 刪除模式：逐字減少
          if (charIndexRef.current > 0) {
            charIndexRef.current--;
            setDisplayText(text.slice(0, charIndexRef.current));
            lastTimestampRef.current = timestamp;
          } else {
            // 刪除完成
            cancelAnimation();
            setAnimationMode('idle');
            onDeletingComplete?.();
            return;
          }
        }
      }

      // 繼續下一幀
      animationFrameIdRef.current = requestAnimationFrame(animate);
    },
    [
      text,
      typingSpeed,
      deletingSpeed,
      animationMode,
      onTypingComplete,
      onDeletingComplete,
      cancelAnimation,
    ]
  );

  /**
   * 開始打字動畫
   */
  const startTyping = useCallback(() => {
    if (!enabled || prefersReducedMotion) {
      // 無障礙模式：直接顯示完整文字
      setDisplayText(text);
      setAnimationMode('idle');
      charIndexRef.current = text.length;
      onTypingComplete?.();
      return;
    }

    // 取消現有動畫
    cancelAnimation();

    // 重置狀態
    charIndexRef.current = 0;
    isPausedRef.current = false;
    setDisplayText('');
    setAnimationMode('typing');
    lastTimestampRef.current = 0;

    // 啟動動畫迴圈
    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, [enabled, prefersReducedMotion, text, onTypingComplete, cancelAnimation, animate]);

  /**
   * 開始刪除動畫
   */
  const startDeleting = useCallback(() => {
    if (!enabled || prefersReducedMotion) {
      // 無障礙模式：直接清空
      setDisplayText('');
      setAnimationMode('idle');
      charIndexRef.current = 0;
      onDeletingComplete?.();
      return;
    }

    // 取消現有動畫
    cancelAnimation();

    // 從當前顯示文字長度開始刪除
    charIndexRef.current = displayText.length;
    isPausedRef.current = false;
    setAnimationMode('deleting');
    lastTimestampRef.current = 0;

    // 啟動動畫迴圈
    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, [enabled, prefersReducedMotion, displayText, onDeletingComplete, cancelAnimation, animate]);

  /**
   * 重置動畫
   */
  const reset = useCallback(() => {
    cancelAnimation();
    setDisplayText('');
    setAnimationMode('idle');
    charIndexRef.current = 0;
    isPausedRef.current = false;
  }, [cancelAnimation]);

  /**
   * 暫停動畫
   */
  const pause = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  /**
   * 恢復動畫
   */
  const resume = useCallback(() => {
    isPausedRef.current = false;
    lastTimestampRef.current = performance.now(); // 重置時間戳避免跳幀
  }, []);

  /**
   * Cleanup：元件卸載時清理動畫幀
   */
  useEffect(() => {
    return () => {
      cancelAnimation();
    };
  }, [cancelAnimation]);

  return {
    displayText,
    isAnimating,
    animationMode,
    progress,
    startTyping,
    startDeleting,
    reset,
    pause,
    resume,
  };
}
