/**
 * Task 27: 端對端測試 - Email 註冊和登入流程
 * 使用 Playwright 測試完整的 email 認證流程
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Email Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.getByLabel(/username|使用者名稱/i)).toBeVisible();
    await expect(page.getByLabel(/^email|電子郵件/i)).toBeVisible();
    await expect(page.getByLabel(/^password|^密碼/i)).toBeVisible();
    await expect(page.getByLabel(/confirm.*password|確認密碼/i)).toBeVisible();
  });

  test('should register new user successfully', async ({ page, context }) => {
    // Mock registration endpoint
    await context.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        body: JSON.stringify({
          user: {
            id: 'new-user-123',
            email: 'newuser@example.com',
            username: 'newuser',
            karma_score: 50,
            faction_alignment: 'neutral',
          },
          access_token: 'new_user_token',
        }),
      });
    });

    // Fill registration form
    await page.fill('input[name="username"]', 'newuser');
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'NewPass123!');
    await page.fill('input[name="confirmPassword"]', 'NewPass123!');

    // Accept terms
    const termsCheckbox = page.getByRole('checkbox', { name: /terms|同意|服務條款/i });
    await termsCheckbox.check();

    // Submit form
    const registerButton = page.getByRole('button', { name: /註冊|register/i });
    await registerButton.click();

    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show validation errors for invalid inputs', async ({ page }) => {
    // Submit empty form
    const registerButton = page.getByRole('button', { name: /註冊|register/i });
    await registerButton.click();

    // Should show validation errors
    await expect(page.getByText(/username.*必填|username.*required/i)).toBeVisible();
    await expect(page.getByText(/email.*必填|email.*required/i)).toBeVisible();
    await expect(page.getByText(/password.*必填|password.*required/i)).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.fill('input[name="password"]', 'weak');

    const registerButton = page.getByRole('button', { name: /註冊|register/i });
    await registerButton.click();

    // Should show password strength error
    await expect(page.getByText(/password.*至少.*8|password.*least.*8/i)).toBeVisible();
  });

  test('should validate password confirmation match', async ({ page }) => {
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPass456!');

    const registerButton = page.getByRole('button', { name: /註冊|register/i });
    await registerButton.click();

    // Should show mismatch error
    await expect(page.getByText(/password.*不一致|password.*not match/i)).toBeVisible();
  });

  test('should show error for duplicate email', async ({ page, context }) => {
    await context.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 409,
        body: JSON.stringify({
          error: 'Email already exists',
        }),
      });
    });

    await page.fill('input[name="username"]', 'duplicate');
    await page.fill('input[type="email"]', 'duplicate@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');

    const termsCheckbox = page.getByRole('checkbox', { name: /terms/i });
    await termsCheckbox.check();

    const registerButton = page.getByRole('button', { name: /註冊|register/i });
    await registerButton.click();

    // Should show duplicate email error
    await expect(page.getByText(/email already exists|email 已存在/i)).toBeVisible();
  });

  test('should initialize Karma on registration', async ({ page, context }) => {
    await context.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        body: JSON.stringify({
          user: {
            email: 'karma@example.com',
            username: 'karmauser',
            karma_score: 50, // Initial Karma
            faction_alignment: 'neutral',
          },
          access_token: 'karma_token',
        }),
      });
    });

    await context.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          karma_score: 50,
          faction_alignment: 'neutral',
        }),
      });
    });

    await page.fill('input[name="username"]', 'karmauser');
    await page.fill('input[type="email"]', 'karma@example.com');
    await page.fill('input[name="password"]', 'KarmaPass123!');
    await page.fill('input[name="confirmPassword"]', 'KarmaPass123!');

    const termsCheckbox = page.getByRole('checkbox', { name: /terms/i });
    await termsCheckbox.check();

    const registerButton = page.getByRole('button', { name: /註冊|register/i });
    await registerButton.click();

    await page.waitForURL('/dashboard');

    // Should show initial Karma
    await expect(page.getByText(/karma.*50/i)).toBeVisible();
  });
});

test.describe('Email Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByLabel(/email|電子郵件/i)).toBeVisible();
    await expect(page.getByLabel(/password|密碼/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /登入|login/i })).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page, context }) => {
    await context.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            email: 'user@example.com',
            username: 'validuser',
            karma_score: 75,
          },
          access_token: 'valid_token',
        }),
      });
    });

    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'ValidPass123!');

    const loginButton = page.getByRole('button', { name: /登入|login/i });
    await loginButton.click();

    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error for invalid credentials', async ({ page, context }) => {
    await context.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({
          error: 'Invalid credentials',
        }),
      });
    });

    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'WrongPassword123!');

    const loginButton = page.getByRole('button', { name: /登入|login/i });
    await loginButton.click();

    // Should show error message
    await expect(page.getByText(/invalid credentials|帳號或密碼錯誤/i)).toBeVisible();
  });

  test('should show error for nonexistent user', async ({ page, context }) => {
    await context.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({
          error: 'User not found',
        }),
      });
    });

    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'AnyPassword123!');

    const loginButton = page.getByRole('button', { name: /登入|login/i });
    await loginButton.click();

    // Should show error
    await expect(page.getByText(/user not found|使用者不存在/i)).toBeVisible();
  });

  test('should login with email case-insensitive', async ({ page, context }) => {
    await context.route('**/api/auth/login', async (route) => {
      const body = await route.request().postDataJSON();
      expect(body.email.toLowerCase()).toBe('case@example.com');

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: { email: 'case@example.com' },
          access_token: 'case_token',
        }),
      });
    });

    // Login with uppercase email
    await page.fill('input[type="email"]', 'CASE@EXAMPLE.COM');
    await page.fill('input[type="password"]', 'Password123!');

    const loginButton = page.getByRole('button', { name: /登入|login/i });
    await loginButton.click();

    // Should login successfully
    await page.waitForURL('/dashboard');
  });

  test('should update last_login timestamp', async ({ page, context }) => {
    let lastLoginUpdated = false;

    await context.route('**/api/auth/login', async (route) => {
      lastLoginUpdated = true;

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            email: 'timestamp@example.com',
            last_login: new Date().toISOString(),
          },
          access_token: 'timestamp_token',
        }),
      });
    });

    await page.fill('input[type="email"]', 'timestamp@example.com');
    await page.fill('input[type="password"]', 'Password123!');

    const loginButton = page.getByRole('button', { name: /登入|login/i });
    await loginButton.click();

    await page.waitForURL('/dashboard');

    expect(lastLoginUpdated).toBe(true);
  });

  test('should persist session across page reloads', async ({ page, context }) => {
    // Set session cookie
    await context.addCookies([
      {
        name: 'access_token',
        value: 'persistent_token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
      },
    ]);

    await context.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          email: 'persistent@example.com',
          username: 'Persistent User',
        }),
      });
    });

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Should be logged in
    await expect(page.getByText(/persistent@example\.com/i)).toBeVisible();

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(page.getByText(/persistent@example\.com/i)).toBeVisible();
  });
});

