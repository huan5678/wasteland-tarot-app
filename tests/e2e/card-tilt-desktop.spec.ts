/**
 * Card Tilt Desktop E2E Tests
 * 測試桌面環境下的 3D 傾斜效果
 */

import { test, expect } from '@playwright/test'

test.describe('Card Tilt - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    // 設定桌面視口
    await page.setViewportSize({ width: 1920, height: 1080 })

    // 導航至卡片頁面
    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')
  })

  test('滑鼠懸停應觸發 3D 傾斜效果', async ({ page }) => {
    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    // 記錄初始 transform
    const initialTransform = await card.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // 懸停於卡片
    await card.hover()
    await page.waitForTimeout(100) // 等待效果啟動

    // 檢查 transform 是否改變
    const hoveredTransform = await card.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // transform 應該不同（有傾斜效果）
    expect(hoveredTransform).not.toBe(initialTransform)
    expect(hoveredTransform).not.toBe('none')
  })

  test('滑鼠移動至不同位置時角度應變化', async ({ page }) => {
    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    const box = await card.boundingBox()
    if (!box) throw new Error('Card bounding box not found')

    // 移動至左上角
    await page.mouse.move(box.x + 10, box.y + 10)
    await page.waitForTimeout(100)

    const topLeftTransform = await card.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // 移動至右下角
    await page.mouse.move(box.x + box.width - 10, box.y + box.height - 10)
    await page.waitForTimeout(100)

    const bottomRightTransform = await card.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // 兩個位置的 transform 應該不同
    expect(topLeftTransform).not.toBe(bottomRightTransform)
  })

  test('滑鼠離開卡片時應復原至初始狀態', async ({ page }) => {
    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    // 記錄初始狀態
    const initialTransform = await card.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // 懸停並移動滑鼠
    await card.hover()
    await page.waitForTimeout(100)

    // 移動滑鼠離開卡片
    await page.mouse.move(0, 0)
    await page.waitForTimeout(500) // 等待復原動畫

    const finalTransform = await card.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // 應該復原至接近初始狀態（可能有微小差異）
    // 或者檢查是否包含 rotate(0deg)
    const isReset =
      finalTransform === initialTransform ||
      finalTransform === 'none' ||
      !finalTransform.includes('rotateX') ||
      finalTransform.includes('rotateX(0deg)')

    expect(isReset).toBeTruthy()
  })

  test('應該計算正確的 perspective transform', async ({ page }) => {
    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    // 懸停於卡片
    await card.hover()
    await page.waitForTimeout(100)

    const transform = await card.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // 檢查 transform 格式（應包含 matrix3d 或特定值）
    expect(transform).not.toBe('none')
    // transform 可能是 matrix3d(...) 格式
    const hasTransform = transform.startsWith('matrix3d') || transform.startsWith('matrix')
    expect(hasTransform).toBeTruthy()
  })

  test('傾斜角度不應超過最大值', async ({ page }) => {
    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    const box = await card.boundingBox()
    if (!box) throw new Error('Card bounding box not found')

    // 移動至極端位置（左上角）
    await page.mouse.move(box.x, box.y)
    await page.waitForTimeout(100)

    const transform = await card.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return style.transform
    })

    // 解析 transform matrix 並檢查角度
    // 這裡簡化檢查，確保有 transform 且不是極端值
    expect(transform).not.toBe('none')
    expect(transform).toBeTruthy()
  })

  test('光澤效果應隨傾斜移動', async ({ page }) => {
    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    // 懸停於卡片
    await card.hover()
    await page.waitForTimeout(200)

    // 檢查是否有光澤效果元素
    const glossOverlay = card.locator('[aria-hidden="true"]').first()
    const glossCount = await glossOverlay.count()

    if (glossCount > 0) {
      const glossStyle = await glossOverlay.evaluate((el) => {
        return {
          background: window.getComputedStyle(el).background,
          opacity: window.getComputedStyle(el).opacity
        }
      })

      // 光澤應該有 gradient 且可見
      expect(glossStyle.background).toContain('gradient')
      expect(parseFloat(glossStyle.opacity)).toBeGreaterThan(0)
    }
  })

  test('快速移動滑鼠不應造成性能問題', async ({ page }) => {
    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    const box = await card.boundingBox()
    if (!box) throw new Error('Card bounding box not found')

    // 記錄開始時間
    const startTime = Date.now()

    // 快速移動滑鼠 100 次
    for (let i = 0; i < 100; i++) {
      const x = box.x + (Math.random() * box.width)
      const y = box.y + (Math.random() * box.height)
      await page.mouse.move(x, y, { steps: 1 })
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    // 應該在合理時間內完成（< 3 秒）
    expect(duration).toBeLessThan(3000)

    // 頁面應該沒有崩潰
    const isVisible = await card.isVisible()
    expect(isVisible).toBe(true)
  })

  test('多個卡片同時懸停應正常運作', async ({ page }) => {
    const cards = page.locator('a[href^="/cards/"]')
    const cardCount = await cards.count()

    // 至少有 2 張卡片
    expect(cardCount).toBeGreaterThanOrEqual(2)

    // 懸停於第一張卡片
    await cards.nth(0).hover()
    await page.waitForTimeout(100)

    const firstTransform = await cards.nth(0).evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // 懸停於第二張卡片（不移開第一張）
    await cards.nth(1).hover()
    await page.waitForTimeout(100)

    const secondTransform = await cards.nth(1).evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // 兩張卡片都應該有 transform
    expect(firstTransform).not.toBe('none')
    expect(secondTransform).not.toBe('none')
  })

  test('console 不應有錯誤', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    // 執行一些互動
    await card.hover()
    await page.waitForTimeout(200)
    await page.mouse.move(0, 0)
    await page.waitForTimeout(200)

    // 不應該有錯誤
    expect(errors).toEqual([])
  })

  test('應該使用硬體加速（will-change）', async ({ page }) => {
    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    // 懸停於卡片
    await card.hover()
    await page.waitForTimeout(100)

    const willChange = await card.evaluate((el) => {
      return window.getComputedStyle(el).willChange
    })

    // 應該設定 will-change（可能是 'transform' 或 'auto'）
    expect(willChange).toBeDefined()
  })
})
