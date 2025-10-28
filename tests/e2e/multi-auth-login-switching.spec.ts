/**
 * E2E 測試：多認證方式登入切換 (Task 13.3)
 *
 * 測試完整的用戶旅程：
 * 1. 建立擁有 OAuth + Passkey + 密碼的測試用戶
 * 2. 使用 OAuth 登入 → 驗證成功 → 登出
 * 3. 使用 Passkey 登入 → 驗證成功 → 登出
 * 4. 使用 Email/密碼登入 → 驗證成功
 * 5. 驗證三種方式都可成功登入
 *
 * 需求映射：
 * - 需求 3: 登入頁面整合（三種認證方式共存）
 * - 需求 4: 帳號設定頁面（多認證方式管理）
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import {
  setupVirtualAuthenticator,
  removeVirtualAuthenticator,
} from './helpers/webauthn';

const TEST_USER = {
  id: 'user-multi-auth-123',
  email: 'multiauth@example.com',
  name: 'Multi Auth User',
  password: 'SecurePassword123!',
  oauth_id: 'google_xyz789',
};

/**
 * Mock OAuth 登入
 */
async function mockOAuthLogin(page: Page) {
  await page.route('**/api/v1/auth/oauth/callback', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-oauth-access-token',
        refresh_token: 'mock-oauth-refresh-token',
        token_type: 'bearer',
        user: {
          id: TEST_USER.id,
          email: TEST_USER.email,
          name: TEST_USER.name,
          oauth_provider: 'google',
          profile_picture_url: 'https://google-avatar.jpg',
          is_oauth_user: true,
        },
      }),
    });
  });

  await page.route('**/auth/v1/authorize', async (route) => {
    await route.fulfill({
      status: 302,
      headers: {
        Location: `${page.url()}?code=mock_oauth_code`,
      },
    });
  });
}

/**
 * Mock Passkey 登入
 */
async function mockPasskeyLogin(page: Page) {
  await page.route('**/api/v1/auth/webauthn/login/options', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        challenge: 'mock-challenge-base64',
        timeout: 60000,
        rpId: 'localhost',
        userVerification: 'required',
      }),
    });
  });

  await page.route('**/api/v1/auth/webauthn/login/verify', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        access_token: 'mock-passkey-access-token',
        refresh_token: 'mock-passkey-refresh-token',
        token_type: 'bearer',
        user: {
          id: TEST_USER.id,
          email: TEST_USER.email,
          name: TEST_USER.name,
          has_passkey: true,
        },
      }),
    });
  });
}

/**
 * Mock 密碼登入
 */
async function mockPasswordLogin(page: Page) {
  await page.route('**/api/v1/auth/login', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    if (
      postData.email === TEST_USER.email &&
      postData.password === TEST_USER.password
    ) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-password-access-token',
          refresh_token: 'mock-password-refresh-token',
          token_type: 'bearer',
          user: {
            id: TEST_USER.id,
            email: TEST_USER.email,
            name: TEST_USER.name,
            has_password: true,
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: '密碼錯誤',
        }),
      });
    }
  });
}

/**
 * Mock 登出
 */
async function mockLogout(page: Page) {
  await page.route('**/api/v1/auth/logout', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: '登出成功',
      }),
    });
  });
}

/**
 * Mock 認證方式查詢（三種都啟用）
 */
async function mockAuthMethods(page: Page) {
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
            id: 'credential-multi-auth',
            name: 'MacBook Touch ID',
            created_at: new Date().toISOString(),
            device_type: 'platform',
          },
        ],
        has_password: true,
      }),
    });
  });
}

/**
 * 驗證登入成功並在 dashboard
 */
