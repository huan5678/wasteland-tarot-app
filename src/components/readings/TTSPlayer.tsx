/**
 * TTS Player Component
 *
 * Text-to-Speech playback control UI for AI interpretations
 * Features Pip-Boy styled controls with play, pause, stop functionality
 *
 * Requirements: Requirement 2 (TTS Integration)
 * Task: 2.1 - Create TTS Player Component
 * Task 2.3 - Integrate useTTS hook for actual TTS functionality
 */

'use client';

import React from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { useTTS } from '@/hooks/useTTS';

export interface TTSPlayerProps {
  /** Full interpretation text to be read aloud */
  text: string;

  /** Auto-play when component mounts (default: check settings) */
  enabled?: boolean;

  /** Character voice for TTS (default: 'pip_boy') */
  characterVoice?: string;

  /** Callback when playback completes */
  onPlaybackComplete?: () => void;
}

/**
 * TTS Player Component
 *
 * Provides audio playback controls for text-to-speech synthesis
 * with Fallout Pip-Boy aesthetic styling
 *
 * @example
 * ```tsx
 * <TTSPlayer
 *   text="Your tarot interpretation..."
 *   enabled={true}
 *   characterVoice="pip_boy"
 *   onPlaybackComplete={() => console.log('Done')}
 * />
 * ```
 */
export function TTSPlayer({
  text,
  enabled = true,
  characterVoice = 'pip_boy',
  onPlaybackComplete
}: TTSPlayerProps) {
  // Task 2.3: Use useTTS hook for actual TTS functionality
  const tts = useTTS({
    text,
    voice: characterVoice,
    autoPlay: enabled,
    onPlaybackComplete,
  });

  // Destructure state from useTTS
  const { isLoading, isPlaying, isPaused, progress, duration, error, userFriendlyError } = tts;
  const { play, pause, resume, stop } = tts;

  // Format duration for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="tts-player-container relative border border-pip-boy-green/30 rounded-md p-4 bg-black/40"
      data-testid="tts-player"
      style={{
        boxShadow: '0 0 15px rgba(0, 255, 136, 0.2)',
        backdropFilter: 'blur(4px)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PixelIcon
            name="volume-up"
            variant="primary"
            sizePreset="sm"
            decorative
          />
          <h3 className="text-pip-boy-green text-sm font-bold tracking-wide">
            VOICE PLAYBACK
          </h3>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {isLoading && (
            <PixelIcon
              name="loader-4"
              animation="spin"
              variant="primary"
              sizePreset="xs"
              aria-label="載入中"
            />
          )}
          {isPlaying && !isPaused && (
            <div className="flex items-center gap-1">
              <span className="w-1 h-3 bg-pip-boy-green animate-pulse" />
              <span className="w-1 h-4 bg-pip-boy-green animate-pulse delay-75" />
              <span className="w-1 h-3 bg-pip-boy-green animate-pulse delay-150" />
            </div>
          )}
          {isPaused && (
            <PixelIcon
              name="pause"
              variant="warning"
              sizePreset="xs"
              aria-label="已暫停"
            />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div
          className="h-1 bg-pip-boy-green/20 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="播放進度"
        >
          <div
            className="h-full bg-pip-boy-green transition-all duration-300"
            style={{
              width: `${progress}%`,
              boxShadow: '0 0 10px rgba(0, 255, 136, 0.6)'
            }}
          />
        </div>

        {/* Time display */}
        <div className="flex justify-between mt-2 text-xs text-pip-boy-green/70">
          <span>{formatTime(duration * (progress / 100))}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-3">
        {/* Play/Pause button */}
        {!isPlaying || isPaused ? (
          <button
            onClick={isPaused ? resume : play}
            disabled={isLoading || !!error}
            className="
              flex items-center justify-center
              w-12 h-12 rounded-md
              bg-pip-boy-green/10 border-2 border-pip-boy-green
              hover:bg-pip-boy-green/20 active:bg-pip-boy-green/30
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
            style={{
              boxShadow: '0 0 10px rgba(0, 255, 136, 0.3)'
            }}
            aria-label={isPaused ? "繼續播放" : "開始播放"}
          >
            <PixelIcon
              name={isPaused ? "play" : "play"}
              variant="primary"
              sizePreset="sm"
              decorative
            />
          </button>
        ) : (
          <button
            onClick={pause}
            className="
              flex items-center justify-center
              w-12 h-12 rounded-md
              bg-pip-boy-green/10 border-2 border-pip-boy-green
              hover:bg-pip-boy-green/20 active:bg-pip-boy-green/30
              transition-all duration-200
            "
            style={{
              boxShadow: '0 0 10px rgba(0, 255, 136, 0.3)'
            }}
            aria-label="暫停播放"
          >
            <PixelIcon
              name="pause"
              variant="primary"
              sizePreset="sm"
              decorative
            />
          </button>
        )}

        {/* Stop button */}
        <button
          onClick={stop}
          disabled={!isPlaying && !isPaused}
          className="
            flex items-center justify-center
            w-10 h-10 rounded-md
            bg-red-900/10 border border-red-600/50
            hover:bg-red-900/20 active:bg-red-900/30
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-200
          "
          aria-label="停止播放"
        >
          <PixelIcon
            name="stop"
            variant="error"
            sizePreset="xs"
            decorative
          />
        </button>
      </div>

      {/* Loading state overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/60 rounded-md flex items-center justify-center">
          <div className="text-center">
            <PixelIcon
              name="loader-4"
              animation="spin"
              variant="primary"
              sizePreset="lg"
              decorative
            />
            <p className="text-pip-boy-green/80 text-xs mt-2">
              Generating audio...
            </p>
          </div>
        </div>
      )}

      {/* Task 2.3: Graceful degradation - Error display (doesn't block text display) */}
      {error && userFriendlyError && (
        <div className="absolute inset-0 bg-black/80 rounded-md flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <PixelIcon
              name="alert-triangle"
              variant="warning"
              sizePreset="lg"
              animation="wiggle"
              aria-label="錯誤"
            />
            <p className="text-amber-400 text-sm mt-3 mb-2">
              語音播放失敗
            </p>
            <p className="text-gray-300 text-xs mb-4">
              {userFriendlyError}
            </p>
            <button
              onClick={play}
              className="
                px-4 py-2 text-xs
                bg-pip-boy-green/10 border border-pip-boy-green
                rounded-md
                hover:bg-pip-boy-green/20
                transition-colors duration-200
              "
            >
              重試
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
