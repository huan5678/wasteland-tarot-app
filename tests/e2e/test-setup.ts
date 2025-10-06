/**
 * Playwright Test Setup for Wasteland Tarot
 * Sets up MSW for API mocking in browser tests
 */

import { test as baseTest, expect } from '@playwright/test'

// Extend the base test to include MSW setup
export const test = baseTest.extend({
  page: async ({ page }, use) => {
    // Setup MSW in the browser context
    await page.addInitScript(() => {
      // Check if MSW is available in the window
      if (typeof window !== 'undefined' && !window.mswStarted) {
        // Mock API responses for authentication
        const mockResponses: Record<string, any> = {
          '/auth/login': {
            message: 'Pip-Boy authentication successful',
            user: {
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
            access_token: 'pip-boy-access-token-111',
            refresh_token: 'pip-boy-refresh-token-111',
            token_type: 'bearer'
          },
          '/auth/me': {
            user: {
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
            statistics: {
              total_readings: 42,
              favorite_faction: 'BROTHERHOOD_OF_STEEL',
              karma_trend: 'improving',
              wasteland_survival_days: 1247,
              radiation_exposure: 'moderate'
            }
          }
        }

        // Intercept fetch requests
        const originalFetch = window.fetch
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          const url = typeof input === 'string' ? input : input.toString()

          // Check if this is an API call we want to mock
          for (const [endpoint, response] of Object.entries(mockResponses)) {
            if (url.includes(endpoint)) {
              return new Response(JSON.stringify(response), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              })
            }
          }

          // For all other requests, use the original fetch
          return originalFetch(input, init)
        }

        window.mswStarted = true
      }
    })

    await use(page)
  }
})

export { expect }

// Helper function to authenticate user in tests
export const authenticateUser = async (page: any) => {
  // Store authentication state in localStorage to simulate login
  await page.addInitScript(() => {
    const authState = {
      isAuthenticated: true,
      user: {
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
      tokens: {
        access_token: 'pip-boy-access-token-111',
        refresh_token: 'pip-boy-refresh-token-111',
        token_type: 'bearer'
      }
    }

    localStorage.setItem('pip-boy-auth', JSON.stringify(authState))
    localStorage.setItem('pip-boy-tokens', JSON.stringify(authState.tokens))
  })

  // Go to login page first
  await page.goto('/auth/login')
  await page.waitForLoadState('networkidle')

  // Fill and submit login form
  await page.locator('#username').fill('vault_dweller')
  await page.locator('#password').fill('test_password')
  await page.locator('button[type="submit"]').click()

  // Wait for potential redirect
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
}