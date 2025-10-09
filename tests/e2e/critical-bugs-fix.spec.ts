/**
 * E2E 測試：關鍵錯誤修復驗證
 * 需求 7: 驗證所有 P0 級別錯誤已修復
 */

import { test, expect } from '@playwright/test';

test.describe('Critical Bugs Fix - E2E Validation', () => {
  test.describe('Quick Reading Routing Fix', () => {
    test('訪客點擊快速占卜應導向 /readings/quick', async ({ page }) => {
      await page.goto('/');

      // 等待頁面載入
      await page.waitForLoadState('networkidle');

      // 查找並點擊快速占卜按鈕
      const quickReadingButton = page.locator('text=快速占卜').first();
      await expect(quickReadingButton).toBeVisible();

      await quickReadingButton.click();

      // 驗證導向正確頁面
      await expect(page).toHaveURL(/\/readings\/quick/);
    });

    test('快速占卜頁面應正常載入', async ({ page }) => {
      await page.goto('/readings/quick');

      // 驗證頁面載入成功
      await expect(page).toHaveURL(/\/readings\/quick/);

      // 驗證頁面包含快速占卜相關元素
      await expect(page.locator('text=快速占卜').first()).toBeVisible();
    });

    test('快速占卜不應重定向至註冊頁面', async ({ page }) => {
      await page.goto('/readings/quick');

      // 等待頁面完全載入
      await page.waitForLoadState('networkidle');

      // 驗證沒有重定向到註冊頁面
      expect(page.url()).not.toContain('/auth/register');
      expect(page.url()).not.toContain('/auth/login');

      // 驗證仍在快速占卜頁面
      expect(page.url()).toContain('/readings/quick');
    });
  });

  test.describe('Favicon Fix', () => {
    test('應該正確載入 favicon.ico', async ({ page }) => {
      // 訪問首頁
      await page.goto('/');

      // 檢查 favicon 請求
      const faviconResponse = await page.request.get('/favicon.ico');

      // 驗證返回 200 OK
      expect(faviconResponse.ok()).toBeTruthy();
      expect(faviconResponse.status()).toBe(200);

      // 驗證是圖片類型
      const contentType = faviconResponse.headers()['content-type'];
      expect(contentType).toMatch(/image/);
    });
  });

  test.describe('Web Audio System', () => {
    test('頁面應正常載入，不因音效錯誤中斷', async ({ page, context }) => {
      // 監聽 console 錯誤
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // 訪問首頁
      await page.goto('/');

      // 等待頁面載入
      await page.waitForLoadState('networkidle');

      // 驗證頁面正常載入
      await expect(page).toHaveURL('/');

      // 驗證沒有音效相關的致命錯誤（404 錯誤已修復）
      const audioErrors = consoleErrors.filter((err) =>
        err.toLowerCase().includes('audio') || err.includes('404')
      );

      // 可能有警告，但不應有致命錯誤
      expect(audioErrors.every((err) => !err.includes('Failed to load'))).toBeTruthy();
    });

    test('音效系統應優雅降級，不顯示錯誤 UI', async ({ page }) => {
      await page.goto('/');

      // 等待頁面載入
      await page.waitForLoadState('networkidle');

      // 驗證沒有錯誤 toast 或 modal
      const errorToast = page.locator('[role="alert"]').filter({ hasText: /error|錯誤|失敗/i });
      await expect(errorToast).toHaveCount(0);

      // 驗證沒有音效錯誤提示
      const audioErrorMessage = page.locator('text=/audio.*error|音效.*錯誤/i');
      await expect(audioErrorMessage).toHaveCount(0);
    });
  });

  test.describe('Performance Validation', () => {
    test('快速占卜頁面載入時間應 < 2 秒', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/readings/quick');

      // 等待頁面完全載入
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // 驗證載入時間 < 2000ms
      expect(loadTime).toBeLessThan(2000);
    });

    test('首頁載入應不出現 API 404 錯誤', async ({ page }) => {
      const failedRequests: string[] = [];

      // 監聽網路請求
      page.on('requestfailed', (request) => {
        failedRequests.push(request.url());
      });

      page.on('response', (response) => {
        if (response.status() === 404) {
          failedRequests.push(response.url());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // 驗證沒有 API 404 錯誤（音效檔案除外，因為已改用 Web Audio 生成）
      const apiErrors = failedRequests.filter((url) =>
        url.includes('/api/') && !url.includes('/sounds/')
      );

      expect(apiErrors).toHaveLength(0);
    });
  });

  test.describe('Complete User Flow', () => {
    test('訪客完整流程：首頁 → 快速占卜 → 查看結果', async ({ page }) => {
      // 1. 訪問首頁
      await page.goto('/');
      await expect(page).toHaveURL('/');

      // 2. 點擊快速占卜
      await page.locator('text=快速占卜').first().click();
      await expect(page).toHaveURL(/\/readings\/quick/);

      // 3. 驗證快速占卜頁面載入
      await page.waitForLoadState('networkidle');

      // 4. 嘗試抽卡（如果有抽卡按鈕）
      const drawButton = page.locator('button').filter({ hasText: /抽卡|占卜|開始/i }).first();

      if (await drawButton.isVisible()) {
        await drawButton.click();

        // 等待結果顯示
        await page.waitForTimeout(1500);

        // 驗證有結果顯示（卡牌或解釋文字）
        const hasResult =
          (await page.locator('[data-testid*="card"]').count()) > 0 ||
          (await page.locator('text=/解釋|意義|含義/i').count()) > 0;

        expect(hasResult).toBeTruthy();
      }
    });
  });
});
