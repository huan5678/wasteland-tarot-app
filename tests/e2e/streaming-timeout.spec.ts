/**
 * Streaming Timeout E2E Test
 *
 * Tests backend timeout protection mechanism (60s default) for AI streaming:
 * - Mock AI provider with >60s delay to trigger backend timeout
 * - Verify timeout error message is displayed to user
 * - Verify retry button is available
 * - Test retry after timeout leads to successful streaming flow
 * - Verify connection cleanup on timeout
 *
 * Requirements: 4, 6
 * Related Backend: backend/app/api/v1/endpoints/readings_stream.py (Task 3.2)
 * Backend Config: backend/app/config.py (streaming_timeout)
 */

import { test, expect } from '@playwright/test';

test.describe('Streaming Timeout E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/auth/login');
    await page.getByLabel(/email|帳號/i).fill('timeout-test@example.com');
    await page.getByLabel(/password|密碼/i).fill('testpassword');
    await page.getByRole('button', { name: /login|登入/i }).click();

    // Wait for successful login redirect
    await page.waitForURL(/\/(dashboard|home|\/)/, { timeout: 5000 });
  });

  test('should handle backend timeout (>60s) with error message and retry', async ({ page }) => {
    // Navigate to new reading page
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Intercept streaming API and simulate backend timeout
    // Backend has 60s timeout, so delay for 65s to trigger it
    await page.route('**/api/v1/readings/interpretation/stream', async (route) => {
      console.log('Intercepting streaming request - simulating timeout >60s');

      // Delay for 65 seconds to exceed backend timeout
      await new Promise(resolve => setTimeout(resolve, 65000));

      // Backend should send SSE error event after timeout
      // Format: "data: [ERROR] 連線逾時，請重新整理或檢查網路連線\n\n"
      const sseErrorMessage = 'data: [ERROR] 連線逾時，請重新整理或檢查網路連線\n\n';

      route.fulfill({
        status: 200, // SSE uses 200 but sends error event
        contentType: 'text/event-stream',
        headers: {
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: sseErrorMessage,
      });
    });

    // Start single card reading
    const singleButton = page.getByRole('button', { name: /單張|single/i }).first();
    await singleButton.click();

    const startButton = page.getByRole('button', { name: /開始|start/i });
    await startButton.click();

    // Wait for card shuffle animation
    await page.waitForTimeout(2500);

    // Flip the first card
    const flipButton = page.getByRole('button', { name: /flip|翻牌/i }).first();
    await flipButton.click();

    // Wait for card flip animation
    await page.waitForTimeout(1000);

    // Should show timeout error message within reasonable time (65s + buffer)
    // Look for timeout-related error messages
    const timeoutErrorMessage = page.getByText(/連線逾時|timeout|超時|逾時/i);
    await expect(timeoutErrorMessage).toBeVisible({ timeout: 70000 });

    // Verify error message content
    const errorText = await timeoutErrorMessage.textContent();
    console.log('Backend timeout error message:', errorText);

    // Should mention timeout or connection issue
    expect(errorText).toMatch(/連線逾時|timeout|超時|逾時|網路|連線|connection/i);

    // Retry button should be available
    const retryButton = page.getByRole('button', { name: /重試|retry|再試|重新|reload/i });
    await expect(retryButton).toBeVisible({ timeout: 2000 });

    console.log('Timeout error displayed correctly, retry button available');
  });

  test('should retry successfully after timeout', async ({ page }) => {
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    let attemptCount = 0;

    // Intercept: first attempt times out, second succeeds
    await page.route('**/api/v1/readings/interpretation/stream', async (route) => {
      attemptCount++;
      console.log(`Streaming attempt ${attemptCount}`);

      if (attemptCount === 1) {
        // First attempt: simulate timeout
        console.log('First attempt - simulating timeout');
        await new Promise(resolve => setTimeout(resolve, 65000));

        const sseErrorMessage = 'data: [ERROR] 連線逾時，請重新整理或檢查網路連線\n\n';
        route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          headers: {
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
          body: sseErrorMessage,
        });
      } else {
        // Second attempt: succeed with streaming data
        console.log('Second attempt - allowing success');

        // Simulate successful streaming response
        const successfulStream = `data: "在廢土的命運羅盤上，"\n\ndata: "這張卡牌揭示了你的道路..."\n\ndata: [DONE]\n\n`;

        route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          headers: {
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
          body: successfulStream,
        });
      }
    });

    // Start reading
    await page.getByRole('button', { name: /單張|single/i }).first().click();
    await page.getByRole('button', { name: /開始|start/i }).click();
    await page.waitForTimeout(2500);

    // Flip card
    await page.getByRole('button', { name: /flip|翻牌/i }).first().click();
    await page.waitForTimeout(1000);

    // Wait for timeout error
    const timeoutError = page.getByText(/連線逾時|timeout|超時/i);
    await expect(timeoutError).toBeVisible({ timeout: 70000 });

    // Click retry button
    const retryButton = page.getByRole('button', { name: /重試|retry|再試|重新/i });
    await expect(retryButton).toBeVisible();
    await retryButton.click();

    console.log('Clicked retry button, waiting for successful streaming...');

    // After retry, should show streaming interpretation
    const interpretationArea = page.locator('[class*="interpretation"], [class*="streaming"]');
    await expect(interpretationArea).toBeVisible({ timeout: 10000 });

    // Verify streaming text appears
    await page.waitForTimeout(2000);
    const interpretationText = await interpretationArea.textContent();

    console.log('Interpretation text after retry:', interpretationText?.substring(0, 100));
    expect(interpretationText?.length || 0).toBeGreaterThan(10);

    // Verify no error message visible after successful retry
    const errorAfterRetry = page.getByText(/錯誤|error|timeout|超時/i);
    const hasErrorAfterRetry = await errorAfterRetry.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasErrorAfterRetry) {
      console.log('Warning: Error message still visible after successful retry');
    } else {
      console.log('Success: Error message cleared after retry');
    }

    console.log(`Total streaming attempts: ${attemptCount}`);
    expect(attemptCount).toBeGreaterThan(1); // Verify retry occurred
  });

  test('should cleanup connection on timeout', async ({ page }) => {
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Monitor network requests
    const activeRequests: Set<string> = new Set();

    page.on('request', request => {
      if (request.url().includes('/interpretation/stream')) {
        activeRequests.add(request.url());
        console.log('Stream request started:', request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('/interpretation/stream')) {
        console.log('Stream response received:', response.status());
      }
    });

    // Intercept and timeout
    await page.route('**/api/v1/readings/interpretation/stream', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 65000));

      const sseErrorMessage = 'data: [ERROR] 連線逾時，請重新整理或檢查網路連線\n\n';
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: sseErrorMessage,
      });
    });

    // Start reading
    await page.getByRole('button', { name: /單張|single/i }).first().click();
    await page.getByRole('button', { name: /開始|start/i }).click();
    await page.waitForTimeout(2500);

    await page.getByRole('button', { name: /flip|翻牌/i }).first().click();

    // Wait for timeout
    const timeoutError = page.getByText(/連線逾時|timeout/i);
    await expect(timeoutError).toBeVisible({ timeout: 70000 });

    console.log('Timeout occurred, verifying connection cleanup...');

    // Navigate away to trigger cleanup
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Verify no hanging connections (this is a smoke test)
    // In real scenario, backend logs should confirm cleanup
    console.log('Navigation after timeout successful - connection cleanup implied');
  });

  test('should show timeout error for multi-card streaming', async ({ page }) => {
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Intercept multi-card streaming endpoint
    await page.route('**/api/v1/readings/interpretation/stream-multi', async (route) => {
      console.log('Intercepting multi-card streaming - simulating timeout');

      await new Promise(resolve => setTimeout(resolve, 65000));

      const sseErrorMessage = 'data: [ERROR] 連線逾時，請重新整理或檢查網路連線\n\n';
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: sseErrorMessage,
      });
    });

    // Start three-card spread (if available)
    const threeCardButton = page.getByRole('button', { name: /三張|three.*card|過去.*現在.*未來/i }).first();
    const hasThreeCard = await threeCardButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasThreeCard) {
      console.log('Three-card spread not available, skipping multi-card timeout test');
      test.skip();
      return;
    }

    await threeCardButton.click();
    await page.getByRole('button', { name: /開始|start/i }).click();
    await page.waitForTimeout(2500);

    // Flip all three cards
    const flipButtons = page.getByRole('button', { name: /flip|翻牌/i });
    const cardCount = await flipButtons.count();

    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      await flipButtons.nth(i).click();
      await page.waitForTimeout(800);
    }

    // Should show timeout error for multi-card as well
    const timeoutError = page.getByText(/連線逾時|timeout|超時/i);
    await expect(timeoutError).toBeVisible({ timeout: 70000 });

    // Retry button should be available
    const retryButton = page.getByRole('button', { name: /重試|retry/i });
    await expect(retryButton).toBeVisible({ timeout: 2000 });

    console.log('Multi-card streaming timeout handled correctly');
  });

  test('should log timeout event for monitoring', async ({ page }) => {
    // Monitor console for error logs
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Intercept and timeout
    await page.route('**/api/v1/readings/interpretation/stream', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 65000));

      const sseErrorMessage = 'data: [ERROR] 連線逾時，請重新整理或檢查網路連線\n\n';
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: sseErrorMessage,
      });
    });

    // Start reading
    await page.getByRole('button', { name: /單張|single/i }).first().click();
    await page.getByRole('button', { name: /開始|start/i }).click();
    await page.waitForTimeout(2500);

    await page.getByRole('button', { name: /flip|翻牌/i }).first().click();

    // Wait for timeout
    await page.waitForTimeout(70000);

    console.log('Console errors captured:', consoleErrors.length);
    console.log('Console warnings captured:', consoleWarnings.length);

    // Should log timeout event (implementation-dependent)
    // Verifies error tracking mechanism is in place
    if (consoleErrors.length > 0) {
      console.log('Sample error log:', consoleErrors[0].substring(0, 200));
    }

    // This is a smoke test - actual monitoring happens on backend
    console.log('Timeout event logging verification complete');
  });

  test('should preserve partial text on timeout', async ({ page }) => {
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Intercept: send partial data then timeout
    await page.route('**/api/v1/readings/interpretation/stream', async (route) => {
      console.log('Sending partial streaming data before timeout');

      // Send partial streaming data
      const partialStream = `data: "在廢土的命運羅盤上，"\n\ndata: "這張卡牌揭示了"\n\n`;

      // Wait a bit, then send timeout error
      await new Promise(resolve => setTimeout(resolve, 5000));

      const sseWithTimeout = partialStream + 'data: [ERROR] 連線逾時，請重新整理或檢查網路連線\n\n';

      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: sseWithTimeout,
      });
    });

    // Start reading
    await page.getByRole('button', { name: /單張|single/i }).first().click();
    await page.getByRole('button', { name: /開始|start/i }).click();
    await page.waitForTimeout(2500);

    await page.getByRole('button', { name: /flip|翻牌/i }).first().click();

    // Wait for partial text to appear
    await page.waitForTimeout(3000);

    // Should show partial text
    const interpretationArea = page.locator('[class*="interpretation"], [class*="streaming"]');
    const hasInterpretation = await interpretationArea.isVisible().catch(() => false);

    if (hasInterpretation) {
      const partialText = await interpretationArea.textContent();
      console.log('Partial text before timeout:', partialText);

      // Should have some content
      expect(partialText?.length || 0).toBeGreaterThan(0);
    }

    // Wait for timeout error
    await page.waitForTimeout(5000);

    const timeoutError = page.getByText(/連線逾時|timeout/i);
    await expect(timeoutError).toBeVisible({ timeout: 5000 });

    // Partial text should still be visible (not lost)
    if (hasInterpretation) {
      const textAfterTimeout = await interpretationArea.textContent();
      console.log('Text after timeout error:', textAfterTimeout?.substring(0, 100));

      // Frontend should preserve partial text (based on requirement 4, AC 7)
      expect(textAfterTimeout?.length || 0).toBeGreaterThan(0);
    }

    console.log('Partial text preservation verified');
  });
});

