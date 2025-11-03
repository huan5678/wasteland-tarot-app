/**
 * ErrorToast - Music Player Error Display Component
 * Task 29: 音訊載入失敗處理 - 錯誤提示元件
 *
 * Requirements 10.1, 10.2, 10.3 (錯誤處理、重試機制、使用者友善錯誤訊息)
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelIcon } from '@/components/ui/icons/PixelIcon';
import { MusicPlayerError, MusicPlayerErrorType } from '@/lib/audio/errorHandler';
import { logger } from '@/lib/logger';

// ============================================================================
// Types & Interfaces
// ============================================================================
import { Button } from "@/components/ui/button";
export interface ErrorToastProps {
  error: MusicPlayerError | Error | null;
  onRetry?: () => void;
  onDismiss: () => void;
  autoDismissMs?: number; // 自動關閉時間 (預設 5000ms)
}

// ============================================================================
// Component
// ============================================================================

/**
 * ErrorToast 元件
 * 顯示 Pip-Boy 風格的錯誤提示訊息
 */
export const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  onRetry,
  onDismiss,
  autoDismissMs = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // 當錯誤改變時顯示 Toast
  useEffect(() => {
    if (error) {
      setIsVisible(true);
      logger.info('[ErrorToast] Displaying error toast', {
        errorType: error instanceof MusicPlayerError ? error.type : 'generic'
      });
    } else {
      setIsVisible(false);
    }
  }, [error]);

  // 自動關閉
  useEffect(() => {
    if (isVisible && autoDismissMs > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissMs);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoDismissMs]);

  // 處理關閉
  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300); // 等待動畫結束
  };

  // 處理重試
  const handleRetry = () => {
    if (onRetry) {
      logger.info('[ErrorToast] User triggered retry');
      onRetry();
      handleDismiss();
    }
  };

  // 取得錯誤訊息
  const getErrorMessage = (): string => {
    if (!error) return '';

    if (error instanceof MusicPlayerError) {
      return error.getUserMessage();
    }

    return error.message || '發生未知錯誤';
  };

  // 取得錯誤標題
  const getErrorTitle = (): string => {
    if (!error) return '';

    if (error instanceof MusicPlayerError) {
      const titles: Record<MusicPlayerErrorType, string> = {
        [MusicPlayerErrorType.ENGINE_INIT_FAILED]: '音樂引擎錯誤',
        [MusicPlayerErrorType.MODE_LOAD_FAILED]: '載入失敗',
        [MusicPlayerErrorType.AUDIO_CONTEXT_SUSPENDED]: '音訊已暫停',
        [MusicPlayerErrorType.STORAGE_WRITE_FAILED]: '儲存失敗',
        [MusicPlayerErrorType.PLAYLIST_CORRUPTED]: '播放清單損壞'
      };

      return titles[error.type] || '錯誤';
    }

    return '錯誤';
  };

  // 判斷是否可重試
  const isRetryable = (): boolean => {
    if (!error) return false;

    if (error instanceof MusicPlayerError) {
      return error.recoverable;
    }

    return false;
  };

  return (
    <AnimatePresence>
      {isVisible && error &&
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-24 right-6 z-[9999] max-w-md"
        role="alert"
        aria-live="assertive"
        aria-atomic="true">

          {/* Toast Container */}
          <div className="relative rounded-md border-2 border-pip-boy-green bg-black/95 p-4 shadow-pip-boy-green backdrop-blur-sm">
            {/* Scanline Effect */}
            <div className="pointer-events-none absolute inset-0 rounded-md bg-gradient-to-b from-transparent via-pip-boy-green/5 to-transparent" />

            {/* Content */}
            <div className="relative flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0">
                <PixelIcon name="alert-triangle" sizePreset="sm" variant="warning" decorative />
              </div>

              {/* Text Content */}
              <div className="flex-1 space-y-1">
                {/* Title */}
                <div className="text-sm font-semibold text-pip-boy-green">
                  {getErrorTitle()}
                </div>

                {/* Message */}
                <div className="text-xs text-pip-boy-green/80">
                  {getErrorMessage()}
                </div>

                {/* Actions */}
                {(isRetryable() || onRetry) &&
              <div className="mt-3 flex gap-2">
                    {/* Retry Button */}
                    {onRetry &&
                <Button size="xs" variant="outline"
                onClick={handleRetry}
                className="flex items-center gap-1.5 rounded border px-3 py-1.5 font-medium transition-all"
                aria-label="重試">

                        <PixelIcon name="refresh" sizePreset="xs" aria-label="重試圖示" />
                        <span>重試</span>
                      </Button>
                }
                  </div>
              }
              </div>

              {/* Close Button */}
              <Button size="icon" variant="link"
            onClick={handleDismiss}
            className="flex-shrink-0 rounded p-1 transition-colors"
            aria-label="關閉錯誤提示">

                <PixelIcon name="close" sizePreset="xs" decorative />
              </Button>
            </div>

            {/* Auto-dismiss Progress Bar */}
            {autoDismissMs > 0 &&
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: autoDismissMs / 1000, ease: 'linear' }}
            className="absolute bottom-0 left-0 h-0.5 bg-pip-boy-green" />

          }
          </div>
        </motion.div>
      }
    </AnimatePresence>);

};

/**
 * Hook: useErrorToast
 * 便捷 Hook 用於管理 ErrorToast 狀態
 *
 * @returns {object} - { error, showError, dismissError, retryCallback, setRetryCallback }
 */
export function useErrorToast() {
  const [error, setError] = useState<MusicPlayerError | Error | null>(null);
  const [retryCallback, setRetryCallback] = useState<(() => void) | undefined>(undefined);

  const showError = (
  err: MusicPlayerError | Error,
  onRetry?: () => void) =>
  {
    setError(err);
    if (onRetry) {
      setRetryCallback(() => onRetry);
    }
  };

  const dismissError = () => {
    setError(null);
    setRetryCallback(undefined);
  };

  return {
    error,
    showError,
    dismissError,
    retryCallback,
    setRetryCallback
  };
}