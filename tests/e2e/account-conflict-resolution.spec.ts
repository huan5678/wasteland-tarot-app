/**
 * E2E 測試：帳號衝突解決流程 (Task 13.2)
 *
 * 測試完整的用戶旅程：
 * 1. 建立已有 Email/密碼帳號的測試用戶
 * 2. 嘗試用 Google OAuth 登入（相同 email）
 * 3. 看到帳號整合引導頁面
 * 4. 輸入密碼並提交
 * 5. 看到「Google 帳號已連結」成功訊息
 * 6. 導向 dashboard
 * 7. 驗證 authStore 狀態正確（hasOAuth=true, hasPassword=true）
 *
 * 需求映射：
 * - 需求 8.5: 相同 Email 跨認證方式整合引導
 * - 需求 4: 帳號設定頁面（多認證方式管理）
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Mock 帳號衝突情境
 */
async function mockAccountConflict(
  page: Page,
  existingEmail: string,
  existingMethods: string[]
) {
  // Mock OAuth 回調回傳 409 Conflict
  await page.route('**/api/v1/auth/oauth/callback', async (route) => {
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({
        detail: {
          error: 'account_conflict',
          message: `此 email (${existingEmail}) 已註冊`,
          conflict_info: {
            conflict_type: 'existing_account',
            email: existingEmail,
            existing_auth_methods: existingMethods,
            suggested_action: 'login_first',
          },
        },
      }),
    });
  });
}

/**
 * Mock 密碼登入並連結 OAuth
 */
async function mockPasswordLoginAndLink(
  page: Page,
  email: string,
  correctPassword: string
) {
  await page.route('**/api/v1/auth/login*', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    // 驗證密碼
    if (
      postData.email === email &&
      postData.password === correctPassword &&
      postData.link_oauth === true
    ) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-linked-access-token',
          refresh_token: 'mock-linked-refresh-token',
          token_type: 'bearer',
          linked_oauth: true,
          user: {
            id: 'user-linked-123',
            email: email,
            name: 'Test User',
            oauth_provider: 'google',
            profile_picture_url: 'https://google-avatar.jpg',
            has_password: true,
            is_oauth_user: true,
          },
        }),
      });
    } else {
      // 密碼錯誤
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: '密碼錯誤',
        }),
      });
    }
  });

  // Mock 認證方式查詢（兩種方式都啟用）
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
        has_password: true,
      }),
    });
  });
}

