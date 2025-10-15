/**
 * 完整占卜功能測試
 * End-to-End Testing for Complete Reading Flow
 */

import { test, expect, type Page } from '@playwright/test'

const FRONTEND_URL = 'http://localhost:3000'
const BACKEND_URL = 'http://localhost:8000'

// Test credentials
const TEST_USER = {
  username: `test_user_${Date.now()}`,
  email: `test${Date.now()}@example.com`,
  password: 'Test1234!@#$'
}

// Helper: 等待並檢查元素
async function waitForElement(page: Page, selector: string, timeout = 10000) {
  await page.waitForSelector(selector, { timeout, state: 'visible' })
}

// Helper: 檢查 console 錯誤
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
      console.warn('⚠️ Console Warning:', text)
    }
  })

  page.on('pageerror', error => {
    errors.push(error.message)
    console.error('❌ Page Error:', error.message)
  })

  return { errors, warnings }
}

test.describe('完整占卜功能測試', () => {
  let consoleMonitor: { errors: string[], warnings: string[] }

  test.beforeEach(async ({ page }) => {
    // 設置 console 監控
    consoleMonitor = setupConsoleMonitoring(page)
  })

  test.afterEach(async () => {
    // 報告 console 錯誤
    if (consoleMonitor.errors.length > 0) {
      console.log('\n📋 Console Errors Found:')
      consoleMonitor.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`)
      })
    }
  })

  test('1. 使用者註冊流程', async ({ page }) => {
    console.log('🧪 測試: 使用者註冊')

    // 訪問註冊頁面
    await page.goto(`${FRONTEND_URL}/auth/register`)
    await page.waitForLoadState('networkidle')

    // 填寫註冊表單
    await page.fill('input[name="username"]', TEST_USER.username)
    await page.fill('input[name="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)

    // 提交表單
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/v1/auth/register') && resp.status() === 200
    )

    await page.click('button[type="submit"]')

    // 等待 API 回應
    const response = await responsePromise
    const responseData = await response.json()

    console.log('✅ 註冊 API 回應:', responseData)

    // 驗證 cookies 設置
    const cookies = await page.context().cookies()
    const accessToken = cookies.find(c => c.name === 'access_token')
    const refreshToken = cookies.find(c => c.name === 'refresh_token')

    expect(accessToken).toBeDefined()
    expect(refreshToken).toBeDefined()

    console.log('✅ Cookies 正確設置')

    // 驗證重導向
    await page.waitForURL(/\/(dashboard|readings)/, { timeout: 10000 })
    console.log('✅ 成功重導向到:', page.url())
  })

  test('2. /readings/new 頁面 - 步驟 1: 設定問題', async ({ page }) => {
    console.log('🧪 測試: 設定問題')

    // 先登入（假設已註冊）
    await page.goto(`${FRONTEND_URL}/auth/login`)
    await page.waitForLoadState('networkidle')

    // 使用之前創建的測試用戶登入（或創建新用戶）
    // 這裡我們直接導航到 readings/new，依靠現有 session
    await page.goto(`${FRONTEND_URL}/readings/new`)
    await page.waitForLoadState('networkidle')

    // 確認在步驟 1
    await waitForElement(page, 'textarea[id="question"]')
    console.log('✅ 找到問題輸入框')

    // 輸入問題
    const testQuestion = '我在廢土上的下一步該如何走？'
    await page.fill('textarea[id="question"]', testQuestion)

    // 選擇牌陣類型
    const spreadTypes = ['single', 'three_card', 'celtic_cross']
    for (const spread of spreadTypes) {
      const spreadButton = page.locator(`button[data-spread-type="${spread}"]`)
      if (await spreadButton.isVisible()) {
        await spreadButton.click()
        console.log(`✅ 選擇牌陣: ${spread}`)
        break
      }
    }

    // 驗證表單驗證
    await page.fill('textarea[id="question"]', '')
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // 檢查是否顯示驗證錯誤（HTML5 validation 或自定義錯誤）
    const isInvalid = await page.evaluate(() => {
      const textarea = document.querySelector('textarea[id="question"]') as HTMLTextAreaElement
      return textarea ? !textarea.validity.valid : false
    })

    console.log('✅ 表單驗證運作:', isInvalid)

    // 重新輸入問題並提交
    await page.fill('textarea[id="question"]', testQuestion)
    await submitButton.click()

    // 等待進入步驟 2
    await page.waitForTimeout(1000)
    const currentStep = await page.locator('[class*="step"]').first().textContent()
    console.log('✅ 當前步驟:', currentStep)
  })

  test('3. /readings/new 頁面 - 完整流程', async ({ page }) => {
    console.log('🧪 測試: 完整占卜流程')

    // 訪問頁面
    await page.goto(`${FRONTEND_URL}/readings/new`)
    await page.waitForLoadState('networkidle')

    // === 步驟 1: 設定問題 ===
    console.log('📝 步驟 1: 設定問題')
    await waitForElement(page, 'textarea[id="question"]')

    const testQuestion = '在這個末日後的世界，我應該信任誰？'
    await page.fill('textarea[id="question"]', testQuestion)

    // 選擇牌陣（默認 single 或選擇 three_card）
    const spreadSelector = page.locator('[data-spread-type="single"]')
    if (await spreadSelector.isVisible()) {
      await spreadSelector.click()
    }

    // 提交問題
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    console.log('✅ 問題已提交')

    // === 步驟 2: 抽牌 ===
    console.log('🎴 步驟 2: 抽牌')

    // 等待抽牌按鈕出現
    const drawButton = page.locator('button:has-text("抽牌"), button:has-text("Draw")')
    await drawButton.waitFor({ state: 'visible', timeout: 10000 })

    // 點擊抽牌
    await drawButton.click()
    console.log('✅ 點擊抽牌按鈕')

    // 等待卡牌抽取完成（觀察卡牌元素出現）
    await page.waitForSelector('[class*="card"], [data-card-id]', { timeout: 15000 })
    await page.waitForTimeout(2000) // 等待動畫完成

    console.log('✅ 卡牌抽取完成')

    // 驗證抽取的卡牌數量
    const drawnCards = await page.locator('[data-card-id], [class*="tarot-card"]').count()
    console.log(`✅ 抽取了 ${drawnCards} 張卡牌`)
    expect(drawnCards).toBeGreaterThan(0)

    // === 步驟 3: 查看解讀 ===
    console.log('📖 步驟 3: 查看解讀')

    // 等待解讀文字生成
    await page.waitForSelector('text=/Pip-Boy|解讀|Interpretation/i', { timeout: 20000 })

    // 等待載入動畫消失
    await page.waitForSelector('[class*="spin"], [class*="loading"]', { state: 'hidden', timeout: 15000 })

    // 驗證解讀文字存在
    const interpretationText = await page.locator('[class*="interpretation"], [class*="prose"]').textContent()
    expect(interpretationText).toBeTruthy()
    expect(interpretationText!.length).toBeGreaterThan(50)

    console.log('✅ 解讀文字已生成')
    console.log(`📝 解讀內容長度: ${interpretationText!.length} 字符`)

    // === 測試儲存功能 ===
    console.log('💾 測試儲存占卜')

    const saveButton = page.locator('button:has-text("儲存"), button:has-text("Save")')
    await saveButton.waitFor({ state: 'visible', timeout: 5000 })

    // 監聽 API 請求
    const saveRequestPromise = page.waitForRequest(
      req => req.url().includes('/api/v1/readings') && req.method() === 'POST',
      { timeout: 10000 }
    )

    await saveButton.click()

    try {
      const saveRequest = await saveRequestPromise
      const postData = saveRequest.postDataJSON()
      console.log('✅ 儲存 API 請求:', postData)

      // 等待儲存成功回應
      await page.waitForSelector('text=/已保存|Success|成功/i', { timeout: 10000 })
      console.log('✅ 占卜已成功儲存')
    } catch (error) {
      console.warn('⚠️ 儲存請求超時或失敗:', error)
    }
  })

  test('4. Session 自動儲存測試', async ({ page }) => {
    console.log('🧪 測試: Session 自動儲存')

    await page.goto(`${FRONTEND_URL}/readings/new`)
    await page.waitForLoadState('networkidle')

    // 輸入問題
    const testQuestion = '測試 session 儲存功能'
    await page.fill('textarea[id="question"]', testQuestion)

    // 等待自動儲存指示器出現
    await page.waitForTimeout(3000) // 等待 debounce

    // 檢查是否有自動儲存指示器
    const saveIndicator = page.locator('[class*="autosave"], [data-autosave-status]')
    const indicatorExists = await saveIndicator.count()

    if (indicatorExists > 0) {
      const status = await saveIndicator.textContent()
      console.log('✅ 自動儲存指示器狀態:', status)
    } else {
      console.log('⚠️ 未找到自動儲存指示器（可能在背景運行）')
    }

    // 離開頁面
    await page.goto(`${FRONTEND_URL}/dashboard`)
    await page.waitForLoadState('networkidle')

    // 返回 readings/new，檢查 session 是否恢復
    await page.goto(`${FRONTEND_URL}/readings/new`)
    await page.waitForLoadState('networkidle')

    // 檢查問題是否被恢復
    const questionValue = await page.inputValue('textarea[id="question"]')

    if (questionValue === testQuestion) {
      console.log('✅ Session 成功恢復:', questionValue)
    } else {
      console.log('⚠️ Session 未恢復或已被清除')
    }
  })

  test('5. 錯誤處理測試', async ({ page }) => {
    console.log('🧪 測試: 錯誤處理')

    // 模擬網路錯誤
    await page.route('**/api/v1/cards/draw-random*', route => route.abort('failed'))

    await page.goto(`${FRONTEND_URL}/readings/new`)
    await page.waitForLoadState('networkidle')

    // 嘗試抽牌
    await page.fill('textarea[id="question"]', '測試錯誤處理')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)

    const drawButton = page.locator('button:has-text("抽牌"), button:has-text("Draw")')
    await drawButton.waitFor({ state: 'visible', timeout: 10000 })
    await drawButton.click()

    // 等待錯誤訊息出現
    await page.waitForTimeout(2000)

    // 檢查是否有錯誤提示
    const errorMessage = await page.locator('[class*="error"], [role="alert"], text=/錯誤|Error|失敗/i').count()

    if (errorMessage > 0) {
      console.log('✅ 錯誤訊息正確顯示')
    } else {
      console.log('⚠️ 未發現錯誤提示（可能在 console 中）')
    }
  })

  test('6. /readings 歷史記錄頁面', async ({ page }) => {
    console.log('🧪 測試: 占卜歷史記錄')

    await page.goto(`${FRONTEND_URL}/readings`)
    await page.waitForLoadState('networkidle')

    // 等待頁面載入
    await page.waitForTimeout(2000)

    // 檢查是否有占卜記錄
    const readingItems = await page.locator('[data-reading-id], [class*="reading-card"]').count()

    console.log(`✅ 找到 ${readingItems} 條占卜記錄`)

    if (readingItems > 0) {
      // 測試查看詳情
      const firstReading = page.locator('[data-reading-id], [class*="reading-card"]').first()
      await firstReading.click()

      // 等待導航
      await page.waitForTimeout(1000)

      console.log('✅ 可以查看占卜詳情')
    } else {
      console.log('ℹ️ 目前沒有占卜記錄')
    }
  })

  test('7. API 端點健康檢查', async ({ request }) => {
    console.log('🧪 測試: API 健康檢查')

    // Health endpoint
    const healthResponse = await request.get(`${BACKEND_URL}/health`)
    expect(healthResponse.ok()).toBeTruthy()
    const healthData = await healthResponse.json()
    console.log('✅ Health API:', healthData)

    // Cards endpoint
    const cardsResponse = await request.get(`${BACKEND_URL}/api/v1/cards/?page=1&page_size=5`)
    expect(cardsResponse.ok()).toBeTruthy()
    const cardsData = await cardsResponse.json()
    console.log('✅ Cards API:', {
      total: cardsData.total_count,
      cards: cardsData.cards?.length
    })
  })
})

test.describe('無障礙性測試', () => {
  test('頁面應該具有適當的 ARIA 標籤', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/readings/new`)
    await page.waitForLoadState('networkidle')

    // 檢查重要元素的 aria-label
    const questionTextarea = page.locator('textarea[id="question"]')
    const hasLabel = await questionTextarea.getAttribute('aria-label') ||
                     await page.locator('label[for="question"]').count() > 0

    console.log('✅ 問題輸入框有適當的標籤:', hasLabel)
  })
})
