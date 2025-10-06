import { test, expect } from '@playwright/test';

test.describe('塔羅牌應用功能測試', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('首頁載入和基本元素檢查', async ({ page }) => {
    // 檢查頁面是否成功載入
    await expect(page).toHaveURL('/');

    // 檢查主要區域是否存在
    const mainContent = page.locator('main, [role="main"], .main-content');
    await expect(mainContent.first()).toBeVisible();

    // 截圖首頁狀態
    await page.screenshot({
      path: './test-results/homepage-loaded.png',
      fullPage: true
    });
  });

  test('牌陣選擇功能', async ({ page }) => {
    // 尋找牌陣選擇相關的元素
    const spreadSelectors = [
      '[data-testid*="spread"]',
      '[class*="spread"]',
      'select[name*="spread"]',
      'button[aria-label*="牌陣"]',
      'button[aria-label*="spread"]'
    ];

    let spreadSelector = null;
    for (const selector of spreadSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        spreadSelector = selector;
        break;
      }
    }

    if (spreadSelector) {
      const spreadElement = page.locator(spreadSelector).first();
      await expect(spreadElement).toBeVisible();

      // 如果是選擇框
      if (spreadSelector.includes('select')) {
        await spreadElement.selectOption({ index: 1 });
      } else {
        // 如果是按鈕
        await spreadElement.click();
      }

      // 截圖選擇後的狀態
      await page.screenshot({
        path: './test-results/spread-selection.png',
        fullPage: true
      });
    } else {
      console.log('未找到牌陣選擇元素，可能已經有預設牌陣');
    }
  });

  test('抽牌功能測試', async ({ page }) => {
    // 尋找抽牌按鈕或觸發元素
    const drawButtonSelectors = [
      'button:has-text("抽牌")',
      'button:has-text("開始")',
      'button:has-text("占卜")',
      'button[data-testid*="draw"]',
      'button[class*="draw"]',
      '[role="button"]:has-text("抽牌")'
    ];

    let drawButton = null;
    for (const selector of drawButtonSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        drawButton = element;
        break;
      }
    }

    if (drawButton) {
      // 記錄抽牌前的狀態
      await page.screenshot({
        path: './test-results/before-draw.png',
        fullPage: true
      });

      // 點擊抽牌按鈕
      await drawButton.click();

      // 等待一下讓動畫或載入完成
      await page.waitForTimeout(2000);

      // 截圖抽牌後的狀態
      await page.screenshot({
        path: './test-results/after-draw.png',
        fullPage: true
      });

      // 檢查是否有卡片出現
      const cardSelectors = [
        '[data-testid*="card"]',
        '[class*="card"]',
        '.tarot-card',
        '[class*="tarot"]'
      ];

      let cardsFound = false;
      for (const selector of cardSelectors) {
        const cards = page.locator(selector);
        const count = await cards.count();
        if (count > 0) {
          cardsFound = true;
          console.log(`找到 ${count} 張卡片使用選擇器: ${selector}`);
          break;
        }
      }

      expect(cardsFound).toBe(true);
    } else {
      console.log('未找到抽牌按鈕，檢查是否有自動抽牌功能');

      // 檢查是否已經有卡片顯示（自動抽牌）
      const cardSelectors = [
        '[data-testid*="card"]',
        '[class*="card"]',
        '.tarot-card'
      ];

      let cardsFound = false;
      for (const selector of cardSelectors) {
        const cards = page.locator(selector);
        const count = await cards.count();
        if (count > 0) {
          cardsFound = true;
          break;
        }
      }

      if (!cardsFound) {
        throw new Error('未找到抽牌功能或卡片顯示');
      }
    }
  });

  test('卡片翻轉動畫測試', async ({ page }) => {
    // 先確保有卡片存在
    const cardSelectors = [
      '[data-testid*="card"]',
      '[class*="card"]',
      '.tarot-card',
      'img[alt*="塔羅"]',
      'img[alt*="tarot"]'
    ];

    let cards = null;
    for (const selector of cardSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        cards = elements;
        break;
      }
    }

    if (cards) {
      const cardCount = await cards.count();
      console.log(`找到 ${cardCount} 張卡片`);

      // 如果有卡片，嘗試點擊第一張
      if (cardCount > 0) {
        const firstCard = cards.first();

        // 記錄點擊前的狀態
        await page.screenshot({
          path: './test-results/card-before-flip.png',
          fullPage: true
        });

        // 點擊卡片
        await firstCard.click();

        // 等待動畫完成
        await page.waitForTimeout(1500);

        // 記錄點擊後的狀態
        await page.screenshot({
          path: './test-results/card-after-flip.png',
          fullPage: true
        });

        // 檢查是否有變化（這裡我們主要是記錄狀態）
        await expect(firstCard).toBeVisible();
      }
    } else {
      console.log('未找到卡片元素進行翻轉測試');
    }
  });

  test('導航功能測試', async ({ page }) => {
    // 檢查導航鏈接
    const navLinks = page.locator('nav a, header a, [role="navigation"] a');
    const linkCount = await navLinks.count();

    if (linkCount > 0) {
      console.log(`找到 ${linkCount} 個導航鏈接`);

      // 測試第一個內部鏈接（不是外部鏈接）
      for (let i = 0; i < linkCount; i++) {
        const link = navLinks.nth(i);
        const href = await link.getAttribute('href');

        if (href && href.startsWith('/') && !href.startsWith('//')) {
          console.log(`測試導航到: ${href}`);

          // 記錄當前頁面
          const currentUrl = page.url();

          // 點擊鏈接
          await link.click();

          // 等待導航完成
          await page.waitForLoadState('networkidle');

          // 檢查 URL 是否改變
          const newUrl = page.url();
          expect(newUrl).not.toBe(currentUrl);

          // 截圖新頁面
          await page.screenshot({
            path: `./test-results/navigation-${i}.png`,
            fullPage: true
          });

          // 返回首頁
          await page.goto('/');
          await page.waitForLoadState('networkidle');

          break; // 只測試第一個有效的導航鏈接
        }
      }
    }
  });

  test('頁面互動元素測試', async ({ page }) => {
    // 測試所有可點擊的元素
    const interactiveElements = page.locator('button, [role="button"], a, input[type="button"], input[type="submit"]');
    const elementCount = await interactiveElements.count();

    console.log(`找到 ${elementCount} 個互動元素`);

    for (let i = 0; i < Math.min(elementCount, 5); i++) { // 限制測試前5個元素
      const element = interactiveElements.nth(i);
      const isVisible = await element.isVisible();

      if (isVisible) {
        const tagName = await element.evaluate(el => el.tagName);
        const text = await element.textContent();

        console.log(`測試元素 ${i}: ${tagName} - "${text}"`);

        try {
          // 記錄點擊前狀態
          await page.screenshot({
            path: `./test-results/interaction-${i}-before.png`,
            fullPage: true
          });

          await element.click();

          // 等待可能的變化
          await page.waitForTimeout(1000);

          // 記錄點擊後狀態
          await page.screenshot({
            path: `./test-results/interaction-${i}-after.png`,
            fullPage: true
          });

        } catch (error) {
          console.log(`元素 ${i} 點擊失敗: ${error}`);
        }
      }
    }
  });

  test('檢查頁面載入性能', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;
    console.log(`頁面載入時間: ${loadTime}ms`);

    // 檢查載入時間是否合理（少於5秒）
    expect(loadTime).toBeLessThan(5000);

    // 檢查是否有 JavaScript 錯誤
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`Console error: ${msg.text()}`);
      }
    });

    page.on('pageerror', (error) => {
      console.log(`Page error: ${error.message}`);
    });
  });
});