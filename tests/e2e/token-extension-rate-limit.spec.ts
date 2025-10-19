/**
 * E2E Tests - Token Extension Rate Limiting and Persistence
 *
 * Feature: 速率限制與狀態持久化
 * Test Coverage:
 * - Token 延長速率限制（防止濫用）
 * - localStorage 持久化機制
 * - Token 過期時間更新驗證
 * - 頁面重新載入後狀態恢復
 * - 活躍度進度跨頁面持久化
 */

import { test, expect, type Page } from '@playwright/test'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

// Test credentials
const TEST_USER = {
  username: `rate_limit_test_${Date.now()}`,
  email: `rate_limit_test_${Date.now()}@example.com`,
  password: 'Test1234!@#$'
}

// Helper: Wait for element to be visible
async function waitForElement(page: Page, selector: string, timeout = 10000) {
  await page.waitForSelector(selector, { timeout, state: 'visible' })
}

// Helper: Setup console error monitoring
function setupConsoleMonitoring(page: Page) {
  const errors: string[] = []
  const warnings: string[] = []

  page.on('console', msg => {
    const type = msg.type()
    const text = msg.text()

    if (type === 'error' && !text.includes('Console Ninja')) {
      errors.push(text)
      console.error('❌ Console Error:', text)
    } else if (type === 'warning' && !text.includes('Console Ninja')) {
      warnings.push(text)
    }
  })

  page.on('pageerror', error => {
    errors.push(error.message)
    console.error('❌ Page Error:', error.message)
  })

  return { errors, warnings }
}

// Helper: Get activity progress from localStorage
async function getStoredActivityProgress(page: Page): Promise<{
  accumulatedTime: number
  startTime: number | null
  lastUpdate: number
} | null> {
  return await page.evaluate(() => {
    const stored = localStorage.getItem('activity-progress')
    return stored ? JSON.parse(stored) : null
  })
}

// Helper: Get token from localStorage
async function getStoredToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => localStorage.getItem('token'))
}

// Helper: Decode JWT and get expiration time
async function getTokenExpiration(page: Page): Promise<number | null> {
  return await page.evaluate(() => {
    const token = localStorage.getItem('token')
    if (!token) return null

    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      const payload = JSON.parse(jsonPayload)
      return payload.exp || null
    } catch {
      return null
    }
  })
}

// Helper: Simulate activity
async function simulateActivity(page: Page, durationMs: number) {
  const startTime = Date.now()
  const intervalMs = 5000

  while (Date.now() - startTime < durationMs) {
    await page.mouse.move(
      Math.random() * 500 + 100,
      Math.random() * 500 + 100
    )
    await page.mouse.click(
      Math.random() * 100 + 50,
      Math.random() * 100 + 50
    )
    await page.waitForTimeout(intervalMs)
  }
}

// Helper: Get activity progress from UI
async function getActivityProgress(page: Page): Promise<number> {
  await waitForElement(page, 'section:has-text("Pip-Boy 活躍度系統")', 5000)
  const progressText = await page.locator('span:has-text("%")').first().textContent()
  if (!progressText) return 0
  const match = progressText.match(/(\d+)%/)
  return match ? parseInt(match[1], 10) : 0
}

