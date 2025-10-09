/**
 * MSW Authentication Handlers
 * Mock API responses for Wasteland Tarot auth endpoints
 */

import { http, HttpResponse } from 'msw'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Mock user data
const mockUsers = [
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
  },
  {
    id: '2',
    username: 'courier_six',
    email: 'courier@mojave.gov',
    display_name: 'The Courier',
    faction_alignment: 'NCR',
    karma_score: -200,
    karma_alignment: 'EVIL',
    vault_number: null,
    wasteland_location: 'Mojave Wasteland',
    is_verified: true,
    created_at: '2024-01-02T00:00:00Z',
  }
]

// Mock tokens
const mockTokens = {
  'vault_dweller': {
    access_token: 'pip-boy-access-token-111',
    refresh_token: 'pip-boy-refresh-token-111',
  },
  'courier_six': {
    access_token: 'pip-boy-access-token-6',
    refresh_token: 'pip-boy-refresh-token-6',
  }
}

export const authHandlers = [
  // User Registration
  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as any

    // Simulate validation errors
    if (body.username === 'taken_username') {
      return HttpResponse.json(
        { detail: 'Username already exists in the Vault registry' },
        { status: 409 }
      )
    }

    if (body.email === 'taken@vault.com') {
      return HttpResponse.json(
        { detail: 'Email already registered with Vault-Tec' },
        { status: 409 }
      )
    }

    // Simulate successful registration
    const newUser = {
      id: String(mockUsers.length + 1),
      username: body.username,
      email: body.email,
      display_name: body.display_name || body.username,
      faction_alignment: body.faction_alignment || 'UNAFFILIATED',
      karma_score: 0,
      karma_alignment: 'NEUTRAL',
      vault_number: body.vault_number || null,
      wasteland_location: body.wasteland_location || 'Unknown',
      is_verified: false,
      created_at: new Date().toISOString(),
    }

    mockUsers.push(newUser)

    return HttpResponse.json({
      message: 'Welcome to the Wasteland! Registration successful.',
      user: newUser,
      access_token: `pip-boy-access-token-${newUser.id}`,
      refresh_token: `pip-boy-refresh-token-${newUser.id}`,
      token_type: 'bearer'
    })
  }),

  // User Login
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as any

    const user = mockUsers.find(u => u.username === body.username)

    if (!user) {
      return HttpResponse.json(
        { detail: 'Vault dweller not found in registry' },
        { status: 401 }
      )
    }

    // Simulate wrong password
    if (body.password === 'wrong_password') {
      return HttpResponse.json(
        { detail: 'Invalid access codes - Pip-Boy authentication failed' },
        { status: 401 }
      )
    }

    const tokens = mockTokens[user.username as keyof typeof mockTokens] || {
      access_token: `pip-boy-access-token-${user.id}`,
      refresh_token: `pip-boy-refresh-token-${user.id}`,
    }

    return HttpResponse.json({
      message: 'Pip-Boy authentication successful',
      user,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: 'bearer'
    })
  }),

  // Token Refresh
  http.post(`${API_BASE_URL}/auth/token/refresh`, async ({ request }) => {
    const body = await request.json() as any

    // Simulate invalid refresh token
    if (body.refresh_token === 'invalid_token') {
      return HttpResponse.json(
        { detail: 'Invalid refresh token - Pip-Boy needs recalibration' },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      access_token: 'new-pip-boy-access-token',
      refresh_token: 'new-pip-boy-refresh-token',
      token_type: 'bearer'
    })
  }),

  // Get Current User
  http.get(`${API_BASE_URL}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { detail: 'Pip-Boy authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

    // Find user by token
    const user = mockUsers.find(u => {
      const userTokens = mockTokens[u.username as keyof typeof mockTokens]
      return userTokens?.access_token === token
    }) || mockUsers[0] // Default to first user for testing

    return HttpResponse.json({
      user,
      statistics: {
        total_readings: 42,
        favorite_faction: user.faction_alignment,
        karma_trend: user.karma_score > 0 ? 'improving' : 'declining',
        wasteland_survival_days: 1247,
        radiation_exposure: 'moderate'
      }
    })
  }),

  // Logout
  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({
      message: 'Pip-Boy logout successful - Stay safe in the Wasteland!'
    })
  }),

  // Password Reset Request
  http.post(`${API_BASE_URL}/auth/password/reset/request`, async ({ request }) => {
    const body = await request.json() as any

    return HttpResponse.json({
      message: 'Password reset instructions sent to your Pip-Boy',
      reset_token: 'pip-boy-reset-token-123' // Only for testing
    })
  }),

  // Password Reset Confirm
  http.post(`${API_BASE_URL}/auth/password/reset/confirm`, async ({ request }) => {
    const body = await request.json() as any

    if (body.reset_token === 'invalid_token') {
      return HttpResponse.json(
        { detail: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      message: 'Password reset successful - Pip-Boy access restored'
    })
  }),

  // Email Verification
  http.post(`${API_BASE_URL}/auth/verify-email/:token`, ({ params }) => {
    if (params.token === 'invalid_token') {
      return HttpResponse.json(
        { detail: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      message: 'Email verification successful - Welcome to the Wasteland!'
    })
  }),
]