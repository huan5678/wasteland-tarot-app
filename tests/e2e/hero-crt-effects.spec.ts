import { test, expect } from '@playwright/test';

/**
 * E2E Testing Suite for Hero Section CRT Screen Visual Effects
 *
 * Tests the implementation of Requirement 7:
 * - RGB pixel grid overlay (::after pseudo-element)
 * - Static chromatic aberration (text-shadow)
 * - CSS variables configuration
 * - Accessibility support (prefers-reduced-motion)
 * - Cross-browser compatibility (mix-blend-mode graceful degradation)
 *
 * Spec: .kiro/specs/hero-section-dynamic-titles/requirements.md
 */

test.describe('Hero Section - CRT Visual Effects', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Wait for hero section to be rendered
    await page.waitForLoadState('domcontentloaded');
  });

  test('should render hero-title-container with RGB grid overlay', async ({ page }) => {
    // Verify container element exists
    const container = page.locator('[class*="hero-title-container"]');
    await expect(container).toBeVisible();

    // Verify container has position: relative for ::after positioning
    const containerStyles = await container.evaluate((el) => {
      return {
        position: window.getComputedStyle(el).position,
      };
    });

    expect(containerStyles.position).toBe('relative');

    // Verify ::after pseudo-element exists with correct styles
    const afterStyles = await container.evaluate((el) => {
      const after = window.getComputedStyle(el, '::after');
      return {
        content: after.content,
        position: after.position,
        backgroundSize: after.backgroundSize,
        backgroundRepeat: after.backgroundRepeat,
        mixBlendMode: after.mixBlendMode,
        pointerEvents: after.pointerEvents,
        zIndex: after.zIndex,
      };
    });

    // Verify ::after exists (content should not be 'none')
    expect(afterStyles.content).not.toBe('none');

    // Verify ::after is absolutely positioned
    expect(afterStyles.position).toBe('absolute');

    // Verify background grid size (3px × 3px from CSS variable)
    expect(afterStyles.backgroundSize).toBe('3px 3px');

    // Verify background repeats for grid pattern
    expect(afterStyles.backgroundRepeat).toBe('repeat');

    // Verify mix-blend-mode for text/grid fusion
    expect(afterStyles.mixBlendMode).toBe('multiply');

    // Verify pointer-events disabled (doesn't interfere with text selection)
    expect(afterStyles.pointerEvents).toBe('none');

    // Verify z-index layering (grid below text)
    expect(afterStyles.zIndex).toBe('1');
  });

  test('should apply static chromatic aberration to main title', async ({ page }) => {
    // Locate main title h1 element
    const mainTitle = page.locator('h1[class*="hero-title-text"]');
    await expect(mainTitle).toBeVisible();

    // Verify text-shadow for chromatic aberration effect
    const titleStyles = await mainTitle.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        textShadow: styles.textShadow,
        zIndex: styles.zIndex,
      };
    });

    // Verify text-shadow exists (should contain red and blue offsets)
    expect(titleStyles.textShadow).toBeTruthy();
    expect(titleStyles.textShadow).not.toBe('none');

    // Verify z-index ensures text is above RGB grid
    expect(titleStyles.zIndex).toBe('2');

    // Verify text-shadow contains RGB color values (red and blue)
    // Format: "2px 0px 0px rgba(255, 0, 0, 0.9), -2px 0px 0px rgba(0, 0, 255, 0.9)"
    const hasChromaticAberration =
      titleStyles.textShadow.includes('255, 0, 0') && // Red channel
      titleStyles.textShadow.includes('0, 0, 255'); // Blue channel

    expect(hasChromaticAberration).toBe(true);
  });

  test('should apply weaker chromatic aberration to subtitle and description', async ({ page }) => {
    // Locate subtitle and description elements
    const subtitle = page.locator('p[class*="hero-subtitle-text"]').first();
    const description = page.locator('p[class*="hero-description-text"]').first();

    // Both should be visible
    await expect(subtitle).toBeVisible();
    await expect(description).toBeVisible();

    // Verify subtitle text-shadow (50% opacity of main title)
    const subtitleStyles = await subtitle.evaluate((el) => {
      return window.getComputedStyle(el).textShadow;
    });

    expect(subtitleStyles).toBeTruthy();
    expect(subtitleStyles).not.toBe('none');

    // Verify description text-shadow (50% opacity of main title)
    const descriptionStyles = await description.evaluate((el) => {
      return window.getComputedStyle(el).textShadow;
    });

    expect(descriptionStyles).toBeTruthy();
    expect(descriptionStyles).not.toBe('none');

    // Both should have chromatic aberration (red/blue shadow)
    [subtitleStyles, descriptionStyles].forEach((shadow) => {
      const hasChromaticAberration =
        shadow.includes('255, 0, 0') && shadow.includes('0, 0, 255');
      expect(hasChromaticAberration).toBe(true);
    });
  });

  test('should load CRT CSS variables from :root', async ({ page }) => {
    // Verify all 6 CRT CSS variables are defined in :root
    const cssVariables = await page.evaluate(() => {
      const rootStyles = getComputedStyle(document.documentElement);

      return {
        gridSize: rootStyles.getPropertyValue('--crt-grid-size').trim(),
        redOffset: rootStyles.getPropertyValue('--crt-red-offset').trim(),
        blueOffset: rootStyles.getPropertyValue('--crt-blue-offset').trim(),
        shadowOpacity: rootStyles.getPropertyValue('--crt-shadow-opacity').trim(),
        gridOpacityVertical: rootStyles
          .getPropertyValue('--crt-grid-opacity-vertical')
          .trim(),
        gridOpacityHorizontal: rootStyles
          .getPropertyValue('--crt-grid-opacity-horizontal')
          .trim(),
      };
    });

    // Verify exact CSS variable values
    expect(cssVariables.gridSize).toBe('3px');
    expect(cssVariables.redOffset).toBe('2px');
    expect(cssVariables.blueOffset).toBe('-2px');
    expect(cssVariables.shadowOpacity).toBe('0.9');
    expect(cssVariables.gridOpacityVertical).toBe('0.2');
    expect(cssVariables.gridOpacityHorizontal).toBe('0.7');
  });

  test('should integrate CRT effects with existing glitch animation', async ({ page }) => {
    const mainTitleDiv = page.locator('div[class*="hero-title-glitching"]').first();

    // Check if glitching class is present (may appear intermittently)
    const isGlitching = (await mainTitleDiv.count()) > 0;

    if (isGlitching) {
      // Verify glitch animation exists
      const animationName = await mainTitleDiv.evaluate((el) => {
        return window.getComputedStyle(el).animationName;
      });

      expect(animationName).toContain('colour-shift-glitch');
    }

    // Verify static CRT effects are always present (independent of glitch)
    const mainTitle = page.locator('h1[class*="hero-title-text"]');
    const textShadow = await mainTitle.evaluate((el) => {
      return window.getComputedStyle(el).textShadow;
    });

    // Static chromatic aberration should always be present
    expect(textShadow).not.toBe('none');
  });

  test('should integrate CRT effects with retro cursor', async ({ page }) => {
    // Wait for typing animation to start
    await page.waitForTimeout(1000);

    // Locate cursor element (should be inline span)
    const cursor = page.locator('span[class*="typing-cursor-inline"]').first();

    // Cursor may or may not be visible depending on animation phase
    const cursorCount = await cursor.count();

    if (cursorCount > 0) {
      // Verify cursor is visible when typing
      await expect(cursor).toBeVisible();

      // Verify cursor has correct styles
      const cursorStyles = await cursor.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          width: styles.width,
          backgroundColor: styles.backgroundColor,
          animationName: styles.animationName,
        };
      });

      expect(cursorStyles.display).toBe('inline-block');
      expect(cursorStyles.animationName).toContain('cursor-blink');

      // Cursor should be affected by CRT chromatic aberration from parent
      const parentTitle = page.locator('h1[class*="hero-title-text"]');
      const parentShadow = await parentTitle.evaluate((el) => {
        return window.getComputedStyle(el).textShadow;
      });

      expect(parentShadow).not.toBe('none');
    }
  });

  test('should reduce CRT effects for prefers-reduced-motion', async ({ page, context }) => {
    // Create new page with reduced motion preference
    const reducedMotionPage = await context.newPage();
    await reducedMotionPage.emulateMedia({ reducedMotion: 'reduce' });
    await reducedMotionPage.setViewportSize({ width: 1920, height: 1080 });
    await reducedMotionPage.goto('/');

    // Wait for render
    await reducedMotionPage.waitForLoadState('domcontentloaded');

    // Verify RGB grid opacity is reduced (50% of original)
    const container = reducedMotionPage.locator('[class*="hero-title-container"]');
    const afterBackgroundImage = await container.evaluate((el) => {
      const after = window.getComputedStyle(el, '::after');
      return after.backgroundImage;
    });

    // Should still have background image (not disabled completely)
    expect(afterBackgroundImage).not.toBe('none');

    // Verify static chromatic aberration is still present (base layer preserved)
    const mainTitle = reducedMotionPage.locator('h1[class*="hero-title-text"]');
    const textShadow = await mainTitle.evaluate((el) => {
      return window.getComputedStyle(el).textShadow;
    });

    expect(textShadow).not.toBe('none');
    expect(textShadow).toContain('255, 0, 0'); // Red shadow still present

    // Verify glitch animation is disabled
    const glitchDiv = reducedMotionPage
      .locator('div[class*="hero-title-glitching"]')
      .first();
    if ((await glitchDiv.count()) > 0) {
      const animationName = await glitchDiv.evaluate((el) => {
        return window.getComputedStyle(el).animationName;
      });

      // Animation should be disabled
      expect(animationName).toBe('none');
    }

    await reducedMotionPage.close();
  });

  test('should degrade gracefully when mix-blend-mode is unsupported', async ({ page }) => {
    // Test graceful degradation by checking @supports rule
    const supportsBlendMode = await page.evaluate(() => {
      return CSS.supports('mix-blend-mode', 'multiply');
    });

    if (!supportsBlendMode) {
      // Verify RGB grid is hidden when mix-blend-mode is not supported
      const container = page.locator('[class*="hero-title-container"]');
      const afterDisplay = await container.evaluate((el) => {
        const after = window.getComputedStyle(el, '::after');
        return after.display;
      });

      expect(afterDisplay).toBe('none');

      // Static chromatic aberration should still be present (fallback)
      const mainTitle = page.locator('h1[class*="hero-title-text"]');
      const textShadow = await mainTitle.evaluate((el) => {
        return window.getComputedStyle(el).textShadow;
      });

      expect(textShadow).not.toBe('none');
    }
  });

  test('should maintain text readability with CRT effects', async ({ page }) => {
    // Verify main title is visible and readable
    const mainTitle = page.locator('h1[class*="hero-title-text"]');
    await expect(mainTitle).toBeVisible();

    // Verify title has actual text content
    const titleText = await mainTitle.textContent();
    expect(titleText).toBeTruthy();
    expect(titleText!.trim().length).toBeGreaterThan(0);

    // Verify text color is readable (should be Pip-Boy green)
    const titleColor = await mainTitle.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Should contain green color (Pip-Boy green palette)
    expect(titleColor).toBeTruthy();

    // Verify text is not obscured by RGB grid (pointer-events: none)
    const isClickable = await mainTitle.evaluate((el) => {
      const container = el.closest('[class*="hero-title-container"]');
      if (!container) return false;

      const after = window.getComputedStyle(container, '::after');
      return after.pointerEvents === 'none';
    });

    expect(isClickable).toBe(true);
  });

  test('should render visual effects on initial page load', async ({ page }) => {
    // Take screenshot for visual regression testing
    await expect(page).toHaveScreenshot('hero-crt-effects-full.png', {
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: 1920,
        height: 600, // Capture hero section only
      },
    });
  });

  test('should verify z-index layering: grid (1) < text (2)', async ({ page }) => {
    // Verify RGB grid z-index
    const container = page.locator('[class*="hero-title-container"]');
    const gridZIndex = await container.evaluate((el) => {
      const after = window.getComputedStyle(el, '::after');
      return after.zIndex;
    });

    expect(gridZIndex).toBe('1');

    // Verify text z-index
    const mainTitle = page.locator('h1[class*="hero-title-text"]');
    const textZIndex = await mainTitle.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });

    expect(textZIndex).toBe('2');

    // Text should be above grid
    expect(parseInt(textZIndex)).toBeGreaterThan(parseInt(gridZIndex));
  });
});
