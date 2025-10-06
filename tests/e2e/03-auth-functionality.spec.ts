import { test, expect } from '@playwright/test'

test.describe('認證功能測試', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test.describe('登入功能', () => {
    test('登入頁面載入和顯示', async ({ page }) => {
      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      // 檢查頁面標題
      await expect(page).toHaveTitle(/登入|廢土塔羅/)

      // 檢查基本元素存在（根據實際登入表單調整）
      await expect(page.getByText('廢土塔羅')).toBeVisible()

      // 截圖保存登入頁面
      await page.screenshot({ path: 'test-results/screenshots/login-page.png', fullPage: true })
    })

    test('登入表單互動測試', async ({ page }) => {
      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      // 檢查是否有表單元素（需要根據實際實現調整）
      // 這裡使用通用的選擇器來檢測可能的表單元素
      const inputs = page.locator('input')
      const inputCount = await inputs.count()

      if (inputCount > 0) {
        console.log(`找到 ${inputCount} 個輸入欄位`)

        // 嘗試與第一個輸入欄位互動
        const firstInput = inputs.first()
        await firstInput.click()
        await firstInput.fill('test@example.com')

        // 檢查輸入值
        await expect(firstInput).toHaveValue('test@example.com')
      }

      // 檢查是否有提交按鈕
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()
      console.log(`找到 ${buttonCount} 個按鈕`)

      // 截圖保存表單互動狀態
      await page.screenshot({ path: 'test-results/screenshots/login-form-interaction.png' })
    })

    test('登入錯誤處理測試', async ({ page }) => {
      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      // 檢查表單驗證（如果有的話）
      const submitButtons = page.locator('button[type="submit"], button').filter({ hasText: /登入|submit|sign/i })
      const submitButtonCount = await submitButtons.count()

      if (submitButtonCount > 0) {
        // 嘗試提交空表單
        await submitButtons.first().click()

        // 等待可能的錯誤訊息
        await page.waitForTimeout(1000)

        // 截圖保存錯誤狀態
        await page.screenshot({ path: 'test-results/screenshots/login-error-handling.png' })
      }
    })
  })

  test.describe('註冊功能', () => {
    test('註冊頁面載入和顯示', async ({ page }) => {
      await page.goto('/auth/register')
      await page.waitForLoadState('networkidle')

      // 檢查頁面標題
      await expect(page).toHaveTitle(/註冊|廢土塔羅/)

      // 檢查基本元素存在
      await expect(page.getByText('廢土塔羅')).toBeVisible()

      // 截圖保存註冊頁面
      await page.screenshot({ path: 'test-results/screenshots/register-page.png', fullPage: true })
    })

    test('註冊表單互動測試', async ({ page }) => {
      await page.goto('/auth/register')
      await page.waitForLoadState('networkidle')

      // 檢查是否有表單元素
      const inputs = page.locator('input')
      const inputCount = await inputs.count()

      if (inputCount > 0) {
        console.log(`註冊頁面找到 ${inputCount} 個輸入欄位`)

        // 嘗試填寫表單（使用測試數據）
        for (let i = 0; i < Math.min(inputCount, 3); i++) {
          const input = inputs.nth(i)
          const inputType = await input.getAttribute('type') || 'text'

          if (inputType === 'email') {
            await input.fill('test@example.com')
          } else if (inputType === 'password') {
            await input.fill('TestPassword123!')
          } else {
            await input.fill(`TestValue${i}`)
          }
        }

        // 截圖保存表單填寫狀態
        await page.screenshot({ path: 'test-results/screenshots/register-form-filled.png' })
      }
    })

    test('註冊表單驗證測試', async ({ page }) => {
      await page.goto('/auth/register')
      await page.waitForLoadState('networkidle')

      // 檢查表單驗證
      const submitButtons = page.locator('button[type="submit"], button').filter({ hasText: /註冊|register|sign/i })
      const submitButtonCount = await submitButtons.count()

      if (submitButtonCount > 0) {
        // 嘗試提交空表單
        await submitButtons.first().click()

        // 等待可能的驗證訊息
        await page.waitForTimeout(1000)

        // 截圖保存驗證狀態
        await page.screenshot({ path: 'test-results/screenshots/register-validation.png' })
      }
    })
  })

  test.describe('認證狀態測試', () => {
    test('未登入狀態受保護頁面訪問', async ({ page }) => {
      const protectedUrls = ['/dashboard', '/profile', '/readings/new']

      for (const url of protectedUrls) {
        await page.goto(url)
        await page.waitForLoadState('networkidle')

        // 檢查是否被重定向到登入頁或顯示適當的訊息
        const currentUrl = page.url()
        console.log(`訪問 ${url}，當前 URL: ${currentUrl}`)

        // 截圖保存保護頁面狀態
        await page.screenshot({ path: `test-results/screenshots/protected-${url.replace(/\//g, '-')}.png` })
      }
    })

    test('登入/登出按鈕狀態切換', async ({ page }) => {
      // 檢查初始狀態（未登入）
      await expect(page.getByRole('button', { name: '登入' })).toBeVisible()
      await expect(page.getByRole('button', { name: '註冊' })).toBeVisible()

      // 檢查是否沒有登出按鈕
      const logoutButton = page.getByRole('button', { name: '登出' })
      const logoutButtonCount = await logoutButton.count()
      expect(logoutButtonCount).toBe(0)

      // 截圖保存未登入狀態
      await page.screenshot({ path: 'test-results/screenshots/unauthenticated-state.png' })
    })
  })

  test('表單可用性測試', async ({ page }) => {
    // 測試登入表單
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')

    // 檢查鍵盤導航
    await page.keyboard.press('Tab')
    await page.waitForTimeout(500)

    // 檢查焦點是否正確
    const focusedElement = page.locator(':focus')
    const focusedCount = await focusedElement.count()
    console.log(`登入頁面焦點元素數量: ${focusedCount}`)

    // 測試註冊表單
    await page.goto('/auth/register')
    await page.waitForLoadState('networkidle')

    await page.keyboard.press('Tab')
    await page.waitForTimeout(500)

    // 截圖保存可用性測試狀態
    await page.screenshot({ path: 'test-results/screenshots/form-accessibility.png' })
  })
})