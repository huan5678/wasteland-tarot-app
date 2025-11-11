/**
 * API Timeout Handling Hook
 * Provides fetch wrapper with configurable timeout and abort control
 *
 * Features:
 * - Automatic timeout abortion
 * - Fallout-themed error messages
 * - Timeout state tracking
 * - AbortController integration
 */

import { useState, useCallback } from 'react';

export interface UseApiWithTimeoutReturn {
  fetchWithTimeout: (url: string, options?: RequestInit) => Promise<Response>;
  isTimeout: boolean;
  resetTimeout: () => void;
}

/**
 * Hook for API requests with automatic timeout handling
 * @param timeoutMs Timeout duration in milliseconds (default: 30000ms / 30s)
 * @returns Fetch function with timeout, timeout state, and reset function
 */
export function useApiWithTimeout(timeoutMs: number = 30000): UseApiWithTimeoutReturn {
  const [isTimeout, setIsTimeout] = useState(false);

  const fetchWithTimeout = useCallback(async (
    url: string,
    options?: RequestInit
  ): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      setIsTimeout(true);
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      setIsTimeout(false);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        setIsTimeout(true);
        throw new Error('輻射干擾，連線中斷。請重試');
      }

      throw error;
    }
  }, [timeoutMs]);

  const resetTimeout = useCallback(() => {
    setIsTimeout(false);
  }, []);

  return { fetchWithTimeout, isTimeout, resetTimeout };
}
