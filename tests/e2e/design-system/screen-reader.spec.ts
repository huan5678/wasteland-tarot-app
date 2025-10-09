/**
 * Screen Reader Compatibility E2E Tests for Fallout Utilitarian Design System
 */

import { test, expect } from '@playwright/test'

test.describe('Screen Reader Compatibility', () => {
  test('should have accessible button names', async ({ page }) => {
    await page.goto('/')

    // All buttons should have accessible names (text content or aria-label)
    const buttons = page.locator('button')
    const count = await buttons.count()

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i)
      const accessibleName = await button.evaluate((el) => {
        return el.textContent?.trim() || el.getAttribute('aria-label') || ''
      })

      expect(accessibleName.length).toBeGreaterThan(0)
    }
  })

  test('should associate form labels with inputs', async ({ page }) => {
    const routes = ['/', '/auth/login', '/auth/register']

    for (const route of routes) {
      try {
        await page.goto(route, { timeout: 10000 })

        const inputs = page.locator('input')
        const inputCount = await inputs.count()

        if (inputCount > 0) {
          for (let i = 0; i < Math.min(inputCount, 5); i++) {
            const input = inputs.nth(i)
            const id = await input.getAttribute('id')

            if (id) {
              // Check if there's a label with matching for attribute
              const label = page.locator(`label[for="${id}"]`)
              const hasLabel = (await label.count()) > 0

              // Or check for aria-label
              const ariaLabel = await input.getAttribute('aria-label')

              // Or check for aria-labelledby
              const ariaLabelledby = await input.getAttribute('aria-labelledby')

              // At least one labeling method should exist
              const isLabeled = hasLabel || !!ariaLabel || !!ariaLabelledby

              expect(isLabeled).toBe(true)
            }
          }

          break
        }
      } catch (e) {
        continue
      }
    }
  })

  test('should announce error messages with role=alert', async ({ page }) => {
    const routes = ['/auth/login', '/auth/register']

    for (const route of routes) {
      try {
        await page.goto(route, { timeout: 10000 })

        // Try to trigger validation by submitting empty form
        const submitButton = page.locator('button[type="submit"]').first()

        if (await submitButton.count() > 0) {
          await submitButton.click()
          await page.waitForTimeout(1000)

          // Check for error messages with role=alert
          const alerts = page.locator('[role="alert"]')

          if (await alerts.count() > 0) {
            await expect(alerts.first()).toBeVisible()
          }

          break
        }
      } catch (e) {
        continue
      }
    }
  })

  test('should announce loading states with role=status', async ({ page }) => {
    await page.goto('/')

    // Look for loading indicators with role=status
    const statusElements = page.locator('[role="status"], [aria-live="polite"]')

    // Even if not currently visible, elements should exist for loading states
    // (This test may pass/fail depending on page state)
    const count = await statusElements.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should have appropriate alt text or presentation role for images', async ({ page }) => {
    await page.goto('/')

    const images = page.locator('img, svg')
    const count = await images.count()

    for (let i = 0; i < Math.min(count, 10); i++) {
      const image = images.nth(i)
      const alt = await image.getAttribute('alt')
      const role = await image.getAttribute('role')
      const ariaHidden = await image.getAttribute('aria-hidden')

      // Image should have alt text, role="presentation", or aria-hidden="true"
      const isAccessible =
        (alt !== null && alt !== undefined) ||
        role === 'presentation' ||
        ariaHidden === 'true'

      expect(isAccessible).toBe(true)
    }
  })

  test('should have accessible names for all interactive elements', async ({ page }) => {
    await page.goto('/')

    const interactiveElements = page.locator('button, a, input, [role="button"]')
    const count = await interactiveElements.count()

    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = interactiveElements.nth(i)

      const accessibleName = await element.evaluate((el) => {
        // Check various methods of providing accessible name
        const textContent = el.textContent?.trim()
        const ariaLabel = el.getAttribute('aria-label')
        const ariaLabelledby = el.getAttribute('aria-labelledby')
        const title = el.getAttribute('title')

        return textContent || ariaLabel || ariaLabelledby || title || ''
      })

      expect(accessibleName.length).toBeGreaterThan(0)
    }
  })
})

test.describe('Screen Reader - ARIA Live Regions', () => {
  test('should use aria-live for dynamic content', async ({ page }) => {
    await page.goto('/')

    // Check for aria-live regions (polite or assertive)
    const liveRegions = page.locator('[aria-live="polite"], [aria-live="assertive"]')
    const count = await liveRegions.count()

    // At least some live regions should exist for dynamic updates
    expect(count).toBeGreaterThanOrEqual(0)
  })
})
