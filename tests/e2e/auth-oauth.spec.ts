/**
 * Task 27: 端對端測試 - OAuth 完整流程
 * 使用 Playwright 測試完整的 OAuth 登入流程
 */

import { test, expect, Page } from '@playwright/test';

test.describe('OAuth Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');
  });

  test('should display Google login button', async ({ page }) => {
    const googleButton = page.getByRole('button', { name: /google/i });
    await expect(googleButton).toBeVisible();
  });

  test('should redirect to Google OAuth on button click', async ({ page, context }) => {
    // Listen for popup
    const popupPromise = context.waitForEvent('page');

    // Click Google login button
    const googleButton = page.getByRole('button', { name: /google/i });
    await googleButton.click();

    // Wait for OAuth popup/redirect
    const popup = await popupPromise;

    // Should redirect to Google OAuth
    await expect(popup).toHaveURL(/accounts\.google\.com/);
  });

  test('should complete OAuth flow and redirect to dashboard', async ({ page, context }) => {
    // Mock successful OAuth flow
    await context.route('**/api/auth/google/callback*', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/dashboard',
          'Set-Cookie': 'access_token=mock_token; Path=/; HttpOnly',
        },
      });
    });

    // Click Google login
    const googleButton = page.getByRole('button', { name: /google/i });
    await googleButton.click();

    // Should redirect to dashboard after OAuth
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display user info after successful OAuth login', async ({ page, context }) => {
    // Mock OAuth callback success
    await context.route('**/api/auth/google/callback*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            email: 'oauth@example.com',
            username: 'OAuth User',
            karma_score: 50,
          },
          access_token: 'mock_oauth_token',
        }),
      });
    });

    // Mock user info endpoint
    await context.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          email: 'oauth@example.com',
          username: 'OAuth User',
          karma_score: 50,
        }),
      });
    });

    await page.goto('/dashboard');

    // Should display user info
    await expect(page.getByText(/oauth@example\.com/i)).toBeVisible();
    await expect(page.getByText(/oauth user/i)).toBeVisible();
  });

  test('should handle OAuth errors gracefully', async ({ page, context }) => {
    // Mock OAuth callback error
    await context.route('**/api/auth/google/callback*', async (route) => {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({
          error: 'Google login failed',
        }),
      });
    });

    // Click Google login
    const googleButton = page.getByRole('button', { name: /google/i });
    await googleButton.click();

    // Should show error message
    await expect(page.getByText(/google login failed|登入失敗/i)).toBeVisible();
  });

  test('should handle state validation error (CSRF protection)', async ({ page, context }) => {
    // Mock state validation error
    await context.route('**/api/auth/google/callback*', async (route) => {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({
          error: 'State validation failed',
        }),
      });
    });

    await page.goto('/auth/callback?code=test_code&state=invalid_state');

    // Should show security error
    await expect(page.getByText(/state validation failed|安全驗證失敗/i)).toBeVisible();
  });

  test('should store session after successful OAuth', async ({ page, context }) => {
    // Mock successful OAuth
    await context.route('**/api/auth/google/callback*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: { email: 'session@example.com' },
          access_token: 'session_token',
        }),
        headers: {
          'Set-Cookie': 'access_token=session_token; Path=/; HttpOnly',
        },
      });
    });

    await page.goto('/dashboard');

    // Check session storage/cookies
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'access_token' || c.name === 'session');
    expect(sessionCookie).toBeDefined();
  });

  test('should initialize Karma for new OAuth user', async ({ page, context }) => {
    // Mock new OAuth user creation
    await context.route('**/api/auth/google/callback*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            email: 'newkarma@example.com',
            username: 'New Karma User',
            karma_score: 50, // Initial Karma
            faction_alignment: 'neutral',
          },
          access_token: 'karma_token',
        }),
      });
    });

    await page.goto('/dashboard');

    // Should show initial Karma
    await expect(page.getByText(/karma.*50/i)).toBeVisible();
    await expect(page.getByText(/neutral/i)).toBeVisible();
  });

  test('should prevent OAuth user from using password login', async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');

    // Try to login with email and password for OAuth user
    await page.fill('input[type="email"]', 'oauth@example.com');
    await page.fill('input[type="password"]', 'any_password');

    const loginButton = page.getByRole('button', { name: /登入|login/i });
    await loginButton.click();

    // Should show error message
    await expect(page.getByText(/google.*登入|use google|oauth/i)).toBeVisible();
  });

  test('should logout OAuth user successfully', async ({ page, context }) => {
    // Mock logged in state
    await context.addCookies([
      {
        name: 'access_token',
        value: 'oauth_logout_token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');

    // Click logout button
    const logoutButton = page.getByRole('button', { name: /登出|logout/i });
    await logoutButton.click();

    // Should redirect to login page
    await page.waitForURL('/auth/login');
    await expect(page).toHaveURL('/auth/login');

    // Session cookie should be cleared
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'access_token');
    expect(sessionCookie).toBeUndefined();
  });
});

