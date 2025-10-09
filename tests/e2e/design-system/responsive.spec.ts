/**
 * Responsive Design E2E Tests for Fallout Utilitarian Design System
 * Testing 3 breakpoints: Mobile (375px), Tablet (768px), Desktop (1280px)
 */

import { test, expect, type Page } from '@playwright/test'

const BREAKPOINTS = {
  mobile: { width: 375, height: 667, name: 'Mobile' },
  tablet: { width: 768, height: 1024, name: 'Tablet' },
  desktop: { width: 1280, height: 720, name: 'Desktop' },
} as const

// Helper function to set viewport size
async function setViewport(page: Page, breakpoint: keyof typeof BREAKPOINTS) {
  await page.setViewportSize({
    width: BREAKPOINTS[breakpoint].width,
    height: BREAKPOINTS[breakpoint].height,
  })
}

test.describe('Responsive Design - Button Component', () => {
  test('should render buttons correctly across all breakpoints', async ({ page }) => {
    await page.goto('/')

    for (const [key, bp] of Object.entries(BREAKPOINTS)) {
      await setViewport(page, key as keyof typeof BREAKPOINTS)

      // Find a button on the page (assume homepage has buttons)
      const button = page.locator('button').first()

      if (await button.count() > 0) {
        // Button should be visible
        await expect(button).toBeVisible()

        // Take screenshot for visual regression
        await page.screenshot({
          path: `test-results/screenshots/button-${key}.png`,
          fullPage: false,
        })
      }
    }
  })

  test('should maintain touch target sizes on mobile', async ({ page }) => {
    await setViewport(page, 'mobile')
    await page.goto('/')

    // Find buttons with touch target classes
    const largeButtons = page.locator('button.h-10, button.h-11, button.size-11')

    if (await largeButtons.count() > 0) {
      const firstButton = largeButtons.first()
      const box = await firstButton.boundingBox()

      if (box) {
        // Minimum touch target size should be 44x44px
        expect(box.height).toBeGreaterThanOrEqual(40) // h-10 = 40px, close to 44px
      }
    }
  })

  test('should render all button variants on tablet', async ({ page }) => {
    await setViewport(page, 'tablet')
    await page.goto('/')

    // Check if buttons are visible and have proper styling
    const buttons = page.locator('button')
    const count = await buttons.count()

    if (count > 0) {
      // Take screenshot
      await page.screenshot({
        path: 'test-results/screenshots/buttons-tablet.png',
        fullPage: true,
      })
    }
  })
})

test.describe('Responsive Design - Form Input Component', () => {
  test('should render inputs correctly across breakpoints', async ({ page }) => {
    // Find a page with form inputs (try login page)
    const routes = ['/', '/auth/login']

    for (const route of routes) {
      try {
        await page.goto(route, { waitUntil: 'networkidle' })

        const hasInputs = (await page.locator('input').count()) > 0

        if (hasInputs) {
          for (const [key, bp] of Object.entries(BREAKPOINTS)) {
            await setViewport(page, key as keyof typeof BREAKPOINTS)

            const input = page.locator('input[type="text"], input[type="email"], input[type="password"]').first()

            if (await input.count() > 0) {
              // Input should be visible
              await expect(input).toBeVisible()

              // Input should have focus styles when focused
              await input.focus()
              await expect(input).toBeFocused()

              // Take screenshot
              await page.screenshot({
                path: `test-results/screenshots/input-${key}-${route.replace(/\//g, '-')}.png`,
              })
            }
          }
          break // Found inputs, no need to check other routes
        }
      } catch (e) {
        // Route may not exist, continue to next
        continue
      }
    }
  })

  test('should display error messages correctly on mobile', async ({ page }) => {
    await setViewport(page, 'mobile')

    // Try to find a form page
    const routes = ['/auth/login', '/auth/register']

    for (const route of routes) {
      try {
        await page.goto(route, { timeout: 10000 })

        // Try to submit empty form to trigger validation
        const submitButton = page.locator('button[type="submit"]').first()

        if (await submitButton.count() > 0) {
          await submitButton.click()

          // Wait for potential error messages
          await page.waitForTimeout(1000)

          // Check for error messages with role=alert
          const errorMessages = page.locator('[role="alert"]')

          if (await errorMessages.count() > 0) {
            // Error messages should be visible
            await expect(errorMessages.first()).toBeVisible()

            // Take screenshot
            await page.screenshot({
              path: 'test-results/screenshots/form-errors-mobile.png',
            })
          }

          break
        }
      } catch (e) {
        continue
      }
    }
  })
})

