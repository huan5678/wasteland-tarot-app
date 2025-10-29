/**
 * E2E 測試：OAuth 註冊與 Passkey 升級流程 (Task 13.1)
 *
 * 測試完整的用戶旅程：
 * 1. 新用戶使用 Google OAuth 註冊
 * 2. 系統顯示 Passkey 升級引導 modal
 * 3. 用戶完成 Passkey 註冊
 * 4. 驗證成功導向 dashboard
 * 5. 驗證 authStore 狀態正確
 *
 * 需求映射：
 * - 需求 1: Google OAuth 快速註冊
 * - 需求 2: Passkey 升級引導
 * - 需求 5: 認證方式狀態同步
 */

import { test, expect, Page } from '@playwright/test';
import {
  setupVirtualAuthenticator,
  removeVirtualAuthenticator,
} from './helpers/webauthn';

/**
 * 模擬 Google OAuth 授權流程
 */
async function mockGoogleOAuth(page: Page) {
  // Mock OAuth 回調端點
  await page.route('**/api/v1/auth/oauth/callback', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-oauth-access-token',
        refresh_token: 'mock-oauth-refresh-token',
        token_type: 'bearer',
        user: {
          id: 'user-oauth-123',
          email: 'newuser@gmail.com',
          name: 'New OAuth User',
          oauth_provider: 'google',
          profile_picture_url: 'https://google-avatar.jpg',
          is_oauth_user: true,
          karma_score: 50,
        },
      }),
    });
  });

  // Mock 認證方式查詢（初始：只有 OAuth）
  await page.route('**/api/v1/auth/methods', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        has_oauth: true,
        oauth_provider: 'google',
        profile_picture: 'https://google-avatar.jpg',
        has_passkey: false,
        passkey_count: 0,
        passkey_credentials: [],
        has_password: false,
      }),
    });
  });

  // Mock Supabase OAuth 初始化（重導向）
  await page.route('**/auth/v1/authorize', async (route) => {
    // 模擬 Google OAuth 授權
    // 實際上 Supabase 會重導向到 Google
    // 這裡我們直接模擬回調
    await route.fulfill({
      status: 302,
      headers: {
        Location: `${page.url()}?code=mock_oauth_code_123`,
      },
    });
  });
}

/**
 * 模擬 Passkey 註冊流程
 */
async function mockPasskeyRegistration(page: Page) {
  // Mock 註冊選項請求
  await page.route(
    '**/api/v1/auth/webauthn/register/options',
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          challenge: 'mock-challenge-base64',
          rp: { id: 'localhost', name: 'Tarot App' },
          user: {
            id: 'mock-user-handle',
            name: 'newuser@gmail.com',
            displayName: 'New OAuth User',
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          timeout: 60000,
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            residentKey: 'required',
            userVerification: 'required',
          },
        }),
      });
    }
  );

  // Mock 註冊驗證請求
  await page.route(
    '**/api/v1/auth/webauthn/register/verify',
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Passkey 註冊成功',
          credential_id: 'credential-mock-123',
        }),
      });
    }
  );

  // 更新認證方式查詢（Passkey 已註冊）
  await page.route('**/api/v1/auth/methods', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        has_oauth: true,
        oauth_provider: 'google',
        profile_picture: 'https://google-avatar.jpg',
        has_passkey: true,
        passkey_count: 1,
        passkey_credentials: [
          {
            id: 'credential-mock-123',
            name: 'MacBook Touch ID',
            created_at: new Date().toISOString(),
            last_used_at: null,
            device_type: 'platform',
          },
        ],
        has_password: false,
      }),
    });
  });
}

