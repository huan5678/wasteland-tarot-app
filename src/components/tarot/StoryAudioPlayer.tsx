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

'use client'

import { useState, useRef, useEffect } from 'react'
import { useWavesurfer } from '@wavesurfer/react'
import type WaveSurfer from 'wavesurfer.js'
import { PixelIcon } from '@/components/ui/icons'
import { speak, stopSpeech, pauseSpeech, resumeSpeech, isWebSpeechAvailable } from '@/lib/webSpeechApi'

interface StoryAudioPlayerProps {
  /** URL of the audio file */
  audioUrl: string
  /** Display name of the character voice */
  characterName: string
  /** Character key for tracking */
  characterKey: string
  /** Optional volume (0.0 to 1.0) */
  volume?: number
  /** Story text for Web Speech API fallback */
  storyText?: string
  /** Force use of Web Speech API fallback */
  useFallback?: boolean
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
  useFallback = false,
}: StoryAudioPlayerProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Playback state
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFallbackMode, setIsFallbackMode] = useState(useFallback)

  // Wavesurfer hook
  const { wavesurfer, isReady, isPlaying, currentTime: wsCurrentTime } = useWavesurfer({
    container: containerRef,
    url: isFallbackMode ? '' : audioUrl,
    height: 60,
    waveColor: '#1a3a2e',  // Solid dark green (no transparency!)
    progressColor: '#00ff88',
    cursorColor: 'transparent',
    cursorWidth: 1,
    barWidth: 3,
    barGap: 2,
    barRadius: 3,
    barMinHeight: 1,
    normalize: true,
    hideScrollbar: true,
  })

  /**
   * Format seconds to MM:SS
   */
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Toggle play/pause (supports both wavesurfer and Web Speech API)
   */
  const togglePlayPause = async () => {
    if (error && !isFallbackMode) return

    try {
      if (isFallbackMode) {
        // Use Web Speech API
        if (!storyText) {
          setError('無故事文字可朗讀')
          return
        }

        if (!isWebSpeechAvailable()) {
          setError('瀏覽器不支援語音朗讀')
          return
        }

        if (isPlaying) {
          pauseSpeech()
          setIsPlaying(false)
        } else {
          if (!utteranceRef.current) {
            // Create new utterance
            const utterance = speak(storyText, { volume }, {
              onStart: () => setIsPlaying(true),
              onEnd: () => {
                setIsPlaying(false)
                setCurrentTime(0)
              },
              onError: (error) => {
                console.error('Web Speech API error:', error)
                setError('瀏覽器朗讀失敗')
                setIsPlaying(false)
              }
            })
            utteranceRef.current = utterance
          } else {
            resumeSpeech()
            setIsPlaying(true)
          }
        }
      } else {
        // Use wavesurfer
        if (wavesurfer) {
          wavesurfer.playPause()
        }
      }
    } catch (err) {
      console.error('播放失敗:', err)

      // Auto-fallback to Web Speech API on audio error
      if (!isFallbackMode && storyText && isWebSpeechAvailable()) {
        setIsFallbackMode(true)
        setError('音檔播放失敗，已切換至瀏覽器朗讀')
      } else {
        setError('播放失敗')
      }
    }
  }

  // Update current time from wavesurfer
  useEffect(() => {
    if (wsCurrentTime !== undefined) {
      setCurrentTime(wsCurrentTime)
    }
  }, [wsCurrentTime])

  // Update duration when wavesurfer is ready
  useEffect(() => {
    if (wavesurfer && isReady) {
      setDuration(wavesurfer.getDuration())
      wavesurfer.setVolume(volume)
    }
  }, [wavesurfer, isReady, volume])

  // Update volume when prop changes
  useEffect(() => {
    if (wavesurfer) {
      wavesurfer.setVolume(Math.max(0, Math.min(1, volume)))
    }
  }, [volume, wavesurfer])

  // Handle wavesurfer errors
  useEffect(() => {
    if (!wavesurfer) return

    const handleError = () => {
      console.error('Wavesurfer error')
      // Auto-fallback to Web Speech API
      if (storyText && isWebSpeechAvailable() && !isFallbackMode) {
        setIsFallbackMode(true)
        setError('音檔載入失敗，已切換至瀏覽器朗讀')
      } else {
        setError('播放失敗')
      }
    }

    wavesurfer.on('error', handleError)

    return () => {
      wavesurfer.un('error', handleError)
    }
  }, [wavesurfer, storyText, isFallbackMode])

  // Cleanup: Stop speech when component unmounts or fallback mode changes
  useEffect(() => {
    return () => {
      if (isFallbackMode && isPlaying) {
        stopSpeech()
      }
    }
  }, [isFallbackMode, isPlaying])

  return (
    <div className="w-full">
      {/* Controls Container */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          disabled={(!isReady && !isFallbackMode) || (!!error && !isFallbackMode)}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-pip-boy-green/20 border-2 border-pip-boy-green hover:bg-pip-boy-green/30 active:bg-pip-boy-green/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center group"
          aria-label={isPlaying ? '暫停' : '播放'}
        >
          {!isReady && !isFallbackMode ? (
            <PixelIcon
              name="loader"
              sizePreset="sm"
              variant="primary"
              animation="spin"
              decorative
            />
          ) : (
            <PixelIcon
              name={isPlaying ? 'pause' : 'play'}
              sizePreset="sm"
              variant="primary"
              decorative
            />
          )}
        </button>

        {/* Waveform and Time Display */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Waveform Visualization */}
          {!isFallbackMode ? (
            <div
              ref={containerRef}
              className="relative h-[60px] rounded-lg overflow-hidden"
            />
          ) : (
            /* Fallback mode: Simple progress bar */
            <div className="relative h-20 bg-zinc-900/30 rounded-lg flex items-center justify-center">
              <div className="text-xs text-pip-boy-green/70">
                瀏覽器朗讀模式
              </div>
            </div>
          )}

          {/* Time Display */}
          <div className="flex justify-between text-xs text-pip-boy-green/70 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {!isReady && !isFallbackMode && !error && (
        <div className="mt-2 text-xs text-pip-boy-green/70 flex items-center gap-2">
          <PixelIcon name="loader" sizePreset="xs" animation="spin" decorative />
          <span>載入中...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-2 p-2 bg-red-900/20 border border-red-500/50 rounded text-xs text-red-400 flex items-center gap-2">
          <PixelIcon name="alert-triangle" sizePreset="xs" variant="error" decorative />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
