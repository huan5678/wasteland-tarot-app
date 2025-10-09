import { test, expect, type Page } from '@playwright/test';

/**
 * Comprehensive Visual Testing Suite for Fallout Theme Background Effects
 *
 * Tests all variants of the WastelandBackground component across different pages
 * to ensure visual consistency and proper rendering of all effects.
 */

test.describe('Fallout Background Effects - Visual Testing', () => {

  test.beforeEach(async ({ page }) => {
    // Ensure consistent testing environment
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Disable animations for consistent screenshots (unless specifically testing animations)
    await page.addInitScript(() => {
      // Override CSS animations for screenshot consistency
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `;
        document.head.appendChild(style);
      });
    });
  });

  test('should render homepage background with correct Fallout theme', async ({ page }) => {
    await page.goto('/');

    // Wait for background to be rendered
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    // Check background variant class
    const background = page.locator('.wasteland-background');
    await expect(background).toHaveClass(/wasteland-bg-homepage/);

    // Verify all background elements are present
    await expect(page.locator('.radiation-particles')).toBeVisible();
    await expect(page.locator('.wasteland-grid')).toBeVisible();
    await expect(page.locator('.scan-lines')).toBeVisible();
    await expect(page.locator('.screen-gradient')).toBeVisible();
    await expect(page.locator('.radiation-interference')).toBeVisible();

    // Verify particle count (should be 50 for medium intensity)
    const particles = page.locator('.particle');
    await expect(particles).toHaveCount(50);

    // Take screenshot for visual regression testing
    await expect(page).toHaveScreenshot('homepage-background.png', {
      fullPage: true,
      mask: [page.locator('.dynamic-content')], // Mask dynamic content if any
    });
  });

  test('should render login page background with radiation warning theme', async ({ page }) => {
    await page.goto('/auth/login');

    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    // Check login variant
    const background = page.locator('.wasteland-background');
    await expect(background).toHaveClass(/wasteland-bg-login/);

    // Verify radiation warning colors are applied (check CSS computed styles)
    const bgStyles = await background.evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage;
    });

    // Should contain radiation orange in gradient
    expect(bgStyles).toContain('rgb(255, 136, 0)');

    await expect(page).toHaveScreenshot('login-background.png', {
      fullPage: true,
    });
  });

  test('should render dashboard background with enhanced Pip-Boy theme', async ({ page }) => {
    // Note: This test assumes dashboard requires authentication
    // You may need to mock authentication or create a test route
    await page.goto('/dashboard');

    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    const background = page.locator('.wasteland-background');
    await expect(background).toHaveClass(/wasteland-bg-dashboard/);

    // Verify enhanced green theme
    const bgStyles = await background.evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage;
    });

    // Should contain Pip-Boy green variants
    expect(bgStyles).toContain('rgb(0, 68, 51)'); // pip-boy-green-deep

    await expect(page).toHaveScreenshot('dashboard-background.png', {
      fullPage: true,
    });
  });

  test('should verify color accuracy of Fallout theme palette', async ({ page }) => {
    await page.goto('/');

    // Test color variables are properly applied
    const colorTests = await page.evaluate(() => {
      const computedStyle = getComputedStyle(document.documentElement);

      return {
        pipBoyGreen: computedStyle.getPropertyValue('--color-pip-boy-green').trim(),
        radiationOrange: computedStyle.getPropertyValue('--color-radiation-orange').trim(),
        wastelandDark: computedStyle.getPropertyValue('--color-wasteland-dark').trim(),
        warningYellow: computedStyle.getPropertyValue('--color-warning-yellow').trim(),
      };
    });

    // Verify exact Fallout color values
    expect(colorTests.pipBoyGreen).toBe('#00ff88');
    expect(colorTests.radiationOrange).toBe('#ff8800');
    expect(colorTests.wastelandDark).toBe('#1a1a1a');
    expect(colorTests.warningYellow).toBe('#ffdd00');
  });

  test('should render scan line effects with proper animation timing', async ({ page }) => {
    await page.goto('/');

    // Re-enable animations for this specific test
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const animationStyle = document.querySelector('style[data-test="disable-animations"]');
        if (animationStyle) {
          animationStyle.remove();
        }
      });
    });

    await page.waitForSelector('.scan-lines', { state: 'visible' });

    // Test animation properties
    const scanLines = page.locator('.scan-lines');
    const animationDuration = await scanLines.evaluate((el) => {
      return window.getComputedStyle(el).animationDuration;
    });

    // Should have 2s animation duration for medium intensity
    expect(animationDuration).toBe('2s');

    // Test animation direction (top to bottom)
    const transformStart = await scanLines.evaluate((el) => {
      el.style.animationPlayState = 'paused';
      el.style.animationDelay = '0s';
      return window.getComputedStyle(el).transform;
    });

    expect(transformStart).toContain('translateY');
  });

  test('should display appropriate glow effects on interactive elements', async ({ page }) => {
    await page.goto('/');

    // Look for elements with glow effects
    const glowElements = page.locator('.glow-green, .btn-pip-boy, .text-glow-green');
    await expect(glowElements.first()).toBeVisible();

    // Test hover effects on buttons
    const pipBoyButton = page.locator('.btn-pip-boy').first();
    if (await pipBoyButton.count() > 0) {
      await pipBoyButton.hover();

      const boxShadow = await pipBoyButton.evaluate((el) => {
        return window.getComputedStyle(el).boxShadow;
      });

      // Should have green glow shadow
      expect(boxShadow).toContain('rgba(0, 255, 136');
    }
  });

  test('should verify grid texture visibility and spacing', async ({ page }) => {
    await page.goto('/');

    const grid = page.locator('.wasteland-grid');
    await expect(grid).toBeVisible();

    const gridStyles = await grid.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundSize: styles.backgroundSize,
        backgroundImage: styles.backgroundImage,
        opacity: styles.opacity,
      };
    });

    // Verify 50px grid spacing
    expect(gridStyles.backgroundSize).toBe('50px 50px');

    // Should be low opacity for subtlety
    const opacity = parseFloat(gridStyles.opacity);
    expect(opacity).toBeLessThan(0.2);
    expect(opacity).toBeGreaterThan(0);
  });

  test('should render radiation interference effect with proper pattern', async ({ page }) => {
    await page.goto('/');

    const interference = page.locator('.radiation-interference');
    await expect(interference).toBeVisible();

    const interferenceStyles = await interference.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        background: styles.background,
        opacity: styles.opacity,
        transform: styles.transform,
      };
    });

    // Should have repeating linear gradient
    expect(interferenceStyles.background).toContain('repeating-linear-gradient');

    // Should have reasonable opacity
    const opacity = parseFloat(interferenceStyles.opacity);
    expect(opacity).toBeLessThan(0.5);
    expect(opacity).toBeGreaterThan(0);
  });

  test('should maintain visual hierarchy with proper z-index layering', async ({ page }) => {
    await page.goto('/');

    // Check z-index stacking
    const background = page.locator('.wasteland-background');
    const zIndex = await background.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });

    // Background should be behind content
    expect(parseInt(zIndex)).toBeLessThan(0);

    // Verify background doesn't interfere with clickable elements
    const headerLinks = page.locator('header a');
    if (await headerLinks.count() > 0) {
      await expect(headerLinks.first()).toBeVisible();
      await headerLinks.first().click();
      // Should be able to navigate (background doesn't block interactions)
    }
  });

  test('should display consistent theme across all page variants', async ({ page }) => {
    const pages = [
      { url: '/', variant: 'homepage' },
      { url: '/auth/login', variant: 'login' },
      { url: '/cards', variant: 'default' },
      { url: '/readings', variant: 'default' },
    ];

    for (const pageTest of pages) {
      await page.goto(pageTest.url);
      await page.waitForSelector('.wasteland-background', { state: 'visible' });

      const background = page.locator('.wasteland-background');
      const hasExpectedClass = await background.evaluate((el, variant) => {
        return el.classList.contains(`wasteland-bg-${variant}`);
      }, pageTest.variant);

      expect(hasExpectedClass).toBe(true);

      // Verify core elements are present on all pages
      await expect(page.locator('.radiation-particles')).toBeVisible();
      await expect(page.locator('.wasteland-grid')).toBeVisible();
    }
  });
});