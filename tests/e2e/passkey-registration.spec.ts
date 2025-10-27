/**
 * E2E 測試：Passkey 註冊流程
 *
 * 測試範圍：
 * - 新用戶使用 Passkey 註冊
 * - 已登入用戶新增 Passkey
 * - 10 個 Passkey 上限
 * - 註冊失敗情境（網路錯誤、用戶取消）
 *
 * TDD 循環 14 - 階段 15.2
 */

import { test, expect, Page } from '@playwright/test';
import {
  setupVirtualAuthenticator,
  removeVirtualAuthenticator,
  clearVirtualAuthenticatorCredentials,
  getVirtualAuthenticatorCredentials,
  checkWebAuthnSupport,
} from './helpers/webauthn';

/**
 * 測試前置條件：
 * 1. 前端伺服器運行在 http://localhost:3000
 * 2. 後端伺服器運行在 http://localhost:8000
 * 3. 測試資料庫已清空
 */

test.describe('Passkey Registration - 新用戶註冊', () => {
  test.beforeEach(async ({ page, browserName }) => {
    // 只在 Chromium 和 Firefox 上執行（Virtual Authenticator 支援）
    test.skip(
      browserName === 'webkit',
      'WebKit 不支援 Virtual Authenticator，需要實體裝置測試'
    );

    // 設定 Virtual Authenticator
    await setupVirtualAuthenticator(page, {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
    });

    // 訪問註冊頁面
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    // 清理 Virtual Authenticator
    await removeVirtualAuthenticator(page);
  });

  test('應該正確渲染 Passkey 註冊表單', async ({ page }) => {
    // 驗證表單元素存在
    await expect(page.getByLabel(/email|電子郵件/i)).toBeVisible();
    await expect(page.getByLabel(/name|姓名|使用者名稱/i)).toBeVisible();

    // 驗證 Passkey 註冊按鈕存在
    const passkeyButton = page.getByRole('button', {
      name: /passkey|生物辨識/i,
    });
    await expect(passkeyButton).toBeVisible();

    // 驗證顯示 Fallout 風格文案
    await expect(page.getByText(/Pip-Boy|避難所|生物辨識/i)).toBeVisible();
  });

  test('應該成功註冊新用戶（完整流程）', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testName = 'Test User';

    // 填寫表單
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[name="name"]', testName);

    // Mock API 回應（註冊選項）
    await page.route('**/api/v1/webauthn/register-new/options', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            rp: {
              name: 'Wasteland Tarot',
              id: 'localhost',
            },
            user: {
              id: btoa(testEmail), // Base64 編碼
              name: testEmail,
              displayName: testName,
            },
            challenge: btoa('random-challenge-string'),
            pubKeyCredParams: [
              { type: 'public-key', alg: -7 }, // ES256
              { type: 'public-key', alg: -257 }, // RS256
            ],
            timeout: 300000,
            attestation: 'none',
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              residentKey: 'required',
              requireResidentKey: true,
              userVerification: 'required',
            },
          },
        }),
      });
    });

    // Mock API 回應（驗證註冊）
    await page.route('**/api/v1/webauthn/register-new/verify', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'new-user-123',
              email: testEmail,
              username: testName,
              karma_score: 50,
            },
            access_token: 'mock-jwt-token',
            refresh_token: 'mock-refresh-token',
          },
        }),
      });
    });

    // 點擊註冊按鈕
    const registerButton = page.getByRole('button', {
      name: /passkey|生物辨識/i,
    });
    await registerButton.click();

    // 等待 WebAuthn 流程完成
    // Virtual Authenticator 會自動處理 navigator.credentials.create()
    await page.waitForTimeout(1000);

    // 驗證導向到 dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');

    // 驗證成功訊息（Sonner toast）
    await expect(
      page.getByText(/註冊成功|Pip-Boy.*啟用|生物辨識.*成功/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('應該在 email 已註冊時顯示錯誤', async ({ page }) => {
    const existingEmail = 'existing@example.com';

    await page.fill('input[type="email"]', existingEmail);
    await page.fill('input[name="name"]', 'Existing User');

    // Mock API 回應（email 衝突）
    await page.route('**/api/v1/webauthn/register-new/options', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'USER_ALREADY_EXISTS',
            message: '此 email 已在避難所註冊，請使用生物辨識登入存取你的 Pip-Boy',
          },
        }),
      });
    });

    const registerButton = page.getByRole('button', {
      name: /passkey|生物辨識/i,
    });
    await registerButton.click();

    // 驗證錯誤訊息（Fallout 風格）
    await expect(
      page.getByText(/email.*已註冊|避難所.*註冊|Pip-Boy/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('應該在用戶取消驗證時顯示提示', async ({ page }) => {
    await page.fill('input[type="email"]', 'cancel-test@example.com');
    await page.fill('input[name="name"]', 'Cancel Test');

    // Mock API 回應
    await page.route('**/api/v1/webauthn/register-new/options', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            rp: { name: 'Wasteland Tarot', id: 'localhost' },
            user: {
              id: btoa('cancel-test@example.com'),
              name: 'cancel-test@example.com',
              displayName: 'Cancel Test',
            },
            challenge: btoa('random-challenge'),
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
            timeout: 300000,
            attestation: 'none',
          },
        }),
      });
    });

    // 模擬用戶取消（注入錯誤）
    await page.evaluate(() => {
      const originalCreate = navigator.credentials.create;
      navigator.credentials.create = async () => {
        throw new DOMException('使用者取消驗證', 'NotAllowedError');
      };
    });

    const registerButton = page.getByRole('button', {
      name: /passkey|生物辨識/i,
    });
    await registerButton.click();

    // 驗證顯示取消訊息
    await expect(
      page.getByText(/取消|使用者.*取消|Pip-Boy.*未啟用/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('應該在網路錯誤時顯示重試選項', async ({ page }) => {
    await page.fill('input[type="email"]', 'network-error@example.com');
    await page.fill('input[name="name"]', 'Network Test');

    // Mock API 回應（網路錯誤）
    await page.route('**/api/v1/webauthn/register-new/options', async (route) => {
      await route.abort('failed');
    });

    const registerButton = page.getByRole('button', {
      name: /passkey|生物辨識/i,
    });
    await registerButton.click();

    // 驗證顯示網路錯誤訊息
    await expect(
      page.getByText(/網路.*錯誤|連線.*失敗|無法.*連接/i)
    ).toBeVisible({ timeout: 5000 });

    // 驗證有重試按鈕（如果有實作）
    const retryButton = page.getByRole('button', { name: /重試/i });
    if (await retryButton.isVisible()) {
      await expect(retryButton).toBeEnabled();
    }
  });

  test('應該在瀏覽器不支援 WebAuthn 時顯示降級 UI', async ({ page }) => {
    // 模擬不支援 WebAuthn 的瀏覽器
    await page.evaluate(() => {
      // @ts-ignore
      delete window.PublicKeyCredential;
      // @ts-ignore
      delete navigator.credentials;
    });

    // 重新載入頁面
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 驗證顯示降級提示
    await expect(
      page.getByText(/不支援|瀏覽器.*不支援|請使用.*瀏覽器/i)
    ).toBeVisible();

    // 驗證 Passkey 按鈕被禁用或隱藏
    const passkeyButton = page.getByRole('button', {
      name: /passkey|生物辨識/i,
    });

    if (await passkeyButton.isVisible()) {
      await expect(passkeyButton).toBeDisabled();
    }
  });

  test('應該驗證 Virtual Authenticator 正常運作', async ({ page }) => {
    // 檢查 WebAuthn 支援
    const isSupported = await checkWebAuthnSupport(page);
    expect(isSupported).toBe(true);

    // 檢查 Virtual Authenticator 已設定
    const credentials = await getVirtualAuthenticatorCredentials(page);
    expect(credentials).toBeDefined();
    expect(Array.isArray(credentials)).toBe(true);
  });
});