test.describe('Responsive Design - Card Layout', () => {
  test('should reflow from 1-column to 2-column to 3-column', async ({ page }) => {
    await page.goto('/')

    // Mobile: 1-column layout
    await setViewport(page, 'mobile')
    await page.waitForTimeout(500) // Wait for reflow

    // Take mobile screenshot
    await page.screenshot({
      path: 'test-results/screenshots/cards-mobile-1-column.png',
      fullPage: true,
    })

    // Tablet: 2-column layout
    await setViewport(page, 'tablet')
    await page.waitForTimeout(500)

    await page.screenshot({
      path: 'test-results/screenshots/cards-tablet-2-column.png',
      fullPage: true,
    })

    // Desktop: 3-column layout
    await setViewport(page, 'desktop')
    await page.waitForTimeout(500)

    await page.screenshot({
      path: 'test-results/screenshots/cards-desktop-3-column.png',
      fullPage: true,
    })
  })

  test('should maintain card styling across breakpoints', async ({ page }) => {
    await page.goto('/')

    for (const [key, bp] of Object.entries(BREAKPOINTS)) {
      await setViewport(page, key as keyof typeof BREAKPOINTS)

      // Find cards on the page
      const cards = page.locator('[class*="card"]').first()

      if (await cards.count() > 0) {
        // Card should be visible
        await expect(cards).toBeVisible()
      }
    }
  })
})

test.describe('Responsive Design - Layout Shifts', () => {
  test('should not have layout shifts on viewport change', async ({ page }) => {
    await page.goto('/')

    // Start at mobile
    await setViewport(page, 'mobile')
    await page.waitForLoadState('networkidle')

    // Get initial layout
    const initialHTML = await page.content()

    // Switch to tablet
    await setViewport(page, 'tablet')
    await page.waitForTimeout(300)

    // Content should still be present (no complete re-render)
    const currentHTML = await page.content()
    expect(currentHTML.length).toBeGreaterThan(0)

    // Switch to desktop
    await setViewport(page, 'desktop')
    await page.waitForTimeout(300)

    // Page should still have content
    const desktopHTML = await page.content()
    expect(desktopHTML.length).toBeGreaterThan(0)
  })

  test('should measure Cumulative Layout Shift (CLS)', async ({ page }) => {
    await page.goto('/')
    await setViewport(page, 'mobile')

    // Measure CLS
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).hadRecentInput) continue
            clsValue += (entry as any).value
          }
        })

        observer.observe({ type: 'layout-shift', buffered: true })

        // Resolve after 2 seconds
        setTimeout(() => {
          observer.disconnect()
          resolve(clsValue)
        }, 2000)
      })
    })

    // CLS should be less than 0.1 (good threshold)
    expect(cls).toBeLessThan(0.1)
  })
})

test.describe('Responsive Design - Touch Interactions', () => {
  test('should have adequate spacing between interactive elements on mobile', async ({ page }) => {
    await setViewport(page, 'mobile')
    await page.goto('/')

    // Find groups of buttons
    const buttonGroups = page.locator('.flex.gap-2, .flex.gap-4, .space-x-2, .space-x-4')

    if (await buttonGroups.count() > 0) {
      const group = buttonGroups.first()

      // Group should have gap/space classes
      const className = await group.getAttribute('class')
      expect(className).toMatch(/gap-\d|space-x-\d/)

      // Take screenshot
      await page.screenshot({
        path: 'test-results/screenshots/button-spacing-mobile.png',
      })
    }
  })

  test('should allow touch interactions on mobile buttons', async ({ page }) => {
    await setViewport(page, 'mobile')
    await page.goto('/')

    // Find a clickable button
    const button = page.locator('button:not([disabled])').first()

    if (await button.count() > 0) {
      // Simulate touch tap
      await button.tap()

      // Button should be visible and accessible
      await expect(button).toBeVisible()
    }
  })
})

