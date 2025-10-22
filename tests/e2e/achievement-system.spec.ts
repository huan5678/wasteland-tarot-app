/**
 * Achievement System E2E Tests
 * 成就系統端對端測試
 *
 * Tests:
 * - Achievement page display
 * - Achievement unlock notifications
 * - Reward claiming flow
 * - Category filtering
 * - Complete reading → achievement unlock flow
 */

import { test, expect, type Page } from '@playwright/test'

const FRONTEND_URL = 'http://localhost:3000'
const BACKEND_URL = 'http://localhost:8000'

// Test credentials
const TEST_USER = {
  username: `test_achievement_${Date.now()}`,
  email: `test_ach_${Date.now()}@example.com`,
  password: 'Test1234!@#$'
}

// Helper: Wait for element
async function waitForElement(page: Page, selector: string, timeout = 10000) {
  await page.waitForSelector(selector, { timeout, state: 'visible' })
}

// Helper: Console monitoring
function setupConsoleMonitoring(page: Page) {
  const errors: string[] = []
  const warnings: string[] = []

  page.on('console', msg => {
    const type = msg.type()
    const text = msg.text()

    if (type === 'error') {
      errors.push(text)
      console.error('❌ Console Error:', text)
    } else if (type === 'warning') {
      warnings.push(text)
    }
  })

  page.on('pageerror', error => {
    errors.push(error.message)
    console.error('❌ Page Error:', error.message)
  })

  return { errors, warnings }
}

// Helper: Login helper
async function loginUser(page: Page) {
  await page.goto(`${FRONTEND_URL}/login`)

  // Fill login form
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)

  // Submit
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard or home
  await page.waitForURL(/\/(dashboard|home)/, { timeout: 10000 })
}