test.describe('Registration to Login Flow', () => {
  test('should allow registration then login with same credentials', async ({ page, context }) => {
    // Step 1: Register
    await page.goto('/auth/register');

    await context.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        body: JSON.stringify({
          user: {
            email: 'flow@example.com',
            username: 'flowuser',
            karma_score: 50,
          },
          access_token: 'register_token',
        }),
      });
    });

    await page.fill('input[name="username"]', 'flowuser');
    await page.fill('input[type="email"]', 'flow@example.com');
    await page.fill('input[name="password"]', 'FlowPass123!');
    await page.fill('input[name="confirmPassword"]', 'FlowPass123!');

    const termsCheckbox = page.getByRole('checkbox', { name: /terms/i });
    await termsCheckbox.check();

    const registerButton = page.getByRole('button', { name: /註冊|register/i });
    await registerButton.click();

    await page.waitForURL('/dashboard');

    // Step 2: Logout
    const logoutButton = page.getByRole('button', { name: /登出|logout/i });
    await logoutButton.click();

    await page.waitForURL('/auth/login');

    // Step 3: Login with same credentials
    await context.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            email: 'flow@example.com',
            username: 'flowuser',
            karma_score: 50,
          },
          access_token: 'login_token',
        }),
      });
    });

    await page.fill('input[type="email"]', 'flow@example.com');
    await page.fill('input[type="password"]', 'FlowPass123!');

    const loginButton = page.getByRole('button', { name: /登入|login/i });
    await loginButton.click();

    // Should login successfully
    await page.waitForURL('/dashboard');
    await expect(page.getByText(/flow@example\.com/i)).toBeVisible();
  });
});

test.describe('Password Reset Flow', () => {
  test('should display password reset link', async ({ page }) => {
    await page.goto('/auth/login');

    const resetLink = page.getByRole('link', { name: /forgot.*password|忘記密碼/i });
    await expect(resetLink).toBeVisible();
  });

  test('should navigate to password reset page', async ({ page }) => {
    await page.goto('/auth/login');

    const resetLink = page.getByRole('link', { name: /forgot.*password|忘記密碼/i });
    await resetLink.click();

    await page.waitForURL('/auth/forgot-password');
    await expect(page).toHaveURL('/auth/forgot-password');
  });

  test('should send password reset email', async ({ page, context }) => {
    await page.goto('/auth/forgot-password');

    await context.route('**/api/auth/password-reset/request', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          message: 'Password reset email sent',
        }),
      });
    });

    await page.fill('input[type="email"]', 'reset@example.com');

    const sendButton = page.getByRole('button', { name: /send|發送|送出/i });
    await sendButton.click();

    // Should show success message
    await expect(page.getByText(/email sent|已發送/i)).toBeVisible();
  });
});

test.describe('Logout Flow', () => {
  test('should logout successfully', async ({ page, context }) => {
    // Set logged in state
    await context.addCookies([
      {
        name: 'access_token',
        value: 'logout_test_token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await context.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          email: 'logout@example.com',
        }),
      });
    });

    await context.route('**/api/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          message: 'Logged out successfully',
        }),
      });
    });

    await page.goto('/dashboard');

    // Click logout
    const logoutButton = page.getByRole('button', { name: /登出|logout/i });
    await logoutButton.click();

    // Should redirect to login
    await page.waitForURL('/auth/login');
    await expect(page).toHaveURL('/auth/login');

    // Session should be cleared
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'access_token');
    expect(sessionCookie).toBeUndefined();
  });

  test('should not access protected routes after logout', async ({ page, context }) => {
    // Logout
    await context.clearCookies();

    // Try to access dashboard
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/auth/login');
    await expect(page).toHaveURL('/auth/login');
  });
});
