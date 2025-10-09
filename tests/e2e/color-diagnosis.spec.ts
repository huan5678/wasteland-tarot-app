/**
 * 顏色診斷測試 - 快速檢查顏色系統
 */

import { test, expect } from '@playwright/test';

test.describe('顏色系統診斷', () => {
  test('快速顏色診斷', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 截圖記錄當前狀態
    await page.screenshot({
      path: `screenshots/color-diagnosis-homepage-${Date.now()}.png`,
      fullPage: true,
    });

    console.log('=== 顏色系統診斷開始 ===');

    // 1. 檢查 CSS 變數載入
    const cssVariables = await page.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      return {
        pipBoyGreen: rootStyle.getPropertyValue('--color-pip-boy-green').trim(),
        radiationOrange: rootStyle.getPropertyValue('--color-radiation-orange').trim(),
        wastelandDark: rootStyle.getPropertyValue('--color-wasteland-dark').trim(),
      };
    });

    console.log('CSS 變數:', cssVariables);

    // 2. 檢查 Tailwind CSS 類別計算值
    const tailwindColors = await page.evaluate(() => {
      // 建立測試元素來檢查 Tailwind 顏色
      const testEl = document.createElement('div');
      testEl.className = 'text-pip-boy-green';
      testEl.style.position = 'absolute';
      testEl.style.visibility = 'hidden';
      document.body.appendChild(testEl);

      const computedColor = getComputedStyle(testEl).color;
      document.body.removeChild(testEl);

      return {
        pipBoyGreenClass: computedColor,
      };
    });

    console.log('Tailwind 類別顏色:', tailwindColors);

    // 3. 檢查實際元素顏色
    const elementColors = await page.evaluate(() => {
      const results: any = {};

      // 檢查 Header 中的標題
      const headerTitle = document.querySelector('header h1');
      if (headerTitle) {
        results.headerTitle = window.getComputedStyle(headerTitle).color;
      }

      // 檢查主頁面標題
      const mainTitle = document.querySelector('main h1');
      if (mainTitle) {
        results.mainTitle = window.getComputedStyle(mainTitle).color;
      }

      // 檢查所有 h1 元素
      const allH1s = document.querySelectorAll('h1');
      results.allH1Colors = Array.from(allH1s).map((h1, index) => ({
        index,
        text: h1.textContent?.substring(0, 20),
        color: window.getComputedStyle(h1).color,
        classes: h1.className,
      }));

      return results;
    });

    console.log('實際元素顏色:', elementColors);

    // 4. 檢查樣式表載入狀態
    const stylesheetInfo = await page.evaluate(() => {
      return Array.from(document.styleSheets).map(sheet => {
        try {
          return {
            href: sheet.href,
            disabled: sheet.disabled,
            rules: sheet.cssRules?.length || 0,
            title: sheet.title,
            media: sheet.media.mediaText,
          };
        } catch (e) {
          return {
            href: sheet.href,
            error: 'Cannot access stylesheet (CORS)',
          };
        }
      });
    });

    console.log('樣式表載入資訊:', stylesheetInfo);

    // 5. 檢查控制台錯誤
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    // 6. 檢查網路請求失敗
    const failedRequests: string[] = [];
    page.on('response', response => {
      if (!response.ok()) {
        failedRequests.push(`${response.status()} - ${response.url()}`);
      }
    });

    // 7. 檢查 PixelBlast
    const pixelBlastInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const pixelBlastContainer = document.querySelector('.pixel-blast-container');

      return {
        hasCanvas: !!canvas,
        canvasSize: canvas ? { width: canvas.clientWidth, height: canvas.clientHeight } : null,
        hasPixelBlastContainer: !!pixelBlastContainer,
        webglSupported: (() => {
          const testCanvas = document.createElement('canvas');
          const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
          return !!gl;
        })(),
      };
    });

    console.log('PixelBlast 資訊:', pixelBlastInfo);

    // 8. 檢查應用程式狀態
    const appState = await page.evaluate(() => {
      return {
        documentReadyState: document.readyState,
        bodyClasses: document.body.className,
        htmlClasses: document.documentElement.className,
        title: document.title,
      };
    });

    console.log('應用程式狀態:', appState);

    console.log('=== 顏色系統診斷結束 ===');

    // 簡單的測試斷言
    expect(stylesheetInfo.length).toBeGreaterThan(0);

    // 記錄結果到檔案
    await page.evaluate((data) => {
      console.log('診斷結果:', JSON.stringify(data, null, 2));
    }, {
      cssVariables,
      tailwindColors,
      elementColors,
      stylesheetInfo,
      pixelBlastInfo,
      appState,
    });
  });

  test('登入頁面顏色診斷', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 截圖記錄當前狀態
    await page.screenshot({
      path: `screenshots/color-diagnosis-login-${Date.now()}.png`,
      fullPage: true,
    });

    console.log('=== 登入頁面診斷 ===');

    const loginPageColors = await page.evaluate(() => {
      const form = document.querySelector('form[role="form"]');
      const vaultTecTitle = document.querySelector('h1');
      const usernameInput = document.querySelector('#username');

      return {
        formBorderColor: form ? window.getComputedStyle(form).borderColor : null,
        titleColor: vaultTecTitle ? window.getComputedStyle(vaultTecTitle).color : null,
        inputBorderColor: usernameInput ? window.getComputedStyle(usernameInput).borderColor : null,
        bodyBackgroundColor: window.getComputedStyle(document.body).backgroundColor,
      };
    });

    console.log('登入頁面顏色:', loginPageColors);
  });
});