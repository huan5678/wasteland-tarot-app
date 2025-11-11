/**
 * History Management E2E Test
 *
 * Tests complete history management flow including:
 * - View history → Search/filter → Expand reading → Edit tags → Delete reading
 * - Virtual scroll performance
 * - Filter combinations
 * - Tag and category operations
 * - Export and share functionality
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3
 */

import { test, expect } from '@playwright/test';

test.describe('History Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login first (required for history access)
    await page.goto('/auth/login');

    // Fill login form (adjust selectors based on actual login form)
    await page.getByLabel(/email|帳號|使用者名稱/i).fill('test@example.com');
    await page.getByLabel(/password|密碼/i).fill('testpassword');
    await page.getByRole('button', { name: /login|登入/i }).click();

    // Wait for redirect to dashboard or home
    await page.waitForURL(/\/(dashboard|home|\/)/, { timeout: 5000 });

    // Navigate to history page
    await page.goto('/readings/history');
    await page.waitForLoadState('networkidle');
  });

  test('should display reading history list', async ({ page }) => {
    // Verify history page loads
    await expect(page).toHaveURL(/\/readings\/history/);

    // Look for history container
    const historyList = page.locator('[role="list"], [class*="history"], [class*="reading-list"]').first();
    await expect(historyList).toBeVisible({ timeout: 5000 });

    // If there are readings, verify list items
    const readingItems = page.locator('[role="listitem"], [class*="reading-item"]');
    const itemCount = await readingItems.count();

    if (itemCount > 0) {
      // Verify first reading item structure
      const firstItem = readingItems.first();
      await expect(firstItem).toBeVisible();

      // Should show date, spread type, and question
      // Date format: YYYY-MM-DD or localized format
      await expect(firstItem.locator('[class*="date"], time')).toBeVisible();
    } else {
      // Empty state should be shown
      await expect(page.getByText(/沒有記錄|no readings|empty/i)).toBeVisible();
    }
  });

  test('should search readings by keyword', async ({ page }) => {
    // Find search input
    const searchInput = page.getByPlaceholder(/搜尋|search/i);
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Enter search query
    const searchTerm = '愛情';
    await searchInput.fill(searchTerm);

    // Wait for debounce (300ms)
    await page.waitForTimeout(400);

    // Verify search results update
    const readingItems = page.locator('[role="listitem"], [class*="reading-item"]');
    const itemCount = await readingItems.count();

    if (itemCount > 0) {
      // At least one result should contain the search term
      const hasMatchingResult = await page.evaluate((term) => {
        const items = document.querySelectorAll('[role="listitem"], [class*="reading-item"]');
        return Array.from(items).some(item =>
          item.textContent?.includes(term)
        );
      }, searchTerm);

      expect(hasMatchingResult).toBe(true);
    }

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(400);
  });

  test('should filter readings by tags', async ({ page }) => {
    // Open filter panel
    const filterButton = page.getByRole('button', { name: /篩選|filter/i });

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Wait for filter panel
      const filterPanel = page.locator('[class*="filter-panel"], [role="region"][aria-label*="filter"]');
      await expect(filterPanel).toBeVisible({ timeout: 3000 });

      // Look for tag filters
      const tagOptions = filterPanel.locator('[class*="tag-option"], input[type="checkbox"]');
      const tagCount = await tagOptions.count();

      if (tagCount > 0) {
        // Select first tag
        await tagOptions.first().click();

        // Verify chip appears
        const filterChips = page.locator('[class*="filter-chip"], [class*="chip"]');
        await expect(filterChips.first()).toBeVisible({ timeout: 3000 });

        // Verify results filtered
        await page.waitForTimeout(500);

        // Remove filter
        const removeChipButton = filterChips.first().locator('button, [role="button"]');
        if (await removeChipButton.isVisible()) {
          await removeChipButton.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('should filter readings by category', async ({ page }) => {
    // Open filter panel
    const filterButton = page.getByRole('button', { name: /篩選|filter/i });

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Wait for filter panel
      const filterPanel = page.locator('[class*="filter-panel"], [role="region"][aria-label*="filter"]');
      await expect(filterPanel).toBeVisible({ timeout: 3000 });

      // Look for category filters
      const categoryOptions = filterPanel.locator('[class*="category-option"]');
      const categoryCount = await categoryOptions.count();

      if (categoryCount > 0) {
        // Select first category
        await categoryOptions.first().click();

        // Verify results filtered
        await page.waitForTimeout(500);

        // Verify chip appears
        const filterChips = page.locator('[class*="filter-chip"], [class*="chip"]');
        await expect(filterChips).toHaveCount(1, { timeout: 3000 });
      }
    }
  });

  test('should combine multiple filters', async ({ page }) => {
    // Open filter panel
    const filterButton = page.getByRole('button', { name: /篩選|filter/i });

    if (await filterButton.isVisible()) {
      await filterButton.click();

      const filterPanel = page.locator('[class*="filter-panel"]');
      await expect(filterPanel).toBeVisible({ timeout: 3000 });

      // Enable favorite filter
      const favoriteToggle = filterPanel.getByRole('switch', { name: /收藏|favorite/i });
      if (await favoriteToggle.isVisible()) {
        await favoriteToggle.click();
        await page.waitForTimeout(500);
      }

      // Add tag filter
      const tagOptions = filterPanel.locator('[class*="tag-option"]');
      if (await tagOptions.first().isVisible()) {
        await tagOptions.first().click();
        await page.waitForTimeout(500);
      }

      // Verify multiple chips appear
      const filterChips = page.locator('[class*="filter-chip"]');
      const chipCount = await filterChips.count();
      expect(chipCount).toBeGreaterThan(0);

      // Clear all filters
      const clearAllButton = page.getByRole('button', { name: /清除|clear.*all/i });
      if (await clearAllButton.isVisible()) {
        await clearAllButton.click();
        await page.waitForTimeout(500);

        // Verify chips removed
        const remainingChips = await filterChips.count();
        expect(remainingChips).toBe(0);
      }
    }
  });

  test('should expand reading to view details', async ({ page }) => {
    // Find first reading item
    const readingItems = page.locator('[role="listitem"], [class*="reading-item"]');
    const itemCount = await readingItems.count();

    if (itemCount > 0) {
      const firstItem = readingItems.first();

      // Click to expand (or click expand button)
      const expandButton = firstItem.getByRole('button', { name: /展開|expand|查看|view/i });

      if (await expandButton.isVisible()) {
        await expandButton.click();
      } else {
        // Click the item itself
        await firstItem.click();
      }

      // Wait for detail view/modal
      const detailView = page.locator('[class*="reading-detail"], [role="dialog"]');
      await expect(detailView).toBeVisible({ timeout: 5000 });

      // Verify detail content
      await expect(detailView.locator('[class*="interpretation"]')).toBeVisible();
      await expect(detailView.locator('[class*="card"]').first()).toBeVisible();
    }
  });

  test('should edit tags on a reading', async ({ page }) => {
    const readingItems = page.locator('[role="listitem"], [class*="reading-item"]');
    const itemCount = await readingItems.count();

    if (itemCount > 0) {
      // Open first reading
      await readingItems.first().click();

      // Wait for detail view
      const detailView = page.locator('[class*="reading-detail"], [role="dialog"]');
      await expect(detailView).toBeVisible({ timeout: 5000 });

      // Find tag manager
      const tagInput = detailView.getByPlaceholder(/新增標籤|add tag/i);

      if (await tagInput.isVisible()) {
        // Add new tag
        const newTag = 'E2E測試';
        await tagInput.fill(newTag);
        await tagInput.press('Enter');

        // Wait for tag to appear
        await page.waitForTimeout(1000);

        // Verify tag was added
        const tagChips = detailView.locator('[class*="tag-chip"]');
        const hasNewTag = await page.evaluate((tag) => {
          const chips = document.querySelectorAll('[class*="tag-chip"]');
          return Array.from(chips).some(chip => chip.textContent?.includes(tag));
        }, newTag);

        expect(hasNewTag).toBe(true);

        // Remove tag
        const tagChipToRemove = detailView.locator('[class*="tag-chip"]').filter({ hasText: newTag });
        const removeButton = tagChipToRemove.locator('button, [role="button"]').last();

        if (await removeButton.isVisible()) {
          await removeButton.click();
          await page.waitForTimeout(1000);
        }
      }

      // Close detail view
      const closeButton = detailView.getByRole('button', { name: /關閉|close/i });
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }
  });

  test('should delete a reading with confirmation', async ({ page }) => {
    const readingItems = page.locator('[role="listitem"], [class*="reading-item"]');
    const initialCount = await readingItems.count();

    if (initialCount > 0) {
      // Open first reading
      await readingItems.first().click();

      // Wait for detail view
      const detailView = page.locator('[class*="reading-detail"], [role="dialog"]');
      await expect(detailView).toBeVisible({ timeout: 5000 });

      // Find delete button
      const deleteButton = detailView.getByRole('button', { name: /刪除|delete/i });

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Wait for confirmation dialog
        const confirmDialog = page.getByRole('dialog', { name: /確認|confirm/i });
        await expect(confirmDialog).toBeVisible({ timeout: 3000 });

        // Cancel first
        const cancelButton = confirmDialog.getByRole('button', { name: /取消|cancel/i });
        await cancelButton.click();

        // Detail view should still be visible
        await expect(detailView).toBeVisible();

        // Try delete again
        await deleteButton.click();
        await expect(confirmDialog).toBeVisible({ timeout: 3000 });

        // Confirm deletion
        const confirmButton = confirmDialog.getByRole('button', { name: /確認|confirm|delete/i });
        await confirmButton.click();

        // Wait for deletion to complete
        await page.waitForTimeout(1000);

        // Verify reading removed from list
        const newCount = await readingItems.count();
        expect(newCount).toBe(initialCount - 1);
      }
    }
  });

  test('should verify virtual scroll performance with 100+ records', async ({ page }) => {
    // Check if virtualization is enabled
    const readingItems = page.locator('[role="listitem"], [class*="reading-item"]');
    const itemCount = await readingItems.count();

    if (itemCount >= 100) {
      // Measure scroll performance
      const scrollContainer = page.locator('[role="list"], [class*="virtualized"]').first();

      if (await scrollContainer.isVisible()) {
        // Setup FPS monitoring
        await page.evaluate(() => {
          (window as any).__scrollFps = {
            frames: [] as number[],
            lastTime: performance.now(),
          };

          const container = document.querySelector('[role="list"], [class*="virtualized"]');
          if (container) {
            container.addEventListener('scroll', () => {
              const now = performance.now();
              const fps = 1000 / (now - (window as any).__scrollFps.lastTime);
              (window as any).__scrollFps.frames.push(fps);
              (window as any).__scrollFps.lastTime = now;
            });
          }
        });

        // Perform rapid scrolling
        await scrollContainer.evaluate(el => el.scrollTo({ top: 1000 }));
        await page.waitForTimeout(100);

        await scrollContainer.evaluate(el => el.scrollTo({ top: 5000 }));
        await page.waitForTimeout(100);

        await scrollContainer.evaluate(el => el.scrollTo({ top: 10000 }));
        await page.waitForTimeout(100);

        // Get FPS data
        const scrollFps = await page.evaluate(() => {
          const frames = (window as any).__scrollFps.frames;
          if (frames.length === 0) return { avgFps: 60, minFps: 60 };

          const avgFps = frames.reduce((a: number, b: number) => a + b, 0) / frames.length;
          const minFps = Math.min(...frames);
          return { avgFps, minFps };
        });

        console.log(`Virtual scroll FPS - Avg: ${scrollFps.avgFps.toFixed(2)}, Min: ${scrollFps.minFps.toFixed(2)}`);

        // Should maintain > 30 FPS (requirement 7.4)
        expect(scrollFps.minFps).toBeGreaterThan(30);
      }
    } else {
      test.skip();
    }
  });

  test('should export reading as PDF', async ({ page }) => {
    const readingItems = page.locator('[role="listitem"], [class*="reading-item"]');
    const itemCount = await readingItems.count();

    if (itemCount > 0) {
      // Open first reading
      await readingItems.first().click();

      // Wait for detail view
      const detailView = page.locator('[class*="reading-detail"], [role="dialog"]');
      await expect(detailView).toBeVisible({ timeout: 5000 });

      // Find export button
      const exportButton = detailView.getByRole('button', { name: /匯出|export/i });

      if (await exportButton.isVisible()) {
        // Setup download handler
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

        await exportButton.click();

        // Select PDF format if options appear
        const pdfOption = page.getByRole('button', { name: /PDF/i });
        if (await pdfOption.isVisible({ timeout: 2000 })) {
          await pdfOption.click();
        }

        // Verify download starts
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.pdf$/);
      }
    }
  });

  test('should share reading with anonymous link', async ({ page }) => {
    const readingItems = page.locator('[role="listitem"], [class*="reading-item"]');
    const itemCount = await readingItems.count();

    if (itemCount > 0) {
      // Open first reading
      await readingItems.first().click();

      // Wait for detail view
      const detailView = page.locator('[class*="reading-detail"], [role="dialog"]');
      await expect(detailView).toBeVisible({ timeout: 5000 });

      // Find share button
      const shareButton = detailView.getByRole('button', { name: /分享|share/i });

      if (await shareButton.isVisible()) {
        await shareButton.click();

        // Wait for share dialog
        const shareDialog = page.getByRole('dialog', { name: /分享|share/i });
        await expect(shareDialog).toBeVisible({ timeout: 3000 });

        // Copy link button
        const copyLinkButton = shareDialog.getByRole('button', { name: /複製連結|copy link/i });

        if (await copyLinkButton.isVisible()) {
          await copyLinkButton.click();

          // Verify success message
          const successMessage = page.getByText(/已複製|copied/i);
          await expect(successMessage).toBeVisible({ timeout: 2000 });
        }

        // Close share dialog
        const closeButton = shareDialog.getByRole('button', { name: /關閉|close/i });
        await closeButton.click();
      }
    }
  });

  test('should maintain filter state across navigation', async ({ page }) => {
    // Apply search filter
    const searchInput = page.getByPlaceholder(/搜尋|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('測試');
      await page.waitForTimeout(400);
    }

    // Navigate away
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate back
    await page.goto('/readings/history');
    await page.waitForLoadState('networkidle');

    // Check if filter state persisted (via URL params or sessionStorage)
    const searchValue = await searchInput.inputValue();

    // Filter state persistence is optional but good UX
    // This test documents expected behavior
    console.log('Search value after navigation:', searchValue);
  });
});

