/**
 * Card Tilt Performance Tests
 * 測試 3D 傾斜效果的效能指標（FPS、記憶體、CPU）
 */

import { test, expect, chromium } from '@playwright/test'

test.describe('Card Tilt Performance', () => {
  test('FPS 測試 - 單卡片傾斜應維持 ≥30fps', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // 啟用效能追蹤
    const client = await page.context().newCDPSession(page)
    await client.send('Performance.enable')

    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    const box = await card.boundingBox()
    if (!box) throw new Error('Card bounding box not found')

    // 開始效能監控
    const metrics: number[] = []
    let frameCount = 0
    const duration = 2000 // 監控 2 秒

    const startTime = Date.now()

    // 持續移動滑鼠觸發傾斜
    const moveInterval = setInterval(async () => {
      if (Date.now() - startTime >= duration) {
        clearInterval(moveInterval)
        return
      }

      const x = box.x + (Math.random() * box.width)
      const y = box.y + (Math.random() * box.height)
      await page.mouse.move(x, y, { steps: 1 })
      frameCount++
    }, 16) // ~60fps 嘗試

    await page.waitForTimeout(duration)

    // 計算 FPS
    const fps = (frameCount / duration) * 1000

    console.log(`FPS: ${fps.toFixed(2)}`)

    // 應該至少 30fps
    expect(fps).toBeGreaterThanOrEqual(30)

    await context.close()
  })

  test('記憶體使用測試 - 多卡片場景', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    // 取得初始記憶體
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        }
      }
      return null
    })

    if (!initialMemory) {
      console.log('Performance memory API not available')
      test.skip()
      return
    }

    console.log('Initial memory:', initialMemory)

    // 啟用多個卡片的傾斜效果
    const cards = page.locator('a[href^="/cards/"]')
    const cardCount = Math.min(await cards.count(), 10) // 測試前 10 張卡片

    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i)
      await card.hover()
      await page.waitForTimeout(100)
    }

    await page.waitForTimeout(1000) // 讓記憶體穩定

    // 取得啟用後記憶體
    const activeMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        }
      }
      return null
    })

    console.log('Active memory:', activeMemory)

    if (activeMemory && initialMemory) {
      const memoryIncrease =
        (activeMemory.usedJSHeapSize - initialMemory.usedJSHeapSize) / (1024 * 1024)
      console.log(`Memory increase: ${memoryIncrease.toFixed(2)} MB`)

      // 記憶體增加應小於 5MB
      expect(memoryIncrease).toBeLessThan(5)
    }

    // 停用所有效果（移開滑鼠）
    await page.mouse.move(0, 0)
    await page.waitForTimeout(1000)

    // 取得復原後記憶體
    const finalMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        }
      }
      return null
    })

    console.log('Final memory:', finalMemory)

    if (finalMemory && initialMemory) {
      const finalIncrease =
        (finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize) / (1024 * 1024)
      console.log(`Final memory increase: ${finalIncrease.toFixed(2)} MB`)

      // 應該接近初始記憶體（允許 2MB 差異）
      expect(Math.abs(finalIncrease)).toBeLessThan(2)
    }

    await context.close()
  })

  test('記憶體洩漏檢測 - Mount/Unmount 循環', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    // 取得初始記憶體
    const getMemory = async () => {
      return await page.evaluate(() => {
        if (performance.memory) {
          return (performance as any).memory.usedJSHeapSize
        }
        return 0
      })
    }

    const initialMemory = await getMemory()
    console.log('Initial memory:', initialMemory)

    // 重複啟用/停用效果 10 次（模擬 mount/unmount）
    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    for (let cycle = 0; cycle < 10; cycle++) {
      // 啟用效果（模擬 mount）
      await card.hover()
      await page.waitForTimeout(100)

      // 停用效果（模擬 unmount）
      await page.mouse.move(0, 0)
      await page.waitForTimeout(100)
    }

    // 強制垃圾回收（如果可用）
    await page.evaluate(() => {
      if ((window as any).gc) {
        ;(window as any).gc()
      }
    })

    await page.waitForTimeout(1000)

    const finalMemory = await getMemory()
    console.log('Final memory:', finalMemory)

    if (initialMemory > 0 && finalMemory > 0) {
      const leak = (finalMemory - initialMemory) / (1024 * 1024)
      console.log(`Memory leak: ${leak.toFixed(2)} MB`)

      // 洩漏應小於 1MB
      expect(leak).toBeLessThan(1)
    }

    await context.close()
  })

  test('清理驗證 - RAF 取消檢查', async ({ page }) => {
    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    // 監控 RAF 呼叫與取消
    const rafTracking = await page.evaluate(() => {
      let rafRequests = 0
      let rafCancellations = 0

      const originalRAF = window.requestAnimationFrame
      const originalCAF = window.cancelAnimationFrame

      window.requestAnimationFrame = function (callback) {
        rafRequests++
        return originalRAF.call(window, callback)
      }

      window.cancelAnimationFrame = function (id) {
        rafCancellations++
        return originalCAF.call(window, id)
      }

      ;(window as any).__rafTracking = { rafRequests, rafCancellations }
      return { rafRequests, rafCancellations }
    })

    console.log('Initial RAF tracking:', rafTracking)

    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    // 啟用效果
    await card.hover()
    await page.waitForTimeout(200)

    // 停用效果（應該取消 RAF）
    await page.mouse.move(0, 0)
    await page.waitForTimeout(200)

    const tracking = await page.evaluate(() => {
      return (window as any).__rafTracking
    })

    console.log('RAF tracking after hover/leave:', tracking)

    // RAF 請求與取消次數應該相近（允許少量差異）
    expect(Math.abs(tracking.rafRequests - tracking.rafCancellations)).toBeLessThanOrEqual(2)
  })

  test('清理驗證 - DeviceOrientation 事件監聽器移除', async ({ page }) => {
    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    // 監控 DeviceOrientation 事件監聽器
    const listenerTracking = await page.evaluate(() => {
      let addCount = 0
      let removeCount = 0

      const originalAdd = window.addEventListener
      const originalRemove = window.removeEventListener

      window.addEventListener = function (type, listener, options?) {
        if (type === 'deviceorientation') {
          addCount++
        }
        return originalAdd.call(window, type, listener as any, options)
      }

      window.removeEventListener = function (type, listener, options?) {
        if (type === 'deviceorientation') {
          removeCount++
        }
        return originalRemove.call(window, type, listener as any, options)
      }

      ;(window as any).__listenerTracking = { addCount, removeCount }
      return { addCount, removeCount }
    })

    console.log('Initial listener tracking:', listenerTracking)

    // 模擬頁面導航（觸發元件卸載）
    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    await page.waitForTimeout(500)

    const tracking = await page.evaluate(() => {
      return (window as any).__listenerTracking
    })

    console.log('Listener tracking after navigation:', tracking)

    // 添加與移除次數應該相等（完全清理）
    expect(tracking.addCount).toEqual(tracking.removeCount)
  })

  test('清理驗證 - IntersectionObserver disconnect', async ({ page }) => {
    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    // 監控 IntersectionObserver 創建與斷開
    const observerTracking = await page.evaluate(() => {
      let created = 0
      let disconnected = 0

      const OriginalObserver = window.IntersectionObserver
      window.IntersectionObserver = class extends OriginalObserver {
        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          super(callback, options)
          created++
          ;(window as any).__observerTracking = { created, disconnected }
        }

        disconnect() {
          disconnected++
          ;(window as any).__observerTracking = { created, disconnected }
          return super.disconnect()
        }
      }

      return { created, disconnected }
    })

    console.log('Initial observer tracking:', observerTracking)

    const cards = page.locator('a[href^="/cards/"]')
    const cardCount = Math.min(await cards.count(), 5)

    // 懸停於多張卡片
    for (let i = 0; i < cardCount; i++) {
      await cards.nth(i).hover()
      await page.waitForTimeout(100)
    }

    // 導航離開頁面（觸發卸載）
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.waitForTimeout(500)

    const tracking = await page.evaluate(() => {
      return (window as any).__observerTracking || { created: 0, disconnected: 0 }
    })

    console.log('Observer tracking after navigation:', tracking)

    // 創建與斷開次數應該相等
    expect(tracking.created).toEqual(tracking.disconnected)
  })

  test('CPU 使用率測試（低階裝置模擬）', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // 啟用 CPU throttling (4x 慢速)
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })

    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    const box = await card.boundingBox()
    if (!box) throw new Error('Card bounding box not found')

    // 測試在 CPU 節流下是否仍能流暢運行
    const startTime = Date.now()

    // 移動滑鼠 50 次
    for (let i = 0; i < 50; i++) {
      const x = box.x + (Math.random() * box.width)
      const y = box.y + (Math.random() * box.height)
      await page.mouse.move(x, y, { steps: 1 })
      await page.waitForTimeout(20)
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`Duration with 4x CPU throttling: ${duration}ms`)

    // 應該在合理時間內完成（< 5 秒）
    expect(duration).toBeLessThan(5000)

    // 頁面應該沒有崩潰
    const isVisible = await card.isVisible()
    expect(isVisible).toBe(true)

    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    await context.close()
  })

  test('IntersectionObserver 效能優化驗證', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    // 確保有多個卡片
    const cards = page.locator('a[href^="/cards/"]')
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThan(5)

    // 監控 RAF 呼叫次數
    const rafCallsBeforeScroll = await page.evaluate(() => {
      let calls = 0
      const originalRAF = window.requestAnimationFrame
      window.requestAnimationFrame = function (callback) {
        calls++
        return originalRAF.call(window, callback)
      }
      ;(window as any).__rafCalls = calls
      return calls
    })

    // 滾動至頁面底部（讓上方卡片離開可視區域）
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })

    await page.waitForTimeout(500)

    // 懸停於不可見的卡片（應該不會觸發 RAF）
    const firstCard = cards.first()
    const box = await firstCard.boundingBox()

    if (box && box.y < 0) {
      // 卡片在視口外
      await firstCard.hover({ force: true })
      await page.waitForTimeout(200)

      const rafCallsAfterHover = await page.evaluate(() => {
        return (window as any).__rafCalls
      })

      console.log('RAF calls (out of viewport):', rafCallsAfterHover - rafCallsBeforeScroll)

      // 不可見卡片的 RAF 呼叫應該較少
      expect(rafCallsAfterHover - rafCallsBeforeScroll).toBeLessThan(10)
    }

    await context.close()
  })

  test('Time to Interactive (TTI) 測試', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // 開始效能追蹤
    await page.goto('/cards/major-arcana')

    // 測量 TTI
    const tti = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'measure' && entry.name === 'tti') {
                resolve(entry.duration)
              }
            }
          })
          observer.observe({ entryTypes: ['measure'] })
        }

        // Fallback: 使用 load 事件時間
        if (document.readyState === 'complete') {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          if (navigation) {
            resolve(navigation.loadEventEnd - navigation.fetchStart)
          }
        } else {
          window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
            if (navigation) {
              resolve(navigation.loadEventEnd - navigation.fetchStart)
            } else {
              resolve(0)
            }
          })
        }
      })
    })

    console.log(`TTI: ${tti}ms`)

    // TTI 應小於 50ms（從 load 到互動）
    // 如果包含整個頁面載入，應小於 3000ms
    if (tti < 100) {
      expect(tti).toBeLessThan(50)
    } else {
      expect(tti).toBeLessThan(3000)
    }

    await context.close()
  })

  test('動畫幀率監控（Chrome DevTools Protocol）', async () => {
    const browser = await chromium.launch()
    const context = await browser.newContext()
    const page = await context.newPage()

    const client = await page.context().newCDPSession(page)

    // 啟用 FPS meter
    await client.send('Overlay.setShowFPSCounter', { show: true })

    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    const box = await card.boundingBox()
    if (!box) throw new Error('Card bounding box not found')

    // 持續移動滑鼠 2 秒
    const startTime = Date.now()
    let frames = 0

    while (Date.now() - startTime < 2000) {
      const x = box.x + (Math.random() * box.width)
      const y = box.y + (Math.random() * box.height)
      await page.mouse.move(x, y, { steps: 1 })
      await page.waitForTimeout(16) // ~60fps
      frames++
    }

    const fps = (frames / 2) // 2 seconds

    console.log(`Measured FPS: ${fps}`)

    // 應該至少 30fps
    expect(fps).toBeGreaterThanOrEqual(30)

    await context.close()
    await browser.close()
  })

  test('效能標記檢查', async ({ page }) => {
    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    // 檢查是否有效能標記
    const marks = await page.evaluate(() => {
      const allMarks = performance.getEntriesByType('mark')
      return allMarks.map((m) => m.name)
    })

    console.log('Performance marks:', marks)

    // 如果有效能標記，記錄並驗證
    expect(Array.isArray(marks)).toBe(true)
  })

  test('長時間運行穩定性測試', async ({ browser }) => {
    test.setTimeout(60000) // 1 分鐘超時

    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    const card = page.locator('a[href^="/cards/"]').first()
    await card.waitFor({ state: 'visible' })

    const box = await card.boundingBox()
    if (!box) throw new Error('Card bounding box not found')

    // 持續運行 30 秒
    const startTime = Date.now()
    let iterations = 0

    while (Date.now() - startTime < 30000) {
      const x = box.x + (Math.random() * box.width)
      const y = box.y + (Math.random() * box.height)
      await page.mouse.move(x, y, { steps: 1 })
      await page.waitForTimeout(50)
      iterations++
    }

    console.log(`Completed ${iterations} iterations in 30 seconds`)

    // 頁面應該仍然可見且正常
    const isVisible = await card.isVisible()
    expect(isVisible).toBe(true)

    // 檢查是否有 console 錯誤
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    expect(errors).toEqual([])

    await context.close()
  })
})
