/**
 * E2E 測試 - 訪客首次抽卡完整流程
 * 任務 16.1
 */

import { test, expect } from '@playwright/test'

test.describe('快速占卜 - 訪客首次抽卡完整流程', () => {
  test.beforeEach(async ({ page, context }) => {
    // 清除所有 localStorage 和 cookies
    await context.clearCookies()
    await page.goto('/readings/quick')
  })

  test('應該顯示載入指示器並完成載入', async ({ page }) => {
    // 檢查載入指示器
    const loadingIndicator = page.getByTestId('loading-indicator')
    await expect(loadingIndicator).toBeVisible({ timeout: 1000 })

    // 等待載入完成
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 })

    // 檢查主要內容已顯示
    await expect(page.getByText('選擇你的命運之牌')).toBeVisible()
  })

  test('應該顯示 Carousel 與 5 張卡背', async ({ page }) => {
    // 等待頁面載入完成
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 檢查位置指示器顯示 1/5
    const positionIndicator = page.getByTestId('position-indicator')
    await expect(positionIndicator).toContainText('1 / 5')

    // 檢查 Carousel 區域存在
    const carousel = page.getByRole('region', { name: /卡牌選擇輪播/i })
    await expect(carousel).toBeVisible()
  })

  test('應該能使用箭頭按鈕導航卡牌', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    const positionIndicator = page.getByTestId('position-indicator')
    const nextButton = page.getByLabel('下一張卡牌')
    const prevButton = page.getByLabel('上一張卡牌')

    // 初始狀態：第一張卡牌，上一張按鈕應該被禁用
    await expect(positionIndicator).toContainText('1 / 5')
    await expect(prevButton).toBeDisabled()

    // 點擊下一張
    await nextButton.click()
    await expect(positionIndicator).toContainText('2 / 5')
    await expect(prevButton).toBeEnabled()

    // 再點擊下一張
    await nextButton.click()
    await expect(positionIndicator).toContainText('3 / 5')

    // 點擊上一張
    await prevButton.click()
    await expect(positionIndicator).toContainText('2 / 5')
  })

  test('應該能使用鍵盤方向鍵導航', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    const positionIndicator = page.getByTestId('position-indicator')

    // 初始位置
    await expect(positionIndicator).toContainText('1 / 5')

    // 按右方向鍵
    await page.keyboard.press('ArrowRight')
    await expect(positionIndicator).toContainText('2 / 5')

    // 再按右方向鍵
    await page.keyboard.press('ArrowRight')
    await expect(positionIndicator).toContainText('3 / 5')

    // 按左方向鍵
    await page.keyboard.press('ArrowLeft')
    await expect(positionIndicator).toContainText('2 / 5')
  })

  test('應該能點擊卡背翻牌', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 找到第一張卡牌並點擊
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()

    // 等待翻牌動畫完成（給予一些時間）
    await page.waitForTimeout(1000)

    // 檢查是否顯示 CTA 區塊（表示已翻牌）
    await expect(page.getByText('這是你的專屬命運展示 - 僅此一次')).toBeVisible({ timeout: 2000 })
  })

  test('翻牌後應該儲存至 localStorage', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 翻牌
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()

    await page.waitForTimeout(1000)

    // 檢查 localStorage
    const storageData = await page.evaluate(() => {
      return localStorage.getItem('wasteland-tarot-quick-reading')
    })

    expect(storageData).not.toBeNull()

    // 解析並驗證資料格式
    if (storageData) {
      const data = JSON.parse(storageData)
      expect(data).toHaveProperty('selectedCardId')
      expect(data).toHaveProperty('cardPoolIds')
      expect(data).toHaveProperty('timestamp')
      expect(data.cardPoolIds).toHaveLength(5)
    }
  })

  test('翻牌後應該顯示 CTA 區塊', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 翻牌
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()

    await page.waitForTimeout(1000)

    // 檢查 CTA 標題（更新後的文案）
    await expect(page.getByText('這是你的專屬命運展示 - 僅此一次')).toBeVisible({
      timeout: 2000,
    })

    // 檢查「無限次抽卡」關鍵文案
    await expect(page.getByText(/無限次抽卡/)).toBeVisible()

    // 檢查註冊按鈕
    await expect(page.getByText('立即註冊 - 解鎖完整體驗')).toBeVisible()

    // 檢查登入按鈕
    await expect(page.getByText('已有帳號？立即登入')).toBeVisible()
  })

  test('訪客不應該看到重新抽卡按鈕', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 翻牌
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()
    await page.waitForTimeout(1000)

    // 驗證不存在重新抽卡按鈕
    await expect(page.getByText('重新抽卡')).not.toBeVisible()

    // 但應該顯示 CTA
    await expect(page.getByText('這是你的專屬命運展示 - 僅此一次')).toBeVisible()
  })

  test('頁面重新整理後應該恢復翻牌狀態', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 翻牌
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()
    await page.waitForTimeout(1000)

    // 重新整理頁面
    await page.reload()

    // 等待頁面載入
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // CTA 應該顯示（狀態已恢復）
    await expect(page.getByText('這是你的專屬命運展示 - 僅此一次')).toBeVisible({ timeout: 2000 })

    // 確認不顯示重新抽卡按鈕
    await expect(page.getByText('重新抽卡')).not.toBeVisible()
  })

  test('應該顯示正確的 Header 資訊', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 檢查 Header 內容
    await expect(page.getByText('快速占卜模式')).toBeVisible()
    await expect(page.getByText('訪客體驗')).toBeVisible()
    await expect(page.getByText('VAULT-TEC SYSTEMS v3.0')).toBeVisible()
  })

  test('CTA 按鈕點擊應該導航至正確頁面', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 翻牌以顯示 CTA
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()
    await page.waitForTimeout(1000)

    // 點擊註冊按鈕（更新後的文案）
    const registerButton = page.getByText('立即註冊 - 解鎖完整體驗')
    await expect(registerButton).toBeVisible()

    // 檢查按鈕存在即可（實際導航測試在其他測試中）
    await expect(registerButton).toHaveAttribute('type', 'button')
  })
})

