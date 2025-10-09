/**
 * Cards Page E2E Tests
 * 卡牌頁面端對端測試
 *
 * 測試流程:
 * 1. 完整卡牌瀏覽流程
 * 2. 分頁導航
 * 3. 瀏覽器前進/後退
 */

import { test, expect } from '@playwright/test'

test.describe('Cards Page - Complete User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 導航至卡牌選擇頁面
    await page.goto('/cards')
  })

  test('should complete full card browsing flow', async ({ page }) => {
    // Step 1: 驗證花色選擇頁面
    await expect(page.locator('h1')).toContainText('塔羅牌圖書館')
    await expect(page.getByText('選擇花色開始探索廢土占卜')).toBeVisible()

    // 驗證所有 5 個花色選項可見
    await expect(page.getByText('大阿爾克那')).toBeVisible()
    await expect(page.getByText('Nuka-Cola 瓶(聖杯)')).toBeVisible()
    await expect(page.getByText('戰鬥武器(寶劍)')).toBeVisible()
    await expect(page.getByText('瓶蓋(錢幣)')).toBeVisible()
    await expect(page.getByText('輻射棒(權杖)')).toBeVisible()

    // Step 2: 點擊 Nuka-Cola 花色
    await page.getByText('Nuka-Cola 瓶(聖杯)').click()

    // 驗證導航至卡牌列表頁面
    await expect(page).toHaveURL(/\/cards\/nuka_cola/)
    await expect(page.locator('h1')).toContainText('Nuka-Cola 瓶(聖杯)')

    // 驗證麵包屑導航
    await expect(page.getByText('塔羅牌圖書館 /')).toBeVisible()
    await expect(page.getByText('/ Nuka-Cola 瓶(聖杯)')).toBeVisible()

    // 驗證卡牌網格顯示
    const cardThumbnails = page.locator('[role="list"] > *')
    await expect(cardThumbnails.first()).toBeVisible()

    // Step 3: 點擊第一張卡牌
    await cardThumbnails.first().click()

    // 驗證導航至卡牌詳細頁面
    await expect(page).toHaveURL(/\/cards\/nuka_cola\/[\w-]+/)

    // 驗證卡牌詳細資訊顯示
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByText('正位牌義')).toBeVisible()

    // 驗證導航按鈕
    await expect(page.getByRole('button', { name: /上一張/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /下一張/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /返回列表/ })).toBeVisible()
  })

  test('should navigate through pagination correctly', async ({ page }) => {
    // 導航至卡牌列表(假設有多頁)
    await page.goto('/cards/nuka_cola?page=1')

    // 驗證當前在第一頁
    await expect(page.getByText('1', { exact: false })).toBeVisible()

    // 驗證「上一頁」按鈕禁用
    const prevButton = page.getByRole('button', { name: /上一頁/ })
    await expect(prevButton).toHaveAttribute('aria-disabled', 'true')

    // 點擊「下一頁」
    const nextButton = page.getByRole('button', { name: /下一頁/ })
    await nextButton.click()

    // 驗證 URL 變為 page=2
    await expect(page).toHaveURL(/page=2/)

    // 驗證頁碼指示器更新
    await expect(page.getByText('2', { exact: false })).toBeVisible()

    // 驗證新頁面卡牌載入
    const cardThumbnails = page.locator('[role="list"] > *')
    await expect(cardThumbnails.first()).toBeVisible()

    // 點擊「上一頁」
    await page.getByRole('button', { name: /上一頁/ }).click()

    // 驗證返回 page=1
    await expect(page).toHaveURL(/page=1/)
  })

  test('should support browser back/forward navigation', async ({ page }) => {
    // Step 1: 從花色選擇到卡牌列表
    await page.goto('/cards')
    await page.getByText('大阿爾克那').click()
    await expect(page).toHaveURL(/\/cards\/major_arcana/)

    // Step 2: 點擊第一張卡牌
    const firstCard = page.locator('[role="list"] > *').first()
    await firstCard.click()
    await expect(page).toHaveURL(/\/cards\/major_arcana\/[\w-]+/)

    // Step 3: 瀏覽器後退
    await page.goBack()
    await expect(page).toHaveURL(/\/cards\/major_arcana/)
    await expect(page.locator('h1')).toContainText('大阿爾克那')

    // Step 4: 瀏覽器前進
    await page.goForward()
    await expect(page).toHaveURL(/\/cards\/major_arcana\/[\w-]+/)
    await expect(page.locator('h1')).toBeVisible()

    // Step 5: 再次後退到花色選擇
    await page.goBack()
    await page.goBack()
    await expect(page).toHaveURL(/\/cards$/)
    await expect(page.locator('h1')).toContainText('塔羅牌圖書館')
  })

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/cards')

    // Tab 鍵循序聚焦花色卡片
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab') // 跳過可能的標題或其他元素

    // Enter 鍵觸發導航
    await page.keyboard.press('Enter')

    // 應該導航至某個花色頁面
    await expect(page).toHaveURL(/\/cards\/[\w_]+/)
  })
})

