import { test, expect, devices, Page } from '@playwright/test'

// Test mobile gestures and touch interactions
test.describe('Mobile Gestures', () => {
  test.use({
    ...devices['iPhone 13'],
    hasTouch: true
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/mobile-demo')
    await page.waitForLoadState('networkidle')
  })

  test('should detect touch device capabilities', async ({ page }) => {
    // Check if touch device is detected
    const deviceInfo = await page.locator('[data-testid="device-info"]').first()
    await expect(deviceInfo).toContainText('觸控設備: 是')
  })

  test('should handle tap gestures on cards', async ({ page }) => {
    await page.tap('[data-testid="mobile-tarot-card"]')

    // Check if card responds to tap
    const cardState = await page.locator('[data-testid="card-state"]')
    await expect(cardState).toHaveAttribute('data-state', 'revealed')
  })

  test('should handle long press gestures', async ({ page }) => {
    // Simulate long press (touch and hold for 800ms)
    await page.locator('[data-testid="mobile-tarot-card"]').dispatchEvent('touchstart')
    await page.waitForTimeout(800)
    await page.locator('[data-testid="mobile-tarot-card"]').dispatchEvent('touchend')

    // Check if long press action was triggered
    const longPressIndicator = await page.locator('[data-testid="long-press-action"]')
    await expect(longPressIndicator).toBeVisible()
  })

  test('should handle swipe gestures', async ({ page }) => {
    // Navigate to cards demo
    await page.tap('text=卡牌')

    const card = page.locator('[data-testid="mobile-tarot-card"]').first()

    // Simulate swipe right
    await card.dispatchEvent('touchstart', { touches: [{ clientX: 100, clientY: 200 }] })
    await card.dispatchEvent('touchmove', { touches: [{ clientX: 200, clientY: 200 }] })
    await card.dispatchEvent('touchend', { changedTouches: [{ clientX: 200, clientY: 200 }] })

    // Check if swipe was handled
    const swipeIndicator = await page.locator('[data-testid="swipe-action"]')
    await expect(swipeIndicator).toHaveAttribute('data-direction', 'right')
  })

  test('should handle pinch-to-zoom in fullscreen mode', async ({ page }) => {
    // Open fullscreen reading
    await page.tap('text=體驗全螢幕閱讀')

    // Wait for fullscreen mode
    await expect(page.locator('[data-testid="mobile-reading-interface"]')).toBeVisible()

    // Simulate pinch gesture
    await page.dispatchEvent('touchstart', {
      touches: [
        { clientX: 100, clientY: 200 },
        { clientX: 200, clientY: 300 }
      ]
    })

    await page.dispatchEvent('touchmove', {
      touches: [
        { clientX: 80, clientY: 180 },
        { clientX: 220, clientY: 320 }
      ]
    })

    await page.dispatchEvent('touchend', {
      changedTouches: [
        { clientX: 80, clientY: 180 },
        { clientX: 220, clientY: 320 }
      ]
    })

    // Check if zoom was applied
    const zoomedCard = await page.locator('[data-testid="zoomed-card"]')
    await expect(zoomedCard).toHaveCSS('transform', /scale\([^1]\)/)
  })

  test('should provide haptic feedback', async ({ page }) => {
    // Mock vibration API
    await page.addInitScript(() => {
      let vibrationCalls: number[][] = []
      ;(window.navigator as any).vibrate = (pattern: number | number[]) => {
        vibrationCalls.push(Array.isArray(pattern) ? pattern : [pattern])
        return true
      }
      ;(window as any).getVibrationCalls = () => vibrationCalls
    })

    // Trigger haptic feedback
    await page.tap('[data-testid="mobile-tarot-card"]')

    // Check if vibration was called
    const vibrationCalls = await page.evaluate(() => (window as any).getVibrationCalls())
    expect(vibrationCalls.length).toBeGreaterThan(0)
  })

  test('should handle double tap gestures', async ({ page }) => {
    const card = page.locator('[data-testid="mobile-tarot-card"]').first()

    // Simulate double tap
    await card.tap()
    await page.waitForTimeout(100) // Short delay between taps
    await card.tap()

    // Check if double tap was handled
    const doubleTapIndicator = await page.locator('[data-testid="double-tap-action"]')
    await expect(doubleTapIndicator).toBeVisible()
  })

  test('should prevent default browser behaviors', async ({ page }) => {
    // Check that default touch behaviors are prevented
    const preventDefaultScript = await page.evaluate(() => {
      const card = document.querySelector('[data-testid="mobile-tarot-card"]')
      return card ? card.style.touchAction : null
    })

    expect(preventDefaultScript).toContain('manipulation')
  })
})