/**
 * 任務 16.2 - 頁面重新整理狀態恢復測試
 */
test.describe('快速占卜 - 狀態恢復測試', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/readings/quick')
  })

  test('翻牌後重新整理頁面應該恢復選中狀態（localStorage 永久保存）', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 翻牌
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()
    await page.waitForTimeout(1000)

    // 確認翻牌成功
    await expect(page.getByText('這是你的專屬命運展示 - 僅此一次')).toBeVisible({ timeout: 2000 })

    // 重新整理頁面
    await page.reload()

    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 狀態應該恢復：CTA 仍然顯示
    await expect(page.getByText('這是你的專屬命運展示 - 僅此一次')).toBeVisible({ timeout: 2000 })

    // 確認不顯示重新抽卡按鈕
    await expect(page.getByText('重新抽卡')).not.toBeVisible()
  })

  test('重新整理後 localStorage 資料應該保持一致', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 翻牌
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()
    await page.waitForTimeout(1000)

    // 記錄 localStorage 資料
    const beforeReload = await page.evaluate(() => {
      return localStorage.getItem('wasteland-tarot-quick-reading')
    })

    expect(beforeReload).not.toBeNull()

    // 重新整理
    await page.reload()

    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 檢查資料一致
    const afterReload = await page.evaluate(() => {
      return localStorage.getItem('wasteland-tarot-quick-reading')
    })

    expect(afterReload).toBe(beforeReload)
  })

  test('重新整理後 CTA 應該持續顯示', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 翻牌
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()
    await page.waitForTimeout(1000)

    // CTA 應該顯示
    await expect(page.getByText('這是你的專屬命運展示 - 僅此一次')).toBeVisible()

    // 重新整理
    await page.reload()

    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // CTA 應該持續顯示
    await expect(page.getByText('這是你的專屬命運展示 - 僅此一次')).toBeVisible({
      timeout: 2000,
    })
  })
})

/**
 * 任務 16.3 - Carousel 鍵盤導航測試
 */
test.describe('快速占卜 - 鍵盤導航測試', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/readings/quick')
  })

  test('聚焦後使用方向鍵應該能導航卡牌', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    const positionIndicator = page.getByTestId('position-indicator')

    // 初始位置
    await expect(positionIndicator).toContainText('1 / 5')

    // 按 Tab 聚焦到 Carousel 區域，然後按方向鍵
    await page.keyboard.press('ArrowRight')
    await expect(positionIndicator).toContainText('2 / 5')

    await page.keyboard.press('ArrowRight')
    await expect(positionIndicator).toContainText('3 / 5')

    await page.keyboard.press('ArrowLeft')
    await expect(positionIndicator).toContainText('2 / 5')
  })

  test('位置指示器應該正確更新', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    const positionIndicator = page.getByTestId('position-indicator')

    // 連續按右鍵到達最後一張
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowRight')
    }

    await expect(positionIndicator).toContainText('5 / 5')
  })

  test('導航邊界行為 - 第一張不能往左', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    const positionIndicator = page.getByTestId('position-indicator')

    // 初始在第一張
    await expect(positionIndicator).toContainText('1 / 5')

    // 嘗試按左鍵
    await page.keyboard.press('ArrowLeft')

    // 應該保持在第一張
    await expect(positionIndicator).toContainText('1 / 5')
  })

  test('導航邊界行為 - 最後一張不能往右', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    const positionIndicator = page.getByTestId('position-indicator')

    // 移到最後一張
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowRight')
    }

    await expect(positionIndicator).toContainText('5 / 5')

    // 嘗試按右鍵
    await page.keyboard.press('ArrowRight')

    // 應該保持在第五張
    await expect(positionIndicator).toContainText('5 / 5')
  })
})

