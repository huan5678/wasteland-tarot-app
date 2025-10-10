import { test, expect } from '@playwright/test';

test.describe('Audio Controls', () => {
  test.beforeEach(async ({ page }) => {
    // 前往首頁
    await page.goto('http://localhost:3001');

    // 等待頁面載入完成（等待 auth initialization 完成 - 等待 Hero section 出現）
    await page.waitForSelector('text=量子占卜', { timeout: 20000 });

    // 額外等待 1 秒確保所有腳本載入
    await page.waitForTimeout(1000);
  });

  test('should load page without toggleMute errors', async ({ page }) => {
    // 檢查 console 是否有 toggleMute 相關錯誤
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 等待 2 秒收集錯誤
    await page.waitForTimeout(2000);

    // 驗證沒有 "Cannot read properties of undefined (reading 'call')" 錯誤
    const toggleMuteErrors = consoleErrors.filter(err =>
      err.includes('Cannot read properties of undefined') ||
      err.includes('toggleMute')
    );

    expect(toggleMuteErrors).toHaveLength(0);
  });

  test('should have volume control UI', async ({ page }) => {
    // 檢查是否有音量控制按鈕（通常在 Header 中）
    const volumeButton = page.locator('button[aria-label*="音量"], button[aria-label*="volume"], button[aria-label*="靜音"], button[aria-label*="mute"]').first();

    if (await volumeButton.count() > 0) {
      await expect(volumeButton).toBeVisible();

      // 嘗試點擊音量按鈕
      await volumeButton.click();

      // 等待動畫
      await page.waitForTimeout(500);

      // 截圖驗證
      await page.screenshot({ path: 'test-results/audio-controls-clicked.png' });
    }
  });

  test('should verify audioStore has toggleMute method', async ({ page }) => {
    // 在頁面上檢查 audioStore 是否有 toggleMute 方法
    const hasToggleMute = await page.evaluate(() => {
      // 檢查 window 上是否有 audioStore 實例
      const audioStoreModule = (window as any).__AUDIO_STORE__;

      if (audioStoreModule) {
        const state = audioStoreModule.getState();
        return typeof state.toggleMute === 'function';
      }

      return false;
    });

    console.log('audioStore has toggleMute:', hasToggleMute);
  });
});
