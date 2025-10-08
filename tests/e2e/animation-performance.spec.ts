/**
 * 動畫效能測試
 * 任務 17.2 - 動畫效能測試
 *
 * 測試目標：
 * - 翻牌動畫 FPS > 55 (平均)
 * - Carousel 滑動 FPS 維持率 > 90%
 * - Modal 開啟/關閉動畫流暢度
 * - 低於 60fps 的幀率 < 5%
 */

import { test, expect } from '@playwright/test'

interface PerformanceMetrics {
  fps: number[]
  avgFps: number
  minFps: number
  maxFps: number
  framesBelow60: number
  totalFrames: number
  fpsConsistency: number // 維持率 (%)
}

/**
 * 收集動畫期間的 FPS 數據
 */
async function collectFPSMetrics(
  page: any,
  duration: number = 2000
): Promise<PerformanceMetrics> {
  const fpsData: number[] = []

  // 開始 FPS 監控
  await page.evaluate((dur: number) => {
    return new Promise<void>((resolve) => {
      const fps: number[] = []
      let lastTime = performance.now()
      let frameCount = 0

      function measureFPS() {
        const currentTime = performance.now()
        const delta = currentTime - lastTime

        if (delta >= 1000) {
          // 每秒計算一次 FPS
          const currentFPS = Math.round((frameCount * 1000) / delta)
          fps.push(currentFPS)
          ;(window as any).__fpsData = fps
          frameCount = 0
          lastTime = currentTime
        }

        frameCount++

        if (currentTime - lastTime < dur) {
          requestAnimationFrame(measureFPS)
        } else {
          resolve()
        }
      }

      requestAnimationFrame(measureFPS)
    })
  }, duration)

  // 獲取 FPS 數據
  const fps = await page.evaluate(() => (window as any).__fpsData || [])

  if (fps.length === 0) {
    return {
      fps: [],
      avgFps: 0,
      minFps: 0,
      maxFps: 0,
      framesBelow60: 0,
      totalFrames: 0,
      fpsConsistency: 0,
    }
  }

  const avgFps = fps.reduce((a: number, b: number) => a + b, 0) / fps.length
  const minFps = Math.min(...fps)
  const maxFps = Math.max(...fps)
  const framesBelow60 = fps.filter((f: number) => f < 60).length
  const fpsConsistency = ((fps.length - framesBelow60) / fps.length) * 100

  return {
    fps,
    avgFps,
    minFps,
    maxFps,
    framesBelow60,
    totalFrames: fps.length,
    fpsConsistency,
  }
}

