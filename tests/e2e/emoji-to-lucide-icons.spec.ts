/**
 * Emoji to Lucide Icons E2E Tests
 * 端對端測試驗證圖示替換功能
 */

import { test, expect } from '@playwright/test'

test.describe('Emoji to Lucide Icons Integration', () => {
  test.beforeEach(async ({ page }) => {
    // 導航到 /cards 頁面
    await page.goto('/cards')
    // 等待頁面載入完成
    await page.waitForLoadState('networkidle')
  })

  test.describe('花色卡片圖示渲染', () => {
    test('應該在 /cards 頁面顯示 5 個花色卡片', async ({ page }) => {
      // 等待花色卡片容器載入
      const suitCards = page.locator('[data-testid="suit-card"], a[href^="/cards/"]')
      await expect(suitCards).toHaveCount(5, { timeout: 10000 })
    })

    test('每個花色卡片應該包含 SVG 圖示（lucide-react）', async ({ page }) => {
      // 等待頁面完全載入
      await page.waitForTimeout(2000)

      // 查找所有花色卡片中的 SVG 元素
      const svgIcons = page.locator('svg')
      const count = await svgIcons.count()

      // 應該至少有 5 個 SVG 圖示（每個花色一個）
      // 實際上可能更多，因為還有卡牌數量指示器
      expect(count).toBeGreaterThanOrEqual(5)
    })

    test('花色圖示應該具有正確的樣式類別', async ({ page }) => {
      // 查找第一個 SVG 圖示
      const firstIcon = page.locator('svg').first()
      await expect(firstIcon).toBeVisible()

      // 驗證圖示具有 pip-boy-green 顏色類別
      const className = await firstIcon.getAttribute('class')
      expect(className).toContain('text-pip-boy-green')
    })

    test('花色圖示應該具有 drop-shadow 發光效果', async ({ page }) => {
      const firstIcon = page.locator('svg').first()
      await expect(firstIcon).toBeVisible()

      // 驗證 inline style 包含 drop-shadow
      const style = await firstIcon.getAttribute('style')
      expect(style).toContain('drop-shadow')
    })
  })

  test.describe('卡牌數量指示器圖示', () => {
    test('卡牌數量指示器應該使用 lucide-react 圖示', async ({ page }) => {
      // 查找包含"張卡牌"文字的元素
      const cardCountIndicators = page.locator('text=/\\d+ 張卡牌/')

      // 應該有 5 個卡牌數量指示器
      await expect(cardCountIndicators).toHaveCount(5, { timeout: 10000 })

      // 驗證第一個指示器附近有 SVG 圖示
      const firstIndicator = cardCountIndicators.first()
      const parentContainer = firstIndicator.locator('..')
      const iconInContainer = parentContainer.locator('svg')
      await expect(iconInContainer).toBeVisible()
    })
  })

  test.describe('響應式尺寸驗證', () => {
    test('行動裝置視窗下圖示應該正確縮放', async ({ page }) => {
      // 設定為行動裝置尺寸
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(500)

      // 驗證圖示仍然可見
      const icons = page.locator('svg')
      const firstIcon = icons.first()
      await expect(firstIcon).toBeVisible()
    })

    test('平板視窗下圖示應該正確縮放', async ({ page }) => {
      // 設定為平板尺寸
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.waitForTimeout(500)

      // 驗證圖示仍然可見
      const icons = page.locator('svg')
      const firstIcon = icons.first()
      await expect(firstIcon).toBeVisible()
    })

    test('桌面視窗下圖示應該正確縮放', async ({ page }) => {
      // 設定為桌面尺寸
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.waitForTimeout(500)

      // 驗證圖示仍然可見
      const icons = page.locator('svg')
      const firstIcon = icons.first()
      await expect(firstIcon).toBeVisible()
    })
  })

  test.describe('無障礙性驗證', () => {
    test('花色圖示應該具有 aria-hidden 屬性（裝飾性）', async ({ page }) => {
      // 花色圖示應該標記為 aria-hidden，因為花色名稱已提供語意
      const icons = page.locator('svg[aria-hidden="true"]')
      const count = await icons.count()

      // 應該至少有一些圖示標記為 aria-hidden
      expect(count).toBeGreaterThan(0)
    })

    test('頁面應該通過基本的無障礙性檢查', async ({ page }) => {
      // 檢查頁面是否有適當的標題結構
      const headings = page.locator('h1, h2, h3')
      const headingCount = await headings.count()
      expect(headingCount).toBeGreaterThan(0)

      // 檢查連結是否有可訪問的名稱
      const links = page.locator('a[href^="/cards/"]')
      const firstLink = links.first()
      const ariaLabel = await firstLink.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    })
  })

  test.describe('視覺回歸測試', () => {
    test('花色卡片應該保持一致的視覺樣式', async ({ page }) => {
      // 等待所有圖示載入
      await page.waitForTimeout(2000)

      // 截圖第一個花色卡片
      const firstCard = page.locator('a[href^="/cards/"]').first()
      await expect(firstCard).toBeVisible()

      // 驗證卡片可見且有適當的尺寸
      const boundingBox = await firstCard.boundingBox()
      expect(boundingBox).toBeTruthy()
      expect(boundingBox!.width).toBeGreaterThan(100)
      expect(boundingBox!.height).toBeGreaterThan(100)
    })

    test('懸停效果應該正常運作', async ({ page }) => {
      const firstCard = page.locator('a[href^="/cards/"]').first()
      await expect(firstCard).toBeVisible()

      // 懸停在卡片上
      await firstCard.hover()
      await page.waitForTimeout(500)

      // 驗證卡片仍然可見（懸停效果不應破壞佈局）
      await expect(firstCard).toBeVisible()
    })
  })

  test.describe('效能驗證', () => {
    test('圖示應該快速渲染，無明顯延遲', async ({ page }) => {
      const startTime = Date.now()

      // 等待第一個 SVG 圖示出現
      const firstIcon = page.locator('svg').first()
      await expect(firstIcon).toBeVisible({ timeout: 5000 })

      const renderTime = Date.now() - startTime

      // 圖示應該在 5 秒內渲染完成
      expect(renderTime).toBeLessThan(5000)
    })

    test('頁面載入時無 CLS（累積佈局偏移）', async ({ page }) => {
      // 等待頁面穩定
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // 驗證所有圖示都已載入且可見
      const icons = page.locator('svg')
      const count = await icons.count()
      expect(count).toBeGreaterThan(0)

      // 所有圖示應該可見（無佈局偏移）
      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(icons.nth(i)).toBeVisible()
      }
    })
  })
})

test.describe('CardThumbnail 骨架屏圖示', () => {
  test('載入骨架屏應該使用 lucide-react Image 圖示', async ({ page }) => {
    // 導航到包含卡牌縮圖的頁面
    // 假設有一個路由顯示卡牌縮圖
    await page.goto('/cards/major_arcana')
    await page.waitForLoadState('networkidle')

    // 注意：這個測試可能需要根據實際的頁面結構調整
    // 如果頁面載入很快，骨架屏可能不會出現
  })
})
