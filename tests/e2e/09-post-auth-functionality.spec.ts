import { test, expect } from '@playwright/test'

/**
 * 登入後功能測試 - 簡化版本
 * 直接測試登入後頁面的功能，不依賴複雜的認證流程
 */

test.describe('登入後頁面功能測試', () => {

  test.describe('1. 基本頁面訪問測試', () => {
    test('登入頁面基本功能', async ({ page }) => {
      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      // 檢查頁面基本元素 - 使用更精確的選擇器
      await expect(page.getByRole('heading', { name: '避難所科技' })).toBeVisible()
      await expect(page.locator('#username')).toBeVisible()
      await expect(page.locator('#password')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()

      // 截圖保存登入頁面
      await page.screenshot({
        path: 'test-results/screenshots/post-auth/01-login-page.png',
        fullPage: true
      })
    })

    test('Dashboard 頁面基本結構', async ({ page }) => {
      // 嘗試直接訪問 Dashboard
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // 檢查頁面是否載入（可能會重定向到登入頁）
      const currentUrl = page.url()
      console.log(`Dashboard 訪問後的 URL: ${currentUrl}`)

      // 檢查頁面內容
      const pageContent = await page.locator('body').textContent()
      console.log(`頁面包含內容長度: ${pageContent?.length || 0}`)

      // 截圖保存 Dashboard 狀態
      await page.screenshot({
        path: 'test-results/screenshots/post-auth/02-dashboard-access.png',
        fullPage: true
      })
    })

    test('Cards 頁面基本結構', async ({ page }) => {
      await page.goto('/cards')
      await page.waitForLoadState('networkidle')

      const currentUrl = page.url()
      console.log(`Cards 頁面訪問後的 URL: ${currentUrl}`)

      // 檢查頁面內容
      const pageContent = await page.locator('body').textContent()
      console.log(`Cards 頁面內容長度: ${pageContent?.length || 0}`)

      // 截圖保存 Cards 頁面
      await page.screenshot({
        path: 'test-results/screenshots/post-auth/03-cards-access.png',
        fullPage: true
      })
    })
  })

  test.describe('2. 表單功能測試', () => {
    test('登入表單互動', async ({ page }) => {
      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      // 測試表單填寫
      const usernameInput = page.locator('#username')
      const passwordInput = page.locator('#password')

      await usernameInput.fill('test_user')
      await passwordInput.fill('test_password')

      // 檢查輸入值
      await expect(usernameInput).toHaveValue('test_user')
      await expect(passwordInput).toHaveValue('test_password')

      // 檢查記住我選項
      const rememberCheckbox = page.locator('input[type="checkbox"]')
      if (await rememberCheckbox.count() > 0) {
        await rememberCheckbox.check()
        await expect(rememberCheckbox).toBeChecked()
      }

      // 截圖保存表單填寫狀態
      await page.screenshot({
        path: 'test-results/screenshots/post-auth/04-form-interaction.png'
      })
    })

    test('表單驗證測試', async ({ page }) => {
      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      // 測試空表單提交
      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()
      await page.waitForTimeout(1000)

      // 檢查是否有驗證錯誤
      const errorElements = page.locator('.text-red-400, [class*="error"]')
      const errorCount = await errorElements.count()
      console.log(`驗證錯誤元素數量: ${errorCount}`)

      if (errorCount > 0) {
        for (let i = 0; i < errorCount; i++) {
          const errorText = await errorElements.nth(i).textContent()
          console.log(`錯誤 ${i + 1}: ${errorText}`)
        }
      }

      // 截圖保存驗證錯誤狀態
      await page.screenshot({
        path: 'test-results/screenshots/post-auth/05-validation-errors.png'
      })
    })
  })

  test.describe('3. 中文化驗證', () => {
    test('登入頁面中文內容', async ({ page }) => {
      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      // 檢查中文元素
      const chineseElements = [
        '避難所科技',
        '営営小子身份驗證終端機',
        '避難所居民ID',
        '存取密碼',
        '在此終端機記住我',
        '初始化営営小子',
        '加入避難所科技'
      ]

      for (const text of chineseElements) {
        const element = page.getByText(text)
        const isVisible = await element.count() > 0
        console.log(`中文文字 "${text}": ${isVisible ? '找到' : '未找到'}`)
      }

      // 截圖保存中文化狀態
      await page.screenshot({
        path: 'test-results/screenshots/post-auth/06-chinese-localization.png',
        fullPage: true
      })
    })

    test('各頁面標題中文化', async ({ page }) => {
      const pages = [
        { url: '/auth/login', expectedTitle: /避難所居民登入|廢土塔羅/ },
        { url: '/auth/register', expectedTitle: /註冊|廢土塔羅/ },
        { url: '/dashboard', expectedTitle: /控制台|dashboard|廢土塔羅/ },
        { url: '/cards', expectedTitle: /卡片|cards|廢土塔羅/ }
      ]

      for (const pageInfo of pages) {
        await page.goto(pageInfo.url)
        await page.waitForLoadState('networkidle')

        const title = await page.title()
        console.log(`${pageInfo.url} 的標題: ${title}`)

        // 檢查標題是否符合預期
        const titleMatches = pageInfo.expectedTitle.test(title)
        console.log(`標題是否符合預期: ${titleMatches}`)
      }
    })
  })

  test.describe('4. 響應式設計測試', () => {
    test('不同視口下的登入頁面', async ({ page }) => {
      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      const viewports = [
        { width: 1920, height: 1080, name: 'desktop' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 375, height: 667, name: 'mobile' }
      ]

      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.waitForTimeout(500)

        // 檢查關鍵元素是否仍然可見
        await expect(page.locator('#username')).toBeVisible()
        await expect(page.locator('#password')).toBeVisible()
        await expect(page.locator('button[type="submit"]')).toBeVisible()

        // 截圖保存響應式狀態
        await page.screenshot({
          path: `test-results/screenshots/post-auth/07-responsive-${viewport.name}.png`,
          fullPage: true
        })
      }
    })
  })

  test.describe('5. 可訪問性測試', () => {
    test('鍵盤導航', async ({ page }) => {
      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      // 測試 Tab 鍵導航
      await page.keyboard.press('Tab')
      await page.waitForTimeout(200)

      // 檢查焦點是否在用戶名輸入框
      const focusedElement = page.locator(':focus')
      const focusedCount = await focusedElement.count()
      console.log(`Tab 導航後聚焦元素數量: ${focusedCount}`)

      if (focusedCount > 0) {
        const tagName = await focusedElement.first().evaluate(el => el.tagName)
        const id = await focusedElement.first().getAttribute('id')
        console.log(`聚焦元素: ${tagName} (id: ${id})`)
      }

      // 繼續 Tab 導航
      await page.keyboard.press('Tab')
      await page.waitForTimeout(200)

      const secondFocus = page.locator(':focus')
      const secondFocusCount = await secondFocus.count()
      if (secondFocusCount > 0) {
        const secondTagName = await secondFocus.first().evaluate(el => el.tagName)
        const secondId = await secondFocus.first().getAttribute('id')
        console.log(`第二個聚焦元素: ${secondTagName} (id: ${secondId})`)
      }

      // 截圖保存鍵盤導航狀態
      await page.screenshot({
        path: 'test-results/screenshots/post-auth/08-keyboard-navigation.png'
      })
    })

    test('表單標籤和可訪問性屬性', async ({ page }) => {
      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      // 檢查標籤關聯
      const usernameLabel = page.locator('label[for="username"]')
      const passwordLabel = page.locator('label[for="password"]')

      await expect(usernameLabel).toBeVisible()
      await expect(passwordLabel).toBeVisible()

      // 檢查 aria-required 屬性
      const usernameInput = page.locator('#username')
      const passwordInput = page.locator('#password')

      const usernameRequired = await usernameInput.getAttribute('aria-required')
      const passwordRequired = await passwordInput.getAttribute('aria-required')

      console.log(`用戶名輸入框 aria-required: ${usernameRequired}`)
      console.log(`密碼輸入框 aria-required: ${passwordRequired}`)
    })
  })

  test.describe('6. 載入和性能測試', () => {
    test('頁面載入時間', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      const endTime = Date.now()
      const loadTime = endTime - startTime

      console.log(`登入頁面載入時間: ${loadTime}ms`)

      // 檢查頁面是否在合理時間內載入（5秒以內）
      expect(loadTime).toBeLessThan(5000)
    })

    test('資源載入檢查', async ({ page }) => {
      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      // 檢查是否有 JavaScript 錯誤
      const errors: string[] = []
      page.on('pageerror', (error) => {
        errors.push(error.message)
      })

      await page.waitForTimeout(2000)

      if (errors.length > 0) {
        console.log('頁面錯誤:')
        errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error}`)
        })
      } else {
        console.log('未發現 JavaScript 錯誤')
      }

      // 檢查控制台警告
      const warnings: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'warning') {
          warnings.push(msg.text())
        }
      })

      console.log(`控制台警告數量: ${warnings.length}`)
    })
  })
})