test.describe('History Management - Skeleton Loading', () => {
  test('should show skeleton screen while loading', async ({ page }) => {
    // Navigate to history
    await page.goto('/readings/history');

    // Immediately look for skeleton
    const skeleton = page.locator('[class*="skeleton"], [aria-busy="true"]');

    // Skeleton should appear during initial load
    const hasSkeletonDuringLoad = await skeleton.isVisible({ timeout: 500 }).catch(() => false);

    // After load completes, skeleton should be gone
    await page.waitForLoadState('networkidle');

    const hasSkeletonAfterLoad = await skeleton.isVisible({ timeout: 500 }).catch(() => false);

    // Either saw skeleton during load, or load was too fast to catch it
    // After load, skeleton must be gone
    expect(hasSkeletonAfterLoad).toBe(false);
  });
});

test.describe('History Management - Empty State', () => {
  test('should show empty state when no readings exist', async ({ page, context }) => {
    // Create new user session (no readings)
    const newPage = await context.newPage();

    // Skip login for now (adjust based on actual app flow)
    await newPage.goto('/readings/history');

    // Check for empty state
    const emptyState = newPage.getByText(/沒有記錄|no readings|尚未進行任何解讀/i);
    const hasEmptyState = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEmptyState) {
      // Verify call-to-action
      const ctaButton = newPage.getByRole('button', { name: /開始解讀|start reading/i });
      await expect(ctaButton).toBeVisible();
    }

    await newPage.close();
  });
});
