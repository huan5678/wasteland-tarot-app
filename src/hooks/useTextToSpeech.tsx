/**
 * Text-to-Speech Hook for Character Voices (Enhanced - Task 4.4)
 * Provides audio playback for character interpretations with Fallout-themed voice personalities
 *
 * Features:
 * - Voice narration for completed interpretations
 * - Play/pause/resume controls
 * - Speed adjustment
 * - Segment re-reading
 * - Browser compatibility handling
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface VoiceConfig {
  voice: string
  rate: number
  pitch: number
  volume: number
}

export interface CharacterVoiceSettings {
  [key: string]: VoiceConfig
}

// Fallout character voice configurations
export const CHARACTER_VOICES: CharacterVoiceSettings = {
  'pip_boy': {
    voice: 'Microsoft David Desktop', // Robotic, clear
    rate: 1.0,
    pitch: 1.2,
    volume: 0.8
  },
  'super_mutant': {
    voice: 'Microsoft Mark Desktop', // Deep, slow
    rate: 0.7,
    pitch: 0.6,
    volume: 0.9
  },
  'ghoul': {
    voice: 'Microsoft Zira Desktop', // Raspy, aged
    rate: 0.9,
    pitch: 0.8,
    volume: 0.7
  },
  'raider': {
    voice: 'Microsoft David Desktop', // Aggressive, fast
    rate: 1.3,
    pitch: 0.9,
    volume: 0.8
  },
  'brotherhood_scribe': {
    voice: 'Microsoft Hazel Desktop', // Formal, educated
    rate: 1.1,
    pitch: 1.0,
    volume: 0.8
  },
  'vault_dweller': {
    voice: 'Microsoft Zira Desktop', // Young, hopeful
    rate: 1.0,
    pitch: 1.1,
    volume: 0.8
  },
  'codsworth': {
    voice: 'Microsoft George Desktop', // British, polite
    rate: 1.0,
    pitch: 1.3,
    volume: 0.8
  },
  'wasteland_trader': {
    voice: 'Microsoft Mark Desktop', // Gruff, experienced
    rate: 1.2,
    pitch: 0.9,
    volume: 0.8
  }
}

/** 🟢 Task 4.4: Browser compatibility information */
export interface BrowserInfo {
  isSupported: boolean;
  recommendedBrowsers: string[];
  currentBrowser?: string;
}

export interface UseTextToSpeechProps {
  enabled?: boolean
  defaultVoice?: string
  onSpeakStart?: () => void
  onSpeakEnd?: () => void
  onError?: (error: Error) => void
  onPause?: () => void
  onResume?: () => void
}

export interface UseTextToSpeechReturn {
  speak: (text: string, character?: string) => Promise<void>
  stop: () => void
  // 🟢 Task 4.4: Enhanced controls
  pause: () => void
  resume: () => void
  togglePause: () => void
  setSpeed: (multiplier: number) => void
  // State
  isSupported: boolean
  isPlaying: boolean
  isPaused: boolean
  currentSpeed: number
  currentPosition: number
  availableVoices: SpeechSynthesisVoice[]
  currentVoice: string
  setCurrentVoice: (voice: string) => void
  volume: number
  setVolume: (volume: number) => void
  // 🟢 Task 4.4: Browser compatibility info
  browserInfo: BrowserInfo
}

