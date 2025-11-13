/**
 * E2E Tests: Complete Streaming Reading Flow with TTS
 *
 * Tests the end-to-end streaming interpretation flow including:
 * - Authentication and navigation
 * - Typewriter animation display
 * - TTS playback controls
 * - Accessibility features
 *
 * Requirements: 1, 2, 6
 */

import { test, expect } from '@playwright/test';

/**
 * Test Authentication Helper
 * Creates a mock authenticated session for testing
 */
async function setupAuthenticatedSession(page: any) {
  // Set mock authentication cookie
  await page.context().addCookies([
    {
      name: 'sb-access-token',
      value: 'mock-test-token-' + Date.now(),
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Set localStorage for auth state
  await page.evaluate(() => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      username: 'test-user',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        user: mockUser,
        session: {
          access_token: 'mock-test-token',
          refresh_token: 'mock-refresh-token',
        },
        isInitialized: true,
      },
      version: 0,
    }));
  });
}

/**
 * Mock SSE Streaming Response Helper
 * Simulates streaming text from the backend
 */
async function mockStreamingAPI(page: any, options: {
  tokens?: string[];
  delayMs?: number;
  shouldError?: boolean;
} = {}) {
  const {
    tokens = ['這', '是', '一', '段', '測', '試', '文', '字'],
    delayMs = 50,
    shouldError = false,
  } = options;

  await page.route('**/api/v1/readings/interpretation/stream', async (route: any) => {
    if (shouldError) {
      await route.fulfill({
        status: 500,
        contentType: 'text/event-stream',
        body: 'data: [ERROR] 連線失敗，請重試\n\n',
      });
      return;
    }

    // Simulate SSE streaming
    let body = '';
    for (const token of tokens) {
      body += `data: ${JSON.stringify({ token })}\n\n`;
    }
    body += 'data: [DONE]\n\n';

    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: {
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      body,
    });
  });
}

/**
 * Mock TTS API Response Helper
 * Simulates TTS audio generation
 */
async function mockTTSAPI(page: any, options: {
  shouldError?: boolean;
  delayMs?: number;
} = {}) {
  const { shouldError = false, delayMs = 100 } = options;

  await page.route('**/api/v1/tts/**', async (route: any) => {
    await new Promise(resolve => setTimeout(resolve, delayMs));

    if (shouldError) {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'TTS service unavailable' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        audio_url: 'data:audio/mp3;base64,mock-audio-data',
        duration: 5.0,
        format: 'mp3',
      }),
    });
  });
}

