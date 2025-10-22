/**
 * useStreamingText Hook
 * Handles Server-Sent Events (SSE) streaming for AI-generated text
 * Provides typewriter effect, skip functionality, and automatic retry
 *
 * 🔵 REFACTOR: Added comprehensive retry mechanism with exponential backoff
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// 🔵 REFACTOR: Logger helper
const logger = {
  info: (message: string, ...args: any[]) => console.info(`[useStreamingText] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[useStreamingText] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[useStreamingText] ${message}`, ...args),
};

export interface StreamingTextOptions {
  url: string;
  requestBody: any;
  enabled?: boolean;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
  charsPerSecond?: number; // Target streaming speed
  // 🟢 TDD: Retry options
  maxRetries?: number;      // Maximum number of retries (default: 3)
  retryDelay?: number;      // Initial retry delay in ms (default: 1000)
  timeout?: number;         // Request timeout in ms (default: 30000)
}

export interface StreamingTextState {
  text: string;
  isStreaming: boolean;
  isComplete: boolean;
  error: Error | null;
  skip: () => void;
  reset: () => void;
  // 🟢 TDD: Retry state
  retryCount: number;       // Current retry count
  isRetrying: boolean;      // Whether currently retrying
}

/**
 * Custom hook for streaming AI-generated text with typewriter effect
 *
 * Features:
 * - Real-time text streaming via SSE
 * - Typewriter effect with configurable speed
 * - Skip to full text
 * - Error handling and retry
 * - Automatic cleanup
 *
 * @example
 * ```tsx
 * const streaming = useStreamingText({
 *   url: '/api/readings/interpretation/stream',
 *   requestBody: { card_id: '123', question: 'What is my future?' },
 *   enabled: true,
 *   charsPerSecond: 40
 * });
 *
 * return (
 *   <div>
 *     <p>{streaming.text}</p>
 *     {streaming.isStreaming && <button onClick={streaming.skip}>Skip</button>}
 *   </div>
 * );
 * ```
 */
