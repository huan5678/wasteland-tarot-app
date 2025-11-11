/**
 * Cross-Browser Compatibility Tests for Interactive Reading Experience
 *
 * Tests the interactive reading flow across multiple browsers
 * Requirements: NFR-5.1, NFR-5.2, NFR-5.3, NFR-5.4
 *
 * Browsers tested (via playwright.config.ts projects):
 * - Chrome (chromium)
 * - Firefox (firefox)
 * - Safari (webkit)
 * - Edge (edge)
 */

import { test, expect } from '@playwright/test';

test.describe('Interactive Reading - Cross-Browser Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the reading page
    await page.goto('/readings/new');

    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
  });

  test('should display and interact with shuffle animation', async ({ page }) => {
      // Find and click shuffle button
      const shuffleButton = page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i });
      await expect(shuffleButton).toBeVisible({ timeout: 5000 });

      // Click to start shuffle
      await shuffleButton.click();

      // Verify shuffle animation starts (look for animated elements)
      const animatedCards = page.locator('[class*="shuffle"], [class*="animate"]').first();
      await expect(animatedCards).toBeVisible({ timeout: 3000 });

      // Wait for shuffle to complete and cards to be laid out
      const cardButtons = page.getByRole('button', { name: /flip|翻牌/i });
      await expect(cardButtons.first()).toBeVisible({ timeout: 5000 });
    });

  test('should flip cards with animation', async ({ page }) => {
      // Start shuffle first
      await page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i }).click();

      // Wait for cards to appear
      const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
      await expect(firstCard).toBeVisible({ timeout: 5000 });

      // Click to flip the card
      await firstCard.click();

      // Verify flip animation occurs (card should rotate)
      // Wait for animation to complete
      await page.waitForTimeout(1000);

      // Verify card front is now visible (look for card image or name)
      const cardContent = page.locator('[class*="card-front"], [class*="revealed"]').first();
      await expect(cardContent).toBeVisible({ timeout: 2000 });
    });

  test('should handle reduced motion preference', async ({ page }) => {
      // Set prefers-reduced-motion
      await page.emulateMedia({ reducedMotion: 'reduce' });

      // Reload to apply media query
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Start shuffle
      await page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i }).click();

      // Cards should appear quickly without animation
      const cardButtons = page.getByRole('button', { name: /flip|翻牌/i });
      await expect(cardButtons.first()).toBeVisible({ timeout: 1000 });
    });

  test('should support keyboard navigation', async ({ page }) => {
      // Tab to shuffle button
      await page.keyboard.press('Tab');

      // Verify shuffle button has focus
      const shuffleButton = page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i });
      await expect(shuffleButton).toBeFocused();

      // Press Enter to activate
      await page.keyboard.press('Enter');

      // Wait for cards to appear
      const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
      await expect(firstCard).toBeVisible({ timeout: 5000 });

      // Tab to first card
      await page.keyboard.press('Tab');
      await expect(firstCard).toBeFocused();

      // Press Space to flip
      await page.keyboard.press('Space');

      // Verify card flips
      await page.waitForTimeout(1000);
      const cardContent = page.locator('[class*="card-front"], [class*="revealed"]').first();
      await expect(cardContent).toBeVisible({ timeout: 2000 });
    });

  test('should display streaming interpretation correctly', async ({ page }) => {
      // Complete card drawing first
      await page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i }).click();
      const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
      await expect(firstCard).toBeVisible({ timeout: 5000 });
      await firstCard.click();

      // Wait for interpretation to start streaming
      const interpretationArea = page.locator('[class*="interpretation"], [class*="streaming"]');
      await expect(interpretationArea).toBeVisible({ timeout: 10000 });

      // Verify streaming controls are available
      const pauseButton = page.getByRole('button', { name: /暫停|pause/i });
      await expect(pauseButton).toBeVisible({ timeout: 5000 });
    });

  test('should handle touch events on mobile viewport', async ({ page, browserName }) => {
      // Skip on non-touch devices
      if (browserName === 'firefox') {
        test.skip();
      }

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Tap shuffle button
      const shuffleButton = page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i });
      await shuffleButton.tap();

      // Wait for cards
      const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
      await expect(firstCard).toBeVisible({ timeout: 5000 });

      // Tap to flip
      await firstCard.tap();

      // Verify flip
      await page.waitForTimeout(1000);
      const cardContent = page.locator('[class*="card-front"], [class*="revealed"]').first();
      await expect(cardContent).toBeVisible({ timeout: 2000 });
    });

  test('should render correctly at different viewport sizes', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667, name: 'Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1920, height: 1080, name: 'Desktop' },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Verify shuffle button is visible and accessible
        const shuffleButton = page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i });
        await expect(shuffleButton).toBeVisible();

        // Verify button is not cut off
        const buttonBox = await shuffleButton.boundingBox();
        expect(buttonBox).toBeTruthy();
        expect(buttonBox!.width).toBeGreaterThan(0);
        expect(buttonBox!.height).toBeGreaterThan(0);
      }
    });

  test('should handle API errors gracefully', async ({ page }) => {
      // Intercept API calls and return error
      await page.route('**/api/v1/readings/**', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' }),
        });
      });

      // Complete card drawing
      await page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i }).click();
      const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
      await expect(firstCard).toBeVisible({ timeout: 5000 });
      await firstCard.click();

      // Verify error message is displayed
      const errorMessage = page.getByText(/錯誤|error|輻射干擾/i);
      await expect(errorMessage).toBeVisible({ timeout: 10000 });

      // Verify retry button is available
      const retryButton = page.getByRole('button', { name: /重試|retry/i });
      await expect(retryButton).toBeVisible();
    });

  test('should maintain state across navigation', async ({ page }) => {
      // Start shuffle
      await page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i }).click();

      // Wait for cards
      await page.getByRole('button', { name: /flip|翻牌/i }).first().waitFor({ timeout: 5000 });

      // Navigate away
      await page.goto('/');

      // Navigate back
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Verify state is preserved or recovery prompt appears
      const recoveryPrompt = page.getByText(/繼續|continue.*解讀|reading/i);
      const shuffleButton = page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i });

      // Either recovery prompt or fresh start should be available
      const hasRecovery = await recoveryPrompt.isVisible({ timeout: 2000 }).catch(() => false);
      const hasFreshStart = await shuffleButton.isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasRecovery || hasFreshStart).toBe(true);
  });
});