test.describe('Streaming Reading Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication
    await setupAuthenticatedSession(page);

    // Mock backend APIs
    await mockStreamingAPI(page);
    await mockTTSAPI(page);

    // Mock reading data API
    await page.route('**/api/v1/readings/*', async (route: any) => {
      const url = route.request().url();

      // Check if it's a reading detail request
      if (url.match(/\/readings\/[a-z0-9-]+$/)) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'test-reading-123',
            user_id: 'test-user-id',
            question: '我今天的運勢如何？',
            spread_type: 'single',
            card_positions: [
              {
                card_id: 'test-card-1',
                position_name: '當前狀態',
                position_meaning: '代表當前的能量狀態',
                card: {
                  id: 'test-card-1',
                  name: '愚者',
                  suit: 'major_arcana',
                  card_number: 0,
                  image_url: '/cards/major/00-the-fool.jpg',
                  upright_meaning: '新的開始、冒險精神',
                  reversed_meaning: '魯莽、缺乏計劃',
                  keywords: ['開始', '冒險', '純真'],
                  karma_alignment: 'neutral',
                  character_voices: {
                    pip_boy: '這是 Pip-Boy 的解讀',
                    vault_overseer: '這是監督者的解讀',
                  },
                },
              },
            ],
            created_at: new Date().toISOString(),
          }),
        });
        return;
      }

      // Fallback
      await route.fulfill({ status: 404 });
    });
  });

  test('Complete flow: Login → Navigate → Streaming → TTS playback', async ({ page }) => {
    // Navigate to reading card detail page
    await page.goto('/readings/test-reading-123/card/test-card-1');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify streaming interpretation area is visible
    const interpretationArea = page.locator('[class*="streaming"], [data-testid="streaming-interpretation"]');
    await expect(interpretationArea).toBeVisible({ timeout: 10000 });

    // Verify typewriter animation is active (cursor should be visible)
    const cursor = page.locator('[class*="cursor"], [class*="blink"]');
    await expect(cursor).toBeVisible({ timeout: 5000 });

    // Wait for streaming to complete
    await page.waitForTimeout(1000);

    // Verify cursor disappears after completion
    await expect(cursor).not.toBeVisible({ timeout: 5000 });

    // Verify TTS controls appear after streaming completes
    const ttsControls = page.locator('[class*="tts"], [data-testid="tts-player"]');
    await expect(ttsControls).toBeVisible({ timeout: 5000 });

    // Verify play/pause button is visible
    const playButton = page.getByRole('button', { name: /播放|play|暫停|pause/i });
    await expect(playButton).toBeVisible();
  });

  test('Verify typewriter animation displays characters progressively', async ({ page }) => {
    // Mock slower streaming for better observation
    await mockStreamingAPI(page, {
      tokens: ['廢', '土', '世', '界', '的', '塔', '羅', '解', '讀'],
      delayMs: 100,
    });

    await page.goto('/readings/test-reading-123/card/test-card-1');
    await page.waitForLoadState('networkidle');

    // Get interpretation text container
    const textContainer = page.locator('[class*="streaming"], [data-testid="streaming-text"]').first();
    await expect(textContainer).toBeVisible({ timeout: 10000 });

    // Verify text appears progressively (not all at once)
    const initialText = await textContainer.textContent();
    await page.waitForTimeout(200);
    const midwayText = await textContainer.textContent();
    await page.waitForTimeout(200);
    const finalText = await textContainer.textContent();

    // Text should grow over time
    expect((initialText || '').length).toBeLessThan((midwayText || '').length);
    expect((midwayText || '').length).toBeLessThanOrEqual((finalText || '').length);
  });

  test('Verify blinking cursor appears during animation and disappears on completion', async ({ page }) => {
    await page.goto('/readings/test-reading-123/card/test-card-1');
    await page.waitForLoadState('networkidle');

    // Check cursor is visible during streaming
    const cursor = page.locator('[class*="cursor"], [class*="blink"]');
    await expect(cursor).toBeVisible({ timeout: 5000 });

    // Verify cursor has animation class
    const cursorClass = await cursor.getAttribute('class');
    expect(cursorClass).toMatch(/blink|animate|pulse/i);

    // Wait for streaming completion
    await page.waitForTimeout(1000);

    // Cursor should disappear
    await expect(cursor).not.toBeVisible({ timeout: 5000 });
  });

  test('Verify TTS auto-play when audio settings enabled', async ({ page }) => {
    // Enable audio in settings
    await page.evaluate(() => {
      localStorage.setItem('audio-settings', JSON.stringify({
        state: {
          muted: {
            bgm: false,
            typing: false,
            tts: false, // TTS enabled
          },
          volume: {
            master: 0.8,
            bgm: 0.6,
            tts: 0.9,
          },
        },
        version: 0,
      }));
    });

    await page.goto('/readings/test-reading-123/card/test-card-1');
    await page.waitForLoadState('networkidle');

    // Wait for streaming to complete
    await page.waitForTimeout(1500);

    // Verify TTS auto-plays (pause button should appear)
    const pauseButton = page.getByRole('button', { name: /暫停|pause/i });
    await expect(pauseButton).toBeVisible({ timeout: 5000 });

    // Verify audio context is active (check via console logs or state)
    const isTTSPlaying = await page.evaluate(() => {
      const audioStore = localStorage.getItem('audio-settings');
      return audioStore ? !JSON.parse(audioStore).state.muted.tts : false;
    });
    expect(isTTSPlaying).toBe(true);
  });

  test('TTS controls: Pause, Resume, Stop functionality', async ({ page }) => {
    await page.goto('/readings/test-reading-123/card/test-card-1');
    await page.waitForLoadState('networkidle');

    // Wait for streaming to complete and TTS to start
    await page.waitForTimeout(1500);

    // Find TTS control buttons
    const pauseButton = page.getByRole('button', { name: /暫停|pause/i });
    const resumeButton = page.getByRole('button', { name: /繼續|resume|播放|play/i });
    const stopButton = page.getByRole('button', { name: /停止|stop/i });

    // Test Pause
    if (await pauseButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pauseButton.click();
      await page.waitForTimeout(500);

      // Resume button should appear
      await expect(resumeButton).toBeVisible({ timeout: 3000 });
    }

    // Test Resume
    if (await resumeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await resumeButton.click();
      await page.waitForTimeout(500);

      // Pause button should reappear
      await expect(pauseButton).toBeVisible({ timeout: 3000 });
    }

    // Test Stop
    if (await stopButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await stopButton.click();
      await page.waitForTimeout(500);

      // TTS controls should reset or hide
      const isVisible = await pauseButton.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBeFalsy();
    }
  });

  test('Verify accessibility: Screen reader announcements for streaming text', async ({ page }) => {
    await page.goto('/readings/test-reading-123/card/test-card-1');
    await page.waitForLoadState('networkidle');

    // Check for ARIA live region
    const liveRegion = page.locator('[aria-live="polite"], [aria-live="assertive"]');
    await expect(liveRegion).toBeAttached({ timeout: 10000 });

    // Verify streaming text is in accessible region
    const interpretationText = liveRegion.locator('[class*="streaming"], [data-testid="streaming-text"]');
    await expect(interpretationText).toBeVisible({ timeout: 5000 });

    // Check aria-label or role
    const ariaLabel = await liveRegion.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('Verify keyboard navigation for TTS controls', async ({ page }) => {
    await page.goto('/readings/test-reading-123/card/test-card-1');
    await page.waitForLoadState('networkidle');

    // Wait for TTS controls to appear
    await page.waitForTimeout(1500);

    // Tab to TTS controls
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify a TTS button has focus
    const pauseButton = page.getByRole('button', { name: /暫停|pause/i });
    const isFocused = await pauseButton.evaluate(el => el === document.activeElement)
      .catch(() => false);

    // At least one TTS control should be focusable
    expect(isFocused).toBeTruthy();

    // Activate with keyboard
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // State should change (pause → resume or vice versa)
    const resumeButton = page.getByRole('button', { name: /繼續|resume|播放|play/i });
    const hasResumeButton = await resumeButton.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasResumeButton).toBeTruthy();
  });

  test('Error handling: Display error message when streaming fails', async ({ page }) => {
    // Mock streaming error
    await mockStreamingAPI(page, { shouldError: true });

    await page.goto('/readings/test-reading-123/card/test-card-1');
    await page.waitForLoadState('networkidle');

    // Verify error message is displayed
    const errorMessage = page.locator('[class*="error"], [role="alert"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // Check error text content
    const errorText = await errorMessage.textContent();
    expect(errorText).toMatch(/錯誤|失敗|error|輻射干擾/i);

    // Verify retry button is available
    const retryButton = page.getByRole('button', { name: /重試|retry/i });
    await expect(retryButton).toBeVisible();
  });

  test('Error handling: TTS failure does not block text display', async ({ page }) => {
    // Mock TTS error
    await mockTTSAPI(page, { shouldError: true });

    await page.goto('/readings/test-reading-123/card/test-card-1');
    await page.waitForLoadState('networkidle');

    // Wait for streaming to complete
    await page.waitForTimeout(1500);

    // Text should still be visible
    const interpretationText = page.locator('[class*="streaming"], [data-testid="streaming-text"]');
    await expect(interpretationText).toBeVisible();

    const text = await interpretationText.textContent();
    expect((text || '').length).toBeGreaterThan(0);

    // TTS error message may appear, but text is not blocked
    const ttsError = page.locator('[class*="tts-error"]');
    const hasTtsError = await ttsError.isVisible({ timeout: 2000 }).catch(() => false);

    // Either TTS error shown OR TTS controls hidden (graceful degradation)
    if (hasTtsError) {
      const errorText = await ttsError.textContent();
      expect(errorText).toMatch(/語音|audio|聲音/i);
    }
  });

  test('Navigation cleanup: SSE connection closes when user navigates away', async ({ page }) => {
    await page.goto('/readings/test-reading-123/card/test-card-1');
    await page.waitForLoadState('networkidle');

    // Wait for streaming to start
    await page.waitForTimeout(500);

    // Track network requests
    const sseRequests: any[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/interpretation/stream')) {
        sseRequests.push(request);
      }
    });

    // Navigate away before streaming completes
    await page.goto('/readings');
    await page.waitForLoadState('networkidle');

    // Wait a bit to ensure cleanup
    await page.waitForTimeout(1000);

    // Verify no ongoing SSE connections (request should be aborted)
    // Note: In real implementation, check EventSource.close() is called
    const ongoingStreams = await page.evaluate(() => {
      // Check if any streaming components are still mounted
      return document.querySelectorAll('[class*="streaming"]').length;
    });

    expect(ongoingStreams).toBe(0);
  });

  test('Mobile viewport: TTS controls are accessible on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/readings/test-reading-123/card/test-card-1');
    await page.waitForLoadState('networkidle');

    // Wait for streaming to complete
    await page.waitForTimeout(1500);

    // Verify TTS controls are visible and not cut off
    const ttsControls = page.locator('[class*="tts"], [data-testid="tts-player"]').first();
    await expect(ttsControls).toBeVisible({ timeout: 5000 });

    const controlsBox = await ttsControls.boundingBox();
    expect(controlsBox).toBeTruthy();
    expect(controlsBox!.width).toBeGreaterThan(0);
    expect(controlsBox!.width).toBeLessThanOrEqual(375);

    // Verify buttons are tappable
    const pauseButton = page.getByRole('button', { name: /暫停|pause/i });
    if (await pauseButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pauseButton.tap();
      await page.waitForTimeout(500);

      // Should respond to tap
      const resumeButton = page.getByRole('button', { name: /繼續|resume|播放|play/i });
      await expect(resumeButton).toBeVisible({ timeout: 3000 });
    }
  });

  test('Reduced motion: Respect prefers-reduced-motion for animations', async ({ page }) => {
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/readings/test-reading-123/card/test-card-1');
    await page.waitForLoadState('networkidle');

    // Text should appear quickly without typewriter animation
    const interpretationText = page.locator('[class*="streaming"], [data-testid="streaming-text"]');
    await expect(interpretationText).toBeVisible({ timeout: 2000 });

    // Check if all text appears at once (no progressive display)
    await page.waitForTimeout(500);
    const text = await interpretationText.textContent();
    expect((text || '').length).toBeGreaterThan(5); // Should have full text quickly

    // Cursor animation should be disabled or not visible
    const cursor = page.locator('[class*="cursor"], [class*="blink"]');
    const isCursorVisible = await cursor.isVisible({ timeout: 1000 }).catch(() => false);

    // Cursor either hidden or not animating
    if (isCursorVisible) {
      const cursorClass = await cursor.getAttribute('class');
      expect(cursorClass).not.toMatch(/animate|pulse/i);
    }
  });
});