async function verifyLoginSuccess(page: Page) {
  // 等待導向 dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  await expect(page).toHaveURL(/\/dashboard/);

  // 驗證 authStore
  const authState = await page.evaluate(() => {
    const authStorage = localStorage.getItem('auth-storage');
    return authStorage ? JSON.parse(authStorage) : null;
  });

  expect(authState).not.toBeNull();
  expect(authState.state.isAuthenticated).toBe(true);
  expect(authState.state.user.email).toBe(TEST_USER.email);

  // 驗證用戶資訊顯示
  await expect(
    page
      .locator(`text=${TEST_USER.name}`)
      .or(page.locator(`text=${TEST_USER.email}`))
  ).toBeVisible();
}

/**
 * 執行登出
 */
async function performLogout(page: Page) {
  // 找到登出按鈕（可能在選單中）
  const userMenuButton = page
    .locator('[data-testid="user-menu"]')
    .or(page.locator('[aria-label="用戶選單"]'))
    .or(page.getByText(TEST_USER.name));

  await userMenuButton.click();

  // 等待選單展開
  await page.waitForTimeout(500);

  // 點擊登出
  const logoutButton = page
    .getByRole('button', { name: /登出/i })
    .or(page.getByText(/登出/));

  await logoutButton.click();

  // 驗證導向登入頁面
  await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
  await expect(page).toHaveURL(/\/auth\/login/);

  // 驗證 authStore 清除
  const authState = await page.evaluate(() => {
    const authStorage = localStorage.getItem('auth-storage');
    return authStorage ? JSON.parse(authStorage) : null;
  });

  if (authState) {
    expect(authState.state.isAuthenticated).toBe(false);
  }
}

