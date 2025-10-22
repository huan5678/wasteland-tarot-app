/**
 * StreamingInterpretation Component
 * Displays AI-generated tarot interpretations with real-time streaming effect
 * Features typewriter animation, skip functionality, and Fallout theme styling
 */

'use client';

import React, { useEffect } from 'react';
import { useStreamingText } from '@/hooks/useStreamingText';

export interface StreamingInterpretationProps {
  cardId: string;
  question: string;
  characterVoice?: string;
  karmaAlignment?: string;
  factionAlignment?: string | null;
  positionMeaning?: string | null;
  apiUrl?: string;
  enabled?: boolean;
  charsPerSecond?: number;
  onComplete?: (text: string) => void;
  onError?: (error: Error) => void;
}

/**
 * StreamingInterpretation Component
 *
 * Displays AI interpretation with streaming typewriter effect
 *
 * @example
 * ```tsx
 * <StreamingInterpretation
 *   cardId="the-fool"
 *   question="What is my future?"
 *   characterVoice="pip_boy"
 *   karmaAlignment="neutral"
 *   enabled={true}
 * />
 * ```
 */
export function StreamingInterpretation({
  cardId,
  question,
  characterVoice = 'pip_boy',
  karmaAlignment = 'neutral',
  factionAlignment = null,
  positionMeaning = null,
  apiUrl = '/api/v1/readings/interpretation/stream',
  enabled = true,
  charsPerSecond = 40,
  onComplete,
  onError,
}: StreamingInterpretationProps) {
  const requestBody = {
    card_id: cardId,
    question,
    character_voice: characterVoice,
    karma_alignment: karmaAlignment,
    faction_alignment: factionAlignment,
    position_meaning: positionMeaning,
  };

  const streaming = useStreamingText({
    url: apiUrl,
    requestBody,
    enabled,
    charsPerSecond,
    onComplete,
    onError,
  });

  // Notify parent of completion
  useEffect(() => {
    if (streaming.isComplete && onComplete) {
      onComplete(streaming.text);
    }
  }, [streaming.isComplete, streaming.text, onComplete]);

  // Notify parent of errors
  useEffect(() => {
    if (streaming.error && onError) {
      onError(streaming.error);
    }
  }, [streaming.error, onError]);

  return (
    <div className="streaming-interpretation-container relative">
      {/* Retry state - TDD P0 Integration */}
      {streaming.isRetrying && (
        <div className="flex items-center gap-2 text-yellow-500/80 mb-4">
          <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full" />
          <span className="text-sm">
            Connection interrupted. Retrying ({streaming.retryCount}/3)...
          </span>
        </div>
      )}

      {/* Loading state */}
      {!streaming.text && streaming.isStreaming && !streaming.isRetrying && (
        <div className="flex items-center gap-2 text-amber-500/80 mb-4">
          <div className="animate-spin h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full" />
          <span className="text-sm">AI is thinking...</span>
        </div>
      )}

      {/* Streaming text with typewriter effect */}
      {streaming.text && (
        <div className="relative">
          {/* Interpretation text */}
          <div
            className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap mb-4"
            style={{
              textShadow: '0 0 10px rgba(251, 191, 36, 0.3)',
            }}
          >
            {streaming.text}
            {/* Blinking cursor during streaming */}
            {streaming.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-amber-500 animate-pulse" />
            )}
          </div>

          {/* Skip button */}
          {streaming.isStreaming && (
            <button
              onClick={streaming.skip}
              className="absolute top-0 right-0 px-3 py-1 text-xs bg-amber-900/50 hover:bg-amber-800/60 text-amber-400 border border-amber-600/50 rounded transition-colors duration-200"
              aria-label="Skip to full text"
            >
              Skip
            </button>
          )}
        </div>
      )}

      {/* Error state */}
      {streaming.error && (
        <div className="bg-red-900/20 border border-red-600/50 rounded p-4 mb-4">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-red-400 text-sm font-semibold mb-1">
                Interpretation Error
              </h3>
              <p className="text-red-300/90 text-xs">
                {streaming.error.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Completion indicator */}
      {streaming.isComplete && !streaming.error && (
        <div className="flex items-center gap-2 text-green-500/80 text-xs mt-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Interpretation complete</span>
        </div>
      )}
    </div>
  );
}

/**
 * MultiCardStreamingInterpretation Component
 * Displays interpretation for multiple cards in a spread
 */
export interface MultiCardStreamingInterpretationProps {
  cardIds: string[];
  question: string;
  characterVoice?: string;
  karmaAlignment?: string;
  factionAlignment?: string | null;
  spreadType?: string;
  apiUrl?: string;
  enabled?: boolean;
  charsPerSecond?: number;
  onComplete?: (text: string) => void;
  onError?: (error: Error) => void;
}

export function MultiCardStreamingInterpretation({
  cardIds,
  question,
  characterVoice = 'pip_boy',
  karmaAlignment = 'neutral',
  factionAlignment = null,
  spreadType = 'three_card',
  apiUrl = '/api/v1/readings/interpretation/stream-multi',
  enabled = true,
  charsPerSecond = 40,
  onComplete,
  onError,
}: MultiCardStreamingInterpretationProps) {
  const requestBody = {
    card_ids: cardIds,
    question,
    character_voice: characterVoice,
    karma_alignment: karmaAlignment,
    faction_alignment: factionAlignment,
    spread_type: spreadType,
  };

  const streaming = useStreamingText({
    url: apiUrl,
    requestBody,
    enabled,
    charsPerSecond,
    onComplete,
    onError,
  });

  return (
    <div className="multi-card-streaming-interpretation-container relative">
      {/* Retry state - TDD P0 Integration */}
      {streaming.isRetrying && (
        <div className="flex items-center gap-2 text-yellow-500/80 mb-4">
          <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full" />
          <span className="text-sm">
            Connection interrupted. Retrying ({streaming.retryCount}/3)...
          </span>
        </div>
      )}

      {/* Loading state */}
      {!streaming.text && streaming.isStreaming && !streaming.isRetrying && (
        <div className="flex items-center gap-2 text-amber-500/80 mb-4">
          <div className="animate-spin h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full" />
          <span className="text-sm">
            Analyzing your spread...
          </span>
        </div>
      )}

      {/* Streaming text */}
      {streaming.text && (
        <div className="relative">
          <div
            className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap mb-4"
            style={{
              textShadow: '0 0 10px rgba(251, 191, 36, 0.3)',
            }}
          >
            {streaming.text}
            {streaming.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-amber-500 animate-pulse" />
            )}
          </div>

          {/* Skip button */}
          {streaming.isStreaming && (
            <button
              onClick={streaming.skip}
              className="absolute top-0 right-0 px-3 py-1 text-xs bg-amber-900/50 hover:bg-amber-800/60 text-amber-400 border border-amber-600/50 rounded transition-colors duration-200"
              aria-label="Skip to full text"
            >
              Skip
            </button>
          )}
        </div>
      )}

      {/* Error state */}
      {streaming.error && (
        <div className="bg-red-900/20 border border-red-600/50 rounded p-4 mb-4">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-red-400 text-sm font-semibold mb-1">
                Interpretation Error
              </h3>
              <p className="text-red-300/90 text-xs">
                {streaming.error.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Completion indicator */}
      {streaming.isComplete && !streaming.error && (
        <div className="flex items-center gap-2 text-green-500/80 text-xs mt-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Spread interpretation complete</span>
        </div>
      )}
    </div>
  );
}