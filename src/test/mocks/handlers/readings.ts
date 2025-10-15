/**
 * MSW Readings Handlers
 * Mock API responses for Wasteland Tarot reading endpoints
 */

import { http, HttpResponse } from 'msw'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Mock readings data
const mockReadings = [
  {
    id: '1',
    user_id: '1',
    question: 'What does my future hold in the wasteland?',
    spread_type: 'three_card',
    cards: [
      {
        id: '1',
        name: 'The Vault Dweller',
        position: 'past',
        is_reversed: false
      },
      {
        id: '3',
        name: 'The Wanderer',
        position: 'present',
        is_reversed: false
      },
      {
        id: '2',
        name: 'The Overseer',
        position: 'future',
        is_reversed: true
      }
    ],
    interpretation: {
      character_voice: 'PIP_BOY',
      overall_theme: 'Journey from safety to independence to leadership challenges',
      card_interpretations: [
        {
          card_id: '1',
          position: 'past',
          meaning: 'Your journey began with innocence and potential in the safety of the vault',
          advice: 'Remember your origins and the values that shaped you'
        },
        {
          card_id: '3',
          position: 'present',
          meaning: 'You are currently on a path of self-discovery in the wasteland',
          advice: 'Trust your inner guidance and embrace solitude for growth'
        },
        {
          card_id: '2',
          position: 'future',
          meaning: 'Challenges with authority or becoming an authority figure yourself',
          advice: 'Be cautious of power and its potential for corruption'
        }
      ],
      summary: 'Your path leads from protected beginnings through independent growth to potential leadership. Stay true to your values.',
      radiation_warning: 'Low radiation detected in this reading',
      karma_impact: 25
    },
    radiation_factor: 0.3,
    karma_adjustment: 25,
    created_at: '2024-01-15T10:30:00Z',
    is_private: false,
    accuracy_rating: 4.2,
    user_feedback: 'Very insightful reading!'
  },
  {
    id: '2',
    user_id: '1',
    question: 'Should I trust the mysterious stranger?',
    spread_type: 'single_card',
    cards: [
      {
        id: '4',
        name: 'The Bottle Cap',
        position: 'guidance',
        is_reversed: true
      }
    ],
    interpretation: {
      character_voice: 'GHOUL',
      overall_theme: 'Financial or material concerns with trust issues',
      card_interpretations: [
        {
          card_id: '4',
          position: 'guidance',
          meaning: 'Reversed Bottle Cap suggests potential financial loss or deception',
          advice: 'That stranger might be after your caps, smoothskin. Keep your hand on your holster.'
        }
      ],
      summary: 'Trust your gut, kid. If something smells fishy, it probably is.',
      radiation_warning: null,
      karma_impact: -10
    },
    radiation_factor: 0.1,
    karma_adjustment: -10,
    created_at: '2024-01-14T14:20:00Z',
    is_private: true,
    accuracy_rating: null,
    user_feedback: null
  }
]

let readingIdCounter = mockReadings.length + 1

