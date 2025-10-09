import { test, expect } from '@playwright/test'

test.describe('用戶體驗測試', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('首次訪問用戶體驗', async ({ page }) => {
    // 檢查首次載入體驗
    await expect(page.getByText('廢土塔羅')).toBeVisible()

    // 檢查引導性內容
    await expect(page.getByText('由避難所科技驅動的後末世塔羅占卜')).toBeVisible()
    await expect(page.getByText('當核戰終結了文明，古老的占卜藝術也隨之進化')).toBeVisible()

    // 檢查明確的行動按鈕
    await expect(page.getByRole('button', { name: '進入避難所' })).toBeVisible()
    await expect(page.getByRole('button', { name: '快速占卜' })).toBeVisible()

    // 檢查功能說明區域
    await expect(page.getByText('終端機功能')).toBeVisible()
    await expect(page.getByText('量子占卜')).toBeVisible()

    // 截圖首次訪問體驗
    await page.screenshot({ path: 'test-results/screenshots/first-visit-experience.png', fullPage: true })

    console.log('✅ 首次訪問用戶體驗檢查完成')
  })

  test('視覺層次和可讀性測試', async ({ page }) => {
    // 檢查標題層次
    const h1Elements = page.locator('h1')
    const h1Count = await h1Elements.count()
    expect(h1Count).toBeGreaterThan(0) // 應有主標題

    // 檢查主標題文字大小
    const mainTitle = h1Elements.first()
    const titleStyles = await mainTitle.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight
      }
    })

    console.log('📋 主標題樣式:', titleStyles)

    // 檢查對比度和可讀性
    const bodyBackground = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.body)
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color
      }
    })

    console.log('🎨 頁面配色:', bodyBackground)

    // 檢查文字間距和排版
    const paragraphs = page.locator('p')
    const paragraphCount = await paragraphs.count()

    for (let i = 0; i < Math.min(paragraphCount, 3); i++) {
      const paragraph = paragraphs.nth(i)
      const styles = await paragraph.evaluate(el => {
        const styles = window.getComputedStyle(el)
        return {
          lineHeight: styles.lineHeight,
          marginBottom: styles.marginBottom,
          fontSize: styles.fontSize
        }
      })

      console.log(`段落 ${i + 1} 樣式:`, styles)
    }

    // 截圖視覺層次
    await page.screenshot({ path: 'test-results/screenshots/visual-hierarchy.png', fullPage: true })
  })

  test('互動反饋和動畫測試', async ({ page }) => {
    // 測試 hover 狀態反饋
    const primaryButton = page.getByRole('button', { name: '進入避難所' })

    // 正常狀態截圖
    await page.screenshot({ path: 'test-results/screenshots/button-normal-state.png' })

    // Hover 狀態
    await primaryButton.hover()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'test-results/screenshots/button-hover-state.png' })

    // 檢查動畫元素
    const animatedElements = page.locator('[class*="animate"]')
    const animatedCount = await animatedElements.count()
    console.log(`🎬 找到 ${animatedCount} 個動畫元素`)

    // 檢查 Pip-Boy 狀態燈動畫
    const statusLight = page.locator('.animate-pulse').first()
    await expect(statusLight).toBeVisible()

    // 測試按鈕點擊反饋
    await primaryButton.click()
    await page.waitForLoadState('networkidle')

    // 檢查導航是否順暢
    await expect(page).toHaveURL('/auth/login')

    console.log('✅ 互動反饋測試完成')
  })

  test('導航流程和用戶引導測試', async ({ page }) => {
    // 測試典型的用戶流程：首頁 → 登入 → 註冊
    console.log('🛤️  測試用戶導航流程')

    // 步驟 1: 首頁瀏覽
    await expect(page.getByText('廢土塔羅')).toBeVisible()
    await page.screenshot({ path: 'test-results/screenshots/flow-step-1-homepage.png' })

    // 步驟 2: 點擊登入
    await page.getByRole('button', { name: '登入' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/auth/login')
    await page.screenshot({ path: 'test-results/screenshots/flow-step-2-login.png' })

    // 步驟 3: 從登入頁導航到註冊頁
    await page.goto('/auth/register')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/auth/register')
    await page.screenshot({ path: 'test-results/screenshots/flow-step-3-register.png' })

    // 步驟 4: 探索卡牌圖書館
    await page.goto('/cards')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/cards')
    await page.screenshot({ path: 'test-results/screenshots/flow-step-4-cards.png' })

    // 步驟 5: 回到首頁
    await page.getByRole('button').filter({ hasText: '廢土塔羅' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/')

    console.log('✅ 導航流程測試完成')
  })

  test('錯誤處理和用戶反饋測試', async ({ page }) => {
    // 測試 404 頁面
    await page.goto('/non-existent-page')
    await page.waitForLoadState('networkidle')

    // 檢查是否有合適的錯誤處理
    const title = await page.title()
    console.log(`404 頁面標題: ${title}`)

    // 截圖 404 頁面
    await page.screenshot({ path: 'test-results/screenshots/404-page.png', fullPage: true })

    // 測試網路錯誤情況
    await page.route('**/*', route => route.abort())

    try {
      await page.goto('/')
      await page.waitForTimeout(2000)
    } catch (error) {
      console.log('✅ 網路錯誤正確處理')
    }

    // 恢復網路
    await page.unroute('**/*')
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('廢土塔羅')).toBeVisible()
  })

  test('內容組織和信息架構測試', async ({ page }) => {
    // 檢查內容的邏輯分組
    const sections = page.locator('section')
    const sectionCount = await sections.count()
    console.log(`📄 頁面分為 ${sectionCount} 個主要區塊`)

    // 檢查 Header 區域
    const header = page.locator('header')
    await expect(header).toBeVisible()

    // 檢查主要內容區域
    const mainContent = page.locator('h1').locator('..')
    await expect(mainContent).toBeVisible()

    // 檢查功能說明區域
    await expect(page.getByText('終端機功能')).toBeVisible()

    // 檢查 CTA 區域
    await expect(page.getByText('準備好探索你的廢土命運了嗎？')).toBeVisible()

    // 檢查信息密度
    const allText = await page.textContent('body')
    const textLength = allText?.length || 0
    console.log(`📝 頁面文字總長度: ${textLength} 字元`)

    // 截圖內容組織
    await page.screenshot({ path: 'test-results/screenshots/content-organization.png', fullPage: true })
  })

  test('載入狀態和反饋測試', async ({ page }) => {
    // 測試緩慢載入情況下的用戶體驗
    await page.route('**/*', async (route) => {
      // 延遲載入來模擬慢速網路
      await new Promise(resolve => setTimeout(resolve, 200))
      await route.continue()
    })

    const startTime = Date.now()
    await page.goto('/')

    // 檢查是否有載入指示器
    // 注意：這取決於實際的載入指示器實現
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime
    console.log(`🕐 模擬慢速載入時間: ${loadTime}ms`)

    // 檢查最終狀態
    await expect(page.getByText('廢土塔羅')).toBeVisible()

    // 截圖載入完成狀態
    await page.screenshot({ path: 'test-results/screenshots/slow-load-complete.png' })
  })

  test('色彩和主題一致性測試', async ({ page }) => {
    // 檢查主要色彩變量
    const colorScheme = await page.evaluate(() => {
      const computedStyle = getComputedStyle(document.documentElement)

      // 嘗試獲取 CSS 變量（如果有的話）
      const pipBoyGreen = computedStyle.getPropertyValue('--pip-boy-green') ||
                         window.getComputedStyle(document.querySelector('.text-pip-boy-green') || document.body).color

      return {
        pipBoyGreen,
        bodyBackground: window.getComputedStyle(document.body).backgroundColor,
        bodyColor: window.getComputedStyle(document.body).color
      }
    })

    console.log('🎨 主題色彩方案:', colorScheme)

    // 檢查色彩一致性
    const pipBoyElements = page.locator('.text-pip-boy-green')
    const pipBoyCount = await pipBoyElements.count()
    console.log(`💚 Pip-Boy 綠色元素數量: ${pipBoyCount}`)

    // 檢查背景和邊框一致性
    const borderElements = page.locator('[class*="border-pip-boy-green"]')
    const borderCount = await borderElements.count()
    console.log(`🔲 Pip-Boy 綠色邊框元素數量: ${borderCount}`)

    // 截圖色彩主題
    await page.screenshot({ path: 'test-results/screenshots/color-theme.png', fullPage: true })
  })

  test('可用性和直觀性測試', async ({ page }) => {
    // 檢查按鈕的可辨識性
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const isVisible = await button.isVisible()

      if (isVisible) {
        const text = await button.textContent()
        const ariaLabel = await button.getAttribute('aria-label')

        // 檢查按鈕是否有清楚的標示
        const hasLabel = (text && text.trim().length > 0) || (ariaLabel && ariaLabel.trim().length > 0)

        if (!hasLabel) {
          console.warn(`⚠️  按鈕 ${i} 缺少明確標示`)
        }

        console.log(`按鈕 ${i}: "${text}" (aria-label: "${ariaLabel}")`)
      }
    }

    // 檢查連結的可辨識性
    const links = page.locator('a')
    const linkCount = await links.count()
    console.log(`🔗 頁面連結數量: ${linkCount}`)

    // 檢查表單元素的標籤
    const inputs = page.locator('input')
    const inputCount = await inputs.count()

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const label = await input.getAttribute('aria-label') ||
                   await input.getAttribute('placeholder') ||
                   await input.getAttribute('title')

      if (!label) {
        console.warn(`⚠️  輸入欄位 ${i} 缺少標籤`)
      } else {
        console.log(`輸入欄位 ${i}: 標籤 "${label}"`)
      }
    }

    // 截圖可用性檢查
    await page.screenshot({ path: 'test-results/screenshots/usability-check.png', fullPage: true })
  })

  test('情感設計和品牌體驗測試', async ({ page }) => {
    // 檢查品牌元素
    await expect(page.getByText('廢土塔羅')).toBeVisible()
    await expect(page.getByText('Pip-Boy 占卜終端機')).toBeVisible()

    // 檢查主題一致性
    await expect(page.getByText('VAULT-TEC PIP-BOY 3000 MARK IV')).toBeVisible()
    await expect(page.getByText('STATUS: ONLINE')).toBeVisible()

    // 檢查情感化內容
    await expect(page.getByText('當核戰終結了文明，古老的占卜藝術也隨之進化')).toBeVisible()

    // 檢查視覺效果
    const animatedElements = page.locator('.animate-pulse')
    const animatedCount = await animatedElements.count()
    expect(animatedCount).toBeGreaterThan(0) // 應有動畫效果

    // 檢查終端機風格元素
    await expect(page.getByText('量子占卜')).toBeVisible()
    await expect(page.getByText('避難所科技')).toBeVisible()

    console.log('✅ 品牌體驗和情感設計檢查完成')

    // 截圖品牌體驗
    await page.screenshot({ path: 'test-results/screenshots/brand-experience.png', fullPage: true })
  })
})