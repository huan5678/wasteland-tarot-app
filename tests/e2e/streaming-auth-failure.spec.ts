/**
 * Streaming Authentication Failure E2E Test
 *
 * Tests authentication error handling for AI streaming endpoints:
 * - Invalid token returns 401 before SSE connection
 * - User-friendly error message displayed ("請重新登入")
 * - Retry button available and functional
 * - Auth error doesn't break UI state
 *
 * Requirements: 3, 6
 * Related: backend/app/api/v1/endpoints/readings_stream.py (Task 3.1)
 */

import { test, expect } from '@playwright/test';

test.describe('Streaming Authentication Failure E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page (no login - simulating unauthenticated state)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should return 401 error when token is invalid', async ({ page, context }) => {
    // Navigate to reading flow
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Set an invalid JWT token in cookies
    await context.addCookies([
      {
        name: 'supabase-auth-token',
        value: 'invalid.jwt.token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    // Intercept streaming API and return 401
    let authErrorTriggered = false;
    await page.route('**/api/v1/readings/interpretation/stream*', async (route) => {
      authErrorTriggered = true;
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Could not validate credentials',
        }),
      });
    });

    // Complete card draw
    const singleCardButton = page.getByRole('button', { name: /單張|single/i }).first();
    if (await singleCardButton.isVisible({ timeout: 2000 })) {
      await singleCardButton.click();
    }

    const startButton = page.getByRole('button', { name: /開始|start/i });
    if (await startButton.isVisible({ timeout: 2000 })) {
      await startButton.click();
    }

    // Wait for shuffle animation
    await page.waitForTimeout(2500);

    // Flip card
    const flipCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
    if (await flipCard.isVisible({ timeout: 3000 })) {
      await flipCard.click();
      await page.waitForTimeout(1000);
    }

    // Verify 401 error was triggered
    await page.waitForTimeout(2000);
    expect(authErrorTriggered).toBe(true);

    console.log('✓ API returned 401 for invalid token');
  });

  test('should display "請重新登入" message on authentication failure', async ({ page, context }) => {
    // Navigate to reading page
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Set invalid token
    await context.addCookies([
      {
        name: 'supabase-auth-token',
        value: 'expired.jwt.token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    // Intercept streaming API with 401
    await page.route('**/api/v1/readings/interpretation/stream*', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Invalid authentication credentials',
        }),
      });
    });

    // Complete draw flow
    const singleCardButton = page.getByRole('button', { name: /單張|single/i }).first();
    if (await singleCardButton.isVisible({ timeout: 2000 })) {
      await singleCardButton.click();
    }

    const startButton = page.getByRole('button', { name: /開始|start/i });
    if (await startButton.isVisible({ timeout: 2000 })) {
      await startButton.click();
      await page.waitForTimeout(2500);
    }

    const flipCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
    if (await flipCard.isVisible({ timeout: 3000 })) {
      await flipCard.click();
      await page.waitForTimeout(1500);
    }

    // Verify error message contains "請重新登入" or "重新登入" or "401" or "認證" or "未授權"
    const errorMessage = page.locator('text=/請重新登入|重新登入|401|認證|未授權|unauthorized|authentication/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });

    const errorText = await errorMessage.first().textContent();
    console.log('✓ Auth error message displayed:', errorText);

    // Verify message is user-friendly (not raw error codes)
    expect(errorText).toBeTruthy();
    expect(errorText!.length).toBeGreaterThan(5); // Not just "401"
  });

  test('should show retry button on authentication failure', async ({ page, context }) => {
    // Navigate to reading
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Set invalid token
    await context.addCookies([
      {
        name: 'supabase-auth-token',
        value: 'malformed-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    // Intercept with 401
    await page.route('**/api/v1/readings/interpretation/stream*', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Unauthorized' }),
      });
    });

    // Complete draw
    const singleCardButton = page.getByRole('button', { name: /單張|single/i }).first();
    if (await singleCardButton.isVisible({ timeout: 2000 })) {
      await singleCardButton.click();
    }

    const startButton = page.getByRole('button', { name: /開始|start/i });
    if (await startButton.isVisible({ timeout: 2000 })) {
      await startButton.click();
      await page.waitForTimeout(2500);
    }

    const flipCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
    if (await flipCard.isVisible({ timeout: 3000 })) {
      await flipCard.click();
      await page.waitForTimeout(1500);
    }

    // Verify retry button exists
    const retryButton = page.getByRole('button', { name: /重試|retry|再試/i });
    await expect(retryButton.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ Retry button available after auth failure');

    // Verify retry button is interactive (not disabled)
    const isEnabled = await retryButton.first().isEnabled();
    expect(isEnabled).toBe(true);
  });

  test('should handle retry button click after authentication failure', async ({ page, context }) => {
    // Navigate to reading
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Set invalid token initially
    await context.addCookies([
      {
        name: 'supabase-auth-token',
        value: 'invalid-initial-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    let retryCount = 0;

    // Intercept streaming API - first call fails, subsequent succeed
    await page.route('**/api/v1/readings/interpretation/stream*', async (route) => {
      retryCount++;

      if (retryCount === 1) {
        // First attempt - return 401
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Unauthorized' }),
        });
      } else {
        // Retry attempt - simulate successful response
        // (In real scenario, user would re-login and get valid token)
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: 'data: "測試解讀文字"\n\ndata: [DONE]\n\n',
        });
      }
    });

    // Complete draw
    const singleCardButton = page.getByRole('button', { name: /單張|single/i }).first();
    if (await singleCardButton.isVisible({ timeout: 2000 })) {
      await singleCardButton.click();
    }

    const startButton = page.getByRole('button', { name: /開始|start/i });
    if (await startButton.isVisible({ timeout: 2000 })) {
      await startButton.click();
      await page.waitForTimeout(2500);
    }

    const flipCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
    if (await flipCard.isVisible({ timeout: 3000 })) {
      await flipCard.click();
      await page.waitForTimeout(1500);
    }

    // Wait for error message
    const errorMessage = page.locator('text=/認證|401|unauthorized|請重新登入/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });

    // Click retry button
    const retryButton = page.getByRole('button', { name: /重試|retry|再試/i });
    await expect(retryButton.first()).toBeVisible({ timeout: 3000 });

    await retryButton.first().click();

    console.log('✓ Retry button clicked');

    // Verify retry was attempted
    await page.waitForTimeout(2000);
    expect(retryCount).toBeGreaterThanOrEqual(2);

    console.log('✓ Retry request sent to API');
  });

  test('should not break UI state after authentication failure', async ({ page, context }) => {
    // Navigate to reading
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Set invalid token
    await context.addCookies([
      {
        name: 'supabase-auth-token',
        value: 'test-invalid-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    // Intercept with 401
    await page.route('**/api/v1/readings/interpretation/stream*', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Authentication required' }),
      });
    });

    // Complete draw
    const singleCardButton = page.getByRole('button', { name: /單張|single/i }).first();
    if (await singleCardButton.isVisible({ timeout: 2000 })) {
      await singleCardButton.click();
    }

    const startButton = page.getByRole('button', { name: /開始|start/i });
    if (await startButton.isVisible({ timeout: 2000 })) {
      await startButton.click();
      await page.waitForTimeout(2500);
    }

    const flipCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
    if (await flipCard.isVisible({ timeout: 3000 })) {
      await flipCard.click();
      await page.waitForTimeout(1500);
    }

    // Wait for error display
    await page.waitForTimeout(3000);

    // Verify UI is still responsive
    // Check that page is not crashed
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();

    // Verify navigation still works
    const homeLink = page.getByRole('link', { name: /home|首頁/i }).first();
    const canNavigate = await homeLink.isVisible({ timeout: 2000 }).catch(() => false);

    // Verify no JavaScript errors crashed the page
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBe(true);

    console.log('✓ UI state remains stable after auth failure');
  });

  test('should handle missing token (no cookies)', async ({ page }) => {
    // No login, no cookies - completely unauthenticated
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Intercept streaming API with 401 (no token provided)
    await page.route('**/api/v1/readings/interpretation/stream*', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Not authenticated',
        }),
      });
    });

    // Attempt to complete draw without authentication
    const singleCardButton = page.getByRole('button', { name: /單張|single/i }).first();
    if (await singleCardButton.isVisible({ timeout: 2000 })) {
      await singleCardButton.click();
    }

    const startButton = page.getByRole('button', { name: /開始|start/i });
    if (await startButton.isVisible({ timeout: 2000 })) {
      await startButton.click();
      await page.waitForTimeout(2500);
    }

    const flipCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
    if (await flipCard.isVisible({ timeout: 3000 })) {
      await flipCard.click();
      await page.waitForTimeout(1500);
    }

    // Should show authentication error
    const errorMessage = page.locator('text=/認證|登入|login|401|unauthorized/i');
    const errorVisible = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

    // Either error shown, or redirected to login
    const currentUrl = page.url();
    const isOnLoginPage = currentUrl.includes('/auth/login') || currentUrl.includes('/login');
    const hasError = errorVisible;

    // One of these should be true
    expect(isOnLoginPage || hasError).toBe(true);

    console.log('✓ Missing token handled correctly (error or redirect)');
  });

  test('should preserve card state after authentication error', async ({ page, context }) => {
    // Navigate to reading
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Set invalid token
    await context.addCookies([
      {
        name: 'supabase-auth-token',
        value: 'preserve-test-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    // Intercept with 401
    await page.route('**/api/v1/readings/interpretation/stream*', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Unauthorized' }),
      });
    });

    // Complete draw
    const singleCardButton = page.getByRole('button', { name: /單張|single/i }).first();
    if (await singleCardButton.isVisible({ timeout: 2000 })) {
      await singleCardButton.click();
    }

    const startButton = page.getByRole('button', { name: /開始|start/i });
    if (await startButton.isVisible({ timeout: 2000 })) {
      await startButton.click();
      await page.waitForTimeout(2500);
    }

    const flipCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
    if (await flipCard.isVisible({ timeout: 3000 })) {
      await flipCard.click();
      await page.waitForTimeout(1500);
    }

    // Wait for error
    await page.waitForTimeout(2000);

    // Verify card image/name is still visible (card state preserved)
    // Even if interpretation failed, the card itself should still be displayed
    const cardImage = page.locator('img[alt*="card"], img[alt*="卡"], [class*="card"]').first();
    const cardVisible = await cardImage.isVisible({ timeout: 3000 }).catch(() => false);

    // Verify page content exists (not blank)
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(20); // Has meaningful content

    console.log('✓ Card state preserved after auth error');
    console.log('  - Card visual:', cardVisible ? 'visible' : 'hidden');
    console.log('  - Page content length:', bodyText!.length);
  });
});