test.describe('Mobile Responsive Design', () => {
  const devices_to_test = [
    { name: 'iPhone 13', device: devices['iPhone 13'] },
    { name: 'iPhone 13 Pro Max', device: devices['iPhone 13 Pro Max'] },
    { name: 'Samsung Galaxy S21', device: devices['Galaxy S21'] },
    { name: 'iPad Pro', device: devices['iPad Pro'] },
    { name: 'iPad Mini', device: devices['iPad Mini'] }
  ]

  devices_to_test.forEach(({ name, device }) => {
    test(`should display correctly on ${name}`, async ({ browser }) => {
      const context = await browser.newContext({ ...device })
      const page = await context.newPage()

      await page.goto('/mobile-demo')
      await page.waitForLoadState('networkidle')

      // Take screenshot for visual regression testing
      await page.screenshot({ path: `tests/screenshots/mobile-${name.toLowerCase().replace(/\s+/g, '-')}.png` })

      // Check if mobile layout is active
      const container = await page.locator('.mobile-layout')
      await expect(container).toBeVisible()

      // Check if touch targets meet minimum size requirements
      const touchTargets = await page.locator('[role="button"], button, a')
      const count = await touchTargets.count()

      for (let i = 0; i < Math.min(count, 10); i++) {
        const element = touchTargets.nth(i)
        const box = await element.boundingBox()

        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44) // WCAG AA standard
          expect(box.height).toBeGreaterThanOrEqual(44)
        }
      }

      await context.close()
    })
  })
})

test.describe('Mobile Navigation', () => {
  test.use({
    ...devices['iPhone 13'],
    hasTouch: true
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/mobile-demo')
    await page.waitForLoadState('networkidle')
  })

  test('should show/hide navigation on scroll', async ({ page }) => {
    const navigation = page.locator('[data-testid="mobile-navigation"]')

    // Initially visible
    await expect(navigation).toBeVisible()

    // Scroll down
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(500)

    // Navigation should be hidden
    await expect(navigation).toHaveCSS('transform', /translateY\(100%\)/)

    // Scroll up
    await page.mouse.wheel(0, -500)
    await page.waitForTimeout(500)

    // Navigation should be visible again
    await expect(navigation).toHaveCSS('transform', /translateY\(0(px|%)\)/)
  })

  test('should handle bottom tab navigation', async ({ page }) => {
    // Test tab switching
    await page.tap('text=占卜')
    await expect(page.locator('[data-current-tab="reading"]')).toBeVisible()

    await page.tap('text=牌陣')
    await expect(page.locator('[data-current-tab="spreads"]')).toBeVisible()

    await page.tap('text=導航')
    await expect(page.locator('[data-current-tab="navigation"]')).toBeVisible()
  })

  test('should support pull-to-refresh', async ({ page }) => {
    // Mock refresh function
    let refreshCalled = false
    await page.exposeFunction('mockRefresh', () => {
      refreshCalled = true
    })

    // Simulate pull-to-refresh gesture
    await page.dispatchEvent('touchstart', { touches: [{ clientX: 200, clientY: 50 }] })
    await page.dispatchEvent('touchmove', { touches: [{ clientX: 200, clientY: 150 }] })
    await page.dispatchEvent('touchend', { changedTouches: [{ clientX: 200, clientY: 150 }] })

    // Wait for refresh to be triggered
    await page.waitForTimeout(1000)

    // Check if refresh was called (this would be implementation specific)
    const refreshIndicator = await page.locator('[data-testid="refresh-indicator"]')
    await expect(refreshIndicator).toBeVisible()
  })
})