test.describe('OAuth User Registration Flow', () => {
  test('should allow Google registration from register page', async ({ page }) => {
    await page.goto('/auth/register');

    const googleButton = page.getByRole('button', { name: /google/i });
    await expect(googleButton).toBeVisible();
  });

  test('should create new user on first Google login', async ({ page, context }) => {
    // Mock new user creation
    await context.route('**/api/auth/google/callback*', async (route) => {
      await route.fulfill({
        status: 201, // Created
        body: JSON.stringify({
          user: {
            id: 'new-oauth-id',
            email: 'firsttime@gmail.com',
            username: 'First Time User',
            is_oauth_user: true,
            oauth_provider: 'google',
            karma_score: 50,
          },
          access_token: 'new_user_token',
        }),
      });
    });

    await page.goto('/auth/login');

    const googleButton = page.getByRole('button', { name: /google/i });
    await googleButton.click();

    // Should redirect to dashboard as new user
    await page.waitForURL('/dashboard');
    await expect(page.getByText(/firsttime@gmail\.com/i)).toBeVisible();
  });

  test('should link Google account to existing email user', async ({ page, context }) => {
    // User already exists with same email
    // Mock account linking
    await context.route('**/api/auth/google/callback*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            email: 'existing@example.com',
            username: 'Existing User',
            oauth_provider: 'google', // Now linked
            password_hash: 'still_exists', // Hybrid user
          },
          access_token: 'linked_token',
        }),
      });
    });

    await page.goto('/dashboard');

    // Should show linked account
    await expect(page.getByText(/existing@example\.com/i)).toBeVisible();
  });
});

test.describe('OAuth Error Scenarios', () => {
  test('should handle missing authorization code', async ({ page }) => {
    // Navigate directly to callback without code
    await page.goto('/auth/callback?state=valid_state');

    // Should show error
    await expect(page.getByText(/missing.*code|缺少授權碼/i)).toBeVisible();
  });

  test('should handle expired authorization code', async ({ page, context }) => {
    await context.route('**/api/auth/google/callback*', async (route) => {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({
          error: 'Authorization code expired',
        }),
      });
    });

    await page.goto('/auth/callback?code=expired_code&state=valid_state');

    // Should show expiration error
    await expect(page.getByText(/expired|過期/i)).toBeVisible();
  });

  test('should retry on network error', async ({ page, context }) => {
    let attemptCount = 0;

    await context.route('**/api/auth/google/callback*', async (route) => {
      attemptCount++;

      if (attemptCount < 2) {
        // First attempt fails
        await route.abort('failed');
      } else {
        // Second attempt succeeds
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            user: { email: 'retry@example.com' },
            access_token: 'retry_token',
          }),
        });
      }
    });

    await page.goto('/auth/callback?code=retry_code&state=valid_state');

    // Should eventually succeed
    await page.waitForURL('/dashboard', { timeout: 10000 });
    expect(attemptCount).toBeGreaterThanOrEqual(2);
  });

  test('should display Supabase connection error', async ({ page, context }) => {
    await context.route('**/api/auth/google/callback*', async (route) => {
      await route.fulfill({
        status: 503,
        body: JSON.stringify({
          error: 'Supabase connection failed',
        }),
      });
    });

    await page.goto('/auth/callback?code=test_code&state=valid_state');

    // Should show service unavailable error
    await expect(page.getByText(/service unavailable|服務暫時無法使用/i)).toBeVisible();
  });
});
