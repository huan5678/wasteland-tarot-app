import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Scrollbar Accessibility Tests
 *
 * Tests custom scrollbar implementation for accessibility compliance:
 * - axe-core violations scan
 * - High contrast mode support
 * - Reduced motion support
 * - Keyboard navigation compatibility
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

test.describe('Scrollbar Accessibility', () => {

  test('should not have any axe-core violations', async ({ page }) => {
    await page.goto('/');

    // Ensure page has scrollable content for scrollbar visibility
    await page.evaluate(() => {
      const testContent = document.createElement('div');
      testContent.id = 'scrollbar-test-content';
      testContent.style.height = '3000px';
      testContent.style.position = 'absolute';
      testContent.style.top = '0';
      testContent.style.pointerEvents = 'none';
      document.body.appendChild(testContent);
    });

    // Run axe accessibility audit
    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();

    // Verify no violations
    expect(accessibilityScanResults.violations).toEqual([]);

    // Cleanup
    await page.evaluate(() => {
      const testContent = document.getElementById('scrollbar-test-content');
      if (testContent) testContent.remove();
    });
  });

  test('should support high contrast mode (forced-colors)', async ({ page }) => {
    // Enable forced colors (high contrast mode)
    await page.emulateMedia({ forcedColors: 'active' });

    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Ensure page has scrollable content
    await page.evaluate(() => {
      const testContent = document.createElement('div');
      testContent.id = 'scrollbar-test-content';
      testContent.style.height = '3000px';
      testContent.style.position = 'absolute';
      testContent.style.top = '0';
      testContent.style.pointerEvents = 'none';
      document.body.appendChild(testContent);
    });

    // Verify that forced-colors media query is active
    const forcedColorsActive = await page.evaluate(() => {
      return window.matchMedia('(forced-colors: active)').matches;
    });

    expect(forcedColorsActive).toBe(true);

    // Verify scrollbar-color property exists in high contrast mode (for Firefox)
    const scrollbarColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).scrollbarColor;
    });

    // In forced colors mode, scrollbarColor should be defined
    expect(scrollbarColor).toBeTruthy();

    // Run axe accessibility audit in high contrast mode
    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();

    // Verify no violations in high contrast mode
    expect(accessibilityScanResults.violations).toEqual([]);

    // Cleanup
    await page.evaluate(() => {
      const testContent = document.getElementById('scrollbar-test-content');
      if (testContent) testContent.remove();
    });
  });

  test('should support reduced motion preference', async ({ page }) => {
    // Enable reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Ensure page has scrollable content
    await page.evaluate(() => {
      const testContent = document.createElement('div');
      testContent.id = 'scrollbar-test-content';
      testContent.style.height = '3000px';
      testContent.style.position = 'absolute';
      testContent.style.top = '0';
      testContent.style.pointerEvents = 'none';
      document.body.appendChild(testContent);
    });

    // Verify that reduced motion media query is active
    const reducedMotionActive = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    expect(reducedMotionActive).toBe(true);

    // Verify scrollbar transition is disabled (Webkit browsers)
    const hasTransition = await page.evaluate(() => {
      const style = window.getComputedStyle(document.documentElement, '::-webkit-scrollbar-thumb');
      const transition = style.transition || style.getPropertyValue('transition');
      // In reduced motion mode, transition should be 'none' or very short duration
      return transition !== 'none' && transition !== 'all 0s ease 0s' && transition !== '';
    });

    // In reduced motion mode, transitions should be disabled
    expect(hasTransition).toBe(false);

    // Run axe accessibility audit with reduced motion
    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();

    // Verify no violations with reduced motion
    expect(accessibilityScanResults.violations).toEqual([]);

    // Cleanup
    await page.evaluate(() => {
      const testContent = document.getElementById('scrollbar-test-content');
      if (testContent) testContent.remove();
    });
  });

  test('should support keyboard navigation (arrow keys)', async ({ page }) => {
    await page.goto('/');

    // Ensure page has scrollable content
    await page.evaluate(() => {
      const testContent = document.createElement('div');
      testContent.id = 'scrollbar-test-content';
      testContent.style.height = '3000px';
      testContent.style.position = 'absolute';
      testContent.style.top = '0';
      testContent.style.pointerEvents = 'none';
      document.body.appendChild(testContent);
    });

    // Focus on the page body
    await page.keyboard.press('Tab');

    // Get initial scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY);

    // Press ArrowDown key
    await page.keyboard.press('ArrowDown');

    // Wait for scroll to complete
    await page.waitForTimeout(100);

    // Get new scroll position
    const newScrollY = await page.evaluate(() => window.scrollY);

    // Verify page scrolled down
    expect(newScrollY).toBeGreaterThan(initialScrollY);

    // Cleanup
    await page.evaluate(() => {
      const testContent = document.getElementById('scrollbar-test-content');
      if (testContent) testContent.remove();
    });
  });

  test('should support keyboard navigation (Page Down/Up)', async ({ page }) => {
    await page.goto('/');

    // Ensure page has scrollable content
    await page.evaluate(() => {
      const testContent = document.createElement('div');
      testContent.id = 'scrollbar-test-content';
      testContent.style.height = '3000px';
      testContent.style.position = 'absolute';
      testContent.style.top = '0';
      testContent.style.pointerEvents = 'none';
      document.body.appendChild(testContent);
    });

    // Focus on the page
    await page.keyboard.press('Tab');

    // Get initial scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY);

    // Press PageDown key
    await page.keyboard.press('PageDown');

    // Wait for scroll to complete
    await page.waitForTimeout(100);

    // Get new scroll position
    const afterPageDownScrollY = await page.evaluate(() => window.scrollY);

    // Verify page scrolled down significantly
    expect(afterPageDownScrollY).toBeGreaterThan(initialScrollY + 200);

    // Press PageUp key
    await page.keyboard.press('PageUp');

    // Wait for scroll to complete
    await page.waitForTimeout(100);

    // Get scroll position after PageUp
    const afterPageUpScrollY = await page.evaluate(() => window.scrollY);

    // Verify page scrolled back up
    expect(afterPageUpScrollY).toBeLessThan(afterPageDownScrollY);

    // Cleanup
    await page.evaluate(() => {
      const testContent = document.getElementById('scrollbar-test-content');
      if (testContent) testContent.remove();
    });
  });

  test('should support keyboard navigation (Home/End)', async ({ page }) => {
    await page.goto('/');

    // Ensure page has scrollable content
    await page.evaluate(() => {
      const testContent = document.createElement('div');
      testContent.id = 'scrollbar-test-content';
      testContent.style.height = '3000px';
      testContent.style.position = 'absolute';
      testContent.style.top = '0';
      testContent.style.pointerEvents = 'none';
      document.body.appendChild(testContent);
    });

    // Scroll to middle of page first
    await page.evaluate(() => window.scrollTo(0, 500));

    // Focus on the page
    await page.keyboard.press('Tab');

    // Press End key to scroll to bottom
    await page.keyboard.press('End');

    // Wait for scroll to complete
    await page.waitForTimeout(200);

    // Get scroll position at bottom
    const bottomScrollY = await page.evaluate(() => window.scrollY);

    // Verify scrolled near bottom
    expect(bottomScrollY).toBeGreaterThan(400);

    // Press Home key to scroll to top
    await page.keyboard.press('Home');

    // Wait for scroll to complete
    await page.waitForTimeout(200);

    // Get scroll position at top
    const topScrollY = await page.evaluate(() => window.scrollY);

    // Verify scrolled back to top
    expect(topScrollY).toBe(0);

    // Cleanup
    await page.evaluate(() => {
      const testContent = document.getElementById('scrollbar-test-content');
      if (testContent) testContent.remove();
    });
  });

  test('should maintain focus visibility during scrolling', async ({ page }) => {
    await page.goto('/');

    // Ensure page has scrollable content with focusable elements
    await page.evaluate(() => {
      const testContent = document.createElement('div');
      testContent.id = 'scrollbar-test-content';
      testContent.style.height = '3000px';
      testContent.style.position = 'relative';

      // Add focusable button at bottom
      const button = document.createElement('button');
      button.id = 'bottom-button';
      button.textContent = 'Bottom Button';
      button.style.position = 'absolute';
      button.style.top = '2500px';
      testContent.appendChild(button);

      document.body.appendChild(testContent);
    });

    // Tab to the button (should scroll into view)
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Wait for scroll animation
    await page.waitForTimeout(300);

    // Verify button is in viewport
    const isButtonVisible = await page.evaluate(() => {
      const button = document.getElementById('bottom-button');
      if (!button) return false;

      const rect = button.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    });

    expect(isButtonVisible).toBe(true);

    // Verify button has focus
    const hasFocus = await page.evaluate(() => {
      const button = document.getElementById('bottom-button');
      return document.activeElement === button;
    });

    expect(hasFocus).toBe(true);

    // Cleanup
    await page.evaluate(() => {
      const testContent = document.getElementById('scrollbar-test-content');
      if (testContent) testContent.remove();
    });
  });
});
