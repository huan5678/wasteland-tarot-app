/**
 * Global Speech Handler for Card Detail Modal
 * Provides consistent text-to-speech functionality across the application
 */

import { CHARACTER_VOICES } from '@/hooks/useTextToSpeech'

let currentUtterance: SpeechSynthesisUtterance | null = null
let speechSynthesis: SpeechSynthesis | null = null

// Initialize speech synthesis
export function initializeSpeechHandler() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this environment')
    return false
  }

  speechSynthesis = window.speechSynthesis

  // Global speech handler function
  ;(window as any).handleCardSpeech = async (text: string, characterVoice: string) => {
    try {
      // Stop any current speech
      stopCurrentSpeech()

      const voiceConfig = CHARACTER_VOICES[characterVoice.toLowerCase()]
      if (!voiceConfig) {
        console.warn(`Voice configuration not found for: ${characterVoice}`)
        return
      }

      // Get available voices
      const voices = speechSynthesis!.getVoices()
      let selectedVoice = voices.find(voice =>
        voice.name.toLowerCase().includes('david') ||
        voice.name.toLowerCase().includes('microsoft')
      )

      // Fallback to default voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.default) || voices[0]
      }

      if (!selectedVoice) {
        console.warn('No suitable voice found for speech synthesis')
        return
      }

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text)
      currentUtterance = utterance

      // Apply voice configuration
      utterance.voice = selectedVoice
      utterance.rate = voiceConfig.rate
      utterance.pitch = voiceConfig.pitch
      utterance.volume = voiceConfig.volume

      // Handle events
      utterance.onend = () => {
        currentUtterance = null
      }

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error)
        currentUtterance = null
      }

      // Speak the text
      speechSynthesis!.speak(utterance)

      console.log(`Speaking as ${characterVoice}:`, text.slice(0, 50) + '...')

    } catch (error) {
      console.error('Speech handler error:', error)
      currentUtterance = null
    }
  }

  // Global stop function
  ;(window as any).stopCardSpeech = stopCurrentSpeech

  return true
}

// Stop current speech
export function stopCurrentSpeech() {
  if (speechSynthesis) {
    speechSynthesis.cancel()
  }
  if (currentUtterance) {
    currentUtterance = null
  }
}

// Check if speech is currently playing
export function isSpeaking(): boolean {
  return speechSynthesis?.speaking || false
}

// Get available voices
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!speechSynthesis) return []
  return speechSynthesis.getVoices()
}

// Cleanup function for app unmount
export function cleanupSpeechHandler() {
  stopCurrentSpeech()

  if (typeof window !== 'undefined') {
    delete (window as any).handleCardSpeech
    delete (window as any).stopCardSpeech
  }
}

export default {
  initializeSpeechHandler,
  stopCurrentSpeech,
  isSpeaking,
  getAvailableVoices,
  cleanupSpeechHandler
}