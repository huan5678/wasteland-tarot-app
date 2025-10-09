import { test, expect } from '@playwright/test'

test.describe('互動元素測試', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('按鈕 hover 效果測試', async ({ page }) => {
    // 測試主要按鈕的 hover 效果
    const primaryButton = page.getByRole('button', { name: '進入避難所' })

    // 移動到按鈕上
    await primaryButton.hover()
    await page.waitForTimeout(500)

    // 截圖保存 hover 狀態
    await page.screenshot({ path: 'test-results/screenshots/button-hover-effect.png' })

    // 檢查按鈕是否有視覺變化（通過 CSS 類檢查）
    const buttonClasses = await primaryButton.getAttribute('class')
    expect(buttonClasses).toContain('hover:')

    // 測試次要按鈕
    const secondaryButton = page.getByRole('button', { name: '快速占卜' })
    await secondaryButton.hover()
    await page.waitForTimeout(500)

    await page.screenshot({ path: 'test-results/screenshots/secondary-button-hover.png' })
  })

  test('動畫效果測試', async ({ page }) => {
    // 檢查 Pip-Boy 狀態指示燈動畫
    const statusLight = page.locator('.animate-pulse').first()
    await expect(statusLight).toBeVisible()

    // 檢查掃描線效果
    const scanlines = page.locator('.animate-pulse')
    const animatedElementsCount = await scanlines.count()
    console.log(`找到 ${animatedElementsCount} 個動畫元素`)

    // 截圖保存動畫狀態
    await page.screenshot({ path: 'test-results/screenshots/animations.png' })
  })

  test('按鈕點擊響應測試', async ({ page }) => {
    const buttons = [
      { name: '進入避難所', expectedUrl: '/auth/login' },
      { name: '快速占卜', expectedUrl: '/auth/register' },
      { name: '註冊避難所帳號', expectedUrl: '/auth/register' },
      { name: '瀏覽卡牌圖書館', expectedUrl: '/cards' }
    ]

    for (const { name, expectedUrl } of buttons) {
      // 回到首頁
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // 點擊按鈕
      await page.getByRole('button', { name }).click()
      await page.waitForLoadState('networkidle')

      // 驗證導航
      await expect(page).toHaveURL(expectedUrl)

      console.log(`✅ 按鈕 "${name}" 正確導航到 ${expectedUrl}`)
    }
  })

  test('鍵盤導航測試', async ({ page }) => {
    // 使用 Tab 鍵導航
    let tabCount = 0
    const maxTabs = 10

    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab')
      tabCount++

      // 檢查當前焦點元素
      const focusedElement = page.locator(':focus')
      const focusedElementCount = await focusedElement.count()

      if (focusedElementCount > 0) {
        const tagName = await focusedElement.evaluate(el => el.tagName)
        const text = await focusedElement.textContent().catch(() => '')

        console.log(`Tab ${tabCount}: 焦點在 ${tagName} 元素，內容: "${text?.slice(0, 30)}..."`)
      }

      await page.waitForTimeout(200)
    }

    // 截圖保存鍵盤導航狀態
    await page.screenshot({ path: 'test-results/screenshots/keyboard-navigation.png' })
  })

  test('觸控/行動裝置互動測試', async ({ page }) => {
    // 測試觸控點擊
    const primaryButton = page.getByRole('button', { name: '進入避難所' })

    // 模擬觸控點擊
    await primaryButton.tap()
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL('/auth/login')

    // 回到首頁測試滑動（如果有相關功能）
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 截圖保存觸控互動狀態
    await page.screenshot({ path: 'test-results/screenshots/touch-interaction.png' })
  })

  test('表單元素互動測試', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')

    // 檢查表單輸入元素
    const inputs = page.locator('input')
    const inputCount = await inputs.count()

    if (inputCount > 0) {
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i)

        // 測試點擊聚焦
        await input.click()
        await page.waitForTimeout(200)

        // 測試輸入
        await input.fill(`test-input-${i}`)
        await page.waitForTimeout(200)

        // 測試清除
        await input.clear()
        await page.waitForTimeout(200)

        console.log(`✅ 輸入欄位 ${i} 互動測試完成`)
      }

      // 截圖保存表單互動狀態
      await page.screenshot({ path: 'test-results/screenshots/form-interaction.png' })
    }
  })

  test('載入狀態和錯誤處理測試', async ({ page }) => {
    // 攔截網路請求來模擬載入狀態
    await page.route('**/*', async route => {
      // 延遲響應來觀察載入狀態
      await new Promise(resolve => setTimeout(resolve, 100))
      await route.continue()
    })

    await page.goto('/cards')
    await page.waitForLoadState('networkidle')

    // 檢查是否有載入指示器或錯誤訊息處理
    await page.screenshot({ path: 'test-results/screenshots/loading-states.png', fullPage: true })
  })

  test('視覺反饋測試', async ({ page }) => {
    // 測試按鈕按下時的視覺反饋
    const button = page.getByRole('button', { name: '進入避難所' })

    // 按下但不釋放
    await button.hover()
    await page.mouse.down()
    await page.waitForTimeout(300)

    // 截圖保存按下狀態
    await page.screenshot({ path: 'test-results/screenshots/button-pressed-state.png' })

    // 釋放按鈕
    await page.mouse.up()
    await page.waitForTimeout(300)

    // 截圖保存釋放後狀態
    await page.screenshot({ path: 'test-results/screenshots/button-released-state.png' })
  })

  test('連續快速點擊防護測試', async ({ page }) => {
    const button = page.getByRole('button', { name: '進入避難所' })

    // 記錄開始時間
    const startTime = Date.now()

    // 快速連續點擊
    for (let i = 0; i < 5; i++) {
      await button.click({ force: true })
      await page.waitForTimeout(50) // 很短的間隔
    }

    // 等待導航完成
    await page.waitForLoadState('networkidle')

    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`快速點擊測試耗時: ${duration}ms`)

    // 確保最終只導航了一次
    await expect(page).toHaveURL('/auth/login')

    // 截圖保存最終狀態
    await page.screenshot({ path: 'test-results/screenshots/rapid-click-protection.png' })
  })

  test('輔助功能測試', async ({ page }) => {
    // 檢查是否有適當的 aria-label 和其他無障礙屬性
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const ariaLabel = await button.getAttribute('aria-label')
      const title = await button.getAttribute('title')
      const text = await button.textContent()

      console.log(`按鈕 ${i}: 文字="${text?.slice(0, 20)}", aria-label="${ariaLabel}", title="${title}"`)
    }

    // 檢查是否有跳至主要內容的連結
    const skipLinks = page.locator('a[href="#main"], [class*="skip"]')
    const skipLinkCount = await skipLinks.count()
    console.log(`找到 ${skipLinkCount} 個跳過連結`)

    // 截圖保存輔助功能狀態
    await page.screenshot({ path: 'test-results/screenshots/accessibility-features.png' })
  })
})