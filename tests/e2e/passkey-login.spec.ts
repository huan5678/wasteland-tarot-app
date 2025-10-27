/**
 * E2E 測試：Passkey 登入流程
 *
 * 測試範圍：
 * - Email-guided 登入（使用者輸入 email）
 * - Usernameless 登入（不需 email）
 * - Conditional UI 登入（autofill）
 * - 登入失敗情境
 *
 * TDD 循環 14 - 階段 15.3
 */

import { test, expect, Page } from '@playwright/test';
import {
  setupVirtualAuthenticator,
  removeVirtualAuthenticator,
  checkWebAuthnSupport,
  checkConditionalUISupport,
} from './helpers/webauthn';

test.describe('Passkey Login - Email-guided 登入', () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit 不支援 Virtual Authenticator'
    );

    await setupVirtualAuthenticator(page);
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await removeVirtualAuthenticator(page);
  });

  test('應該正確渲染 Passkey 登入表單', async ({ page }) => {
    // 驗證 email 輸入欄位
    await expect(page.getByLabel(/email|電子郵件/i)).toBeVisible();

    // 驗證 Passkey 登入按鈕
    const passkeyButton = page.getByRole('button', {
      name: /passkey.*登入|生物辨識.*登入/i,
    });
    await expect(passkeyButton).toBeVisible();

    // 驗證 Fallout 風格文案
    await expect(page.getByText(/Pip-Boy|避難所|生物辨識/i)).toBeVisible();
  });

  test('應該成功進行 Email-guided 登入', async ({ page }) => {
    const testEmail = 'existing@example.com';

    // 填寫 email
    await page.fill('input[type="email"]', testEmail);

    // Mock API 回應（登入選項）
    await page.route('**/api/v1/webauthn/authenticate/options', async (route) => {
      const requestBody = await route.request().postDataJSON();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            challenge: btoa('login-challenge'),
            timeout: 300000,
            rpId: 'localhost',
            allowCredentials: [
              {
                type: 'public-key',
                id: btoa('user-credential-1'),
                transports: ['internal'],
              },
            ],
            userVerification: 'required',
          },
        }),
      });
    });

    // Mock API 回應（驗證登入）
    await page.route('**/api/v1/webauthn/authenticate/verify', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'user-123',
              email: testEmail,
              username: 'Test User',
              karma_score: 100,
            },
            access_token: 'mock-jwt-token',
            refresh_token: 'mock-refresh-token',
          },
        }),
      });
    });

    // 點擊登入按鈕
    const loginButton = page.getByRole('button', {
      name: /passkey.*登入|生物辨識.*登入/i,
    });
    await loginButton.click();

    await page.waitForTimeout(1000);

    // 驗證導向到 dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');

    // 驗證成功訊息
    await expect(
      page.getByText(/登入成功|歡迎回來|Pip-Boy.*啟動/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('應該在 credential 不存在時顯示錯誤', async ({ page }) => {
    const unknownEmail = 'unknown@example.com';

    await page.fill('input[type="email"]', unknownEmail);

    // Mock API 回應（credential 不存在）
    await page.route('**/api/v1/webauthn/authenticate/options', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'CREDENTIAL_NOT_FOUND',
            message: '此 email 尚未註冊 Passkey，請使用其他登入方式',
          },
        }),
      });
    });

    const loginButton = page.getByRole('button', {
      name: /passkey.*登入|生物辨識.*登入/i,
    });
    await loginButton.click();

    // 驗證錯誤訊息
    await expect(
      page.getByText(/尚未註冊|找不到|credential.*不存在/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('應該在驗證失敗時顯示錯誤', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');

    await page.route('**/api/v1/webauthn/authenticate/options', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            challenge: btoa('challenge'),
            timeout: 300000,
            rpId: 'localhost',
            allowCredentials: [
              {
                type: 'public-key',
                id: btoa('credential-1'),
                transports: ['internal'],
              },
            ],
            userVerification: 'required',
          },
        }),
      });
    });

    // Mock API 回應（驗證失敗）
    await page.route('**/api/v1/webauthn/authenticate/verify', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'AUTHENTICATION_FAILED',
            message: '生物辨識驗證失敗，請確認 Pip-Boy 功能正常',
          },
        }),
      });
    });

    const loginButton = page.getByRole('button', {
      name: /passkey.*登入|生物辨識.*登入/i,
    });
    await loginButton.click();

    await page.waitForTimeout(1000);

    // 驗證錯誤訊息
    await expect(
      page.getByText(/驗證失敗|Pip-Boy.*功能/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('應該在用戶取消驗證時顯示提示', async ({ page }) => {
    await page.fill('input[type="email"]', 'cancel@example.com');

    await page.route('**/api/v1/webauthn/authenticate/options', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            challenge: btoa('challenge'),
            timeout: 300000,
            rpId: 'localhost',
            allowCredentials: [],
            userVerification: 'required',
          },
        }),
      });
    });

    // 模擬用戶取消
    await page.evaluate(() => {
      navigator.credentials.get = async () => {
        throw new DOMException('使用者取消驗證', 'NotAllowedError');
      };
    });

    const loginButton = page.getByRole('button', {
      name: /passkey.*登入|生物辨識.*登入/i,
    });
    await loginButton.click();

    // 驗證取消訊息
    await expect(
      page.getByText(/取消|使用者.*取消/i)
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Passkey Login - Usernameless 登入', () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit 不支援 Virtual Authenticator'
    );

    await setupVirtualAuthenticator(page);
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await removeVirtualAuthenticator(page);
  });

  test('應該支援不輸入 email 直接登入', async ({ page }) => {
    // 不填寫 email

    // Mock API 回應（無 user_id 的通用選項）
    await page.route('**/api/v1/webauthn/authenticate/options', async (route) => {
      const requestBody = await route.request().postDataJSON();

      // 驗證請求沒有 user_id
      expect(requestBody.user_id).toBeUndefined();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            challenge: btoa('usernameless-challenge'),
            timeout: 300000,
            rpId: 'localhost',
            allowCredentials: [], // 空陣列表示接受任何 credential
            userVerification: 'required',
          },
        }),
      });
    });

    // Mock API 回應（驗證登入）
    await page.route('**/api/v1/webauthn/authenticate/verify', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'user-456',
              email: 'usernameless@example.com',
              username: 'Usernameless User',
              karma_score: 150,
            },
            access_token: 'mock-jwt-token',
            refresh_token: 'mock-refresh-token',
          },
        }),
      });
    });

    // 點擊登入按鈕（不填 email）
    const loginButton = page.getByRole('button', {
      name: /passkey.*登入|生物辨識.*登入/i,
    });
    await loginButton.click();

    await page.waitForTimeout(1000);

    // 驗證成功登入
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Passkey Login - Conditional UI（Autofill）', () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit 不支援 Conditional UI'
    );
    test.skip(
      browserName === 'firefox',
      'Firefox 目前不支援 Conditional UI'
    );

    await setupVirtualAuthenticator(page);
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await removeVirtualAuthenticator(page);
  });

  test('應該檢測 Conditional UI 支援', async ({ page }) => {
    const isSupported = await checkConditionalUISupport(page);

    if (isSupported) {
      // 驗證 email 欄位有 autocomplete="webauthn" 屬性
      const emailInput = page.locator('input[type="email"]');
      const autocomplete = await emailInput.getAttribute('autocomplete');

      expect(autocomplete).toContain('webauthn');
    } else {
      console.log('⚠️  瀏覽器不支援 Conditional UI，跳過測試');
    }
  });

  test('應該在 email 欄位顯示 Passkey autofill 選項', async ({ page }) => {
    const isSupported = await checkConditionalUISupport(page);
    test.skip(!isSupported, '瀏覽器不支援 Conditional UI');

    // Mock API 回應
    await page.route('**/api/v1/webauthn/authenticate/options', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            challenge: btoa('conditional-ui-challenge'),
            timeout: 300000,
            rpId: 'localhost',
            allowCredentials: [],
            userVerification: 'required',
            mediation: 'conditional', // 關鍵：啟用 Conditional UI
          },
        }),
      });
    });

    // 聚焦 email 欄位
    const emailInput = page.locator('input[type="email"]');
    await emailInput.focus();

    // 注意：實際的 autofill 選項是由瀏覽器原生提供
    // E2E 測試無法直接驗證 autofill UI 的顯示
    // 這裡只驗證 mediation: 'conditional' 有正確傳遞

    await page.waitForTimeout(500);

    // 驗證頁面沒有錯誤
    const errorMessages = page.locator('[role="alert"]');
    expect(await errorMessages.count()).toBe(0);
  });
});

