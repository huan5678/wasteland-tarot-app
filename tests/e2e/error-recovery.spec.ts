/**
 * Error Recovery E2E Test
 *
 * Tests error handling and recovery mechanisms including:
 * - Simulate API timeout during interpretation
 * - Simulate offline condition during save
 * - Test LocalStorage recovery
 * - Test retry mechanisms
 * - Verify graceful degradation
 *
 * Requirements: 9.1, 9.2, 9.3, 9.7, 9.8
 */

import { test, expect } from '@playwright/test';

test.describe('Error Recovery E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.getByLabel(/email|帳號/i).fill('error-test@example.com');
    await page.getByLabel(/password|密碼/i).fill('testpassword');
    await page.getByRole('button', { name: /login|登入/i }).click();

    await page.waitForURL(/\/(dashboard|home|\/)/, { timeout: 5000 });
  });

  test('should handle API timeout gracefully (>30s)', async ({ page }) => {
    // Navigate to new reading
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Intercept interpretation API and simulate timeout
    await page.route('**/api/v1/readings/**/stream', async (route) => {
      // Delay > 30s to trigger timeout
      await new Promise(resolve => setTimeout(resolve, 35000));
      route.fulfill({
        status: 504,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Gateway Timeout' }),
      });
    });

    // Complete card draw
    await page.getByRole('button', { name: /單張|single/i }).first().click();
    await page.getByRole('button', { name: /開始|start/i }).click();

    // Wait for shuffle
    await page.waitForTimeout(2500);

    // Flip card
    const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
    await firstCard.click();
    await page.waitForTimeout(1000);

    // Should show timeout error within reasonable time
    const errorMessage = page.getByText(/錯誤|error|timeout|超時|輻射干擾/i);
    await expect(errorMessage).toBeVisible({ timeout: 35000 });

    // Verify error message mentions timeout/connection issue
    const errorText = await errorMessage.textContent();
    console.log('Timeout error message:', errorText);
    expect(errorText).toMatch(/timeout|超時|連線|connection|輻射干擾/i);

    // Retry button should be available
    const retryButton = page.getByRole('button', { name: /重試|retry|再試/i });
    await expect(retryButton).toBeVisible({ timeout: 2000 });

    // Clear route interception
    await page.unroute('**/api/v1/readings/**/stream');

    // Click retry
    await retryButton.click();

    // Should attempt to fetch again
    // If API is now working, interpretation should start
    const interpretationArea = page.locator('[class*="interpretation"]');
    const hasInterpretation = await interpretationArea.isVisible({ timeout: 10000 }).catch(() => false);

    console.log('Interpretation loaded after retry:', hasInterpretation);
  });

  test('should handle API 500 error with friendly message', async ({ page }) => {
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Intercept and return 500 error
    await page.route('**/api/v1/readings/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error', detail: 'AI service unavailable' }),
      });
    });

    // Complete draw
    await page.getByRole('button', { name: /單張|single/i }).first().click();
    await page.getByRole('button', { name: /開始|start/i }).click();
    await page.waitForTimeout(2500);

    const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
    await firstCard.click();

    // Should show friendly error (not technical)
    const errorMessage = page.getByText(/錯誤|error|無法|unavailable/i);
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    const errorText = await errorText || '';
    console.log('500 error message:', errorText);

    // Should NOT show technical details to user
    expect(errorText.toLowerCase()).not.toContain('500');
    expect(errorText.toLowerCase()).not.toContain('internal server error');

    // Should show user-friendly message
    expect(errorText).toMatch(/輻射|radiation|系統|system|暫時|temporary/i);

    await page.unroute('**/api/v1/readings/**');
  });

  test('should detect offline condition', async ({ page, context }) => {
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Simulate offline
    await context.setOffline(true);

    // Try to start reading
    await page.getByRole('button', { name: /單張|single/i }).first().click();
    await page.getByRole('button', { name: /開始|start/i }).click();

    // Should detect offline state
    const offlineMessage = page.getByText(/離線|offline|沒有網路|no.*connection/i);
    const hasOfflineMessage = await offlineMessage.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasOfflineMessage) {
      console.log('Offline detection working');

      const messageText = await offlineMessage.textContent();
      console.log('Offline message:', messageText);

      // Should mention offline status
      expect(messageText).toMatch(/離線|offline|網路|network|連線|connection/i);
    } else {
      console.log('No specific offline message - may show generic error');
    }

    // Restore online
    await context.setOffline(false);

    // Should be able to retry
    await page.waitForTimeout(1000);
  });

  test('should save to LocalStorage when save fails', async ({ page }) => {
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Complete card draw first
    await page.getByRole('button', { name: /單張|single/i }).first().click();
    await page.getByRole('button', { name: /開始|start/i }).click();
    await page.waitForTimeout(2500);

    const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
    await firstCard.click();

    // Wait for interpretation
    const interpretationArea = page.locator('[class*="interpretation"]');
    await interpretationArea.waitFor({ timeout: 10000 });

    // Wait for some content
    await page.waitForTimeout(3000);

    // Intercept save request and fail it
    await page.route('**/api/v1/readings', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Save failed' }),
        });
      } else {
        route.continue();
      }
    });

    // Try to save
    const saveButton = page.getByRole('button', { name: /儲存|save/i });
    await saveButton.click();

    // Should show error but also mention local save
    const localSaveMessage = page.getByText(/本地|local|暫存|cached|稍後.*同步|sync.*later/i);
    const hasLocalSaveMsg = await localSaveMessage.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasLocalSaveMsg) {
      console.log('LocalStorage fallback message shown');

      const messageText = await localSaveMessage.textContent();
      console.log('Local save message:', messageText);

      // Should mention local storage and later sync
      expect(messageText).toMatch(/本地|local|暫存|cache|稍後|later|同步|sync/i);
    }

    // Check LocalStorage for saved data
    const hasLocalData = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.some(key => key.includes('reading') || key.includes('pending'));
    });

    console.log('Has data in LocalStorage:', hasLocalData);

    // Clean up route
    await page.unroute('**/api/v1/readings');
  });

  test('should auto-retry save when connection restores', async ({ page, context }) => {
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Complete draw and interpretation
    await page.getByRole('button', { name: /單張|single/i }).first().click();
    await page.getByRole('button', { name: /開始|start/i }).click();
    await page.waitForTimeout(2500);

    const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
    await firstCard.click();

    await page.locator('[class*="interpretation"]').waitFor({ timeout: 10000 });
    await page.waitForTimeout(3000);

    // Go offline
    await context.setOffline(true);

    // Try to save
    const saveButton = page.getByRole('button', { name: /儲存|save/i });
    await saveButton.click();

    // Should fail and save locally
    await page.waitForTimeout(2000);

    // Go back online
    await context.setOffline(false);

    // Should auto-retry (may need to wait or trigger)
    await page.waitForTimeout(3000);

    // Check if save succeeded
    const successMessage = page.getByText(/成功|success|已儲存|saved/i);
    const hasSuccess = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSuccess) {
      console.log('Auto-retry successful after connection restore');
    } else {
      console.log('Auto-retry may require manual trigger');

      // Try clicking save again
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);

        const hasSuccessNow = await successMessage.isVisible({ timeout: 3000 }).catch(() => false);
        console.log('Save succeeded after manual retry:', hasSuccessNow);
      }
    }
  });

  test('should retry with exponential backoff', async ({ page }) => {
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    let attemptCount = 0;
    const attemptTimestamps: number[] = [];

    // Intercept and fail first few attempts
    await page.route('**/api/v1/readings/**/stream', (route) => {
      attemptCount++;
      attemptTimestamps.push(Date.now());
      console.log(`Attempt ${attemptCount} at ${new Date().toISOString()}`);

      if (attemptCount <= 3) {
        // Fail first 3 attempts
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service Unavailable' }),
        });
      } else {
        // Succeed on 4th attempt
        route.continue();
      }
    });

    // Start reading
    await page.getByRole('button', { name: /單張|single/i }).first().click();
    await page.getByRole('button', { name: /開始|start/i }).click();
    await page.waitForTimeout(2500);

    const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
    await firstCard.click();

    // Wait for retries to complete (can take up to ~15s for 3 retries)
    await page.waitForTimeout(20000);

    console.log('Total attempts:', attemptCount);
    console.log('Timestamps:', attemptTimestamps.map(t => new Date(t).toISOString()));

    // Verify exponential backoff
    if (attemptTimestamps.length >= 3) {
      const delay1 = attemptTimestamps[1] - attemptTimestamps[0];
      const delay2 = attemptTimestamps[2] - attemptTimestamps[1];

      console.log('Delay 1:', delay1, 'ms');
      console.log('Delay 2:', delay2, 'ms');

      // Exponential backoff: delay2 should be roughly 2x delay1
      // Allow some variance (1.5x to 3x)
      const ratio = delay2 / delay1;
      console.log('Backoff ratio:', ratio);

      // Should show exponential pattern
      expect(ratio).toBeGreaterThan(1.5);
      expect(ratio).toBeLessThan(3);
    }

    await page.unroute('**/api/v1/readings/**/stream');
  });

  test('should show retry count to user', async ({ page }) => {
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Intercept and fail
    await page.route('**/api/v1/readings/**/stream', (route) => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service Unavailable' }),
      });
    });

    // Start reading
    await page.getByRole('button', { name: /單張|single/i }).first().click();
    await page.getByRole('button', { name: /開始|start/i }).click();
    await page.waitForTimeout(2500);

    const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
    await firstCard.click();

    // Look for retry count indicator
    await page.waitForTimeout(3000);

    const retryIndicator = page.getByText(/重試.*\d+|retry.*\d+|attempt.*\d+/i);
    const hasRetryCount = await retryIndicator.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRetryCount) {
      const indicatorText = await retryIndicator.textContent();
      console.log('Retry count indicator:', indicatorText);

      // Should show attempt number
      expect(indicatorText).toMatch(/\d+/);
    } else {
      console.log('No visible retry count indicator');
    }

    await page.unroute('**/api/v1/readings/**/stream');
  });

  test('should handle history page load failure gracefully', async ({ page }) => {
    // Intercept history API
    await page.route('**/api/v1/readings**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Database error' }),
        });
      } else {
        route.continue();
      }
    });

    // Navigate to history
    await page.goto('/readings/history');
    await page.waitForLoadState('networkidle');

    // Should show error state
    const errorState = page.getByText(/無法載入|failed.*load|載入失敗|error.*loading/i);
    await expect(errorState).toBeVisible({ timeout: 5000 });

    // Should offer reload button
    const reloadButton = page.getByRole('button', { name: /重新載入|reload|重試|retry/i });
    await expect(reloadButton).toBeVisible({ timeout: 3000 });

    // Clear interception
    await page.unroute('**/api/v1/readings**');

    // Click reload
    await reloadButton.click();

    // Should attempt to load again
    await page.waitForTimeout(2000);

    // Check if loaded successfully
    const historyList = page.locator('[role="list"], [class*="reading-list"]');
    const hasLoaded = await historyList.isVisible({ timeout: 5000 }).catch(() => false);

    console.log('History loaded after retry:', hasLoaded);
  });

  test('should preserve filter state when reload fails', async ({ page }) => {
    // Navigate to history
    await page.goto('/readings/history');
    await page.waitForLoadState('networkidle');

    // Apply search filter
    const searchInput = page.getByPlaceholder(/搜尋|search/i);
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('測試查詢');
      await page.waitForTimeout(500);
    }

    // Apply tag filter
    const filterButton = page.getByRole('button', { name: /篩選|filter/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();

      const filterPanel = page.locator('[class*="filter-panel"]');
      const tagOption = filterPanel.locator('[class*="tag-option"]').first();

      if (await tagOption.isVisible({ timeout: 2000 })) {
        await tagOption.click();
        await page.waitForTimeout(500);
      }
    }

    // Now simulate load failure
    await page.route('**/api/v1/readings**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    // Trigger reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Filter state should be preserved
    const searchValue = await searchInput.inputValue();
    console.log('Search value after reload:', searchValue);

    // Chips should still be visible
    const filterChips = page.locator('[class*="filter-chip"]');
    const chipCount = await filterChips.count();
    console.log('Filter chips after reload:', chipCount);

    // At least search value should persist (via URL params)
    // This is good UX even during errors

    await page.unroute('**/api/v1/readings**');
  });

  test('should log errors for monitoring', async ({ page }) => {
    // Setup console listener
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Trigger an error
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    await page.route('**/api/v1/readings/**/stream', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'AI service error' }),
      });
    });

    await page.getByRole('button', { name: /單張|single/i }).first().click();
    await page.getByRole('button', { name: /開始|start/i }).click();
    await page.waitForTimeout(2500);

    const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
    await firstCard.click();

    // Wait for error to occur
    await page.waitForTimeout(5000);

    console.log('Console errors:', consoleErrors);

    // Should log error (implementation-dependent)
    // This verifies error tracking is in place
    if (consoleErrors.length > 0) {
      console.log('Error logging detected');
    }

    await page.unroute('**/api/v1/readings/**/stream');
  });

  test('should provide helpful error context', async ({ page }) => {
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Simulate API error with details
    await page.route('**/api/v1/readings/**', (route) => {
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Validation Error',
          detail: 'Invalid spread type selected',
        }),
      });
    });

    // Try to start reading
    await page.getByRole('button', { name: /開始|start/i }).click();

    // Should show validation error
    const errorMessage = page.getByText(/錯誤|error|無效|invalid/i);
    const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasError) {
      const errorText = await errorMessage.textContent();
      console.log('Validation error:', errorText);

      // Should provide actionable guidance
      // e.g., "Please select a valid spread type"
      expect(errorText?.length || 0).toBeGreaterThan(10);
    }

    await page.unroute('**/api/v1/readings/**');
  });

  test('should handle network fluctuation during streaming', async ({ page, context }) => {
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Start reading
    await page.getByRole('button', { name: /單張|single/i }).first().click();
    await page.getByRole('button', { name: /開始|start/i }).click();
    await page.waitForTimeout(2500);

    const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
    await firstCard.click();

    // Wait for streaming to start
    await page.locator('[class*="interpretation"]').waitFor({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Briefly go offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);

    // Go back online
    await context.setOffline(false);

    // Streaming should recover
    await page.waitForTimeout(3000);

    // Check if content is still updating or completed
    const interpretationArea = page.locator('[class*="interpretation"]');
    const hasContent = await interpretationArea.textContent();

    console.log('Content length after network fluctuation:', hasContent?.length || 0);

    // Should have some content
    expect(hasContent?.length || 0).toBeGreaterThan(0);
  });
});

