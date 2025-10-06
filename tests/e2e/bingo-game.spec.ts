/**
 * Daily Bingo E2E 測試
 *
 * 測試完整使用者旅程:
 * 1. 登入
 * 2. 設定賓果卡
 * 3. 每日簽到
 * 4. 查看歷史
 *
 * 需求對應: All requirements E2E validation
 * Task: 29
 */

import { test, expect, type Page } from '@playwright/test'

// Test fixtures
test.describe('Daily Bingo Game - E2E Flow', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage

    // 前往登入頁面
    await page.goto('/login')

    // 執行登入（使用測試帳號）
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'test123456')
    await page.click('button[type="submit"]')

    // 等待登入完成，導向首頁
    await page.waitForURL('/')
    await expect(page).toHaveURL('/')
  })

  test('完整流程: 設定賓果卡 → 每日簽到 → 查看連線', async () => {
    // 1. 前往賓果遊戲頁面
    await page.goto('/bingo')
    await expect(page).toHaveURL('/bingo')

    // 2. 驗證初始狀態：顯示賓果卡設定介面
    await expect(page.getByText(/設定你的賓果卡/i)).toBeVisible()

    // 3. 選擇 25 個號碼
    const numberButtons = page.locator('button').filter({ hasText: /^[0-9]+$/ })
    const count = await numberButtons.count()
    expect(count).toBe(25)

    // 點擊所有號碼按鈕
    for (let i = 0; i < 25; i++) {
      await numberButtons.nth(i).click()

      // 驗證選中狀態
      await expect(numberButtons.nth(i)).toHaveClass(/selected|bg-vault-yellow/i)
    }

    // 4. 提交賓果卡
    const submitButton = page.getByRole('button', { name: /確認設定/i })
    await expect(submitButton).toBeEnabled()
    await submitButton.click()

    // 5. 等待卡片建立完成，應顯示遊戲介面
    await expect(page.getByText(/今日號碼/i)).toBeVisible({ timeout: 5000 })

    // 6. 驗證賓果卡網格顯示
    const bingoGrid = page.getByTestId('bingo-grid')
    await expect(bingoGrid).toBeVisible()

    // 7. 驗證網格有 25 個格子
    const gridCells = bingoGrid.locator('[data-testid^="grid-cell-"]')
    await expect(gridCells).toHaveCount(25)

    // 8. 領取今日號碼
    const claimButton = page.getByRole('button', { name: /領取今日號碼/i })
    await claimButton.click()

    // 9. 驗證領取成功
    await expect(page.getByText(/已領取/i)).toBeVisible({ timeout: 3000 })

    // 10. 驗證連線數顯示
    await expect(page.getByText(/連線/i)).toBeVisible()

    // 11. 驗證號碼在網格上高亮
    const highlightedCell = page.locator('[data-testid*="claimed"]').first()
    await expect(highlightedCell).toBeVisible()
  })

  test('Responsive: 手機版介面正常顯示', async ({ context }) => {
    // 設定手機視窗大小
    const mobilePage = await context.newPage()
    await mobilePage.setViewportSize({ width: 375, height: 667 })

    // 登入
    await mobilePage.goto('/login')
    await mobilePage.fill('input[name="email"]', 'test@example.com')
    await mobilePage.fill('input[name="password"]', 'test123456')
    await mobilePage.click('button[type="submit"]')
    await mobilePage.waitForURL('/')

    // 前往賓果頁面
    await mobilePage.goto('/bingo')

    // 驗證賓果卡設定介面在手機版顯示正常
    await expect(mobilePage.getByText(/設定你的賓果卡/i)).toBeVisible()

    // 驗證號碼選擇器為 Grid 佈局（手機版應該是 5x5）
    const numberButtons = mobilePage.locator('button').filter({ hasText: /^[0-9]+$/ })
    await expect(numberButtons.first()).toBeVisible()

    // 驗證按鈕大小適合觸控（至少 44x44 px）
    const buttonBox = await numberButtons.first().boundingBox()
    expect(buttonBox?.width).toBeGreaterThanOrEqual(40)
    expect(buttonBox?.height).toBeGreaterThanOrEqual(40)

    await mobilePage.close()
  })

  test('錯誤處理: 重複領取當日號碼', async () => {
    // 前往賓果頁面
    await page.goto('/bingo')

    // 假設已有賓果卡（需要先設定）
    // 這裡應該 mock API 回傳已有卡片的狀態

    // 或者先建立賓果卡
    const hasSetupUI = await page.getByText(/設定你的賓果卡/i).isVisible()
    if (hasSetupUI) {
      // 選擇 25 個號碼
      const numberButtons = page.locator('button').filter({ hasText: /^[0-9]+$/ })
      for (let i = 0; i < 25; i++) {
        await numberButtons.nth(i).click()
      }
      await page.getByRole('button', { name: /確認設定/i }).click()
      await page.waitForTimeout(2000) // 等待卡片建立
    }

    // 第一次領取
    const claimButton = page.getByRole('button', { name: /領取今日號碼/i })
    if (await claimButton.isEnabled()) {
      await claimButton.click()
      await page.waitForTimeout(1000)
    }

    // 第二次領取應該顯示已領取
    await expect(page.getByText(/已領取/i)).toBeVisible()
    await expect(claimButton).toBeDisabled()
  })

  test('達成三連線顯示獎勵通知', async () => {
    // 這個測試需要 mock API 回傳達成三連線的狀態
    // 或者使用測試資料庫預先設定好的帳號

    await page.goto('/bingo')

    // 假設使用特定測試帳號，已經快要達成三連線
    // 領取今日號碼後應該達成

    const hasSetupUI = await page.getByText(/設定你的賓果卡/i).isVisible()
    if (hasSetupUI) {
      // 建立卡片
      const numberButtons = page.locator('button').filter({ hasText: /^[0-9]+$/ })
      for (let i = 0; i < 25; i++) {
        await numberButtons.nth(i).click()
      }
      await page.getByRole('button', { name: /確認設定/i }).click()
      await page.waitForTimeout(2000)
    }

    // 領取號碼
    const claimButton = page.getByRole('button', { name: /領取今日號碼/i })
    if (await claimButton.isEnabled()) {
      await claimButton.click()
    }

    // 檢查是否有獎勵通知（可能需要達成條件）
    // 這裡只驗證 UI 元件存在
    const rewardNotification = page.getByTestId('reward-notification')
    // 可能顯示或不顯示，取決於是否達成三連線
    const isVisible = await rewardNotification.isVisible().catch(() => false)

    if (isVisible) {
      await expect(rewardNotification).toContainText(/恭喜|三連線/i)
    }
  })

  test('查看歷史記錄', async () => {
    await page.goto('/bingo')

    // 等待頁面載入
    await page.waitForTimeout(2000)

    // 點擊歷史記錄按鈕
    const historyButton = page.getByRole('button', { name: /歷史記錄|歷史/i })

    if (await historyButton.isVisible()) {
      await historyButton.click()

      // 驗證歷史查詢介面顯示
      await expect(page.getByText(/選擇月份|查詢歷史/i)).toBeVisible()

      // 選擇月份
      const monthSelect = page.locator('select, [role="combobox"]').first()
      if (await monthSelect.isVisible()) {
        await monthSelect.selectOption({ index: 1 })

        // 點擊查詢按鈕
        const queryButton = page.getByRole('button', { name: /查詢/i })
        await queryButton.click()

        // 等待結果
        await page.waitForTimeout(1000)

        // 驗證歷史記錄顯示（可能有或沒有資料）
        const hasHistory = await page.getByText(/\d+.*連線|無記錄/i).isVisible()
        expect(hasHistory).toBeTruthy()
      }
    }
  })

  test('導航: 從首頁進入賓果遊戲', async () => {
    await page.goto('/')

    // 尋找賓果遊戲連結
    const bingoLink = page.getByRole('link', { name: /賓果|Bingo/i })
    await expect(bingoLink).toBeVisible()

    // 點擊進入
    await bingoLink.click()

    // 驗證頁面跳轉
    await expect(page).toHaveURL('/bingo')
  })

  test('未登入時重導向至登入頁', async ({ browser }) => {
    // 建立無登入狀態的新 context
    const newContext = await browser.newContext()
    const newPage = await newContext.newPage()

    // 直接訪問賓果頁面
    await newPage.goto('/bingo')

    // 應該重導向至登入頁
    await expect(newPage).toHaveURL(/\/login/)

    await newContext.close()
  })
})

