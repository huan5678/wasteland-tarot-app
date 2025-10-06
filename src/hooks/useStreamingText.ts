/**
 * useStreamingText Hook
 * Handles Server-Sent Events (SSE) streaming for AI-generated text
 * Provides typewriter effect and skip functionality
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export interface StreamingTextOptions {
  url: string;
  requestBody: any;
  enabled?: boolean;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
  charsPerSecond?: number; // Target streaming speed
}

export interface StreamingTextState {
  text: string;
  isStreaming: boolean;
  isComplete: boolean;
  error: Error | null;
  skip: () => void;
  reset: () => void;
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
}: StreamingTextOptions): StreamingTextState {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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

    // Create abort controller for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const startStreaming = async () => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

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
  }, [enabled, url, requestBodyJson, startTypewriter]); // Removed onComplete, onError - now using refs

  return {
    text,
    isStreaming,
    isComplete,
    error,
    skip,
    reset,
  };
}