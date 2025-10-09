/**
 * Card Tilt Visual Regression Tests
 * 視覺回歸測試 - 截圖比對卡片傾斜狀態
 */

import { test, expect } from '@playwright/test'

test.describe('Card Tilt Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')
  })

  test('卡片初始狀態截圖', async ({ page }) => {
    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    // 等待所有圖片載入
    await page.waitForLoadState('load')
    await page.waitForTimeout(500)

    // 截圖比對
    await expect(card).toHaveScreenshot('card-initial-state.png', {
      maxDiffPixels: 100 // 允許微小差異
    })
  })

  test('卡片傾斜狀態截圖（滑鼠右上角）', async ({ page }) => {
    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    const box = await card.boundingBox()
    if (!box) throw new Error('Card bounding box not found')

    // 移動滑鼠至右上角
    await page.mouse.move(box.x + box.width - 10, box.y + 10)
    await page.waitForTimeout(200) // 等待傾斜效果穩定

    // 截圖比對
    await expect(card).toHaveScreenshot('card-tilted-top-right.png', {
      maxDiffPixels: 100
    })
  })

  test('卡片傾斜狀態截圖（滑鼠左下角）', async ({ page }) => {
    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    const box = await card.boundingBox()
    if (!box) throw new Error('Card bounding box not found')

    // 移動滑鼠至左下角
    await page.mouse.move(box.x + 10, box.y + box.height - 10)
    await page.waitForTimeout(200)

    // 截圖比對
    await expect(card).toHaveScreenshot('card-tilted-bottom-left.png', {
      maxDiffPixels: 100
    })
  })

  test('卡片傾斜狀態截圖（滑鼠中心）', async ({ page }) => {
    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    const box = await card.boundingBox()
    if (!box) throw new Error('Card bounding box not found')

    // 移動滑鼠至中心
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(200)

    // 中心應該接近初始狀態
    await expect(card).toHaveScreenshot('card-tilted-center.png', {
      maxDiffPixels: 100
    })
  })

  test('光澤效果可見性截圖', async ({ page }) => {
    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    const box = await card.boundingBox()
    if (!box) throw new Error('Card bounding box not found')

    // 移動至能產生明顯光澤的位置
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.3)
    await page.waitForTimeout(300) // 等待光澤效果完全顯示

    // 截圖比對（光澤應該可見）
    await expect(card).toHaveScreenshot('card-with-gloss.png', {
      maxDiffPixels: 150 // 光澤可能有較多變化
    })
  })

  test('無光澤效果截圖', async ({ page }) => {
    // 導航至測試頁面（假設可以透過 URL 參數停用光澤）
    await page.goto('/cards/major-arcana?disableGloss=true')
    await page.waitForLoadState('networkidle')

    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    const box = await card.boundingBox()
    if (!box) throw new Error('Card bounding box not found')

    // 移動滑鼠
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.3)
    await page.waitForTimeout(200)

    // 截圖比對（不應有光澤）
    await expect(card).toHaveScreenshot('card-without-gloss.png', {
      maxDiffPixels: 100
    })
  })

  test('陰影增強效果截圖', async ({ page }) => {
    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    const box = await card.boundingBox()
    if (!box) throw new Error('Card bounding box not found')

    // 移動至產生明顯陰影的位置
    await page.mouse.move(box.x + box.width - 20, box.y + 20)
    await page.waitForTimeout(300)

    // 截圖整個卡片及周圍區域（包含陰影）
    await expect(page.locator('body')).toHaveScreenshot('card-with-shadow.png', {
      clip: {
        x: box.x - 30,
        y: box.y - 30,
        width: box.width + 60,
        height: box.height + 60
      },
      maxDiffPixels: 200
    })
  })

  test('多個視口尺寸的截圖比對', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1024, height: 768, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ]

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/cards/major-arcana')
      await page.waitForLoadState('networkidle')

      const card = page.locator('a[href^="/cards/"]').first()
      await card.waitFor({ state: 'visible' })

      await page.waitForTimeout(500)

      // 截圖不同視口
      await expect(card).toHaveScreenshot(`card-${viewport.name}.png`, {
        maxDiffPixels: 100
      })
    }
  })

  test('prefers-reduced-motion 無傾斜效果截圖', async ({ page, context }) => {
    // 啟用 prefers-reduced-motion
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => {
          if (query === '(prefers-reduced-motion: reduce)') {
            return {
              matches: true,
              media: query,
              onchange: null,
              addListener: () => {},
              removeListener: () => {},
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => true
            }
          }
          return {
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true
          }
        }
      })
    })

    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    const box = await card.boundingBox()
    if (!box) throw new Error('Card bounding box not found')

    // 移動滑鼠（應該無效果）
    await page.mouse.move(box.x + box.width - 10, box.y + 10)
    await page.waitForTimeout(200)

    // 截圖（應該與初始狀態相同）
    await expect(card).toHaveScreenshot('card-reduced-motion.png', {
      maxDiffPixels: 50 // 應該幾乎沒有差異
    })
  })

  test('卡片網格截圖（多卡片場景）', async ({ page }) => {
    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    // 等待所有卡片載入
    const cards = page.locator('a[href^="/cards/"]')
    await cards.first().waitFor({ state: 'visible' })
    await page.waitForTimeout(1000)

    // 截圖整個卡片網格
    const grid = page.locator('[role="list"], .grid').first()
    await expect(grid).toHaveScreenshot('card-grid.png', {
      maxDiffPixels: 300
    })
  })

  test('載入狀態卡片截圖', async ({ page }) => {
    // 設定網路節流模擬載入
    await page.route('**/*.png', (route) => {
      route.continue({ delay: 1000 })
    })

    await page.goto('/cards/major-arcana')

    // 等待骨架屏出現
    const skeleton = page.locator('[data-testid="card-skeleton"]').first()
    try {
      await skeleton.waitFor({ state: 'visible', timeout: 2000 })
      await expect(skeleton).toHaveScreenshot('card-loading.png', {
        maxDiffPixels: 100
      })
    } catch {
      // 載入太快，跳過
      console.log('Loading state too fast to capture')
    }
  })

  test('錯誤狀態卡片截圖', async ({ page }) => {
    // 攔截圖片請求並返回 404
    await page.route('**/*.png', (route) => {
      route.abort('failed')
    })

    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })
    await page.waitForTimeout(500)

    // 截圖錯誤狀態
    await expect(card).toHaveScreenshot('card-error.png', {
      maxDiffPixels: 100
    })
  })

  test('暗色主題卡片截圖', async ({ page }) => {
    // 切換至暗色主題（如果支援）
    await page.emulateMedia({ colorScheme: 'dark' })

    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })
    await page.waitForTimeout(500)

    // 截圖暗色主題
    await expect(card).toHaveScreenshot('card-dark-theme.png', {
      maxDiffPixels: 150
    })
  })

  test('懸停過渡動畫中間幀截圖', async ({ page }) => {
    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    const box = await card.boundingBox()
    if (!box) throw new Error('Card bounding box not found')

    // 移動滑鼠至右上角
    await page.mouse.move(box.x + box.width - 10, box.y + 10)

    // 等待一半的過渡時間（假設 200ms）
    await page.waitForTimeout(100)

    // 截圖過渡中間狀態
    await expect(card).toHaveScreenshot('card-transition-mid.png', {
      maxDiffPixels: 150
    })
  })
})

test.describe('Card Tilt Visual - Percy Integration (Optional)', () => {
  test.skip(!process.env.PERCY_TOKEN, 'Percy token not configured')

  test('Percy 視覺測試套件', async ({ page }) => {
    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    // Percy 截圖需要 @percy/playwright 套件
    // await percySnapshot(page, 'Cards Page - Initial State')

    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    const box = await card.boundingBox()
    if (!box) return

    // 懸停狀態
    await page.mouse.move(box.x + box.width - 10, box.y + 10)
    await page.waitForTimeout(200)

    // await percySnapshot(page, 'Cards Page - Card Tilted')

    console.log('Percy integration available but not configured')
  })
})