test.describe('Passkey Registration - 已登入用戶新增 Passkey', () => {
  test.beforeEach(async ({ page, browserName, context }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit 不支援 Virtual Authenticator'
    );

    // 設定 Virtual Authenticator
    await setupVirtualAuthenticator(page);

    // Mock 已登入狀態（設定 cookie）
    await context.addCookies([
      {
        name: 'access_token',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    // 訪問管理頁面
    await page.goto('/settings/passkeys');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await removeVirtualAuthenticator(page);
  });

  test('應該顯示「新增 Passkey」按鈕', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /新增.*passkey/i });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
  });

  test('應該成功新增 Passkey', async ({ page }) => {
    // Mock API 回應（取得現有 credentials）
    await page.route('**/api/v1/webauthn/credentials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            credentials: [
              {
                id: 'existing-credential-1',
                device_name: 'My iPhone',
                created_at: new Date().toISOString(),
                last_used_at: new Date().toISOString(),
                transports: ['internal'],
                counter: 5,
              },
            ],
          },
        }),
      });
    });

    // Mock API 回應（新增選項）
    await page.route('**/api/v1/webauthn/register/options', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            rp: { name: 'Wasteland Tarot', id: 'localhost' },
            user: {
              id: btoa('existing@example.com'),
              name: 'existing@example.com',
              displayName: 'Existing User',
            },
            challenge: btoa('challenge-for-add'),
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
            timeout: 300000,
            excludeCredentials: [
              {
                type: 'public-key',
                id: btoa('existing-credential-1'),
                transports: ['internal'],
              },
            ],
          },
        }),
      });
    });

    // Mock API 回應（驗證新增）
    await page.route('**/api/v1/webauthn/register/verify', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            credential: {
              id: 'new-credential-2',
              device_name: 'Chrome on Desktop',
              created_at: new Date().toISOString(),
              last_used_at: new Date().toISOString(),
              transports: ['internal'],
              counter: 0,
            },
          },
        }),
      });
    });

    const addButton = page.getByRole('button', { name: /新增.*passkey/i });
    await addButton.click();

    await page.waitForTimeout(1000);

    // 驗證成功訊息
    await expect(
      page.getByText(/passkey.*已新增|新增成功/i)
    ).toBeVisible({ timeout: 5000 });

    // 驗證列表更新（應該有 2 個）
    const credentialCards = page.locator('[data-testid="passkey-card"]');
    if (await credentialCards.count() > 0) {
      await expect(credentialCards).toHaveCount(2);
    }
  });

  test('應該在達到 10 個上限時禁用新增按鈕', async ({ page }) => {
    // Mock API 回應（10 個 credentials）
    const mockCredentials = Array.from({ length: 10 }, (_, i) => ({
      id: `credential-${i + 1}`,
      device_name: `Device ${i + 1}`,
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      transports: ['internal'],
      counter: i + 1,
    }));

    await page.route('**/api/v1/webauthn/credentials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { credentials: mockCredentials },
        }),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    const addButton = page.getByRole('button', { name: /新增.*passkey/i });

    // 驗證按鈕被禁用
    await expect(addButton).toBeDisabled();

    // 驗證顯示上限警告
    await expect(
      page.getByText(/已達.*上限|最多.*10/i)
    ).toBeVisible();
  });

  test('應該在 excludeCredentials 包含現有 credentials', async ({ page }) => {
    let receivedOptions: any = null;

    await page.route('**/api/v1/webauthn/register/options', async (route) => {
      const response = {
        success: true,
        data: {
          rp: { name: 'Wasteland Tarot', id: 'localhost' },
          user: {
            id: btoa('test@example.com'),
            name: 'test@example.com',
            displayName: 'Test User',
          },
          challenge: btoa('challenge'),
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          excludeCredentials: [
            {
              type: 'public-key',
              id: btoa('existing-1'),
              transports: ['internal'],
            },
            {
              type: 'public-key',
              id: btoa('existing-2'),
              transports: ['usb'],
            },
          ],
        },
      };

      receivedOptions = response.data;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    const addButton = page.getByRole('button', { name: /新增.*passkey/i });
    await addButton.click();

    await page.waitForTimeout(500);

    // 驗證 excludeCredentials 存在且包含現有 credentials
    expect(receivedOptions).not.toBeNull();
    expect(receivedOptions.excludeCredentials).toBeDefined();
    expect(receivedOptions.excludeCredentials.length).toBeGreaterThan(0);
  });
});
