/**
 * User Preferences Hook
 * React hook for managing user preferences (cookie-based auth)
 */

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/authStore'

interface UserPreferences {
  // Reading settings
  default_character_voice: string
  auto_save_readings: boolean
  share_readings_publicly: boolean
  favorite_spread_types: string[]
  reading_reminder_time: string | null
  notification_frequency: string

  // UI Preferences (kept for backward compatibility)
  theme: string
  pip_boy_color: string
  terminal_effects: boolean
  sound_effects: boolean
  background_music: boolean
  preferred_card_back: string

  // Audio settings
  geiger_counter_volume: number
  background_radiation_level: number
  voice_volume: number
  ambient_volume: number

  // Privacy settings
  public_profile: boolean
  allow_friend_requests: boolean
  share_reading_history: boolean
  data_collection_consent: boolean

  // Notification settings
  email_notifications: boolean
  daily_reading_reminder: boolean
  friend_activity_notifications: boolean
  community_updates: boolean

  // Accessibility
  high_contrast_mode: boolean
  large_text_mode: boolean
  screen_reader_mode: boolean
  reduced_motion: boolean
}

export function usePreferences() {
  const user = useAuthStore(s => s.user)
  const isAuthenticated = !!user // user 存在就是已認證
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log('[usePreferences] Hook initialized, user:', user?.email, 'isAuthenticated:', isAuthenticated)

  // Fetch preferences
  const fetchPreferences = async () => {
    if (!isAuthenticated) {
      console.log('[usePreferences] Not authenticated, skipping fetch')
      return
    }

    console.log('[usePreferences] Fetching preferences...')
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/preferences/', {
        credentials: 'include' // Send httpOnly cookies
      })

      console.log('[usePreferences] Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('[usePreferences] Preferences loaded:', data.preferences)
        setPreferences(data.preferences)
      } else {
        console.error('[usePreferences] Failed to fetch:', response.status)
        setError('Failed to fetch preferences')
      }
    } catch (err) {
      setError('Network error')
      console.error('[usePreferences] Error fetching preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  // Update reading settings
  const updateReadingSettings = async (settings: {
    default_spread_type?: string
    auto_save_readings?: boolean
    show_card_meanings?: boolean
    show_keywords?: boolean
    card_flip_animation_speed?: number
  }) => {
    if (!isAuthenticated) return false

    try {
      const response = await fetch('/api/v1/preferences/reading', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
        return true
      }
      return false
    } catch (err) {
      console.error('Error updating reading settings:', err)
      return false
    }
  }

  // Update interpretation settings
  const updateInterpretationSettings = async (settings: {
    depth?: string
    style?: string
    preferred_character_voice?: string
    ai_provider_preference?: string
  }) => {
    if (!isAuthenticated) return false

    try {
      const response = await fetch('/api/v1/preferences/interpretation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
        return true
      }
      return false
    } catch (err) {
      console.error('Error updating interpretation settings:', err)
      return false
    }
  }

  // Update notification settings
  const updateNotificationSettings = async (settings: {
    enable_email_notifications?: boolean
    enable_reading_reminders?: boolean
    reminder_time?: string
    reminder_days?: string[]
  }) => {
    if (!isAuthenticated) return false

    try {
      const response = await fetch('/api/v1/preferences/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
        return true
      }
      return false
    } catch (err) {
      console.error('Error updating notification settings:', err)
      return false
    }
  }

  // Update privacy settings
  const updatePrivacySettings = async (settings: {
    profile_visibility?: string
    allow_reading_sharing?: boolean
    anonymous_analytics?: boolean
  }) => {
    if (!isAuthenticated) return false

    try {
      const response = await fetch('/api/v1/preferences/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
        return true
      }
      return false
    } catch (err) {
      console.error('Error updating privacy settings:', err)
      return false
    }
  }

  // Reset preferences
  const resetPreferences = async () => {
    if (!isAuthenticated) return false

    try {
      const response = await fetch('/api/v1/preferences/reset', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
        return true
      }
      return false
    } catch (err) {
      console.error('Error resetting preferences:', err)
      return false
    }
  }

  // Apply recommended settings
  const applyRecommendedSettings = async () => {
    if (!isAuthenticated) return false

    try {
      const response = await fetch('/api/v1/preferences/apply-recommended', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
        return true
      }
      return false
    } catch (err) {
      console.error('Error applying recommended settings:', err)
      return false
    }
  }

  // Load preferences on mount
  useEffect(() => {
    console.log('[usePreferences] useEffect triggered, isAuthenticated:', isAuthenticated, 'user:', user?.email)
    if (isAuthenticated) {
      console.log('[usePreferences] Calling fetchPreferences...')
      fetchPreferences()
    } else {
      console.log('[usePreferences] Not authenticated, skipping fetch')
    }
  }, [user]) // 依賴 user 而不是 isAuthenticated

  return {
    preferences,
    loading,
    error,
    fetchPreferences,
    updateReadingSettings,
    updateInterpretationSettings,
    updateNotificationSettings,
    updatePrivacySettings,
    resetPreferences,
    applyRecommendedSettings
  }
}
