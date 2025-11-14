/**
 * AIInterpretation Component
 * Displays AI-generated tarot interpretations with stable typewriter effect
 *
 * Architecture:
 * 1. Fetch full interpretation from streaming API
 * 2. Accumulate all chunks into complete text
 * 3. Display with client-side typewriter animation
 *
 * Benefits:
 * - 100% stable animation (not affected by network jitter)
 * - Predictable user experience
 * - Full control over speed/pause/skip
 * - Backward compatible with streaming endpoint
 */

'use client';

import React from 'react';
import { useAIInterpretation } from '@/hooks/useAIInterpretation';
import { Button } from '@/components/ui/button';
import { PixelIcon } from '@/components/ui/icons';

export interface MultiCardAIInterpretationProps {
  cardIds: string[];
  question: string;
  characterVoice?: string;
  karmaAlignment?: string;
  factionAlignment?: string | null;
  spreadType?: string;
  apiUrl?: string;
  enabled?: boolean;
  charsPerSecond?: number;
  onFetchComplete?: (text: string) => void; // Called when AI fetch completes
  onTypingComplete?: () => void; // Called when typewriter animation completes
  onError?: (error: Error) => void;
}

/**
 * MultiCardAIInterpretation Component
 *
 * Displays AI interpretation for multiple cards with stable typewriter animation
 *
 * 🔧 FIX: Wrapped with React.memo to prevent re-rendering when parent re-renders
 * This prevents component remount when activity tracker or other parent state changes
 *
 * @example
 * ```tsx
 * <MultiCardAIInterpretation
 *   cardIds={["the-fool", "the-magician", "the-empress"]}
 *   question="What is my future?"
 *   characterVoice="pip_boy"
 *   karmaAlignment="neutral"
 *   spreadType="three_card"
 *   enabled={true}
 *   onComplete={(text) => console.log('Done:', text)}
 * />
 * ```
 */
