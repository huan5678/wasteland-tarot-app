/**
 * E2E Tests - Drawer & Sheet Coordination
 * Drawer 與 Sheet 協調邏輯測試
 *
 * Task 25: 實作 Drawer 與 Sheet 的協調邏輯
 * Requirements 5.1, 5.5, 7.1, 7.2: Drawer 與 Sheet 協調
 */

import { test, expect } from '@playwright/test';

test.describe('Drawer & Sheet Coordination', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should minimize drawer when opening sheet', async ({ page }) => {
    // Step 1: Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await expect(page.locator('[data-testid="music-player-drawer"]')).toBeVisible();

    // Verify drawer is not minimized initially
    const drawerBeforeSheet = await page.locator('[data-testid="music-player-drawer"]').boundingBox();
    expect(drawerBeforeSheet?.height).toBeGreaterThan(100); // Should be normal/expanded height

    // Step 2: Open sheet
    await page.click('[aria-label="開啟播放清單"]');
    await expect(page.locator('[data-testid="playlist-sheet"]')).toBeVisible();

    // Wait for animation to complete
    await page.waitForTimeout(500);

    // Step 3: Verify drawer is minimized
    const drawerAfterSheet = await page.locator('[data-testid="music-player-drawer"]').boundingBox();

    // Drawer should be minimized (height ~80px)
    if (drawerAfterSheet) {
      expect(drawerAfterSheet.height).toBeLessThan(150);
    }
  });

  test('should keep drawer minimized after closing sheet', async ({ page }) => {
    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await expect(page.locator('[data-testid="music-player-drawer"]')).toBeVisible();

    // Open sheet (auto-minimizes drawer)
    await page.click('[aria-label="開啟播放清單"]');
    await expect(page.locator('[data-testid="playlist-sheet"]')).toBeVisible();
    await page.waitForTimeout(500);

    // Close sheet
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="playlist-sheet"]')).not.toBeVisible();
    await page.waitForTimeout(500);

    // Drawer should remain minimized (UX decision - let user control)
    const drawerAfterClose = await page.locator('[data-testid="music-player-drawer"]').boundingBox();

    if (drawerAfterClose) {
      expect(drawerAfterClose.height).toBeLessThan(150);
    }
  });

  test('should allow drawer to be manually expanded after sheet closes', async ({ page }) => {
    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await expect(page.locator('[data-testid="music-player-drawer"]')).toBeVisible();

    // Open sheet (auto-minimizes drawer)
    await page.click('[aria-label="開啟播放清單"]');
    await page.waitForTimeout(500);

    // Close sheet
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Manually expand drawer
    await page.click('[aria-label="展開播放器"]');
    await page.waitForTimeout(500);

    // Drawer should be expanded now
    const drawerAfterExpand = await page.locator('[data-testid="music-player-drawer"]').boundingBox();

    if (drawerAfterExpand) {
      expect(drawerAfterExpand.height).toBeGreaterThan(200);
    }
  });

  test('should not open both drawer and sheet simultaneously on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await expect(page.locator('[data-testid="music-player-drawer"]')).toBeVisible();

    // Open sheet
    await page.click('[aria-label="開啟播放清單"]');
    await expect(page.locator('[data-testid="playlist-sheet"]')).toBeVisible();

    // On mobile, opening sheet should minimize drawer
    const drawerVisible = await page.locator('[data-testid="music-player-drawer"]').isVisible();
    expect(drawerVisible).toBe(true); // Drawer still visible but minimized

    const drawerBox = await page.locator('[data-testid="music-player-drawer"]').boundingBox();
    if (drawerBox) {
      // Drawer should be minimized on mobile
      expect(drawerBox.height).toBeLessThan(150);
    }
  });

  test('should handle rapid drawer/sheet toggles gracefully', async ({ page }) => {
    // Rapidly toggle drawer and sheet
    for (let i = 0; i < 3; i++) {
      await page.click('[aria-label="開啟音樂播放器"]');
      await page.waitForTimeout(100);
      await page.click('[aria-label="開啟播放清單"]');
      await page.waitForTimeout(100);
      await page.keyboard.press('Escape'); // Close sheet
      await page.waitForTimeout(100);
    }

    // Should still be functional
    await page.click('[aria-label="開啟音樂播放器"]');
    await expect(page.locator('[data-testid="music-player-drawer"]')).toBeVisible();

    await page.click('[aria-label="開啟播放清單"]');
    await expect(page.locator('[data-testid="playlist-sheet"]')).toBeVisible();
  });

  test('should restore drawer state correctly after page reload', async ({ page }) => {
    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await expect(page.locator('[data-testid="music-player-drawer"]')).toBeVisible();

    // Open sheet (minimizes drawer)
    await page.click('[aria-label="開啟播放清單"]');
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // After reload, drawer and sheet should be closed (UI state not persisted)
    const drawerVisible = await page.locator('[data-testid="music-player-drawer"]').isVisible().catch(() => false);
    const sheetVisible = await page.locator('[data-testid="playlist-sheet"]').isVisible().catch(() => false);

    expect(drawerVisible).toBe(false);
    expect(sheetVisible).toBe(false);
  });

  test('should handle z-index stacking correctly', async ({ page }) => {
    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await expect(page.locator('[data-testid="music-player-drawer"]')).toBeVisible();

    // Open sheet
    await page.click('[aria-label="開啟播放清單"]');
    await expect(page.locator('[data-testid="playlist-sheet"]')).toBeVisible();

    // Get z-index values
    const drawerZIndex = await page.locator('[data-testid="music-player-drawer"]').evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });

    const sheetZIndex = await page.locator('[data-testid="playlist-sheet"]').evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });

    // Sheet should have higher z-index than drawer
    expect(Number(sheetZIndex)).toBeGreaterThan(Number(drawerZIndex));
  });

  test('should close sheet when clicking outside on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await expect(page.locator('[data-testid="music-player-drawer"]')).toBeVisible();

    // Open sheet
    await page.click('[aria-label="開啟播放清單"]');
    await expect(page.locator('[data-testid="playlist-sheet"]')).toBeVisible();

    // Click outside sheet (on the overlay)
    await page.locator('[data-radix-dialog-overlay]').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // Sheet should be closed
    await expect(page.locator('[data-testid="playlist-sheet"]')).not.toBeVisible();
  });

  test('should not close drawer when opening/closing sheet', async ({ page }) => {
    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await expect(page.locator('[data-testid="music-player-drawer"]')).toBeVisible();

    // Open sheet
    await page.click('[aria-label="開啟播放清單"]');
    await expect(page.locator('[data-testid="playlist-sheet"]')).toBeVisible();

    // Close sheet
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Drawer should still be visible (minimized)
    await expect(page.locator('[data-testid="music-player-drawer"]')).toBeVisible();
  });
});

