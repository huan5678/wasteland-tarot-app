import { test, expect } from '@playwright/test'

test.describe('響應式設計測試', () => {
  const viewports = [
    { name: '桌面版 (1920x1080)', width: 1920, height: 1080 },
    { name: '筆記型電腦 (1366x768)', width: 1366, height: 768 },
    { name: '平板版橫向 (1024x768)', width: 1024, height: 768 },
    { name: '平板版直向 (768x1024)', width: 768, height: 1024 },
    { name: 'iPad (820x1180)', width: 820, height: 1180 },
    { name: '手機版橫向 (667x375)', width: 667, height: 375 },
    { name: '手機版直向 (375x667)', width: 375, height: 667 },
    { name: 'iPhone 12 (390x844)', width: 390, height: 844 },
    { name: '小螢幕手機 (320x568)', width: 320, height: 568 }
  ]

  viewports.forEach(({ name, width, height }) => {
    test(`${name} 響應式測試`, async ({ page }) => {
      // 設定視窗大小
      await page.setViewportSize({ width, height })
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // 檢查頁面是否正常載入
      await expect(page.getByText('廢土塔羅')).toBeVisible()

      // 檢查主要內容是否可見
      await expect(page.getByText('由避難所科技驅動的後末世塔羅占卜')).toBeVisible()

      // 檢查按鈕是否可見且可點擊
      const primaryButton = page.getByRole('button', { name: '進入避難所' })
      await expect(primaryButton).toBeVisible()

      const secondaryButton = page.getByRole('button', { name: '快速占卜' })
      await expect(secondaryButton).toBeVisible()

      // 檢查是否有水平滾動條（避免溢出）
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = width

      if (bodyWidth > viewportWidth + 10) { // 允許小幅誤差
        console.warn(`⚠️  ${name}: 檢測到水平溢出 (body: ${bodyWidth}px, viewport: ${viewportWidth}px)`)
      }

      // 截圖保存各尺寸狀態
      const filename = name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
      await page.screenshot({
        path: `test-results/screenshots/responsive-${filename}.png`,
        fullPage: true
      })

      console.log(`✅ ${name} 響應式測試完成`)
    })
  })

  test('響應式導航測試', async ({ page }) => {
    // 測試桌面版導航
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 檢查桌面版導航元素
    await expect(page.getByRole('button', { name: '登入' })).toBeVisible()
    await expect(page.getByRole('button', { name: '註冊' })).toBeVisible()

    // 截圖桌面版導航
    await page.screenshot({ path: 'test-results/screenshots/navigation-desktop.png' })

    // 切換到手機版
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)

    // 檢查手機版導航是否仍然可用
    await expect(page.getByText('廢土塔羅')).toBeVisible()

    // 截圖手機版導航
    await page.screenshot({ path: 'test-results/screenshots/navigation-mobile.png' })
  })

  test('內容重排測試', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 從大螢幕開始
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(500)

    // 檢查大螢幕佈局（通常是多欄位）
    const featuresSection = page.locator('text=終端機功能').locator('..')
    await expect(featuresSection).toBeVisible()

    // 截圖大螢幕佈局
    await page.screenshot({ path: 'test-results/screenshots/layout-large.png', fullPage: true })

    // 切換到中等螢幕
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)

    // 檢查內容是否重新排列
    await expect(featuresSection).toBeVisible()

    // 截圖中等螢幕佈局
    await page.screenshot({ path: 'test-results/screenshots/layout-medium.png', fullPage: true })

    // 切換到小螢幕
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)

    // 檢查小螢幕佈局（通常是單欄位）
    await expect(featuresSection).toBeVisible()

    // 截圖小螢幕佈局
    await page.screenshot({ path: 'test-results/screenshots/layout-small.png', fullPage: true })
  })

  test('圖像和媒體響應式測試', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const viewportsToTest = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ]

    for (const { width, height, name } of viewportsToTest) {
      await page.setViewportSize({ width, height })
      await page.waitForTimeout(500)

      // 檢查圖像是否存在且正確載入
      const images = page.locator('img')
      const imageCount = await images.count()

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i)
        const isVisible = await img.isVisible()

        if (isVisible) {
          const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth)
          const naturalHeight = await img.evaluate((el: HTMLImageElement) => el.naturalHeight)

          // 檢查圖像是否成功載入
          expect(naturalWidth).toBeGreaterThan(0)
          expect(naturalHeight).toBeGreaterThan(0)
        }
      }

      console.log(`✅ ${name} (${width}x${height}): ${imageCount} 張圖像檢查完成`)
    }
  })

  test('文字可讀性測試', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const viewportsToTest = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 375, height: 667, name: 'mobile' }
    ]

    for (const { width, height, name } of viewportsToTest) {
      await page.setViewportSize({ width, height })
      await page.waitForTimeout(500)

      // 檢查主標題
      const mainTitle = page.locator('h1').first()
      const titleBox = await mainTitle.boundingBox()

      if (titleBox) {
        expect(titleBox.height).toBeGreaterThan(20) // 確保標題有足夠高度
        console.log(`${name} 主標題高度: ${titleBox.height}px`)
      }

      // 檢查文字是否溢出容器
      const textElements = page.locator('p, span, div').filter({ hasText: /\w+/ })
      const textCount = await textElements.count()

      for (let i = 0; i < Math.min(textCount, 5); i++) {
        const element = textElements.nth(i)
        const box = await element.boundingBox()

        if (box && box.width > width) {
          const text = await element.textContent()
          console.warn(`⚠️  ${name}: 文字溢出 "${text?.slice(0, 30)}..." (寬度: ${box.width}px)`)
        }
      }

      // 截圖文字可讀性
      await page.screenshot({ path: `test-results/screenshots/text-readability-${name}.png` })
    }
  })

  test('觸控友善性測試', async ({ page }) => {
    // 設定為行動裝置尺寸
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 檢查可點擊元素的尺寸（應符合觸控友善標準）
    const clickableElements = page.locator('button, a, [role="button"]')
    const clickableCount = await clickableElements.count()

    for (let i = 0; i < clickableCount; i++) {
      const element = clickableElements.nth(i)
      const isVisible = await element.isVisible()

      if (isVisible) {
        const box = await element.boundingBox()

        if (box) {
          // Apple 和 Google 建議最小觸控目標為 44x44px
          const minSize = 44

          if (box.width < minSize || box.height < minSize) {
            const text = await element.textContent()
            console.warn(`⚠️  觸控目標過小: "${text?.slice(0, 20)}" (${box.width}x${box.height}px)`)
          }
        }
      }
    }

    // 測試觸控操作
    const primaryButton = page.getByRole('button', { name: '進入避難所' })
    await primaryButton.tap()
    await page.waitForLoadState('networkidle')

    // 檢查導航是否成功
    await expect(page).toHaveURL('/auth/login')

    // 截圖觸控測試結果
    await page.screenshot({ path: 'test-results/screenshots/touch-friendly.png' })
  })

  test('極端尺寸測試', async ({ page }) => {
    const extremeViewports = [
      { width: 280, height: 653, name: '極小手機' }, // Galaxy Fold 摺疊狀態
      { width: 2560, height: 1440, name: '2K 顯示器' },
      { width: 3840, height: 2160, name: '4K 顯示器' }
    ]

    for (const { width, height, name } of extremeViewports) {
      await page.setViewportSize({ width, height })
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // 檢查基本元素是否仍然可見
      await expect(page.getByText('廢土塔羅')).toBeVisible()

      // 檢查是否有佈局破損
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)

      if (bodyWidth > width + 20) {
        console.warn(`⚠️  ${name}: 可能有水平溢出 (${bodyWidth}px > ${width}px)`)
      }

      // 截圖極端尺寸
      const filename = name.replace(/\s+/g, '-').toLowerCase()
      await page.screenshot({
        path: `test-results/screenshots/extreme-${filename}.png`,
        fullPage: true
      })

      console.log(`✅ ${name} (${width}x${height}) 極端尺寸測試完成`)
    }
  })
})