test.describe('Achievement System E2E Tests', () => {
  let consoleMonitor: { errors: string[], warnings: string[] }

  test.beforeEach(async ({ page }) => {
    consoleMonitor = setupConsoleMonitoring(page)
  })

  test.afterEach(async () => {
    // Report console errors
    if (consoleMonitor.errors.length > 0) {
      console.warn(`⚠️ Test generated ${consoleMonitor.errors.length} console errors`)
    }
  })

  // ===== Test 16.1.1: Access Achievement Page =====

  test('should display achievement page with all achievements', async ({ page }) => {
    // Register and login
    await page.goto(`${FRONTEND_URL}/register`)

    // Fill registration form
    await page.fill('input[name="username"]', TEST_USER.username)
    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[name="password"]', TEST_USER.password)
    await page.fill('input[name="confirmPassword"]', TEST_USER.password)

    // Submit
    await page.click('button[type="submit"]')

    // Wait for registration success and auto-login
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 15000 })

    // Navigate to achievements page
    await page.goto(`${FRONTEND_URL}/achievements`)

    // Wait for page load
    await waitForElement(page, '[data-testid="achievement-grid"]', 10000)

    // Verify achievement cards are displayed
    const achievementCards = await page.locator('[data-testid="achievement-card"]').count()
    expect(achievementCards).toBeGreaterThan(0)

    // Verify summary section
    await expect(page.locator('[data-testid="achievement-summary"]')).toBeVisible()

    // Verify total achievements displayed
    const totalText = await page.locator('[data-testid="total-achievements"]').textContent()
    expect(totalText).toContain('15') // 15 initial achievements
  })

  // ===== Test 16.1.2: Category Filter =====

  test('should filter achievements by category', async ({ page }) => {
    // Login (user should already be registered from previous test)
    await loginUser(page)

    // Navigate to achievements page
    await page.goto(`${FRONTEND_URL}/achievements`)

    // Wait for page load
    await waitForElement(page, '[data-testid="achievement-grid"]')

    // Click category filter button
    await page.click('[data-testid="category-filter-READING"]')

    // Wait for filter to apply
    await page.waitForTimeout(500)

    // Verify only reading category achievements are shown
    const achievementCards = page.locator('[data-testid="achievement-card"]')
    const count = await achievementCards.count()

    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThanOrEqual(10) // Not all 15 achievements

    // Verify all visible cards are reading category
    for (let i = 0; i < count; i++) {
      const card = achievementCards.nth(i)
      const category = await card.getAttribute('data-category')
      expect(category).toBe('READING')
    }
  })

  // ===== Test 16.1.3: Achievement Detail Modal =====

  test('should open achievement detail modal on click', async ({ page }) => {
    await loginUser(page)

    await page.goto(`${FRONTEND_URL}/achievements`)
    await waitForElement(page, '[data-testid="achievement-grid"]')

    // Click on first achievement card
    const firstCard = page.locator('[data-testid="achievement-card"]').first()
    await firstCard.click()

    // Wait for modal to appear
    await waitForElement(page, '[data-testid="achievement-detail-modal"]', 5000)

    // Verify modal content
    await expect(page.locator('[data-testid="achievement-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="achievement-description"]')).toBeVisible()
    await expect(page.locator('[data-testid="achievement-criteria"]')).toBeVisible()
    await expect(page.locator('[data-testid="achievement-rewards"]')).toBeVisible()

    // Close modal
    await page.click('[data-testid="close-modal-button"]')

    // Verify modal is closed
    await expect(page.locator('[data-testid="achievement-detail-modal"]')).not.toBeVisible()
  })

  // ===== Test 16.2.1: Complete Reading → Achievement Unlock Flow =====

  test('should unlock achievement after completing first reading', async ({ page }) => {
    // Register new user
    const newUser = {
      username: `test_reading_${Date.now()}`,
      email: `test_reading_${Date.now()}@example.com`,
      password: 'Test1234!@#$'
    }

    await page.goto(`${FRONTEND_URL}/register`)

    await page.fill('input[name="username"]', newUser.username)
    await page.fill('input[name="email"]', newUser.email)
    await page.fill('input[name="password"]', newUser.password)
    await page.fill('input[name="confirmPassword"]', newUser.password)

    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|home)/, { timeout: 15000 })

    // Navigate to readings page
    await page.goto(`${FRONTEND_URL}/readings/new`)

    // Fill reading form
    await page.fill('textarea[name="question"]', 'What should I focus on today?')

    // Select spread template
    await page.click('[data-testid="spread-template-selector"]')
    await page.click('[data-testid="spread-template-three-card"]')

    // Select character voice
    await page.click('[data-testid="character-voice-selector"]')
    await page.click('[data-testid="character-voice-pip-boy"]')

    // Submit reading
    await page.click('button[type="submit"]')

    // Wait for reading completion
    await page.waitForURL(/\/readings\/.*/, { timeout: 20000 })

    // Wait for achievement unlock notification (may appear)
    try {
      await waitForElement(page, '[data-testid="achievement-unlock-notification"]', 5000)

      // Verify notification content
      const notificationText = await page.locator('[data-testid="achievement-name"]').textContent()
      expect(notificationText).toContain('廢土新手') // "FIRST_READING" achievement

      // Click "Claim Reward" button
      await page.click('[data-testid="claim-reward-button"]')

      // Wait for success message
      await waitForElement(page, '[data-testid="claim-success-message"]', 3000)

    } catch (error) {
      console.log('ℹ️ Achievement notification not shown (may be processed in background)')
    }

    // Navigate to achievements page to verify
    await page.goto(`${FRONTEND_URL}/achievements`)
    await waitForElement(page, '[data-testid="achievement-grid"]')

    // Find "FIRST_READING" achievement
    const firstReadingCard = page.locator('[data-testid="achievement-card"][data-code="FIRST_READING"]')

    // Verify it's unlocked
    const status = await firstReadingCard.getAttribute('data-status')
    expect(status).toMatch(/UNLOCKED|CLAIMED/)

    // Verify progress is 100%
    const progress = await firstReadingCard.locator('[data-testid="progress-percentage"]').textContent()
    expect(progress).toContain('100%')
  })

  // ===== Test 16.1.4: Reward Claiming =====

  test('should claim reward for unlocked achievement', async ({ page }) => {
    await loginUser(page)

    await page.goto(`${FRONTEND_URL}/achievements`)
    await waitForElement(page, '[data-testid="achievement-grid"]')

    // Find an unlocked achievement
    const unlockedCard = page.locator('[data-testid="achievement-card"][data-status="UNLOCKED"]').first()

    // Check if there's any unlocked achievement
    const count = await page.locator('[data-testid="achievement-card"][data-status="UNLOCKED"]').count()

    if (count === 0) {
      console.log('ℹ️ No unlocked achievements available for claiming test')
      test.skip()
      return
    }

    // Click to open detail
    await unlockedCard.click()

    await waitForElement(page, '[data-testid="achievement-detail-modal"]')

    // Click claim reward button
    await page.click('[data-testid="claim-reward-button"]')

    // Wait for claim success
    await waitForElement(page, '[data-testid="claim-success-message"]', 5000)

    // Verify reward details displayed
    await expect(page.locator('[data-testid="reward-karma-points"]')).toBeVisible()

    // Close modal
    await page.click('[data-testid="close-modal-button"]')

    // Verify card status updated to CLAIMED
    await page.waitForTimeout(1000) // Wait for UI update

    const cardStatus = await page.locator('[data-testid="achievement-card"][data-code="*"]').first().getAttribute('data-status')
    expect(cardStatus).toBe('CLAIMED')
  })

  // ===== Test 16.1.5: Search Functionality =====

  test('should search achievements by name', async ({ page }) => {
    await loginUser(page)

    await page.goto(`${FRONTEND_URL}/achievements`)
    await waitForElement(page, '[data-testid="achievement-grid"]')

    // Type in search box
    await page.fill('[data-testid="achievement-search-input"]', '廢土')

    // Wait for search to filter
    await page.waitForTimeout(500)

    // Verify filtered results
    const cards = page.locator('[data-testid="achievement-card"]')
    const count = await cards.count()

    expect(count).toBeGreaterThan(0)

    // Verify all visible cards contain search term
    for (let i = 0; i < count; i++) {
      const cardName = await cards.nth(i).locator('[data-testid="achievement-name"]').textContent()
      expect(cardName).toContain('廢土')
    }
  })

  // ===== Test Error Handling =====

  test('should handle network errors gracefully', async ({ page }) => {
    await loginUser(page)

    // Navigate to achievements page
    await page.goto(`${FRONTEND_URL}/achievements`)

    // Wait for initial load
    await waitForElement(page, '[data-testid="achievement-grid"]')

    // Simulate network failure by blocking API requests
    await page.route('**/api/achievements/**', route => route.abort())

    // Try to refresh page
    await page.reload()

    // Verify error message is shown
    await waitForElement(page, '[data-testid="error-message"]', 5000)

    const errorText = await page.locator('[data-testid="error-message"]').textContent()
    expect(errorText).toMatch(/錯誤|error|failed/i)
  })
})

// ===== Performance Tests =====

test.describe('Achievement System Performance', () => {

  test('should load achievement page within 3 seconds', async ({ page }) => {
    // Login first
    await page.goto(`${FRONTEND_URL}/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|home)/)

    // Measure page load time
    const startTime = Date.now()

    await page.goto(`${FRONTEND_URL}/achievements`)
    await waitForElement(page, '[data-testid="achievement-grid"]')

    const loadTime = Date.now() - startTime

    console.log(`⏱️ Page load time: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
  })
})
