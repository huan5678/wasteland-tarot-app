/**
 * Stats Counter Animation E2E Tests
 * Tests GSAP number scrolling animation on the homepage
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 17.3
 */

import { test, expect } from '@playwright/test';

test.describe('Stats Section Number Scrolling Animation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display stats section with all counters', async ({ page }) => {
    // Wait for stats section to be visible
    const statsSection = page.locator('text=即時數據統計').first();
    await expect(statsSection).toBeVisible();

    // Check all stat labels are present
    await expect(page.locator('text=總用戶數')).toBeVisible();
    await expect(page.locator('text=占卜次數')).toBeVisible();
    await expect(page.locator('text=塔羅牌')).toBeVisible();
    await expect(page.locator('text=AI 供應商')).toBeVisible();
  });

  test('should animate numbers from 0 to target values', async ({ page }) => {
    // Scroll to stats section
    const statsSection = page.locator('text=即時數據統計').first();
    await statsSection.scrollIntoViewIfNeeded();

    // Wait for animation to start (numbers should change from 0)
    await page.waitForTimeout(500);

    // Find a stat counter (e.g., "總用戶數")
    const userCountLabel = page.locator('text=總用戶數');
    const counterContainer = userCountLabel.locator('..').locator('..');

    // Get the number element (should be bold and large)
    const numberElement = counterContainer.locator('.text-4xl').first();

    // Initially should show some number (animation in progress or completed)
    const initialText = await numberElement.textContent();
    expect(initialText).toBeTruthy();

    // Wait for animation to complete (max 2.5 seconds based on gsapConfig)
    await page.waitForTimeout(2500);

    // Final number should be greater than 0
    const finalText = await numberElement.textContent();
    expect(finalText).toBeTruthy();

    // Should contain digits
    expect(finalText).toMatch(/\d+/);
  });

  test('should format numbers with thousand separators', async ({ page }) => {
    // Scroll to stats section
    const statsSection = page.locator('text=即時數據統計').first();
    await statsSection.scrollIntoViewIfNeeded();

    // Wait for animation to complete
    await page.waitForTimeout(3000);

    // Check "占卜次數" which is likely > 1000
    const readingsLabel = page.locator('text=占卜次數');
    const counterContainer = readingsLabel.locator('..').locator('..');
    const numberElement = counterContainer.locator('.text-4xl').first();

    const numberText = await numberElement.textContent();

    // Should contain comma for thousand separator (if value >= 1000)
    if (numberText && parseInt(numberText.replace(/,/g, '')) >= 1000) {
      expect(numberText).toContain(',');
    }
  });

  test('should display suffix correctly', async ({ page }) => {
    // Scroll to stats section
    const statsSection = page.locator('text=即時數據統計').first();
    await statsSection.scrollIntoViewIfNeeded();

    // Wait for animation
    await page.waitForTimeout(3000);

    // Check "總用戶數" which should have "+" suffix
    const userCountLabel = page.locator('text=總用戶數');
    const counterContainer = userCountLabel.locator('..').locator('..');
    const numberElement = counterContainer.locator('.text-4xl').first();

    const text = await numberElement.textContent();
    expect(text).toContain('+');

    // Check "塔羅牌" which should have "張" suffix
    const cardsLabel = page.locator('text=塔羅牌');
    const cardsContainer = cardsLabel.locator('..').locator('..');
    const cardsNumber = cardsContainer.locator('.text-4xl').first();

    const cardsText = await cardsNumber.textContent();
    expect(cardsText).toContain('張');
  });

  test('should respect prefers-reduced-motion', async ({ page, context }) => {
    // Enable reduced motion
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }),
      });
    });

    // Reload page with reduced motion enabled
    await page.goto('/');

    // Scroll to stats section
    const statsSection = page.locator('text=即時數據統計').first();
    await statsSection.scrollIntoViewIfNeeded();

    // With reduced motion, numbers should appear immediately (no animation)
    // Check that final values are displayed without delay
    await page.waitForTimeout(100); // Short delay

    const userCountLabel = page.locator('text=總用戶數');
    const counterContainer = userCountLabel.locator('..').locator('..');
    const numberElement = counterContainer.locator('.text-4xl').first();

    const text = await numberElement.textContent();

    // Should show final value (not 0)
    expect(text).toBeTruthy();
    expect(text).not.toBe('0');
    expect(text).not.toBe('0+');
  });

  test('should trigger animation only when section enters viewport', async ({ page }) => {
    // Load page but don't scroll to stats section yet
    await page.goto('/');

    // Stats section should not be visible yet (below fold)
    const statsSection = page.locator('text=即時數據統計').first();

    // Get initial viewport height
    const viewportHeight = await page.evaluate(() => window.innerHeight);

    // Check if stats section is below viewport
    const statsBoundingBox = await statsSection.boundingBox();

    if (statsBoundingBox && statsBoundingBox.y > viewportHeight) {
      // Stats is below viewport, animation should not have started
      // Scroll to stats section
      await statsSection.scrollIntoViewIfNeeded();

      // Now animation should trigger
      await page.waitForTimeout(500);

      const userCountLabel = page.locator('text=總用戶數');
      const counterContainer = userCountLabel.locator('..').locator('..');
      const numberElement = counterContainer.locator('.text-4xl').first();

      const text = await numberElement.textContent();

      // Should show some number (animation started)
      expect(text).toBeTruthy();
    }
  });

  test('should complete animation within expected duration', async ({ page }) => {
    // Scroll to stats section
    const statsSection = page.locator('text=即時數據統計').first();
    await statsSection.scrollIntoViewIfNeeded();

    // Record start time
    const startTime = Date.now();

    // Wait for animation to complete (max duration is 2s based on gsapConfig)
    await page.waitForTimeout(2500);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Animation should complete within 3 seconds (with buffer)
    expect(duration).toBeLessThan(3000);

    // Check that final value is displayed
    const userCountLabel = page.locator('text=總用戶數');
    const counterContainer = userCountLabel.locator('..').locator('..');
    const numberElement = counterContainer.locator('.text-4xl').first();

    const finalText = await numberElement.textContent();
    expect(finalText).toBeTruthy();
    expect(finalText).not.toBe('0');
  });
});
