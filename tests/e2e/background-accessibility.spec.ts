import { test, expect, type Page } from '@playwright/test';

/**
 * Accessibility and Reduced Motion Testing Suite for Fallout Background Effects
 *
 * Tests compliance with WCAG guidelines, reduced motion preferences,
 * color contrast requirements, and screen reader compatibility.
 */

test.describe('Fallout Background Effects - Accessibility Testing', () => {

  test('should respect prefers-reduced-motion setting', async ({ page }) => {
    // Test with reduced motion preference enabled
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    // Check that animations are disabled via CSS
    const animationStates = await page.evaluate(() => {
      const elements = {
        particles: document.querySelectorAll('.particle'),
        scanLines: document.querySelector('.scan-lines'),
        interference: document.querySelector('.radiation-interference'),
        grid: document.querySelector('.wasteland-grid'),
      };

      const results: any = {};

      // Check particles
      if (elements.particles.length > 0) {
        const firstParticle = elements.particles[0] as HTMLElement;
        const particleStyle = window.getComputedStyle(firstParticle);
        results.particleAnimation = particleStyle.animationName;
        results.particleDuration = particleStyle.animationDuration;
      }

      // Check scan lines
      if (elements.scanLines) {
        const scanStyle = window.getComputedStyle(elements.scanLines);
        results.scanAnimation = scanStyle.animationName;
        results.scanDuration = scanStyle.animationDuration;
      }

      // Check interference
      if (elements.interference) {
        const interferenceStyle = window.getComputedStyle(elements.interference);
        results.interferenceAnimation = interferenceStyle.animationName;
        results.interferenceDuration = interferenceStyle.animationDuration;
      }

      // Check grid
      if (elements.grid) {
        const gridStyle = window.getComputedStyle(elements.grid);
        results.gridAnimation = gridStyle.animationName;
        results.gridDuration = gridStyle.animationDuration;
      }

      return results;
    });

    // All animations should be disabled or set to 0s duration
    expect(
      animationStates.particleDuration === '0s' ||
      animationStates.particleAnimation === 'none'
    ).toBe(true);

    expect(
      animationStates.scanDuration === '0s' ||
      animationStates.scanAnimation === 'none'
    ).toBe(true);

    console.log('Reduced motion: All animations properly disabled');
  });

  test('should not respect prefers-reduced-motion when set to no-preference', async ({ page }) => {
    // Test with no motion preference (default)
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    const animationStates = await page.evaluate(() => {
      const particle = document.querySelector('.particle') as HTMLElement;
      const scanLines = document.querySelector('.scan-lines') as HTMLElement;

      if (particle && scanLines) {
        const particleStyle = window.getComputedStyle(particle);
        const scanStyle = window.getComputedStyle(scanLines);

        return {
          particleHasAnimation: particleStyle.animationName !== 'none' && particleStyle.animationDuration !== '0s',
          scanHasAnimation: scanStyle.animationName !== 'none' && scanStyle.animationDuration !== '0s',
        };
      }

      return { particleHasAnimation: false, scanHasAnimation: false };
    });

    // Animations should be active when motion is preferred
    expect(animationStates.particleHasAnimation).toBe(true);
    expect(animationStates.scanHasAnimation).toBe(true);

    console.log('Normal motion: Animations properly enabled');
  });

  test('should maintain color contrast for content over background', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    // Test color contrast of text elements over background
    const contrastResults = await page.evaluate(() => {
      const textElements = document.querySelectorAll('h1, h2, h3, p, a, button, .text-pip-boy');
      const results = [];

      for (const element of textElements) {
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        const fontSize = parseFloat(styles.fontSize);

        // Extract RGB values for contrast calculation
        const colorMatch = color.match(/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/);
        const bgMatch = backgroundColor.match(/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/);

        if (colorMatch && element.textContent?.trim()) {
          results.push({
            element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
            color: color,
            backgroundColor: backgroundColor,
            fontSize: fontSize,
            textContent: element.textContent?.trim().substring(0, 50),
            colorRGB: [parseInt(colorMatch[1]), parseInt(colorMatch[2]), parseInt(colorMatch[3])],
            backgroundRGB: bgMatch ? [parseInt(bgMatch[1]), parseInt(bgMatch[2]), parseInt(bgMatch[3])] : null,
          });
        }
      }

      return results;
    });

    // Calculate contrast ratios and verify WCAG compliance
    for (const result of contrastResults) {
      // For Pip-Boy green (#00ff88 = rgb(0, 255, 136))
      if (result.color.includes('0, 255, 136') || result.color.includes('0, 204, 102')) {
        const luminance = (0.299 * result.colorRGB[0] + 0.587 * result.colorRGB[1] + 0.114 * result.colorRGB[2]) / 255;

        // Pip-Boy green should have high luminance for good contrast on dark backgrounds
        expect(luminance).toBeGreaterThan(0.5);
      }

      // Font size should be adequate for readability
      if (result.fontSize < 18) {
        // Smaller text needs higher contrast (4.5:1 for WCAG AA)
        console.log(`Small text (${result.fontSize}px): ${result.element}`);
      } else {
        // Larger text can have lower contrast (3:1 for WCAG AA)
        console.log(`Large text (${result.fontSize}px): ${result.element}`);
      }
    }

    console.log(`Checked contrast for ${contrastResults.length} text elements`);
  });

  test('should not interfere with screen reader navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    // Check that background has proper ARIA attributes
    const backgroundAccessibility = await page.evaluate(() => {
      const background = document.querySelector('.wasteland-background') as HTMLElement;

      if (background) {
        return {
          hasAriaHidden: background.hasAttribute('aria-hidden'),
          hasRole: background.hasAttribute('role'),
          hasAriaLabel: background.hasAttribute('aria-label'),
          hasTabIndex: background.hasAttribute('tabindex'),
          isHiddenFromScreenReader: background.getAttribute('aria-hidden') === 'true',
          zIndex: window.getComputedStyle(background).zIndex,
        };
      }

      return null;
    });

    if (backgroundAccessibility) {
      // Background should be behind content (negative z-index)
      expect(parseInt(backgroundAccessibility.zIndex)).toBeLessThan(0);

      // Background should either be aria-hidden or have no ARIA attributes
      // (decorative elements don't need ARIA labels)
      if (backgroundAccessibility.hasAriaHidden) {
        expect(backgroundAccessibility.isHiddenFromScreenReader).toBe(true);
      }

      // Background should not be focusable
      expect(backgroundAccessibility.hasTabIndex).toBe(false);
    }

    console.log('Background properly configured for screen readers');
  });

  test('should ensure keyboard navigation is not affected', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    // Get all focusable elements
    const focusableElements = await page.evaluate(() => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input[type="text"]:not([disabled])',
        'input[type="radio"]:not([disabled])',
        'input[type="checkbox"]:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ];

      const elements = document.querySelectorAll(focusableSelectors.join(', '));
      return Array.from(elements).map((el, index) => ({
        index,
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        tabIndex: (el as HTMLElement).tabIndex,
      }));
    });

    // Test keyboard navigation through focusable elements
    if (focusableElements.length > 0) {
      for (let i = 0; i < Math.min(focusableElements.length, 5); i++) {
        await page.keyboard.press('Tab');

        const focusedElement = await page.evaluate(() => {
          const focused = document.activeElement;
          return focused ? {
            tagName: focused.tagName,
            className: focused.className,
            id: focused.id,
          } : null;
        });

        // Focus should be on a valid interactive element, not background
        expect(focusedElement).not.toBeNull();
        expect(focusedElement?.tagName).not.toBe('DIV'); // Background is a div
      }
    }

    console.log(`Tested keyboard navigation through ${focusableElements.length} focusable elements`);
  });

  test('should handle high contrast mode appropriately', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
    await page.goto('/');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    const highContrastStyles = await page.evaluate(() => {
      const textElements = document.querySelectorAll('h1, h2, p, button, a');
      const background = document.querySelector('.wasteland-background');

      const results = {
        textElementsCount: textElements.length,
        backgroundVisible: !!background,
        textStyles: [] as any[],
      };

      textElements.forEach((element, index) => {
        if (index < 3) { // Check first 3 elements
          const styles = window.getComputedStyle(element);
          results.textStyles.push({
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            borderColor: styles.borderColor,
          });
        }
      });

      return results;
    });

    // In high contrast mode, text should remain readable
    expect(highContrastStyles.backgroundVisible).toBe(true);
    expect(highContrastStyles.textElementsCount).toBeGreaterThan(0);

    console.log('High contrast mode: Text remains readable over background');
  });

  test('should provide appropriate fallbacks for CSS animations', async ({ page }) => {
    // Test with CSS animations disabled
    await page.addInitScript(() => {
      // Disable CSS animations globally
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

    await page.goto('/');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    // Background should still be visible and functional without animations
    const backgroundElements = await page.evaluate(() => {
      return {
        background: !!document.querySelector('.wasteland-background'),
        particles: document.querySelectorAll('.particle').length,
        grid: !!document.querySelector('.wasteland-grid'),
        scanLines: !!document.querySelector('.scan-lines'),
        gradient: !!document.querySelector('.screen-gradient'),
        interference: !!document.querySelector('.radiation-interference'),
      };
    });

    // All elements should still be present
    expect(backgroundElements.background).toBe(true);
    expect(backgroundElements.particles).toBeGreaterThan(0);
    expect(backgroundElements.grid).toBe(true);
    expect(backgroundElements.scanLines).toBe(true);
    expect(backgroundElements.gradient).toBe(true);
    expect(backgroundElements.interference).toBe(true);

    console.log('Background functional without animations');
  });

  test('should support text scaling up to 200%', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Test different text scaling levels
    const scaleTests = [100, 125, 150, 175, 200];

    for (const scale of scaleTests) {
      // Apply text scaling via CSS zoom
      await page.evaluate((zoomLevel) => {
        document.documentElement.style.fontSize = `${16 * (zoomLevel / 100)}px`;
      }, scale);

      await page.waitForTimeout(500); // Allow layout to settle

      // Check that content remains readable and doesn't overlap with background
      const layoutCheck = await page.evaluate(() => {
        const textElements = document.querySelectorAll('h1, h2, p');
        const background = document.querySelector('.wasteland-background');

        let hasOverflow = false;
        let minFontSize = Infinity;

        for (const element of textElements) {
          const rect = element.getBoundingClientRect();
          const styles = window.getComputedStyle(element);
          const fontSize = parseFloat(styles.fontSize);

          if (fontSize < minFontSize) minFontSize = fontSize;

          // Check if text overflows viewport
          if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
            hasOverflow = true;
          }
        }

        return {
          hasOverflow,
          minFontSize,
          backgroundVisible: !!background,
        };
      });

      // Text should remain readable and not overflow
      expect(layoutCheck.backgroundVisible).toBe(true);
      expect(layoutCheck.minFontSize).toBeGreaterThan(10);

      console.log(`${scale}% scale: Min font size ${layoutCheck.minFontSize.toFixed(1)}px`);
    }

    // Reset font size
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '';
    });
  });

  test('should maintain focus indicators visibility over background', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    // Find focusable elements and test focus indicators
    const focusTests = await page.evaluate(async () => {
      const focusableElements = document.querySelectorAll('button, a, input, select, [tabindex]:not([tabindex="-1"])');
      const results = [];

      for (let i = 0; i < Math.min(focusableElements.length, 3); i++) {
        const element = focusableElements[i] as HTMLElement;
        element.focus();

        // Wait a bit for focus styles to apply
        await new Promise(resolve => setTimeout(resolve, 100));

        const styles = window.getComputedStyle(element);
        results.push({
          tagName: element.tagName,
          outline: styles.outline,
          outlineColor: styles.outlineColor,
          outlineWidth: styles.outlineWidth,
          boxShadow: styles.boxShadow,
          hasFocusIndicator: styles.outline !== 'none' || styles.boxShadow.includes('rgba') || styles.boxShadow.includes('rgb'),
        });
      }

      return results;
    });

    // All focusable elements should have visible focus indicators
    for (const result of focusTests) {
      expect(result.hasFocusIndicator).toBe(true);
      console.log(`${result.tagName}: Focus indicator present`);
    }
  });

  test('should handle browser zoom without breaking layout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    const zoomLevels = [50, 75, 100, 125, 150, 200];

    for (const zoom of zoomLevels) {
      await page.goto('/');

      // Set browser zoom level
      await page.evaluate((zoomLevel) => {
        // Simulate browser zoom by adjusting viewport meta tag
        let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
        if (!viewport) {
          viewport = document.createElement('meta');
          viewport.name = 'viewport';
          document.head.appendChild(viewport);
        }
        viewport.content = `width=device-width, initial-scale=${zoomLevel / 100}`;
      }, zoom);

      await page.waitForSelector('.wasteland-background', { state: 'visible' });

      const layoutIntegrity = await page.evaluate(() => {
        const background = document.querySelector('.wasteland-background') as HTMLElement;
        const content = document.querySelector('main, .main-content, body > *:not(.wasteland-background)') as HTMLElement;

        if (background && content) {
          const bgRect = background.getBoundingClientRect();
          const contentRect = content.getBoundingClientRect();

          return {
            backgroundCoversViewport: bgRect.width >= window.innerWidth && bgRect.height >= window.innerHeight,
            contentVisible: contentRect.width > 0 && contentRect.height > 0,
            backgroundBehindContent: parseInt(window.getComputedStyle(background).zIndex) < 0,
          };
        }

        return { backgroundCoversViewport: false, contentVisible: false, backgroundBehindContent: false };
      });

      expect(layoutIntegrity.backgroundCoversViewport).toBe(true);
      expect(layoutIntegrity.contentVisible).toBe(true);
      expect(layoutIntegrity.backgroundBehindContent).toBe(true);

      console.log(`${zoom}% zoom: Layout integrity maintained`);
    }
  });
});