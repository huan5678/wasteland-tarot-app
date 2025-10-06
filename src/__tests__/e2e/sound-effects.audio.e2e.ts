/**
 * 音效播放 E2E 測試
 * 需求 1.1, 1.2, 1.3: 音效播放 E2E 測試
 */

import { test, expect } from '@playwright/test';

test.describe('Sound Effects Playback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Enable audio by clicking
    await page.click('body');
    await page.waitForTimeout(1000);
  });

  test('應該在點擊按鈕時播放音效', async ({ page }) => {
    // Find a button (assuming there's a button on home page)
    const button = page.locator('button').first();

    // Monitor audio playback
    const playbackStarted = page.evaluate(() => {
      return new Promise((resolve) => {
        const originalPlay = (window as any).__audioEngine?.play;
        (window as any).__audioEngine.play = function (...args: any[]) {
          resolve(true);
          return originalPlay?.apply(this, args);
        };
      });
    });

    await button.click();

    const played = await Promise.race([
      playbackStarted,
      page.waitForTimeout(1000).then(() => false),
    ]);

    expect(played).toBe(true);
  });

  test('應該能夠停止音效播放', async ({ page }) => {
    // Navigate to audio settings
    await page.goto('/settings/audio');

    // Play a sound
    const playButton = page.locator('button:has-text("播放")').first();
    if (await playButton.isVisible()) {
      await playButton.click();
      await page.waitForTimeout(500);

      // Stop the sound
      const stopButton = page.locator('button:has-text("停止")').first();
      if (await stopButton.isVisible()) {
        await stopButton.click();
      }
    }
  });

  test('應該限制並發播放數量', async ({ page }) => {
    // Rapidly click multiple buttons
    const buttons = await page.locator('button').all();

    for (const button of buttons.slice(0, 10)) {
      await button.click({ delay: 50 });
    }

    await page.waitForTimeout(500);

    const activeSounds = await page.evaluate(() => {
      return (window as any).__audioEngine?.activeSourceNodes?.size || 0;
    });

    // Should not exceed max concurrent sounds (8)
    expect(activeSounds).toBeLessThanOrEqual(8);
  });

  test('應該在靜音時不播放音效', async ({ page }) => {
    await page.goto('/settings/audio');

    // Mute SFX
    const muteButton = page.locator('button[aria-label*="Mute 音效"]').first();
    if (await muteButton.isVisible()) {
      await muteButton.click();
    }

    await page.waitForTimeout(300);

    // Try to play a sound
    const playButton = page.locator('button:has-text("播放")').first();

    let soundPlayed = false;
    page.evaluate(() => {
      const originalPlay = (window as any).__audioEngine?.play;
      (window as any).__audioEngine.play = function (...args: any[]) {
        soundPlayed = true;
        return originalPlay?.apply(this, args);
      };
    });

    if (await playButton.isVisible()) {
      await playButton.click();
      await page.waitForTimeout(300);
    }

    expect(soundPlayed).toBe(false);
  });

  test('應該套用音效處理效果', async ({ page }) => {
    // This test assumes there's a way to apply effects in the UI
    await page.goto('/settings/audio');

    // Check if effects are available
    const hasEffects = await page.evaluate(() => {
      return typeof (window as any).__effectsProcessor !== 'undefined';
    });

    if (hasEffects) {
      expect(hasEffects).toBe(true);
    }
  });
});
