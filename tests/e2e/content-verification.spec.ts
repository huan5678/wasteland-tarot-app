import { test, expect } from '@playwright/test';

test.describe('內容檢查 - 中文化驗證', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');
  });

  test('首頁標題和主要內容應該是中文', async ({ page }) => {
    // 檢查頁面標題
    await expect(page).toHaveTitle(/塔羅|占卜|廢土塔羅/);

    // 檢查主標題
    const mainHeading = page.locator('h1').first();
    await expect(mainHeading).toBeVisible();

    // 檢查是否包含中文字符
    const headingText = await mainHeading.textContent();
    expect(headingText).toMatch(/[\u4e00-\u9fff]/); // 中文字符範圍

    // 截圖保存當前頁面狀態
    await page.screenshot({
      path: './test-results/homepage-content.png',
      fullPage: true
    });
  });

  test('導航菜單應該是中文', async ({ page }) => {
    // 檢查導航鏈接
    const navLinks = page.locator('nav a, header a, [role="navigation"] a');
    const linkCount = await navLinks.count();

    if (linkCount > 0) {
      for (let i = 0; i < linkCount; i++) {
        const link = navLinks.nth(i);
        const linkText = await link.textContent();
        if (linkText && linkText.trim()) {
          // 確保導航文字是中文或合理的英文（如 "logo"）
          expect(linkText).toMatch(/[\u4e00-\u9fff]|^(logo|home|about)$/i);
        }
      }
    }
  });

  test('按鈕文字應該是中文', async ({ page }) => {
    // 檢查所有按鈕
    const buttons = page.locator('button, [role="button"], input[type="button"], input[type="submit"]');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const isVisible = await button.isVisible();

        if (isVisible) {
          const buttonText = await button.textContent();
          if (buttonText && buttonText.trim()) {
            // 檢查按鈕文字是否為中文
            console.log(`檢查按鈕文字: "${buttonText}"`);
            expect(buttonText).toMatch(/[\u4e00-\u9fff]/);
          }
        }
      }
    }
  });

  test('表單標籤和提示文字應該是中文', async ({ page }) => {
    // 檢查標籤
    const labels = page.locator('label');
    const labelCount = await labels.count();

    for (let i = 0; i < labelCount; i++) {
      const label = labels.nth(i);
      const labelText = await label.textContent();
      if (labelText && labelText.trim()) {
        expect(labelText).toMatch(/[\u4e00-\u9fff]/);
      }
    }

    // 檢查佔位符文字
    const inputs = page.locator('input[placeholder], textarea[placeholder]');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const placeholder = await input.getAttribute('placeholder');
      if (placeholder && placeholder.trim()) {
        expect(placeholder).toMatch(/[\u4e00-\u9fff]/);
      }
    }
  });

  test('檢查是否有遺留的英文內容', async ({ page }) => {
    // 獲取頁面所有文字內容
    const pageText = await page.textContent('body');

    // 檢查常見的英文詞彙，這些可能是遺留的
    const englishPatterns = [
      /\bSelect\b/i,
      /\bChoose\b/i,
      /\bClick\b/i,
      /\bButton\b/i,
      /\bSubmit\b/i,
      /\bCancel\b/i,
      /\bNext\b/i,
      /\bPrevious\b/i,
      /\bContinue\b/i,
      /\bBack\b/i,
      /\bHome\b/i,
      /\bMenu\b/i,
      /\bSettings\b/i,
      /\bProfile\b/i,
      /\bLogin\b/i,
      /\bLogout\b/i,
      /\bSign\s+in\b/i,
      /\bSign\s+up\b/i,
    ];

    const foundEnglish: string[] = [];

    for (const pattern of englishPatterns) {
      const matches = pageText?.match(pattern);
      if (matches) {
        foundEnglish.push(...matches);
      }
    }

    if (foundEnglish.length > 0) {
      console.log('發現可能的英文內容:', foundEnglish);

      // 截圖以便檢查
      await page.screenshot({
        path: './test-results/english-content-found.png',
        fullPage: true
      });
    }

    // 這個測試可能會失敗，但會提供有用的信息
    expect(foundEnglish).toHaveLength(0);
  });

  test('檢查卡片內容是否中文化', async ({ page }) => {
    // 尋找卡片相關的元素
    const cardElements = page.locator('[class*="card"], [data-testid*="card"], .tarot-card');
    const cardCount = await cardElements.count();

    if (cardCount > 0) {
      for (let i = 0; i < cardCount; i++) {
        const card = cardElements.nth(i);
        const cardText = await card.textContent();

        if (cardText && cardText.trim()) {
          // 檢查卡片文字是否包含中文
          expect(cardText).toMatch(/[\u4e00-\u9fff]/);
        }
      }
    }
  });

  test('檢查錯誤訊息和提示文字', async ({ page }) => {
    // 檢查可能的錯誤訊息容器
    const errorSelectors = [
      '[class*="error"]',
      '[class*="warning"]',
      '[class*="alert"]',
      '[role="alert"]',
      '[data-testid*="error"]',
      '[data-testid*="message"]'
    ];

    for (const selector of errorSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();

      for (let i = 0; i < count; i++) {
        const element = elements.nth(i);
        const isVisible = await element.isVisible();

        if (isVisible) {
          const text = await element.textContent();
          if (text && text.trim()) {
            expect(text).toMatch(/[\u4e00-\u9fff]/);
          }
        }
      }
    }
  });
});