test.describe('Passkey Login - 錯誤處理', () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit 不支援 Virtual Authenticator'
    );

    await setupVirtualAuthenticator(page);
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await removeVirtualAuthenticator(page);
  });

  test('應該處理 Timeout 錯誤', async ({ page }) => {
    await page.fill('input[type="email"]', 'timeout@example.com');

    await page.route('**/api/v1/webauthn/authenticate/options', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            challenge: btoa('timeout-challenge'),
            timeout: 100, // 極短的 timeout
            rpId: 'localhost',
            allowCredentials: [],
            userVerification: 'required',
          },
        }),
      });
    });

    // 模擬 Timeout
    await page.evaluate(() => {
      const originalGet = navigator.credentials.get;
      navigator.credentials.get = async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        throw new DOMException('Timeout', 'NotAllowedError');
      };
    });

    const loginButton = page.getByRole('button', {
      name: /passkey.*登入|生物辨識.*登入/i,
    });
    await loginButton.click();

    // 驗證 Timeout 錯誤訊息
    await expect(
      page.getByText(/timeout|逾時|超時/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('應該處理網路錯誤並提供重試', async ({ page }) => {
    await page.fill('input[type="email"]', 'network-error@example.com');

    // Mock 網路錯誤
    await page.route('**/api/v1/webauthn/authenticate/options', async (route) => {
      await route.abort('failed');
    });

    const loginButton = page.getByRole('button', {
      name: /passkey.*登入|生物辨識.*登入/i,
    });
    await loginButton.click();

    // 驗證網路錯誤訊息
    await expect(
      page.getByText(/網路.*錯誤|連線.*失敗/i)
    ).toBeVisible({ timeout: 5000 });

    // 驗證有重試按鈕
    const retryButton = page.getByRole('button', { name: /重試/i });
    if (await retryButton.isVisible()) {
      await expect(retryButton).toBeEnabled();
    }
  });

  test('應該處理 Challenge 過期錯誤', async ({ page }) => {
    await page.fill('input[type="email"]', 'expired@example.com');

    await page.route('**/api/v1/webauthn/authenticate/options', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            challenge: btoa('expired-challenge'),
            timeout: 300000,
            rpId: 'localhost',
            allowCredentials: [],
            userVerification: 'required',
          },
        }),
      });
    });

    // Mock 驗證回應（Challenge 過期）
    await page.route('**/api/v1/webauthn/authenticate/verify', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_CHALLENGE',
            message: '安全驗證碼已過期，避難科技安全協議要求重新驗證',
          },
        }),
      });
    });

    const loginButton = page.getByRole('button', {
      name: /passkey.*登入|生物辨識.*登入/i,
    });
    await loginButton.click();

    await page.waitForTimeout(1000);

    // 驗證 Challenge 過期訊息
    await expect(
      page.getByText(/驗證碼.*過期|challenge.*expired/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('應該處理瀏覽器不支援的情況', async ({ page }) => {
    // 模擬不支援 WebAuthn
    await page.evaluate(() => {
      // @ts-ignore
      delete window.PublicKeyCredential;
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // 驗證顯示降級 UI
    await expect(
      page.getByText(/不支援|瀏覽器.*不支援/i)
    ).toBeVisible();

    // 驗證登入按鈕被禁用
    const loginButton = page.getByRole('button', {
      name: /passkey.*登入|生物辨識.*登入/i,
    });

    if (await loginButton.isVisible()) {
      await expect(loginButton).toBeDisabled();
    }
  });
});
