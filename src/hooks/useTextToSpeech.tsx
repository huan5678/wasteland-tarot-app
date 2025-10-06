/**
 * Text-to-Speech Hook for Character Voices
 * Provides audio playback for character interpretations with Fallout-themed voice personalities
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

export interface UseTextToSpeechProps {
  enabled?: boolean
  defaultVoice?: string
  onSpeakStart?: () => void
  onSpeakEnd?: () => void
  onError?: (error: Error) => void
}

export interface UseTextToSpeechReturn {
  speak: (text: string, character?: string) => Promise<void>
  stop: () => void
  isSupported: boolean
  isPlaying: boolean
  availableVoices: SpeechSynthesisVoice[]
  currentVoice: string
  setCurrentVoice: (voice: string) => void
  volume: number
  setVolume: (volume: number) => void
}

export function useTextToSpeech({
  enabled = true,
  defaultVoice = 'pip_boy',
  onSpeakStart,
  onSpeakEnd,
  onError
}: UseTextToSpeechProps = {}): UseTextToSpeechReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [currentVoice, setCurrentVoice] = useState(defaultVoice)
  const [volume, setVolume] = useState(0.8)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

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

  // Speak text with character voice
  const speak = useCallback(async (text: string, character?: string): Promise<void> => {
    if (!isSupported || !enabled || !synthRef.current) {
      throw new Error('Text-to-speech not supported or disabled')
    }

    // Stop any current speech
    stop()

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

        // Apply voice configuration
        utterance.voice = selectedVoice
        utterance.rate = voiceConfig?.rate || 1.0
        utterance.pitch = voiceConfig?.pitch || 1.0
        utterance.volume = (voiceConfig?.volume || 0.8) * volume

        // Event handlers
        utterance.onstart = () => {
          setIsPlaying(true)
          onSpeakStart?.()
        }

        utterance.onend = () => {
          setIsPlaying(false)
          utteranceRef.current = null
          onSpeakEnd?.()
          resolve()
        }

        utterance.onerror = (event) => {
          setIsPlaying(false)
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
  }, [isSupported, enabled, currentVoice, volume, findBestVoice, onSpeakStart, onSpeakEnd, onError])

  // Stop current speech
  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
    if (utteranceRef.current) {
      utteranceRef.current = null
    }
    setIsPlaying(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    speak,
    stop,
    isSupported,
    isPlaying,
    availableVoices,
    currentVoice,
    setCurrentVoice,
    volume,
    setVolume
  }
}

export default useTextToSpeech