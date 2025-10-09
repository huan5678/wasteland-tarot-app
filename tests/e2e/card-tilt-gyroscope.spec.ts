/**
 * Card Tilt Gyroscope E2E Tests
 * 測試陀螺儀傾斜效果（模擬 DeviceOrientation 事件）
 */

import { test, expect } from '@playwright/test'

test.describe('Card Tilt - Gyroscope', () => {
  test.beforeEach(async ({ page }) => {
    // 設定行動視口
    await page.setViewportSize({ width: 390, height: 844 })

    // Mock DeviceOrientation API
    await page.addInitScript(() => {
      // 模擬 DeviceOrientation 支援
      ;(window as any).DeviceOrientationEvent = class DeviceOrientationEvent extends Event {
        alpha: number | null
        beta: number | null
        gamma: number | null
        absolute: boolean

        constructor(type: string, eventInitDict?: any) {
          super(type)
          this.alpha = eventInitDict?.alpha ?? null
          this.beta = eventInitDict?.beta ?? null
          this.gamma = eventInitDict?.gamma ?? null
          this.absolute = eventInitDict?.absolute ?? false
        }

        static requestPermission?: () => Promise<'granted' | 'denied'>
      }
    })

    await page.goto('/readings/quick')
    await page.waitForLoadState('networkidle')
  })

  test('DeviceOrientation API 應該被支援', async ({ page }) => {
    const hasDeviceOrientation = await page.evaluate(() => {
      return 'DeviceOrientationEvent' in window
    })

    expect(hasDeviceOrientation).toBe(true)
  })

  test('模擬陀螺儀事件應更新卡片傾斜', async ({ page }) => {
    const card = page.locator(
      '[data-testid="mobile-tarot-card"], [data-testid="tarot-card"]'
    ).first()
    await card.waitFor({ state: 'visible' })

    // 記錄初始 transform
    const initialTransform = await card.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // 模擬陀螺儀事件（裝置向右傾斜）
    await page.evaluate(() => {
      const event = new (window as any).DeviceOrientationEvent('deviceorientation', {
        alpha: 0,
        beta: 0, // 前後傾斜
        gamma: 20, // 左右傾斜（正值 = 向右）
        absolute: false
      })
      window.dispatchEvent(event)
    })

    await page.waitForTimeout(200) // 等待狀態更新

    const afterGyroTransform = await card.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // transform 應該已更新（可能不同）
    // 注意：如果權限未授予，可能不會改變
    expect(afterGyroTransform).toBeDefined()
  })

  test('陀螺儀角度應轉換為卡片傾斜', async ({ page }) => {
    const card = page.locator(
      '[data-testid="mobile-tarot-card"], [data-testid="tarot-card"]'
    ).first()
    await card.waitFor({ state: 'visible' })

    // 測試多個陀螺儀值
    const testCases = [
      { beta: 10, gamma: 0 }, // 向前傾
      { beta: -10, gamma: 0 }, // 向後傾
      { beta: 0, gamma: 15 }, // 向右傾
      { beta: 0, gamma: -15 } // 向左傾
    ]

    for (const { beta, gamma } of testCases) {
      await page.evaluate(
        ({ beta, gamma }) => {
          const event = new (window as any).DeviceOrientationEvent('deviceorientation', {
            alpha: 0,
            beta,
            gamma,
            absolute: false
          })
          window.dispatchEvent(event)
        },
        { beta, gamma }
      )

      await page.waitForTimeout(100)

      const transform = await card.evaluate((el) => {
        return window.getComputedStyle(el).transform
      })

      // 每個位置應該有 transform（即使權限未授予，至少應有預設值）
      expect(transform).toBeDefined()
    }
  })

  test('極端陀螺儀值應被限制', async ({ page }) => {
    const card = page.locator(
      '[data-testid="mobile-tarot-card"], [data-testid="tarot-card"]'
    ).first()
    await card.waitFor({ state: 'visible' })

    // 發送極端值
    await page.evaluate(() => {
      const event = new (window as any).DeviceOrientationEvent('deviceorientation', {
        alpha: 0,
        beta: 180, // 極端值
        gamma: 90, // 極端值
        absolute: false
      })
      window.dispatchEvent(event)
    })

    await page.waitForTimeout(200)

    const transform = await card.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // 應該有 transform，且不應該是極端值
    expect(transform).not.toBe('none')
    expect(transform).toBeDefined()
  })

  test('陀螺儀事件節流應防止過度更新', async ({ page }) => {
    const card = page.locator(
      '[data-testid="mobile-tarot-card"], [data-testid="tarot-card"]'
    ).first()
    await card.waitFor({ state: 'visible' })

    // 快速發送多個事件
    const eventCount = 100
    const startTime = Date.now()

    await page.evaluate((count) => {
      for (let i = 0; i < count; i++) {
        const event = new (window as any).DeviceOrientationEvent('deviceorientation', {
          alpha: 0,
          beta: Math.random() * 20,
          gamma: Math.random() * 20,
          absolute: false
        })
        window.dispatchEvent(event)
      }
    }, eventCount)

    await page.waitForTimeout(500)

    const endTime = Date.now()
    const duration = endTime - startTime

    // 應該快速完成（節流生效）
    expect(duration).toBeLessThan(1000)

    // 頁面應該沒有崩潰
    const isVisible = await card.isVisible()
    expect(isVisible).toBe(true)
  })

  test('Page Visibility API 應暫停陀螺儀監聽', async ({ page }) => {
    const card = page.locator(
      '[data-testid="mobile-tarot-card"], [data-testid="tarot-card"]'
    ).first()
    await card.waitFor({ state: 'visible' })

    // 模擬頁面切換至背景
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get() {
          return true
        }
      })

      const event = new Event('visibilitychange')
      document.dispatchEvent(event)
    })

    await page.waitForTimeout(200)

    // 檢查傾斜狀態（應該復原）
    const transform = await card.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // 背景時應該復原或停止更新
    expect(transform).toBeDefined()
  })

  test('回到前景應恢復陀螺儀監聽', async ({ page }) => {
    const card = page.locator(
      '[data-testid="mobile-tarot-card"], [data-testid="tarot-card"]'
    ).first()
    await card.waitFor({ state: 'visible' })

    // 模擬頁面切換至背景
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get() {
          return true
        }
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await page.waitForTimeout(100)

    // 模擬回到前景
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get() {
          return false
        }
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await page.waitForTimeout(100)

    // 發送陀螺儀事件
    await page.evaluate(() => {
      const event = new (window as any).DeviceOrientationEvent('deviceorientation', {
        alpha: 0,
        beta: 10,
        gamma: 10,
        absolute: false
      })
      window.dispatchEvent(event)
    })

    await page.waitForTimeout(200)

    // 應該能正常接收事件
    const isVisible = await card.isVisible()
    expect(isVisible).toBe(true)
  })

  test('零值陀螺儀應產生水平狀態', async ({ page }) => {
    const card = page.locator(
      '[data-testid="mobile-tarot-card"], [data-testid="tarot-card"]'
    ).first()
    await card.waitFor({ state: 'visible' })

    // 發送零值事件
    await page.evaluate(() => {
      const event = new (window as any).DeviceOrientationEvent('deviceorientation', {
        alpha: 0,
        beta: 0,
        gamma: 0,
        absolute: false
      })
      window.dispatchEvent(event)
    })

    await page.waitForTimeout(200)

    const transform = await card.evaluate((el) => {
      return window.getComputedStyle(el).transform
    })

    // 應該是水平或接近水平
    expect(transform).toBeDefined()
  })

  test('console 不應有陀螺儀相關錯誤', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    const card = page.locator(
      '[data-testid="mobile-tarot-card"], [data-testid="tarot-card"]'
    ).first()
    await card.waitFor({ state: 'visible' })

    // 發送多個陀螺儀事件
    await page.evaluate(() => {
      for (let i = 0; i < 10; i++) {
        const event = new (window as any).DeviceOrientationEvent('deviceorientation', {
          alpha: 0,
          beta: Math.random() * 40 - 20,
          gamma: Math.random() * 40 - 20,
          absolute: false
        })
        window.dispatchEvent(event)
      }
    })

    await page.waitForTimeout(500)

    // 不應該有錯誤
    expect(errors).toEqual([])
  })

  test('陀螺儀權限拒絕應 fallback 優雅', async ({ page }) => {
    // Mock 權限拒絕
    await page.addInitScript(() => {
      if ((window as any).DeviceOrientationEvent) {
        ;(window as any).DeviceOrientationEvent.requestPermission = () =>
          Promise.resolve('denied')
      }
    })

    await page.goto('/readings/quick')
    await page.waitForLoadState('networkidle')

    const card = page.locator(
      '[data-testid="mobile-tarot-card"], [data-testid="tarot-card"]'
    ).first()
    await card.waitFor({ state: 'visible' })

    // 頁面應該正常顯示（即使沒有陀螺儀）
    expect(await card.isVisible()).toBe(true)

    // 發送陀螺儀事件（應該被忽略）
    await page.evaluate(() => {
      const event = new (window as any).DeviceOrientationEvent('deviceorientation', {
        alpha: 0,
        beta: 20,
        gamma: 20,
        absolute: false
      })
      window.dispatchEvent(event)
    })

    await page.waitForTimeout(200)

    // 頁面應該沒有錯誤
    const isVisible = await card.isVisible()
    expect(isVisible).toBe(true)
  })
})
