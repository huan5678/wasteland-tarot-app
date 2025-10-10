/**
 * Font Loading Integration Tests
 * 字體載入整合測試
 *
 * 測試 Cubic 11 字體在 RootLayout 層級的應用和繼承
 * Requirements: 2.1-2.5, 7.2
 */

import { test, expect } from '@playwright/test';

test.describe('Font Loading Integration', () => {
  test.beforeEach(async ({ page }) => {
    // 訪問首頁
    await page.goto('/');
    // 等待字體載入完成
    await page.waitForLoadState('networkidle');
  });

  test('body element should have font-cubic className', async ({ page }) => {
    // 驗證 body 元素具有 font-cubic className
    const body = page.locator('body');
    await expect(body).toHaveClass(/font-cubic/);
  });

  test('body element should use Cubic 11 font family', async ({ page }) => {
    // 驗證 computed style 使用 'Cubic 11' 字體
    const body = page.locator('body');
    const fontFamily = await body.evaluate((el) => {
      return window.getComputedStyle(el).fontFamily;
    });

    // 字體應該包含 'Cubic 11'（可能有降級字體堆疊）
    expect(fontFamily).toContain('Cubic 11');
  });

  test('child elements should inherit Cubic 11 font', async ({ page }) => {
    // 測試幾個關鍵子元素是否正確繼承字體
    const selectors = [
      'h1', // 標題
      'p',  // 段落
      'button', // 按鈕
      'a', // 連結
    ];

    for (const selector of selectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        const fontFamily = await element.evaluate((el) => {
          return window.getComputedStyle(el).fontFamily;
        });
        expect(fontFamily).toContain('Cubic 11');
      }
    }
  });

  test('Header component should use Cubic 11 font', async ({ page }) => {
    const header = page.locator('header');
    const fontFamily = await header.evaluate((el) => {
      return window.getComputedStyle(el).fontFamily;
    });
    expect(fontFamily).toContain('Cubic 11');
  });

  test('Footer component should use Cubic 11 font', async ({ page }) => {
    const footer = page.locator('footer');
    const fontFamily = await footer.evaluate((el) => {
      return window.getComputedStyle(el).fontFamily;
    });
    expect(fontFamily).toContain('Cubic 11');
  });

  test('navigation links should use Cubic 11 font', async ({ page }) => {
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();

    if (count > 0) {
      const firstLink = navLinks.first();
      const fontFamily = await firstLink.evaluate((el) => {
        return window.getComputedStyle(el).fontFamily;
      });
      expect(fontFamily).toContain('Cubic 11');
    }
  });

  test('custom CSS classes should inherit font correctly', async ({ page }) => {
    // 測試 .text-pip-boy 等自訂類別是否正確繼承字體
    const pipBoyElements = page.locator('.text-pip-boy-green');
    const count = await pipBoyElements.count();

    if (count > 0) {
      const firstElement = pipBoyElements.first();
      const fontFamily = await firstElement.evaluate((el) => {
        return window.getComputedStyle(el).fontFamily;
      });
      expect(fontFamily).toContain('Cubic 11');
    }
  });

  test('font should be fully loaded before content display', async ({ page }) => {
    // 使用 document.fonts API 檢查字體載入狀態
    const fontsLoaded = await page.evaluate(async () => {
      await document.fonts.ready;
      const cubic11Font = Array.from(document.fonts.values()).find(
        (font) => font.family === 'Cubic 11'
      );
      return cubic11Font?.status === 'loaded';
    });

    expect(fontsLoaded).toBeTruthy();
  });

  test('Chinese characters should render correctly', async ({ page }) => {
    // 檢查中文字元是否正確顯示（不是方塊字）
    const chineseText = page.getByText('廢土塔羅').first();

    if (await chineseText.count() > 0) {
      const fontFamily = await chineseText.evaluate((el) => {
        return window.getComputedStyle(el).fontFamily;
      });
      expect(fontFamily).toContain('Cubic 11');

      // 檢查文字是否可見
      await expect(chineseText).toBeVisible();
    }
  });

  test('English characters should render correctly', async ({ page }) => {
    // 檢查英文字元是否正確顯示
    const englishText = page.getByText(/Wasteland|Tarot|Vault/i).first();

    if (await englishText.count() > 0) {
      const fontFamily = await englishText.evaluate((el) => {
        return window.getComputedStyle(el).fontFamily;
      });
      expect(fontFamily).toContain('Cubic 11');
      await expect(englishText).toBeVisible();
    }
  });

  test('numbers should render correctly', async ({ page }) => {
    // 檢查數字是否正確顯示
    const numberElements = page.locator('.numeric, .stat-number, .counter');
    const count = await numberElements.count();

    if (count > 0) {
      const firstNumber = numberElements.first();
      const fontFamily = await firstNumber.evaluate((el) => {
        return window.getComputedStyle(el).fontFamily;
      });
      expect(fontFamily).toContain('Cubic 11');
      await expect(firstNumber).toBeVisible();
    }
  });

  test('font fallback should work when font fails to load', async ({ page }) => {
    // 模擬字體載入失敗的情況
    await page.route('**/fonts/Cubic_11.woff2', (route) => route.abort());
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 應該降級至 monospace 字體堆疊
    const body = page.locator('body');
    const fontFamily = await body.evaluate((el) => {
      return window.getComputedStyle(el).fontFamily;
    });

    // 降級字體應該包含 monospace 相關字體
    const hasFallback =
      fontFamily.includes('monospace') ||
      fontFamily.includes('SFMono') ||
      fontFamily.includes('Monaco') ||
      fontFamily.includes('Consolas');

    expect(hasFallback).toBeTruthy();
  });

  test('font-display swap should prevent FOIT', async ({ page }) => {
    // 驗證字體使用 font-display: swap，文字立即可見
    // 在字體載入期間，應該先顯示降級字體
    const startTime = Date.now();
    await page.goto('/');

    // 檢查首屏文字是否立即可見（不等待字體載入）
    const mainText = page.locator('body').first();
    await expect(mainText).toBeVisible({ timeout: 1000 });

    const loadTime = Date.now() - startTime;
    // 文字應該在 1 秒內可見（不會因為字體載入而被阻塞）
    expect(loadTime).toBeLessThan(1000);
  });
});

test.describe('Font Loading on Different Pages', () => {
  const pages = [
    { path: '/', name: 'Homepage' },
    { path: '/cards', name: 'Cards Library' },
    { path: '/dashboard', name: 'Dashboard' },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.name} should use Cubic 11 font`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      const body = page.locator('body');
      const fontFamily = await body.evaluate((el) => {
        return window.getComputedStyle(el).fontFamily;
      });

      expect(fontFamily).toContain('Cubic 11');
    });
  }
});