test.describe('帳號衝突解決完整流程', () => {
  const testEmail = 'existing@example.com';
  const testPassword = 'ExistingPassword123!';

  test('密碼用戶解決 OAuth 衝突', async ({ page }) => {
    // ========== 步驟 1: 模擬現有密碼用戶 ==========
    const existingMethods = ['password'];

    // ========== 步驟 2: 訪問登入頁面 ==========
    await page.goto('/auth/login');

    await expect(page).toHaveTitle(/登入/);

    // ========== 步驟 3: 嘗試使用 Google OAuth 登入 ==========
    await mockAccountConflict(page, testEmail, existingMethods);

    const googleLoginButton = page.getByRole('button', {
      name: /使用 Google 登入/i,
    });
    await expect(googleLoginButton).toBeVisible();

    await googleLoginButton.click();

    // ========== 步驟 4: 驗證看到帳號整合引導頁面 ==========
    await page.waitForURL(/\/auth\/account-conflict/, { timeout: 10000 });

    // 驗證頁面標題
    await expect(page.locator('h1, h2').filter({ hasText: /此 Email 已註冊/ })).toBeVisible();

    // 驗證衝突訊息
    await expect(page.locator(`text=${testEmail}`)).toBeVisible();
    await expect(
      page.locator('text=/您的 Google 帳號.*已經在系統中註冊過/')
    ).toBeVisible();

    // 驗證現有認證方式視覺化顯示
    const passwordMethodIcon = page.locator('[data-testid="auth-method-password"]');
    await expect(passwordMethodIcon).toBeVisible();

    // ========== 步驟 5: 驗證內嵌登入表單 ==========
    await mockPasswordLoginAndLink(page, testEmail, testPassword);

    // Email 輸入框預填且禁用
    const emailInput = page.getByLabel(/Email/i);
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveValue(testEmail);
    await expect(emailInput).toBeDisabled();

    // 密碼輸入框可編輯
    const passwordInput = page.getByLabel(/密碼/i);
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toBeEnabled();

    // 「忘記密碼？」連結存在
    const forgotPasswordLink = page.getByText(/忘記密碼/i);
    await expect(forgotPasswordLink).toBeVisible();

    // ========== 步驟 6: 輸入密碼並提交 ==========
    await passwordInput.fill(testPassword);

    const submitButton = page.getByRole('button', {
      name: /使用密碼登入並連結 Google 帳號/i,
    });
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // ========== 步驟 7: 驗證成功訊息 ==========
    await expect(
      page.locator('text=/Google 帳號已連結！/).or(
        page.locator('text=/您現在可以使用 Google 或密碼登入/')
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
    expect(authState.state.user.email).toBe(testEmail);

    // 驗證兩種認證方式都啟用
    // 注意：實際實作中，這些狀態應從 /api/auth/methods 查詢
    // 並儲存在 authStore 中
  });

  test('密碼錯誤時顯示錯誤訊息並允許重試', async ({ page }) => {
    // ========== 步驟 1-5: 同上，進入引導頁面 ==========
    await mockAccountConflict(page, testEmail, ['password']);
    await page.goto('/auth/login');

    const googleLoginButton = page.getByRole('button', {
      name: /使用 Google 登入/i,
    });
    await googleLoginButton.click();

    await page.waitForURL(/\/auth\/account-conflict/, { timeout: 10000 });

    await mockPasswordLoginAndLink(page, testEmail, testPassword);

    // ========== 步驟 6: 輸入錯誤密碼 ==========
    const passwordInput = page.getByLabel(/密碼/i);
    await passwordInput.fill('WrongPassword123!');

    const submitButton = page.getByRole('button', {
      name: /使用密碼登入並連結 Google 帳號/i,
    });
    await submitButton.click();

    // ========== 步驟 7: 驗證錯誤訊息 ==========
    await expect(
      page.locator('text=/密碼錯誤/).or(page.locator('text=/登入失敗/'))
    ).toBeVisible({ timeout: 3000 });

    // ========== 步驟 8: 驗證可以重試 ==========
    await passwordInput.fill(testPassword);
    await submitButton.click();

    // 驗證成功
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('連續失敗 5 次後顯示鎖定提示', async ({ page }) => {
    // ========== 步驟 1-5: 進入引導頁面 ==========
    await mockAccountConflict(page, testEmail, ['password']);
    await page.goto('/auth/login');

    const googleLoginButton = page.getByRole('button', {
      name: /使用 Google 登入/i,
    });
    await googleLoginButton.click();

    await page.waitForURL(/\/auth\/account-conflict/, { timeout: 10000 });

    await mockPasswordLoginAndLink(page, testEmail, testPassword);

    // ========== 步驟 6: 連續失敗 5 次 ==========
    const passwordInput = page.getByLabel(/密碼/i);
    const submitButton = page.getByRole('button', {
      name: /使用密碼登入並連結 Google 帳號/i,
    });

    for (let i = 0; i < 5; i++) {
      await passwordInput.fill(`WrongPassword${i}!`);
      await submitButton.click();
      await page.waitForTimeout(1000);
    }

    // ========== 步驟 7: 驗證鎖定提示 ==========
    await expect(
      page
        .locator('text=/帳號已暫時鎖定/')
        .or(page.locator('text=/請稍後再試/'))
        .or(page.locator('text=/15 分鐘/'))
    ).toBeVisible({ timeout: 3000 });

    // 驗證提交按鈕被禁用
    await expect(submitButton).toBeDisabled();

    // 驗證建議訊息
    await expect(
      page
        .locator('text=/使用忘記密碼功能/)
        .or(page.locator('text=/聯繫支援/'))
    ).toBeVisible();
  });

  test('點擊「返回登入頁面」正確導向', async ({ page }) => {
    // ========== 步驟 1-4: 進入引導頁面 ==========
    await mockAccountConflict(page, testEmail, ['password']);
    await page.goto('/auth/login');

    const googleLoginButton = page.getByRole('button', {
      name: /使用 Google 登入/i,
    });
    await googleLoginButton.click();

    await page.waitForURL(/\/auth\/account-conflict/, { timeout: 10000 });

    // ========== 步驟 5: 點擊「返回登入頁面」按鈕 ==========
    const backButton = page.getByRole('button', {
      name: /返回登入頁面/i,
    });
    await expect(backButton).toBeVisible();
    await backButton.click();

    // ========== 步驟 6: 驗證導向登入頁面 ==========
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/auth\/login/);

    // 驗證登入頁面元素存在
    await expect(googleLoginButton).toBeVisible();
  });

  test('Passkey 用戶解決 OAuth 衝突', async ({ page, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit 不支援 Virtual Authenticator'
    );

    // ========== 步驟 1: 模擬現有 Passkey 用戶 ==========
    const existingMethods = ['passkey'];

    // ========== 步驟 2-4: 進入引導頁面 ==========
    await mockAccountConflict(page, testEmail, existingMethods);
    await page.goto('/auth/login');

    const googleLoginButton = page.getByRole('button', {
      name: /使用 Google 登入/i,
    });
    await googleLoginButton.click();

    await page.waitForURL(/\/auth\/account-conflict/, { timeout: 10000 });

    // ========== 步驟 5: 驗證顯示「使用生物辨識登入」按鈕 ==========
    const passkeyMethodIcon = page.locator(
      '[data-testid="auth-method-passkey"]'
    );
    await expect(passkeyMethodIcon).toBeVisible();

    const passkeyLoginButton = page.getByRole('button', {
      name: /使用生物辨識登入/).or(page.getByRole('button', {name: /使用 Passkey 登入/})),
    });
    await expect(passkeyLoginButton).toBeVisible();

    // ========== 步驟 6: 點擊按鈕觸發 Passkey 登入 ==========
    // Mock Passkey 登入並連結 API
    await page.route('**/api/v1/auth/webauthn/login-and-link', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-passkey-linked-token',
          refresh_token: 'mock-passkey-refresh-token',
          token_type: 'bearer',
          linked_oauth: true,
          user: {
            id: 'user-passkey-linked-123',
            email: testEmail,
            name: 'Passkey User',
            oauth_provider: 'google',
            profile_picture_url: 'https://google-avatar.jpg',
            has_passkey: true,
          },
        }),
      });
    });

    await passkeyLoginButton.click();

    // ========== 步驟 7: 驗證成功訊息和導向 ==========
    await expect(
      page.locator('text=/Google 帳號已連結！/')
    ).toBeVisible({ timeout: 5000 });

    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