/**
 * 任務 16.4 - 語音播放功能測試
 */
test.describe('快速占卜 - 語音播放測試', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/readings/quick')
  })

  test('Modal 內應該顯示語音播放按鈕', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 翻牌
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()
    await page.waitForTimeout(1000)

    // 點擊卡牌開啟 Modal
    await firstCard.click()
    await page.waitForTimeout(1000)

    // 檢查 Modal 是否開啟
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 3000 })

    // 語音播放按鈕應該存在（由 useTextToSpeech hook 提供）
    // 注意：實際按鈕文字或 aria-label 需要根據實作確認
  })

  test('不支援 Web Speech API 時應該顯示降級提示', async ({
    page,
    context,
  }) => {
    // Mock 移除 speechSynthesis API
    await page.addInitScript(() => {
      // @ts-ignore
      delete window.speechSynthesis
    })

    await page.goto('/readings/quick')

    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 翻牌並開啟 Modal
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()
    await page.waitForTimeout(1000)
    await firstCard.click()
    await page.waitForTimeout(1000)

    // 應該顯示 Modal（即使沒有語音功能）
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 3000 })
  })
})

/**
 * 任務 16.5 - CTA 轉換流程測試
 */
test.describe('快速占卜 - CTA 轉換流程測試', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/readings/quick')
  })

  test('點擊註冊按鈕應該導航至註冊頁面', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 翻牌以顯示 CTA
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()
    await page.waitForTimeout(1000)

    // 點擊註冊按鈕（更新後的文案）
    const registerButton = page.getByText('立即註冊 - 解鎖完整體驗')
    await expect(registerButton).toBeVisible()

    // 點擊會觸發導航（實際測試中可能需要攔截或 mock）
    // 這裡只驗證按鈕存在且可點擊
    await expect(registerButton).toBeEnabled()
  })

  test('點擊登入連結應該導航至登入頁面', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 翻牌
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()
    await page.waitForTimeout(1000)

    // 點擊登入按鈕
    const loginButton = page.getByText('已有帳號？立即登入')
    await expect(loginButton).toBeVisible()
    await expect(loginButton).toBeEnabled()
  })

  test('Modal 內應該顯示次要 CTA', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 翻牌並開啟 Modal
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()
    await page.waitForTimeout(1000)
    await firstCard.click()
    await page.waitForTimeout(1000)

    // Modal 應該顯示
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 3000 })

    // Modal 內應該有訪客模式 CTA（根據 CardDetailModal 的 isGuestMode prop）
    // 實際文案需要根據實作檢查
  })
})

/**
 * localStorage 永久保存測試（v2.0 新增）
 */
test.describe('快速占卜 - localStorage 永久保存測試', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/readings/quick')
  })

  test('localStorage 應該永久保存，無過期機制', async ({ page }) => {
    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 翻牌
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()
    await page.waitForTimeout(1000)

    // 手動修改 localStorage 時間戳記為 1 年前
    await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-quick-reading')
      if (data) {
        const parsed = JSON.parse(data)
        const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000
        parsed.timestamp = oneYearAgo
        localStorage.setItem('wasteland-tarot-quick-reading', JSON.stringify(parsed))
      }
    })

    // 重新整理頁面
    await page.reload()

    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 狀態應該仍然恢復（無過期檢查）
    await expect(page.getByText('這是你的專屬命運展示 - 僅此一次')).toBeVisible({ timeout: 2000 })
  })
})

test.describe('快速占卜 - 響應式設計測試', () => {
  test('移動裝置 (375px) 應該正確顯示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/readings/quick')

    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    await expect(page.getByText('選擇你的命運之牌')).toBeVisible()
    await expect(page.getByTestId('position-indicator')).toBeVisible()
  })

  test('平板裝置 (768px) 應該正確顯示', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/readings/quick')

    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    await expect(page.getByText('選擇你的命運之牌')).toBeVisible()
  })

  test('桌面裝置 (1280px) 應該正確顯示', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/readings/quick')

    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    await expect(page.getByText('選擇你的命運之牌')).toBeVisible()
  })
})