test.describe('Mobile Accessibility', () => {
  test.use({
    ...devices['iPhone 13'],
    hasTouch: true
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/mobile-demo')
    await page.waitForLoadState('networkidle')
  })

  test('should have proper ARIA attributes', async ({ page }) => {
    const cards = await page.locator('[data-testid="mobile-tarot-card"]')
    const firstCard = cards.first()

    // Check for required ARIA attributes
    await expect(firstCard).toHaveAttribute('role', 'button')
    await expect(firstCard).toHaveAttribute('tabindex', '0')
    await expect(firstCard).toHaveAttribute('aria-label')
  })

  test('should support keyboard navigation', async ({ page }) => {
    // Focus on first interactive element
    await page.keyboard.press('Tab')

    const focusedElement = await page.locator(':focus')
    await expect(focusedElement).toBeVisible()

    // Navigate with arrow keys
    await page.keyboard.press('ArrowRight')
    const nextFocusedElement = await page.locator(':focus')
    expect(await nextFocusedElement.textContent()).not.toBe(await focusedElement.textContent())
  })

  test('should announce state changes to screen readers', async ({ page }) => {
    // Mock screen reader announcements
    let announcements: string[] = []
    await page.addInitScript(() => {
      const originalSpeak = window.speechSynthesis.speak
      window.speechSynthesis.speak = function(utterance) {
        ;(window as any).announcements = (window as any).announcements || []
        ;(window as any).announcements.push(utterance.text)
      }
    })

    // Trigger an action that should create an announcement
    await page.tap('[data-testid="mobile-tarot-card"]')

    // Check if announcement was made
    const announcements_made = await page.evaluate(() => (window as any).announcements || [])
    expect(announcements_made.length).toBeGreaterThan(0)
  })

  test('should support high contrast mode', async ({ page }) => {
    // Enable high contrast mode
    await page.addInitScript(() => {
      document.documentElement.classList.add('high-contrast')
    })

    await page.reload()

    // Check if high contrast styles are applied
    const body = await page.locator('body')
    const computedStyle = await body.evaluate((el) => {
      return window.getComputedStyle(el).filter
    })

    expect(computedStyle).toContain('contrast')
  })

  test('should support reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })

    await page.reload()

    // Check if reduced motion is respected
    const animatedElement = await page.locator('.animate-card-flip')
    const animationDuration = await animatedElement.evaluate((el) => {
      return window.getComputedStyle(el).animationDuration
    })

    expect(parseFloat(animationDuration)).toBeLessThan(0.1) // Should be very short or 0
  })
})

test.describe('Mobile Performance', () => {
  test.use({
    ...devices['iPhone 13'],
    hasTouch: true
  })

  test('should load within performance budget', async ({ page }) => {
    const start = Date.now()
    await page.goto('/mobile-demo')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - start

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should maintain good FPS during animations', async ({ page }) => {
    await page.goto('/mobile-demo')

    // Monitor FPS during animation
    const fps = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frames = 0
        const start = performance.now()

        function frame() {
          frames++
          if (performance.now() - start < 1000) {
            requestAnimationFrame(frame)
          } else {
            resolve(frames)
          }
        }

        requestAnimationFrame(frame)
      })
    })

    // Should maintain at least 30 FPS
    expect(fps).toBeGreaterThan(30)
  })

  test('should optimize for low performance devices', async ({ page }) => {
    // Simulate low performance device
    await page.addInitScript(() => {
      // Mock performance.memory
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 50 * 1024 * 1024, // 50MB
          totalJSHeapSize: 60 * 1024 * 1024, // 60MB (high usage ratio)
          jsHeapSizeLimit: 100 * 1024 * 1024
        }
      })

      // Mock slow connection
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g'
        }
      })
    })

    await page.goto('/mobile-demo')
    await page.waitForLoadState('networkidle')

    // Check if low performance mode is activated
    const performanceIndicator = await page.locator('[data-testid="low-performance-mode"]')
    await expect(performanceIndicator).toBeVisible()

    // Check if animations are simplified
    const qualityLevel = await page.evaluate(() => {
      return (window as any).adaptiveQuality?.level
    })
    expect(qualityLevel).toBe('low')
  })
})

test.describe('Mobile Error Handling', () => {
  test.use({
    ...devices['iPhone 13'],
    hasTouch: true
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/*', route => route.abort())

    await page.goto('/mobile-demo')

    // Should show appropriate error message
    const errorMessage = await page.locator('[data-testid="network-error"]')
    await expect(errorMessage).toBeVisible()
  })

  test('should handle touch gesture failures', async ({ page }) => {
    await page.goto('/mobile-demo')

    // Try to perform gesture on non-interactive element
    await page.dispatchEvent('div', 'touchstart')
    await page.dispatchEvent('div', 'touchend')

    // Should not crash and should provide feedback
    const errorHandler = await page.evaluate(() => {
      return (window as any).gestureErrorCount || 0
    })

    expect(errorHandler).toBeLessThan(5) // Should handle errors gracefully
  })
})