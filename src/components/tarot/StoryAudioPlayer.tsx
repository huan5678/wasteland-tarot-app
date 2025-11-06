/**
 * StoryAudioPlayer Component
 *
 * Audio player for Wasteland Tarot card story narration
 * Features:
 * - Play/pause control
 * - Real-time waveform visualization (using wavesurfer.js)
 * - Progress tracking with timeline
 * - Click and drag timeline interaction
 * - Loading and error states
 * - Pip-Boy Green themed styling
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import type WaveSurfer from 'wavesurfer.js';
import { PixelIcon } from '@/components/ui/icons';
import { speak, stopSpeech, pauseSpeech, resumeSpeech, isWebSpeechAvailable } from '@/lib/webSpeechApi';import { Button } from "@/components/ui/button";

interface StoryAudioPlayerProps {
  /** URL of the audio file */
  audioUrl: string;
  /** Display name of the character voice */
  characterName: string;
  /** Character key for tracking */
  characterKey: string;
  /** Optional volume (0.0 to 1.0) */
  volume?: number;
  /** Story text for Web Speech API fallback */
  storyText?: string;
  /** Force use of Web Speech API fallback */
  useFallback?: boolean;
}

/**
 * StoryAudioPlayer - Audio playback component for card stories
 */
export default function StoryAudioPlayer({
  audioUrl,
  characterName,
  characterKey,
  volume = 1.0,
  storyText,
  useFallback = false
}: StoryAudioPlayerProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(useFallback);
  const [isSpeaking, setIsSpeaking] = useState(false); // For Web Speech API
  const [isPausingRef] = useState({ current: false }); // Track if we're pausing (to ignore pause errors)

  // Wavesurfer hook
  const { wavesurfer, isReady, isPlaying: wsIsPlaying, currentTime: wsCurrentTime } = useWavesurfer({
    container: containerRef,
    url: isFallbackMode ? '' : audioUrl,
    height: 60,
    waveColor: '#1a3a2e', // Solid dark green (no transparency!)
    progressColor: '#00ff88',
    cursorColor: 'transparent',
    cursorWidth: 1,
    barWidth: 3,
    barGap: 2,
    barRadius: 3,
    barMinHeight: 1,
    normalize: true,
    hideScrollbar: true
  });

  // Computed playing state: use isSpeaking in fallback mode, wsIsPlaying otherwise
  const isPlaying = isFallbackMode ? isSpeaking : wsIsPlaying;

  /**
   * Format seconds to MM:SS
   */
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Estimate speech duration based on text length
   * Chinese: ~175 characters/minute at rate=1.0
   */
  const estimateDuration = (text: string, rate: number = 1.0): number => {
    const charCount = text.length;
    const secondsPerChar = 0.34; // ~175 chars/min = 0.34s/char
    return charCount * secondsPerChar / rate;
  };

  /**
   * Start progress tracking for Web Speech API
   */
  const startProgressTracking = (estimatedDuration: number) => {
    setCurrentTime(0);
    setDuration(estimatedDuration);

    // Update progress every 100ms
    progressIntervalRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.1;
        if (next >= estimatedDuration) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          return estimatedDuration;
        }
        return next;
      });
    }, 100);
  };

  /**
   * Stop progress tracking
   */
  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  /**
   * Toggle play/pause (supports both wavesurfer and Web Speech API)
   */
  const togglePlayPause = async () => {
    if (error && !isFallbackMode) return;

    try {
      if (isFallbackMode) {
        // Use Web Speech API
        if (!storyText) {
          setError('無故事文字可朗讀');
          return;
        }

        if (!isWebSpeechAvailable()) {
          setError('瀏覽器不支援語音朗讀');
          return;
        }

        if (isPlaying) {
          // Pause
          isPausingRef.current = true;
          pauseSpeech();
          stopProgressTracking();
          setIsSpeaking(false);
          // Reset pause flag after a short delay
          setTimeout(() => {isPausingRef.current = false;}, 100);
        } else {
          if (!utteranceRef.current) {
            // Create new utterance
            const estimatedDuration = estimateDuration(storyText);

            const utterance = speak(storyText, { volume }, {
              onStart: () => {
                setIsSpeaking(true);
                startProgressTracking(estimatedDuration);
              },
              onEnd: () => {
                setIsSpeaking(false);
                stopProgressTracking();
                setCurrentTime(0);
              },
              onError: (error) => {
                // Ignore errors caused by pause operation (known browser bug)
                if (isPausingRef.current) {
                  console.warn('Ignoring pause-related error:', error);
                  return;
                }
                console.error('Web Speech API error:', error);
                setError('瀏覽器朗讀失敗');
                setIsSpeaking(false);
                stopProgressTracking();
              },
              onPause: () => {
                stopProgressTracking();
              },
              onResume: () => {
                startProgressTracking(estimatedDuration - currentTime);
              }
            });
            utteranceRef.current = utterance;
          } else {
            // Resume
            const remainingDuration = duration - currentTime;
            resumeSpeech();
            setIsSpeaking(true);
            startProgressTracking(remainingDuration);
          }
        }
      } else {
        // Use wavesurfer
        if (wavesurfer) {
          wavesurfer.playPause();
        }
      }
    } catch (err) {
      console.error('播放失敗:', err);

      // Auto-fallback to Web Speech API on audio error
      if (!isFallbackMode && storyText && isWebSpeechAvailable()) {
        setIsFallbackMode(true);
        setError('音檔播放失敗，已切換至瀏覽器朗讀');
      } else {
        setError('播放失敗');
      }
    }
  };

  // Update current time from wavesurfer
  useEffect(() => {
    if (wsCurrentTime !== undefined) {
      setCurrentTime(wsCurrentTime);
    }
  }, [wsCurrentTime]);

  // Update duration when wavesurfer is ready
  useEffect(() => {
    if (wavesurfer && isReady) {
      setDuration(wavesurfer.getDuration());
      wavesurfer.setVolume(volume);
    }
  }, [wavesurfer, isReady, volume]);

  // Update volume when prop changes
  useEffect(() => {
    if (wavesurfer) {
      wavesurfer.setVolume(Math.max(0, Math.min(1, volume)));
    }
  }, [volume, wavesurfer]);

  // Handle wavesurfer errors
  useEffect(() => {
    if (!wavesurfer) return;

    const handleError = () => {
      console.error('Wavesurfer error');
      // Auto-fallback to Web Speech API
      if (storyText && isWebSpeechAvailable() && !isFallbackMode) {
        setIsFallbackMode(true);
        setError('音檔載入失敗，已切換至瀏覽器朗讀');
      } else {
        setError('播放失敗');
      }
    };

    wavesurfer.on('error', handleError);

    return () => {
      wavesurfer.un('error', handleError);
    };
  }, [wavesurfer, storyText, isFallbackMode]);

  // Cleanup: Stop speech and progress tracking when component unmounts
  useEffect(() => {
    return () => {
      if (isFallbackMode && isSpeaking) {
        stopSpeech();
      }
      stopProgressTracking();
    };
  }, [isFallbackMode, isSpeaking]);

  return (
    <div className="w-full">
      {/* Controls Container */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <Button size="icon" variant="outline"
        onClick={togglePlayPause}
        disabled={!isReady && !isFallbackMode || !!error && !isFallbackMode}
        className="flex-shrink-0 w-12 h-12 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center group"
        aria-label={isPlaying ? '暫停' : '播放'}>

          {!isReady && !isFallbackMode ?
          <PixelIcon
            name="loader"
            sizePreset="sm"
            variant="primary"
            animation="spin"
            decorative /> :


          <PixelIcon
            name={isPlaying ? 'pause' : 'play'}
            sizePreset="sm"
            variant="primary"
            decorative />

          }
        </Button>

        {/* Waveform and Time Display */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Waveform Visualization */}
          {!isFallbackMode ?
          <div
            ref={containerRef}
            className="relative h-[60px] rounded-lg overflow-hidden" /> : (


          /* Fallback mode: Progress bar */
          <div className="relative h-[60px] bg-zinc-900/30 rounded-lg overflow-hidden">
              {/* Progress fill */}
              <div
              className="absolute inset-0 bg-pip-boy-green/20 transition-all duration-100"
              style={{
                width: duration > 0 ? `${currentTime / duration * 100}%` : '0%'
              }} />

              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-xs text-pip-boy-green/70 font-mono">
                  瀏覽器朗讀模式
                </div>
              </div>
            </div>)
          }

          {/* Time Display */}
          <div className="flex justify-between text-xs text-pip-boy-green/70 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {!isReady && !isFallbackMode && !error &&
      <div className="mt-2 text-xs text-pip-boy-green/70 flex items-center gap-2">
          <PixelIcon name="loader" sizePreset="xs" animation="spin" decorative />
          <span>載入中...</span>
        </div>
      }

      {/* Error State */}
      {error &&
      <div className="mt-2 p-2 bg-red-900/20 border border-red-500/50 rounded text-xs text-red-400 flex items-center gap-2">
          <PixelIcon name="alert-triangle" sizePreset="xs" variant="error" decorative />
          <span>{error}</span>
        </div>
      }
    </div>);

}