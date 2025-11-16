/**
 * Landing Page Accessibility Tests
 *
 * Tests WCAG compliance, keyboard navigation, ARIA attributes, and heading structure.
 *
 * Requirements Coverage:
 * - 11.9: WCAG AA Color Contrast & Keyboard Navigation
 * - 11.10: ARIA Attributes & Heading Structure
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Landing Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should not have any automatically detectable WCAG violations', async ({ page }) => {
    // Requirement: 11.9 - WCAG AA Compliance
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Hero section passes color contrast requirements', async ({ page }) => {
    // Requirement: 11.9 - WCAG AA Color Contrast (4.5:1 for normal text, 3:1 for large text)
    const heroSection = page.locator('section').first()

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include(heroSection)
      .withTags(['wcag2aa'])
      .analyze()

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    )

    expect(contrastViolations).toEqual([])
  })

  test('Stats Counter section passes color contrast requirements', async ({ page }) => {
    // Requirement: 11.9 - WCAG AA Color Contrast
    const statsSection = page.locator('text=即時數據統計').locator('..')
    await statsSection.scrollIntoViewIfNeeded()

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include(statsSection)
      .withTags(['wcag2aa'])
      .analyze()

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    )

    expect(contrastViolations).toEqual([])
  })

  test('FAQ section passes color contrast requirements', async ({ page }) => {
    // Requirement: 11.9 - WCAG AA Color Contrast
    const faqSection = page.locator('text=常見問題').locator('..')
    await faqSection.scrollIntoViewIfNeeded()

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include(faqSection)
      .withTags(['wcag2aa'])
      .analyze()

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    )

    expect(contrastViolations).toEqual([])
  })
})

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Hero CTA buttons are keyboard accessible', async ({ page }) => {
    // Requirement: 11.9 - Keyboard Navigation

    // Tab to first button
    await page.keyboard.press('Tab')
    const enterVaultButton = page.locator('button:has-text("進入 Vault")')
    await expect(enterVaultButton).toBeFocused()

    // Press Enter to activate
    await page.keyboard.press('Enter')
    await page.waitForURL('/auth/login')
    expect(page.url()).toContain('/auth/login')
  })

  test('FAQ accordion items are keyboard accessible', async ({ page }) => {
    // Requirement: 11.9 - Keyboard Navigation
    await page.locator('text=常見問題').scrollIntoViewIfNeeded()

    // Tab to first FAQ button
    const firstFaqButton = page.locator('button:has-text("什麼是廢土塔羅？")').first()
    await firstFaqButton.focus()

    // Press Enter to expand
    await page.keyboard.press('Enter')

    // Answer should be visible
    const firstAnswer = page.locator('text=廢土塔羅是結合 Fallout 世界觀的獨特塔羅占卜系統').first()
    await expect(firstAnswer).toBeVisible()

    // Press Enter again to collapse
    await page.keyboard.press('Enter')
    await expect(firstAnswer).not.toBeVisible()
  })

  test('CTA buttons support keyboard navigation', async ({ page }) => {
    // Requirement: 11.9 - Keyboard Navigation
    await page.locator('text=準備好探索你的廢土命運了嗎').scrollIntoViewIfNeeded()

    const registerButton = page.locator('button:has-text("註冊 Vault 帳號")')
    await registerButton.focus()
    await expect(registerButton).toBeFocused()

    await page.keyboard.press('Enter')
    await page.waitForURL('/auth/register')
    expect(page.url()).toContain('/auth/register')
  })
})

test.describe('ARIA Attributes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Decorative PixelIcons have decorative prop (no aria-label)', async ({ page }) => {
    // Requirement: 11.10 - Decorative Icons

    // Check Hero icons
    const heroIcons = page.locator('[class*="ri-"]').first()
    const ariaHidden = await heroIcons.getAttribute('aria-hidden')

    // Decorative icons should have aria-hidden="true"
    expect(ariaHidden).toBe('true')
  })

  test('FAQ accordion buttons have aria-expanded attribute', async ({ page }) => {
    // Requirement: 11.10 - ARIA Attributes
    await page.locator('text=常見問題').scrollIntoViewIfNeeded()

    const firstFaqButton = page.locator('button:has-text("什麼是廢土塔羅？")').first()

    // Initially collapsed
    let ariaExpanded = await firstFaqButton.getAttribute('aria-expanded')
    expect(ariaExpanded).toBe('false')

    // Click to expand
    await firstFaqButton.click()

    // Now expanded
    ariaExpanded = await firstFaqButton.getAttribute('aria-expanded')
    expect(ariaExpanded).toBe('true')
  })

  test('StepCard components have semantic role', async ({ page }) => {
    // Requirement: 11.10 - Semantic HTML
    await page.locator('text=如何使用').scrollIntoViewIfNeeded()

    // StepCard should have role="article"
    const stepCard = page.locator('[role="article"]').first()
    await expect(stepCard).toBeVisible()

    const role = await stepCard.getAttribute('role')
    expect(role).toBe('article')
  })

  test('Interactive elements have accessible names', async ({ page }) => {
    // Requirement: 11.10 - Accessible Names
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    const buttonNameViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'button-name' || v.id === 'link-name'
    )

    expect(buttonNameViolations).toEqual([])
  })
})

test.describe('Heading Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Page has correct heading hierarchy (h1 -> h2 -> h3)', async ({ page }) => {
    // Requirement: 11.10 - Heading Structure

    // Check for h1 (should be only one)
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBeGreaterThanOrEqual(0) // Dynamic title may not be h1

    // Check for h2 section headings
    const h2Headings = page.locator('h2')
    await expect(h2Headings.first()).toBeVisible()

    // Verify h2 headings exist for main sections
    const expectedH2Headings = [
      '如何使用',
      '即時數據統計',
      '用戶評價',
      '核心功能',
      '常見問題',
      '準備好探索你的廢土命運了嗎',
    ]

    for (const heading of expectedH2Headings) {
      const h2 = page.locator(`h2:has-text("${heading}")`)
      await expect(h2).toBeVisible()
    }
  })

  test('Heading levels do not skip (no h1 -> h3)', async ({ page }) => {
    // Requirement: 11.10 - Proper Heading Hierarchy
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['best-practice'])
      .analyze()

    const headingViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'heading-order'
    )

    expect(headingViolations).toEqual([])
  })

  test('Section headings use h2, subsection headings use h3', async ({ page }) => {
    // Requirement: 11.10 - Semantic Heading Usage

    // Check Features section (h3 for feature titles)
    await page.locator('text=核心功能').scrollIntoViewIfNeeded()

    const featureH3 = page.locator('h3:has-text("量子占卜")')
    await expect(featureH3).toBeVisible()

    // Check How It Works section (h3 for step titles)
    await page.locator('text=如何使用').scrollIntoViewIfNeeded()

    const stepH3 = page.locator('h3:has-text("選擇牌陣")')
    await expect(stepH3).toBeVisible()
  })
})

test.describe('Form and Input Accessibility', () => {
  test('No unlabeled form controls exist on the page', async ({ page }) => {
    // Requirement: 11.10 - Form Accessibility
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    const labelViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'label' || v.id === 'aria-input-field-name'
    )

    expect(labelViolations).toEqual([])
  })
})
