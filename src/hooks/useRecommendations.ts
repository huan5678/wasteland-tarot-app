/**
 * Recommendation Hooks
 * React hooks for accessing personalized recommendations
 */

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/authStore'

interface SpreadRecommendation {
  spread_type: string
  reason: string
  confidence: number
}

interface CardRecommendation {
  card_id: string
  reason: string
  confidence: number
}

interface InterpretationStyle {
  style: 'balanced' | 'mystical' | 'practical'
  depth: 'simple' | 'medium' | 'deep'
  focus: 'general' | 'nuanced'
}

/**
 * Hook to get spread recommendation based on question
 */
export function useSpreadRecommendation(question: string) {
  const token = useAuthStore(s => s.token)
  const [recommendation, setRecommendation] = useState<SpreadRecommendation | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!question || !token || question.length < 5) {
      setRecommendation(null)
      return
    }

    const fetchRecommendation = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/analytics/recommendations/spread-for-question`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ question })
          }
        )

        if (response.ok) {
          const data = await response.json()
          setRecommendation(data.recommendation)
        }
      } catch (error) {
        console.error('Error fetching spread recommendation:', error)
      } finally {
        setLoading(false)
      }
    }

    // Debounce the API call
    const timeoutId = setTimeout(fetchRecommendation, 500)
    return () => clearTimeout(timeoutId)
  }, [question, token])

  return { recommendation, loading }
}

/**
 * Hook to get cards recommended for study
 */
export function useStudyCards(limit: number = 5) {
  const token = useAuthStore(s => s.token)
  const [cards, setCards] = useState<CardRecommendation[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCards = async () => {
    if (!token) return

    setLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/analytics/recommendations/cards-for-study?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setCards(data.cards || [])
      }
    } catch (error) {
      console.error('Error fetching study cards:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
  }, [token, limit])

  return { cards, loading, refetch: fetchCards }
}

/**
 * Hook to get interpretation style recommendation
 */
export function useInterpretationStyle(cardIds: string[]) {
  const token = useAuthStore(s => s.token)
  const [style, setStyle] = useState<InterpretationStyle | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!cardIds || cardIds.length === 0 || !token) {
      setStyle(null)
      return
    }

    const fetchStyle = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/analytics/recommendations/interpretation-style`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ card_ids: cardIds })
          }
        )

        if (response.ok) {
          const data = await response.json()
          setStyle(data.style)
        }
      } catch (error) {
        console.error('Error fetching interpretation style:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStyle()
  }, [cardIds, token])

  return { style, loading }
}

/**
 * Hook to generate comprehensive recommendations with context
 */
export function useContextualRecommendations(context?: { question?: string; card_ids?: string[] }) {
  const token = useAuthStore(s => s.token)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    if (!token) return

    setLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/analytics/recommendations/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(context || {})
        }
      )

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
      }
    } catch (error) {
      console.error('Error generating recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  return { recommendations, loading, generate }
}
