/**
 * MSW Users Handlers
 * Mock API responses for Wasteland Tarot user endpoints
 */

import { http, HttpResponse } from 'msw'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Mock user profiles (extending from auth handlers)
const mockUserProfiles = [
  {
    id: '1',
    username: 'vault_dweller',
    email: 'dweller@vault111.gov',
    display_name: 'The Sole Survivor',
    faction_alignment: 'BROTHERHOOD_OF_STEEL',
    karma_score: 750,
    karma_alignment: 'GOOD',
    vault_number: 111,
    wasteland_location: 'Commonwealth',
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    last_login: '2024-01-20T15:30:00Z',
    preferences: {
      default_character_voice: 'PIP_BOY',
      radiation_tolerance: 0.3,
      preferred_spread_type: 'three_card',
      sound_effects_enabled: true,
      pip_boy_theme: 'classic_green',
      auto_save_readings: true
    },
    statistics: {
      total_readings: 42,
      readings_this_month: 8,
      average_accuracy_rating: 4.2,
      total_karma_gained: 750,
      favorite_faction: 'BROTHERHOOD_OF_STEEL',
      wasteland_survival_days: 1247,
      radiation_exposure_level: 'moderate',
      most_drawn_card: 'The Vault Dweller',
      longest_reading_streak: 15
    }
  }
]

