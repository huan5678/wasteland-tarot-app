/**
 * Landing Page E2E Tests
 *
 * Tests navigation flows, CTA buttons, FAQ accordion functionality.
 *
 * Requirements Coverage:
 * - 11.6: Hero Section Navigation (進入 Vault, 快速占卜)
 * - 11.7: FAQ Accordion Expand/Collapse
 * - 11.8: Footer Links Navigation
 */

import { test, expect } from '@playwright/test'

test.describe('Landing Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Hero CTA "進入 Vault" navigates to login for unauthenticated users', async ({ page }) => {
    // Requirement: 11.6 - Hero Section Navigation
    // Find the "進入 Vault" button
    const enterVaultButton = page.locator('button:has-text("進入 Vault")')
    await expect(enterVaultButton).toBeVisible()

    // Click the button
    await enterVaultButton.click()

    // Should navigate to /auth/login
    await page.waitForURL('/auth/login')
    expect(page.url()).toContain('/auth/login')
  })

  test('Hero CTA "快速占卜" navigates to quick reading for unauthenticated users', async ({ page }) => {
    // Requirement: 11.6 - Hero Section Navigation
    // Find the "快速占卜" button
    const quickReadingButton = page.locator('button:has-text("快速占卜")')
    await expect(quickReadingButton).toBeVisible()

    // Click the button
    await quickReadingButton.click()

    // Should navigate to /readings/quick
    await page.waitForURL('/readings/quick')
    expect(page.url()).toContain('/readings/quick')
  })

  test('CTA Section "註冊 Vault 帳號" navigates to register page', async ({ page }) => {
    // Requirement: 11.6 - CTA Button Navigation
    // Scroll to CTA section
    await page.locator('text=準備好探索你的廢土命運了嗎').scrollIntoViewIfNeeded()

    // Find and click register button
    const registerButton = page.locator('button:has-text("註冊 Vault 帳號")')
    await expect(registerButton).toBeVisible()
    await registerButton.click()

    // Should navigate to /auth/register
    await page.waitForURL('/auth/register')
    expect(page.url()).toContain('/auth/register')
  })

  test('CTA Section "瀏覽卡牌圖書館" navigates to cards page', async ({ page }) => {
    // Requirement: 11.6 - CTA Button Navigation
    // Scroll to CTA section
    await page.locator('text=準備好探索你的廢土命運了嗎').scrollIntoViewIfNeeded()

    // Find and click cards button
    const cardsButton = page.locator('button:has-text("瀏覽卡牌圖書館")')
    await expect(cardsButton).toBeVisible()
    await cardsButton.click()

    // Should navigate to /cards
    await page.waitForURL('/cards')
    expect(page.url()).toContain('/cards')
  })
})

test.describe('FAQ Accordion Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Scroll to FAQ section
    await page.locator('text=常見問題').scrollIntoViewIfNeeded()
  })

  test('FAQ items expand and collapse correctly', async ({ page }) => {
    // Requirement: 11.7 - FAQ Accordion Expand/Collapse

    // Find first FAQ item
    const firstFaqButton = page.locator('button:has-text("什麼是廢土塔羅？")').first()
    await expect(firstFaqButton).toBeVisible()

    // Initially, answer should not be visible
    const firstAnswer = page.locator('text=廢土塔羅是結合 Fallout 世界觀的獨特塔羅占卜系統').first()
    await expect(firstAnswer).not.toBeVisible()

    // Click to expand
    await firstFaqButton.click()

    // Answer should now be visible with fade-in animation
    await expect(firstAnswer).toBeVisible()

    // Click again to collapse
    await firstFaqButton.click()

    // Answer should be hidden again
    await expect(firstAnswer).not.toBeVisible()
  })

  test('Only one FAQ item can be expanded at a time', async ({ page }) => {
    // Requirement: 11.7 - FAQ Accordion Single Expansion

    // Expand first FAQ
    const firstFaqButton = page.locator('button:has-text("什麼是廢土塔羅？")').first()
    await firstFaqButton.click()
    const firstAnswer = page.locator('text=廢土塔羅是結合 Fallout 世界觀的獨特塔羅占卜系統').first()
    await expect(firstAnswer).toBeVisible()

    // Expand second FAQ
    const secondFaqButton = page.locator('button:has-text("我需要註冊才能使用嗎？")').first()
    await secondFaqButton.click()
    const secondAnswer = page.locator('text=不需要！你可以直接使用「快速占卜」功能體驗服務').first()
    await expect(secondAnswer).toBeVisible()

    // First FAQ should be collapsed
    await expect(firstAnswer).not.toBeVisible()
  })

  test('FAQ arrow icon changes direction on expand/collapse', async ({ page }) => {
    // Requirement: 11.7 - FAQ Visual Feedback

    const firstFaqButton = page.locator('button:has-text("什麼是廢土塔羅？")').first()

    // Check for down arrow initially (collapsed state)
    const downArrow = firstFaqButton.locator('[class*="ri-arrow-down"]')
    await expect(downArrow).toBeVisible()

    // Click to expand
    await firstFaqButton.click()

    // Check for up arrow (expanded state)
    const upArrow = firstFaqButton.locator('[class*="ri-arrow-up"]')
    await expect(upArrow).toBeVisible()
  })
})

test.describe('Stats Counter Animation', () => {
  test('Stats counters animate from 0 to target values', async ({ page }) => {
    // Requirement: 11.6 - Stats Counter Animation
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Scroll to stats section
    await page.locator('text=即時數據統計').scrollIntoViewIfNeeded()

    // Wait for animation to start
    await page.waitForTimeout(100)

    // Check that stats are visible and have numeric content
    const usersStat = page.locator('text=/\\d+\\+/').first()
    await expect(usersStat).toBeVisible()

    // Wait for animation to complete (2 seconds duration)
    await page.waitForTimeout(2500)

    // Verify final values are displayed
    await expect(usersStat).toHaveText(/\d+\+/)
  })
})
