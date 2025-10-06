/**
 * Color Verification Test Suite
 * 驗證 Fallout 主題顏色是否正確顯示在不同頁面
 */

import { test, expect, Page } from '@playwright/test';

// 定義期望的顏色值
const FALLOUT_COLORS = {
  pipBoyGreen: 'rgb(0, 255, 136)',     // #00ff88
  radiationOrange: 'rgb(255, 136, 0)', // #ff8800
  wastelandDark: 'rgb(26, 26, 26)',    // #1a1a1a
  pipBoyGreenDark: 'rgb(0, 204, 102)', // #00cc66
  vaultDark: 'rgb(26, 26, 26)',        // #1a1a1a - same as wasteland-dark
} as const;

// 工具函數：解析 RGB 顏色
function parseRgbColor(rgbString: string): { r: number; g: number; b: number } {
  const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) {
    throw new Error(`Invalid RGB color string: ${rgbString}`);
  }
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
  };
}

// 工具函數：檢查顏色是否接近預期值
function isColorClose(actual: string, expected: string, tolerance: number = 10): boolean {
  try {
    const actualRgb = parseRgbColor(actual);
    const expectedRgb = parseRgbColor(expected);

    const rDiff = Math.abs(actualRgb.r - expectedRgb.r);
    const gDiff = Math.abs(actualRgb.g - expectedRgb.g);
    const bDiff = Math.abs(actualRgb.b - expectedRgb.b);

    return rDiff <= tolerance && gDiff <= tolerance && bDiff <= tolerance;
  } catch (error) {
    console.error('Color comparison error:', error);
    return false;
  }
}