export const readingHandlers = [
  // Create New Reading
  http.post(`${API_BASE_URL}/readings`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Pip-Boy authentication required for readings' },
        { status: 401 }
      )
    }

    const body = await request.json() as any

    // Validate required fields
    if (!body.question) {
      return HttpResponse.json(
        { detail: 'Question is required for Wasteland divination' },
        { status: 400 }
      )
    }

    // Simulate reading creation
    const newReading = {
      id: String(readingIdCounter++),
      user_id: '1', // Mock user ID
      question: body.question,
      spread_type: body.spread_type || 'single_card',
      cards: [], // Will be populated by card draw
      interpretation: null, // Will be generated
      radiation_factor: body.radiation_factor || 0.5,
      karma_adjustment: 0,
      created_at: new Date().toISOString(),
      is_private: body.is_private || false,
      accuracy_rating: null,
      user_feedback: null
    }

    // Add mock cards based on spread type
    const numCards = body.num_cards || (body.spread_type === 'three_card' ? 3 : 1)
    const mockCardIds = ['1', '2', '3', '4', '5']

    for (let i = 0; i < numCards; i++) {
      newReading.cards.push({
        id: mockCardIds[i % mockCardIds.length],
        name: `Card ${i + 1}`,
        position: i === 0 ? 'guidance' : i === 1 ? 'present' : 'future',
        is_reversed: Math.random() > 0.7
      })
    }

    // Generate mock interpretation
    newReading.interpretation = {
      character_voice: body.character_voice || 'PIP_BOY',
      overall_theme: 'AI-generated interpretation for your question',
      card_interpretations: newReading.cards.map(card => ({
        card_id: card.id,
        position: card.position,
        meaning: `Meaning for ${card.name} in ${card.position} position`,
        advice: `Advice based on ${card.name}`
      })),
      summary: 'The wasteland reveals its secrets through these ancient cards.',
      radiation_warning: body.radiation_factor > 0.7 ? 'High radiation detected' : null,
      karma_impact: Math.floor(Math.random() * 50 - 25)
    }

    mockReadings.push(newReading as any)

    return HttpResponse.json({
      message: 'Reading created successfully',
      reading: newReading
    })
  }),

  // Get User's Readings
  http.get(`${API_BASE_URL}/readings`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Pip-Boy authentication required' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const includePrivate = url.searchParams.get('include_private') === 'true'

    let userReadings = mockReadings.filter(r => r.user_id === '1')

    if (!includePrivate) {
      userReadings = userReadings.filter(r => !r.is_private)
    }

    const paginatedReadings = userReadings.slice(offset, offset + limit)

    return HttpResponse.json({
      readings: paginatedReadings,
      total: userReadings.length,
      limit,
      offset,
      has_more: offset + limit < userReadings.length
    })
  }),

  // Get Specific Reading
  http.get(`${API_BASE_URL}/readings/:id`, ({ params }) => {
    const reading = mockReadings.find(r => r.id === params.id)

    if (!reading) {
      return HttpResponse.json(
        { detail: 'Reading not found in Vault archives' },
        { status: 404 }
      )
    }

    return HttpResponse.json({ reading })
  }),

  // Update Reading
  http.put(`${API_BASE_URL}/readings/:id`, async ({ params, request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Pip-Boy authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json() as any
    const readingIndex = mockReadings.findIndex(r => r.id === params.id)

    if (readingIndex === -1) {
      return HttpResponse.json(
        { detail: 'Reading not found' },
        { status: 404 }
      )
    }

    // Update reading fields
    const reading = mockReadings[readingIndex]
    if (body.user_feedback !== undefined) reading.user_feedback = body.user_feedback
    if (body.accuracy_rating !== undefined) reading.accuracy_rating = body.accuracy_rating
    if (body.is_private !== undefined) reading.is_private = body.is_private

    return HttpResponse.json({
      message: 'Reading updated successfully',
      reading
    })
  }),

  // Delete Reading
  http.delete(`${API_BASE_URL}/readings/:id`, ({ params }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Pip-Boy authentication required' },
        { status: 401 }
      )
    }

    const readingIndex = mockReadings.findIndex(r => r.id === params.id)

    if (readingIndex === -1) {
      return HttpResponse.json(
        { detail: 'Reading not found' },
        { status: 404 }
      )
    }

    mockReadings.splice(readingIndex, 1)

    return HttpResponse.json({
      message: 'Reading deleted from Vault archives'
    })
  }),

  // Share Reading
  http.post(`${API_BASE_URL}/readings/:id/share`, ({ params }) => {
    const reading = mockReadings.find(r => r.id === params.id)

    if (!reading) {
      return HttpResponse.json(
        { detail: 'Reading not found' },
        { status: 404 }
      )
    }

    const shareUrl = `https://wasteland-tarot.com/shared/${reading.id}`

    return HttpResponse.json({
      message: 'Reading shared successfully',
      share_url: shareUrl,
      public_id: `SHARE-${reading.id}-${Date.now()}`
    })
  }),

  // Get Public Reading
  http.get(`${API_BASE_URL}/readings/public/:publicId`, ({ params }) => {
    // Extract reading ID from public ID
    const readingId = params.publicId.split('-')[1]
    const reading = mockReadings.find(r => r.id === readingId && !r.is_private)

    if (!reading) {
      return HttpResponse.json(
        { detail: 'Public reading not found or is private' },
        { status: 404 }
      )
    }

    // Return reading without sensitive user info
    const publicReading = {
      ...reading,
      user_id: undefined,
      user_feedback: undefined
    }

    return HttpResponse.json({ reading: publicReading })
  }),

  // Get Reading Statistics
  http.get(`${API_BASE_URL}/readings/stats`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Pip-Boy authentication required' },
        { status: 401 }
      )
    }

    const userReadings = mockReadings.filter(r => r.user_id === '1')

    return HttpResponse.json({
      total_readings: userReadings.length,
      average_accuracy: userReadings
        .filter(r => r.accuracy_rating)
        .reduce((sum, r) => sum + (r.accuracy_rating || 0), 0) /
        userReadings.filter(r => r.accuracy_rating).length || 0,
      most_used_spread: 'three_card',
      total_karma_gained: userReadings.reduce((sum, r) => sum + r.karma_adjustment, 0),
      favorite_character_voice: 'PIP_BOY',
      radiation_exposure: 'moderate'
    })
  })
]