/**
 * useAIInterpretation Hook
 * Fetches AI interpretation from streaming endpoint and displays with typewriter effect
 *
 * This hook combines streaming API fetch with client-side typewriter animation
 * for a stable, predictable user experience.
 *
 * Flow:
 * 1. Call streaming endpoint
 * 2. Accumulate all chunks to full text
 * 3. Display with typewriter effect
 *
 * Benefits:
 * - 100% stable animation (not affected by network jitter)
 * - Simple implementation
 * - Full control over speed/pause/skip
 * - Backward compatible with streaming endpoint
 *
 * Usage:
 * ```tsx
 * const { displayedText, isLoading, isTyping, skip } = useAIInterpretation({
 *   cardId: "the-fool",
 *   question: "What is my future?",
 *   characterVoice: "pip_boy",
 *   enabled: true
 * });
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTypewriter } from './useTypewriter';

// 🔧 FIX: Window-level streaming lock to survive React Strict Mode remounts
declare global {
  interface Window {
    __aiInterpretationSessions?: Map<string, AbortController>;
  }
}

function getActiveSessions(): Map<string, AbortController> {
  if (typeof window === 'undefined') return new Map();
  if (!window.__aiInterpretationSessions) {
    window.__aiInterpretationSessions = new Map();
  }
  return window.__aiInterpretationSessions;
}

function getSessionKey(apiUrl: string, requestBody: any): string {
  return `${apiUrl}::${JSON.stringify(requestBody)}`;
}

export interface UseAIInterpretationOptions {
  /** Card ID to interpret (single card) or Card IDs array (multi-card) */
  cardId: string | string[];

  /** User's question */
  question: string;

  /** Character voice/perspective (default: 'pip_boy') */
  characterVoice?: string;

  /** Karma alignment (default: 'neutral') */
  karmaAlignment?: string;

  /** Faction alignment (optional) */
  factionAlignment?: string | null;

  /** Position meaning for spread reading (optional, single card only) */
  positionMeaning?: string | null;

  /** Spread type for multi-card reading (optional, multi-card only) */
  spreadType?: string;

  /** API endpoint URL (default: '/api/v1/readings/interpretation/stream') */
  apiUrl?: string;

  /** Enable auto-fetch on mount (default: true) */
  enabled?: boolean;

  /** Typing speed in characters per second (default: 40) */
  typingSpeed?: number;

  /** Enable typing sound effect (default: false) */
  enableSound?: boolean;

  /** Callback when interpretation fetch completes */
  onFetchComplete?: (text: string) => void;

  /** Callback when typewriter animation completes */
  onTypingComplete?: (text: string) => void;

  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface UseAIInterpretationReturn {
  /** Currently displayed text (with typewriter effect) */
  displayedText: string;

  /** Full interpretation text (may not be fully displayed yet) */
  fullText: string;

  /** Whether currently fetching from API */
  isLoading: boolean;

  /** Whether currently typing (typewriter animation) */
  isTyping: boolean;

  /** Whether typewriter is paused */
  isPaused: boolean;

  /** Whether fetch + typing is complete */
  isComplete: boolean;

  /** Typing progress (0.0 - 1.0) */
  progress: number;

  /** Current typing speed multiplier */
  currentSpeed: number;

  /** Error if fetch failed */
  error: Error | null;

  /** Skip typewriter animation (show full text immediately) */
  skip: () => void;

  /** Pause typewriter animation */
  pause: () => void;

  /** Resume typewriter animation */
  resume: () => void;

  /** Toggle pause/resume */
  togglePause: () => void;

  /** Set typing speed multiplier (1x, 2x, etc.) */
  setSpeed: (multiplier: number) => void;

  /** Retry fetch (if failed) */
  retry: () => void;
}

