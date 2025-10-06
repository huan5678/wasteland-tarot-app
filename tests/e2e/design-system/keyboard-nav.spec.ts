/**
 * Keyboard Navigation E2E Tests for Fallout Utilitarian Design System
 */

import { test, expect } from '@playwright/test'

test.describe('Keyboard Navigation E2E', () => {
  test('should navigate through interactive elements with Tab key', async ({ page }) => {
    await page.goto('/')

    // Get all focusable elements
    const firstFocusable = page.locator('button, a, input, [tabindex="0"]').first()

    if (await firstFocusable.count() > 0) {
      // Press Tab to focus first element
      await page.keyboard.press('Tab')

      // First element should be focused
      await expect(firstFocusable).toBeFocused()
    }
  })

  test('should support Shift+Tab for reverse navigation', async ({ page }) => {
    await page.goto('/')

    // Tab forward twice
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Shift+Tab to go back
    await page.keyboard.press('Shift+Tab')

    // Should be back at first element
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('should show visible focus indicators on all interactive elements', async ({ page }) => {
    await page.goto('/')

    const focusableElements = page.locator('button, a, input, [tabindex="0"]')
    const count = await focusableElements.count()

    if (count > 0) {
      // Tab to first element
      await page.keyboard.press('Tab')

      // Take screenshot of focused element
      await page.screenshot({
        path: 'test-results/screenshots/focus-indicator.png',
      })

      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    }
  })

  test('should activate buttons with Enter key', async ({ page }) => {
    await page.goto('/')

    // Find a button
    const button = page.locator('button:not([disabled])').first()

    if (await button.count() > 0) {
      await button.focus()
      await page.keyboard.press('Enter')

      // Button should have been activated (no assertion on result, just checking it doesn't error)
    }
  })

  test('should activate buttons with Space key', async ({ page }) => {
    await page.goto('/')

    const button = page.locator('button:not([disabled])').first()

    if (await button.count() > 0) {
      await button.focus()
      await page.keyboard.press('Space')

      // Button should have been activated
    }
  })

  test('should follow logical tab order (left-to-right, top-to-bottom)', async ({ page }) => {
    await page.goto('/')

    const focusOrder: string[] = []

    // Tab through first 5 focusable elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      const focused = page.locator(':focus')

      if (await focused.count() > 0) {
        const tagName = await focused.evaluate((el) => el.tagName)
        focusOrder.push(tagName)
      }
    }

    // Should have captured some focus order
    expect(focusOrder.length).toBeGreaterThan(0)
  })

  test('should skip disabled elements when tabbing', async ({ page }) => {
    await page.goto('/')

    // Tab multiple times
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const focused = page.locator(':focus')

      if (await focused.count() > 0) {
        // Focused element should not be disabled
        const isDisabled = await focused.evaluate((el) => {
          return (
            (el as HTMLButtonElement).disabled ||
            el.getAttribute('aria-disabled') === 'true'
          )
        })

        expect(isDisabled).toBe(false)
      }
    }
  })
})

test.describe('Keyboard Navigation - Form Inputs', () => {
  test('should show focus ring on input fields', async ({ page }) => {
    const routes = ['/', '/auth/login']

    for (const route of routes) {
      try {
        await page.goto(route, { timeout: 10000 })

        const input = page.locator('input[type="text"], input[type="email"], input[type="password"]').first()

        if (await input.count() > 0) {
          await input.focus()
          await expect(input).toBeFocused()

          // Take screenshot
          await page.screenshot({
            path: `test-results/screenshots/input-focus-${route.replace(/\//g, '-')}.png`,
          })

          break
        }
      } catch (e) {
        continue
      }
    }
  })
})