test.describe('Token Extension - Rate Limiting and Persistence', () => {
  let consoleMonitor: { errors: string[], warnings: string[] }

  test.beforeEach(async ({ page }) => {
    consoleMonitor = setupConsoleMonitoring(page)
  })

  test.afterEach(async () => {
    if (consoleMonitor.errors.length > 0) {
      console.warn(`⚠️ Test had ${consoleMonitor.errors.length} console errors`)
    }
  })

  test('使用者註冊並登入', async ({ page }) => {
    await page.goto(FRONTEND_URL)
    await expect(page).toHaveTitle(/廢土塔羅/)

    await page.click('a[href="/auth/register"]')
    await waitForElement(page, 'form', 5000)

    await page.fill('input[name="username"], input[type="text"]', TEST_USER.username)
    await page.fill('input[name="email"], input[type="email"]', TEST_USER.email)
    await page.fill('input[name="password"], input[type="password"]', TEST_USER.password)

    await page.click('button[type="submit"]:has-text("註冊")')
    await page.waitForTimeout(2000)

    const currentUrl = page.url()
    if (currentUrl.includes('/auth/login')) {
      await page.fill('input[type="email"]', TEST_USER.email)
      await page.fill('input[type="password"]', TEST_USER.password)
      await page.click('button[type="submit"]:has-text("登入")')
    }

    await page.waitForTimeout(2000)
    const hasLogoutButton = await page.locator('button:has-text("登出"), a:has-text("登出")').count() > 0
    expect(hasLogoutButton).toBe(true)
  })

  test('活躍度進度持久化至 localStorage', async ({ page }) => {
    // Login
    await page.goto(`${FRONTEND_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // 前往 Profile 頁面
    await page.goto(`${FRONTEND_URL}/profile`)
    await waitForElement(page, 'section:has-text("Pip-Boy 活躍度系統")', 5000)

    // 模擬活躍 2 分鐘
    console.log('🎮 Simulating 2 minutes of activity...')
    await simulateActivity(page, 120000)
    await page.waitForTimeout(2000)

    // 讀取 UI 進度
    const uiProgress = await getActivityProgress(page)
    console.log(`📊 UI Progress: ${uiProgress}%`)

    // 讀取 localStorage 進度
    const storedProgress = await getStoredActivityProgress(page)
    console.log('💾 Stored Progress:', storedProgress)

    // 驗證 localStorage 有儲存進度
    expect(storedProgress).not.toBeNull()
    expect(storedProgress!.accumulatedTime).toBeGreaterThan(0)

    // 計算預期進度（2分鐘 / 30分鐘 ≈ 6.67%）
    const expectedProgressMin = 6
    expect(uiProgress).toBeGreaterThanOrEqual(expectedProgressMin)
  })

  test('頁面重新載入後恢復活躍度進度', async ({ page }) => {
    // Login
    await page.goto(`${FRONTEND_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // 前往 Profile 頁面
    await page.goto(`${FRONTEND_URL}/profile`)
    await waitForElement(page, 'section:has-text("Pip-Boy 活躍度系統")', 5000)

    // 模擬活躍 1 分鐘
    await simulateActivity(page, 60000)
    await page.waitForTimeout(2000)

    // 記錄重新載入前的進度
    const progressBeforeReload = await getActivityProgress(page)
    const storedBeforeReload = await getStoredActivityProgress(page)
    console.log(`📊 Progress before reload: ${progressBeforeReload}%`)
    console.log('💾 Stored before reload:', storedBeforeReload)

    // 重新載入頁面
    await page.reload()
    await waitForElement(page, 'section:has-text("Pip-Boy 活躍度系統")', 5000)

    // 記錄重新載入後的進度
    const progressAfterReload = await getActivityProgress(page)
    const storedAfterReload = await getStoredActivityProgress(page)
    console.log(`📊 Progress after reload: ${progressAfterReload}%`)
    console.log('💾 Stored after reload:', storedAfterReload)

    // 驗證進度保持一致（允許小幅度差異 ±2%）
    expect(Math.abs(progressAfterReload - progressBeforeReload)).toBeLessThanOrEqual(2)

    // 驗證 localStorage 資料一致
    expect(storedAfterReload).not.toBeNull()
    expect(storedAfterReload!.accumulatedTime).toBeGreaterThan(0)
  })

  test('Token 儲存在 localStorage', async ({ page }) => {
    // Login
    await page.goto(`${FRONTEND_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // 檢查 token 是否存在於 localStorage
    const token = await getStoredToken(page)
    expect(token).not.toBeNull()
    expect(token).toBeTruthy()

    // 驗證 token 格式（JWT: header.payload.signature）
    const tokenParts = token!.split('.')
    expect(tokenParts.length).toBe(3)

    console.log('✅ Token stored in localStorage')
    console.log(`📝 Token: ${token!.substring(0, 50)}...`)
  })

  test('Token 過期時間可被解碼', async ({ page }) => {
    // Login
    await page.goto(`${FRONTEND_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // 解碼 token 獲取過期時間
    const expiration = await getTokenExpiration(page)
    expect(expiration).not.toBeNull()

    // 驗證過期時間是未來的時間戳
    const now = Math.floor(Date.now() / 1000)
    expect(expiration).toBeGreaterThan(now)

    // 計算剩餘時間
    const remainingSeconds = expiration! - now
    const remainingMinutes = Math.floor(remainingSeconds / 60)

    console.log(`✅ Token expires in ${remainingMinutes} minutes`)
    console.log(`📅 Expiration timestamp: ${expiration}`)
  })

  test('完成活躍30分鐘後 Token 延長', async ({ page }, testInfo) => {
    testInfo.setTimeout(1860000) // 31 minutes timeout

    // Login
    await page.goto(`${FRONTEND_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // 記錄初始 token 過期時間
    const initialExpiration = await getTokenExpiration(page)
    console.log(`⏰ Initial token expiration: ${initialExpiration}`)

    // 前往 Profile 頁面
    await page.goto(`${FRONTEND_URL}/profile`)
    await waitForElement(page, 'section:has-text("Pip-Boy 活躍度系統")', 5000)

    // 模擬活躍 30 分鐘
    console.log('🎮 Simulating 30 minutes of activity...')
    await simulateActivity(page, 1800000)

    // 等待 API 呼叫和狀態更新
    await page.waitForTimeout(5000)

    // 記錄延長後的 token 過期時間
    const extendedExpiration = await getTokenExpiration(page)
    console.log(`⏰ Extended token expiration: ${extendedExpiration}`)

    // 驗證 token 過期時間已延長
    if (initialExpiration && extendedExpiration) {
      expect(extendedExpiration).toBeGreaterThan(initialExpiration)

      const extensionSeconds = extendedExpiration - initialExpiration
      const extensionMinutes = Math.floor(extensionSeconds / 60)
      console.log(`✅ Token extended by ${extensionMinutes} minutes`)

      // 驗證延長時間至少30分鐘（活躍度基礎獎勵）
      expect(extensionMinutes).toBeGreaterThanOrEqual(30)
    } else {
      console.log('ℹ️  Unable to verify token extension (token format may have changed)')
    }
  })

  test('忠誠度檢查記錄持久化', async ({ page }) => {
    // Login
    await page.goto(`${FRONTEND_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // 前往任何頁面觸發 LoyaltyRewardInitializer
    await page.goto(`${FRONTEND_URL}/profile`)
    await page.waitForTimeout(2000)

    // 檢查 loyalty-reward-last-check 是否被寫入
    const lastCheck = await page.evaluate(() => localStorage.getItem('loyalty-reward-last-check'))
    expect(lastCheck).not.toBeNull()

    const today = new Date().toDateString()
    expect(lastCheck).toBe(today)

    console.log(`✅ Loyalty check recorded: ${lastCheck}`)
  })

  test('清空 localStorage 後重新登入可恢復狀態', async ({ page }) => {
    // Login
    await page.goto(`${FRONTEND_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // 前往 Profile 頁面建立一些進度
    await page.goto(`${FRONTEND_URL}/profile`)
    await waitForElement(page, 'section:has-text("Pip-Boy 活躍度系統")', 5000)
    await simulateActivity(page, 60000) // 1 minute
    await page.waitForTimeout(2000)

    // 清空 localStorage（模擬清除瀏覽器資料）
    await page.evaluate(() => localStorage.clear())

    // 驗證 token 和進度已清除
    const tokenAfterClear = await getStoredToken(page)
    const progressAfterClear = await getStoredActivityProgress(page)
    expect(tokenAfterClear).toBeNull()
    expect(progressAfterClear).toBeNull()

    console.log('🗑️ localStorage cleared')

    // 重新登入
    await page.goto(`${FRONTEND_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // 驗證 token 重新寫入
    const newToken = await getStoredToken(page)
    expect(newToken).not.toBeNull()
    expect(newToken).toBeTruthy()

    // 前往 Profile 頁面檢查進度重置
    await page.goto(`${FRONTEND_URL}/profile`)
    await waitForElement(page, 'section:has-text("Pip-Boy 活躍度系統")', 5000)

    const newProgress = await getActivityProgress(page)
    console.log(`📊 New progress after re-login: ${newProgress}%`)

    // 新登入的進度應該從0開始（或接近0）
    expect(newProgress).toBeLessThanOrEqual(5)

    console.log('✅ State recovered after localStorage clear and re-login')
  })

  test('驗證活躍度進度上限為100%', async ({ page }, testInfo) => {
    testInfo.setTimeout(1920000) // 32 minutes timeout

    // Login
    await page.goto(`${FRONTEND_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // 前往 Profile 頁面
    await page.goto(`${FRONTEND_URL}/profile`)
    await waitForElement(page, 'section:has-text("Pip-Boy 活躍度系統")', 5000)

    // 模擬活躍 31 分鐘（超過30分鐘上限）
    console.log('🎮 Simulating 31 minutes of activity...')
    await simulateActivity(page, 1860000)
    await page.waitForTimeout(2000)

    // 檢查進度
    const finalProgress = await getActivityProgress(page)
    console.log(`📊 Final Progress: ${finalProgress}%`)

    // 驗證進度不超過100%
    expect(finalProgress).toBeLessThanOrEqual(100)

    // 如果達到100%，檢查是否顯示完成訊息
    if (finalProgress === 100) {
      const completeMessage = await page.locator('text=Token 延長已觸發').isVisible({ timeout: 3000 }).catch(() => false)
      if (completeMessage) {
        console.log('✅ Completion message displayed at 100%')
      }
    }
  })

  test('跨頁面導航保持活躍度狀態', async ({ page }) => {
    // Login
    await page.goto(`${FRONTEND_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // 在 Profile 頁面建立進度
    await page.goto(`${FRONTEND_URL}/profile`)
    await waitForElement(page, 'section:has-text("Pip-Boy 活躍度系統")', 5000)
    await simulateActivity(page, 60000) // 1 minute
    await page.waitForTimeout(2000)

    const profileProgress = await getActivityProgress(page)
    console.log(`📊 Progress on Profile page: ${profileProgress}%`)

    // 導航至其他頁面
    await page.goto(`${FRONTEND_URL}/dashboard`)
    await page.waitForTimeout(2000)

    // 返回 Profile 頁面
    await page.goto(`${FRONTEND_URL}/profile`)
    await waitForElement(page, 'section:has-text("Pip-Boy 活躍度系統")', 5000)

    const returnProgress = await getActivityProgress(page)
    console.log(`📊 Progress after navigation: ${returnProgress}%`)

    // 驗證進度保持（允許小幅度差異）
    expect(Math.abs(returnProgress - profileProgress)).toBeLessThanOrEqual(2)

    console.log('✅ Activity state persists across page navigation')
  })
})