export function useAIInterpretation({
  cardId,
  question,
  characterVoice = 'pip_boy',
  karmaAlignment = 'neutral',
  factionAlignment = null,
  positionMeaning = null,
  spreadType,
  apiUrl = '/api/v1/readings/interpretation/stream',
  enabled = true,
  typingSpeed = 40,
  enableSound = false,
  onFetchComplete,
  onTypingComplete,
  onError,
}: UseAIInterpretationOptions): UseAIInterpretationReturn {
  // State
  const [fullText, setFullText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasFetchedRef = useRef(false);

  // Typewriter effect (auto-starts when fullText changes)
  const typewriter = useTypewriter({
    text: fullText,
    speed: typingSpeed,
    autoStart: true,
    enableSound,
    onComplete: onTypingComplete,
  });

  /**
   * Fetch interpretation from streaming endpoint
   */
  const fetchInterpretation = useCallback(async () => {
    // Prevent duplicate fetches
    // 🔧 FIX: Remove isLoading check - causes race condition during React Strict Mode
    // hasFetchedRef is sufficient protection against duplicate requests
    if (hasFetchedRef.current) {
      console.log('[useAIInterpretation] Skipping duplicate fetch');
      return;
    }

    try {
      console.log('[useAIInterpretation] fetchInterpretation started');
      setIsLoading(true);
      setError(null);
      // 🔧 FIX: Don't clear fullText here - it triggers typewriter reset
      // Only clear if we actually want to show "loading" state with empty text
      // setFullText('');
      hasFetchedRef.current = true;

      // Prepare request body first (needed for session key)
      const isMultiCard = Array.isArray(cardId);
      const requestBody = isMultiCard
        ? {
            card_ids: cardId,
            question,
            character_voice: characterVoice,
            karma_alignment: karmaAlignment,
            faction_alignment: factionAlignment,
            spread_type: spreadType || 'three_card',
          }
        : {
            card_id: cardId,
            question,
            character_voice: characterVoice,
            karma_alignment: karmaAlignment,
            faction_alignment: factionAlignment,
            position_meaning: positionMeaning,
          };

      const sessionKey = getSessionKey(apiUrl, requestBody);
      const activeSessions = getActiveSessions();

      // 🔧 FIX: Check if same request is already active (React Strict Mode protection)
      if (activeSessions.has(sessionKey)) {
        console.log('[useAIInterpretation] Request already active, skipping duplicate');
        hasFetchedRef.current = false; // Reset to allow retry
        setIsLoading(false);
        return;
      }

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();
      activeSessions.set(sessionKey, abortControllerRef.current);
      console.log('[useAIInterpretation] AbortController created and registered');

      // Request body already prepared above for session key

      console.log('[useAIInterpretation] Sending request:', {
        apiUrl,
        isMultiCard,
        requestBody: JSON.stringify(requestBody),
        bodyLength: JSON.stringify(requestBody).length
      });

      // Fetch streaming response
      // 使用 cookie-based 認證（與 api.ts 一致）
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include', // 自動附帶 httpOnly cookies
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useAIInterpretation] API error:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Read streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decode chunk
        const chunk = decoder.decode(value, { stream: true });

        // Parse SSE format: "data: {content}\n\n"
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const content = line.slice(6);

            // Check for [DONE] marker
            if (content === '[DONE]') {
              continue;
            }

            // Try to parse JSON (in case backend sends JSON-wrapped chunks)
            try {
              const parsedContent = JSON.parse(content);
              accumulatedText += parsedContent;
            } catch {
              // Plain text chunk
              accumulatedText += content;
            }
          }
        }
      }

      // Set full text (triggers typewriter)
      setFullText(accumulatedText);
      setIsLoading(false);

      // 🔧 FIX: Remove session lock on success
      activeSessions.delete(sessionKey);

      // Call fetch complete callback
      if (onFetchComplete) {
        onFetchComplete(accumulatedText);
      }
    } catch (err: any) {
      // 🔧 FIX: Remove session lock on error
      const isMultiCard = Array.isArray(cardId);
      const requestBody = isMultiCard
        ? { card_ids: cardId, question, character_voice: characterVoice, karma_alignment: karmaAlignment, faction_alignment: factionAlignment, spread_type: spreadType || 'three_card' }
        : { card_id: cardId, question, character_voice: characterVoice, karma_alignment: karmaAlignment, faction_alignment: factionAlignment, position_meaning: positionMeaning };
      const sessionKey = getSessionKey(apiUrl, requestBody);
      getActiveSessions().delete(sessionKey);

      // Ignore abort errors
      if (err.name === 'AbortError') {
        console.log('[useAIInterpretation] Request aborted');
        return;
      }

      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsLoading(false);
      hasFetchedRef.current = false; // Allow retry

      if (onError) {
        onError(error);
      }
    }
  }, [
    cardId,
    question,
    characterVoice,
    karmaAlignment,
    factionAlignment,
    positionMeaning,
    spreadType,
    apiUrl,
    onFetchComplete,
    onError,
  ]);

  /**
   * Retry fetch
   */
  const retry = useCallback(() => {
    hasFetchedRef.current = false;
    setError(null);
    fetchInterpretation();
  }, [fetchInterpretation]);

  /**
   * Auto-fetch on mount if enabled
   * 🔧 FIX: Don't include fetchInterpretation in deps to avoid abort-refetch loop
   */
  useEffect(() => {
    console.log('[useAIInterpretation] useEffect triggered:', {
      enabled,
      hasCardId: !!cardId,
      hasQuestion: !!question,
      hasFetched: hasFetchedRef.current,
      isLoading
    });

    // 🔧 FIX: Remove isLoading check - hasFetchedRef is sufficient protection
    // isLoading check caused race condition during React Strict Mode cleanup
    if (enabled && cardId && question && !hasFetchedRef.current) {
      console.log('[useAIInterpretation] Calling fetchInterpretation()');
      fetchInterpretation();
    }

    // Cleanup on unmount
    return () => {
      console.log('[useAIInterpretation] Cleanup: aborting request and resetting state');
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 🔧 FIX: Remove session lock on cleanup (React Strict Mode)
      // Calculate session key to remove from window-level tracking
      const isMultiCard = Array.isArray(cardId);
      const requestBody = isMultiCard
        ? {
            card_ids: cardId,
            question,
            character_voice: characterVoice,
            karma_alignment: karmaAlignment,
            faction_alignment: factionAlignment,
            spread_type: spreadType || 'three_card',
          }
        : {
            card_id: cardId,
            question,
            character_voice: characterVoice,
            karma_alignment: karmaAlignment,
            faction_alignment: factionAlignment,
            position_meaning: positionMeaning,
          };

      const sessionKey = getSessionKey(apiUrl, requestBody);
      getActiveSessions().delete(sessionKey);
      console.log('[useAIInterpretation] Session lock removed:', sessionKey.substring(0, 50) + '...');

      // 🔧 FIX: Reset ref to allow remount to retry (React Strict Mode)
      // Don't set state in cleanup - causes React warnings
      hasFetchedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, cardId, question]);

  return {
    displayedText: typewriter.displayedText,
    fullText,
    isLoading,
    isTyping: typewriter.isTyping,
    isPaused: typewriter.isPaused,
    isComplete: !isLoading && typewriter.isComplete,
    progress: typewriter.progress,
    currentSpeed: typewriter.currentSpeed,
    error,
    skip: typewriter.skip,
    pause: typewriter.pause,
    resume: typewriter.resume,
    togglePause: typewriter.togglePause,
    setSpeed: typewriter.setSpeed,
    retry,
  };
}