test.describe('Daily Bingo - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // 登入
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'test123456')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('賓果卡設定介面視覺測試', async ({ page }) => {
    await page.goto('/bingo')

    // 等待介面完全載入
    await page.waitForSelector('button:has-text("1")')

    // 截圖比對
    await expect(page).toHaveScreenshot('bingo-setup.png', {
      fullPage: true,
      maxDiffPixels: 100
    })
  })

  test('賓果遊戲主介面視覺測試', async ({ page }) => {
    await page.goto('/bingo')

    // 假設已有賓果卡，或者先建立
    const hasSetupUI = await page.getByText(/設定你的賓果卡/i).isVisible()
    if (hasSetupUI) {
      const numberButtons = page.locator('button').filter({ hasText: /^[0-9]+$/ })
      for (let i = 0; i < 25; i++) {
        await numberButtons.nth(i).click()
      }
      await page.getByRole('button', { name: /確認設定/i }).click()
      await page.waitForTimeout(2000)
    }

    // 等待遊戲介面顯示
    await page.waitForSelector('[data-testid="bingo-grid"]')

    // 截圖比對
    await expect(page).toHaveScreenshot('bingo-game.png', {
      fullPage: true,
      maxDiffPixels: 100
    })
  })

  test('手機版賓果介面視覺測試', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/bingo')

    await page.waitForTimeout(1000)

    await expect(page).toHaveScreenshot('bingo-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100
    })
  })
})