const MultiCardAIInterpretationComponent = ({
  cardIds,
  question,
  characterVoice = 'pip_boy',
  karmaAlignment = 'neutral',
  factionAlignment = null,
  spreadType = 'three_card',
  apiUrl = '/api/v1/readings/interpretation/stream-multi',
  enabled = true,
  charsPerSecond = 40,
  onFetchComplete,
  onTypingComplete,
  onError
}: MultiCardAIInterpretationProps) => {
  // Use new hook that combines streaming fetch + typewriter
  // Hook now supports both single-card and multi-card modes (auto-detected by cardId type)
  const ai = useAIInterpretation({
    cardId: cardIds, // Pass array for multi-card mode
    question,
    characterVoice,
    karmaAlignment,
    factionAlignment,
    spreadType, // Multi-card mode: use spreadType
    apiUrl,
    enabled,
    typingSpeed: charsPerSecond,
    enableSound: false,
    onFetchComplete: (fullText) => {
      console.log('[MultiCardAI] Fetch complete, starting TTS generation');
      // 🔧 UX IMPROVEMENT: Trigger TTS generation immediately when fetch completes
      // This allows TTS to generate in background while typewriter animation plays
      if (onFetchComplete) {
        onFetchComplete(fullText);
      }
    },
    onTypingComplete: (fullText) => {
      console.log('[MultiCardAI] Typewriter complete');
      // 🔧 UX IMPROVEMENT: Notify parent that animation finished
      // Parent can now switch to static view and show TTS player
      if (onTypingComplete) {
        onTypingComplete();
      }
    },
    onError
  });

  return (
    <div className="multi-card-ai-interpretation-container relative">
      {/* Loading state - fetching from API */}
      {ai.isLoading && (
        <div className="flex items-center gap-2 text-amber-500/80 mb-4">
          <PixelIcon
            name="loader"
            animation="spin"
            sizePreset="sm"
            variant="warning"
            decorative
          />
          <span className="text-sm uppercase tracking-wider">
            AI 正在分析你的牌陣...
          </span>
        </div>
      )}

      {/* Typing animation - displaying accumulated text */}
      {ai.displayedText && (
        <div className="relative bg-black/70 p-4 border border-pip-boy-green/20 rounded mb-4">
          {/* Interpretation text */}
          <div className="text-sm text-pip-boy-green/90 leading-relaxed whitespace-pre-wrap">
            {ai.displayedText}
            {/* Blinking cursor during typing */}
            {ai.isTyping && (
              <span className="inline-block w-2 h-4 ml-1 bg-pip-boy-green animate-pulse" />
            )}
          </div>

          {/* Streaming controls */}
          {ai.isTyping && (
            <div
              className="flex items-center gap-2 absolute top-2 right-2"
              data-testid="streaming-controls"
            >
              {/* Pause/Resume button */}
              <Button
                size="sm"
                variant="outline"
                onClick={ai.togglePause}
                className="px-3 py-1 border rounded transition-colors duration-200"
                aria-label={ai.isPaused ? '繼續' : '暫停'}
              >
                <PixelIcon
                  name={ai.isPaused ? 'play' : 'pause'}
                  sizePreset="xs"
                  decorative
                />
              </Button>

              {/* 2x speed button */}
              <Button
                size="sm"
                variant={ai.currentSpeed === 2 ? 'default' : 'outline'}
                onClick={() => ai.setSpeed(ai.currentSpeed === 2 ? 1 : 2)}
                className="px-3 py-1 border rounded transition-colors duration-200"
                aria-label={ai.currentSpeed === 2 ? '正常速度' : '2倍速度'}
              >
                {ai.currentSpeed === 2 ? '1x' : '2x'}
              </Button>

              {/* Skip button */}
              <Button
                size="sm"
                variant="outline"
                onClick={ai.skip}
                className="px-3 py-1 border rounded transition-colors duration-200"
                aria-label="跳過到完整文字"
              >
                <PixelIcon name="forward" sizePreset="xs" decorative />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {ai.error && (
        <div className="bg-red-900/20 border border-red-600/50 rounded p-4 mb-4">
          <div className="flex items-start gap-2">
            <PixelIcon
              name="alert-triangle"
              sizePreset="md"
              variant="error"
              className="flex-shrink-0 mt-0.5"
              decorative
            />
            <div>
              <h3 className="text-red-400 text-sm font-semibold mb-1 uppercase tracking-wider">
                解讀錯誤
              </h3>
              <p className="text-red-300/90 text-xs">
                {ai.error.message}
              </p>
              {ai.retry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={ai.retry}
                  className="mt-3 px-3 py-1"
                >
                  <PixelIcon name="refresh" sizePreset="xs" decorative />
                  <span className="ml-2">重試</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion indicator */}
      {ai.isComplete && !ai.error && (
        <div className="flex items-center gap-2 text-green-500/80 text-xs mt-2">
          <PixelIcon name="check" sizePreset="xs" variant="success" decorative />
          <span className="uppercase tracking-wider">牌陣解讀完成</span>
        </div>
      )}

      {/* Progress indicator */}
      {ai.isTyping && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-pip-boy-green/60 mb-1">
            <span className="uppercase tracking-wider">顯示進度</span>
            <span>{Math.round(ai.progress * 100)}%</span>
          </div>
          <div className="w-full h-1 bg-pip-boy-green/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-pip-boy-green transition-all duration-200"
              style={{ width: `${ai.progress * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// 🔧 FIX: Custom comparison function for React.memo
// Deep compare cardIds array to prevent re-render when content is same but reference changes
const arePropsEqual = (
  prevProps: MultiCardAIInterpretationProps,
  nextProps: MultiCardAIInterpretationProps
): boolean => {
  // Compare cardIds array by content, not reference
  if (prevProps.cardIds.length !== nextProps.cardIds.length) {
    console.log('[arePropsEqual] cardIds length changed:', prevProps.cardIds.length, '->', nextProps.cardIds.length);
    return false;
  }
  if (!prevProps.cardIds.every((id, index) => id === nextProps.cardIds[index])) {
    console.log('[arePropsEqual] cardIds content changed');
    return false;
  }

  // Compare other props (with logging for changes)
  if (prevProps.question !== nextProps.question) {
    console.log('[arePropsEqual] question changed');
    return false;
  }
  if (prevProps.characterVoice !== nextProps.characterVoice) {
    console.log('[arePropsEqual] characterVoice changed');
    return false;
  }
  if (prevProps.karmaAlignment !== nextProps.karmaAlignment) {
    console.log('[arePropsEqual] karmaAlignment changed');
    return false;
  }
  if (prevProps.factionAlignment !== nextProps.factionAlignment) {
    console.log('[arePropsEqual] factionAlignment changed');
    return false;
  }
  if (prevProps.spreadType !== nextProps.spreadType) {
    console.log('[arePropsEqual] spreadType changed');
    return false;
  }
  if (prevProps.apiUrl !== nextProps.apiUrl) {
    console.log('[arePropsEqual] apiUrl changed');
    return false;
  }
  if (prevProps.enabled !== nextProps.enabled) {
    console.log('[arePropsEqual] enabled changed:', prevProps.enabled, '->', nextProps.enabled);
    return false;
  }
  if (prevProps.charsPerSecond !== nextProps.charsPerSecond) {
    console.log('[arePropsEqual] charsPerSecond changed');
    return false;
  }
  if (prevProps.onFetchComplete !== nextProps.onFetchComplete) {
    console.log('[arePropsEqual] onFetchComplete changed');
    return false;
  }
  if (prevProps.onTypingComplete !== nextProps.onTypingComplete) {
    console.log('[arePropsEqual] onTypingComplete changed');
    return false;
  }
  if (prevProps.onError !== nextProps.onError) {
    console.log('[arePropsEqual] onError changed');
    return false;
  }

  console.log('[arePropsEqual] Props equal, skipping re-render');
  return true;
};

// 🔧 FIX: Export memoized component to prevent unnecessary re-renders
// React.memo with custom comparison ensures component only re-renders when props actually change
export const MultiCardAIInterpretation = React.memo(MultiCardAIInterpretationComponent, arePropsEqual);