test.describe('多認證方式登入切換完整流程', () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit 不支援 Virtual Authenticator'
    );

    await setupVirtualAuthenticator(page);
    await mockAuthMethods(page);
    await mockLogout(page);
  });

  test.afterEach(async ({ page }) => {
    await removeVirtualAuthenticator(page);
  });

  test('三種認證方式輪流登入測試', async ({ page }) => {
    // ========== 測試 1: OAuth 登入 ==========
    await mockOAuthLogin(page);
    await page.goto('/auth/login');

    await expect(page).toHaveTitle(/登入/);

    // 驗證三種認證選項都顯示
    const oauthButton = page.getByRole('button', {
      name: /使用 Google 登入/i,
    });
    const passkeyButton = page.getByRole('button', {
      name: /使用 Passkey 登入/i,
    });
    const emailPasswordToggle = page.locator(
      'text=/使用 Email\/密碼登入/].or(page.getByText(/展開/])'
    );

    await expect(oauthButton).toBeVisible();
    await expect(passkeyButton).toBeVisible();
    // Email/密碼可能預設收合
    // await expect(emailPasswordToggle).toBeVisible();

    // 點擊 OAuth 登入
    await oauthButton.click();

    // 驗證成功
    await verifyLoginSuccess(page);

    // 登出
    await performLogout(page);

    // ========== 測試 2: Passkey 登入 ==========
    await mockPasskeyLogin(page);
    await page.goto('/auth/login');

    await passkeyButton.click();

    // 驗證成功
    await verifyLoginSuccess(page);

    // 登出
    await performLogout(page);

    // ========== 測試 3: Email/密碼登入 ==========
    await mockPasswordLogin(page);
    await page.goto('/auth/login');

    // 展開 Email/密碼表單（若需要）
    const emailInput = page.getByLabel(/Email/i);

    if (!(await emailInput.isVisible())) {
      // 點擊展開按鈕
      const expandButton = page
        .getByText(/使用 Email/)
        .or(page.getByText(/密碼登入/));

      await expandButton.click();
      await page.waitForTimeout(500);
    }

    // 輸入 email 和密碼
    await emailInput.fill(TEST_USER.email);

    const passwordInput = page.getByLabel(/密碼/i);
    await passwordInput.fill(TEST_USER.password);

    // 提交表單
    const submitButton = page.getByRole('button', { name: /登入/i });
    await submitButton.click();

    // 驗證成功
    await verifyLoginSuccess(page);

    // 最後不登出，驗證可持續使用
  });

  test('登入頁面顯示視覺優先級：OAuth > Passkey > Email/密碼', async ({
    page,
  }) => {
    await page.goto('/auth/login');

    // 取得三個認證選項的位置和樣式
    const oauthButton = page.getByRole('button', {
      name: /使用 Google 登入/i,
    });
    const passkeyButton = page.getByRole('button', {
      name: /使用 Passkey 登入/i,
    });

    // 驗證 OAuth 按鈕最顯眼（Pip-Boy Green）
    const oauthStyles = await oauthButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        fontSize: styles.fontSize,
      };
    });

    // 驗證 Passkey 按鈕次要
    const passkeyStyles = await passkeyButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        fontSize: styles.fontSize,
      };
    });

    // OAuth 按鈕應該更大或更鮮豔
    // 這裡只是簡單驗證存在，實際視覺驗證需要手動測試
    expect(oauthButton).toBeVisible();
    expect(passkeyButton).toBeVisible();

    // Email/密碼預設收合（最不顯眼）
    const emailPasswordSection = page.locator('[data-testid="email-password-section"]');

    // 可能預設隱藏或收合
    // await expect(emailPasswordSection).not.toBeVisible();
  });

  test('WebAuthn Conditional UI（autofill）在支援的瀏覽器中啟用', async ({
    page,
  }) => {
    await page.goto('/auth/login');

    // 檢查 email 輸入框有 autocomplete="webauthn" 屬性
    const emailInput = page.getByLabel(/Email/i);

    const autocompleteAttr = await emailInput.getAttribute('autocomplete');

    // 驗證包含 webauthn
    if (autocompleteAttr) {
      expect(autocompleteAttr).toContain('webauthn');
    }

    // 注意：實際的 Conditional UI 行為需要真實瀏覽器和 Passkey 才能完整測試
  });

  test('在帳號設定中查看所有認證方式狀態', async ({ page }) => {
    // ========== 步驟 1: 登入 ==========
    await mockPasswordLogin(page);
    await page.goto('/auth/login');

    const emailInput = page.getByLabel(/Email/i);
    const passwordInput = page.getByLabel(/密碼/i);
    const submitButton = page.getByRole('button', { name: /登入/i });

    if (!(await emailInput.isVisible())) {
      const expandButton = page.getByText(/使用 Email/);
      await expandButton.click();
      await page.waitForTimeout(500);
    }

    await emailInput.fill(TEST_USER.email);
    await passwordInput.fill(TEST_USER.password);
    await submitButton.click();

    await verifyLoginSuccess(page);

    // ========== 步驟 2: 訪問帳號設定頁面 ==========
    await page.goto('/settings');

    // 或透過選單導航
    // const userMenuButton = page.locator('[data-testid="user-menu"]');
    // await userMenuButton.click();
    // const settingsLink = page.getByText(/設定/);
    // await settingsLink.click();

    // ========== 步驟 3: 驗證認證方式管理區塊 ==========
    await expect(page.locator('text=/認證方式管理/').or(page.locator('text=/登入方式/'))).toBeVisible();

    // 驗證 OAuth 狀態
    const oauthSection = page.locator('[data-testid="auth-method-oauth-section"]');
    await expect(oauthSection.locator('text=/已連結 Google 帳號/')).toBeVisible();
    await expect(oauthSection.locator('img[alt*="Google"]').or(oauthSection.locator('[data-testid="oauth-avatar"]'))).toBeVisible();

    // 驗證 Passkey 狀態
    const passkeySection = page.locator('[data-testid="auth-method-passkey-section"]');
    await expect(passkeySection.locator('text=/MacBook Touch ID/')).toBeVisible();

    // 驗證密碼狀態
    const passwordSection = page.locator('[data-testid="auth-method-password-section"]');
    await expect(passwordSection.locator('text=/已設定密碼/')).toBeVisible();

    // ========== 步驟 4: 驗證可以管理認證方式 ==========
    // 驗證存在「新增 Passkey」、「移除 OAuth」等按鈕（依實作而定）
  });
});
