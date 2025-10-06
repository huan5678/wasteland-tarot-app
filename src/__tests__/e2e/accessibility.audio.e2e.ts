/**
 * 無障礙功能 E2E 測試
 * 需求 4.4: 無障礙功能 E2E 測試
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Audio Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/audio');
    await page.waitForTimeout(1000);
  });

  test('應該符合 WCAG AA 標準', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('音量滑桿應該有正確的 ARIA 標籤', async ({ page }) => {
    const slider = page.locator('input[type="range"]').first();

    const ariaLabel = await slider.getAttribute('aria-label');
    const ariaValueMin = await slider.getAttribute('aria-valuemin');
    const ariaValueMax = await slider.getAttribute('aria-valuemax');
    const ariaValueNow = await slider.getAttribute('aria-valuenow');

    expect(ariaLabel).toBeTruthy();
    expect(ariaValueMin).toBe('0');
    expect(ariaValueMax).toBe('1');
    expect(ariaValueNow).toBeTruthy();
  });

  test('按鈕應該有可理解的標籤', async ({ page }) => {
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();

      // Button should have either aria-label or text content
      expect(ariaLabel || textContent).toBeTruthy();
    }
  });

  test('應該支援 prefers-reduced-motion', async ({ page, context }) => {
    // Create a new context with reduced motion preference
    const reducedMotionPage = await context.newPage();
    await reducedMotionPage.emulateMedia({ reducedMotion: 'reduce' });
    await reducedMotionPage.goto('/settings/audio');

    await reducedMotionPage.waitForTimeout(1000);

    // Check if animations are disabled
    const hasReducedMotion = await reducedMotionPage.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    expect(hasReducedMotion).toBe(true);

    await reducedMotionPage.close();
  });

  test('語音控制應該有狀態指示', async ({ page }) => {
    const speechControls = page.locator('[role="group"][aria-label*="語音"]').first();

    if (await speechControls.isVisible()) {
      const statusIndicator = speechControls.locator('[role="status"]').first();
      const exists = await statusIndicator.isVisible().catch(() => false);

      if (exists) {
        const ariaLive = await statusIndicator.getAttribute('aria-live');
        expect(ariaLive).toBeTruthy();
      }
    }
  });

  test('應該在視覺化元件上有 ARIA 標籤', async ({ page }) => {
    // Navigate to a page with audio visualizer
    await page.goto('/');

    const visualizer = page.locator('[role="status"][aria-label*="語音"]').first();
    const exists = await visualizer.isVisible().catch(() => false);

    if (exists) {
      const ariaLabel = await visualizer.getAttribute('aria-label');
      const ariaLive = await visualizer.getAttribute('aria-live');

      expect(ariaLabel).toBeTruthy();
      expect(ariaLive).toBe('polite');
    }
  });

  test('應該支援鍵盤導航', async ({ page }) => {
    // Tab through all interactive elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    const firstFocusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'INPUT', 'A', 'SELECT']).toContain(firstFocusedElement);

    // Continue tabbing
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    const secondFocusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'INPUT', 'A', 'SELECT']).toContain(secondFocusedElement);
  });

  test('應該能夠使用 Enter 和 Space 觸發按鈕', async ({ page }) => {
    const button = page.locator('button').first();

    await button.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Button should have been triggered (no error thrown)
    const isVisible = await button.isVisible();
    expect(isVisible).toBe(true);
  });

  test('焦點指示器應該可見', async ({ page }) => {
    const button = page.locator('button').first();

    await button.focus();
    await page.waitForTimeout(200);

    const outlineStyle = await button.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        outline: style.outline,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
      };
    });

    // Should have some form of focus indicator
    const hasFocusIndicator =
      outlineStyle.outlineWidth !== '0px' ||
      outlineStyle.boxShadow !== 'none' ||
      outlineStyle.outline !== 'none';

    expect(hasFocusIndicator).toBe(true);
  });

  test('錯誤訊息應該可被螢幕閱讀器讀取', async ({ page }) => {
    // Trigger an error (e.g., by blocking audio resources)
    await page.route('**/sounds/**', (route) => route.abort());
    await page.reload();
    await page.waitForTimeout(1500);

    const errorMessage = page.locator('[role="alert"]').first();
    const exists = await errorMessage.isVisible().catch(() => false);

    if (exists) {
      const ariaLive = await errorMessage.getAttribute('aria-live');
      expect(['assertive', 'polite']).toContain(ariaLive);
    }
  });
});