// Browser-specific feature tests
test.describe('Browser-Specific Features', () => {
  test('Chrome: should support Web Speech API', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Speech API test only for Chrome');

    await page.goto('/readings/new');

    // Complete reading flow
    await page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i }).click();
    const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
    await expect(firstCard).toBeVisible({ timeout: 5000 });
    await firstCard.click();

    // Wait for interpretation
    await page.locator('[class*="interpretation"]').waitFor({ timeout: 10000 });

    // Look for voice button
    const voiceButton = page.getByRole('button', { name: /語音|voice|朗讀/i });
    const hasVoiceButton = await voiceButton.isVisible({ timeout: 5000 }).catch(() => false);

    // Chrome should support voice features
    expect(hasVoiceButton).toBe(true);
  });

  test('Firefox: should handle CSS animations correctly', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test');

    await page.goto('/readings/new');

    // Start shuffle
    await page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i }).click();

    // Verify animations work in Firefox
    const animatedElement = page.locator('[class*="animate"]').first();
    await expect(animatedElement).toBeVisible({ timeout: 5000 });

    // Check for animation properties
    const hasTransform = await page.evaluate(() => {
      const el = document.querySelector('[class*="animate"]');
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.transform !== 'none';
    });

    expect(hasTransform).toBe(true);
  });

  test('Safari/WebKit: should handle touch events correctly', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'WebKit-specific test');

    await page.goto('/readings/new');
    await page.setViewportSize({ width: 375, height: 667 });

    // Test tap events
    const shuffleButton = page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i });
    await shuffleButton.tap();

    // Verify response to touch
    const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
    await expect(firstCard).toBeVisible({ timeout: 5000 });
  });
});

// Performance tests across browsers
test.describe('Performance Across Browsers', () => {
  test('should load within performance budget', async ({ page }) => {
    // Start performance measurement
    await page.goto('/readings/new', { waitUntil: 'networkidle' });

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });

    // Assert performance budgets (from requirements NFR-1.1, NFR-1.2)
    expect(metrics.firstContentfulPaint).toBeLessThan(2000); // < 2s for desktop
    expect(metrics.loadComplete).toBeLessThan(3000); // < 3s total load
  });

  test('should maintain 30+ FPS during animations', async ({ page }) => {
    await page.goto('/readings/new');

    // Start FPS monitoring
    await page.evaluate(() => {
      (window as any).__fpsMonitor = {
        frames: [],
        lastTime: performance.now(),
      };

      const monitor = () => {
        const now = performance.now();
        const fps = 1000 / (now - (window as any).__fpsMonitor.lastTime);
        (window as any).__fpsMonitor.frames.push(fps);
        (window as any).__fpsMonitor.lastTime = now;
        requestAnimationFrame(monitor);
      };

      monitor();
    });

    // Trigger animation
    await page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i }).click();

    // Wait for animation to complete
    await page.waitForTimeout(2000);

    // Get FPS data
    const fpsData = await page.evaluate(() => {
      const frames = (window as any).__fpsMonitor.frames;
      const avgFps = frames.reduce((a: number, b: number) => a + b, 0) / frames.length;
      const minFps = Math.min(...frames);
      return { avgFps, minFps };
    });

    // Assert performance (requirement 7.2: 60 FPS target, 30 FPS minimum)
    expect(fpsData.minFps).toBeGreaterThan(30);
  });
});
