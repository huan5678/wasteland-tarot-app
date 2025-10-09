import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'Desktop Large', width: 1920, height: 1080 },
  { name: 'Desktop Medium', width: 1366, height: 768 },
  { name: 'Tablet Portrait', width: 768, height: 1024 },
  { name: 'Tablet Landscape', width: 1024, height: 768 },
  { name: 'Mobile Large', width: 414, height: 896 },
  { name: 'Mobile Medium', width: 375, height: 667 },
  { name: 'Mobile Small', width: 320, height: 568 }
];

test.describe('響應式設計測試', () => {
  for (const viewport of viewports) {
    test(`${viewport.name} (${viewport.width}x${viewport.height}) 顯示測試`, async ({ page }) => {
      // 設置視窗大小
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // 導航到首頁
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // 截圖完整頁面
      await page.screenshot({
        path: `./test-results/responsive-${viewport.name.toLowerCase().replace(/\s+/g, '-')}-full.png`,
        fullPage: true
      });

      // 截圖可視區域
      await page.screenshot({
        path: `./test-results/responsive-${viewport.name.toLowerCase().replace(/\s+/g, '-')}-viewport.png`,
        fullPage: false
      });

      // 檢查主要內容是否可見
      const mainContent = page.locator('main, [role="main"], .main-content, body > div').first();
      await expect(mainContent).toBeVisible();

      // 檢查是否有水平滾動條（通常表示響應式問題）
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = viewport.width;

      if (bodyWidth > viewportWidth + 20) { // 允許20px的誤差
        console.warn(`⚠️ ${viewport.name}: 檢測到水平滾動 (body width: ${bodyWidth}px, viewport: ${viewportWidth}px)`);
      }

      // 檢查文字是否過小（移動設備）
      if (viewport.width <= 414) {
        const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6');
        const firstText = textElements.first();

        if (await firstText.isVisible()) {
          const fontSize = await firstText.evaluate((el) => {
            return window.getComputedStyle(el).fontSize;
          });

          const fontSizeNum = parseInt(fontSize);
          if (fontSizeNum < 14) {
            console.warn(`⚠️ ${viewport.name}: 字體可能過小 (${fontSize})`);
          }
        }
      }
    });
  }

  test('移動設備觸控功能測試', async ({ page }) => {
    // 設置為移動設備視窗
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 測試觸控滾動
    await page.mouse.move(187, 300);
    await page.mouse.down();
    await page.mouse.move(187, 100);
    await page.mouse.up();

    await page.waitForTimeout(500);

    // 截圖滾動後的狀態
    await page.screenshot({
      path: './test-results/mobile-scroll-test.png',
      fullPage: false
    });

    // 測試觸控點擊
    const interactiveElements = page.locator('button, [role="button"], a').first();
    if (await interactiveElements.isVisible()) {
      // 檢查元素是否足夠大以便觸控
      const box = await interactiveElements.boundingBox();
      if (box) {
        const minTouchSize = 44; // iOS Human Interface Guidelines 建議的最小觸控大小
        if (box.width < minTouchSize || box.height < minTouchSize) {
          console.warn(`⚠️ 觸控目標可能過小: ${box.width}x${box.height}px`);
        }
      }

      await interactiveElements.tap();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: './test-results/mobile-tap-test.png',
        fullPage: false
      });
    }
  });

  test('橫豎屏切換測試', async ({ page }) => {
    // 測試縱向模式
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: './test-results/orientation-portrait.png',
      fullPage: true
    });

    // 切換到橫向模式
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(1000); // 等待重排

    await page.screenshot({
      path: './test-results/orientation-landscape.png',
      fullPage: true
    });

    // 檢查內容是否仍然可見和可用
    const mainContent = page.locator('main, [role="main"], .main-content, body > div').first();
    await expect(mainContent).toBeVisible();
  });

  test('平板設備介面適配測試', async ({ page }) => {
    // 設置為 iPad 尺寸
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: './test-results/tablet-interface.png',
      fullPage: true
    });

    // 檢查是否適當利用了更大的螢幕空間
    const content = page.locator('main, [role="main"], .main-content').first();
    if (await content.isVisible()) {
      const box = await content.boundingBox();
      if (box) {
        const usageRatio = (box.width * box.height) / (768 * 1024);
        console.log(`內容區域使用比例: ${(usageRatio * 100).toFixed(1)}%`);

        if (usageRatio < 0.3) {
          console.warn('⚠️ 內容可能沒有充分利用平板螢幕空間');
        }
      }
    }
  });

  test('超寬螢幕適配測試', async ({ page }) => {
    // 設置為超寬螢幕
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: './test-results/ultrawide-display.png',
      fullPage: false
    });

    // 檢查內容是否過度拉伸
    const content = page.locator('main, [role="main"], .main-content').first();
    if (await content.isVisible()) {
      const box = await content.boundingBox();
      if (box && box.width > 1200) {
        console.log(`內容寬度: ${box.width}px`);
        if (box.width > 1600) {
          console.warn('⚠️ 內容可能在超寬螢幕上過度拉伸');
        }
      }
    }
  });

  test('字體縮放測試（可訪問性）', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });

    // 模擬瀏覽器字體縮放到 150%
    await page.addStyleTag({
      content: `
        * {
          font-size: 1.5em !important;
        }
      `
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: './test-results/font-scaling-150.png',
      fullPage: true
    });

    // 檢查是否有文字溢出或重疊
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6');
    const elementCount = await textElements.count();

    for (let i = 0; i < Math.min(elementCount, 10); i++) {
      const element = textElements.nth(i);
      if (await element.isVisible()) {
        const box = await element.boundingBox();
        if (box && (box.height > 100 || box.width > 2000)) {
          console.warn(`⚠️ 元素 ${i} 可能因字體縮放而異常: ${box.width}x${box.height}px`);
        }
      }
    }
  });

  test('暗色模式適配測試', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });

    // 模擬暗色模式偏好
    await page.emulateMedia({ colorScheme: 'dark' });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: './test-results/dark-mode.png',
      fullPage: true
    });

    // 檢查是否適當響應暗色模式
    const backgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    console.log(`Body 背景色 (暗色模式): ${backgroundColor}`);

    // 切換回亮色模式進行對比
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: './test-results/light-mode.png',
      fullPage: true
    });
  });

  test('打印樣式測試', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 模擬打印媒體查詢
    await page.emulateMedia({ media: 'print' });

    await page.screenshot({
      path: './test-results/print-preview.png',
      fullPage: true
    });

    // 檢查打印樣式是否移除了不必要的元素
    const navigationElements = page.locator('nav, .navigation, header nav');
    const navCount = await navigationElements.count();

    for (let i = 0; i < navCount; i++) {
      const nav = navigationElements.nth(i);
      const isVisible = await nav.isVisible();
      if (isVisible) {
        console.log('導航元素在打印模式下仍然可見');
      }
    }
  });
});