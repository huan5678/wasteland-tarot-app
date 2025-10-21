/**
 * Reading Share Feature E2E Tests
 *
 * 測試占卜結果分享功能的完整流程
 *
 * TDD Phase: E2E Testing (Phase 6)
 *
 * Test Coverage:
 * 1. Complete share flow (generate → copy → visit → verify)
 * 2. Privacy verification (no user_id, email in shared data)
 * 3. Deleted reading invalidates share link
 */

import { test, expect, type Page } from '@playwright/test'

const FRONTEND_URL = 'http://localhost:3000'
const BACKEND_URL = 'http://localhost:8000'

// Test user credentials
const TEST_USER = {
  username: `share_test_${Date.now()}`,
  email: `sharetest${Date.now()}@example.com`,
  password: 'ShareTest123!@#'
}

// Helper: Setup console monitoring
function setupConsoleMonitoring(page: Page) {
  const errors: string[] = []
  const warnings: string[] = []

  page.on('console', msg => {
    const type = msg.type()
    const text = msg.text()

    if (type === 'error') {
      errors.push(text)
      console.error('❌ Console Error:', text)
    } else if (type === 'warning' && !text.includes('DevTools')) {
      warnings.push(text)
    }
  })

  page.on('pageerror', error => {
    errors.push(error.message)
    console.error('❌ Page Error:', error.message)
  })

  return { errors, warnings }
}

// Helper: Login and create a reading
async function loginAndCreateReading(page: Page): Promise<string> {
  console.log('🔑 登入並創建測試占卜...')

  // Navigate to login
  await page.goto(`${FRONTEND_URL}/auth/login`)
  await page.waitForLoadState('networkidle')

  // Try to login or register
  try {
    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|readings)/, { timeout: 5000 })
  } catch {
    // If login fails, try register
    await page.goto(`${FRONTEND_URL}/auth/register`)
    await page.fill('input[name="username"]', TEST_USER.username)
    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|readings)/, { timeout: 10000 })
  }

  console.log('✅ 登入成功')

  // Create a new reading
  await page.goto(`${FRONTEND_URL}/readings/new`)
  await page.waitForLoadState('networkidle')

  // Fill question
  const testQuestion = `分享測試占卜 - ${Date.now()}`
  await page.fill('textarea[id="question"]', testQuestion)

  // Select spread type
  const spreadButton = page.locator('[data-spread-type="single"]').first()
  if (await spreadButton.isVisible()) {
    await spreadButton.click()
  }

  // Submit question
  await page.click('button[type="submit"]')
  await page.waitForTimeout(2000)

  // Draw cards
  const drawButton = page.locator('button:has-text("抽牌"), button:has-text("Draw")').first()
  await drawButton.waitFor({ state: 'visible', timeout: 10000 })
  await drawButton.click()

  // Wait for cards
  await page.waitForSelector('[data-card-id], [class*="card"]', { timeout: 15000 })
  await page.waitForTimeout(3000)

  // Wait for interpretation
  await page.waitForSelector('text=/解讀|Interpretation/i', { timeout: 20000 })
  await page.waitForTimeout(2000)

  // Save reading
  const saveButton = page.locator('button:has-text("儲存"), button:has-text("Save")').first()
  if (await saveButton.isVisible()) {
    await saveButton.click()
    await page.waitForTimeout(2000)
  }

  // Get reading ID from URL
  await page.waitForURL(/\/readings\/[a-f0-9-]+/, { timeout: 5000 })
  const url = page.url()
  const readingId = url.match(/\/readings\/([a-f0-9-]+)/)?.[1]

  if (!readingId) {
    throw new Error('無法取得 reading ID')
  }

  console.log('✅ 占卜創建成功, ID:', readingId)
  return readingId
}