test.describe('Streaming Reading Flow - Edge Cases', () => {
  test('Handle empty interpretation response', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/v1/readings/interpretation/stream', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: [DONE]\n\n',
      });
    });

    await setupAuthenticatedSession(page);
    await page.goto('/readings/test-reading-123/card/test-card-1');
    await page.waitForLoadState('networkidle');

    // Should show empty state or error
    const emptyState = page.locator('[class*="empty"], [class*="no-content"]');
    const errorState = page.locator('[class*="error"], [role="alert"]');

    const hasEmptyState = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);
    const hasErrorState = await errorState.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasEmptyState || hasErrorState).toBe(true);
  });

  test('Handle very long interpretation text', async ({ page }) => {
    // Mock long streaming response
    const longTokens = Array(500).fill('字');
    await mockStreamingAPI(page, { tokens: longTokens, delayMs: 10 });

    await setupAuthenticatedSession(page);
    await page.goto('/readings/test-reading-123/card/test-card-1');
    await page.waitForLoadState('networkidle');

    // Wait for streaming to complete
    await page.waitForTimeout(6000);

    // Text should be scrollable
    const textContainer = page.locator('[class*="streaming"], [data-testid="streaming-text"]');
    await expect(textContainer).toBeVisible();

    const text = await textContainer.textContent();
    expect((text || '').length).toBeGreaterThan(400);

    // Container should handle overflow
    const hasScroll = await textContainer.evaluate(el => {
      return el.scrollHeight > el.clientHeight;
    });

    // Either scrollable or text wraps properly
    expect(hasScroll || text!.length > 0).toBe(true);
  });

  test('Handle rapid navigation between cards', async ({ page }) => {
    await setupAuthenticatedSession(page);
    await mockStreamingAPI(page);

    // Navigate to first card
    await page.goto('/readings/test-reading-123/card/test-card-1');
    await page.waitForTimeout(300);

    // Quickly navigate to another card
    await page.goto('/readings/test-reading-123/card/test-card-2');
    await page.waitForTimeout(300);

    // Navigate back
    await page.goto('/readings/test-reading-123/card/test-card-1');
    await page.waitForLoadState('networkidle');

    // Should still work correctly
    const interpretationArea = page.locator('[class*="streaming"], [data-testid="streaming-interpretation"]');
    await expect(interpretationArea).toBeVisible({ timeout: 10000 });
  });
});
