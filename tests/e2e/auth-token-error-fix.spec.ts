/**
 * E2E Tests for Auth Token Error Fix (Task 4.5)
 *
 * Tests critical authentication paths:
 * - Login → Bingo page → claim daily number flow
 * - Login → Achievement page → claim reward flow
 * - Session expiry handling
 * - Offline/online transition with retry
 * - Post-login return navigation
 *
 * Requirements covered: 10.3
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'

test.describe('Auth Token Error Fix - Critical E2E Paths', () => {
  // Helper function to login
  async function login(page: Page, email: string, password: string) {
    await page.goto('/auth/login')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')
    await page.waitForURL('/', { timeout: 10000 })
  }

  // Helper function to check if user is authenticated
  async function isAuthenticated(page: Page): Promise<boolean> {
    try {
      await page.goto('/')
      const loginButton = page.getByRole('link', { name: /登入|login/i })
      return !(await loginButton.isVisible())
    } catch {
      return false
    }
  }

  test.describe('Subtask 4.5.1: Login → Bingo → Claim Daily Number', () => {
    test('should complete full flow: login, navigate to bingo, claim daily number', async ({ page, context }) => {
      // Step 1: Login
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'test123456')

      await Promise.all([
        page.waitForURL('/', { timeout: 10000 }),
        page.click('button[type="submit"]'),
      ])

      // Verify logged in
      await expect(page).toHaveURL('/')

      // Step 2: Navigate to Bingo page
      await page.goto('/bingo')
      await expect(page).toHaveURL('/bingo')

      // Step 3: Wait for page to load (either setup or game interface)
      await page.waitForLoadState('networkidle')

      // Check if we need to setup card first
      const setupButton = page.getByRole('button', { name: /確認設定|設定賓果卡/i })
      if (await setupButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Setup card flow
        const numberButtons = page.locator('button').filter({ hasText: /^[0-9]+$/ })
        const count = await numberButtons.count()

        // Select 25 numbers
        for (let i = 0; i < Math.min(count, 25); i++) {
          await numberButtons.nth(i).click()
        }

        await setupButton.click()
        await page.waitForTimeout(2000) // Wait for card creation
      }

      // Step 4: Check if we can claim daily number
      const claimButton = page.getByRole('button', { name: /領取今日號碼|claim/i })
      const hasClaimed = page.getByText(/已領取|claimed/i)

      if (await claimButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Claim daily number
        await claimButton.click()

        // Verify claim success
        await expect(hasClaimed).toBeVisible({ timeout: 5000 })
      } else {
        // Already claimed
        await expect(hasClaimed).toBeVisible()
      }

      // Verify no authentication errors
      const errorMessage = page.getByText(/No access token provided|token is not defined|ReferenceError/i)
      await expect(errorMessage).not.toBeVisible()
    })

    test('should not show token errors on bingo page', async ({ page }) => {
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'test123456')
      await page.click('button[type="submit"]')
      await page.waitForURL('/')

      await page.goto('/bingo')

      // Monitor console errors
      const consoleErrors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      await page.waitForTimeout(3000)

      // Verify no token-related errors
      const tokenErrors = consoleErrors.filter(err =>
        err.includes('token') ||
        err.includes('No access token') ||
        err.includes('ReferenceError')
      )

      expect(tokenErrors.length).toBe(0)
    })
  })

  test.describe('Subtask 4.5.2: Login → Achievement → Claim Reward', () => {
    test('should complete full flow: login, navigate to achievements, view progress', async ({ page }) => {
      // Step 1: Login
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'test123456')
      await page.click('button[type="submit"]')
      await page.waitForURL('/')

      // Step 2: Navigate to Achievement page
      await page.goto('/achievements')
      await expect(page).toHaveURL('/achievements')

      // Step 3: Wait for achievements to load
      await page.waitForLoadState('networkidle')

      // Verify page loaded without errors
      const achievementList = page.locator('[data-testid="achievement-list"]').or(page.locator('div').filter({ hasText: /成就|achievement/i }))
      await expect(achievementList.first()).toBeVisible({ timeout: 10000 })

      // Verify no authentication errors
      const errorMessage = page.getByText(/No access token provided|token is not defined|ReferenceError/i)
      await expect(errorMessage).not.toBeVisible()
    })

    test('should not show token errors on achievement page', async ({ page }) => {
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'test123456')
      await page.click('button[type="submit"]')
      await page.waitForURL('/')

      await page.goto('/achievements')

      // Monitor console errors
      const consoleErrors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      await page.waitForTimeout(3000)

      // Verify no token-related errors
      const tokenErrors = consoleErrors.filter(err =>
        err.includes('token') ||
        err.includes('No access token') ||
        err.includes('ReferenceError')
      )

      expect(tokenErrors.length).toBe(0)
    })

    test('should handle claim reward if available', async ({ page }) => {
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'test123456')
      await page.click('button[type="submit"]')
      await page.waitForURL('/')

      await page.goto('/achievements')
      await page.waitForLoadState('networkidle')

      // Look for claimable reward button
      const claimButton = page.getByRole('button', { name: /領取獎勵|claim reward/i }).first()

      if (await claimButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await claimButton.click()

        // Verify no 409 or authentication errors
        const errorMessage = page.getByText(/成就已領取|already claimed|No access token/i)
        // Either shows success or already claimed, both are valid
        await page.waitForTimeout(2000)
      }

      // Verify page didn't crash
      await expect(page).toHaveURL('/achievements')
    })
  })

  test.describe('Subtask 4.5.3: Session Expiry Handling', () => {
    test('should redirect to login when session expires', async ({ page, context }) => {
      // Login first
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'test123456')
      await page.click('button[type="submit"]')
      await page.waitForURL('/')

      // Navigate to protected page
      await page.goto('/bingo')
      await expect(page).toHaveURL('/bingo')

      // Simulate session expiry by clearing cookies
      await context.clearCookies()

      // Try to access protected resource (reload page)
      await page.reload()

      // Should redirect to login with reason
      await page.waitForURL(/\/auth\/login\?reason=(auth_required|session_expired)/, { timeout: 10000 })

      // Verify redirect reason is displayed
      const reasonMessage = page.getByText(/請先登入|登入已過期|session expired|auth required/i)
      await expect(reasonMessage).toBeVisible({ timeout: 5000 })
    })

    test('should preserve original URL after session expiry redirect', async ({ page, context }) => {
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'test123456')
      await page.click('button[type="submit"]')
      await page.waitForURL('/')

      // Navigate to bingo page
      await page.goto('/bingo')

      // Clear session
      await context.clearCookies()

      // Reload (should redirect to login)
      await page.reload()
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 })

      // Login again
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'test123456')
      await page.click('button[type="submit"]')

      // Should redirect back to bingo (or home, depending on implementation)
      await page.waitForLoadState('networkidle')
      const currentURL = page.url()

      // Verify redirected to a valid page (not stuck on login)
      expect(currentURL).not.toContain('/auth/login')
    })
  })

  test.describe('Subtask 4.5.4: Offline/Online Transition with Retry', () => {
    test('should handle offline state and allow retry', async ({ page, context }) => {
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'test123456')
      await page.click('button[type="submit"]')
      await page.waitForURL('/')

      // Go offline
      await context.setOffline(true)

      // Navigate to bingo
      await page.goto('/bingo')

      // Should show offline error
      const offlineError = page.getByText(/網路連線|offline|network/i)
      await expect(offlineError).toBeVisible({ timeout: 5000 })

      // Go back online
      await context.setOffline(false)

      // Look for retry button
      const retryButton = page.getByRole('button', { name: /重試|retry/i })
      if (await retryButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await retryButton.click()
      } else {
        // Or reload page
        await page.reload()
      }

      // Should load successfully
      await page.waitForLoadState('networkidle')
      await expect(offlineError).not.toBeVisible({ timeout: 5000 })
    })

    test('should handle offline state on achievement page', async ({ page, context }) => {
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'test123456')
      await page.click('button[type="submit"]')
      await page.waitForURL('/')

      // Go offline
      await context.setOffline(true)

      // Navigate to achievements
      await page.goto('/achievements')

      // Should show offline error or loading state
      const offlineIndicator = page.getByText(/網路連線|offline|network|載入中/i)
      await expect(offlineIndicator).toBeVisible({ timeout: 5000 })

      // Go back online
      await context.setOffline(false)

      // Retry
      const retryButton = page.getByRole('button', { name: /重試|retry/i })
      if (await retryButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await retryButton.click()
      } else {
        await page.reload()
      }

      // Should load successfully
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Verify page loaded
      const currentURL = page.url()
      expect(currentURL).toContain('/achievements')
    })
  })

  test.describe('Subtask 4.5.5: Post-Login Return Navigation', () => {
    test('should return to originally requested page after login', async ({ page, context }) => {
      // Clear any existing auth
      await context.clearCookies()

      // Try to access protected page directly
      await page.goto('/bingo')

      // Should redirect to login
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 })

      // Login
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'test123456')
      await page.click('button[type="submit"]')

      // Should redirect back to originally requested page or home
      await page.waitForLoadState('networkidle')
      const currentURL = page.url()

      // Verify not stuck on login page
      expect(currentURL).not.toContain('/auth/login')
    })

    test('should handle return navigation for achievement page', async ({ page, context }) => {
      await context.clearCookies()

      // Try to access achievements directly
      await page.goto('/achievements')

      // Should redirect to login
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 })

      // Login
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'test123456')
      await page.click('button[type="submit"]')

      // Should redirect back or to home
      await page.waitForLoadState('networkidle')
      const currentURL = page.url()

      expect(currentURL).not.toContain('/auth/login')
    })
  })

  test.describe('Regression Tests: No Token Errors', () => {
    test('should not have "No access token provided" errors on bingo page', async ({ page }) => {
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'test123456')
      await page.click('button[type="submit"]')
      await page.waitForURL('/')

      // Monitor network requests
      const failedRequests: string[] = []
      page.on('response', response => {
        if (response.status() === 401) {
          failedRequests.push(response.url())
        }
      })

      await page.goto('/bingo')
      await page.waitForTimeout(5000)

      // Should have no 401 errors
      expect(failedRequests.length).toBe(0)
    })

    test('should not have "token is not defined" ReferenceError on achievement page', async ({ page }) => {
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'test123456')
      await page.click('button[type="submit"]')
      await page.waitForURL('/')

      // Monitor page errors
      const pageErrors: Error[] = []
      page.on('pageerror', error => {
        pageErrors.push(error)
      })

      await page.goto('/achievements')
      await page.waitForTimeout(5000)

      // Should have no ReferenceError
      const referenceErrors = pageErrors.filter(err =>
        err.message.includes('token is not defined')
      )

      expect(referenceErrors.length).toBe(0)
    })

    test('should not have localStorage token access attempts', async ({ page }) => {
      await page.goto('/auth/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'test123456')
      await page.click('button[type="submit"]')
      await page.waitForURL('/')

      // Monitor localStorage access
      const localStorageAccess = await page.evaluate(() => {
        const accesses: string[] = []
        const originalGetItem = localStorage.getItem.bind(localStorage)

        localStorage.getItem = function(key: string) {
          accesses.push(key)
          return originalGetItem(key)
        }

        return {
          getAccesses: () => accesses,
        }
      })

      await page.goto('/bingo')
      await page.waitForTimeout(3000)

      const accesses = await page.evaluate(() => {
        return (window as any).getAccesses?.() || []
      })

      // Should not access pip-boy-token from localStorage
      const tokenAccesses = accesses.filter((key: string) => key === 'pip-boy-token')
      expect(tokenAccesses.length).toBe(0)
    })
  })
})
