/**
 * Task 27: 端對端測試 - 路由保護測試
 * 使用 Playwright 測試路由保護和授權機制
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Protected Routes - Unauthenticated Access', () => {
  test.beforeEach(async ({ context }) => {
    // Clear all cookies to ensure unauthenticated state
    await context.clearCookies();
  });

  test('should redirect to login when accessing dashboard unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/auth/login', { timeout: 5000 });
    await expect(page).toHaveURL('/auth/login');
  });

  test('should redirect to login when accessing profile unauthenticated', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForURL('/auth/login');
    await expect(page).toHaveURL('/auth/login');
  });

  test('should redirect to login when accessing readings unauthenticated', async ({ page }) => {
    await page.goto('/readings');

    await page.waitForURL('/auth/login');
    await expect(page).toHaveURL('/auth/login');
  });

  test('should redirect to login when creating new reading unauthenticated', async ({ page }) => {
    await page.goto('/readings/new');

    await page.waitForURL('/auth/login');
    await expect(page).toHaveURL('/auth/login');
  });

  test('should allow access to public routes', async ({ page }) => {
    // Homepage should be accessible
    await page.goto('/');
    await expect(page).not.toHaveURL('/auth/login');

    // Login page should be accessible
    await page.goto('/auth/login');
    await expect(page).toHaveURL('/auth/login');

    // Register page should be accessible
    await page.goto('/auth/register');
    await expect(page).toHaveURL('/auth/register');
  });

  test('should preserve redirect URL after login', async ({ page, context }) => {
    // Try to access protected route
    await page.goto('/readings/new');

    // Should redirect to login with return URL
    await page.waitForURL(/\/auth\/login/);

    // Mock login
    await context.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: { email: 'redirect@example.com' },
          access_token: 'redirect_token',
        }),
      });
    });

    // Login
    await page.fill('input[type="email"]', 'redirect@example.com');
    await page.fill('input[type="password"]', 'Password123!');

    const loginButton = page.getByRole('button', { name: /登入|login/i });
    await loginButton.click();

    // Should redirect back to originally requested page
    await page.waitForURL('/readings/new', { timeout: 5000 });
    await expect(page).toHaveURL('/readings/new');
  });
});

test.describe('Protected Routes - Authenticated Access', () => {
  test.beforeEach(async ({ context }) => {
    // Set authenticated session
    await context.addCookies([
      {
        name: 'access_token',
        value: 'authenticated_token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
      },
    ]);

    // Mock user info endpoint
    await context.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'auth-user-123',
          email: 'authenticated@example.com',
          username: 'Authenticated User',
          karma_score: 75,
          faction_alignment: 'ncr',
        }),
      });
    });
  });

  test('should allow access to dashboard when authenticated', async ({ page }) => {
    await page.goto('/dashboard');

    // Should stay on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(/authenticated@example\.com/i)).toBeVisible();
  });

  test('should allow access to profile when authenticated', async ({ page }) => {
    await page.goto('/profile');

    await expect(page).toHaveURL('/profile');
    await expect(page.getByText(/authenticated@example\.com/i)).toBeVisible();
  });

  test('should allow access to readings when authenticated', async ({ page, context }) => {
    await context.route('**/api/readings', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          readings: [],
        }),
      });
    });

    await page.goto('/readings');

    await expect(page).toHaveURL('/readings');
  });

  test('should allow creating new reading when authenticated', async ({ page }) => {
    await page.goto('/readings/new');

    await expect(page).toHaveURL('/readings/new');
  });

  test('should redirect to dashboard when accessing login while authenticated', async ({ page }) => {
    await page.goto('/auth/login');

    // Should redirect to dashboard (already logged in)
    await page.waitForURL('/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('should redirect to dashboard when accessing register while authenticated', async ({ page }) => {
    await page.goto('/auth/register');

    await page.waitForURL('/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Token Expiration Handling', () => {
  test('should redirect to login when token expires', async ({ page, context }) => {
    // Set expired token
    await context.addCookies([
      {
        name: 'access_token',
        value: 'expired_token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Mock 401 response for expired token
    await context.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({
          error: 'Token expired',
        }),
      });
    });

    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/auth/login');
    await expect(page).toHaveURL('/auth/login');
  });

  test('should show session expired message', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'access_token',
        value: 'expired_token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await context.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({
          error: 'Token expired',
        }),
      });
    });

    await page.goto('/dashboard');

    await page.waitForURL('/auth/login');

    // Should show session expired message
    await expect(page.getByText(/session expired|會話已過期/i)).toBeVisible();
  });

  test('should attempt token refresh before redirecting', async ({ page, context }) => {
    let refreshAttempted = false;

    await context.addCookies([
      {
        name: 'access_token',
        value: 'expired_access_token',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'refresh_token',
        value: 'valid_refresh_token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // First call returns 401 (expired)
    let callCount = 0;
    await context.route('**/api/auth/me', async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Token expired' }),
        });
      } else {
        // After refresh, return success
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            email: 'refreshed@example.com',
          }),
        });
      }
    });

    // Mock refresh endpoint
    await context.route('**/api/auth/refresh', async (route) => {
      refreshAttempted = true;
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token',
        }),
      });
    });

    await page.goto('/dashboard');

    // Should attempt refresh
    expect(refreshAttempted).toBe(true);

    // Should stay on dashboard with new token
    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Authorization - Role-Based Access', () => {
  test('should allow admin to access admin routes', async ({ page, context }) => {
    // Set admin user session
    await context.addCookies([
      {
        name: 'access_token',
        value: 'admin_token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await context.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          email: 'admin@example.com',
          role: 'admin',
        }),
      });
    });

    await page.goto('/admin');

    // Should allow access
    await expect(page).toHaveURL('/admin');
  });

  test('should deny regular user access to admin routes', async ({ page, context }) => {
    // Set regular user session
    await context.addCookies([
      {
        name: 'access_token',
        value: 'user_token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await context.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          email: 'user@example.com',
          role: 'user',
        }),
      });
    });

    await page.goto('/admin');

    // Should redirect to forbidden or dashboard
    await expect(page).not.toHaveURL('/admin');
    await expect(
      page.getByText(/forbidden|access denied|無權限/i)
    ).toBeVisible();
  });
});