test.describe('Cards Page - Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/cards')

    // 驗證花色卡片的 aria-label
    const suitCard = page.getByLabel(/瀏覽.*張卡牌/)
    await expect(suitCard.first()).toBeVisible()
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/cards')

    // 驗證 h1 標題
    const h1 = page.locator('h1')
    await expect(h1).toHaveText('塔羅牌圖書館')

    // 驗證 h3 標題(花色名稱)
    const h3 = page.locator('h3').first()
    await expect(h3).toBeVisible()
  })

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/cards/nuka_cola')

    // 驗證麵包屑有正確的 aria-label
    const breadcrumb = page.locator('nav[aria-label="麵包屑導航"]')
    await expect(breadcrumb).toBeVisible()

    // 驗證當前頁面有 aria-current
    const currentPage = page.locator('[aria-current="page"]')
    await expect(currentPage).toBeVisible()
  })
})

test.describe('Cards Page - Performance', () => {
  test('should load suit selection page within 2 seconds', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/cards')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(2000)
  })

  test('should lazy load card images', async ({ page }) => {
    await page.goto('/cards/nuka_cola')

    // 檢查圖片是否有 loading="lazy" 屬性
    const images = page.locator('img')
    const firstImage = images.first()
    await expect(firstImage).toHaveAttribute('loading')
  })
})

test.describe('Cards Page - Error Handling', () => {
  test('should show error for invalid suit', async ({ page }) => {
    await page.goto('/cards/invalid_suit')

    // 驗證錯誤訊息顯示
    await expect(page.getByText(/花色不存在|找不到花色/)).toBeVisible()
    await expect(page.getByRole('button', { name: /返回/ })).toBeVisible()
  })

  test('should show error when card not found', async ({ page }) => {
    await page.goto('/cards/nuka_cola/invalid-card-id')

    // 驗證錯誤訊息
    await expect(page.getByText(/找不到卡牌|卡牌不存在/)).toBeVisible()
  })
})

test.describe('Cards Page - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE size

  test('should display responsive layout on mobile', async ({ page }) => {
    await page.goto('/cards')

    // 驗證花色卡片垂直堆疊(1 欄佈局)
    const suitCards = page.locator('a[aria-label*="瀏覽"]')
    const firstCard = suitCards.first()
    const secondCard = suitCards.nth(1)

    const firstBox = await firstCard.boundingBox()
    const secondBox = await secondCard.boundingBox()

    // 第二張卡片應該在第一張下方
    expect(secondBox?.y).toBeGreaterThan(firstBox?.y || 0)
  })

  test('should have touch-friendly button sizes', async ({ page }) => {
    await page.goto('/cards/nuka_cola')

    // 驗證分頁按鈕至少 44x44px
    const nextButton = page.getByRole('button', { name: /下一頁/ })
    const buttonBox = await nextButton.boundingBox()

    expect(buttonBox?.width).toBeGreaterThanOrEqual(44)
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
  })
})
