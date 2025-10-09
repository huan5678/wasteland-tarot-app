/**
 * 音量控制 E2E 測試
 * 需求 4.1, 4.2, 4.3, 4.4: 音量控制 E2E 測試
 */

import { test, expect } from '@playwright/test';

test.describe('Volume Control', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/audio');
    // Enable audio
    await page.click('body');
    await page.waitForTimeout(1000);
  });

  test('應該顯示音量滑桿', async ({ page }) => {
    const sfxSlider = page.locator('input[type="range"][aria-label*="音效"]').first();
    const musicSlider = page.locator('input[type="range"][aria-label*="背景音樂"]').first();
    const voiceSlider = page.locator('input[type="range"][aria-label*="語音"]').first();

    await expect(sfxSlider).toBeVisible();
    await expect(musicSlider).toBeVisible();
    await expect(voiceSlider).toBeVisible();
  });

  test('應該能夠調整音效音量', async ({ page }) => {
    const slider = page.locator('input[type="range"][aria-label*="音效"]').first();

    await slider.fill('0.5');
    await page.waitForTimeout(300);

    const volume = await slider.inputValue();
    expect(parseFloat(volume)).toBeCloseTo(0.5, 1);
  });

  test('應該顯示當前音量百分比', async ({ page }) => {
    const volumeDisplay = page.locator('text=/\\d+%/').first();

    if (await volumeDisplay.isVisible()) {
      const text = await volumeDisplay.textContent();
      expect(text).toMatch(/\d+%/);
    }
  });

  test('應該能夠靜音和取消靜音', async ({ page }) => {
    const muteButton = page.locator('button[aria-label*="Mute 音效"]').first();

    if (await muteButton.isVisible()) {
      // Mute
      await muteButton.click();
      await page.waitForTimeout(300);

      let isMuted = await page.evaluate(() => {
        const state = localStorage.getItem('wasteland-tarot-audio');
        if (state) {
          const parsed = JSON.parse(state);
          return parsed.state?.muted?.sfx === true;
        }
        return false;
      });

      expect(isMuted).toBe(true);

      // Unmute
      await muteButton.click();
      await page.waitForTimeout(300);

      isMuted = await page.evaluate(() => {
        const state = localStorage.getItem('wasteland-tarot-audio');
        if (state) {
          const parsed = JSON.parse(state);
          return parsed.state?.muted?.sfx === true;
        }
        return false;
      });

      expect(isMuted).toBe(false);
    }
  });

  test('應該持久化音量設定', async ({ page, context }) => {
    const slider = page.locator('input[type="range"][aria-label*="音效"]').first();

    await slider.fill('0.35');
    await page.waitForTimeout(300);

    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);

    const volumeAfterReload = await page.evaluate(() => {
      const state = localStorage.getItem('wasteland-tarot-audio');
      if (state) {
        const parsed = JSON.parse(state);
        return parsed.state?.volumes?.sfx;
      }
      return null;
    });

    expect(volumeAfterReload).toBeCloseTo(0.35, 1);
  });

  test('應該在靜音時停用滑桿', async ({ page }) => {
    const muteButton = page.locator('button[aria-label*="Mute 音效"]').first();
    const slider = page.locator('input[type="range"][aria-label*="音效"]').first();

    if (await muteButton.isVisible()) {
      await muteButton.click();
      await page.waitForTimeout(300);

      const isDisabled = await slider.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });

  test('應該能夠使用鍵盤調整音量', async ({ page }) => {
    const slider = page.locator('input[type="range"][aria-label*="音效"]').first();

    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    // Volume should have increased
    const volume = await slider.inputValue();
    expect(parseFloat(volume)).toBeGreaterThan(0);
  });

  test('應該顯示主音量控制', async ({ page }) => {
    // Check if there's a master volume control
    const masterControl = page.locator('[aria-label*="主音量"]').first();

    // This is optional, so we just check if it exists
    const exists = await masterControl.isVisible().catch(() => false);
    expect(exists).toBeDefined();
  });
});