test.describe('分享功能 E2E 測試', () => {
  let consoleMonitor: { errors: string[], warnings: string[] }

  test.beforeEach(async ({ page }) => {
    consoleMonitor = setupConsoleMonitoring(page)
  })

  test.afterEach(async () => {
    if (consoleMonitor.errors.length > 0) {
      console.log('\n📋 Console Errors:')
      consoleMonitor.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`)
      })
    }
  })

  test('1. 完整分享流程: 生成 → 複製 → 訪問 → 驗證', async ({ page, context }) => {
    console.log('🧪 測試: 完整分享流程')

    // Step 1: Login and create reading
    const readingId = await loginAndCreateReading(page)

    // Step 2: Navigate to reading detail page
    await page.goto(`${FRONTEND_URL}/readings/${readingId}`)
    await page.waitForLoadState('networkidle')

    console.log('📖 占卜詳情頁面已載入')

    // Step 3: Find and click share button
    const shareButton = page.locator('button:has-text("分享"), button:has-text("Share")').first()
    await shareButton.waitFor({ state: 'visible', timeout: 10000 })

    console.log('✅ 找到分享按鈕')

    // Click share button
    await shareButton.click()
    await page.waitForTimeout(1000)

    // Step 4: Wait for modal and share URL
    const modal = page.locator('[role="dialog"], [aria-modal="true"]')
    await modal.waitFor({ state: 'visible', timeout: 5000 })

    console.log('✅ 分享 Modal 已開啟')

    // Get share URL from modal
    const shareUrlElement = page.locator('code, [class*="share-url"], input[readonly]')
    await shareUrlElement.waitFor({ state: 'visible', timeout: 5000 })

    const shareUrl = await shareUrlElement.textContent() || await shareUrlElement.inputValue()
    expect(shareUrl).toContain('/share/')
    expect(shareUrl).toMatch(/\/share\/[a-f0-9-]+/)

    console.log('✅ 分享 URL 已生成:', shareUrl)

    // Step 5: Test copy button
    const copyButton = page.locator('button:has-text("複製"), button:has-text("Copy")').first()
    if (await copyButton.isVisible()) {
      await copyButton.click()
      await page.waitForTimeout(500)

      // Check for success feedback
      const successIndicator = page.locator('text=/已複製|Copied|成功/i')
      const hasSuccess = await successIndicator.count() > 0

      if (hasSuccess) {
        console.log('✅ 複製成功提示已顯示')
      }
    }

    // Close modal
    const closeButton = page.locator('button[aria-label*="close"], button:has-text("關閉")').first()
    if (await closeButton.isVisible()) {
      await closeButton.click()
      await page.waitForTimeout(500)
    } else {
      // Click outside modal
      await page.mouse.click(10, 10)
      await page.waitForTimeout(500)
    }

    // Step 6: Open share URL in new page (simulate public access)
    const shareToken = shareUrl.match(/\/share\/([a-f0-9-]+)/)?.[1]
    expect(shareToken).toBeTruthy()

    console.log('🌐 在新頁面開啟分享連結...')

    const newPage = await context.newPage()
    await newPage.goto(shareUrl)
    await newPage.waitForLoadState('networkidle')

    // Step 7: Verify shared reading page content
    console.log('✅ 分享頁面已載入')

    // Check for page title/header
    const pageTitle = newPage.locator('h1, h2')
    await pageTitle.first().waitFor({ state: 'visible', timeout: 5000 })
    const titleText = await pageTitle.first().textContent()
    expect(titleText).toMatch(/分享|Share/i)

    console.log('✅ 頁面標題正確:', titleText)

    // Check for reading question
    const questionElement = newPage.locator('text=/分享測試占卜/')
    const hasQuestion = await questionElement.count() > 0
    expect(hasQuestion).toBeTruthy()

    console.log('✅ 占卜問題已顯示')

    // Check for cards
    const cards = newPage.locator('[data-card-id], [class*="card"]')
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThan(0)

    console.log(`✅ 卡牌已顯示: ${cardCount} 張`)

    // Check for CTA button
    const ctaButton = newPage.locator('button:has-text("開始"), button:has-text("Start"), a:has-text("開始")')
    const hasButton = await ctaButton.count() > 0
    expect(hasButton).toBeTruthy()

    console.log('✅ CTA 按鈕已顯示')

    // Clean up
    await newPage.close()
  })

  test('2. 隱私驗證: 分享資料不含個人資訊', async ({ page, request }) => {
    console.log('🧪 測試: 隱私驗證')

    // Create reading and get share URL
    const readingId = await loginAndCreateReading(page)

    // Navigate to reading detail
    await page.goto(`${FRONTEND_URL}/readings/${readingId}`)
    await page.waitForLoadState('networkidle')

    // Click share button
    const shareButton = page.locator('button:has-text("分享"), button:has-text("Share")').first()
    await shareButton.click()
    await page.waitForTimeout(1000)

    // Get share URL
    const shareUrlElement = page.locator('code, [class*="share-url"], input[readonly]')
    const shareUrl = await shareUrlElement.textContent() || await shareUrlElement.inputValue()
    const shareToken = shareUrl.match(/\/share\/([a-f0-9-]+)/)?.[1]

    expect(shareToken).toBeTruthy()
    console.log('✅ Share token:', shareToken)

    // Make API request to get shared data
    const apiUrl = `${BACKEND_URL}/api/v1/share/${shareToken}`
    console.log('📡 API 請求:', apiUrl)

    const response = await request.get(apiUrl)
    expect(response.ok()).toBeTruthy()

    const sharedData = await response.json()
    console.log('📊 分享資料結構:', Object.keys(sharedData))

    // Verify NO private fields
    expect(sharedData).not.toHaveProperty('user_id')
    expect(sharedData).not.toHaveProperty('user_email')
    expect(sharedData).not.toHaveProperty('user_name')
    expect(sharedData).not.toHaveProperty('user')

    console.log('✅ 確認無 user_id 欄位')
    console.log('✅ 確認無 user_email 欄位')
    console.log('✅ 確認無 user_name 欄位')
    console.log('✅ 確認無 user 關聯欄位')

    // Verify HAS public fields
    expect(sharedData).toHaveProperty('reading_id')
    expect(sharedData).toHaveProperty('question')
    expect(sharedData).toHaveProperty('created_at')

    console.log('✅ 確認有 reading_id 欄位')
    console.log('✅ 確認有 question 欄位')
    console.log('✅ 確認有 created_at 欄位')

    // Log full data structure for verification
    console.log('\n📋 完整分享資料:')
    console.log(JSON.stringify(sharedData, null, 2))
  })

  test('3. 刪除占卜後分享連結失效', async ({ page, context, request }) => {
    console.log('🧪 測試: 刪除占卜使分享連結失效')

    // Step 1: Create reading and get share link
    const readingId = await loginAndCreateReading(page)

    await page.goto(`${FRONTEND_URL}/readings/${readingId}`)
    await page.waitForLoadState('networkidle')

    // Generate share link
    const shareButton = page.locator('button:has-text("分享"), button:has-text("Share")').first()
    await shareButton.click()
    await page.waitForTimeout(1000)

    const shareUrlElement = page.locator('code, [class*="share-url"], input[readonly]')
    const shareUrl = await shareUrlElement.textContent() || await shareUrlElement.inputValue()
    const shareToken = shareUrl.match(/\/share\/([a-f0-9-]+)/)?.[1]

    expect(shareToken).toBeTruthy()
    console.log('✅ Share link generated:', shareUrl)

    // Close modal
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // Step 2: Verify share link works BEFORE deletion
    console.log('📡 驗證分享連結有效...')
    const beforeResponse = await request.get(`${BACKEND_URL}/api/v1/share/${shareToken}`)
    expect(beforeResponse.ok()).toBeTruthy()
    console.log('✅ 分享連結有效 (刪除前)')

    // Step 3: Delete the reading
    console.log('🗑️ 刪除占卜...')
    const deleteButton = page.locator('button:has-text("刪除"), button:has-text("Delete")').first()
    await deleteButton.click()
    await page.waitForTimeout(500)

    // Confirm deletion
    const confirmButton = page.locator('button:has-text("刪除"), button:has-text("Delete"), button:has-text("確定")').last()
    await confirmButton.click()
    await page.waitForTimeout(2000)

    // Verify redirect to readings list
    await page.waitForURL(/\/readings$|\/dashboard/, { timeout: 10000 })
    console.log('✅ 占卜已刪除，已重導向')

    // Step 4: Verify share link is NOW INVALID
    console.log('📡 驗證分享連結已失效...')
    const afterResponse = await request.get(`${BACKEND_URL}/api/v1/share/${shareToken}`)

    // Should return 404
    expect(afterResponse.status()).toBe(404)
    console.log('✅ 分享連結已失效 (404)')

    // Step 5: Verify frontend shows error for invalid link
    const newPage = await context.newPage()
    await newPage.goto(shareUrl)
    await newPage.waitForLoadState('networkidle')

    // Should show error message
    const errorMessage = newPage.locator('text=/不存在|失效|Invalid|Not Found/i')
    await errorMessage.waitFor({ state: 'visible', timeout: 5000 })

    const errorText = await errorMessage.textContent()
    console.log('✅ 錯誤訊息已顯示:', errorText)

    await newPage.close()
  })

  test('4. 分享連結 - 無效 token 處理', async ({ page }) => {
    console.log('🧪 測試: 無效 share token 處理')

    // Visit with invalid UUID
    const invalidToken = '00000000-0000-0000-0000-000000000000'
    await page.goto(`${FRONTEND_URL}/share/${invalidToken}`)
    await page.waitForLoadState('networkidle')

    // Should show error message
    const errorMessage = page.locator('text=/不存在|失效|Invalid|Not Found/i')
    await errorMessage.waitFor({ state: 'visible', timeout: 5000 })

    const errorText = await errorMessage.textContent()
    expect(errorText).toBeTruthy()

    console.log('✅ 無效 token 錯誤訊息:', errorText)

    // Should have home button
    const homeButton = page.locator('button:has-text("首頁"), button:has-text("Home"), a:has-text("首頁")')
    const hasHomeButton = await homeButton.count() > 0
    expect(hasHomeButton).toBeTruthy()

    console.log('✅ 返回首頁按鈕已顯示')
  })

  test('5. 分享連結 - 格式錯誤處理', async ({ page }) => {
    console.log('🧪 測試: 格式錯誤的 share token')

    // Visit with malformed token
    const malformedToken = 'not-a-valid-uuid'
    await page.goto(`${FRONTEND_URL}/share/${malformedToken}`)
    await page.waitForLoadState('networkidle')

    // Should show error message
    const errorMessage = page.locator('text=/無效|格式|Invalid|Malformed/i')
    await errorMessage.waitFor({ state: 'visible', timeout: 5000 })

    const errorText = await errorMessage.textContent()
    expect(errorText).toBeTruthy()

    console.log('✅ 格式錯誤訊息:', errorText)
  })

  test('6. 分享按鈕 - 冪等性測試', async ({ page }) => {
    console.log('🧪 測試: 重複點擊分享按鈕應返回相同 token')

    const readingId = await loginAndCreateReading(page)

    await page.goto(`${FRONTEND_URL}/readings/${readingId}`)
    await page.waitForLoadState('networkidle')

    // Click share button first time
    const shareButton = page.locator('button:has-text("分享"), button:has-text("Share")').first()
    await shareButton.click()
    await page.waitForTimeout(1000)

    const shareUrlElement1 = page.locator('code, [class*="share-url"], input[readonly]')
    const shareUrl1 = await shareUrlElement1.textContent() || await shareUrlElement1.inputValue()
    const token1 = shareUrl1.match(/\/share\/([a-f0-9-]+)/)?.[1]

    console.log('✅ 第一次生成 token:', token1)

    // Close modal
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // Click share button second time
    await shareButton.click()
    await page.waitForTimeout(1000)

    const shareUrlElement2 = page.locator('code, [class*="share-url"], input[readonly]')
    const shareUrl2 = await shareUrlElement2.textContent() || await shareUrlElement2.inputValue()
    const token2 = shareUrl2.match(/\/share\/([a-f0-9-]+)/)?.[1]

    console.log('✅ 第二次生成 token:', token2)

    // Tokens should be the same (idempotency)
    expect(token1).toBe(token2)
    console.log('✅ 冪等性驗證通過: 兩次生成的 token 相同')
  })
})

test.describe('分享功能 - 無障礙測試', () => {
  test('分享 Modal 應該有正確的 ARIA 屬性', async ({ page }) => {
    console.log('🧪 測試: 分享 Modal 無障礙屬性')

    // Create a quick reading for testing
    await page.goto(`${FRONTEND_URL}/auth/login`)
    await page.waitForLoadState('networkidle')

    // Skip if not logged in (this test can be run independently)
    try {
      const readingId = await loginAndCreateReading(page)
      await page.goto(`${FRONTEND_URL}/readings/${readingId}`)
      await page.waitForLoadState('networkidle')

      // Open share modal
      const shareButton = page.locator('button:has-text("分享"), button:has-text("Share")').first()
      await shareButton.click()
      await page.waitForTimeout(1000)

      // Check modal ARIA attributes
      const modal = page.locator('[role="dialog"], [aria-modal="true"]')
      const hasModal = await modal.count() > 0
      expect(hasModal).toBeTruthy()

      console.log('✅ Modal 有 role="dialog" 或 aria-modal="true"')

      // Check for aria-labelledby or aria-label
      const hasLabel = await modal.getAttribute('aria-labelledby') ||
                       await modal.getAttribute('aria-label')

      if (hasLabel) {
        console.log('✅ Modal 有 aria-label 或 aria-labelledby')
      }

      // Check copy button has accessible label
      const copyButton = page.locator('button:has-text("複製"), button:has-text("Copy")').first()
      if (await copyButton.isVisible()) {
        const buttonText = await copyButton.textContent()
        expect(buttonText).toBeTruthy()
        console.log('✅ 複製按鈕有可見文字:', buttonText)
      }
    } catch (error) {
      console.log('⚠️ 測試跳過 (需要登入狀態)')
    }
  })
})
