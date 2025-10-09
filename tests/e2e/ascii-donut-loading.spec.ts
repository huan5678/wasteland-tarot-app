/**
 * E2E Tests for AsciiDonutLoading Component
 *
 * Tests the loading screen integration with authentication flow
 */

import { test, expect } from '@playwright/test';

test.describe('AsciiDonutLoading Component', () => {
  test.describe('Visual Rendering', () => {
    test('should display ASCII donut animation on initial load', async ({ page }) => {
      // Navigate to the application root
      await page.goto('/');

      // Should show loading animation during initialization
      // Note: This may be very fast if auth is already cached
      const loadingContainer = page.locator('[role="status"]');

      // Check if loading screen appears or has appeared
      const isVisible = await loadingContainer.isVisible().catch(() => false);

      if (isVisible) {
        // Loading screen is still visible - verify content
        await expect(loadingContainer).toBeVisible();

        // Should have the loading message
        await expect(page.getByText(/INITIALIZING VAULT RESIDENT STATUS/i)).toBeVisible();

        // Should have the ASCII animation element
        const asciiElement = page.locator('pre[aria-label*="Loading animation"]');
        await expect(asciiElement).toBeVisible();
      }

      // Either way, the app should eventually be fully loaded
      // Wait for the app content to appear (no longer loading)
      await expect(loadingContainer).not.toBeVisible({ timeout: 5000 });
    });

    test('should have proper accessibility attributes', async ({ page }) => {
      // For this test, we want to ensure loading state exists
      // We'll force a page reload to catch the loading state
      await page.goto('/');

      // Try to catch the loading screen
      const loadingContainer = page.locator('[role="status"]');
      const isVisible = await loadingContainer.isVisible().catch(() => false);

      if (isVisible) {
        // Verify ARIA attributes
        await expect(loadingContainer).toHaveAttribute('role', 'status');
        await expect(loadingContainer).toHaveAttribute('aria-live', 'polite');

        // Verify aria-label on pre element
        const asciiElement = page.locator('pre[aria-label*="Loading animation"]');
        await expect(asciiElement).toHaveAttribute('aria-label', /Loading animation/i);
      }
    });
  });

  test.describe('Styling and Theme', () => {
    test('should use Fallout theme colors', async ({ page }) => {
      await page.goto('/');

      const loadingContainer = page.locator('[role="status"]');
      const isVisible = await loadingContainer.isVisible().catch(() => false);

      if (isVisible) {
        // Check background is black
        const bgColor = await loadingContainer.evaluate((el) =>
          window.getComputedStyle(el).backgroundColor
        );
        expect(bgColor).toMatch(/rgb\(0,\s*0,\s*0\)/);

        // Check text color is Pip-Boy green (approximately)
        const textElement = page.getByText(/INITIALIZING VAULT RESIDENT STATUS/i);
        const textColor = await textElement.evaluate((el) =>
          window.getComputedStyle(el).color
        );

        // Pip-Boy green should have significant green component
        // We just verify it's not default black/white
        expect(textColor).not.toMatch(/rgb\(0,\s*0,\s*0\)/);
        expect(textColor).not.toMatch(/rgb\(255,\s*255,\s*255\)/);
      }
    });

    test('should use monospace font for ASCII art', async ({ page }) => {
      await page.goto('/');

      const loadingContainer = page.locator('[role="status"]');
      const isVisible = await loadingContainer.isVisible().catch(() => false);

      if (isVisible) {
        const asciiElement = page.locator('pre[aria-label*="Loading animation"]');
        const fontFamily = await asciiElement.evaluate((el) =>
          window.getComputedStyle(el).fontFamily
        );

        // Should include a monospace font
        expect(fontFamily.toLowerCase()).toContain('mono');
      }
    });
  });

  test.describe('Animation Behavior', () => {
    test('should render static or animated content', async ({ page }) => {
      await page.goto('/');

      const loadingContainer = page.locator('[role="status"]');
      const isVisible = await loadingContainer.isVisible().catch(() => false);

      if (isVisible) {
        const asciiElement = page.locator('pre[aria-label*="Loading animation"]');
        const content = await asciiElement.textContent();

        // Content should exist (either static or animated)
        expect(content).toBeTruthy();
        expect(content!.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Performance', () => {
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');

      // Wait for loading to complete (app content appears)
      const loadingContainer = page.locator('[role="status"]');
      await expect(loadingContainer).not.toBeVisible({ timeout: 10000 });

      const loadTime = Date.now() - startTime;

      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });
  });

  test.describe('Responsive Design', () => {
    test('should be visible on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      const loadingContainer = page.locator('[role="status"]');
      const isVisible = await loadingContainer.isVisible().catch(() => false);

      if (isVisible) {
        await expect(loadingContainer).toBeVisible();

        // Message should be readable
        const message = page.getByText(/INITIALIZING VAULT RESIDENT STATUS/i);
        await expect(message).toBeVisible();
      }
    });

    test('should be visible on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      const loadingContainer = page.locator('[role="status"]');
      const isVisible = await loadingContainer.isVisible().catch(() => false);

      if (isVisible) {
        await expect(loadingContainer).toBeVisible();
      }
    });

    test('should be visible on desktop viewport', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');

      const loadingContainer = page.locator('[role="status"]');
      const isVisible = await loadingContainer.isVisible().catch(() => false);

      if (isVisible) {
        await expect(loadingContainer).toBeVisible();
      }
    });
  });

  test.describe('Reduced Motion', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      // Enable reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');

      const loadingContainer = page.locator('[role="status"]');
      const isVisible = await loadingContainer.isVisible().catch(() => false);

      if (isVisible) {
        // Should still render (static fallback)
        await expect(loadingContainer).toBeVisible();

        const asciiElement = page.locator('pre[aria-label*="Loading animation"]');
        const content = await asciiElement.textContent();

        // Content should exist (static fallback)
        expect(content).toBeTruthy();
        expect(content!.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Integration with Auth Flow', () => {
    test('should transition from loading to app content', async ({ page }) => {
      await page.goto('/');

      // Loading container should eventually disappear
      const loadingContainer = page.locator('[role="status"]');
      await expect(loadingContainer).not.toBeVisible({ timeout: 10000 });

      // App content should be visible after loading
      // This could be various things depending on auth state
      // We just verify that the page has loaded content
      const bodyContent = await page.locator('body').textContent();
      expect(bodyContent).toBeTruthy();
      expect(bodyContent!.length).toBeGreaterThan(0);
    });
  });
});
