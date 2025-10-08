import { test, expect } from '@playwright/test';

/**
 * Scrollbar Visual Regression Tests
 *
 * Tests custom scrollbar visual appearance across different viewport sizes:
 * - Desktop: 1920x1080 (12px scrollbar)
 * - Tablet: 768x1024 (10px scrollbar)
 * - Mobile: 375x667 (8px scrollbar)
 *
 * Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3
 */

test.describe('Scrollbar Visual Regression', () => {

  test('should render correctly on desktop (1920x1080)', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Ensure page has scrollable content
    await page.evaluate(() => {
      // Add temporary content to ensure scrollbar is visible
      const testContent = document.createElement('div');
      testContent.id = 'scrollbar-test-content';
      testContent.style.height = '3000px';
      testContent.style.position = 'absolute';
      testContent.style.top = '0';
      testContent.style.pointerEvents = 'none';
      document.body.appendChild(testContent);
    });

    // Capture full page screenshot with scrollbar visible
    await expect(page).toHaveScreenshot('scrollbar-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });

    // Cleanup
    await page.evaluate(() => {
      const testContent = document.getElementById('scrollbar-test-content');
      if (testContent) testContent.remove();
    });
  });

  test('should render correctly on tablet (768x1024)', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
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

    // Capture full page screenshot with scrollbar visible
    await expect(page).toHaveScreenshot('scrollbar-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });

    // Cleanup
    await page.evaluate(() => {
      const testContent = document.getElementById('scrollbar-test-content');
      if (testContent) testContent.remove();
    });
  });

  test('should render correctly on mobile (375x667)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
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

    // Capture full page screenshot with scrollbar visible
    await expect(page).toHaveScreenshot('scrollbar-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });

    // Cleanup
    await page.evaluate(() => {
      const testContent = document.getElementById('scrollbar-test-content');
      if (testContent) testContent.remove();
    });
  });

  test('should render scrollbar thumb in hover state', async ({ page }) => {
    // Use desktop viewport for hover testing
    await page.setViewportSize({ width: 1920, height: 1080 });
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

    // Scroll down slightly to make scrollbar thumb visible
    await page.evaluate(() => window.scrollTo(0, 100));

    // Hover over scrollbar area (approximate position)
    await page.mouse.move(1910, 500);

    // Small delay to ensure hover state is applied
    await page.waitForTimeout(300);

    // Capture screenshot with hover state
    await expect(page).toHaveScreenshot('scrollbar-hover-state.png', {
      animations: 'disabled',
    });

    // Cleanup
    await page.evaluate(() => {
      const testContent = document.getElementById('scrollbar-test-content');
      if (testContent) testContent.remove();
    });
  });

  test('should render scrollbar in reduced motion mode', async ({ page }) => {
    // Enable reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
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

    // Capture screenshot with reduced motion enabled
    await expect(page).toHaveScreenshot('scrollbar-reduced-motion.png', {
      fullPage: true,
      animations: 'disabled',
    });

    // Cleanup
    await page.evaluate(() => {
      const testContent = document.getElementById('scrollbar-test-content');
      if (testContent) testContent.remove();
    });
  });
});
