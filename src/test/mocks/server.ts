/**
 * MSW Server Configuration for Wasteland Tarot API
 * Fallout-themed API mocking for testing
 */

import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth'
import { cardHandlers } from './handlers/cards'
import { readingHandlers } from './handlers/readings'
import { userHandlers } from './handlers/users'
import { bingoHandlers } from './handlers/bingo'
import { wishlistHandlers } from './handlers/wishlist'

// Combine all API handlers
export const handlers = [
  ...authHandlers,
  ...cardHandlers,
  ...readingHandlers,
  ...userHandlers,
  ...bingoHandlers,
  ...wishlistHandlers,
]

// Setup MSW server with all handlers
export const server = setupServer(...handlers)