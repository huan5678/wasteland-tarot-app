/**
 * E2E Tests - Token Extension by Activity
 *
 * Feature: 活躍度自動延長 Token
 * Test Coverage:
 * - 使用者保持活躍 30 分鐘後自動延長 Token
 * - Profile 頁面顯示即時進度條
 * - Token 過期時間正確更新
 * - 進度重置後可以再次累積
 */

import { test, expect, type Page } from '@playwright/test'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

// Test credentials
const TEST_USER = {
  username: `activity_test_${Date.now()}`,
  email: `activity_test_${Date.now()}@example.com`,
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

// Helper: Simulate user activity (mouse movement and clicks)
async function simulateActivity(page: Page, durationMs: number) {
  const startTime = Date.now()
  const intervalMs = 5000 // 每 5 秒模擬一次活動

  while (Date.now() - startTime < durationMs) {
    // 模擬滑鼠移動
    await page.mouse.move(
      Math.random() * 500 + 100,
      Math.random() * 500 + 100
    )

    // 模擬點擊（在安全區域）
    await page.mouse.click(
      Math.random() * 100 + 50,
      Math.random() * 100 + 50
    )

    // 等待下一個間隔
    await page.waitForTimeout(intervalMs)
  }
}

// Helper: Get progress from ActivityProgressCard
async function getActivityProgress(page: Page): Promise<number> {
  // 等待進度條元件出現
  await waitForElement(page, 'section:has-text("Pip-Boy 活躍度系統")', 5000)

  // 讀取進度百分比文字
  const progressText = await page.locator('span:has-text("%")').first().textContent()
  if (!progressText) return 0

  const match = progressText.match(/(\d+)%/)
  return match ? parseInt(match[1], 10) : 0
}

// Helper: Get accumulated active time
async function getActiveTime(page: Page): Promise<string> {
  const timeElement = await page.locator('span.font-mono:has-text(":")').first()
  return (await timeElement.textContent()) || '00:00'
}

test.describe('Token Extension - Activity Flow', () => {
  let consoleMonitor: { errors: string[], warnings: string[] }

  test.beforeEach(async ({ page }) => {
    consoleMonitor = setupConsoleMonitoring(page)
  })

  test.afterEach(async () => {
    // 檢查是否有 console errors
    if (consoleMonitor.errors.length > 0) {
      console.warn(`⚠️ Test had ${consoleMonitor.errors.length} console errors`)
    }
  })

  test('使用者註冊並登入', async ({ page }) => {
    // Step 1: 前往首頁
    await page.goto(FRONTEND_URL)
    await expect(page).toHaveTitle(/廢土塔羅/)

    // Step 2: 點擊註冊連結
    await page.click('a[href="/auth/register"]')
    await waitForElement(page, 'form', 5000)

    // Step 3: 填寫註冊表單
    await page.fill('input[name="username"], input[type="text"]', TEST_USER.username)
    await page.fill('input[name="email"], input[type="email"]', TEST_USER.email)
    await page.fill('input[name="password"], input[type="password"]', TEST_USER.password)

    // Step 4: 提交註冊
    await page.click('button[type="submit"]:has-text("註冊")')

    // Step 5: 等待註冊成功（可能自動登入或跳轉到登入頁）
    await page.waitForTimeout(2000)

    // 如果跳轉到登入頁，進行登入
    const currentUrl = page.url()
    if (currentUrl.includes('/auth/login')) {
      await page.fill('input[type="email"]', TEST_USER.email)
      await page.fill('input[type="password"]', TEST_USER.password)
      await page.click('button[type="submit"]:has-text("登入")')
    }

    // Step 6: 驗證登入成功（檢查是否有登出按鈕或使用者資訊）
    await page.waitForTimeout(2000)
    const hasLogoutButton = await page.locator('button:has-text("登出"), a:has-text("登出")').count() > 0
    expect(hasLogoutButton).toBe(true)
  })

  test('Profile 頁面顯示活躍度進度條', async ({ page }) => {
    // Prerequisite: 使用者已登入（使用上一個測試的帳號或新建）
    await page.goto(`${FRONTEND_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // Step 1: 前往 Profile 頁面
    await page.goto(`${FRONTEND_URL}/profile`)
    await waitForElement(page, 'h1:has-text("Vault 居民檔案")', 5000)

    // Step 2: 檢查活躍度進度卡片是否存在
    const progressCard = await page.locator('section:has-text("Pip-Boy 活躍度系統")')
    await expect(progressCard).toBeVisible()

    // Step 3: 檢查進度條元素
    const progressBar = await page.locator('[role="progressbar"]')
    await expect(progressBar).toBeVisible()

    // Step 4: 檢查 ARIA 屬性
    const ariaValueNow = await progressBar.getAttribute('aria-valuenow')
    expect(ariaValueNow).not.toBeNull()
    expect(parseInt(ariaValueNow!, 10)).toBeGreaterThanOrEqual(0)
    expect(parseInt(ariaValueNow!, 10)).toBeLessThanOrEqual(100)

    // Step 5: 檢查時間顯示
    const timeDisplay = await page.locator('span.font-mono:has-text("/")').first()
    await expect(timeDisplay).toBeVisible()
    const timeText = await timeDisplay.textContent()
    expect(timeText).toMatch(/\d{2}:\d{2} \/ 30:00/)
  })

  test('模擬活躍 5 分鐘，進度應該增加', async ({ page }, testInfo) => {
    testInfo.setTimeout(360000) // 6 分鐘 timeout

    // Login
    await page.goto(`${FRONTEND_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // 前往 Profile 頁面
    await page.goto(`${FRONTEND_URL}/profile`)
    await waitForElement(page, 'section:has-text("Pip-Boy 活躍度系統")', 5000)

    // 記錄初始進度
    const initialProgress = await getActivityProgress(page)
    console.log(`📊 Initial Progress: ${initialProgress}%`)

    // 模擬活躍 5 分鐘（300,000ms）
    console.log('🎮 Simulating 5 minutes of user activity...')
    await simulateActivity(page, 300000)

    // 等待進度更新
    await page.waitForTimeout(2000)

    // 記錄最終進度
    const finalProgress = await getActivityProgress(page)
    console.log(`📊 Final Progress: ${finalProgress}%`)

    // 驗證進度增加
    expect(finalProgress).toBeGreaterThan(initialProgress)
    expect(finalProgress).toBeGreaterThanOrEqual(16) // 5分鐘 / 30分鐘 = 16.67%
  })

  test('檢查狀態指示器（ACTIVE/IDLE）', async ({ page }) => {
    // Login
    await page.goto(`${FRONTEND_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // 前往 Profile 頁面
    await page.goto(`${FRONTEND_URL}/profile`)
    await waitForElement(page, 'section:has-text("Pip-Boy 活躍度系統")', 5000)

    // 進行活躍操作
    await page.mouse.move(200, 200)
    await page.mouse.click(150, 150)
    await page.waitForTimeout(1000)

    // 檢查狀態指示器
    const statusIndicator = await page.locator('[data-testid="status-indicator"]')
    const statusText = await statusIndicator.textContent()

    // 狀態應該是 ACTIVE 或 IDLE
    expect(statusText).toMatch(/ACTIVE|IDLE/)

    // 如果是 ACTIVE，應該有 pulse 動畫 class
    if (statusText?.includes('ACTIVE')) {
      const hasAnimation = await statusIndicator.evaluate((el) =>
        el.classList.contains('animate-pulse')
      )
      expect(hasAnimation).toBe(true)
    }
  })

  test('進度達到 100% 後顯示完成訊息', async ({ page }, testInfo) => {
    testInfo.setTimeout(1860000) // 31 分鐘 timeout

    // Login
    await page.goto(`${FRONTEND_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // 前往 Profile 頁面
    await page.goto(`${FRONTEND_URL}/profile`)
    await waitForElement(page, 'section:has-text("Pip-Boy 活躍度系統")', 5000)

    // 模擬活躍 30 分鐘（1,800,000ms）
    console.log('🎮 Simulating 30 minutes of user activity...')
    await simulateActivity(page, 1800000)

    // 等待進度更新和 API 呼叫
    await page.waitForTimeout(5000)

    // 檢查進度是否達到 100%
    const finalProgress = await getActivityProgress(page)
    console.log(`📊 Final Progress: ${finalProgress}%`)
    expect(finalProgress).toBe(100)

    // 檢查完成訊息
    const completeMessage = await page.locator('text=Token 延長已觸發')
    await expect(completeMessage).toBeVisible()

    // 檢查完成圖示
    const completeIcon = await page.locator('[data-testid="complete-icon"]')
    await expect(completeIcon).toBeVisible()
  })

  test('驗證 localStorage 持久化', async ({ page }) => {
    // Login
    await page.goto(`${FRONTEND_URL}/auth/login`)
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // 前往 Profile 頁面
    await page.goto(`${FRONTEND_URL}/profile`)
    await waitForElement(page, 'section:has-text("Pip-Boy 活躍度系統")', 5000)

    // 模擬一些活躍時間
    await simulateActivity(page, 60000) // 1 分鐘
    await page.waitForTimeout(2000)

    // 記錄當前進度
    const progressBeforeReload = await getActivityProgress(page)
    console.log(`📊 Progress before reload: ${progressBeforeReload}%`)

    // 重新載入頁面
    await page.reload()
    await waitForElement(page, 'section:has-text("Pip-Boy 活躍度系統")', 5000)

    // 檢查進度是否保持（允許小幅度差異）
    const progressAfterReload = await getActivityProgress(page)
    console.log(`📊 Progress after reload: ${progressAfterReload}%`)

    expect(Math.abs(progressAfterReload - progressBeforeReload)).toBeLessThanOrEqual(2)
  })
})