test.describe('API Route Protection', () => {
  test('should return 401 for protected API routes without token', async ({ request }) => {
    const response = await request.get('/api/readings');

    expect(response.status()).toBe(401);
  });

  test('should return 401 for protected API routes with invalid token', async ({ request }) => {
    const response = await request.get('/api/readings', {
      headers: {
        'Authorization': 'Bearer invalid_token',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should allow access to protected API routes with valid token', async ({ request, context }) => {
    await context.route('**/api/readings', async (route) => {
      const authHeader = route.request().headers()['authorization'];

      if (authHeader === 'Bearer valid_token') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ readings: [] }),
        });
      } else {
        await route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Unauthorized' }),
        });
      }
    });

    const response = await request.get('/api/readings', {
      headers: {
        'Authorization': 'Bearer valid_token',
      },
    });

    expect(response.status()).toBe(200);
  });

  test('should allow access to public API routes without token', async ({ request, context }) => {
    await context.route('**/api/health', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ status: 'healthy' }),
      });
    });

    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);
  });
});

test.describe('Middleware Protection', () => {
  test('should protect routes based on middleware configuration', async ({ page, context }) => {
    await context.clearCookies();

    // Try to access route protected by middleware
    await page.goto('/readings/new');

    // Should be redirected by middleware
    await page.waitForURL('/auth/login');
    await expect(page).toHaveURL('/auth/login');
  });

  test('should allow access to routes excluded from middleware', async ({ page }) => {
    // Homepage excluded from auth middleware
    await page.goto('/');

    await expect(page).toHaveURL('/');
    await expect(page).not.toHaveURL('/auth/login');
  });

  test('should validate CSRF token on protected mutations', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'access_token',
        value: 'csrf_test_token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Mock CSRF validation
    await context.route('**/api/readings', async (route) => {
      if (route.request().method() === 'POST') {
        const csrfToken = route.request().headers()['x-csrf-token'];

        if (!csrfToken) {
          await route.fulfill({
            status: 403,
            body: JSON.stringify({ error: 'CSRF token missing' }),
          });
        } else {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({ id: 'new-reading' }),
          });
        }
      }
    });

    await page.goto('/readings/new');

    // Try to submit without CSRF token (should fail)
    const createButton = page.getByRole('button', { name: /create|建立/i });
    await createButton.click();

    // Should show CSRF error
    await expect(page.getByText(/csrf|token/i)).toBeVisible();
  });
});
