/**
 * useStreamingText Hook
 * Handles Server-Sent Events (SSE) streaming for AI-generated text
 *
 * Features:
 * - Typewriter effect with configurable speed
 * - Skip functionality
 * - Automatic retry with exponential backoff (P0)
 * - Typing sound effects with throttling (P1)
 * - Comprehensive error handling
 *
 * @see TDD implementation in useStreamingText.retry.test.ts
 * @see TDD implementation in useStreamingText.audio.test.ts
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAudioEffect } from '@/hooks/audio/useAudioEffect'; // 🟢 TDD P1: Audio integration

// 🔵 REFACTOR: Logger helper
const logger = {
  info: (message: string, ...args: any[]) => console.info(`[useStreamingText] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[useStreamingText] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[useStreamingText] ${message}`, ...args),
};

// 🔧 FIX: Window-level streaming lock to survive React Strict Mode remounts
// Using window object ensures the lock persists across component unmount/remount cycles
declare global {
  interface Window {
    __activeStreamingSessions?: Map<string, AbortController>;
  }
}

/**
 * Get or create the global streaming sessions Map on window object
 * This ensures the Map survives React Strict Mode's unmount/remount cycles
 */
function getActiveStreamingSessions(): Map<string, AbortController> {
  if (typeof window === 'undefined') {
    // SSR: return empty map (will not be used)
    return new Map();
  }

  if (!window.__activeStreamingSessions) {
    window.__activeStreamingSessions = new Map();
  }

  return window.__activeStreamingSessions;
}

/**
 * Generate a unique key for a streaming session based on URL and request body
 * @param url - API endpoint URL
 * @param requestBodyJson - Request body as JSON string (already stringified)
 */
function getStreamingSessionKey(url: string, requestBodyJson: string): string {
  return `${url}::${requestBodyJson}`;
}

/**
 * 🟢 TDD P2: Error type classification
 */
export type StreamingErrorType =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'CLIENT_ERROR'
  | 'SERVER_ERROR'
  | 'NOT_FOUND'
  | 'AUTH_ERROR'
  | 'OFFLINE'
  | 'UNKNOWN';

/**
 * 🟢 TDD P2: Error information with user-friendly messages
 */
export interface ErrorInfo {
  type: StreamingErrorType;
  userFriendlyMessage: string;
  recoverySuggestion: string;
}

export interface StreamingTextOptions {
  url: string;
  requestBody: any;
  enabled?: boolean;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
  charsPerSecond?: number; // Target streaming speed
  // 🟢 TDD P0: Retry options
  maxRetries?: number;      // Maximum number of retries (default: 3)
  retryDelay?: number;      // Initial retry delay in ms (default: 1000)
  timeout?: number;         // Request timeout in ms (default: 60000)
  // 🟢 TDD P1: Audio options
  enableTypingSound?: boolean;  // Enable typing sound effect (default: false)
  soundThrottle?: number;       // Sound throttle interval in ms (default: 50)
  typingSoundVolume?: number;   // Typing sound volume (default: 0.3)
  // 🟢 TDD P2: Fallback options
  enableFallback?: boolean;     // Enable fallback to non-streaming endpoint (default: false)
  fallbackUrl?: string;         // Custom fallback URL (default: auto-derived from url)
  fallbackResponseKey?: string; // JSON response key for text content (default: 'interpretation')
  // 🟢 Task 4.1: Typewriter optimization options
  enableRandomVariation?: boolean; // Enable ±20% random variation (default: true)
}

