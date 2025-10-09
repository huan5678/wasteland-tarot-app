import { test, expect } from '@playwright/test';

test.describe('網站現狀截圖', () => {
  test('拍攝首頁當前狀態', async ({ page }) => {
    // 設置桌面視窗大小
    await page.setViewportSize({ width: 1366, height: 768 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 截圖完整頁面
    await page.screenshot({
      path: './screenshots/current-homepage-full.png',
      fullPage: true
    });

    // 截圖可視區域
    await page.screenshot({
      path: './screenshots/current-homepage-viewport.png',
      fullPage: false
    });

    // 檢查頁面標題
    const title = await page.title();
    console.log('頁面標題:', title);

    // 檢查主要內容
    const bodyText = await page.textContent('body');
    console.log('頁面內容預覽:', bodyText?.substring(0, 200) + '...');

    // 檢查按鈕
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();
    console.log('找到按鈕數量:', buttonCount);

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const buttonText = await button.textContent();
      console.log(`按鈕 ${i}: "${buttonText}"`);
    }

    // 設置移動視窗並截圖
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: './screenshots/current-mobile-view.png',
      fullPage: true
    });
  });

  test('檢查頁面 HTML 結構', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 獲取 HTML 結構
    const htmlContent = await page.content();

    // 寫入 HTML 到文件以便檢查
    require('fs').writeFileSync('./screenshots/current-page-structure.html', htmlContent);

    console.log('HTML 內容已保存到 ./screenshots/current-page-structure.html');
  });
});