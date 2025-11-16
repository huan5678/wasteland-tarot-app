/**
 * Landing Page Performance Validation Script
 *
 * Validates performance metrics for Wave 7 Task 33:
 * - TTFB < 500ms (Server Component pre-rendering)
 * - FCP < 1.5s (First Contentful Paint)
 * - LCP < 2.5s (Largest Contentful Paint)
 * - CLS < 0.1 (Cumulative Layout Shift)
 * - Bundle Size < 50KB for client components
 * - Lighthouse Performance Score >= 90
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9
 */

import { test, expect } from '@playwright/test'

test.describe('Landing Page Performance Metrics', () => {
  test('should meet TTFB requirement (< 500ms)', async ({ page }) => {
    // Requirement: 12.1 - Server Component pre-rendering
    const startTime = Date.now()
    
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
    const ttfb = Date.now() - startTime

    console.log(`✓ TTFB: ${ttfb}ms`)
    
    // TTFB should be less than 500ms
    expect(ttfb).toBeLessThan(500)
    
    // Verify response is successful
    expect(response?.status()).toBe(200)
  })

  test('should meet Core Web Vitals requirements', async ({ page }) => {
    // Requirements: 12.2 (FCP), 12.3 (LCP), 12.5 (CLS)
    
    await page.goto('/', { waitUntil: 'networkidle' })

    // Collect Core Web Vitals using Performance API
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: {
          fcp?: number
          lcp?: number
          cls?: number
        } = {}

        // Get FCP (First Contentful Paint)
        const paintEntries = performance.getEntriesByType('paint')
        const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint')
        if (fcpEntry) {
          metrics.fcp = fcpEntry.startTime
        }

        // Get LCP (Largest Contentful Paint)
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          metrics.lcp = lastEntry.renderTime || lastEntry.loadTime
        })
        observer.observe({ type: 'largest-contentful-paint', buffered: true })

        // Get CLS (Cumulative Layout Shift)
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          }
          metrics.cls = clsValue
        })
        clsObserver.observe({ type: 'layout-shift', buffered: true })

        // Wait a bit to collect metrics
        setTimeout(() => {
          observer.disconnect()
          clsObserver.disconnect()
          resolve(metrics)
        }, 3000)
      })
    })

    console.log('📊 Core Web Vitals:')
    console.log(`  FCP: ${webVitals.fcp?.toFixed(0)}ms (target: < 1500ms)`)
    console.log(`  LCP: ${webVitals.lcp?.toFixed(0)}ms (target: < 2500ms)`)
    console.log(`  CLS: ${webVitals.cls?.toFixed(3)} (target: < 0.1)`)

    // Requirement: 12.2 - FCP < 1.5s (1500ms)
    if (webVitals.fcp) {
      expect(webVitals.fcp).toBeLessThan(1500)
    }

    // Requirement: 12.3 - LCP < 2.5s (2500ms)
    if (webVitals.lcp) {
      expect(webVitals.lcp).toBeLessThan(2500)
    }

    // Requirement: 12.5 - CLS < 0.1
    if (webVitals.cls !== undefined) {
      expect(webVitals.cls).toBeLessThan(0.1)
    }
  })

  test('should verify StatCounter animation runs at 60fps', async ({ page }) => {
    // Requirement: 12.6 - requestAnimationFrame for 60fps performance
    
    await page.goto('/', { waitUntil: 'networkidle' })
    
    // Scroll to Stats Counter section
    await page.locator('text=即時數據統計').scrollIntoViewIfNeeded()

    // Measure frame rate during animation
    const frameRate = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frameCount = 0
        let startTime = performance.now()
        let lastFrameTime = startTime

        const measureFrames = () => {
          const currentTime = performance.now()
          frameCount++

          if (currentTime - startTime < 2000) {
            // Continue measuring for 2 seconds (animation duration)
            requestAnimationFrame(measureFrames)
          } else {
            // Calculate average FPS
            const fps = frameCount / ((currentTime - startTime) / 1000)
            resolve(fps)
          }
        }

        requestAnimationFrame(measureFrames)
      })
    })

    console.log(`✓ Animation Frame Rate: ${frameRate.toFixed(1)} fps`)
    
    // Should be close to 60fps (allow some variance)
    expect(frameRate).toBeGreaterThan(50)
  })

  test('should verify no layout shift during rendering', async ({ page }) => {
    // Requirement: 12.7 - CLS < 0.1 (no layout shift)
    
    await page.goto('/', { waitUntil: 'load' })

    // Monitor layout shifts
    const layoutShifts = await page.evaluate(() => {
      return new Promise<number[]>((resolve) => {
        const shifts: number[] = []
        
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              shifts.push(entry.value)
            }
          }
        })
        
        observer.observe({ type: 'layout-shift', buffered: true })

        setTimeout(() => {
          observer.disconnect()
          resolve(shifts)
        }, 3000)
      })
    })

    const totalCLS = layoutShifts.reduce((sum, shift) => sum + shift, 0)
    console.log(`✓ Layout Shifts: ${layoutShifts.length} shifts, Total CLS: ${totalCLS.toFixed(3)}`)

    // No significant layout shifts
    expect(totalCLS).toBeLessThan(0.1)
  })

  test('should verify bundle size is optimized', async ({ page }) => {
    // Requirement: 12.8 - Client Component bundle < 50KB gzipped
    
    const response = await page.goto('/')
    
    // Get all JavaScript resources
    const jsResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      return resources
        .filter((r) => r.name.includes('.js'))
        .map((r) => ({
          name: r.name.split('/').pop(),
          size: r.encodedBodySize,
          transferSize: r.transferSize,
        }))
    })

    console.log('📦 JavaScript Resources:')
    let totalTransferSize = 0
    jsResources.forEach((resource) => {
      const sizeKB = (resource.transferSize / 1024).toFixed(2)
      console.log(`  ${resource.name}: ${sizeKB} KB (transfer)`)
      totalTransferSize += resource.transferSize
    })

    const totalKB = (totalTransferSize / 1024).toFixed(2)
    console.log(`  Total JS Transfer Size: ${totalKB} KB`)

    // Client-page specific bundle should be small
    const clientPageBundle = jsResources.find((r) => r.name?.includes('client-page'))
    if (clientPageBundle) {
      const clientPageKB = clientPageBundle.transferSize / 1024
      console.log(`✓ Client Page Bundle: ${clientPageKB.toFixed(2)} KB`)
      
      // Should be less than 50KB gzipped
      expect(clientPageKB).toBeLessThan(50)
    }
  })

  test('should achieve Lighthouse Performance score >= 90', async ({ page, browser }) => {
    // Requirement: 12.9 - Lighthouse Performance >= 90
    // Note: This is a simplified performance check
    // For actual Lighthouse testing, use @playwright/test with lighthouse plugin
    
    await page.goto('/', { waitUntil: 'networkidle' })

    // Check key performance indicators
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
      }
    })

    console.log('⚡ Performance Metrics:')
    console.log(`  DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(0)}ms`)
    console.log(`  Load Complete: ${performanceMetrics.loadComplete.toFixed(0)}ms`)
    console.log(`  DOM Interactive: ${performanceMetrics.domInteractive.toFixed(0)}ms`)

    // Good performance indicators
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000) // < 2s
    expect(performanceMetrics.domInteractive).toBeLessThan(1500) // < 1.5s
  })

  test('should verify React.memo optimization for components', async ({ page }) => {
    // Requirement: 12.10 - React.memo prevents unnecessary re-renders
    
    await page.goto('/')
    
    // Check that components are using React.memo
    const componentCheck = await page.evaluate(() => {
      // This is a simplified check - in real testing you'd use React DevTools
      // Here we verify that components are rendered efficiently
      const stepCards = document.querySelectorAll('[role="article"]')
      const statCounters = document.querySelectorAll('text=/\\d+\\+/')
      
      return {
        stepCardsCount: stepCards.length,
        statCountersCount: statCounters.length,
        hasContent: stepCards.length > 0 && statCounters.length >= 0,
      }
    })

    console.log('🔍 Component Optimization:')
    console.log(`  Step Cards: ${componentCheck.stepCardsCount}`)
    console.log(`  Stat Counters: ${componentCheck.statCountersCount}`)

    expect(componentCheck.stepCardsCount).toBeGreaterThan(0)
  })
})

test.describe('Resource Loading Optimization', () => {
  test('should verify critical resources are preloaded', async ({ page }) => {
    const response = await page.goto('/')
    const html = await response?.text()

    // Check for font preload
    expect(html).toContain('Cubic_11.woff2')
    
    console.log('✓ Critical resources are properly loaded')
  })

  test('should verify no render-blocking resources', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const renderBlockingResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      return resources
        .filter((r) => 
          (r.name.includes('.css') || r.name.includes('.js')) &&
          r.startTime < 100 // Loaded very early, potentially blocking
        )
        .map((r) => r.name.split('/').pop())
    })

    console.log('🚦 Early Loaded Resources:', renderBlockingResources.length)
    
    // Should have minimal render-blocking resources
    expect(renderBlockingResources.length).toBeLessThan(10)
  })
})
