/**
 * StoryAudioPlayer Component
 *
 * Audio player for Wasteland Tarot card story narration
 * Features:
 * - Play/pause control
 * - Progress tracking with timeline
 * - Click and drag timeline interaction
 * - Loading and error states
 * - Pip-Boy Green themed styling
 */

'use client'

import { useRef, useState, useEffect } from 'react'
import { PixelIcon } from '@/components/ui/icons'
import { speak, stopSpeech, pauseSpeech, resumeSpeech, isWebSpeechAvailable } from '@/lib/webSpeechApi'
import { analyzeWaveform, calculateBarCount, resampleWaveform, generateFallbackWaveform, type WaveformData } from '@/lib/audio/waveformAnalyzer'

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
  // Audio element reference
  const audioRef = useRef<HTMLAudioElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const waveformContainerRef = useRef<HTMLDivElement>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFallbackMode, setIsFallbackMode] = useState(useFallback)

  // Waveform state
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null)
  const [displayPeaks, setDisplayPeaks] = useState<number[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [wasPlayingBeforeDrag, setWasPlayingBeforeDrag] = useState(false)

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
   * Calculate progress percentage
   */
  const getProgressPercentage = (): number => {
    if (duration === 0) return 0
    return (currentTime / duration) * 100
  }

  /**
   * Toggle play/pause (supports both audio and Web Speech API)
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
        // Use audio element
        if (!audioRef.current) return

        if (isPlaying) {
          audioRef.current.pause()
          setIsPlaying(false)
        } else {
          await audioRef.current.play()
          setIsPlaying(true)
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

  /**
   * Handle waveform click
   */
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !waveformContainerRef.current || error || isFallbackMode) return

    const rect = waveformContainerRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration

    audioRef.current.currentTime = Math.max(0, Math.min(newTime, duration))
  }

  /**
   * Handle drag start
   */
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || error || isFallbackMode) return

    setIsDragging(true)
    setWasPlayingBeforeDrag(isPlaying)

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    }

    // Handle drag move and end
    const handleDragMove = (moveEvent: MouseEvent) => {
      if (!waveformContainerRef.current || !audioRef.current) return

      const rect = waveformContainerRef.current.getBoundingClientRect()
      const dragX = moveEvent.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, dragX / rect.width))
      const newTime = percentage * duration

      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }

    const handleDragEnd = async () => {
      setIsDragging(false)

      if (wasPlayingBeforeDrag && audioRef.current) {
        try {
          await audioRef.current.play()
          setIsPlaying(true)
        } catch (err) {
          console.error('恢復播放失敗:', err)
        }
      }

      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
    }

    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
  }

  /**
   * Handle playback end
   */
  const handlePlaybackEnd = () => {
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }

  /**
   * Handle audio error (with auto-fallback)
   */
  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audio = e.currentTarget
    let errorMessage = '播放失敗'

    if (audio.error) {
      switch (audio.error.code) {
        case 1: // MEDIA_ERR_ABORTED
          errorMessage = '播放被中止'
          break
        case 2: // MEDIA_ERR_NETWORK
          errorMessage = '網路錯誤'
          break
        case 3: // MEDIA_ERR_DECODE
          errorMessage = '解碼錯誤'
          break
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          errorMessage = '不支援的音訊格式'
          break
      }
    }

    // Auto-fallback to Web Speech API
    if (storyText && isWebSpeechAvailable() && !isFallbackMode) {
      setIsFallbackMode(true)
      setError('音檔載入失敗，已切換至瀏覽器朗讀')
    } else {
      setError(errorMessage)
    }

    setIsLoading(false)
    setIsPlaying(false)
  }

  /**
   * Handle time update
   */
  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  /**
   * Handle duration change
   */
  const handleDurationChange = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  /**
   * Handle load start
   */
  const handleLoadStart = () => {
    setIsLoading(true)
    setError(null)
  }

  /**
   * Handle can play
   */
  const handleCanPlay = () => {
    setIsLoading(false)
  }

  // Analyze waveform when audio URL changes (non-fallback mode only)
  useEffect(() => {
    if (isFallbackMode || !audioUrl) return

    let cancelled = false

    const analyze = async () => {
      setIsAnalyzing(true)
      setError(null)

      try {
        const data = await analyzeWaveform(audioUrl, {
          minBars: 50,
          maxBars: 200,
          barsPerSecond: 10,
        })

        if (!cancelled) {
          setWaveformData(data)
          // Initial display peaks (will be resampled on resize)
          setDisplayPeaks(data.peaks)
        }
      } catch (err) {
        console.error('波形分析失敗:', err)
        if (!cancelled) {
          // Use fallback waveform on error
          const fallbackPeaks = generateFallbackWaveform(100)
          setDisplayPeaks(fallbackPeaks)
        }
      } finally {
        if (!cancelled) {
          setIsAnalyzing(false)
        }
      }
    }

    analyze()

    return () => {
      cancelled = true
    }
  }, [audioUrl, isFallbackMode])

  // Generate fallback waveform for Web Speech API mode
  useEffect(() => {
    if (isFallbackMode && displayPeaks.length === 0) {
      setDisplayPeaks(generateFallbackWaveform(100))
    }
  }, [isFallbackMode, displayPeaks.length])

  // Responsive waveform: Resample based on container width
  useEffect(() => {
    if (!waveformContainerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        const optimalBarCount = calculateBarCount(width, 3, 2, 30, 200)

        // Resample waveform data if we have it
        if (waveformData && waveformData.peaks.length > 0) {
          const resampled = resampleWaveform(waveformData.peaks, optimalBarCount)
          setDisplayPeaks(resampled)
        } else if (displayPeaks.length > 0) {
          // Resample existing display peaks
          const resampled = resampleWaveform(displayPeaks, optimalBarCount)
          setDisplayPeaks(resampled)
        }
      }
    })

    resizeObserver.observe(waveformContainerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [waveformData, displayPeaks])

  // Update volume when prop changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume))
    }
  }, [volume])

  // Cleanup: Stop speech when component unmounts or fallback mode changes
  useEffect(() => {
    return () => {
      if (isFallbackMode && isPlaying) {
        stopSpeech()
      }
    }
  }, [isFallbackMode, isPlaying])

  return (
    <div className="w-full p-4 bg-zinc-900/50 rounded-lg border border-pip-boy-green/30">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onEnded={handlePlaybackEnd}
        onError={handleAudioError}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        preload="metadata"
      />

      {/* Character Name */}
      <div className="mb-3 text-sm text-pip-boy-green font-mono">
        {characterName}
      </div>

      {/* Controls Container */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          disabled={isLoading || !!error}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-pip-boy-green/20 border-2 border-pip-boy-green hover:bg-pip-boy-green/30 active:bg-pip-boy-green/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center group"
          aria-label={isPlaying ? '暫停' : '播放'}
        >
          {isLoading ? (
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
          <div
            ref={waveformContainerRef}
            role="slider"
            aria-label="音頻波形時間軸"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(getProgressPercentage())}
            tabIndex={0}
            className="relative h-16 bg-zinc-900/30 rounded cursor-pointer group"
            onClick={handleTimelineClick}
            onMouseDown={handleDragStart}
          >
            {/* Waveform Bars */}
            <div className="absolute inset-0 flex items-center justify-between px-1 gap-[2px]">
              {displayPeaks.length > 0 ? (
                displayPeaks.map((peak, index) => {
                  const progress = getProgressPercentage()
                  const barProgress = (index / displayPeaks.length) * 100
                  const isPlayed = barProgress <= progress

                  // Bar height based on peak value (10% to 100% of container)
                  const height = Math.max(10, peak * 100)

                  return (
                    <div
                      key={index}
                      className="flex-1 flex items-center justify-center transition-colors duration-150"
                    >
                      <div
                        className={`w-full rounded-sm transition-all ${
                          isPlayed
                            ? 'bg-pip-boy-green shadow-[0_0_4px_rgba(0,255,136,0.5)]'
                            : 'bg-zinc-700 group-hover:bg-zinc-600'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  )
                })
              ) : (
                // Loading placeholder
                <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600">
                  {isAnalyzing ? '分析波形中...' : '載入中...'}
                </div>
              )}
            </div>

            {/* Playhead Indicator */}
            {displayPeaks.length > 0 && (
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-pip-boy-green/80 shadow-[0_0_8px_rgba(0,255,136,0.8)] pointer-events-none"
                style={{ left: `${getProgressPercentage()}%` }}
              />
            )}
          </div>

          {/* Time Display */}
          <div className="flex justify-between text-xs text-pip-boy-green/70 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !error && (
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