export function useStreamingText({
  url,
  requestBody,
  enabled = true,
  onComplete,
  onError,
  charsPerSecond = 40,
  // 🟢 TDD: Retry parameters
  maxRetries = 3,
  retryDelay = 1000,
  timeout = 30000,
}: StreamingTextOptions): StreamingTextState {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // 🟢 TDD: Retry state
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const fullTextRef = useRef<string>('');
  const displayedCharsRef = useRef<number>(0);
  const typewriterIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const skippedRef = useRef<boolean>(false);
  const isCompleteRef = useRef<boolean>(false);

  // Store callbacks in refs to prevent infinite re-renders
  // when parent components pass inline functions
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  /**
   * Update callback refs when callbacks change
   * This allows us to use stable refs in the streaming effect
   * without including callbacks in dependency array
   */
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  /**
   * Use a ref-based deep comparison for requestBody
   * This prevents infinite loops when parent passes inline objects like {}
   * by only triggering re-renders when the CONTENT actually changes
   */
  const requestBodyJsonRef = useRef('');

  // Use useMemo to memoize the JSON stringify operation
  // but update the ref to keep a stable value across renders
  const requestBodyJson = useMemo(() => {
    const currentJson = JSON.stringify(requestBody);
    if (currentJson !== requestBodyJsonRef.current) {
      requestBodyJsonRef.current = currentJson;
    }
    return requestBodyJsonRef.current;
  }, [requestBody]); // We DO include requestBody here - React will compare by reference,
  // but we keep the same string if content is identical

  /**
   * Skip typewriter effect and show full text immediately
   */
  const skip = useCallback(() => {
    if (skippedRef.current) return;

    skippedRef.current = true;

    // Clear typewriter interval
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
      typewriterIntervalRef.current = null;
    }

    // Show full text immediately
    setText(fullTextRef.current);
    displayedCharsRef.current = fullTextRef.current.length;
  }, []);

  /**
   * Reset streaming state
   */
  const reset = useCallback(() => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear typewriter interval
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
      typewriterIntervalRef.current = null;
    }

    // Reset state
    setText('');
    setIsStreaming(false);
    setIsComplete(false);
    setError(null);
    fullTextRef.current = '';
    displayedCharsRef.current = 0;
    skippedRef.current = false;
    isCompleteRef.current = false;
    // 🟢 TDD: Reset retry state
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  /**
   * Store charsPerSecond in ref to keep startTypewriter stable
   */
  const charsPerSecondRef = useRef(charsPerSecond);
  useEffect(() => {
    charsPerSecondRef.current = charsPerSecond;
  }, [charsPerSecond]);

  /**
   * Start typewriter effect
   * Made stable with useCallback and no dependencies - uses refs internally
   */
  const startTypewriter = useCallback(() => {
    if (typewriterIntervalRef.current) return; // Already running

    const intervalMs = 1000 / charsPerSecondRef.current;

    typewriterIntervalRef.current = setInterval(() => {
      if (skippedRef.current) {
        // Skipped, stop typewriter
        if (typewriterIntervalRef.current) {
          clearInterval(typewriterIntervalRef.current);
          typewriterIntervalRef.current = null;
        }
        return;
      }

      const fullText = fullTextRef.current;
      const displayed = displayedCharsRef.current;

      if (displayed < fullText.length) {
        // Add next chunk of characters (1-3 chars at a time for natural feel)
        const chunkSize = Math.min(3, Math.ceil(charsPerSecondRef.current / 10));
        const nextChars = fullText.slice(displayed, displayed + chunkSize);
        displayedCharsRef.current = displayed + nextChars.length;
        setText(fullText.slice(0, displayedCharsRef.current));
      } else if (isCompleteRef.current && displayed >= fullText.length) {
        // Streaming complete and all text displayed
        if (typewriterIntervalRef.current) {
          clearInterval(typewriterIntervalRef.current);
          typewriterIntervalRef.current = null;
        }
      }
    }, intervalMs);
  }, []); // No dependencies - fully stable, uses refs internally

  /**
   * 🟢 TDD: Delay helper for retry backoff
   */
  const delay = useCallback((ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }, []);

  /**
   * 🟢 TDD: Calculate exponential backoff delay
   * Formula: retryDelay * 2^attempt
   * Example: 1000ms * 2^0 = 1000ms, 1000ms * 2^1 = 2000ms, 1000ms * 2^2 = 4000ms
   */
  const getRetryDelay = useCallback((attempt: number): number => {
    return retryDelay * Math.pow(2, attempt);
  }, [retryDelay]);

  /**
   * 🟢 TDD: Fetch with timeout support
   */
  const fetchWithTimeout = useCallback(
    async (
      fetchUrl: string,
      fetchOptions: RequestInit,
      timeoutMs: number
    ): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(fetchUrl, {
          ...fetchOptions,
          signal: controller.signal,
        });
        return response;
      } catch (err) {
        // If aborted due to timeout, throw timeout error
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeoutMs}ms`);
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    []
  );

  /**
   * 🟢 TDD: Fetch with automatic retry and exponential backoff
   */
  const fetchWithRetry = useCallback(
    async (signal: AbortSignal): Promise<Response> => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Retry delay (skip for first attempt)
          if (attempt > 0) {
            setIsRetrying(true);
            setRetryCount(attempt);
            const delayMs = getRetryDelay(attempt - 1);

            // 🔵 REFACTOR: Use logger
            logger.info(`Retrying request (${attempt}/${maxRetries}) after ${delayMs}ms...`);

            await delay(delayMs);
          }

          // Fetch with timeout
          const response = await fetchWithTimeout(
            url,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            },
            timeout
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // Success - clear retry state
          setIsRetrying(false);
          setRetryCount(0);
          return response;

        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));

          // Don't retry on user abort
          if (lastError.name === 'AbortError' && signal.aborted) {
            throw lastError;
          }

          // Don't retry if offline
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            // 🔵 REFACTOR: Use logger
            logger.warn('Network offline, not retrying');
            throw new Error('Network connection lost');
          }

          // If more retries available, continue
          if (attempt < maxRetries) {
            // 🔵 REFACTOR: Use logger
            logger.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}):`, lastError.message);
            continue;
          }

          // All retries exhausted
          throw lastError;
        }
      }

      throw lastError || new Error('Unknown error');
    },
    [url, requestBody, maxRetries, retryDelay, timeout, delay, getRetryDelay, fetchWithTimeout]
  );

  /**
   * Start streaming from server
   */
  useEffect(() => {
    if (!enabled) return;

    // Reset state
    setText('');
    setIsStreaming(true);
    setIsComplete(false);
    setError(null);
    fullTextRef.current = '';
    displayedCharsRef.current = 0;
    skippedRef.current = false;
    isCompleteRef.current = false;
    // 🟢 TDD: Reset retry state
    setRetryCount(0);
    setIsRetrying(false);

    // Create abort controller for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const startStreaming = async () => {
      try {
        // 🟢 TDD: Use fetchWithRetry instead of direct fetch
        const response = await fetchWithRetry(abortController.signal);

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        // Start typewriter effect
        startTypewriter();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            setIsStreaming(false);
            setIsComplete(true);
            isCompleteRef.current = true;
            if (onCompleteRef.current) {
              onCompleteRef.current(fullTextRef.current);
            }
            break;
          }

          // Decode chunk
          const chunk = decoder.decode(value, { stream: true });

          // Parse SSE format: "data: {content}\n\n"
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const content = line.slice(6); // Remove "data: " prefix

              if (content === '[DONE]') {
                // Streaming complete
                setIsStreaming(false);
                setIsComplete(true);
                isCompleteRef.current = true;
                if (onCompleteRef.current) {
                  onCompleteRef.current(fullTextRef.current);
                }
                break;
              } else if (content.startsWith('[ERROR]')) {
                // Error occurred
                const errorMsg = content.slice(8); // Remove "[ERROR] "
                throw new Error(errorMsg);
              } else {
                // Regular content chunk
                fullTextRef.current += content;
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            // Request was aborted, not an error
            return;
          }
          setError(err);
          if (onErrorRef.current) {
            onErrorRef.current(err);
          }
        }
        setIsStreaming(false);
        // 🟢 TDD: Clear retry state on final error
        setIsRetrying(false);
      }
    };

    startStreaming();

    // Cleanup
    return () => {
      abortController.abort();
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
        typewriterIntervalRef.current = null;
      }
    };
    // Use requestBodyJson instead of requestBody to prevent re-runs on object identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, url, requestBodyJson, startTypewriter, fetchWithRetry]); // Added fetchWithRetry

  return {
    text,
    isStreaming,
    isComplete,
    error,
    skip,
    reset,
    // 🟢 TDD: Return retry state
    retryCount,
    isRetrying,
  };
}