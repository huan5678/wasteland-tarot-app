import { test, expect } from '@playwright/test';

/**
 * Scrollbar Cross-Browser Compatibility Tests
 *
 * Tests custom scrollbar implementation across different browsers:
 * - Chrome/Chromium: Webkit pseudo-elements (::-webkit-scrollbar)
 * - Firefox: Modern standard (scrollbar-width, scrollbar-color)
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

test.describe('Scrollbar Cross-Browser Compatibility', () => {

  test.describe('Chrome/Chromium - Webkit Implementation', () => {
    test.use({ browserName: 'chromium' });

    test('should use webkit scrollbar pseudo-elements', async ({ page }) => {
      await page.goto('/');

      // Check if webkit scrollbar styles are applied
      const scrollbarWidth = await page.evaluate(() => {
        const style = window.getComputedStyle(document.documentElement, '::-webkit-scrollbar');
        return style.width;
      });

      // Desktop should be 12px
      expect(scrollbarWidth).toBe('12px');
    });

    test('should apply webkit scrollbar thumb styles', async ({ page }) => {
      await page.goto('/');

      const thumbColor = await page.evaluate(() => {
        const style = window.getComputedStyle(document.documentElement, '::-webkit-scrollbar-thumb');
        return style.backgroundColor;
      });

      // Should use pip-boy green color (rgb(0, 204, 102) = #00cc66)
      expect(thumbColor).toBe('rgb(0, 204, 102)');
    });

    test('should apply webkit scrollbar track styles', async ({ page }) => {
      await page.goto('/');

      const trackColor = await page.evaluate(() => {
        const style = window.getComputedStyle(document.documentElement, '::-webkit-scrollbar-track');
        return style.backgroundColor;
      });

      // Should use wasteland medium color (rgb(45, 45, 45) = #2d2d2d)
      expect(trackColor).toBe('rgb(45, 45, 45)');
    });

    test('should apply responsive scrollbar width on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 900, height: 1024 });
      await page.goto('/');

      const scrollbarWidth = await page.evaluate(() => {
        const style = window.getComputedStyle(document.documentElement, '::-webkit-scrollbar');
        return style.width;
      });

      // Tablet should be 10px
      expect(scrollbarWidth).toBe('10px');
    });

    test('should apply responsive scrollbar width on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      const scrollbarWidth = await page.evaluate(() => {
        const style = window.getComputedStyle(document.documentElement, '::-webkit-scrollbar');
        return style.width;
      });

      // Mobile should be 8px
      expect(scrollbarWidth).toBe('8px');
    });
  });

  test.describe('Firefox - Modern Standard Implementation', () => {
    test.use({ browserName: 'firefox' });

    test('should use standard scrollbar-width property', async ({ page }) => {
      await page.goto('/');

      const scrollbarWidth = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).scrollbarWidth;
      });

      // Should be 'thin' on mobile/default, 'auto' on desktop
      expect(['thin', 'auto']).toContain(scrollbarWidth);
    });

    test('should use standard scrollbar-color property', async ({ page }) => {
      await page.goto('/');

      const scrollbarColor = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).scrollbarColor;
      });

      // Should have scrollbar-color defined (format: "thumb track")
      expect(scrollbarColor).toBeTruthy();
      expect(scrollbarColor).not.toBe('auto');
    });

    test('should apply thin scrollbar-width on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      const scrollbarWidth = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).scrollbarWidth;
      });

      expect(scrollbarWidth).toBe('thin');
    });
  });

  test.describe('Graceful Degradation', () => {
    test('should maintain functionality with default scrollbars', async ({ page }) => {
      await page.goto('/');

      // Verify page is scrollable regardless of custom scrollbar support
      const isScrollable = await page.evaluate(() => {
        return document.documentElement.scrollHeight > document.documentElement.clientHeight;
      });

      // If content is long enough, should be scrollable
      if (isScrollable) {
        // Test scrolling functionality
        await page.evaluate(() => window.scrollTo(0, 100));

        const scrollTop = await page.evaluate(() => window.scrollY);
        expect(scrollTop).toBeGreaterThan(0);
      }
    });
  });
});