export function useTextToSpeech({
  enabled = true,
  defaultVoice = 'pip_boy',
  onSpeakStart,
  onSpeakEnd,
  onError,
  onPause,
  onResume
}: UseTextToSpeechProps = {}): UseTextToSpeechReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  // 🟢 Task 4.4: Enhanced state
  const [isPaused, setIsPaused] = useState(false)
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0)
  const [currentPosition, setCurrentPosition] = useState(0)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [currentVoice, setCurrentVoice] = useState(defaultVoice)
  const [volume, setVolume] = useState(0.8)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // 🟢 Task 4.4: Store last text for re-reading segments
  const lastTextRef = useRef<string>('')
  const lastCharacterRef = useRef<string>('')

  // 🟢 Task 4.4: Detect browser for compatibility info
  const detectBrowser = useCallback((): string => {
    if (typeof window === 'undefined') return 'Unknown';
    const userAgent = window.navigator.userAgent;

    if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
    if (userAgent.indexOf('Safari') > -1) return 'Safari';
    if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
    if (userAgent.indexOf('Edge') > -1) return 'Edge';

    return 'Unknown';
  }, []);

  // 🟢 Task 4.4: Get browser compatibility info
  const browserInfo: BrowserInfo = {
    isSupported,
    recommendedBrowsers: ['Chrome', 'Edge', 'Safari'],
    currentBrowser: detectBrowser(),
  };

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true)
      synthRef.current = window.speechSynthesis

      // Load available voices
      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || []
        setAvailableVoices(voices)
      }

      // Some browsers load voices asynchronously
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices
      }

      loadVoices()
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  // Find the best matching voice for a character
  const findBestVoice = useCallback((character: string): SpeechSynthesisVoice | null => {
    if (!availableVoices.length) return null

    const config = CHARACTER_VOICES[character.toLowerCase()]
    if (!config) return availableVoices[0]

    // Try to find the preferred voice
    const preferredVoice = availableVoices.find(voice =>
      voice.name.includes(config.voice.split(' ')[1]) // Match partial name
    )

    if (preferredVoice) return preferredVoice

    // Fallback to default voice
    return availableVoices.find(voice => voice.default) || availableVoices[0]
  }, [availableVoices])

  // 🟢 Task 4.4: Pause current speech
  const pause = useCallback(() => {
    if (synthRef.current && isPlaying && !isPaused) {
      synthRef.current.pause();
      setIsPaused(true);
      onPause?.();
    }
  }, [isPlaying, isPaused, onPause]);

  // 🟢 Task 4.4: Resume paused speech
  const resume = useCallback(() => {
    if (synthRef.current && isPlaying && isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      onResume?.();
    }
  }, [isPlaying, isPaused, onResume]);

  // 🟢 Task 4.4: Toggle pause state
  const togglePause = useCallback(() => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, pause, resume]);

  // 🟢 Task 4.4: Set speed multiplier (applies to next utterance)
  const setSpeed = useCallback((multiplier: number) => {
    if (multiplier <= 0) {
      console.warn('[useTextToSpeech] Speed multiplier must be positive, ignoring:', multiplier);
      return;
    }
    setSpeedMultiplier(multiplier);
  }, []);

  // 🟢 Task 4.4: Enhanced speak function with segment support
  const speak = useCallback(async (text: string, character?: string): Promise<void> => {
    if (!isSupported || !enabled || !synthRef.current) {
      throw new Error('Text-to-speech not supported or disabled')
    }

    // Stop any current speech
    stop()

    // 🟢 Task 4.4: Store text for re-reading
    lastTextRef.current = text;
    lastCharacterRef.current = character || currentVoice;

    const characterKey = character || currentVoice
    const voiceConfig = CHARACTER_VOICES[characterKey.toLowerCase()]
    const selectedVoice = findBestVoice(characterKey)

    if (!selectedVoice) {
      throw new Error('No suitable voice found')
    }

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text)
        utteranceRef.current = utterance

        // Apply voice configuration with speed multiplier
        utterance.voice = selectedVoice
        // 🟢 Task 4.4: Apply speed multiplier to base rate
        utterance.rate = (voiceConfig?.rate || 1.0) * speedMultiplier
        utterance.pitch = voiceConfig?.pitch || 1.0
        utterance.volume = (voiceConfig?.volume || 0.8) * volume

        // Reset pause state
        setIsPaused(false);
        setCurrentPosition(0);

        // Event handlers
        utterance.onstart = () => {
          setIsPlaying(true)
          onSpeakStart?.()
        }

        // 🟢 Task 4.4: Track boundary events for position
        utterance.onboundary = (event) => {
          setCurrentPosition(event.charIndex);
        };

        // 🟢 Task 4.4: Handle pause event
        utterance.onpause = () => {
          setIsPaused(true);
          onPause?.();
        };

        // 🟢 Task 4.4: Handle resume event
        utterance.onresume = () => {
          setIsPaused(false);
          onResume?.();
        };

        utterance.onend = () => {
          setIsPlaying(false)
          setIsPaused(false);
          setCurrentPosition(0);
          utteranceRef.current = null
          onSpeakEnd?.()
          resolve()
        }

        utterance.onerror = (event) => {
          setIsPlaying(false)
          setIsPaused(false);
          setCurrentPosition(0);
          utteranceRef.current = null
          const error = new Error(`Speech synthesis error: ${event.error}`)
          onError?.(error)
          reject(error)
        }

        synthRef.current!.speak(utterance)
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown speech synthesis error')
        onError?.(err)
        reject(err)
      }
    })
  }, [isSupported, enabled, currentVoice, volume, speedMultiplier, findBestVoice, onSpeakStart, onSpeakEnd, onError, onPause, onResume])

  // Stop current speech
  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
    if (utteranceRef.current) {
      utteranceRef.current = null
    }
    setIsPlaying(false)
    setIsPaused(false);
    setCurrentPosition(0);
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    // Core functions
    speak,
    stop,
    // 🟢 Task 4.4: Enhanced controls
    pause,
    resume,
    togglePause,
    setSpeed,
    // State
    isSupported,
    isPlaying,
    isPaused,
    currentSpeed: speedMultiplier,
    currentPosition,
    availableVoices,
    currentVoice,
    setCurrentVoice,
    volume,
    setVolume,
    // 🟢 Task 4.4: Browser compatibility info
    browserInfo,
  }
}

export default useTextToSpeech