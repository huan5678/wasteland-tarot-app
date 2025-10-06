import { test, expect, authenticateUser } from './test-setup'

/**
 * 完整的登入後用戶流程測試
 * 測試所有登入後功能、中文化、用戶體驗等
 */

test.describe('登入後完整功能測試', () => {

  test.describe('1. 登入流程測試', () => {
    test('完整登入流程和狀態持久性', async ({ page }) => {
      // 1. 測試登入頁面載入
      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      // 檢查頁面標題和基本元素
      await expect(page).toHaveTitle(/登入|廢土塔羅|Wasteland Tarot/i)
      await expect(page.getByText('避難所科技')).toBeVisible()

      // 截圖保存登入頁面狀態
      await page.screenshot({
        path: 'test-results/screenshots/authenticated-flow/01-login-page.png',
        fullPage: true
      })

      // 2. 執行登入
      await authenticateUser(page)

      // 3. 驗證登入成功 - 檢查是否重定向到正確頁面
      const currentUrl = page.url()
      console.log(`登入後當前 URL: ${currentUrl}`)

      // 應該被重定向到 dashboard 或首頁
      expect(currentUrl).toMatch(/(dashboard|\/home|\/main|\/$)/)

      // 4. 測試狀態持久性 - 刷新頁面
      await page.reload()
      await page.waitForLoadState('networkidle')

      // 檢查是否仍然保持登入狀態
      const urlAfterReload = page.url()
      expect(urlAfterReload).not.toContain('/auth/login')

      // 截圖保存登入成功狀態
      await page.screenshot({
        path: 'test-results/screenshots/authenticated-flow/02-login-success.png',
        fullPage: true
      })
    })

    test('登入表單驗證和錯誤處理', async ({ page }) => {
      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      // 測試空表單提交
      const loginButton = page.locator('button[type="submit"]')

      await loginButton.click()
      await page.waitForTimeout(1000)

      // 檢查驗證錯誤訊息（如果有的話）
      const errorMessages = page.locator('[class*="error"], [class*="invalid"], .text-red, .text-destructive')
      const errorCount = await errorMessages.count()
      console.log(`發現 ${errorCount} 個錯誤訊息元素`)

      // 截圖保存驗證錯誤狀態
      await page.screenshot({
        path: 'test-results/screenshots/authenticated-flow/03-login-validation.png'
      })
    })
  })

  test.describe('2. Dashboard 頁面功能測試', () => {
    test.beforeEach(async ({ page }) => {
      await authenticateUser(page)
      // 確保導航到 dashboard
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
    })

    test('Dashboard 頁面載入和統計卡片顯示', async ({ page }) => {
      // 檢查頁面標題
      await expect(page).toHaveTitle(/控制台|dashboard|儀表板/i)

      // 檢查統計卡片的存在
      const statsCards = page.locator('[class*="card"], [class*="stat"], [data-testid*="stat"]')
      const cardCount = await statsCards.count()
      console.log(`Dashboard 找到 ${cardCount} 個統計卡片`)

      // 檢查是否有數字統計顯示
      const numbers = page.locator('text=/\\d+/')
      const numberCount = await numbers.count()
      console.log(`Dashboard 找到 ${numberCount} 個數字統計`)

      // 檢查重要的 Dashboard 元素
      const dashboardElements = [
        '占卜記錄', '總占卜次數', '總計', 'readings', 'total', 'karma', '業力',
        '派系', 'faction', '廢土', 'wasteland'
      ]

      for (const element of dashboardElements) {
        const elementLocator = page.getByText(new RegExp(element, 'i'))
        const elementCount = await elementLocator.count()
        if (elementCount > 0) {
          console.log(`找到 Dashboard 元素: ${element}`)
        }
      }

      // 截圖保存 Dashboard 狀態
      await page.screenshot({
        path: 'test-results/screenshots/authenticated-flow/04-dashboard-overview.png',
        fullPage: true
      })
    })

    test('Dashboard 快速操作按鈕功能', async ({ page }) => {
      // 查找快速操作按鈕
      const actionButtons = page.locator('button, a').filter({
        hasText: /新增|新建|開始|start|new|create|占卜|reading/i
      })

      const buttonCount = await actionButtons.count()
      console.log(`Dashboard 找到 ${buttonCount} 個操作按鈕`)

      // 測試每個按鈕的可點擊性
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = actionButtons.nth(i)
        const buttonText = await button.textContent()
        console.log(`測試按鈕: ${buttonText}`)

        // 檢查按鈕是否可見和可點擊
        await expect(button).toBeVisible()

        // 嘗試點擊按鈕（但不執行導航）
        const isClickable = await button.isEnabled()
        console.log(`按鈕 "${buttonText}" 可點擊: ${isClickable}`)
      }

      // 截圖保存快速操作按鈕狀態
      await page.screenshot({
        path: 'test-results/screenshots/authenticated-flow/05-dashboard-actions.png'
      })
    })

    test('Dashboard 占卜記錄和系統狀態', async ({ page }) => {
      // 檢查占卜記錄區域
      const recordElements = page.locator('*').filter({
        hasText: /記錄|history|recent|最近|latest/i
      })
      const recordCount = await recordElements.count()
      console.log(`找到 ${recordCount} 個記錄相關元素`)

      // 檢查系統狀態顯示
      const statusElements = page.locator('*').filter({
        hasText: /狀態|status|健康|health|輻射|radiation/i
      })
      const statusCount = await statusElements.count()
      console.log(`找到 ${statusCount} 個狀態相關元素`)

      // 檢查用戶資訊顯示
      const userInfoElements = page.locator('*').filter({
        hasText: /vault_dweller|sole survivor|避難所|vault/i
      })
      const userInfoCount = await userInfoElements.count()
      console.log(`找到 ${userInfoCount} 個用戶資訊元素`)

      // 截圖保存記錄和狀態
      await page.screenshot({
        path: 'test-results/screenshots/authenticated-flow/06-dashboard-records.png',
        fullPage: true
      })
    })
  })

  test.describe('3. Cards 頁面功能測試', () => {
    test.beforeEach(async ({ page }) => {
      await authenticateUser(page)
      await page.goto('/cards')
      await page.waitForLoadState('networkidle')
    })

    test('Cards 頁面載入和卡片圖書館顯示', async ({ page }) => {
      // 檢查頁面標題
      await expect(page).toHaveTitle(/卡片|cards|圖書館|library/i)

      // 檢查卡片網格或列表的存在
      const cardElements = page.locator('[class*="card"], [data-testid*="card"], img')
      const cardCount = await cardElements.count()
      console.log(`Cards 頁面找到 ${cardCount} 個卡片元素`)

      // 檢查是否有卡片圖片
      const cardImages = page.locator('img')
      const imageCount = await cardImages.count()
      console.log(`Cards 頁面找到 ${imageCount} 個圖片`)

      // 檢查卡片名稱或標題
      const cardTitles = page.locator('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="name"]')
      const titleCount = await cardTitles.count()
      console.log(`Cards 頁面找到 ${titleCount} 個標題元素`)

      // 截圖保存 Cards 頁面狀態
      await page.screenshot({
        path: 'test-results/screenshots/authenticated-flow/07-cards-overview.png',
        fullPage: true
      })
    })

    test('Cards 搜尋和篩選功能', async ({ page }) => {
      // 查找搜尋輸入欄位
      const searchInputs = page.locator('input[type="search"], input[placeholder*="搜"], input[placeholder*="search"]')
      const searchCount = await searchInputs.count()
      console.log(`找到 ${searchCount} 個搜尋輸入欄位`)

      if (searchCount > 0) {
        const searchInput = searchInputs.first()

        // 測試搜尋功能
        await searchInput.fill('fool')
        await page.waitForTimeout(1000)

        // 檢查搜尋結果
        const resultsAfterSearch = page.locator('[class*="card"], [data-testid*="card"]')
        const resultsCount = await resultsAfterSearch.count()
        console.log(`搜尋 "fool" 後找到 ${resultsCount} 個結果`)

        // 清除搜尋
        await searchInput.clear()
        await page.waitForTimeout(1000)
      }

      // 查找篩選器
      const filterElements = page.locator('select, [role="combobox"], [class*="filter"]')
      const filterCount = await filterElements.count()
      console.log(`找到 ${filterCount} 個篩選器元素`)

      // 截圖保存搜尋篩選狀態
      await page.screenshot({
        path: 'test-results/screenshots/authenticated-flow/08-cards-search.png'
      })
    })

    test('卡片詳情顯示功能', async ({ page }) => {
      // 查找可點擊的卡片
      const clickableCards = page.locator('[class*="card"]:not([disabled]), [data-testid*="card"]:not([disabled]), img').first()
      const cardExists = await clickableCards.count() > 0

      if (cardExists) {
        // 點擊第一張卡片
        await clickableCards.click()
        await page.waitForTimeout(1000)

        // 檢查是否有詳情顯示（模態框或新頁面）
        const modalElements = page.locator('[role="dialog"], [class*="modal"], [class*="popup"]')
        const modalCount = await modalElements.count()
        console.log(`點擊卡片後找到 ${modalCount} 個模態框`)

        // 檢查詳情內容
        const detailElements = page.locator('p, [class*="description"], [class*="detail"]')
        const detailCount = await detailElements.count()
        console.log(`找到 ${detailCount} 個詳情元素`)

        // 截圖保存卡片詳情狀態
        await page.screenshot({
          path: 'test-results/screenshots/authenticated-flow/09-card-details.png'
        })

        // 如果有關閉按鈕，點擊關閉
        const closeButtons = page.locator('[aria-label*="close"], [aria-label*="關閉"], button').filter({
          hasText: /×|close|關閉/i
        })
        const closeCount = await closeButtons.count()
        if (closeCount > 0) {
          await closeButtons.first().click()
          await page.waitForTimeout(500)
        }
      }
    })
  })

  test.describe('4. Header 導航功能測試', () => {
    test.beforeEach(async ({ page }) => {
      await authenticateUser(page)
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
    })

    test('Header 導航連結測試', async ({ page }) => {
      // 查找導航連結
      const navLinks = page.locator('nav a, header a, [role="navigation"] a')
      const linkCount = await navLinks.count()
      console.log(`Header 找到 ${linkCount} 個導航連結`)

      // 測試主要導航連結
      const mainNavItems = ['dashboard', 'cards', 'readings', '儀表板', '卡片', '占卜']

      for (const navItem of mainNavItems) {
        const navLink = page.locator('a').filter({ hasText: new RegExp(navItem, 'i') })
        const linkExists = await navLink.count() > 0

        if (linkExists) {
          console.log(`找到導航連結: ${navItem}`)

          // 檢查連結是否可見和可點擊
          await expect(navLink.first()).toBeVisible()

          // 測試連結點擊（記錄 href 但不實際導航）
          const href = await navLink.first().getAttribute('href')
          console.log(`${navItem} 連結指向: ${href}`)
        }
      }

      // 截圖保存 Header 導航狀態
      await page.screenshot({
        path: 'test-results/screenshots/authenticated-flow/10-header-navigation.png'
      })
    })

    test('用戶資訊顯示測試', async ({ page }) => {
      // 查找用戶資訊顯示區域
      const userInfoElements = page.locator('*').filter({
        hasText: /vault_dweller|the sole survivor|避難所|dweller/i
      })
      const userInfoCount = await userInfoElements.count()
      console.log(`Header 找到 ${userInfoCount} 個用戶資訊元素`)

      // 檢查用戶選單或下拉式選單
      const userMenus = page.locator('[role="button"][aria-expanded], [class*="dropdown"], [class*="menu"]')
      const menuCount = await userMenus.count()
      console.log(`找到 ${menuCount} 個用戶選單`)

      // 檢查用戶頭像或圖示
      const avatars = page.locator('[class*="avatar"], [class*="profile"], img[alt*="user"], img[alt*="用戶"]')
      const avatarCount = await avatars.count()
      console.log(`找到 ${avatarCount} 個用戶頭像`)

      // 截圖保存用戶資訊顯示
      await page.screenshot({
        path: 'test-results/screenshots/authenticated-flow/11-user-info.png'
      })
    })

    test('登出功能測試', async ({ page }) => {
      // 查找登出按鈕或連結
      const logoutElements = page.locator('button, a').filter({
        hasText: /登出|logout|sign.*out|exit/i
      })
      const logoutCount = await logoutElements.count()
      console.log(`找到 ${logoutCount} 個登出元素`)

      if (logoutCount > 0) {
        // 測試登出功能
        const logoutElement = logoutElements.first()
        await logoutElement.click()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        // 檢查是否被重定向到登入頁面或首頁
        const currentUrl = page.url()
        console.log(`登出後當前 URL: ${currentUrl}`)

        // 應該被重定向到登入頁或首頁
        const isRedirectedCorrectly = currentUrl.includes('/auth/login') ||
                                     currentUrl.includes('/auth') ||
                                     currentUrl.endsWith('/')

        expect(isRedirectedCorrectly).toBeTruthy()

        // 截圖保存登出後狀態
        await page.screenshot({
          path: 'test-results/screenshots/authenticated-flow/12-logout-success.png'
        })
      } else {
        console.log('未找到登出按鈕 - 可能在用戶選單中')

        // 嘗試點擊用戶選單
        const userMenus = page.locator('[role="button"], [class*="dropdown"], [class*="user"]')
        const menuCount = await userMenus.count()

        if (menuCount > 0) {
          await userMenus.first().click()
          await page.waitForTimeout(1000)

          // 再次查找登出按鈕
          const hiddenLogout = page.locator('button, a').filter({
            hasText: /登出|logout|sign.*out|exit/i
          })
          const hiddenLogoutCount = await hiddenLogout.count()

          if (hiddenLogoutCount > 0) {
            console.log('在用戶選單中找到登出按鈕')
            await hiddenLogout.first().click()
            await page.waitForLoadState('networkidle')
          }
        }
      }
    })
  })

  test.describe('5. 中文化驗證測試', () => {
    test.beforeEach(async ({ page }) => {
      await authenticateUser(page)
    })

    test('登入後頁面中文化完整性', async ({ page }) => {
      const pages = [
        { url: '/dashboard', name: 'Dashboard' },
        { url: '/cards', name: 'Cards' },
        { url: '/readings', name: 'Readings' },
        { url: '/profile', name: 'Profile' }
      ]

      for (const pageInfo of pages) {
        await page.goto(pageInfo.url)
        await page.waitForLoadState('networkidle')

        // 檢查中文字符的存在
        const chineseText = page.locator('*').filter({
          hasText: /[\u4e00-\u9fff]/
        })
        const chineseCount = await chineseText.count()
        console.log(`${pageInfo.name} 頁面找到 ${chineseCount} 個中文元素`)

        // 檢查重要的中文詞彙
        const importantChinese = ['廢土', '塔羅', '占卜', '業力', '派系', '避難所']
        for (const word of importantChinese) {
          const wordElements = page.locator('*').filter({ hasText: word })
          const wordCount = await wordElements.count()
          if (wordCount > 0) {
            console.log(`${pageInfo.name} 頁面找到中文詞彙 "${word}": ${wordCount} 次`)
          }
        }

        // 截圖保存中文化狀態
        await page.screenshot({
          path: `test-results/screenshots/authenticated-flow/13-localization-${pageInfo.name.toLowerCase()}.png`,
          fullPage: true
        })
      }
    })

    test('錯誤訊息和狀態提示中文化', async ({ page }) => {
      // 檢查各種可能的錯誤狀態
      await page.goto('/cards')
      await page.waitForLoadState('networkidle')

      // 檢查載入狀態的中文化
      const loadingElements = page.locator('*').filter({
        hasText: /載入|加載|loading|正在/
      })
      const loadingCount = await loadingElements.count()
      console.log(`找到 ${loadingCount} 個載入狀態元素`)

      // 檢查可能的空狀態訊息
      const emptyStateElements = page.locator('*').filter({
        hasText: /暫無|沒有|無資料|no.*data|empty/i
      })
      const emptyStateCount = await emptyStateElements.count()
      console.log(`找到 ${emptyStateCount} 個空狀態元素`)

      // 截圖保存狀態提示
      await page.screenshot({
        path: 'test-results/screenshots/authenticated-flow/14-status-messages.png'
      })
    })
  })

  test.describe('6. 功能完整性和用戶體驗測試', () => {
    test.beforeEach(async ({ page }) => {
      await authenticateUser(page)
    })

    test('頁面間導航流暢性測試', async ({ page }) => {
      const navigationFlow = [
        '/dashboard',
        '/cards',
        '/readings',
        '/profile',
        '/dashboard'
      ]

      for (let i = 0; i < navigationFlow.length; i++) {
        const startTime = Date.now()

        await page.goto(navigationFlow[i])
        await page.waitForLoadState('networkidle')

        const endTime = Date.now()
        const loadTime = endTime - startTime

        console.log(`導航到 ${navigationFlow[i]} 耗時: ${loadTime}ms`)

        // 檢查頁面是否正確載入
        const hasContent = await page.locator('main, [role="main"], body').count() > 0
        expect(hasContent).toBeTruthy()

        // 短暫等待確保頁面穩定
        await page.waitForTimeout(500)
      }

      // 截圖保存最終導航狀態
      await page.screenshot({
        path: 'test-results/screenshots/authenticated-flow/15-navigation-flow.png'
      })
    })

    test('響應式設計測試', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // 測試不同視口大小
      const viewports = [
        { width: 1920, height: 1080, name: 'desktop' },
        { width: 1024, height: 768, name: 'tablet' },
        { width: 375, height: 667, name: 'mobile' }
      ]

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.waitForTimeout(1000)

        // 檢查關鍵元素是否仍然可見
        const mainContent = page.locator('main, [role="main"], .main')
        await expect(mainContent).toBeVisible()

        // 截圖保存響應式狀態
        await page.screenshot({
          path: `test-results/screenshots/authenticated-flow/16-responsive-${viewport.name}.png`,
          fullPage: true
        })
      }
    })

    test('載入狀態和動畫測試', async ({ page }) => {
      // 測試頁面載入狀態
      await page.goto('/cards')

      // 檢查是否有載入指示器
      const loadingIndicators = page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]')
      const loadingCount = await loadingIndicators.count()
      console.log(`找到 ${loadingCount} 個載入指示器`)

      await page.waitForLoadState('networkidle')

      // 檢查動畫元素
      const animatedElements = page.locator('[class*="animate"], [class*="transition"]')
      const animatedCount = await animatedElements.count()
      console.log(`找到 ${animatedCount} 個動畫元素`)

      // 截圖保存載入完成狀態
      await page.screenshot({
        path: 'test-results/screenshots/authenticated-flow/17-loading-animation.png'
      })
    })

    test('鍵盤導航和可訪問性測試', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // 測試 Tab 鍵導航
      await page.keyboard.press('Tab')
      await page.waitForTimeout(300)

      let focusedElement = page.locator(':focus')
      let focusCount = await focusedElement.count()
      console.log(`第一次 Tab 後聚焦元素數量: ${focusCount}`)

      // 繼續 Tab 導航測試
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(200)

        focusedElement = page.locator(':focus')
        focusCount = await focusedElement.count()

        if (focusCount > 0) {
          const tagName = await focusedElement.first().evaluate(el => el.tagName)
          console.log(`Tab ${i + 2}: 聚焦於 ${tagName} 元素`)
        }
      }

      // 截圖保存鍵盤導航狀態
      await page.screenshot({
        path: 'test-results/screenshots/authenticated-flow/18-keyboard-navigation.png'
      })
    })
  })
})