test.describe('OAuth 註冊與 Passkey 升級完整流程', () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit 不支援 Virtual Authenticator'
    );

    await setupVirtualAuthenticator(page);
  });

  test.afterEach(async ({ page }) => {
    await removeVirtualAuthenticator(page);
  });

  test('新用戶完整流程：OAuth 註冊 → Passkey 升級引導 → Passkey 註冊 → Dashboard', async ({
    page,
  }) => {
    // ========== 步驟 1: 訪問登入頁面 ==========
    await mockGoogleOAuth(page);
    await page.goto('/auth/login');

    // 驗證登入頁面載入
    await expect(page).toHaveTitle(/登入/);

    // ========== 步驟 2: 點擊「使用 Google 登入」按鈕 ==========
    const googleLoginButton = page.getByRole('button', {
      name: /使用 Google 登入/i,
    });
    await expect(googleLoginButton).toBeVisible();

    // 點擊按鈕觸發 OAuth 流程
    await googleLoginButton.click();

    // ========== 步驟 3: 等待 OAuth 回調完成 ==========
    // 在實際環境中，這會重導向到 Google 授權頁面，然後回調回來
    // 在測試環境中，我們 mock 了這個流程

    // 等待登入完成
    await page.waitForURL(/\//, { timeout: 10000 });

    // ========== 步驟 4: 驗證 Passkey 升級引導 modal 顯示 ==========
    await mockPasskeyRegistration(page);

    const upgradeModal = page.locator('[data-testid="passkey-upgrade-modal"]');
    await expect(upgradeModal).toBeVisible({ timeout: 5000 });

    // 驗證 modal 內容
    await expect(
      upgradeModal.locator('text=/升級至更快速的生物辨識登入/')
    ).toBeVisible();
    await expect(
      upgradeModal.locator(
        'text=/使用指紋或 Face ID 登入，無需每次點擊 Google 按鈕/'
      )
    ).toBeVisible();

    // 驗證按鈕存在
    const setupButton = upgradeModal.getByRole('button', {
      name: /立即設定 Passkey/i,
    });
    const skipButton = upgradeModal.getByText(/稍後再說/i);

    await expect(setupButton).toBeVisible();
    await expect(skipButton).toBeVisible();

    // ========== 步驟 5: 點擊「立即設定 Passkey」==========
    await setupButton.click();

    // ========== 步驟 6: 等待生物辨識驗證（模擬）==========
    // Virtual Authenticator 會自動處理 navigator.credentials.create()

    // 等待載入動畫
    const loadingIndicator = page.locator('[data-testid="passkey-loading"]');
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 });

    // ========== 步驟 7: 驗證成功訊息 ==========
    await expect(
      page.locator(
        'text=/Passkey 設定完成！下次您可以使用生物辨識快速登入/'
      )
    ).toBeVisible({ timeout: 5000 });

    // ========== 步驟 8: 驗證導向 dashboard ==========
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    await expect(page).toHaveURL(/\/dashboard/);

    // ========== 步驟 9: 驗證 authStore 狀態 ==========
    const authState = await page.evaluate(() => {
      const authStorage = localStorage.getItem('auth-storage');
      return authStorage ? JSON.parse(authStorage) : null;
    });

    expect(authState).not.toBeNull();
    expect(authState.state.isAuthenticated).toBe(true);
    expect(authState.state.user.email).toBe('newuser@gmail.com');

    // 注意：在實際實作中，authStore 應該包含 hasOAuth 和 hasPasskey 狀態
    // 這些狀態從 /api/auth/methods 查詢並儲存

    // ========== 步驟 10: 驗證 dashboard 顯示用戶資訊 ==========
    await expect(
      page.locator('text=/New OAuth User/').or(page.locator('text=/newuser/'))
    ).toBeVisible();
  });

  test('新用戶跳過 Passkey 升級引導', async ({ page }) => {
    // ========== 步驟 1-3: 同上，OAuth 登入 ==========
    await mockGoogleOAuth(page);
    await page.goto('/auth/login');

    const googleLoginButton = page.getByRole('button', {
      name: /使用 Google 登入/i,
    });
    await googleLoginButton.click();

    await page.waitForURL(/\//, { timeout: 10000 });

    // ========== 步驟 4: Passkey 升級 modal 顯示 ==========
    const upgradeModal = page.locator('[data-testid="passkey-upgrade-modal"]');
    await expect(upgradeModal).toBeVisible({ timeout: 5000 });

    // ========== 步驟 5: 點擊「稍後再說」==========
    const skipButton = upgradeModal.getByText(/稍後再說/i);
    await skipButton.click();

    // ========== 步驟 6: 驗證 modal 關閉並導向 dashboard ==========
    await expect(upgradeModal).not.toBeVisible({ timeout: 3000 });
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // ========== 步驟 7: 驗證 localStorage 記錄跳過 ==========
    // 注意：實際實作中應記錄到後端 passkey_prompt_skipped_at
    const skipData = await page.evaluate(() => {
      return localStorage.getItem('passkey_upgrade_skipped');
    });

    expect(skipData).not.toBeNull();

    // 驗證用戶仍可正常使用
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Passkey 升級過程中發生錯誤時顯示重試選項', async ({ page }) => {
    // ========== 步驟 1-3: OAuth 登入 ==========
    await mockGoogleOAuth(page);
    await page.goto('/auth/login');

    const googleLoginButton = page.getByRole('button', {
      name: /使用 Google 登入/i,
    });
    await googleLoginButton.click();

    await page.waitForURL(/\//, { timeout: 10000 });

    // ========== 步驟 4: Passkey 升級 modal 顯示 ==========
    const upgradeModal = page.locator('[data-testid="passkey-upgrade-modal"]');
    await expect(upgradeModal).toBeVisible({ timeout: 5000 });

    // ========== 步驟 5: Mock Passkey 註冊失敗 ==========
    await page.route(
      '**/api/v1/auth/webauthn/register/options',
      async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: 'Internal Server Error',
          }),
        });
      }
    );

    // 點擊「立即設定 Passkey」
    const setupButton = upgradeModal.getByRole('button', {
      name: /立即設定 Passkey/i,
    });
    await setupButton.click();

    // ========== 步驟 6: 驗證錯誤訊息顯示 ==========
    await expect(
      page.locator('text=/Passkey 註冊失敗/').or(page.locator('text=/錯誤/'))
    ).toBeVisible({ timeout: 5000 });

    // ========== 步驟 7: 驗證重試和跳過選項存在 ==========
    const retryButton = upgradeModal.getByRole('button', { name: /重試/i });
    const skipButton = upgradeModal.getByText(/跳過/i);

    await expect(retryButton).toBeVisible();
    await expect(skipButton).toBeVisible();

    // 點擊跳過繼續使用
    await skipButton.click();

    // 驗證仍導向 dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('瀏覽器不支援 WebAuthn 時顯示提示訊息', async ({ page }) => {
    // ========== 步驟 1: 移除 Virtual Authenticator 模擬不支援 ==========
    await removeVirtualAuthenticator(page);

    // Mock 不支援 WebAuthn
    await page.addInitScript(() => {
      // @ts-ignore
      delete window.PublicKeyCredential;
      // @ts-ignore
      delete navigator.credentials;
    });

    // ========== 步驟 2-3: OAuth 登入 ==========
    await mockGoogleOAuth(page);
    await page.goto('/auth/login');

    const googleLoginButton = page.getByRole('button', {
      name: /使用 Google 登入/i,
    });
    await googleLoginButton.click();

    await page.waitForURL(/\//, { timeout: 10000 });

    // ========== 步驟 4: 驗證不支援訊息 ==========
    await expect(
      page.locator('text=/您的裝置不支援 Passkey/').or(
        page.locator('text=/WebAuthn/')
      )
    ).toBeVisible({ timeout: 5000 });

    // 驗證 modal 自動關閉（5 秒後）
    await page.waitForTimeout(6000);

    // 驗證導向 dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