export interface StreamingTextState {
  text: string;
  isStreaming: boolean;
  isComplete: boolean;
  error: Error | null;
  skip: () => void;
  reset: () => void;
  // 🟢 TDD P0: Retry state
  retryCount: number;       // Current retry count
  isRetrying: boolean;      // Whether currently retrying
  // 🟢 TDD P2: Network state
  isOnline: boolean;        // Current network online status
  // 🟢 TDD P2: Fallback state
  usedFallback: boolean;    // Whether fallback endpoint was used
  // 🟢 TDD P2: Friendly error messages
  errorType: StreamingErrorType | null;  // Classified error type
  userFriendlyError: string | null;      // User-friendly error message
  recoverySuggestion: string | null;     // Recovery suggestion
  // 🟢 Task 4.1 & 4.2: Streaming controls
  pause: () => void;        // Pause typewriter effect
  resume: () => void;       // Resume typewriter effect
  togglePause: () => void;  // Toggle pause state
  isPaused: boolean;        // Whether typewriter is paused
  setSpeed: (multiplier: number) => void;  // Set speed multiplier (e.g., 2 for 2x speed)
  currentSpeed: number;     // Current speed multiplier
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
  // 🟢 TDD P0: Retry parameters
  maxRetries = 3,
  retryDelay = 1000,
  timeout = 60000,  // Increased to 60s for longer AI interpretations
  // 🟢 TDD P1: Audio parameters
  enableTypingSound = false,
  soundThrottle = 50,
  typingSoundVolume = 0.3,
  // 🟢 TDD P2: Fallback parameters
  enableFallback = false,
  fallbackUrl,
  fallbackResponseKey = 'interpretation',
  // 🟢 Task 4.1: Typewriter optimization parameters
  enableRandomVariation = true,
}: StreamingTextOptions): StreamingTextState {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // 🟢 TDD P0: Retry state
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  // 🟢 TDD P2: Network state
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  // 🟢 TDD P2: Fallback state
  const [usedFallback, setUsedFallback] = useState(false);
  // 🟢 TDD P2: Friendly error messages
  const [errorType, setErrorType] = useState<StreamingErrorType | null>(null);
  const [userFriendlyError, setUserFriendlyError] = useState<string | null>(null);
  const [recoverySuggestion, setRecoverySuggestion] = useState<string | null>(null);
  // 🟢 Task 4.1 & 4.2: Streaming controls state
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // 🟢 TDD P1: Audio integration
  const { playSound } = useAudioEffect();
  const lastSoundTimeRef = useRef<number>(0);

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
   * 🟢 TDD P2: Monitor network online/offline status
   * Listen to online/offline events and update state accordingly
   */
  useEffect(() => {
    const handleOnline = () => {
      logger.info('Network connection restored');
      setIsOnline(true);
    };

    const handleOffline = () => {
      logger.warn('Network connection lost');
      setIsOnline(false);

      // If currently streaming, abort and set offline error
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // 🟢 TDD P2: Use setErrorWithInfo for friendly messages
      setErrorWithInfo(new Error('Network connection lost'));
      setIsStreaming(false);
      setIsRetrying(false);
    };

    // Register event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
   * 🟢 Task 4.1 & 4.2: Pause typewriter effect
   */
  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  /**
   * 🟢 Task 4.1 & 4.2: Resume typewriter effect
   */
  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  /**
   * 🟢 Task 4.1 & 4.2: Toggle pause state
   */
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  /**
   * 🟢 Task 4.1 & 4.2: Set speed multiplier
   * @param multiplier - Speed multiplier (e.g., 2 for 2x speed, 0.5 for half speed)
   */
  const setSpeed = useCallback((multiplier: number) => {
    if (multiplier <= 0) {
      logger.warn('Speed multiplier must be positive, ignoring:', multiplier);
      return;
    }
    setSpeedMultiplier(multiplier);
  }, []);

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
    // 🟢 TDD P0: Reset retry state
    setRetryCount(0);
    setIsRetrying(false);
    // 🟢 TDD P2: Reset fallback state
    setUsedFallback(false);
    // 🟢 TDD P2: Reset error info
    setErrorType(null);
    setUserFriendlyError(null);
    setRecoverySuggestion(null);
  }, []);

  /**
   * 🟢 TDD P2: Classify error and generate user-friendly messages
   */
  const classifyError = useCallback((err: Error): ErrorInfo => {
    const message = err.message.toLowerCase();

    // Offline detection
    if (
      !navigator.onLine ||
      message.includes('network connection lost') ||
      message.includes('offline')
    ) {
      return {
        type: 'OFFLINE',
        userFriendlyMessage: '目前無網路連線，請檢查網路設定',
        recoverySuggestion: '請確認您的網路連線後重試',
      };
    }

    // Timeout detection
    if (message.includes('timeout') || message.includes('逾時')) {
      return {
        type: 'TIMEOUT',
        userFriendlyMessage: '連線逾時，請稍後再試',
        recoverySuggestion: '請檢查網路連線或稍後重試',
      };
    }

    // HTTP status code detection
    if (message.includes('http')) {
      // 404 Not Found
      if (message.includes('404')) {
        return {
          type: 'NOT_FOUND',
          userFriendlyMessage: '找不到請求的資源',
          recoverySuggestion: '請確認功能是否可用或聯繫支援',
        };
      }

      // 401/403 Authentication
      if (message.includes('401') || message.includes('403') || message.includes('unauthorized')) {
        return {
          type: 'AUTH_ERROR',
          userFriendlyMessage: '權限不足或需要重新登入',
          recoverySuggestion: '請重新登入後再試',
        };
      }

      // 400-499 Client errors
      if (message.match(/4\d{2}/)) {
        return {
          type: 'CLIENT_ERROR',
          userFriendlyMessage: '請求無效，請確認參數是否正確',
          recoverySuggestion: '請檢查輸入內容或聯繫支援',
        };
      }

      // 500-599 Server errors
      if (message.match(/5\d{2}/)) {
        return {
          type: 'SERVER_ERROR',
          userFriendlyMessage: '伺服器暫時無法回應，請稍後再試',
          recoverySuggestion: '請稍候片刻後重試',
        };
      }
    }

    // Network errors
    if (
      message.includes('failed to fetch') ||
      message.includes('network') ||
      message.includes('connection')
    ) {
      return {
        type: 'NETWORK_ERROR',
        userFriendlyMessage: '網路連線不穩定，請檢查您的網路設定',
        recoverySuggestion: '請檢查網路連線後重試',
      };
    }

    // Unknown errors
    return {
      type: 'UNKNOWN',
      userFriendlyMessage: '發生未知錯誤，請稍後再試',
      recoverySuggestion: '請稍後重試，若問題持續請聯繫支援',
    };
  }, []);

  /**
   * 🟢 TDD P2: Set error with classification and friendly messages
   */
  const setErrorWithInfo = useCallback((err: Error) => {
    const errorInfo = classifyError(err);

    // Set technical error (for debugging)
    setError(err);

    // Set user-friendly error info
    setErrorType(errorInfo.type);
    setUserFriendlyError(errorInfo.userFriendlyMessage);
    setRecoverySuggestion(errorInfo.recoverySuggestion);

    logger.error(`Error classified as ${errorInfo.type}:`, err.message);
  }, [classifyError]);

  /**
   * Store charsPerSecond and other dynamic values in refs to keep startTypewriter stable
   */
  const charsPerSecondRef = useRef(charsPerSecond);
  const enableRandomVariationRef = useRef(enableRandomVariation);
  const isPausedRef = useRef(isPaused);
  const speedMultiplierRef = useRef(speedMultiplier);
  const frameCountRef = useRef(0);
  const fpsRef = useRef(60);

  useEffect(() => {
    charsPerSecondRef.current = charsPerSecond;
  }, [charsPerSecond]);

  useEffect(() => {
    enableRandomVariationRef.current = enableRandomVariation;
  }, [enableRandomVariation]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    speedMultiplierRef.current = speedMultiplier;
  }, [speedMultiplier]);

  /**
   * 🟢 TDD P1: Play typing sound with throttling
   */
  const playTypingSoundThrottled = useCallback(() => {
    if (!enableTypingSound) return;

    const now = Date.now();
    if (now - lastSoundTimeRef.current >= soundThrottle) {
      playSound('typing', { volume: typingSoundVolume });
      lastSoundTimeRef.current = now;
    }
  }, [enableTypingSound, soundThrottle, typingSoundVolume, playSound]);

  /**
   * 🟢 Task 4.1: Start typewriter effect with optimization features
   * - Speed control via speedMultiplier
   * - Pause/resume support
   * - ±20% random variation
   * - Batch rendering for low FPS
   * Made stable with useCallback and no dependencies - uses refs internally
   */
  const startTypewriter = useCallback(() => {
    if (typewriterIntervalRef.current) return; // Already running

    // FPS monitoring for batch rendering
    let lastFrameTime = Date.now();
    let frameCounter = 0;

    const getEffectiveSpeed = (): number => {
      const baseSpeed = charsPerSecondRef.current * speedMultiplierRef.current;

      // 🟢 Task 4.1: Apply ±20% random variation if enabled
      if (enableRandomVariationRef.current) {
        const variation = 0.8 + Math.random() * 0.4; // Range: 0.8 to 1.2 (±20%)
        return baseSpeed * variation;
      }

      return baseSpeed;
    };

    // Calculate batch size based on FPS (for low FPS optimization)
    const getBatchSize = (): number => {
      const currentFps = fpsRef.current;

      // 🟢 Task 4.1: Batch rendering when FPS < 30
      if (currentFps < 30) {
        // Low FPS: render more characters per frame
        return Math.ceil(charsPerSecondRef.current / 10); // ~10 frames/sec worth of chars
      }

      // Normal FPS: render 1-3 chars per frame
      return Math.min(3, Math.ceil(charsPerSecondRef.current / 20));
    };

    const intervalMs = 1000 / (charsPerSecondRef.current * speedMultiplierRef.current);

    typewriterIntervalRef.current = setInterval(() => {
      // 🟢 Task 4.1 & 4.2: Check pause state
      if (isPausedRef.current) {
        // Paused, skip this frame
        return;
      }

      if (skippedRef.current) {
        // Skipped, stop typewriter
        if (typewriterIntervalRef.current) {
          clearInterval(typewriterIntervalRef.current);
          typewriterIntervalRef.current = null;
        }
        return;
      }

      // 🟢 Task 4.1: FPS monitoring
      frameCounter++;
      const now = Date.now();
      if (now - lastFrameTime >= 1000) {
        fpsRef.current = Math.round((frameCounter * 1000) / (now - lastFrameTime));
        frameCounter = 0;
        lastFrameTime = now;
      }

      const fullText = fullTextRef.current;
      const displayed = displayedCharsRef.current;

      if (displayed < fullText.length) {
        // 🟢 Task 4.1: Get batch size based on FPS
        const batchSize = getBatchSize();
        const chunkSize = Math.min(batchSize, fullText.length - displayed);

        const nextChars = fullText.slice(displayed, displayed + chunkSize);
        displayedCharsRef.current = displayed + nextChars.length;
        setText(fullText.slice(0, displayedCharsRef.current));

        // 🟢 TDD P1: Play typing sound (throttled)
        playTypingSoundThrottled();
      } else if (isCompleteRef.current && displayed >= fullText.length) {
        // Streaming complete and all text displayed
        if (typewriterIntervalRef.current) {
          clearInterval(typewriterIntervalRef.current);
          typewriterIntervalRef.current = null;
        }
      }
    }, intervalMs);
  }, [playTypingSoundThrottled]); // 🟢 TDD P1: Added playTypingSoundThrottled dependency

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
   * 🟢 TDD P2: Derive fallback URL from streaming URL
   * Removes '/stream' suffix or uses custom fallbackUrl
   */
  const getFallbackUrl = useCallback((): string => {
    if (fallbackUrl) {
      return fallbackUrl;
    }

    // Auto-derive: remove '/stream' suffix
    if (url.endsWith('/stream')) {
      return url.slice(0, -7); // Remove '/stream'
    }

    // If URL doesn't end with /stream, append fallback endpoint
    logger.warn('Cannot auto-derive fallback URL, using original URL');
    return url;
  }, [url, fallbackUrl]);

  /**
   * 🟢 TDD P2: Fetch from fallback (non-streaming) endpoint
   * Used when streaming fails after all retries exhausted
   */
  const fetchFallback = useCallback(async (): Promise<string> => {
    const fbUrl = getFallbackUrl();

    logger.info(`Attempting fallback to non-streaming endpoint: ${fbUrl}`);

    const response = await fetchWithTimeout(
      fbUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 🔧 FIX: Include httpOnly cookies for authentication
        body: JSON.stringify(requestBody),
      },
      timeout
    );

    if (!response.ok) {
      throw new Error(`Fallback HTTP ${response.status}: ${response.statusText}`);
    }

    // Parse JSON response
    const jsonData = await response.json();

    // Extract text from response using configured key
    const text = jsonData[fallbackResponseKey];

    if (typeof text !== 'string') {
      throw new Error(`Fallback response missing '${fallbackResponseKey}' field`);
    }

    logger.info('Fallback succeeded');
    return text;
  }, [getFallbackUrl, requestBody, timeout, fallbackResponseKey, fetchWithTimeout]);

  /**
   * 🟢 TDD P0: Fetch with automatic retry and exponential backoff
   * 🟢 TDD P2: Check network status before retrying
   */
  const fetchWithRetry = useCallback(
    async (signal: AbortSignal): Promise<Response> => {
      // 🟢 TDD P2: Check network status immediately
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        logger.warn('Cannot start request: network offline');
        throw new Error('Network connection lost');
      }

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
              credentials: 'include', // 🔧 FIX: Include httpOnly cookies for authentication
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
    // 🚨 EMERGENCY DEBUG: Log at the very beginning to confirm execution
    console.log('🚨🚨🚨 [USEEFFECT ENTRY] useStreamingText effect triggered!', {
      enabled,
      url,
      timestamp: new Date().toISOString()
    });

    if (!enabled) {
      console.log('🚨 [DISABLED] Effect disabled, returning early');
      return;
    }

    // 🔧 FIX: React Strict Mode guard using window-level session lock
    // Generate unique key for this streaming session
    const sessionKey = getStreamingSessionKey(url, requestBodyJson);
    const activeSessions = getActiveStreamingSessions();

    // Check if a session with the same parameters is already active
    console.log('🔍 [SESSION CHECK]', {
      sessionKey: sessionKey.substring(0, 100),
      hasSession: activeSessions.has(sessionKey),
      allSessions: Array.from(activeSessions.keys()).map(k => k.substring(0, 100))
    });

    if (activeSessions.has(sessionKey)) {
      const existingController = activeSessions.get(sessionKey)!;

      console.log('⛔ [BLOCKING DUPLICATE] Cancelling previous request and starting new one');
      logger.info('Cancelling previous streaming request (React Strict Mode guard)', {
        sessionKey,
        activeSessionsCount: activeSessions.size
      });

      // Cancel the existing request
      existingController.abort();

      // Remove from active sessions
      activeSessions.delete(sessionKey);
    }

    // Reset state
    setText('');
    setIsStreaming(true);
    setIsComplete(false);
    setError(null);
    fullTextRef.current = '';
    displayedCharsRef.current = 0;
    skippedRef.current = false;
    isCompleteRef.current = false;
    // 🟢 TDD P0: Reset retry state
    setRetryCount(0);
    setIsRetrying(false);
    // 🟢 TDD P2: Reset fallback state
    setUsedFallback(false);

    // Create abort controller for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Register this session immediately to block subsequent invocations
    activeSessions.set(sessionKey, abortController);
    console.log('✅ [STARTED] Starting new streaming session', {
      sessionKey: sessionKey.substring(0, 100),
      activeSessionsCount: activeSessions.size
    });
    logger.info('Starting new streaming session', {
      sessionKey,
      activeSessionsCount: activeSessions.size
    });

    /**
     * Helper function to clean up session lock when streaming truly completes
     */
    const cleanupSessionLock = (reason: string) => {
      const sessions = getActiveStreamingSessions();
      sessions.delete(sessionKey);

      console.log('🔓 [SESSION CLEANUP]', {
        reason,
        sessionKey: sessionKey.substring(0, 100),
        activeSessionsCount: sessions.size
      });

      logger.info('Session lock released', {
        reason,
        sessionKey,
        activeSessionsCount: sessions.size
      });
    };

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
            cleanupSessionLock('Streaming completed (reader done)');
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
                cleanupSessionLock('Streaming completed ([DONE] message)');
                break;
              } else if (content.startsWith('[ERROR]')) {
                // Error occurred
                const errorMsg = content.slice(8); // Remove "[ERROR] "
                throw new Error(errorMsg);
              } else {
                // Regular content chunk
                // 🔧 FIX: Parse JSON if content is JSON-encoded
                try {
                  const parsedContent = JSON.parse(content);
                  fullTextRef.current += parsedContent;
                } catch {
                  // If not JSON, use as-is
                  fullTextRef.current += content;
                }
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            // Request was aborted, not an error
            cleanupSessionLock('Request aborted');
            return;
          }

          // 🟢 TDD P2: Try fallback if enabled
          if (enableFallback) {
            try {
              logger.info('Streaming failed, attempting fallback...');
              const fallbackText = await fetchFallback();

              // Set text immediately (no typewriter effect for fallback)
              fullTextRef.current = fallbackText;
              setText(fallbackText);
              displayedCharsRef.current = fallbackText.length;

              // Mark as complete and used fallback
              setIsComplete(true);
              isCompleteRef.current = true;
              setUsedFallback(true);
              setIsStreaming(false);
              setIsRetrying(false);

              if (onCompleteRef.current) {
                onCompleteRef.current(fallbackText);
              }

              cleanupSessionLock('Fallback completed successfully');

              // Fallback succeeded, return early
              return;
            } catch (fallbackErr) {
              // 🔵 REFACTOR: Fallback also failed
              // 🟢 TDD P2: Use setErrorWithInfo for friendly messages
              logger.error('Fallback also failed:', fallbackErr);
              const finalError = fallbackErr instanceof Error
                ? fallbackErr
                : new Error(String(fallbackErr));
              setErrorWithInfo(finalError);

              if (onErrorRef.current) {
                onErrorRef.current(finalError);
              }

              cleanupSessionLock('Fallback failed');

              // Return early after handling fallback error
              return;
            }
          }

          // 🔵 REFACTOR: No fallback enabled - set streaming error
          // 🟢 TDD P2: Use setErrorWithInfo for friendly messages
          setErrorWithInfo(err);
          if (onErrorRef.current) {
            onErrorRef.current(err);
          }

          cleanupSessionLock('Streaming failed (no fallback)');
        }
        setIsStreaming(false);
        // 🟢 TDD P0: Clear retry state on final error
        setIsRetrying(false);
      }
    };

    startStreaming();

    // Cleanup
    return () => {
      // 🔧 FIX: Only abort request in cleanup, don't delete session
      // Session will be deleted when request actually completes
      console.log('🧹 [CLEANUP] Aborting streaming request (session lock remains)', {
        sessionKey: sessionKey.substring(0, 100)
      });

      logger.info('Aborting streaming request (session lock persists for React Strict Mode)', {
        sessionKey
      });

      abortController.abort();
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
        typewriterIntervalRef.current = null;
      }
    };
    // Use requestBodyJson instead of requestBody to prevent re-runs on object identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, url, requestBodyJson, startTypewriter, fetchWithRetry, enableFallback, fetchFallback, setErrorWithInfo]);

  return {
    text,
    isStreaming,
    isComplete,
    error,
    skip,
    reset,
    // 🟢 TDD P0: Return retry state
    retryCount,
    isRetrying,
    // 🟢 TDD P2: Return network state
    isOnline,
    // 🟢 TDD P2: Return fallback state
    usedFallback,
    // 🟢 TDD P2: Return friendly error messages
    errorType,
    userFriendlyError,
    recoverySuggestion,
    // 🟢 Task 4.1 & 4.2: Return streaming controls
    pause,
    resume,
    togglePause,
    isPaused,
    setSpeed,
    currentSpeed: speedMultiplier,
  };
}