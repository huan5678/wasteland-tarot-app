/**
 * Web Speech API Utilities
 *
 * Fallback TTS using browser's built-in Web Speech API
 * Used when server-side TTS fails
 */

export interface SpeechOptions {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
  voice?: SpeechSynthesisVoice | null
}

/**
 * Check if Web Speech API is available
 */
export function isWebSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Get available voices (filters for Chinese voices)
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isWebSpeechAvailable()) return []

  const voices = window.speechSynthesis.getVoices()

  // Filter for Chinese (Taiwan) voices
  const chineseVoices = voices.filter((voice) =>
    voice.lang.includes('zh-TW') || voice.lang.includes('zh-CN') || voice.lang.includes('zh-HK')
  )

  return chineseVoices.length > 0 ? chineseVoices : voices
}

/**
 * Speak text using Web Speech API
 */
export function speak(
  text: string,
  options: SpeechOptions = {},
  callbacks?: {
    onStart?: () => void
    onEnd?: () => void
    onError?: (error: SpeechSynthesisErrorEvent) => void
    onPause?: () => void
    onResume?: () => void
  }
): SpeechSynthesisUtterance | null {
  if (!isWebSpeechAvailable()) {
    console.error('Web Speech API not available')
    return null
  }

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(text)

  // Apply options
  utterance.lang = options.lang || 'zh-TW'
  utterance.rate = options.rate !== undefined ? options.rate : 1.0
  utterance.pitch = options.pitch !== undefined ? options.pitch : 1.0
  utterance.volume = options.volume !== undefined ? options.volume : 1.0

  if (options.voice) {
    utterance.voice = options.voice
  } else {
    // Auto-select best Chinese voice
    const voices = getAvailableVoices()
    if (voices.length > 0) {
      utterance.voice = voices[0]
    }
  }

  // Attach event listeners
  if (callbacks?.onStart) {
    utterance.onstart = callbacks.onStart
  }

  if (callbacks?.onEnd) {
    utterance.onend = callbacks.onEnd
  }

  if (callbacks?.onError) {
    utterance.onerror = callbacks.onError
  }

  if (callbacks?.onPause) {
    utterance.onpause = callbacks.onPause
  }

  if (callbacks?.onResume) {
    utterance.onresume = callbacks.onResume
  }

  // Speak
  window.speechSynthesis.speak(utterance)

  return utterance
}

/**
 * Stop all speech
 */
export function stopSpeech(): void {
  if (isWebSpeechAvailable()) {
    window.speechSynthesis.cancel()
  }
}

/**
 * Pause speech
 */
export function pauseSpeech(): void {
  if (isWebSpeechAvailable()) {
    window.speechSynthesis.pause()
  }
}

/**
 * Resume speech
 */
export function resumeSpeech(): void {
  if (isWebSpeechAvailable()) {
    window.speechSynthesis.resume()
  }
}

/**
 * Check if currently speaking
 */
export function isSpeaking(): boolean {
  if (!isWebSpeechAvailable()) return false
  return window.speechSynthesis.speaking
}

/**
 * Check if speech is paused
 */
export function isPaused(): boolean {
  if (!isWebSpeechAvailable()) return false
  return window.speechSynthesis.paused
}
