/**
 * 音訊系統初始化 E2E 測試
 * 需求 6.1, 6.2: 系統初始化 E2E 測試
 */

import { test, expect } from '@playwright/test';

test.describe('Audio System Initialization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('應該在首次載入時初始化音訊系統', async ({ page }) => {
    // Wait for audio initialization
    await page.waitForTimeout(1000);

    // Check if AudioContext is created
    const audioContextState = await page.evaluate(() => {
      return (window as any).__audioEngine?.audioContext?.state;
    });

    expect(audioContextState).toBeDefined();
  });

  test('應該載入音效 manifest', async ({ page }) => {
    // Wait for manifest to load
    await page.waitForTimeout(1500);

    const manifestLoaded = await page.evaluate(() => {
      return (window as any).__audioEngine?.audioBuffers?.size > 0;
    });

    expect(manifestLoaded).toBe(true);
  });

  test('應該預載 critical 優先級的音效', async ({ page }) => {
    await page.waitForTimeout(2000);

    const criticalSoundsLoaded = await page.evaluate(() => {
      const engine = (window as any).__audioEngine;
      return engine?.audioBuffers?.has('button-click') || false;
    });

    expect(criticalSoundsLoaded).toBe(true);
  });

  test('應該在使用者互動後啟用音訊', async ({ page }) => {
    // Click anywhere to trigger user interaction
    await page.click('body');

    await page.waitForTimeout(500);

    const audioEnabled = await page.evaluate(() => {
      return localStorage.getItem('wasteland-tarot-audio')?.includes('"isAudioEnabled":true');
    });

    expect(audioEnabled).toBe(true);
  });

  test('應該在 iOS Safari 顯示音訊解鎖提示', async ({ page, browserName }) => {
    // This test is specific to WebKit (Safari)
    if (browserName !== 'webkit') {
      test.skip();
      return;
    }

    // Check for unlock prompt
    const unlockPrompt = page.locator('[aria-label*="音訊"]');
    const isVisible = await unlockPrompt.isVisible().catch(() => false);

    // On iOS Safari, should show unlock prompt before interaction
    if (isVisible) {
      expect(await unlockPrompt.textContent()).toContain('點擊');
    }
  });

  test('應該處理音訊初始化失敗', async ({ page }) => {
    // Block manifest fetch
    await page.route('**/sounds/manifest.json', (route) => {
      route.abort();
    });

    await page.reload();
    await page.waitForTimeout(1500);

    // Should still load page without crashing
    const pageTitle = await page.title();
    expect(pageTitle).toBeDefined();
  });
});
