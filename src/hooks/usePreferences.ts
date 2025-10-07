/**
 * User Preferences Hook
 * React hook for managing user preferences
 */

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/authStore'

interface UserPreferences {
  // Visual settings
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

  // Reading settings
  default_character_voice: string
  auto_save_readings: boolean
  share_readings_publicly: boolean
  favorite_spread_types: string[]
  reading_reminder_time: string | null
  notification_frequency: string

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
  const token = useAuthStore(s => s.token)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch preferences
  const fetchPreferences = async () => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/preferences/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      } else {
        setError('Failed to fetch preferences')
      }
    } catch (err) {
      setError('Network error')
      console.error('Error fetching preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  // Update preferences
  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/preferences/`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        }
      )

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
        return true
      } else {
        setError('Failed to update preferences')
        return false
      }
    } catch (err) {
      setError('Network error')
      console.error('Error updating preferences:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Update visual settings
  const updateVisualSettings = async (settings: {
    theme?: string
    pip_boy_color?: string
    terminal_effects?: boolean
    sound_effects?: boolean
    background_music?: boolean
    preferred_card_back?: string
  }) => {
    if (!token) return false

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/preferences/visual`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(settings)
        }
      )

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
        return true
      }
      return false
    } catch (err) {
      console.error('Error updating visual settings:', err)
      return false
    }
  }

  // Update accessibility settings
  const updateAccessibilitySettings = async (settings: {
    high_contrast_mode?: boolean
    large_text_mode?: boolean
    screen_reader_mode?: boolean
    reduced_motion?: boolean
  }) => {
    if (!token) return false

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/preferences/accessibility`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(settings)
        }
      )

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
        return true
      }
      return false
    } catch (err) {
      console.error('Error updating accessibility settings:', err)
      return false
    }
  }

  // Reset preferences
  const resetPreferences = async () => {
    if (!token) return false

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/preferences/reset`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

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
    if (!token) return false

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/preferences/apply-recommended`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

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
    if (token) {
      fetchPreferences()
    }
  }, [token])

  return {
    preferences,
    loading,
    error,
    fetchPreferences,
    updatePreferences,
    updateVisualSettings,
    updateAccessibilitySettings,
    resetPreferences,
    applyRecommendedSettings
  }
}
