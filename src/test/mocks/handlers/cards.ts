/**
 * MSW Cards Handlers
 * Mock API responses for Wasteland Tarot card endpoints
 */

import { http, HttpResponse } from 'msw'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Mock Wasteland Tarot cards data
const mockCards = [
  {
    id: '1',
    name: 'The Vault Dweller',
    description: 'A figure emerging from the safety of underground into the harsh wasteland above.',
    suit: 'MAJOR_ARCANA',
    value: 0,
    card_number: 0,
    image_url: '/cards/vault-dweller.png',
    upright_meaning: 'New beginnings, innocence, potential, fresh start in the wasteland',
    reversed_meaning: 'Recklessness, naivety, poor judgment, unpreparedness for the wasteland',
    fallout_reference: 'Represents the player character leaving Vault 111',
    character_voices: {
      'PIP_BOY': 'New adventure detected! Your journey begins now, user.',
      'SUPER_MUTANT': 'TINY HUMAN LEAVE METAL CAVE. WASTELAND TEACH TINY HUMAN HARD LESSONS.',
      'GHOUL': 'Fresh meat stepping into the sun. Hope you got more luck than sense, smoothskin.',
      'RAIDER': 'Another vault rat crawling out. Let\'s see how long this one lasts.',
      'BROTHERHOOD_SCRIBE': 'Fascinating. Another Vault dweller emerges. Document everything.'
    },
    radiation_factor: 0.1,
    karma_alignment: 'NEUTRAL'
  },
  {
    id: '2',
    name: 'The Overseer',
    description: 'The authority figure who controls the vault, representing order and control.',
    suit: 'MAJOR_ARCANA',
    value: 4,
    card_number: 4,
    image_url: '/cards/overseer.png',
    upright_meaning: 'Authority, structure, order, leadership, stability',
    reversed_meaning: 'Tyranny, oppression, abuse of power, rebellion against authority',
    fallout_reference: 'The Vault Overseer who maintains order in underground society',
    character_voices: {
      'PIP_BOY': 'Authority figure detected. Compliance with vault regulations recommended.',
      'SUPER_MUTANT': 'BOSS HUMAN IN METAL CAVE. ALL TINY HUMANS FOLLOW BOSS RULES.',
      'GHOUL': 'The big shot calling the shots. Every vault needs its dictator.',
      'RAIDER': 'The head honcho keeping everyone in line. Respect the hierarchy or pay.',
      'BROTHERHOOD_SCRIBE': 'Hierarchical leadership structure. Essential for vault survival.'
    },
    radiation_factor: 0.3,
    karma_alignment: 'NEUTRAL'
  },
  {
    id: '3',
    name: 'The Wanderer',
    description: 'A lone figure walking the endless roads of the wasteland.',
    suit: 'MAJOR_ARCANA',
    value: 9,
    card_number: 9,
    image_url: '/cards/wanderer.png',
    upright_meaning: 'Soul searching, inner guidance, solitude, seeking truth',
    reversed_meaning: 'Isolation, loneliness, lost, withdrawal from others',
    fallout_reference: 'The Lone Wanderer from Fallout 3',
    character_voices: {
      'PIP_BOY': 'Solitary exploration mode activated. Self-reliance parameters optimal.',
      'SUPER_MUTANT': 'TINY HUMAN WALK ALONE. VERY DANGEROUS. NEED STRONG FRIENDS.',
      'GHOUL': 'Another drifter hitting the road. The wasteland\'s got plenty of room for loners.',
      'RAIDER': 'Solo traveler means easy pickings. Unless they\'re tougher than they look.',
      'BROTHERHOOD_SCRIBE': 'Independent reconnaissance mission. Valuable data collection opportunity.'
    },
    radiation_factor: 0.7,
    karma_alignment: 'NEUTRAL'
  },
  {
    id: '4',
    name: 'The Bottle Cap',
    description: 'The universal currency of the post-apocalyptic world.',
    suit: 'MINOR_ARCANA',
    value: 1,
    card_number: 1,
    image_url: '/cards/bottle-cap.png',
    upright_meaning: 'New financial opportunities, material beginnings, prosperity',
    reversed_meaning: 'Financial loss, poverty, lack of resources, poor investments',
    fallout_reference: 'Bottle caps as the standard post-war currency',
    character_voices: {
      'PIP_BOY': 'Currency detected. Value: significant. Trade opportunities available.',
      'SUPER_MUTANT': 'SHINY METAL DISCS. TINY HUMANS LOVE SHINY THINGS.',
      'GHOUL': 'The almighty cap. Makes the world go round, even after it stopped spinning.',
      'RAIDER': 'Caps mean power. More caps, more respect, more ammo.',
      'BROTHERHOOD_SCRIBE': 'Fascinating post-war economic adaptation. Efficient barter system.'
    },
    radiation_factor: 0.2,
    karma_alignment: 'NEUTRAL'
  },
  {
    id: '5',
    name: 'The Radroach',
    description: 'A mutated cockroach, symbolizing survival and adaptability.',
    suit: 'MINOR_ARCANA',
    value: 2,
    card_number: 2,
    image_url: '/cards/radroach.png',
    upright_meaning: 'Survival, adaptability, persistence, resilience',
    reversed_meaning: 'Pest, annoyance, small problems growing, infestation',
    fallout_reference: 'Common mutated creatures found throughout the wasteland',
    character_voices: {
      'PIP_BOY': 'Mutated insect detected. Threat level: minimal. Survival instinct: maximum.',
      'SUPER_MUTANT': 'NASTY BUG THINGS. HARD TO SQUISH. TINY HUMANS AFRAID OF BUGS.',
      'GHOUL': 'Roaches survived the bombs better than most. Gotta respect that.',
      'RAIDER': 'Disgusting little bastards. But they keep going no matter what.',
      'BROTHERHOOD_SCRIBE': 'Remarkable radiation adaptation. Nature finds a way to persist.'
    },
    radiation_factor: 0.6,
    karma_alignment: 'NEUTRAL'
  }
]

