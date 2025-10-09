/**
 * Test Fixtures for Bingo System
 * Mock data for testing daily bingo check-in feature
 */

export const mockBingoCard = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20],
  [21, 22, 23, 24, 25]
]

export const mockBingoCardFlat = mockBingoCard.flat()

export const mockClaimedNumbers = new Set([1, 2, 3, 6, 7, 11, 16, 21])

export const mockBingoStatus = {
  has_card: true,
  card_data: mockBingoCard,
  claimed_numbers: Array.from(mockClaimedNumbers),
  line_count: 0,
  has_reward: false,
  has_claimed_today: false,
  daily_number: 8,
  month_year: '2025-10'
}

export const mockBingoStatusWithThreeLines = {
  has_card: true,
  card_data: mockBingoCard,
  claimed_numbers: [1, 2, 3, 4, 5, 6, 11, 16, 21, 7, 12, 17, 22], // Row 0 + Col 0 + Col 1
  line_count: 3,
  has_reward: true,
  has_claimed_today: true,
  daily_number: 22,
  month_year: '2025-10'
}

export const mockBingoStatusNoCard = {
  has_card: false,
  card_data: null,
  claimed_numbers: [],
  line_count: 0,
  has_reward: false,
  has_claimed_today: false,
  daily_number: 8,
  month_year: '2025-10'
}

export const mockDailyNumber = {
  id: 'daily-number-1',
  date: '2025-10-15',
  number: 8,
  cycle_number: 1,
  generated_at: '2025-10-15T00:00:00Z'
}

export const mockClaimResult = {
  success: true,
  daily_number: 8,
  is_on_card: true,
  line_count: 1,
  has_reward: false,
  claimed_at: '2025-10-15T08:30:00Z'
}

export const mockClaimResultWithReward = {
  success: true,
  daily_number: 22,
  is_on_card: true,
  line_count: 3,
  has_reward: true,
  reward: {
    id: 'reward-1',
    type: 'THREE_LINES',
    issued_at: '2025-10-15T08:30:00Z'
  },
  claimed_at: '2025-10-15T08:30:00Z'
}

export const mockClaimResultAlreadyClaimed = {
  error: 'ALREADY_CLAIMED',
  message: '今日已領取號碼'
}

export const mockClaimResultNoCard = {
  error: 'NO_CARD_FOUND',
  message: '請先設定賓果卡'
}

export const mockBingoHistory = [
  {
    id: 'history-1',
    user_id: 'user-1',
    month_year: '2025-09',
    card_data: mockBingoCard,
    claimed_numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    line_count: 2,
    has_reward: false,
    created_at: '2025-09-01T00:00:00Z'
  },
  {
    id: 'history-2',
    user_id: 'user-1',
    month_year: '2025-08',
    card_data: mockBingoCard,
    claimed_numbers: [1, 2, 3, 4, 5, 6, 11, 16, 21, 7, 12, 17, 22],
    line_count: 3,
    has_reward: true,
    created_at: '2025-08-01T00:00:00Z'
  }
]

export const mockLineCheckResult = {
  line_count: 2,
  line_types: ['row-0', 'col-0'],
  has_three_lines: false,
  reward_issued: false
}

export const mockLineCheckResultThreeLines = {
  line_count: 3,
  line_types: ['row-0', 'col-0', 'diagonal-main'],
  has_three_lines: true,
  reward_issued: true
}

// Line patterns for bitmask testing
export const LINE_PATTERNS = {
  rows: [
    0x1F00000, // Row 0: bits 20-24
    0x3E0000,  // Row 1: bits 15-19
    0x7C00,    // Row 2: bits 10-14
    0xF80,     // Row 3: bits 5-9
    0x1F       // Row 4: bits 0-4
  ],
  cols: [
    0x1084210,  // Col 0: bits 0,5,10,15,20
    0x2108420,  // Col 1: bits 1,6,11,16,21
    0x4210840,  // Col 2: bits 2,7,12,17,22
    0x8421080,  // Col 3: bits 3,8,13,18,23
    0x10842100  // Col 4: bits 4,9,14,19,24
  ],
  diagonals: [
    0x11111000, // Main diagonal: bits 0,6,12,18,24
    0x1041040   // Anti diagonal: bits 4,8,12,16,20
  ]
}

// Helper function to create bitmask from claimed numbers
export function createBitmask(card: number[][], claimed: number[]): number {
  let mask = 0
  const claimedSet = new Set(claimed)

  card.forEach((row, rowIndex) => {
    row.forEach((num, colIndex) => {
      if (claimedSet.has(num)) {
        const position = rowIndex * 5 + colIndex
        mask |= (1 << position)
      }
    })
  })

  return mask
}

// Helper function to count lines from bitmask
export function countLines(bitmask: number): number {
  const allPatterns = [
    ...LINE_PATTERNS.rows,
    ...LINE_PATTERNS.cols,
    ...LINE_PATTERNS.diagonals
  ]

  return allPatterns.filter(pattern =>
    (bitmask & pattern) === pattern
  ).length
}
