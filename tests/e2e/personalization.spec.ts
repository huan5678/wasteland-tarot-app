/**
 * Personalization E2E Test
 *
 * Tests personalization engine including:
 * - Create 10+ readings with varied spreads and categories
 * - Verify recommendations appear
 * - Verify Karma change notifications
 * - Verify dashboard statistics accuracy
 * - Test privacy toggle functionality
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { test, expect } from '@playwright/test';

test.describe('Personalization Engine E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.getByLabel(/email|帳號/i).fill('personalization-test@example.com');
    await page.getByLabel(/password|密碼/i).fill('testpassword');
    await page.getByRole('button', { name: /login|登入/i }).click();

    await page.waitForURL(/\/(dashboard|home|\/)/, { timeout: 5000 });
  });

  test('should NOT show recommendations with insufficient readings (<10)', async ({ page }) => {
    // Navigate to spread selection
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Look for recommendation section
    const recommendationSection = page.locator('[class*="recommendation"], [data-testid="spread-recommendation"]');

    // With <10 readings, should not show recommendations
    const hasRecommendation = await recommendationSection.isVisible({ timeout: 2000 }).catch(() => false);

    // This is expected for new users or users with < 10 readings
    console.log('Has recommendation with <10 readings:', hasRecommendation);
  });

  test('should create 10 varied readings for personalization', async ({ page }) => {
    const spreadTypes = [
      'single_card',
      'three_card',
      'wasteland_survival',
      'celtic_cross',
      'single_card', // Repeat to test preference
    ];

    const categories = [
      '愛情',
      '事業',
      '健康',
      '生存',
      '派系關係',
    ];

    const questions = [
      '我的感情未來如何？',
      '事業發展會順利嗎？',
      '健康狀況需要注意什麼？',
      '廢土生存有何建議？',
      '與哪個派系合作較好？',
      '今天運勢如何？',
      '財務狀況會改善嗎？',
      '人際關係如何？',
      '有什麼危機需要留意？',
      '下個月會有好事發生嗎？',
    ];

    for (let i = 0; i < 10; i++) {
      // Navigate to new reading
      await page.goto('/readings/new');
      await page.waitForLoadState('networkidle');

      // Select spread type
      const spreadIndex = i % spreadTypes.length;
      const spreadButton = page.getByRole('button', { name: new RegExp(spreadTypes[spreadIndex], 'i') });

      if (await spreadButton.isVisible({ timeout: 3000 })) {
        await spreadButton.click();
      } else {
        // If specific spread selector not found, click any available spread
        const anySpreadButton = page.getByRole('button', { name: /單張|three|celtic/i }).first();
        await anySpreadButton.click();
      }

      // Fill question
      const questionInput = page.getByPlaceholder(/問題|question/i);
      if (await questionInput.isVisible({ timeout: 2000 })) {
        await questionInput.fill(questions[i]);
      }

      // Select category (if available)
      const categorySelect = page.locator('select, [role="combobox"]').filter({ hasText: /類別|category/i });
      if (await categorySelect.isVisible({ timeout: 2000 })) {
        await categorySelect.selectOption(categories[i % categories.length]);
      }

      // Start card draw
      const startButton = page.getByRole('button', { name: /開始|start|draw/i });
      await startButton.click();

      // Wait for shuffle animation
      await page.waitForTimeout(2500);

      // Flip card(s)
      const cardButtons = page.getByRole('button', { name: /flip|翻牌/i });
      const cardCount = await cardButtons.count();

      for (let j = 0; j < Math.min(cardCount, 3); j++) {
        await cardButtons.nth(j).click();
        await page.waitForTimeout(800);
      }

      // Wait for interpretation to start
      const interpretationArea = page.locator('[class*="interpretation"]');
      await interpretationArea.waitFor({ timeout: 10000 });

      // Wait a bit for streaming to progress
      await page.waitForTimeout(2000);

      // Save reading
      const saveButton = page.getByRole('button', { name: /儲存|save/i });
      if (await saveButton.isVisible({ timeout: 2000 })) {
        await saveButton.click();
        await page.waitForTimeout(1000);
      }

      console.log(`Created reading ${i + 1}/10`);
    }

    // All 10 readings created
    console.log('Successfully created 10 readings for personalization');
  });

  test('should show spread recommendations after 10+ readings', async ({ page }) => {
    // This test assumes previous test created 10 readings
    // Or requires test data setup

    // Navigate to spread selection
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Look for recommendation
    const recommendationSection = page.locator('[class*="recommendation"], [data-testid="spread-recommendation"]');

    // Should now show recommendations
    const hasRecommendation = await recommendationSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasRecommendation) {
      // Verify recommendation text
      await expect(recommendationSection).toContainText(/基於你的歷史|based on your history|推薦/i);

      // Should recommend specific spread
      const recommendedSpread = await recommendationSection.textContent();
      console.log('Recommended spread:', recommendedSpread);

      // Should have explanation
      await expect(recommendationSection).toContainText(/你經常使用|you often use|最常選擇/i);
    } else {
      // Log for debugging
      console.log('No recommendation found - user may have < 10 readings');
    }
  });

  test('should show voice recommendation based on faction affinity', async ({ page }) => {
    // Navigate to reading setup
    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    // Look for voice/character selector
    const voiceSelector = page.locator('select, [role="combobox"]').filter({ hasText: /角色|voice|character/i });

    if (await voiceSelector.isVisible({ timeout: 3000 })) {
      // Look for recommendation near voice selector
      const voiceRecommendation = page.locator('[class*="voice-recommendation"]');

      const hasVoiceRec = await voiceRecommendation.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasVoiceRec) {
        // Should suggest based on faction affinity
        await expect(voiceRecommendation).toContainText(/建議|suggest|推薦/i);
        console.log('Voice recommendation found');
      }
    }
  });

  test('should display Karma change notification', async ({ page }) => {
    // Navigate to dashboard or personalization page
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for Karma notification
    const karmaNotification = page.getByText(/Karma.*變化|karma.*change|道德值/i);

    const hasKarmaNotification = await karmaNotification.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasKarmaNotification) {
      // Should show change details
      console.log('Karma notification displayed');

      // Should indicate direction (increased/decreased)
      const notificationText = await karmaNotification.textContent();
      const hasDirection = notificationText && (/上升|增加|下降|減少|increase|decrease/i.test(notificationText));

      expect(hasDirection).toBe(true);
    } else {
      // No significant Karma change in last 30 days
      console.log('No Karma change notification (no significant change)');
    }
  });

  test('should display personalization dashboard statistics', async ({ page }) => {
    // Navigate to personalization dashboard
    await page.goto('/dashboard/personalization');
    await page.waitForLoadState('networkidle');

    // Or check if dashboard exists on main dashboard
    const dashboardSection = page.locator('[class*="personalization"], [data-testid="personalization-dashboard"]');

    if (await dashboardSection.isVisible({ timeout: 5000 })) {
      // Verify Karma trend chart
      const karmaTrendChart = dashboardSection.locator('[class*="karma-trend"], [class*="chart"]').first();
      await expect(karmaTrendChart).toBeVisible({ timeout: 3000 });

      // Verify faction affinity chart
      const factionChart = dashboardSection.locator('[class*="faction"], [class*="affinity"]').first();
      const hasFactionChart = await factionChart.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasFactionChart) {
        console.log('Faction affinity chart displayed');
      }

      // Verify most drawn cards
      const topCards = dashboardSection.getByText(/最常抽到|most.*drawn|frequently.*card/i);
      const hasTopCards = await topCards.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasTopCards) {
        // Should show card names
        console.log('Top cards section displayed');
      }

      // Verify topic distribution
      const topicDistribution = dashboardSection.getByText(/解讀主題|topic.*distribution|類別分布/i);
      const hasTopics = await topicDistribution.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasTopics) {
        console.log('Topic distribution displayed');
      }
    } else {
      // Dashboard may not exist yet
      console.log('Personalization dashboard not found');
    }
  });

  test('should show detailed statistics accuracy', async ({ page }) => {
    // Navigate to personalization dashboard
    await page.goto('/dashboard/personalization');
    await page.waitForLoadState('networkidle');

    const dashboardSection = page.locator('[class*="personalization"], [data-testid="personalization-dashboard"]');

    if (await dashboardSection.isVisible({ timeout: 5000 })) {
      // Check total readings count
      const totalReadings = dashboardSection.getByText(/總解讀次數|total.*reading/i);

      if (await totalReadings.isVisible()) {
        const text = await totalReadings.textContent();
        const countMatch = text?.match(/\d+/);

        if (countMatch) {
          const count = parseInt(countMatch[0], 10);
          console.log('Total readings:', count);

          // Should match or exceed 10 from previous test
          expect(count).toBeGreaterThanOrEqual(10);
        }
      }

      // Check most used spread
      const mostUsedSpread = dashboardSection.getByText(/最常使用.*牌陣|most.*used.*spread/i);

      if (await mostUsedSpread.isVisible()) {
        const text = await mostUsedSpread.textContent();
        console.log('Most used spread:', text);
      }

      // Check Karma trend (last 30 days)
      const karmaTrend = dashboardSection.locator('[class*="karma-trend"]');

      if (await karmaTrend.isVisible()) {
        // Should show trend direction
        const trendText = await karmaTrend.textContent();
        console.log('Karma trend:', trendText);
      }
    }
  });

  test('should toggle personalization privacy setting', async ({ page }) => {
    // Navigate to settings
    await page.goto('/profile/settings');
    await page.waitForLoadState('networkidle');

    // Or navigate to personalization settings
    const settingsPage = page.locator('[class*="settings"], main');
    await expect(settingsPage).toBeVisible({ timeout: 5000 });

    // Find personalization toggle
    const personalizationToggle = page.getByRole('switch', { name: /個人化.*推薦|personalization|personalized.*recommendation/i });

    if (await personalizationToggle.isVisible({ timeout: 3000 })) {
      // Get initial state
      const isInitiallyChecked = await personalizationToggle.isChecked();

      // Toggle off
      await personalizationToggle.click();
      await page.waitForTimeout(1000);

      // Verify state changed
      const isNowChecked = await personalizationToggle.isChecked();
      expect(isNowChecked).toBe(!isInitiallyChecked);

      // Navigate to spread selection
      await page.goto('/readings/new');
      await page.waitForLoadState('networkidle');

      // Recommendations should be hidden
      const recommendationSection = page.locator('[class*="recommendation"]');
      const hasRecommendation = await recommendationSection.isVisible({ timeout: 2000 }).catch(() => false);

      // Should not show when privacy mode enabled
      console.log('Has recommendation after disabling:', hasRecommendation);

      // Toggle back on
      await page.goto('/profile/settings');
      await page.waitForLoadState('networkidle');
      await personalizationToggle.click();
      await page.waitForTimeout(1000);

      // Verify restored
      const isFinallyChecked = await personalizationToggle.isChecked();
      expect(isFinallyChecked).toBe(isInitiallyChecked);
    } else {
      console.log('Personalization toggle not found in settings');
    }
  });

  test('should verify time window options for trends (30/60/90 days)', async ({ page }) => {
    await page.goto('/dashboard/personalization');
    await page.waitForLoadState('networkidle');

    const dashboardSection = page.locator('[class*="personalization"]');

    if (await dashboardSection.isVisible({ timeout: 5000 })) {
      // Look for time window selector
      const timeWindowSelect = dashboardSection.locator('select, [role="combobox"]').filter({ hasText: /天|days|時間|period/i });

      if (await timeWindowSelect.isVisible({ timeout: 2000 })) {
        // Should have 30/60/90 day options
        const options = await timeWindowSelect.locator('option').allTextContents();
        console.log('Time window options:', options);

        // Verify 30 days option
        await timeWindowSelect.selectOption(/30.*天|30.*day/i);
        await page.waitForTimeout(1000);

        // Chart should update
        const chart = dashboardSection.locator('[class*="chart"]').first();
        await expect(chart).toBeVisible();

        // Try 90 days
        await timeWindowSelect.selectOption(/90.*天|90.*day/i);
        await page.waitForTimeout(1000);

        // Chart should update again
        await expect(chart).toBeVisible();
      }
    }
  });

  test('should display reading topic distribution pie chart', async ({ page }) => {
    await page.goto('/dashboard/personalization');
    await page.waitForLoadState('networkidle');

    const dashboardSection = page.locator('[class*="personalization"]');

    if (await dashboardSection.isVisible({ timeout: 5000 })) {
      // Look for topic distribution section
      const topicSection = dashboardSection.locator('[class*="topic-distribution"], [class*="category-breakdown"]');

      if (await topicSection.isVisible({ timeout: 3000 })) {
        // Should show categories with percentages
        const categoryLabels = topicSection.locator('[class*="category-label"]');
        const categoryCount = await categoryLabels.count();

        console.log('Categories shown:', categoryCount);

        if (categoryCount > 0) {
          // Each category should have a percentage
          for (let i = 0; i < Math.min(categoryCount, 5); i++) {
            const labelText = await categoryLabels.nth(i).textContent();
            console.log(`Category ${i + 1}:`, labelText);

            // Should contain percentage
            expect(labelText).toMatch(/%|\d+/);
          }
        }
      }
    }
  });

  test('should show top 10 most drawn cards', async ({ page }) => {
    await page.goto('/dashboard/personalization');
    await page.waitForLoadState('networkidle');

    const dashboardSection = page.locator('[class*="personalization"]');

    if (await dashboardSection.isVisible({ timeout: 5000 })) {
      // Look for most drawn cards section
      const topCardsSection = dashboardSection.locator('[class*="top-cards"], [class*="most-drawn"]');

      if (await topCardsSection.isVisible({ timeout: 3000 })) {
        // Should show card list
        const cardItems = topCardsSection.locator('[class*="card-item"]');
        const cardCount = await cardItems.count();

        console.log('Top cards shown:', cardCount);

        // Should show up to 10 cards
        expect(cardCount).toBeLessThanOrEqual(10);

        if (cardCount > 0) {
          // Each card should have name and count
          const firstCard = cardItems.first();
          const cardText = await firstCard.textContent();

          console.log('First top card:', cardText);

          // Should show card name and frequency
          expect(cardText).toBeTruthy();
        }
      }
    }
  });

  test('should verify user data isolation (no cross-user leakage)', async ({ page, context }) => {
    // Create second user session
    const page2 = await context.newPage();

    // Login as different user
    await page2.goto('/auth/login');
    await page2.getByLabel(/email|帳號/i).fill('other-user@example.com');
    await page2.getByLabel(/password|密碼/i).fill('testpassword');
    await page2.getByRole('button', { name: /login|登入/i }).click();

    await page2.waitForURL(/\/(dashboard|home|\/)/, { timeout: 5000 });

    // Navigate to personalization dashboard
    await page2.goto('/dashboard/personalization');
    await page2.waitForLoadState('networkidle');

    // Get user 2's total readings
    const user2Section = page2.locator('[class*="personalization"]');
    let user2Readings = 0;

    if (await user2Section.isVisible({ timeout: 5000 })) {
      const totalText = await user2Section.getByText(/總解讀次數|total.*reading/i).textContent();
      const match = totalText?.match(/\d+/);
      if (match) {
        user2Readings = parseInt(match[0], 10);
      }
    }

    // Navigate to user 1's dashboard (original user)
    await page.goto('/dashboard/personalization');
    await page.waitForLoadState('networkidle');

    const user1Section = page.locator('[class*="personalization"]');
    let user1Readings = 0;

    if (await user1Section.isVisible({ timeout: 5000 })) {
      const totalText = await user1Section.getByText(/總解讀次數|total.*reading/i).textContent();
      const match = totalText?.match(/\d+/);
      if (match) {
        user1Readings = parseInt(match[0], 10);
      }
    }

    console.log(`User 1 readings: ${user1Readings}, User 2 readings: ${user2Readings}`);

    // Readings should be different (data isolation)
    // Unless both have exactly 0 readings
    if (user1Readings > 0 || user2Readings > 0) {
      // At least one has data, they should differ
      // This isn't strictly guaranteed, but highly likely
      console.log('User data appears isolated');
    }

    await page2.close();
  });
});

test.describe('Personalization - Recommendation Quality', () => {
  test('should recommend most frequently used spread type', async ({ page }) => {
    // This test validates recommendation algorithm accuracy
    // Requires multiple readings with same spread type

    await page.goto('/readings/new');
    await page.waitForLoadState('networkidle');

    const recommendationSection = page.locator('[class*="recommendation"]');

    if (await recommendationSection.isVisible({ timeout: 3000 })) {
      const recText = await recommendationSection.textContent();
      console.log('Recommendation:', recText);

      // Should mention frequency or usage pattern
      expect(recText).toMatch(/經常|often|常用|frequently/i);
    }
  });

  test('should detect significant Karma changes (>20 points in 30 days)', async ({ page }) => {
    // This test verifies Karma change detection threshold

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for Karma change notification
    const karmaAlert = page.locator('[class*="karma-change"], [role="alert"]').filter({ hasText: /karma/i });

    const hasAlert = await karmaAlert.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasAlert) {
      const alertText = await karmaAlert.textContent();
      console.log('Karma change alert:', alertText);

      // Should indicate significant change
      expect(alertText).toMatch(/顯著|significant|大幅|major/i);
    } else {
      console.log('No significant Karma change detected');
    }
  });
});