test.describe('Desktop vs Mobile Behavior', () => {
  test('desktop: drawer and sheet can coexist (sheet on top)', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await expect(page.locator('[data-testid="music-player-drawer"]')).toBeVisible();

    // Open sheet
    await page.click('[aria-label="開啟播放清單"]');
    await expect(page.locator('[data-testid="playlist-sheet"]')).toBeVisible();

    // Both should be visible
    const drawerVisible = await page.locator('[data-testid="music-player-drawer"]').isVisible();
    const sheetVisible = await page.locator('[data-testid="playlist-sheet"]').isVisible();

    expect(drawerVisible).toBe(true);
    expect(sheetVisible).toBe(true);
  });

  test('mobile: opening sheet minimizes drawer to avoid clutter', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await expect(page.locator('[data-testid="music-player-drawer"]')).toBeVisible();

    // Get drawer height before opening sheet
    const drawerHeightBefore = await page.locator('[data-testid="music-player-drawer"]').boundingBox();

    // Open sheet
    await page.click('[aria-label="開啟播放清單"]');
    await expect(page.locator('[data-testid="playlist-sheet"]')).toBeVisible();
    await page.waitForTimeout(500);

    // Get drawer height after opening sheet
    const drawerHeightAfter = await page.locator('[data-testid="music-player-drawer"]').boundingBox();

    // Drawer should be minimized on mobile
    if (drawerHeightBefore && drawerHeightAfter) {
      expect(drawerHeightAfter.height).toBeLessThan(drawerHeightBefore.height);
      expect(drawerHeightAfter.height).toBeLessThan(150); // ~80px minimized
    }
  });

  test('responsive: sheet width adjusts to viewport', async ({ page }) => {
    // Test desktop width
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.click('[aria-label="開啟播放清單"]');

    let sheetWidth = await page.locator('[data-testid="playlist-sheet"]').boundingBox();
    expect(sheetWidth?.width).toBe(400); // Desktop: 400px

    // Close sheet
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Test mobile width
    await page.setViewportSize({ width: 375, height: 667 });
    await page.click('[aria-label="開啟播放清單"]');
    await page.waitForTimeout(500);

    sheetWidth = await page.locator('[data-testid="playlist-sheet"]').boundingBox();

    // Mobile: 90% of viewport width (375 * 0.9 = 337.5)
    if (sheetWidth) {
      expect(sheetWidth.width).toBeGreaterThan(300);
      expect(sheetWidth.width).toBeLessThan(375);
    }
  });
});
