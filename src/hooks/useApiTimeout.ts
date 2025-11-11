/**
 * API Timeout Handling Hook
 *
 * Provides timeout detection, retry mechanism, and user feedback
 * for API requests. Shows friendly zh-TW error messages when
 * requests exceed the timeout threshold (default 30s).
 *
 * Requirements: 9.1
 *
 * @example
 * ```tsx
 * const { executeWithTimeout, hasTimedOut, retry, error } = useApiTimeout({
 *   timeout: 30000,
 *   onTimeout: (log) => console.log('Timeout:', log)
 * });
 *
 * // Execute API request with timeout
 * const result = await executeWithTimeout(
 *   () => fetch('/api/v1/readings'),
 *   { endpoint: '/api/v1/readings' }
 * );
 *
 * // Show retry button if timed out
 * {hasTimedOut && <button onClick={retry}>重試</button>}
 * ```
 */

import { useState, useRef, useCallback } from 'react';

export interface ApiTimeoutOptions {
  /**
   * Timeout duration in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Callback when timeout occurs
   */
  onTimeout?: (log: TimeoutLog) => void;
}

export interface TimeoutLog {
  timestamp: string;
  duration: number;
  endpoint?: string;
}

export interface ApiError {
  message: string;
  type: 'TIMEOUT' | 'NETWORK' | 'UNKNOWN';
  canRetry: boolean;
}

export interface ExecuteOptions {
  endpoint?: string;
}

export function useApiTimeout(options: ApiTimeoutOptions = {}) {
  const {
    timeout = 30000,
    onTimeout
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<any>(null);

  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<(() => Promise<any>) | null>(null);
  const lastOptionsRef = useRef<ExecuteOptions>({});

  const cleanup = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const executeWithTimeout = useCallback(async <T,>(
    fetchFn: () => Promise<T>,
    executeOptions: ExecuteOptions = {}
  ): Promise<T | null> => {
    // Store for retry
    lastFetchRef.current = fetchFn;
    lastOptionsRef.current = executeOptions;

    // Reset state
    setIsLoading(true);
    setHasTimedOut(false);
    setError(null);
    setData(null);
    cleanup();

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutIdRef.current = setTimeout(() => {
        const log: TimeoutLog = {
          timestamp: new Date().toISOString(),
          duration: timeout,
          endpoint: executeOptions.endpoint
        };

        setHasTimedOut(true);
        setError({
          message: '輻射干擾，連線中斷。請稍後再試',
          type: 'TIMEOUT',
          canRetry: true
        });
        setIsLoading(false);

        if (onTimeout) {
          onTimeout(log);
        }

        reject(new Error('Request timeout'));
      }, timeout);
    });

    try {
      // Race between fetch and timeout
      const result = await Promise.race([
        fetchFn(),
        timeoutPromise
      ]);

      // Success - cleanup and set data
      cleanup();
      setData(result);
      setIsLoading(false);
      return result as T;
    } catch (err) {
      // Check if it's a timeout error
      if (err instanceof Error && err.message === 'Request timeout') {
        // Already handled by timeout
        return null;
      }

      // Other errors
      cleanup();
      setIsLoading(false);
      setError({
        message: err instanceof Error ? err.message : '未知錯誤',
        type: 'UNKNOWN',
        canRetry: true
      });
      return null;
    }
  }, [timeout, onTimeout, cleanup]);

  const retry = useCallback(() => {
    if (lastFetchRef.current) {
      executeWithTimeout(lastFetchRef.current, lastOptionsRef.current);
    }
  }, [executeWithTimeout]);

  return {
    executeWithTimeout,
    isLoading,
    hasTimedOut,
    error,
    data,
    retry
  };
}