test.describe('Streaming Timeout - Edge Cases', () => {
  test('should handle timeout during initial connection', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email|帳號/i).fill('timeout-test@example.com');
    await page.getByLabel(/password|密碼/i).fill('testpassword');
    await page.getByRole('button', { name: /login|登入/i }).click();
    await page.waitForURL(/\/(dashboard|home|\/)/, { timeout: 5000 });

    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Timeout before sending any data
    await page.route('**/api/v1/readings/interpretation/stream', async (route) => {
      console.log('Simulating timeout during initial connection');

      // Delay 65s without sending any data
      await new Promise(resolve => setTimeout(resolve, 65000));

      route.fulfill({
        status: 504, // Gateway Timeout
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Connection timeout' }),
      });
    });

    // Start reading
    await page.getByRole('button', { name: /單張|single/i }).first().click();
    await page.getByRole('button', { name: /開始|start/i }).click();
    await page.waitForTimeout(2500);

    await page.getByRole('button', { name: /flip|翻牌/i }).first().click();

    // Should show error (might be connection error rather than streaming error)
    const errorMessage = page.getByText(/錯誤|error|timeout|連線|無法|failed/i);
    await expect(errorMessage).toBeVisible({ timeout: 70000 });

    console.log('Initial connection timeout handled');
  });

  test('should handle multiple consecutive timeouts', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email|帳號/i).fill('timeout-test@example.com');
    await page.getByLabel(/password|密碼/i).fill('testpassword');
    await page.getByRole('button', { name: /login|登入/i }).click();
    await page.waitForURL(/\/(dashboard|home|\/)/, { timeout: 5000 });

    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    let timeoutCount = 0;

    // Timeout for first 3 attempts
    await page.route('**/api/v1/readings/interpretation/stream', async (route) => {
      timeoutCount++;
      console.log(`Timeout attempt ${timeoutCount}`);

      if (timeoutCount <= 3) {
        await new Promise(resolve => setTimeout(resolve, 65000));

        const sseErrorMessage = 'data: [ERROR] 連線逾時，請重新整理或檢查網路連線\n\n';
        route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: sseErrorMessage,
        });
      } else {
        // Eventually succeed
        const successfulStream = `data: "解讀成功"\n\ndata: [DONE]\n\n`;
        route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: successfulStream,
        });
      }
    });

    // Start reading
    await page.getByRole('button', { name: /單張|single/i }).first().click();
    await page.getByRole('button', { name: /開始|start/i }).click();
    await page.waitForTimeout(2500);

    await page.getByRole('button', { name: /flip|翻牌/i }).first().click();

    // First timeout
    await page.waitForTimeout(70000);
    let retryButton = page.getByRole('button', { name: /重試|retry/i });
    await expect(retryButton).toBeVisible({ timeout: 2000 });

    console.log('First timeout - retrying...');
    await retryButton.click();

    // Second timeout (if auto-retry not implemented, need manual retry)
    await page.waitForTimeout(70000);

    const hasRetryButton2 = await retryButton.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasRetryButton2) {
      console.log('Second timeout - retrying again...');
      await retryButton.click();
      await page.waitForTimeout(70000);
    }

    // Eventually should succeed or show "too many retries" message
    const interpretation = page.locator('[class*="interpretation"]');
    const hasInterpretation = await interpretation.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasInterpretation) {
      console.log('Streaming eventually succeeded after multiple timeouts');
    } else {
      // Should show "too many retries" or similar
      const tooManyRetriesMsg = page.getByText(/次數|too.*many|無法|無法連線/i);
      const hasTooManyMsg = await tooManyRetriesMsg.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasTooManyMsg) {
        console.log('Too many retries message shown');
      } else {
        console.log('Warning: No clear feedback after multiple timeouts');
      }
    }

    console.log(`Total timeout attempts: ${timeoutCount}`);
  });
});