export const cardHandlers = [
  // Get All Cards
  http.get(`${API_BASE_URL}/cards`, ({ request }) => {
    const url = new URL(request.url)
    const suit = url.searchParams.get('suit')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let filteredCards = [...mockCards]

    // Filter by suit if specified
    if (suit) {
      filteredCards = filteredCards.filter(card => card.suit === suit)
    }

    // Apply pagination
    const paginatedCards = filteredCards.slice(offset, offset + limit)

    return HttpResponse.json({
      cards: paginatedCards,
      total: filteredCards.length,
      limit,
      offset,
      has_more: offset + limit < filteredCards.length
    })
  }),

  // Get Single Card
  http.get(`${API_BASE_URL}/cards/:id`, ({ params }) => {
    const card = mockCards.find(c => c.id === params.id)

    if (!card) {
      return HttpResponse.json(
        { detail: 'Card not found in the Wasteland deck' },
        { status: 404 }
      )
    }

    return HttpResponse.json({ card })
  }),

  // Get Cards by Suit
  http.get(`${API_BASE_URL}/cards/suit/:suit`, ({ params }) => {
    const suitCards = mockCards.filter(card => card.suit === params.suit)

    if (suitCards.length === 0) {
      return HttpResponse.json(
        { detail: 'No cards found for this suit in the Wasteland' },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      cards: suitCards,
      suit: params.suit,
      total: suitCards.length
    })
  }),

  // Draw Random Cards
  http.post(`${API_BASE_URL}/cards/draw`, async ({ request }) => {
    const body = await request.json() as any
    const numCards = body.num_cards || 1
    const radiationFactor = body.radiation_factor || 0.5

    // Simulate radiation affecting card draw
    const availableCards = mockCards.filter(card =>
      Math.random() * (1 + radiationFactor) > card.radiation_factor
    )

    if (availableCards.length < numCards) {
      return HttpResponse.json(
        { detail: 'Not enough uncontaminated cards available' },
        { status: 400 }
      )
    }

    // Shuffle and select cards
    const shuffledCards = [...availableCards].sort(() => Math.random() - 0.5)
    const drawnCards = shuffledCards.slice(0, numCards)

    return HttpResponse.json({
      cards: drawnCards,
      radiation_factor: radiationFactor,
      draw_timestamp: new Date().toISOString(),
      vault_signature: `VAULT-TEC-${Date.now()}`
    })
  }),

  // Get Card Interpretation
  http.post(`${API_BASE_URL}/cards/:id/interpret`, async ({ params, request }) => {
    const body = await request.json() as any
    const card = mockCards.find(c => c.id === params.id)

    if (!card) {
      return HttpResponse.json(
        { detail: 'Card not found for interpretation' },
        { status: 404 }
      )
    }

    const characterVoice = body.character_voice || 'PIP_BOY'
    const position = body.position || 'upright'
    const question = body.question || 'General guidance'

    const interpretation = card.character_voices[characterVoice] ||
                         card.character_voices['PIP_BOY']

    const meaning = position === 'upright' ? card.upright_meaning : card.reversed_meaning

    return HttpResponse.json({
      card,
      interpretation: {
        character_voice: characterVoice,
        position,
        meaning,
        personalized_message: interpretation,
        advice: `Based on "${question}", this card suggests: ${meaning}`,
        radiation_warning: card.radiation_factor > 0.5 ?
          'High radiation detected in this reading. Proceed with caution.' : null,
        vault_tech_note: `Card analysis complete. Confidence: ${Math.floor(Math.random() * 40 + 60)}%`
      }
    })
  }),

  // Shuffle Deck
  http.post(`${API_BASE_URL}/cards/shuffle`, async ({ request }) => {
    const body = await request.json() as any
    const radiationFactor = body.radiation_factor || 0.5

    // Simulate Pip-Boy shuffle algorithm
    const shuffleId = `SHUFFLE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return HttpResponse.json({
      message: 'Wasteland deck shuffled successfully',
      shuffle_id: shuffleId,
      radiation_factor: radiationFactor,
      deck_size: mockCards.length,
      contaminated_cards: mockCards.filter(c => c.radiation_factor > radiationFactor).length,
      timestamp: new Date().toISOString()
    })
  })
]