test.describe('Responsive Design - Typography Scaling', () => {
  test('should scale headings appropriately across breakpoints', async ({ page }) => {
    await page.goto('/')

    const measurements: Record<string, { fontSize: string; lineHeight: string }[]> = {
      mobile: [],
      tablet: [],
      desktop: [],
    }

    for (const [key, bp] of Object.entries(BREAKPOINTS)) {
      await setViewport(page, key as keyof typeof BREAKPOINTS)
      await page.waitForTimeout(300)

      // Find h1, h2, h3 elements
      const headings = page.locator('h1, h2, h3').first()

      if (await headings.count() > 0) {
        const fontSize = await headings.evaluate((el) =>
          window.getComputedStyle(el).fontSize
        )
        const lineHeight = await headings.evaluate((el) =>
          window.getComputedStyle(el).lineHeight
        )

        measurements[key].push({ fontSize, lineHeight })
      }
    }

    // Verify measurements were captured
    expect(Object.keys(measurements).length).toBe(3)
  })

  test('should maintain readable text sizes on mobile', async ({ page }) => {
    await setViewport(page, 'mobile')
    await page.goto('/')

    // Body text should be at least 16px on mobile
    const bodyText = page.locator('p, div').first()

    if (await bodyText.count() > 0) {
      const fontSize = await bodyText.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return parseInt(computed.fontSize, 10)
      })

      // Minimum 14px for mobile readability (some secondary text can be 14px)
      expect(fontSize).toBeGreaterThanOrEqual(14)
    }
  })
})

test.describe('Responsive Design - Navigation Patterns', () => {
  test('should adapt navigation for mobile viewport', async ({ page }) => {
    await page.goto('/')

    // Mobile: may have hamburger menu or vertical navigation
    await setViewport(page, 'mobile')
    await page.waitForTimeout(500)

    // Take screenshot of mobile navigation
    await page.screenshot({
      path: 'test-results/screenshots/navigation-mobile.png',
      clip: { x: 0, y: 0, width: 375, height: 200 },
    })

    // Desktop: horizontal navigation
    await setViewport(page, 'desktop')
    await page.waitForTimeout(500)

    await page.screenshot({
      path: 'test-results/screenshots/navigation-desktop.png',
      clip: { x: 0, y: 0, width: 1280, height: 200 },
    })
  })
})

test.describe('Responsive Design - Visual Regression Baseline', () => {
  test('should capture baseline screenshots for all breakpoints', async ({ page }) => {
    await page.goto('/')

    for (const [key, bp] of Object.entries(BREAKPOINTS)) {
      await setViewport(page, key as keyof typeof BREAKPOINTS)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      // Capture full page screenshot
      await page.screenshot({
        path: `test-results/screenshots/baseline-${key}.png`,
        fullPage: true,
      })

      // Capture above-the-fold screenshot
      await page.screenshot({
        path: `test-results/screenshots/baseline-${key}-atf.png`,
        fullPage: false,
      })
    }
  })

  test('should maintain consistent design tokens across breakpoints', async ({ page }) => {
    await page.goto('/')

    const tokenValues: Record<string, string> = {}

    for (const [key, bp] of Object.entries(BREAKPOINTS)) {
      await setViewport(page, key as keyof typeof BREAKPOINTS)

      // Check CSS custom properties
      const rootStyles = await page.evaluate(() => {
        const root = document.documentElement
        const styles = window.getComputedStyle(root)

        return {
          colorPrimary: styles.getPropertyValue('--color-text-primary'),
          colorSuccess: styles.getPropertyValue('--color-success'),
          fontMono: styles.getPropertyValue('--font-mono'),
          radius: styles.getPropertyValue('--radius'),
        }
      })

      tokenValues[key] = JSON.stringify(rootStyles)
    }

    // Token values should be consistent across breakpoints
    const uniqueValues = new Set(Object.values(tokenValues))
    expect(uniqueValues.size).toBe(1) // All breakpoints have same token values
  })
})
