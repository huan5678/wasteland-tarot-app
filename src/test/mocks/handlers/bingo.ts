/**
 * MSW Handlers for Bingo API
 * Mock API endpoints for testing daily bingo check-in feature
 */

import { http, HttpResponse, delay } from 'msw'
import {
  mockBingoStatus,
  mockBingoStatusNoCard,
  mockBingoStatusWithThreeLines,
  mockDailyNumber,
  mockClaimResult,
  mockClaimResultWithReward,
  mockClaimResultAlreadyClaimed,
  mockClaimResultNoCard,
  mockBingoHistory,
  mockLineCheckResult,
  mockLineCheckResultThreeLines,
  mockBingoCard
} from '../fixtures/bingoData'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Mutable state for testing dynamic scenarios
let currentBingoStatus = { ...mockBingoStatus }
let hasClaimedToday = false
let userHasCard = true

// Reset handlers - useful for test cleanup
export function resetBingoHandlers() {
  currentBingoStatus = { ...mockBingoStatus }
  hasClaimedToday = false
  userHasCard = true
}

export const bingoHandlers = [
  // GET /api/v1/bingo/status - Get user bingo status
  http.get(`${API_BASE}/api/v1/bingo/status`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'UNAUTHORIZED', message: '未授權' },
        { status: 401 }
      )
    }

    await delay(100) // Simulate network latency

    if (!userHasCard) {
      return HttpResponse.json(mockBingoStatusNoCard)
    }

    return HttpResponse.json(currentBingoStatus)
  }),

  // POST /api/v1/bingo/card - Create bingo card
  http.post(`${API_BASE}/api/v1/bingo/card`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'UNAUTHORIZED', message: '未授權' },
        { status: 401 }
      )
    }

    const body = await request.json() as { numbers: number[][] }

    // Validate card numbers
    const flatNumbers = body.numbers.flat()
    if (flatNumbers.length !== 25) {
      return HttpResponse.json(
        {
          error: 'INVALID_CARD_NUMBERS',
          message: '賓果卡必須包含 25 個號碼',
          details: { count: flatNumbers.length }
        },
        { status: 400 }
      )
    }

    const uniqueNumbers = new Set(flatNumbers)
    if (uniqueNumbers.size !== 25) {
      return HttpResponse.json(
        {
          error: 'INVALID_CARD_NUMBERS',
          message: '賓果卡號碼不可重複',
          details: { duplicates: flatNumbers.filter((n, i) => flatNumbers.indexOf(n) !== i) }
        },
        { status: 400 }
      )
    }

    const invalidNumbers = flatNumbers.filter(n => n < 1 || n > 25)
    if (invalidNumbers.length > 0) {
      return HttpResponse.json(
        {
          error: 'INVALID_CARD_NUMBERS',
          message: '賓果卡號碼必須在 1-25 之間',
          details: { invalid: invalidNumbers }
        },
        { status: 400 }
      )
    }

    if (userHasCard) {
      return HttpResponse.json(
        {
          error: 'CARD_ALREADY_EXISTS',
          message: '本月已設定賓果卡，無法重新設定'
        },
        { status: 409 }
      )
    }

    await delay(150)

    // Create card successfully
    userHasCard = true
    currentBingoStatus = {
      ...currentBingoStatus,
      has_card: true,
      card_data: body.numbers
    }

    return HttpResponse.json(
      {
        success: true,
        card: {
          id: 'card-1',
          user_id: 'user-1',
          month_year: '2025-10',
          card_data: body.numbers,
          created_at: new Date().toISOString(),
          is_active: true
        }
      },
      { status: 201 }
    )
  }),

  // GET /api/v1/bingo/card - Get user's bingo card
  http.get(`${API_BASE}/api/v1/bingo/card`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'UNAUTHORIZED', message: '未授權' },
        { status: 401 }
      )
    }

    await delay(100)

    if (!userHasCard) {
      return HttpResponse.json(
        { error: 'NO_CARD_FOUND', message: '找不到賓果卡' },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      id: 'card-1',
      user_id: 'user-1',
      month_year: '2025-10',
      card_data: currentBingoStatus.card_data,
      created_at: '2025-10-01T00:00:00Z',
      is_active: true
    })
  }),

  // POST /api/v1/bingo/claim - Claim daily number
  http.post(`${API_BASE}/api/v1/bingo/claim`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'UNAUTHORIZED', message: '未授權' },
        { status: 401 }
      )
    }

    await delay(200)

    if (!userHasCard) {
      return HttpResponse.json(mockClaimResultNoCard, { status: 404 })
    }

    if (hasClaimedToday) {
      return HttpResponse.json(mockClaimResultAlreadyClaimed, { status: 409 })
    }

    // Claim successfully
    hasClaimedToday = true

    // Check if this claim would result in 3 lines
    const newClaimedNumbers = [
      ...currentBingoStatus.claimed_numbers,
      currentBingoStatus.daily_number
    ]

    // Simple logic: if we have 13+ claimed numbers, assume 3 lines
    const hasThreeLines = newClaimedNumbers.length >= 13

    currentBingoStatus = {
      ...currentBingoStatus,
      claimed_numbers: newClaimedNumbers,
      has_claimed_today: true,
      line_count: hasThreeLines ? 3 : Math.min(2, Math.floor(newClaimedNumbers.length / 5)),
      has_reward: hasThreeLines
    }

    if (hasThreeLines) {
      return HttpResponse.json(mockClaimResultWithReward)
    }

    return HttpResponse.json({
      ...mockClaimResult,
      line_count: currentBingoStatus.line_count
    })
  }),

  // GET /api/v1/bingo/daily-number - Get today's number
  http.get(`${API_BASE}/api/v1/bingo/daily-number`, async () => {
    await delay(50)
    return HttpResponse.json(mockDailyNumber)
  }),

  // GET /api/v1/bingo/lines - Get line status
  http.get(`${API_BASE}/api/v1/bingo/lines`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'UNAUTHORIZED', message: '未授權' },
        { status: 401 }
      )
    }

    await delay(100)

    if (currentBingoStatus.line_count >= 3) {
      return HttpResponse.json(mockLineCheckResultThreeLines)
    }

    return HttpResponse.json(mockLineCheckResult)
  }),

  // GET /api/v1/bingo/history/:month - Get historical bingo data
  http.get(`${API_BASE}/api/v1/bingo/history/:month`, async ({ request, params }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'UNAUTHORIZED', message: '未授權' },
        { status: 401 }
      )
    }

    await delay(150)

    const month = params.month as string
    const historyForMonth = mockBingoHistory.find(h => h.month_year === month)

    if (!historyForMonth) {
      return HttpResponse.json(
        { error: 'NOT_FOUND', message: '找不到該月份的記錄' },
        { status: 404 }
      )
    }

    return HttpResponse.json(historyForMonth)
  }),

  // GET /api/v1/bingo/rewards - Get reward history
  http.get(`${API_BASE}/api/v1/bingo/rewards`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'UNAUTHORIZED', message: '未授權' },
        { status: 401 }
      )
    }

    await delay(100)

    return HttpResponse.json({
      rewards: [
        {
          id: 'reward-1',
          user_id: 'user-1',
          month_year: '2025-08',
          line_types: ['row-0', 'col-0', 'diagonal-main'],
          issued_at: '2025-08-15T08:30:00Z'
        }
      ]
    })
  }),
]

// Export helper functions for test setup
export const bingoTestHelpers = {
  setHasCard: (hasCard: boolean) => {
    userHasCard = hasCard
  },
  setHasClaimedToday: (claimed: boolean) => {
    hasClaimedToday = claimed
  },
  setCurrentStatus: (status: typeof mockBingoStatus) => {
    currentBingoStatus = { ...status }
  },
  reset: resetBingoHandlers
}
