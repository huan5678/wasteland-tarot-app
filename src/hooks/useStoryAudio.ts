/**
 * useStoryAudio Hook
 *
 * Manages story audio loading and generation
 * - Checks if audio URLs exist
 * - Triggers generation if needed
 * - Handles loading and error states
 * - Provides fallback to Web Speech API
 */

import { useState, useEffect, useCallback } from 'react'
import { generateStoryAudio, type GenerateStoryAudioResponse } from '@/lib/api'

interface UseStoryAudioOptions {
  cardId: string
  story?: {
    background: string
    [key: string]: any
  }
  initialAudioUrls?: Record<string, string>
  autoGenerate?: boolean
}

interface UseStoryAudioReturn {
  audioUrls: Record<string, string>
  isLoading: boolean
  error: string | null
  shouldUseFallback: boolean
  generateAudio: () => Promise<void>
  resetError: () => void
}

export function useStoryAudio({
  cardId,
  story,
  initialAudioUrls,
  autoGenerate = true,
}: UseStoryAudioOptions): UseStoryAudioReturn {
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>(initialAudioUrls || {})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shouldUseFallback, setShouldUseFallback] = useState(false)

  /**
   * Generate audio files for the story
   */
  const generateAudio = useCallback(async () => {
    if (!story) {
      setError('無故事內容')
      return
    }

    setIsLoading(true)
    setError(null)
    setShouldUseFallback(false)

    try {
      // Default character voices for story narration
      // 使用預設的角色語音：Pip-Boy（數據分析官）和避難所居民（天真探險家）
      const defaultCharacters = ['pip_boy', 'vault_dweller']

      // Call API to generate story audio
      const response: GenerateStoryAudioResponse = await generateStoryAudio(
        cardId,
        defaultCharacters
      )

      if (response.audioUrls && Object.keys(response.audioUrls).length > 0) {
        setAudioUrls(response.audioUrls)
      } else {
        // API response indicates fallback needed
        setShouldUseFallback(true)
        setError('伺服器音檔生成失敗，已切換至瀏覽器朗讀')
      }
    } catch (err) {
      console.error('Failed to generate audio:', err)
      setShouldUseFallback(true)
      setError('音檔生成失敗，已切換至瀏覽器朗讀')
    } finally {
      setIsLoading(false)
    }
  }, [cardId, story])

  /**
   * Reset error state
   */
  const resetError = useCallback(() => {
    setError(null)
    setShouldUseFallback(false)
  }, [])

  /**
   * Auto-generate audio if:
   * - autoGenerate is true
   * - story exists
   * - no audio URLs provided
   */
  useEffect(() => {
    if (autoGenerate && story && (!initialAudioUrls || Object.keys(initialAudioUrls).length === 0)) {
      generateAudio()
    }
  }, [autoGenerate, story, initialAudioUrls, generateAudio])

  return {
    audioUrls,
    isLoading,
    error,
    shouldUseFallback,
    generateAudio,
    resetError,
  }
}
