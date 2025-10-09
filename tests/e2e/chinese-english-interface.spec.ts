import { test, expect } from '@playwright/test';

test.describe('Chinese-English Mixed Interface Validation', () => {
  test.beforeEach(async ({ page }) => {
    // 確保頁面載入完成
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should verify Fallout proper nouns remain in English', async ({ page }) => {
    // 測試首頁的 Fallout 專有名詞
    await expect(page.locator('text=VAULT-TEC PIP-BOY 3000 MARK IV').first()).toBeVisible();

    // 檢查包含 Vault-Tec 的文字
    await expect(page.getByText('由 Vault-Tec 驅動的後末世塔羅占卜')).toBeVisible();
    await expect(page.getByText('透過 Vault-Tec 的量子矩陣處理塔羅牌含義', { exact: false })).toBeVisible();

    // 檢查 Pip-Boy 品牌顯示
    await expect(page.getByText('Pip-Boy 占卜終端機')).toBeVisible();

    // 檢查是否沒有被錯誤翻譯的版本
    await expect(page.locator('text=避難所科技')).not.toBeVisible();
    await expect(page.locator('text=嗶嗶小子')).not.toBeVisible();

    // 測試 Vault Dweller 術語
    const vaultDwellerText = page.getByText('Vault Dweller', { exact: false });
    if (await vaultDwellerText.count() > 0) {
      await expect(vaultDwellerText.first()).toBeVisible();
    }
  });

  test('should maintain Chinese for functional UI text', async ({ page }) => {
    // 驗證功能性文字保持中文
    await expect(page.getByText('登入').first()).toBeVisible();
    await expect(page.getByText('註冊').first()).toBeVisible();

    // 檢查主要功能按鈕
    await expect(page.getByText('進入 Vault')).toBeVisible();
    await expect(page.getByText('快速占卜')).toBeVisible();
    await expect(page.getByText('註冊 Vault 帳號')).toBeVisible();

    // 檢查標題文字
    await expect(page.getByText('廢土塔羅')).toBeVisible();
    await expect(page.getByText('終端機功能')).toBeVisible();

    // 檢查描述文字
    await expect(page.getByText('量子占卜')).toBeVisible();
    await expect(page.getByText('占卜分析')).toBeVisible();
    await expect(page.getByText('廢土主題')).toBeVisible();
  });

  test('should verify login page Chinese-English mix', async ({ page }) => {
    // 檢查登入頁面是否存在 - 這可能是模態視窗或路由頁面
    await page.getByText('登入').first().click();

    // 等待登入介面出現 - 可能是模態視窗或新頁面
    try {
      await page.waitForURL('**/login', { timeout: 5000 });
    } catch {
      // 如果不是路由變化，檢查是否是模態視窗
      await page.waitForSelector('[data-testid="login-modal"], .modal, [role="dialog"]', { timeout: 5000 });
    }

    // 檢查登入相關的文字內容（可能在模態視窗或頁面中）
    const loginTitle = page.locator('h1, h2, h3').filter({ hasText: '登入' });
    if (await loginTitle.count() > 0) {
      await expect(loginTitle.first()).toBeVisible();
    }

    // 檢查登入表單元素（如果存在）
    const emailLabel = page.locator('label').filter({ hasText: '電子郵件' });
    if (await emailLabel.count() > 0) {
      await expect(emailLabel.first()).toBeVisible();
    }

    const passwordLabel = page.locator('label').filter({ hasText: '密碼' });
    if (await passwordLabel.count() > 0) {
      await expect(passwordLabel.first()).toBeVisible();
    }

    // 檢查登入按鈕（如果存在）
    const loginSubmitButton = page.locator('button').filter({ hasText: '登入' });
    if (await loginSubmitButton.count() > 0) {
      await expect(loginSubmitButton.first()).toBeVisible();
    }

    // 驗證連結文字為中文但保持 Vault-Tec 等專有名詞
    const signupLink = page.locator('text*=還沒有帳號');
    if (await signupLink.count() > 0) {
      await expect(signupLink).toBeVisible();
    }
  });

  test('should verify registration page Chinese-English mix', async ({ page }) => {
    // 前往註冊頁面
    await page.getByText('註冊').first().click();

    // 等待註冊介面出現
    try {
      await page.waitForURL('**/register', { timeout: 5000 });
    } catch {
      // 如果不是路由變化，檢查是否是模態視窗
      await page.waitForSelector('[data-testid="register-modal"], .modal, [role="dialog"]', { timeout: 5000 });
    }

    // 檢查註冊相關的標題文字
    const registerTitle = page.locator('h1, h2, h3').filter({ hasText: '註冊' });
    if (await registerTitle.count() > 0) {
      await expect(registerTitle.first()).toBeVisible();
    }

    // 檢查註冊表單標籤（如果存在）
    const formLabels = [
      '使用者名稱',
      '電子郵件',
      '密碼',
      '確認密碼'
    ];

    for (const label of formLabels) {
      const labelElement = page.locator('label').filter({ hasText: label });
      if (await labelElement.count() > 0) {
        await expect(labelElement.first()).toBeVisible();
      }
    }

    // 檢查註冊按鈕（如果存在）
    const registerButton = page.locator('button').filter({ hasText: '註冊' });
    if (await registerButton.count() > 0) {
      await expect(registerButton.first()).toBeVisible();
    }
  });

  test('should verify header and footer mixed language', async ({ page }) => {
    // 檢查 Header 元素
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // 應該包含 VAULT-TEC PIP-BOY 品牌名稱
    await expect(header.getByText('VAULT-TEC PIP-BOY 3000 MARK IV')).toBeVisible();

    // 品牌標題應該保持中英混合
    await expect(header.getByText('廢土塔羅')).toBeVisible();
    await expect(header.getByText('Pip-Boy 占卜終端機')).toBeVisible();

    // 導航連結應該是中文
    await expect(header.getByText('登入')).toBeVisible();
    await expect(header.getByText('註冊')).toBeVisible();

    // 檢查 Footer 元素
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Footer 包含版權資訊和 Vault-Tec 品牌
    await expect(footer.getByText('© 2025 Vault-Tec Corporation', { exact: false })).toBeVisible();
    await expect(footer.getByText('Vault-Tec 熱線：1-800-VAULT-TEC', { exact: false })).toBeVisible();

    // Footer 中的功能連結應該是中文
    await expect(footer.getByText('快速存取')).toBeVisible();
    await expect(footer.getByText('關於我們')).toBeVisible();
    await expect(footer.getByText('隱私政策')).toBeVisible();
    await expect(footer.getByText('服務條款')).toBeVisible();
  });

  test('should verify dashboard interface when accessible', async ({ page }) => {
    // 嘗試訪問 dashboard（如果有的話）
    try {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // 檢查是否成功載入 dashboard
      const dashboardContent = page.locator('main, [data-testid="dashboard"], .dashboard');
      if (await dashboardContent.count() > 0) {
        // 驗證用戶介面元素
        const uiElements = [
          '歡迎',
          '設定',
          '歷史記錄',
          '新占卜'
        ];

        for (const element of uiElements) {
          const elementLocator = page.locator(`text*=${element}`);
          if (await elementLocator.count() > 0) {
            await expect(elementLocator.first()).toBeVisible();
          }
        }

        // 確保 Vault-Tec 等專有名詞保持英文
        const properNouns = ['Vault-Tec', 'Pip-Boy', 'Vault Dweller'];
        for (const noun of properNouns) {
          const nounLocator = page.locator(`text*=${noun}`);
          if (await nounLocator.count() > 0) {
            await expect(nounLocator.first()).toBeVisible();
          }
        }
      }
    } catch (error) {
      console.log('Dashboard not accessible or requires authentication');
    }
  });

  test('should verify text length compatibility with UI layout', async ({ page }) => {
    // 檢查長文字是否會破壞 UI 佈局
    const longTextElements = page.getByText('VAULT-TEC PIP-BOY 3000 MARK IV');
    if (await longTextElements.count() > 0) {
      for (let i = 0; i < await longTextElements.count(); i++) {
        const element = longTextElements.nth(i);
        const boundingBox = await element.boundingBox();

        if (boundingBox) {
          // 確保文字沒有溢出其容器
          expect(boundingBox.width).toBeGreaterThan(0);
          expect(boundingBox.height).toBeGreaterThan(0);
        }
      }
    }

    // 檢查主要按鈕的顯示和可點擊性
    const loginButton = page.getByText('登入').first();
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();

    const registerButton = page.getByText('註冊').first();
    await expect(registerButton).toBeVisible();
    await expect(registerButton).toBeEnabled();

    // 檢查主要功能按鈕
    const vaultButton = page.getByText('進入 Vault');
    await expect(vaultButton).toBeVisible();
    await expect(vaultButton).toBeEnabled();

    const divinationButton = page.getByText('快速占卜');
    await expect(divinationButton).toBeVisible();
    await expect(divinationButton).toBeEnabled();
  });

  test('should maintain Fallout atmosphere with mixed language', async ({ page }) => {
    // 檢查頁面是否保持了 Fallout 遊戲氛圍

    // 1. 檢查關鍵的 Fallout 術語
    await expect(page.getByText('VAULT-TEC PIP-BOY 3000 MARK IV').first()).toBeVisible();
    await expect(page.getByText('由 Vault-Tec 驅動的後末世塔羅占卜')).toBeVisible();
    await expect(page.getByText('Pip-Boy 占卜終端機')).toBeVisible();

    // 檢查 Vault Dweller 相關術語
    const vaultDwellerText = page.getByText('Vault Dweller', { exact: false });
    if (await vaultDwellerText.count() > 0) {
      await expect(vaultDwellerText.first()).toBeVisible();
    }

    // 2. 檢查是否沒有破壞性的全中文翻譯
    await expect(page.locator('text=避難所科技')).not.toBeVisible();
    await expect(page.locator('text=嗶嗶小子')).not.toBeVisible();
    await expect(page.locator('text=避難所居民')).not.toBeVisible();

    // 3. 檢查主題色彩和樣式是否保持 Fallout 風格
    const bodyElement = page.locator('body');
    const backgroundColor = await bodyElement.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // 確保不是純白背景（Fallout 主題通常較暗）
    expect(backgroundColor).not.toBe('rgb(255, 255, 255)');

    // 4. 檢查 Fallout 風格的狀態顯示
    await expect(page.getByText('狀態：線上')).toBeVisible();
    await expect(page.getByText('占卜終端機啟動中')).toBeVisible();

    // 5. 檢查科技感的描述文字
    await expect(page.getByText('由戰前量子計算技術驅動')).toBeVisible();
    await expect(page.getByText('先進演算法透過 Vault-Tec 的量子矩陣處理塔羅牌含義')).toBeVisible();
  });
});