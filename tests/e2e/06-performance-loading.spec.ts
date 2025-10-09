import { test, expect } from '@playwright/test'

test.describe('性能和載入測試', () => {
  test('頁面載入速度測試', async ({ page }) => {
    // 記錄性能指標
    const performanceMetrics: any[] = []

    // 監聽 DOMContentLoaded 事件
    let domContentLoadedTime = 0
    page.on('domcontentloaded', () => {
      domContentLoadedTime = Date.now()
    })

    // 監聽 load 事件
    let loadTime = 0
    page.on('load', () => {
      loadTime = Date.now()
    })

    const startTime = Date.now()

    // 訪問首頁
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const endTime = Date.now()
    const totalLoadTime = endTime - startTime

    // 收集性能指標
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')

      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnection: navigation.connectEnd - navigation.connectStart,
        serverResponse: navigation.responseEnd - navigation.requestStart,
        domProcessing: navigation.domContentLoadedEventStart - navigation.responseEnd
      }
    })

    // 輸出性能指標
    console.log('📊 首頁載入性能指標:')
    console.log(`  總載入時間: ${totalLoadTime}ms`)
    console.log(`  DOM Content Loaded: ${metrics.domContentLoaded}ms`)
    console.log(`  Load Complete: ${metrics.loadComplete}ms`)
    console.log(`  First Paint: ${metrics.firstPaint}ms`)
    console.log(`  First Contentful Paint: ${metrics.firstContentfulPaint}ms`)
    console.log(`  DNS 查找: ${metrics.dnsLookup}ms`)
    console.log(`  TCP 連接: ${metrics.tcpConnection}ms`)
    console.log(`  服務器響應: ${metrics.serverResponse}ms`)
    console.log(`  DOM 處理: ${metrics.domProcessing}ms`)

    // 性能斷言（設定合理的閾值）
    expect(totalLoadTime).toBeLessThan(5000) // 總載入時間應少於 5 秒
    expect(metrics.firstContentfulPaint).toBeLessThan(3000) // FCP 應少於 3 秒
    expect(metrics.domContentLoaded).toBeLessThan(2000) // DOMContentLoaded 應少於 2 秒

    // 截圖載入完成狀態
    await page.screenshot({ path: 'test-results/screenshots/page-loaded.png' })

    performanceMetrics.push({ page: 'homepage', ...metrics, totalLoadTime })
  })

  test('資源載入測試', async ({ page }) => {
    const failedResources: string[] = []
    const resourceSizes: { url: string; size: number; type: string }[] = []

    // 監聽資源載入失敗
    page.on('response', async (response) => {
      if (!response.ok()) {
        failedResources.push(`${response.status()} ${response.url()}`)
      } else {
        try {
          const body = await response.body()
          resourceSizes.push({
            url: response.url(),
            size: body.length,
            type: response.headers()['content-type'] || 'unknown'
          })
        } catch (error) {
          // 忽略無法讀取的響應
        }
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 檢查是否有載入失敗的資源
    if (failedResources.length > 0) {
      console.warn('⚠️  載入失敗的資源:')
      failedResources.forEach(resource => console.warn(`  ${resource}`))
    } else {
      console.log('✅ 所有資源載入成功')
    }

    // 分析資源大小
    const totalSize = resourceSizes.reduce((sum, resource) => sum + resource.size, 0)
    const imageResources = resourceSizes.filter(r => r.type.startsWith('image/'))
    const jsResources = resourceSizes.filter(r => r.type.includes('javascript'))
    const cssResources = resourceSizes.filter(r => r.type.includes('css'))

    console.log('📦 資源載入分析:')
    console.log(`  總資源數量: ${resourceSizes.length}`)
    console.log(`  總資源大小: ${(totalSize / 1024).toFixed(2)} KB`)
    console.log(`  圖像資源: ${imageResources.length} 個, ${(imageResources.reduce((sum, r) => sum + r.size, 0) / 1024).toFixed(2)} KB`)
    console.log(`  JavaScript 資源: ${jsResources.length} 個, ${(jsResources.reduce((sum, r) => sum + r.size, 0) / 1024).toFixed(2)} KB`)
    console.log(`  CSS 資源: ${cssResources.length} 個, ${(cssResources.reduce((sum, r) => sum + r.size, 0) / 1024).toFixed(2)} KB`)

    // 資源大小斷言
    expect(totalSize).toBeLessThan(5 * 1024 * 1024) // 總資源應少於 5MB
    expect(failedResources.length).toBe(0) // 不應有載入失敗的資源
  })

  test('Console 錯誤檢查', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = []

    // 監聽 console 訊息
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      })
    })

    // 監聽頁面錯誤
    const pageErrors: string[] = []
    page.on('pageerror', (error) => {
      pageErrors.push(error.message)
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 分析 console 訊息
    const errors = consoleMessages.filter(msg => msg.type === 'error')
    const warnings = consoleMessages.filter(msg => msg.type === 'warning')

    console.log('🔍 Console 檢查結果:')
    console.log(`  錯誤: ${errors.length} 個`)
    console.log(`  警告: ${warnings.length} 個`)
    console.log(`  頁面錯誤: ${pageErrors.length} 個`)

    if (errors.length > 0) {
      console.log('❌ Console 錯誤:')
      errors.forEach(error => console.log(`  ${error.text}`))
    }

    if (warnings.length > 0) {
      console.log('⚠️  Console 警告:')
      warnings.forEach(warning => console.log(`  ${warning.text}`))
    }

    if (pageErrors.length > 0) {
      console.log('💥 頁面錯誤:')
      pageErrors.forEach(error => console.log(`  ${error}`))
    }

    // 錯誤斷言（根據項目實際情況調整）
    expect(pageErrors.length).toBe(0) // 不應有 JavaScript 錯誤
    // expect(errors.length).toBe(0) // 可選：不應有 console.error
  })

  test('多頁面載入性能測試', async ({ page }) => {
    const pages = [
      { url: '/', name: '首頁' },
      { url: '/auth/login', name: '登入頁' },
      { url: '/auth/register', name: '註冊頁' },
      { url: '/cards', name: '卡牌圖書館' }
    ]

    const performanceResults: any[] = []

    for (const { url, name } of pages) {
      const startTime = Date.now()

      await page.goto(url)
      await page.waitForLoadState('networkidle')

      const endTime = Date.now()
      const loadTime = endTime - startTime

      // 收集性能指標
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart
        }
      })

      performanceResults.push({
        page: name,
        url,
        loadTime,
        ...metrics
      })

      console.log(`✅ ${name} (${url}): ${loadTime}ms`)

      // 截圖每個頁面
      const filename = name.replace(/\s+/g, '-').toLowerCase()
      await page.screenshot({ path: `test-results/screenshots/performance-${filename}.png` })
    }

    // 分析整體性能
    const avgLoadTime = performanceResults.reduce((sum, result) => sum + result.loadTime, 0) / performanceResults.length
    console.log(`📈 平均載入時間: ${avgLoadTime.toFixed(2)}ms`)

    // 性能斷言
    performanceResults.forEach(result => {
      expect(result.loadTime).toBeLessThan(5000) // 每個頁面都應在 5 秒內載入
    })
  })

  test('網路條件模擬測試', async ({ page, context }) => {
    // 模擬慢速網路 (慢速 3G)
    await context.route('**/*', async (route) => {
      // 延遲 300-800ms 模擬慢速網路
      const delay = Math.random() * 500 + 300
      await new Promise(resolve => setTimeout(resolve, delay))
      await route.continue()
    })

    const startTime = Date.now()

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const endTime = Date.now()
    const slowNetworkLoadTime = endTime - startTime

    console.log(`🐌 慢速網路載入時間: ${slowNetworkLoadTime}ms`)

    // 檢查在慢速網路下頁面是否仍然可用
    await expect(page.getByText('廢土塔羅')).toBeVisible()

    // 慢速網路下的合理時間範圍
    expect(slowNetworkLoadTime).toBeLessThan(15000) // 慢速網路下應在 15 秒內載入

    // 截圖慢速網路載入結果
    await page.screenshot({ path: 'test-results/screenshots/slow-network-loaded.png' })
  })

  test('記憶體和 CPU 使用監控', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 執行一些互動操作來測試性能
    const operations = [
      () => page.hover('.animate-pulse'),
      () => page.click('button'),
      () => page.evaluate(() => window.scrollTo(0, 500)),
      () => page.evaluate(() => window.scrollTo(0, 0))
    ]

    for (const operation of operations) {
      try {
        await operation()
        await page.waitForTimeout(500)
      } catch (error) {
        // 忽略操作失敗
      }
    }

    // 檢查 JavaScript 堆大小（如果可用）
    const memoryInfo = await page.evaluate(() => {
      // @ts-ignore
      if (performance.memory) {
        // @ts-ignore
        return {
          // @ts-ignore
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          // @ts-ignore
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          // @ts-ignore
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        }
      }
      return null
    })

    if (memoryInfo) {
      console.log('🧠 記憶體使用情況:')
      console.log(`  已使用 JS 堆: ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`)
      console.log(`  總 JS 堆: ${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`)
      console.log(`  JS 堆限制: ${(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`)

      // 記憶體使用斷言
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024) // 應少於 50MB
    }
  })

  test('快取行為測試', async ({ page }) => {
    // 第一次載入
    const firstLoadStart = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const firstLoadTime = Date.now() - firstLoadStart

    // 重新載入頁面
    const reloadStart = Date.now()
    await page.reload()
    await page.waitForLoadState('networkidle')
    const reloadTime = Date.now() - reloadStart

    console.log(`📋 快取測試結果:`)
    console.log(`  首次載入: ${firstLoadTime}ms`)
    console.log(`  重新載入: ${reloadTime}ms`)
    console.log(`  速度提升: ${((firstLoadTime - reloadTime) / firstLoadTime * 100).toFixed(1)}%`)

    // 重新載入應該更快（由於快取）
    expect(reloadTime).toBeLessThan(firstLoadTime)
  })

  test('並發載入測試', async ({ page }) => {
    // 同時載入多個資源
    const promises = [
      page.goto('/'),
      page.goto('/auth/login'),
      page.goto('/auth/register')
    ]

    const startTime = Date.now()

    // 等待所有頁面載入完成
    await Promise.all(promises.map(p => p.catch(e => console.log('頁面載入失敗:', e))))

    const endTime = Date.now()
    const concurrentLoadTime = endTime - startTime

    console.log(`⚡ 並發載入時間: ${concurrentLoadTime}ms`)

    // 最後確保當前頁面正常
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('廢土塔羅')).toBeVisible()

    // 並發載入應該在合理時間內完成
    expect(concurrentLoadTime).toBeLessThan(10000) // 10 秒內
  })
})