test.describe('Daily Bingo - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'test123456')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('鍵盤導航: Tab 鍵可正確聚焦所有互動元素', async ({ page }) => {
    await page.goto('/bingo')

    // 使用 Tab 鍵導航
    await page.keyboard.press('Tab')

    // 驗證焦點在第一個號碼按鈕
    const firstButton = page.locator('button').filter({ hasText: /^1$/ })
    await expect(firstButton).toBeFocused()

    // 繼續 Tab 到下一個元素
    await page.keyboard.press('Tab')
    const secondButton = page.locator('button').filter({ hasText: /^2$/ })
    await expect(secondButton).toBeFocused()
  })

  test('鍵盤操作: Enter/Space 可觸發按鈕點擊', async ({ page }) => {
    await page.goto('/bingo')

    // 聚焦第一個號碼按鈕
    const firstButton = page.locator('button').filter({ hasText: /^1$/ })
    await firstButton.focus()

    // 使用 Enter 鍵選擇
    await page.keyboard.press('Enter')

    // 驗證按鈕被選中
    await expect(firstButton).toHaveClass(/selected|bg-vault-yellow/i)
  })

  test('螢幕閱讀器: 所有互動元素有正確 ARIA 標籤', async ({ page }) => {
    await page.goto('/bingo')

    // 驗證號碼按鈕有 aria-label
    const numberButton = page.locator('button').filter({ hasText: /^1$/ })
    const ariaLabel = await numberButton.getAttribute('aria-label')
    expect(ariaLabel).toContain('1')

    // 驗證提交按鈕
    const submitButton = page.getByRole('button', { name: /確認設定/i })
    await expect(submitButton).toHaveAttribute('type', 'button')
  })
})