test.describe('快速占卜 - 動畫效能測試', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/readings/quick')

    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })
  })

  test('翻牌動畫應該保持 FPS > 55', async ({ page }) => {
    console.log('\n📊 測試翻牌動畫效能...')

    // 開始監控後立即翻牌
    const metricsPromise = collectFPSMetrics(page, 2000)

    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()

    const metrics = await metricsPromise

    console.log(`  平均 FPS: ${metrics.avgFps.toFixed(2)}`)
    console.log(`  最低 FPS: ${metrics.minFps}`)
    console.log(`  最高 FPS: ${metrics.maxFps}`)
    console.log(`  低於 60fps 幀數: ${metrics.framesBelow60}/${metrics.totalFrames}`)
    console.log(`  FPS 維持率: ${metrics.fpsConsistency.toFixed(2)}%`)

    // 驗證平均 FPS > 55
    expect(metrics.avgFps).toBeGreaterThan(55)

    // 驗證低於 60fps 的幀率 < 5%
    const lowFpsRate = (metrics.framesBelow60 / metrics.totalFrames) * 100
    expect(lowFpsRate).toBeLessThan(5)
  })

  test('Carousel 滑動應該保持 FPS 維持率 > 90%', async ({ page }) => {
    console.log('\n📊 測試 Carousel 滑動效能...')

    // 開始監控
    const metricsPromise = collectFPSMetrics(page, 3000)

    // 連續切換卡牌
    const nextButton = page.getByLabelText('下一張卡牌')

    for (let i = 0; i < 4; i++) {
      await nextButton.click()
      await page.waitForTimeout(200)
    }

    const metrics = await metricsPromise

    console.log(`  平均 FPS: ${metrics.avgFps.toFixed(2)}`)
    console.log(`  FPS 維持率: ${metrics.fpsConsistency.toFixed(2)}%`)
    console.log(`  低於 60fps 幀數: ${metrics.framesBelow60}/${metrics.totalFrames}`)

    // 驗證 FPS 維持率 > 90%
    expect(metrics.fpsConsistency).toBeGreaterThan(90)

    // 驗證平均 FPS 穩定
    expect(metrics.avgFps).toBeGreaterThan(55)
  })

  test('Modal 開啟動畫應該流暢', async ({ page }) => {
    console.log('\n📊 測試 Modal 開啟動畫效能...')

    // 先翻牌
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()
    await page.waitForTimeout(1000)

    // 開始監控後開啟 Modal
    const metricsPromise = collectFPSMetrics(page, 1500)

    await firstCard.click()

    const metrics = await metricsPromise

    console.log(`  平均 FPS: ${metrics.avgFps.toFixed(2)}`)
    console.log(`  FPS 維持率: ${metrics.fpsConsistency.toFixed(2)}%`)

    // Modal 開啟應該流暢
    expect(metrics.avgFps).toBeGreaterThan(55)

    // 低於 60fps 的幀數應該很少
    const lowFpsRate = (metrics.framesBelow60 / metrics.totalFrames) * 100
    expect(lowFpsRate).toBeLessThan(10) // Modal 動畫允許稍微寬鬆
  })

  test('Modal 關閉動畫應該流暢', async ({ page }) => {
    console.log('\n📊 測試 Modal 關閉動畫效能...')

    // 翻牌並開啟 Modal
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()
    await page.waitForTimeout(1000)
    await firstCard.click()
    await page.waitForTimeout(1000)

    // 確認 Modal 已開啟
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 3000 })

    // 開始監控後關閉 Modal
    const metricsPromise = collectFPSMetrics(page, 1500)

    await page.keyboard.press('Escape')

    const metrics = await metricsPromise

    console.log(`  平均 FPS: ${metrics.avgFps.toFixed(2)}`)
    console.log(`  FPS 維持率: ${metrics.fpsConsistency.toFixed(2)}%`)

    // Modal 關閉應該流暢
    expect(metrics.avgFps).toBeGreaterThan(55)

    const lowFpsRate = (metrics.framesBelow60 / metrics.totalFrames) * 100
    expect(lowFpsRate).toBeLessThan(10)
  })

  test('鍵盤導航應該保持流暢', async ({ page }) => {
    console.log('\n📊 測試鍵盤導航效能...')

    const metricsPromise = collectFPSMetrics(page, 2500)

    // 快速按方向鍵切換
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press(i % 2 === 0 ? 'ArrowRight' : 'ArrowLeft')
      await page.waitForTimeout(100)
    }

    const metrics = await metricsPromise

    console.log(`  平均 FPS: ${metrics.avgFps.toFixed(2)}`)
    console.log(`  FPS 維持率: ${metrics.fpsConsistency.toFixed(2)}%`)

    // 鍵盤導航應該非常流暢
    expect(metrics.avgFps).toBeGreaterThan(58)
    expect(metrics.fpsConsistency).toBeGreaterThan(95)
  })

  test('整體頁面滾動應該流暢', async ({ page }) => {
    console.log('\n📊 測試頁面滾動效能...')

    // 翻牌以顯示 CTA（增加頁面高度）
    const firstCard = page.locator('[data-testid="card-0"]')
    await firstCard.click()
    await page.waitForTimeout(1000)

    const metricsPromise = collectFPSMetrics(page, 2000)

    // 滾動頁面
    await page.evaluate(() => {
      window.scrollTo({ top: 500, behavior: 'smooth' })
    })

    await page.waitForTimeout(800)

    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })

    const metrics = await metricsPromise

    console.log(`  平均 FPS: ${metrics.avgFps.toFixed(2)}`)
    console.log(`  FPS 維持率: ${metrics.fpsConsistency.toFixed(2)}%`)

    // 滾動應該流暢
    expect(metrics.avgFps).toBeGreaterThan(55)
    expect(metrics.fpsConsistency).toBeGreaterThan(90)
  })
})

test.describe('動畫效能綜合測試', () => {
  test('完整流程的 FPS 穩定性測試', async ({ page, context }) => {
    console.log('\n📊 執行完整流程 FPS 穩定性測試...')

    await context.clearCookies()
    await page.goto('/readings/quick')

    await page.waitForSelector('[data-testid="position-indicator"]', {
      timeout: 5000,
    })

    // 監控整個流程
    const metricsPromise = collectFPSMetrics(page, 8000)

    // 1. Carousel 導航
    const nextButton = page.getByLabelText('下一張卡牌')
    await nextButton.click()
    await page.waitForTimeout(300)
    await nextButton.click()
    await page.waitForTimeout(300)

    // 2. 翻牌
    const thirdCard = page.locator('[data-testid="card-2"]')
    await thirdCard.click()
    await page.waitForTimeout(1000)

    // 3. 開啟 Modal
    await thirdCard.click()
    await page.waitForTimeout(1500)

    // 4. 關閉 Modal
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)

    // 5. 重新抽卡
    await page.getByText('重新抽卡').click()
    await page.waitForTimeout(500)
    await page.getByText('確定重新抽卡').click()

    const metrics = await metricsPromise

    console.log(`\n  完整流程效能指標:`)
    console.log(`  平均 FPS: ${metrics.avgFps.toFixed(2)}`)
    console.log(`  最低 FPS: ${metrics.minFps}`)
    console.log(`  FPS 維持率: ${metrics.fpsConsistency.toFixed(2)}%`)
    console.log(`  低於 60fps 次數: ${metrics.framesBelow60}/${metrics.totalFrames}`)

    // 完整流程應該保持穩定
    expect(metrics.avgFps).toBeGreaterThan(55)
    expect(metrics.fpsConsistency).toBeGreaterThan(85) // 完整流程允許稍微寬鬆

    const lowFpsRate = (metrics.framesBelow60 / metrics.totalFrames) * 100
    expect(lowFpsRate).toBeLessThan(15) // 完整流程中允許有少量低 FPS
  })
})
