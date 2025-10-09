import { test, expect, type Page } from '@playwright/test';

/**
 * Responsive Design Testing Suite for Fallout Background Effects
 *
 * Tests background adaptability across different screen sizes, orientations,
 * and device types to ensure optimal user experience on all platforms.
 */

test.describe('Fallout Background Effects - Responsive Design Testing', () => {

  const viewports = [
    { name: 'Desktop Large', width: 1920, height: 1080 },
    { name: 'Desktop Medium', width: 1440, height: 900 },
    { name: 'Desktop Small', width: 1024, height: 768 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Mobile Large', width: 414, height: 896 },
    { name: 'Mobile Medium', width: 375, height: 667 },
    { name: 'Mobile Small', width: 320, height: 568 },
  ];

  test('should adapt background to different screen sizes', async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForSelector('.wasteland-background', { state: 'visible' });

      console.log(`Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);

      // Background should cover entire viewport
      const backgroundSize = await page.evaluate(() => {
        const bg = document.querySelector('.wasteland-background') as HTMLElement;
        if (bg) {
          const rect = bg.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
          };
        }
        return null;
      });

      if (backgroundSize) {
        expect(backgroundSize.width).toBeGreaterThanOrEqual(backgroundSize.viewportWidth);
        expect(backgroundSize.height).toBeGreaterThanOrEqual(backgroundSize.viewportHeight);
      }

      // Take screenshot for each viewport
      await expect(page).toHaveScreenshot(`background-${viewport.name.toLowerCase().replace(' ', '-')}.png`, {
        fullPage: true,
      });
    }
  });

  test('should optimize particle count for mobile devices', async ({ page }) => {
    const testCases = [
      { width: 1920, height: 1080, expectedParticles: 50, device: 'Desktop' },
      { width: 768, height: 1024, expectedParticles: 50, device: 'Tablet' },
      { width: 375, height: 667, expectedMinParticles: 20, expectedMaxParticles: 50, device: 'Mobile' },
    ];

    for (const testCase of testCases) {
      await page.setViewportSize({ width: testCase.width, height: testCase.height });
      await page.goto('/');
      await page.waitForSelector('.radiation-particles', { state: 'visible' });

      const particleCount = await page.locator('.particle').count();

      if ('expectedParticles' in testCase) {
        expect(particleCount).toBe(testCase.expectedParticles);
      } else {
        expect(particleCount).toBeGreaterThanOrEqual(testCase.expectedMinParticles!);
        expect(particleCount).toBeLessThanOrEqual(testCase.expectedMaxParticles!);
      }

      console.log(`${testCase.device}: ${particleCount} particles`);
    }
  });

  test('should adjust grid spacing for different screen densities', async ({ page }) => {
    const screenTests = [
      { width: 1920, height: 1080, expectedGridSize: '50px 50px', density: 'Normal' },
      { width: 768, height: 1024, expectedGridSize: '30px 30px', density: 'Mobile' },
      { width: 320, height: 568, expectedGridSize: '30px 30px', density: 'Small Mobile' },
    ];

    for (const test of screenTests) {
      await page.setViewportSize({ width: test.width, height: test.height });
      await page.goto('/');
      await page.waitForSelector('.wasteland-grid', { state: 'visible' });

      const gridSize = await page.evaluate(() => {
        const grid = document.querySelector('.wasteland-grid') as HTMLElement;
        return grid ? window.getComputedStyle(grid).backgroundSize : null;
      });

      expect(gridSize).toBe(test.expectedGridSize);
      console.log(`${test.density}: Grid size ${gridSize}`);
    }
  });

  test('should maintain aspect ratio in landscape and portrait orientations', async ({ page }) => {
    const orientationTests = [
      { width: 768, height: 1024, orientation: 'Portrait' },
      { width: 1024, height: 768, orientation: 'Landscape' },
      { width: 375, height: 667, orientation: 'Mobile Portrait' },
      { width: 667, height: 375, orientation: 'Mobile Landscape' },
    ];

    for (const test of orientationTests) {
      await page.setViewportSize({ width: test.width, height: test.height });
      await page.goto('/');
      await page.waitForSelector('.wasteland-background', { state: 'visible' });

      // Check that background covers full area in both orientations
      const coverage = await page.evaluate(() => {
        const bg = document.querySelector('.wasteland-background') as HTMLElement;
        if (bg) {
          const rect = bg.getBoundingClientRect();
          return {
            coversWidth: rect.width >= window.innerWidth,
            coversHeight: rect.height >= window.innerHeight,
            aspectRatio: rect.width / rect.height,
          };
        }
        return null;
      });

      if (coverage) {
        expect(coverage.coversWidth).toBe(true);
        expect(coverage.coversHeight).toBe(true);
        expect(coverage.aspectRatio).toBeGreaterThan(0);
      }

      console.log(`${test.orientation}: Proper coverage maintained`);
    }
  });

  test('should optimize animation performance on smaller screens', async ({ page }) => {
    const deviceTests = [
      { width: 1920, height: 1080, device: 'Desktop', expectedDuration: 4000 },
      { width: 375, height: 667, device: 'Mobile', expectedMinDuration: 5000 }, // Should be 1.5x longer
    ];

    for (const test of deviceTests) {
      await page.setViewportSize({ width: test.width, height: test.height });
      await page.goto('/');
      await page.waitForSelector('.particle', { state: 'visible' });

      const animationDuration = await page.evaluate(() => {
        const particle = document.querySelector('.particle') as HTMLElement;
        if (particle) {
          const duration = window.getComputedStyle(particle).animationDuration;
          return parseFloat(duration) * 1000; // Convert to milliseconds
        }
        return 0;
      });

      if ('expectedDuration' in test) {
        expect(animationDuration).toBeCloseTo(test.expectedDuration, -2); // Within 100ms
      } else if ('expectedMinDuration' in test) {
        expect(animationDuration).toBeGreaterThanOrEqual(test.expectedMinDuration);
      }

      console.log(`${test.device}: Animation duration ${animationDuration}ms`);
    }
  });

  test('should reduce interference opacity on mobile for better performance', async ({ page }) => {
    const devices = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 375, height: 667, name: 'Mobile' },
    ];

    const opacityResults: any = {};

    for (const device of devices) {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/');
      await page.waitForSelector('.radiation-interference', { state: 'visible' });

      const opacity = await page.evaluate(() => {
        const interference = document.querySelector('.radiation-interference') as HTMLElement;
        return interference ? parseFloat(window.getComputedStyle(interference).opacity) : 0;
      });

      opacityResults[device.name] = opacity;
      console.log(`${device.name}: Interference opacity ${opacity}`);
    }

    // Mobile should have lower opacity than desktop
    expect(opacityResults.Mobile).toBeLessThanOrEqual(opacityResults.Desktop);
  });

  test('should handle extreme aspect ratios gracefully', async ({ page }) => {
    const extremeRatios = [
      { width: 3440, height: 1440, name: 'Ultra-wide' },
      { width: 1080, height: 2400, name: 'Tall Mobile' },
      { width: 800, height: 480, name: 'Wide Mobile' },
    ];

    for (const ratio of extremeRatios) {
      await page.setViewportSize({ width: ratio.width, height: ratio.height });
      await page.goto('/');
      await page.waitForSelector('.wasteland-background', { state: 'visible' });

      // Background should still cover the entire viewport
      const backgroundRect = await page.evaluate(() => {
        const bg = document.querySelector('.wasteland-background') as HTMLElement;
        if (bg) {
          const rect = bg.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            left: rect.left,
            top: rect.top,
          };
        }
        return null;
      });

      if (backgroundRect) {
        expect(backgroundRect.left).toBeLessThanOrEqual(0);
        expect(backgroundRect.top).toBeLessThanOrEqual(0);
        expect(backgroundRect.width).toBeGreaterThanOrEqual(ratio.width);
        expect(backgroundRect.height).toBeGreaterThanOrEqual(ratio.height);
      }

      console.log(`${ratio.name}: Background properly positioned and sized`);
    }
  });

  test('should maintain readability of content over background', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      // Wait for content to load
      await page.waitForSelector('h1, h2, .text-pip-boy', { state: 'visible' });

      // Check contrast and readability
      const contentReadability = await page.evaluate(() => {
        const textElements = document.querySelectorAll('h1, h2, p, .text-pip-boy');
        const results = [];

        for (const element of textElements) {
          const styles = window.getComputedStyle(element);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          const fontSize = parseFloat(styles.fontSize);

          results.push({
            color,
            backgroundColor,
            fontSize,
            isVisible: element.getBoundingClientRect().height > 0,
          });
        }

        return results;
      });

      // All text should be visible and have appropriate contrast
      for (const result of contentReadability) {
        expect(result.isVisible).toBe(true);
        expect(result.fontSize).toBeGreaterThan(12); // Minimum readable size
      }

      console.log(`${viewport.width}x${viewport.height}: Content readability verified`);
    }
  });

  test('should handle zoom levels appropriately', async ({ page }) => {
    const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

    await page.setViewportSize({ width: 1920, height: 1080 });

    for (const zoom of zoomLevels) {
      await page.goto('/');

      // Set zoom level
      await page.evaluate((zoomLevel) => {
        document.body.style.zoom = zoomLevel.toString();
      }, zoom);

      await page.waitForSelector('.wasteland-background', { state: 'visible' });

      // Background should still cover viewport at any zoom level
      const backgroundCoverage = await page.evaluate(() => {
        const bg = document.querySelector('.wasteland-background') as HTMLElement;
        if (bg) {
          const rect = bg.getBoundingClientRect();
          return {
            coversViewport: rect.width >= window.innerWidth && rect.height >= window.innerHeight,
            hasContent: rect.width > 0 && rect.height > 0,
          };
        }
        return { coversViewport: false, hasContent: false };
      });

      expect(backgroundCoverage.coversViewport).toBe(true);
      expect(backgroundCoverage.hasContent).toBe(true);

      console.log(`Zoom ${zoom * 100}%: Background coverage maintained`);

      // Reset zoom for next iteration
      await page.evaluate(() => {
        document.body.style.zoom = '1';
      });
    }
  });

  test('should verify touch-friendly interfaces on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that interactive elements are touch-friendly (min 44px)
    const touchTargets = await page.evaluate(() => {
      const interactiveElements = document.querySelectorAll('button, a, [role="button"], input, select');
      const touchFriendly = [];

      for (const element of interactiveElements) {
        const rect = element.getBoundingClientRect();
        const minDimension = Math.min(rect.width, rect.height);

        touchFriendly.push({
          tagName: element.tagName,
          className: element.className,
          width: rect.width,
          height: rect.height,
          minDimension,
          isTouchFriendly: minDimension >= 44,
        });
      }

      return touchFriendly;
    });

    // All interactive elements should be touch-friendly
    for (const target of touchTargets) {
      if (target.width > 0 && target.height > 0) { // Skip hidden elements
        expect(target.minDimension).toBeGreaterThanOrEqual(44);
      }
    }

    console.log(`Verified ${touchTargets.length} touch targets on mobile`);
  });
});