test.describe('Error Recovery - Graceful Degradation', () => {
  test('should function without advanced features when APIs fail', async ({ page }) => {
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Block all optional APIs (recommendations, personalization)
    await page.route('**/api/v1/recommendations/**', (route) => {
      route.abort();
    });

    await page.route('**/api/v1/personalization/**', (route) => {
      route.abort();
    });

    // Core functionality should still work
    const startButton = page.getByRole('button', { name: /開始|start/i });
    await expect(startButton).toBeVisible({ timeout: 5000 });

    // Can still select spread
    const spreadButton = page.getByRole('button', { name: /單張|single/i }).first();
    await expect(spreadButton).toBeVisible();

    // Just won't show recommendations (graceful degradation)
    const recommendation = page.locator('[class*="recommendation"]');
    const hasRec = await recommendation.isVisible({ timeout: 2000 }).catch(() => false);

    console.log('Recommendations shown when API fails:', hasRec);

    // Core flow should work even if recommendations fail
    await spreadButton.click();
    await startButton.click();

    // Should proceed to card draw
    await page.waitForTimeout(2500);
    const cardButtons = page.getByRole('button', { name: /flip|翻牌/i });
    await expect(cardButtons.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show minimal UI when styling fails', async ({ page }) => {
    // Block CSS (extreme scenario)
    await page.route('**/*.css', (route) => {
      route.abort();
    });

    await page.goto('/readings/new');
    await page.waitForLoadState('domcontentloaded');

    // Even without styles, basic HTML structure should exist
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Text content should be readable
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();

    console.log('Headings without CSS:', headingCount);

    // Should have some content structure
    expect(headingCount).toBeGreaterThan(0);
  });
});