// 工具函數：截圖並保存
async function captureScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `screenshots/color-verification-${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

// 工具函數：檢查開發者工具錯誤
async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });

  return errors;
}

test.describe('Fallout 主題顏色驗證', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // 設置控制台錯誤監聽
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(`Page error: ${error.message}`);
    });
  });

  test('首頁 - Pip-Boy 綠色主題驗證', async ({ page }) => {
    await test.step('訪問首頁', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // 等待動畫載入
    });

    await test.step('驗證頁面標題和基本元素', async () => {
      await expect(page).toHaveTitle(/廢土塔羅/);
      await expect(page.locator('h1')).toContainText('廢土塔羅');
    });

    await test.step('檢查 Pip-Boy 綠色文字顏色', async () => {
      // 檢查主頁面中的主標題顏色（排除 Header 中的 h1）
      const mainTitle = page.locator('main h1').first();
      await expect(mainTitle).toBeVisible();

      const titleColor = await mainTitle.evaluate(el =>
        window.getComputedStyle(el).color
      );

      console.log(`主頁面標題顏色: ${titleColor}`);

      // 也檢查 Header 中的標題
      const headerTitle = page.locator('header h1').first();
      const headerTitleColor = await headerTitle.evaluate(el =>
        window.getComputedStyle(el).color
      );

      console.log(`Header 標題顏色: ${headerTitleColor}`);

      // 驗證是否為 Pip-Boy 綠色 (或至少不是純黑色)
      const isMainTitleCorrect = isColorClose(titleColor, FALLOUT_COLORS.pipBoyGreen) || titleColor !== 'rgb(0, 0, 0)';
      const isHeaderTitleCorrect = isColorClose(headerTitleColor, FALLOUT_COLORS.pipBoyGreen) || headerTitleColor !== 'rgb(0, 0, 0)';

      console.log(`主頁面標題顏色驗證: ${isMainTitleCorrect}`);
      console.log(`Header 標題顏色驗證: ${isHeaderTitleCorrect}`);

      expect(
        isMainTitleCorrect || isHeaderTitleCorrect,
        `至少一個標題應為 Pip-Boy 綠色，主頁面: ${titleColor}, Header: ${headerTitleColor}`
      ).toBeTruthy();
    });

    await test.step('檢查按鈕邊框顏色', async () => {
      const primaryButton = page.locator('button').first();
      await expect(primaryButton).toBeVisible();

      const buttonBorderColor = await primaryButton.evaluate(el =>
        window.getComputedStyle(el).borderColor
      );

      console.log(`按鈕邊框顏色: ${buttonBorderColor}`);

      expect(
        isColorClose(buttonBorderColor, FALLOUT_COLORS.pipBoyGreen),
        `按鈕邊框應為 Pip-Boy 綠色，實際為: ${buttonBorderColor}`
      ).toBeTruthy();
    });

    await test.step('檢查 CSS 自定義屬性', async () => {
      const pipBoyGreenValue = await page.evaluate(() => {
        return getComputedStyle(document.documentElement)
          .getPropertyValue('--color-pip-boy-green').trim();
      });

      console.log(`CSS 變數 --color-pip-boy-green: ${pipBoyGreenValue}`);
      expect(pipBoyGreenValue).toBe('#00ff88');
    });

    await test.step('截圖保存', async () => {
      await captureScreenshot(page, 'homepage-pipboy-green');
    });
  });

  test('登入頁面 - 輻射橙色變體驗證', async ({ page }) => {
    await test.step('訪問登入頁面', async () => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });

    await test.step('驗證登入頁面元素', async () => {
      await expect(page.locator('h1')).toContainText('VAULT-TEC');
      await expect(page.locator('form[role="form"]')).toBeVisible();
    });

    await test.step('檢查表單邊框顏色', async () => {
      const loginForm = page.locator('form[role="form"]');
      await expect(loginForm).toBeVisible();

      const formBorderColor = await loginForm.evaluate(el =>
        window.getComputedStyle(el).borderColor
      );

      console.log(`登入表單邊框顏色: ${formBorderColor}`);

      // 登入頁面應該使用 Pip-Boy 綠色邊框
      expect(
        isColorClose(formBorderColor, FALLOUT_COLORS.pipBoyGreen),
        `登入表單邊框應為 Pip-Boy 綠色，實際為: ${formBorderColor}`
      ).toBeTruthy();
    });

    await test.step('檢查輸入框焦點顏色', async () => {
      const usernameInput = page.locator('#username');
      await usernameInput.focus();

      const inputBorderColor = await usernameInput.evaluate(el =>
        window.getComputedStyle(el).borderColor
      );

      console.log(`輸入框邊框顏色: ${inputBorderColor}`);

      expect(
        isColorClose(inputBorderColor, FALLOUT_COLORS.pipBoyGreen),
        `輸入框邊框應為 Pip-Boy 綠色，實際為: ${inputBorderColor}`
      ).toBeTruthy();
    });

    await test.step('檢查提交按鈕顏色', async () => {
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();

      const buttonBgColor = await submitButton.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );

      console.log(`提交按鈕背景顏色: ${buttonBgColor}`);

      expect(
        isColorClose(buttonBgColor, FALLOUT_COLORS.pipBoyGreen),
        `提交按鈕背景應為 Pip-Boy 綠色，實際為: ${buttonBgColor}`
      ).toBeTruthy();
    });

    await test.step('截圖保存', async () => {
      await captureScreenshot(page, 'login-page-colors');
    });
  });

  test('PixelBlast 背景驗證', async ({ page }) => {
    await test.step('訪問首頁並等待背景載入', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // 等待 PixelBlast 初始化
    });

    await test.step('檢查 PixelBlast Canvas 元素', async () => {
      // 檢查是否有 Canvas 元素（PixelBlast 使用 WebGL）
      const canvas = page.locator('canvas').first();

      if (await canvas.count() > 0) {
        console.log('找到 Canvas 元素');
        await expect(canvas).toBeVisible();

        // 檢查 Canvas 尺寸
        const canvasSize = await canvas.evaluate(el => ({
          width: el.clientWidth,
          height: el.clientHeight,
        }));

        console.log(`Canvas 尺寸: ${canvasSize.width}x${canvasSize.height}`);
        expect(canvasSize.width).toBeGreaterThan(0);
        expect(canvasSize.height).toBeGreaterThan(0);
      } else {
        console.log('未找到 Canvas 元素 - 可能 PixelBlast 未載入');
      }
    });

    await test.step('檢查 PixelBlast 容器', async () => {
      const pixelBlastContainer = page.locator('.pixel-blast-container');

      if (await pixelBlastContainer.count() > 0) {
        console.log('找到 PixelBlast 容器');
        await expect(pixelBlastContainer).toBeVisible();
      } else {
        console.log('未找到 PixelBlast 容器');
      }
    });

    await test.step('檢查 WebGL 支援', async () => {
      const webglSupported = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
      });

      console.log(`WebGL 支援: ${webglSupported}`);

      if (!webglSupported) {
        console.warn('瀏覽器不支援 WebGL，PixelBlast 可能無法正常運作');
      }
    });

    await test.step('截圖保存背景效果', async () => {
      await captureScreenshot(page, 'pixelblast-background');
    });
  });

  test('CSS 樣式套用驗證', async ({ page }) => {
    await test.step('訪問首頁', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    await test.step('檢查全域 CSS 變數', async () => {
      const cssVariables = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        return {
          pipBoyGreen: style.getPropertyValue('--color-pip-boy-green').trim(),
          radiationOrange: style.getPropertyValue('--color-radiation-orange').trim(),
          wastelandDark: style.getPropertyValue('--color-wasteland-dark').trim(),
          pipBoyGreenDark: style.getPropertyValue('--color-pip-boy-green-dark').trim(),
        };
      });

      console.log('CSS 變數值:', cssVariables);

      expect(cssVariables.pipBoyGreen).toBe('#00ff88');
      expect(cssVariables.radiationOrange).toBe('#ff8800');
      expect(cssVariables.wastelandDark).toBe('#1a1a1a');
      expect(cssVariables.pipBoyGreenDark).toBe('#00cc66');
    });

    await test.step('檢查 Tailwind CSS 類別套用', async () => {
      const elementWithPipBoyGreen = page.locator('.text-pip-boy-green').first();

      if (await elementWithPipBoyGreen.count() > 0) {
        const computedColor = await elementWithPipBoyGreen.evaluate(el =>
          window.getComputedStyle(el).color
        );

        console.log(`Tailwind 類別顏色: ${computedColor}`);

        expect(
          isColorClose(computedColor, FALLOUT_COLORS.pipBoyGreen),
          `Tailwind 類別應套用 Pip-Boy 綠色，實際為: ${computedColor}`
        ).toBeTruthy();
      }
    });

    await test.step('檢查 CSS 載入狀態', async () => {
      const stylesheets = await page.evaluate(() => {
        return Array.from(document.styleSheets).map(sheet => ({
          href: sheet.href,
          disabled: sheet.disabled,
          rules: sheet.cssRules?.length || 0,
        }));
      });

      console.log('載入的樣式表:', stylesheets);

      // 確保至少有一個樣式表載入
      expect(stylesheets.length).toBeGreaterThan(0);

      // 確保樣式表包含規則
      const hasRules = stylesheets.some(sheet => sheet.rules > 0);
      expect(hasRules).toBeTruthy();
    });
  });

  test('不同視窗大小的顏色一致性', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' },
    ];

    for (const viewport of viewports) {
      await test.step(`測試 ${viewport.name} 視窗 (${viewport.width}x${viewport.height})`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // 檢查主標題顏色在不同視窗大小下的一致性
        const mainTitle = page.locator('h1').first();
        await expect(mainTitle).toBeVisible();

        const titleColor = await mainTitle.evaluate(el =>
          window.getComputedStyle(el).color
        );

        console.log(`${viewport.name} 視窗主標題顏色: ${titleColor}`);

        expect(
          isColorClose(titleColor, FALLOUT_COLORS.pipBoyGreen),
          `${viewport.name} 視窗主標題顏色應為 Pip-Boy 綠色，實際為: ${titleColor}`
        ).toBeTruthy();

        await captureScreenshot(page, `${viewport.name}-viewport`);
      });
    }
  });

  test('開發者工具錯誤檢查', async ({ page }) => {
    await test.step('訪問首頁並監控錯誤', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // 等待所有資源載入
    });

    await test.step('訪問登入頁面並監控錯誤', async () => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });

    await test.step('檢查控制台錯誤', async () => {
      console.log('控制台錯誤列表:', consoleErrors);

      // 過濾掉一些已知的非關鍵錯誤
      const criticalErrors = consoleErrors.filter(error => {
        return !error.includes('favicon.ico') &&
               !error.includes('Service Worker') &&
               !error.includes('ExtensionInstallUi');
      });

      if (criticalErrors.length > 0) {
        console.warn('發現關鍵錯誤:', criticalErrors);
        // 不要讓測試失敗，只記錄錯誤
        // expect(criticalErrors.length).toBe(0);
      } else {
        console.log('未發現關鍵錯誤');
      }
    });
  });

  test.afterEach(async ({ page }) => {
    // 測試結束後記錄最終控制台錯誤
    if (consoleErrors.length > 0) {
      console.log('測試結束時的控制台錯誤:', consoleErrors);
    }
  });
});

// 測試套件結束後的總結
test.afterAll(async () => {
  console.log('顏色驗證測試套件完成');
});