export const userHandlers = [
  // Get User Profile
  http.get(`${API_BASE_URL}/users/profile`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Pip-Boy authentication required' },
        { status: 401 }
      )
    }

    const userProfile = mockUserProfiles[0] // Mock current user

    return HttpResponse.json({
      user: userProfile
    })
  }),

  // Update User Profile
  http.put(`${API_BASE_URL}/users/profile`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Pip-Boy authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json() as any
    const userProfile = mockUserProfiles[0]

    // Update allowed fields
    if (body.display_name) userProfile.display_name = body.display_name
    if (body.faction_alignment) userProfile.faction_alignment = body.faction_alignment
    if (body.vault_number !== undefined) userProfile.vault_number = body.vault_number
    if (body.wasteland_location) userProfile.wasteland_location = body.wasteland_location

    return HttpResponse.json({
      message: 'Pip-Boy profile updated successfully',
      user: userProfile
    })
  }),

  // Update User Preferences
  http.put(`${API_BASE_URL}/users/preferences`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Pip-Boy authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json() as any
    const userProfile = mockUserProfiles[0]

    // Update preferences
    userProfile.preferences = {
      ...userProfile.preferences,
      ...body
    }

    return HttpResponse.json({
      message: 'Pip-Boy preferences updated successfully',
      preferences: userProfile.preferences
    })
  }),

  // Get User Statistics
  http.get(`${API_BASE_URL}/users/statistics`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Pip-Boy authentication required' },
        { status: 401 }
      )
    }

    const userProfile = mockUserProfiles[0]

    return HttpResponse.json({
      statistics: userProfile.statistics
    })
  }),

  // Update Karma Score
  http.post(`${API_BASE_URL}/users/karma`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Pip-Boy authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json() as any
    const userProfile = mockUserProfiles[0]

    const karmaChange = body.karma_change || 0
    userProfile.karma_score += karmaChange

    // Update karma alignment based on score
    if (userProfile.karma_score >= 500) {
      userProfile.karma_alignment = 'GOOD'
    } else if (userProfile.karma_score <= -500) {
      userProfile.karma_alignment = 'EVIL'
    } else {
      userProfile.karma_alignment = 'NEUTRAL'
    }

    return HttpResponse.json({
      message: 'Karma updated in Pip-Boy registry',
      karma_score: userProfile.karma_score,
      karma_alignment: userProfile.karma_alignment,
      karma_change: karmaChange
    })
  }),

  // Get User Achievements
  http.get(`${API_BASE_URL}/users/achievements`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Pip-Boy authentication required' },
        { status: 401 }
      )
    }

    const mockAchievements = [
      {
        id: 'first_reading',
        name: 'Wasteland Initiate',
        description: 'Complete your first tarot reading',
        icon: 'target',
        unlocked: true,
        unlocked_at: '2024-01-01T10:00:00Z'
      },
      {
        id: 'karma_saint',
        name: 'Karma Saint',
        description: 'Reach 1000 karma points',
        icon: 'crown',
        unlocked: false,
        progress: 750,
        target: 1000
      },
      {
        id: 'vault_dweller',
        name: 'True Vault Dweller',
        description: 'Set your vault number in profile',
        icon: 'home',
        unlocked: true,
        unlocked_at: '2024-01-01T12:00:00Z'
      },
      {
        id: 'wasteland_wanderer',
        name: 'Wasteland Wanderer',
        description: 'Complete 100 readings',
        icon: 'walking',
        unlocked: false,
        progress: 42,
        target: 100
      },
      {
        id: 'faction_loyal',
        name: 'Faction Loyalist',
        description: 'Maintain faction alignment for 30 days',
        icon: 'shield',
        unlocked: true,
        unlocked_at: '2024-01-15T09:00:00Z'
      }
    ]

    return HttpResponse.json({
      achievements: mockAchievements,
      total_unlocked: mockAchievements.filter(a => a.unlocked).length,
      total_available: mockAchievements.length,
      achievement_points: mockAchievements
        .filter(a => a.unlocked)
        .reduce((sum, a) => sum + 100, 0) // 100 points per achievement
    })
  }),

  // Export User Data
  http.get(`${API_BASE_URL}/users/export`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Pip-Boy authentication required' },
        { status: 401 }
      )
    }

    const userProfile = mockUserProfiles[0]

    const exportData = {
      profile: userProfile,
      readings: [], // Would include all user readings
      preferences: userProfile.preferences,
      statistics: userProfile.statistics,
      exported_at: new Date().toISOString(),
      vault_tech_signature: `EXPORT-${Date.now()}`
    }

    return HttpResponse.json({
      message: 'User data export completed',
      data: exportData,
      format: 'json',
      size_kb: JSON.stringify(exportData).length / 1024
    })
  }),

  // Delete User Account
  http.delete(`${API_BASE_URL}/users/account`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Pip-Boy authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json() as any

    // Require confirmation password or phrase
    if (body.confirmation !== 'DELETE_MY_VAULT_DATA') {
      return HttpResponse.json(
        { detail: 'Account deletion requires proper confirmation phrase' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      message: 'Account deletion initiated. Vault-Tec appreciates your service.',
      deletion_id: `DEL-${Date.now()}`,
      data_retention_days: 30
    })
  }),

  // Get Faction Information
  http.get(`${API_BASE_URL}/users/factions`, () => {
    const factions = [
      {
        id: 'BROTHERHOOD_OF_STEEL',
        name: 'Brotherhood of Steel',
        description: 'Dedicated to preserving pre-war technology and knowledge',
        karma_tendency: 'GOOD',
        color_scheme: '#4A5568',
        icon: 'settings'
      },
      {
        id: 'NCR',
        name: 'New California Republic',
        description: 'Democratic nation seeking to rebuild civilization',
        karma_tendency: 'GOOD',
        color_scheme: '#D69E2E',
        icon: 'landmark'
      },
      {
        id: 'CAESARS_LEGION',
        name: 'Caesar\'s Legion',
        description: 'Autocratic military society based on Roman ideals',
        karma_tendency: 'EVIL',
        color_scheme: '#E53E3E',
        icon: '🏺'
      },
      {
        id: 'RAIDERS',
        name: 'Raiders',
        description: 'Lawless groups surviving through violence and theft',
        karma_tendency: 'EVIL',
        color_scheme: '#1A202C',
        icon: 'skull'
      },
      {
        id: 'UNAFFILIATED',
        name: 'Unaffiliated',
        description: 'Independent survivor with no faction ties',
        karma_tendency: 'NEUTRAL',
        color_scheme: '#718096',
        icon: 'target'
      }
    ]

    return HttpResponse.json({
      factions,
      current_user_faction: 'BROTHERHOOD_OF_STEEL'
    })
  })
]