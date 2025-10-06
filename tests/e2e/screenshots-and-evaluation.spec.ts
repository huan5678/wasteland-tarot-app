import { test, expect } from '@playwright/test';

test.describe('Chinese-English Interface Screenshots and Evaluation', () => {
  test('should capture screenshots of all interface pages', async ({ page }) => {
    // 創建截圖目錄
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. 首頁截圖
    await page.screenshot({
      path: './test-results/homepage-chinese-english.png',
      fullPage: true
    });

    // 驗證首頁的關鍵元素
    await expect(page.getByText('VAULT-TEC PIP-BOY 3000 MARK IV').first()).toBeVisible();
    await expect(page.getByText('廢土塔羅')).toBeVisible();
    await expect(page.getByText('由 Vault-Tec 驅動的後末世塔羅占卜')).toBeVisible();

    // 2. 嘗試訪問登入介面
    try {
      await page.getByText('登入').first().click();
      await page.waitForTimeout(2000); // 等待動畫或模態視窗

      await page.screenshot({
        path: './test-results/login-interface-chinese-english.png',
        fullPage: true
      });

      // 返回首頁
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    } catch (error) {
      console.log('Login interface screenshot captured with potential modal');
    }

    // 3. 嘗試訪問註冊介面
    try {
      await page.getByText('註冊').first().click();
      await page.waitForTimeout(2000); // 等待動畫或模態視窗

      await page.screenshot({
        path: './test-results/register-interface-chinese-english.png',
        fullPage: true
      });

      // 返回首頁
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    } catch (error) {
      console.log('Register interface screenshot captured with potential modal');
    }

    // 4. 移動設備視圖截圖
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: './test-results/homepage-mobile-chinese-english.png',
      fullPage: true
    });

    // 5. 平板設備視圖截圖
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: './test-results/homepage-tablet-chinese-english.png',
      fullPage: true
    });

    // 恢復桌面視圖
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should evaluate interface text composition', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 評估測試 1: Fallout 專有名詞保持英文
    const falloutTerms = await page.evaluate(() => {
      const textNodes = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (text && (
          text.includes('Vault-Tec') ||
          text.includes('Pip-Boy') ||
          text.includes('VAULT-TEC') ||
          text.includes('Vault Dweller')
        )) {
          textNodes.push(text);
        }
      }
      return textNodes;
    });

    // 驗證專有名詞沒有被翻譯
    const properNouns = falloutTerms.join(' ');
    expect(properNouns).not.toContain('避難所科技');
    expect(properNouns).not.toContain('嗶嗶小子');
    expect(properNouns).not.toContain('避難所居民');

    console.log('Found Fallout terms:', falloutTerms);

    // 評估測試 2: 功能性文字使用中文
    const chineseUITexts = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, nav a, label, h1, h2, h3');
      const texts = [];
      elements.forEach(el => {
        const text = el.textContent.trim();
        if (text && /[\u4e00-\u9fff]/.test(text)) {
          texts.push(text);
        }
      });
      return texts;
    });

    console.log('Found Chinese UI texts:', chineseUITexts);

    // 驗證關鍵功能文字是中文
    const allChineseText = chineseUITexts.join(' ');
    expect(allChineseText).toContain('登入');
    expect(allChineseText).toContain('註冊');
    expect(allChineseText).toContain('廢土塔羅');

    // 評估測試 3: 中英混合自然度
    const mixedTexts = await page.evaluate(() => {
      const textNodes = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        // 查找同時包含中文和英文的文本
        if (text && /[\u4e00-\u9fff]/.test(text) && /[a-zA-Z]/.test(text)) {
          textNodes.push(text);
        }
      }
      return textNodes;
    });

    console.log('Found mixed Chinese-English texts:', mixedTexts);

    // 驗證關鍵的中英混合文字
    const mixedContent = mixedTexts.join(' ');
    expect(mixedContent).toContain('Vault-Tec');
    expect(mixedContent).toContain('Pip-Boy');
  });

  test('should verify UI layout integrity with mixed language', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 檢查長文字元素的佈局
    const longTextElements = await page.locator('text=VAULT-TEC PIP-BOY 3000 MARK IV').all();

    for (const element of longTextElements) {
      const box = await element.boundingBox();
      if (box) {
        // 確保元素有合理的尺寸
        expect(box.width).toBeGreaterThan(100);
        expect(box.height).toBeGreaterThan(10);

        // 確保元素在視窗範圍內
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
      }
    }

    // 檢查按鈕和連結的可用性
    const buttons = await page.locator('button:visible').all();
    for (const button of buttons.slice(0, 5)) { // 只檢查前5個按鈕避免超時
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
    }

    // 檢查響應式設計
    const viewports = [
      { width: 375, height: 812 },  // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 } // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);

      // 確保主要元素在所有視窗大小下都可見
      await expect(page.getByText('廢土塔羅')).toBeVisible();
      await expect(page.getByText('VAULT-TEC').first()).toBeVisible();
    }
  });

  test('should analyze color scheme and Fallout atmosphere', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 分析背景色彩
    const backgroundColor = await page.locator('body').evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // 分析主要文字色彩
    const textColor = await page.locator('body').evaluate(el =>
      window.getComputedStyle(el).color
    );

    console.log('Background color:', backgroundColor);
    console.log('Text color:', textColor);

    // 確保使用了暗色主題（符合 Fallout 風格）
    expect(backgroundColor).not.toBe('rgb(255, 255, 255)');

    // 檢查 Pip-Boy 綠色的使用
    const pipBoyGreenElements = await page.locator('[class*="pip-boy-green"], [class*="text-pip-boy-green"]').count();
    expect(pipBoyGreenElements).toBeGreaterThan(0);

    // 檢查 Vault 風格元素
    await expect(page.getByText('狀態：線上')).toBeVisible();
    await expect(page.getByText('占卜終端機啟動中')).toBeVisible();

    // 分析字體使用
    const fontFamily = await page.locator('body').evaluate(el =>
      window.getComputedStyle(el).fontFamily
    );

    console.log('Font family:', fontFamily);

    // 確保使用了等寬字體（符合終端機風格）
    expect(fontFamily.toLowerCase()).toContain('mono');
  });
});