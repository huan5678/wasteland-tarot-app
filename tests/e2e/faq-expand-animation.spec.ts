/**
 * FAQ Expand Animation E2E Tests
 * Task 12.6: Playwright E2E tests for FAQ expand animation
 */

import { test, expect } from '@playwright/test';

test.describe('FAQ Section - Expand Animation (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for FAQ section to load
    await page.waitForSelector('text=常見問題', { timeout: 10000 });
  });

  test('should expand FAQ item smoothly when clicked', async ({ page }) => {
    // Find first FAQ question
    const firstQuestion = page.locator('text=什麼是廢土塔羅？').first();
    await expect(firstQuestion).toBeVisible();

    // Click to expand
    await firstQuestion.click();

    // Wait for animation and verify answer is visible
    await page.waitForTimeout(500); // Wait for animation to complete
    const firstAnswer = page.locator(
      'text=廢土塔羅是結合 Fallout 世界觀的獨特塔羅占卜系統'
    );
    await expect(firstAnswer).toBeVisible();
  });

  test('should collapse FAQ item when clicked again', async ({ page }) => {
    const firstQuestion = page.locator('text=什麼是廢土塔羅？').first();

    // Expand
    await firstQuestion.click();
    await page.waitForTimeout(500);

    const firstAnswer = page.locator(
      'text=廢土塔羅是結合 Fallout 世界觀的獨特塔羅占卜系統'
    );
    await expect(firstAnswer).toBeVisible();

    // Collapse
    await firstQuestion.click();
    await page.waitForTimeout(500);

    // Answer should not be visible
    await expect(firstAnswer).not.toBeVisible();
  });

  test('should implement accordion behavior (only one FAQ open at a time)', async ({
    page,
  }) => {
    const firstQuestion = page.locator('text=什麼是廢土塔羅？').first();
    const secondQuestion = page.locator('text=我需要註冊才能使用嗎？').first();

    // Expand first FAQ
    await firstQuestion.click();
    await page.waitForTimeout(500);

    const firstAnswer = page.locator(
      'text=廢土塔羅是結合 Fallout 世界觀的獨特塔羅占卜系統'
    );
    await expect(firstAnswer).toBeVisible();

    // Expand second FAQ (should close first)
    await secondQuestion.click();
    await page.waitForTimeout(500);

    const secondAnswer = page.locator('text=不需要！你可以直接使用');
    await expect(secondAnswer).toBeVisible();

    // First answer should no longer be visible
    await expect(firstAnswer).not.toBeVisible();
  });

  test('should rotate arrow icon during expand/collapse', async ({ page }) => {
    const firstQuestion = page.locator('text=什麼是廢土塔羅？').first();

    // Get arrow icon
    const arrowIcon = firstQuestion.locator('[aria-hidden="true"]');
    await expect(arrowIcon).toBeVisible();

    // Expand and check rotation (Framer Motion adds inline styles)
    await firstQuestion.click();
    await page.waitForTimeout(500);

    // Arrow should have transform style applied
    const arrowContainer = arrowIcon.locator('..');
    const transformStyle = await arrowContainer.getAttribute('style');
    expect(transformStyle).toContain('rotate');
  });

  test('should handle rapid clicks without breaking', async ({ page }) => {
    const firstQuestion = page.locator('text=什麼是廢土塔羅？').first();

    // Rapid clicks
    await firstQuestion.click();
    await firstQuestion.click();
    await firstQuestion.click();
    await firstQuestion.click();

    // Wait for animations to settle
    await page.waitForTimeout(1000);

    // Page should not crash, FAQ should be in stable state
    await expect(firstQuestion).toBeVisible();
  });

  test('should maintain correct aria-expanded attribute', async ({ page }) => {
    const firstQuestionButton = page.locator('button', {
      has: page.locator('text=什麼是廢土塔羅？'),
    });

    // Initial state
    await expect(firstQuestionButton).toHaveAttribute('aria-expanded', 'false');

    // Expanded state
    await firstQuestionButton.click();
    await page.waitForTimeout(500);
    await expect(firstQuestionButton).toHaveAttribute('aria-expanded', 'true');

    // Collapsed again
    await firstQuestionButton.click();
    await page.waitForTimeout(500);
    await expect(firstQuestionButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('should animate smoothly with no layout shift', async ({ page }) => {
    const faqSection = page.locator('section', {
      has: page.locator('text=常見問題'),
    });

    // Get initial position
    const initialBox = await faqSection.boundingBox();
    expect(initialBox).not.toBeNull();

    // Expand FAQ
    const firstQuestion = page.locator('text=什麼是廢土塔羅？').first();
    await firstQuestion.click();
    await page.waitForTimeout(500);

    // Section should expand smoothly without jumping
    const expandedBox = await faqSection.boundingBox();
    expect(expandedBox).not.toBeNull();
    expect(expandedBox!.height).toBeGreaterThan(initialBox!.height);
    expect(expandedBox!.y).toBe(initialBox!.y); // No vertical jump
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const firstQuestion = page.locator('text=什麼是廢土塔羅？').first();
    await expect(firstQuestion).toBeVisible();

    // Expand on mobile
    await firstQuestion.click();
    await page.waitForTimeout(500);

    const firstAnswer = page.locator(
      'text=廢土塔羅是結合 Fallout 世界觀的獨特塔羅占卜系統'
    );
    await expect(firstAnswer).toBeVisible();
  });

  test('should respect prefers-reduced-motion setting', async ({ page }) => {
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const firstQuestion = page.locator('text=什麼是廢土塔羅？').first();

    // Expand with reduced motion
    await firstQuestion.click();

    // Content should appear instantly (no animation delay)
    const firstAnswer = page.locator(
      'text=廢土塔羅是結合 Fallout 世界觀的獨特塔羅占卜系統'
    );
    await expect(firstAnswer).toBeVisible({ timeout: 100 });
  });

  test('should allow keyboard navigation', async ({ page }) => {
    // Tab to first FAQ
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Adjust tab count based on page structure

    // Press Enter to expand
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Verify first FAQ is expanded
    const firstAnswer = page.locator(
      'text=廢土塔羅是結合 Fallout 世界觀的獨特塔羅占卜系統'
    );
    await expect(firstAnswer).toBeVisible();
  });
});
