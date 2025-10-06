import { test, expect, type Page } from '@playwright/test';

/**
 * Multi-Environment Accessibility Testing Suite
 *
 * Tests accessibility across different environmental conditions:
 * - Various screen brightness levels
 * - Different device types and viewport sizes
 * - Various color schemes and themes
 * - Different display densities (DPI)
 * - Environmental lighting conditions simulation
 * - Outdoor/indoor visibility testing
 * - Battery saver mode simulation
 */

interface EnvironmentTestConfig {
  name: string;
  viewport: { width: number; height: number };
  deviceScaleFactor?: number;
  colorScheme?: 'light' | 'dark' | 'no-preference';
  reducedMotion?: 'reduce' | 'no-preference';
  contrast?: 'high' | 'low' | 'no-preference';
  brightness?: number; // 0-1 scale
  description: string;
}

interface ContrastTestResult {
  environment: string;
  elementType: string;
  foregroundColor: string;
  backgroundColor: string;
  contrastRatio: number;
  readable: boolean;
  visible: boolean;
}

const environmentConfigs: EnvironmentTestConfig[] = [
  // Mobile devices
  {
    name: 'Mobile Portrait',
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    description: 'iPhone SE portrait mode'
  },
  {
    name: 'Mobile Landscape',
    viewport: { width: 667, height: 375 },
    deviceScaleFactor: 2,
    description: 'iPhone SE landscape mode'
  },
  {
    name: 'Large Mobile',
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 3,
    description: 'iPhone 11 Pro Max'
  },
  // Tablets
  {
    name: 'Tablet Portrait',
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2,
    description: 'iPad portrait mode'
  },
  {
    name: 'Tablet Landscape',
    viewport: { width: 1024, height: 768 },
    deviceScaleFactor: 2,
    description: 'iPad landscape mode'
  },
  // Desktop variations
  {
    name: 'Small Desktop',
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    description: 'Small desktop/laptop'
  },
  {
    name: 'Standard Desktop',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    description: 'Standard desktop monitor'
  },
  {
    name: 'High DPI Desktop',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    description: 'Retina/4K desktop'
  },
  // Special conditions
  {
    name: 'High Contrast Mode',
    viewport: { width: 1920, height: 1080 },
    contrast: 'high',
    colorScheme: 'dark',
    description: 'High contrast accessibility mode'
  },
  {
    name: 'Reduced Motion',
    viewport: { width: 1920, height: 1080 },
    reducedMotion: 'reduce',
    description: 'Reduced motion preference'
  }
];

const brightnessLevels = [
  { level: 0.3, name: 'Very Dim', description: 'Dark room/night mode' },
  { level: 0.5, name: 'Dim', description: 'Indoor lighting' },
  { level: 0.7, name: 'Normal', description: 'Standard indoor lighting' },
  { level: 0.9, name: 'Bright', description: 'Well-lit room' },
  { level: 1.0, name: 'Very Bright', description: 'Outdoor/direct sunlight' }
];

test.describe('Multi-Environment Accessibility Testing', () => {
  const testPages = [
    { path: '/', name: 'Home Page' },
    { path: '/cards', name: 'Cards Page' },
    { path: '/auth/login', name: 'Login Page' }
  ];

  test('should maintain readability across different device types', async ({ page, browser }) => {
    console.log('\n=== DEVICE TYPE READABILITY TESTING ===');

    for (const config of environmentConfigs) {
      console.log(`\nTesting: ${config.name} (${config.description})`);

      // Apply environment configuration
      await page.setViewportSize(config.viewport);

      if (config.deviceScaleFactor) {
        await page.emulateMedia({
          colorScheme: config.colorScheme,
          reducedMotion: config.reducedMotion,
          forcedColors: config.contrast === 'high' ? 'active' : 'none'
        });
      }

      for (const pageTest of testPages) {
        await page.goto(pageTest.path);
        await page.waitForLoadState('networkidle');

        const readabilityAnalysis = await page.evaluate(({ configName, viewport }) => {
          const textElements = document.querySelectorAll('h1, h2, h3, p, button, a, label, input');
          const results = {
            totalElements: textElements.length,
            readableElements: 0,
            tooSmallText: 0,
            overlappingElements: 0,
            offScreenElements: 0,
            minimumFontSize: Infinity,
            averageFontSize: 0,
            viewport: viewport
          };

          let totalFontSize = 0;

          textElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const styles = window.getComputedStyle(element);
            const fontSize = parseFloat(styles.fontSize);
            const lineHeight = parseFloat(styles.lineHeight) || fontSize * 1.2;

            totalFontSize += fontSize;

            if (fontSize < results.minimumFontSize) {
              results.minimumFontSize = fontSize;
            }

            // Check if text is too small
            const isTooSmall = fontSize < 16 && viewport.width <= 768; // Mobile should have larger text
            if (isTooSmall) results.tooSmallText++;

            // Check if element is off-screen
            const isOffScreen = rect.right < 0 || rect.left > window.innerWidth ||
                              rect.bottom < 0 || rect.top > window.innerHeight;
            if (isOffScreen) results.offScreenElements++;

            // Check for overlapping (simplified check)
            const elementCenter = {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2
            };

            const elementAtCenter = document.elementFromPoint(elementCenter.x, elementCenter.y);
            const isOverlapped = elementAtCenter !== element &&
                               !element.contains(elementAtCenter) &&
                               elementAtCenter?.tagName !== 'HTML' &&
                               elementAtCenter?.tagName !== 'BODY';

            if (isOverlapped && rect.width > 0 && rect.height > 0) {
              results.overlappingElements++;
            }

            // Consider element readable if it meets basic criteria
            const isReadable = fontSize >= 12 &&
                             !isOffScreen &&
                             rect.width > 0 &&
                             rect.height > 0 &&
                             !isOverlapped;

            if (isReadable) results.readableElements++;
          });

          results.averageFontSize = totalFontSize / textElements.length || 0;

          return results;
        }, { configName: config.name, viewport: config.viewport });

        console.log(`  ${pageTest.name}:`);
        console.log(`    Readable elements: ${readabilityAnalysis.readableElements}/${readabilityAnalysis.totalElements}`);
        console.log(`    Too small text: ${readabilityAnalysis.tooSmallText}`);
        console.log(`    Off-screen elements: ${readabilityAnalysis.offScreenElements}`);
        console.log(`    Overlapping elements: ${readabilityAnalysis.overlappingElements}`);
        console.log(`    Min font size: ${readabilityAnalysis.minimumFontSize.toFixed(1)}px`);
        console.log(`    Avg font size: ${readabilityAnalysis.averageFontSize.toFixed(1)}px`);

        // Readability requirements
        const readabilityRatio = readabilityAnalysis.readableElements / readabilityAnalysis.totalElements;
        expect(readabilityRatio).toBeGreaterThanOrEqual(0.9);

        // Mobile devices should have larger minimum font size
        if (config.viewport.width <= 768) {
          expect(readabilityAnalysis.minimumFontSize).toBeGreaterThanOrEqual(14);
          expect(readabilityAnalysis.tooSmallText).toBeLessThanOrEqual(2);
        }

        // Should not have many off-screen or overlapping elements
        expect(readabilityAnalysis.offScreenElements).toBeLessThanOrEqual(1);
        expect(readabilityAnalysis.overlappingElements).toBeLessThanOrEqual(2);
      }
    }
  });

  test('should maintain visibility across different brightness levels', async ({ page }) => {
    console.log('\n=== BRIGHTNESS LEVEL VISIBILITY TESTING ===');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    for (const brightness of brightnessLevels) {
      console.log(`\nTesting: ${brightness.name} (${brightness.description})`);

      // Simulate brightness by adjusting page contrast and brightness
      await page.addStyleTag({
        content: `
          body {
            filter: brightness(${brightness.level}) contrast(${1 + (1 - brightness.level) * 0.5}) !important;
          }
        `
      });

      await page.waitForTimeout(300); // Allow filter to apply

      const visibilityAnalysis = await page.evaluate(({ brightnessLevel, brightnessName }) => {
        const textElements = document.querySelectorAll('h1, h2, h3, p, button, a, label');
        const interactiveElements = document.querySelectorAll('button, a, input, select');

        const results = {
          brightnessLevel,
          brightnessName,
          totalTextElements: textElements.length,
          visibleTextElements: 0,
          totalInteractive: interactiveElements.length,
          visibleInteractive: 0,
          contrastIssues: [] as any[]
        };

        // Check text visibility
        textElements.forEach(element => {
          const rect = element.getBoundingClientRect();
          const styles = window.getComputedStyle(element);

          if (rect.width > 0 && rect.height > 0) {
            // Simple visibility check based on computed styles
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;
            const opacity = parseFloat(styles.opacity);

            const isVisible = opacity > 0.1 &&
                            color !== 'transparent' &&
                            color !== backgroundColor;

            if (isVisible) {
              results.visibleTextElements++;
            } else {
              results.contrastIssues.push({
                element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
                color: color,
                backgroundColor: backgroundColor,
                opacity: opacity
              });
            }
          }
        });

        // Check interactive element visibility
        interactiveElements.forEach(element => {
          const rect = element.getBoundingClientRect();
          const styles = window.getComputedStyle(element);

          if (rect.width > 0 && rect.height > 0) {
            const isVisible = parseFloat(styles.opacity) > 0.1 &&
                            styles.visibility !== 'hidden' &&
                            styles.display !== 'none';

            if (isVisible) results.visibleInteractive++;
          }
        });

        return results;
      }, { brightnessLevel: brightness.level, brightnessName: brightness.name });

      console.log(`  Text elements visible: ${visibilityAnalysis.visibleTextElements}/${visibilityAnalysis.totalTextElements}`);
      console.log(`  Interactive elements visible: ${visibilityAnalysis.visibleInteractive}/${visibilityAnalysis.totalInteractive}`);

      if (visibilityAnalysis.contrastIssues.length > 0) {
        console.log(`  Contrast issues: ${visibilityAnalysis.contrastIssues.length}`);
        visibilityAnalysis.contrastIssues.slice(0, 3).forEach((issue, index) => {
          console.log(`    ${index + 1}. ${issue.element}: ${issue.color} on ${issue.backgroundColor}`);
        });
      }

      // Visibility requirements vary by brightness level
      const textVisibilityRatio = visibilityAnalysis.visibleTextElements / visibilityAnalysis.totalTextElements;
      const interactiveVisibilityRatio = visibilityAnalysis.visibleInteractive / visibilityAnalysis.totalInteractive;

      if (brightness.level >= 0.7) {
        // Normal to bright conditions - should have excellent visibility
        expect(textVisibilityRatio).toBeGreaterThanOrEqual(0.95);
        expect(interactiveVisibilityRatio).toBeGreaterThanOrEqual(0.95);
      } else if (brightness.level >= 0.5) {
        // Dim conditions - should still be mostly visible
        expect(textVisibilityRatio).toBeGreaterThanOrEqual(0.9);
        expect(interactiveVisibilityRatio).toBeGreaterThanOrEqual(0.9);
      } else {
        // Very dim conditions - lower expectations but still functional
        expect(textVisibilityRatio).toBeGreaterThanOrEqual(0.8);
        expect(interactiveVisibilityRatio).toBeGreaterThanOrEqual(0.85);
      }

      // Should not have too many contrast issues
      expect(visibilityAnalysis.contrastIssues.length).toBeLessThanOrEqual(5);
    }

    // Reset brightness filter
    await page.addStyleTag({
      content: 'body { filter: none !important; }'
    });
  });

  test('should handle high contrast and forced colors modes', async ({ page }) => {
    console.log('\n=== HIGH CONTRAST AND FORCED COLORS TESTING ===');

    const contrastModes = [
      {
        name: 'High Contrast Dark',
        config: { colorScheme: 'dark' as const, forcedColors: 'active' as const },
        description: 'Windows high contrast dark mode'
      },
      {
        name: 'High Contrast Light',
        config: { colorScheme: 'light' as const, forcedColors: 'active' as const },
        description: 'Windows high contrast light mode'
      },
      {
        name: 'Increased Contrast',
        config: { colorScheme: 'dark' as const, contrast: 'more' as const },
        description: 'macOS increased contrast'
      }
    ];

    for (const mode of contrastModes) {
      console.log(`\nTesting: ${mode.name} (${mode.description})`);

      await page.emulateMedia(mode.config as any);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const contrastAnalysis = await page.evaluate(({ modeName }) => {
        const elements = document.querySelectorAll('h1, h2, h3, p, button, a, input, label');
        const results = {
          modeName,
          totalElements: elements.length,
          elementsWithBorders: 0,
          elementsWithBackgrounds: 0,
          elementsWithIcons: 0,
          problematicElements: [] as any[]
        };

        elements.forEach(element => {
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;

          const styles = window.getComputedStyle(element);
          const hasBorder = styles.borderWidth !== '0px' && styles.borderStyle !== 'none';
          const hasBackground = styles.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                              styles.backgroundColor !== 'transparent';
          const hasIcon = element.querySelector('svg, img, [class*="icon"]');

          if (hasBorder) results.elementsWithBorders++;
          if (hasBackground) results.elementsWithBackgrounds++;
          if (hasIcon) results.elementsWithIcons++;

          // Check for potential issues in high contrast mode
          const textContent = element.textContent?.trim();
          const isInteractive = ['BUTTON', 'A', 'INPUT'].includes(element.tagName);

          if (isInteractive && !hasBorder && !hasBackground && !hasIcon && !textContent) {
            results.problematicElements.push({
              tagName: element.tagName,
              className: element.className,
              hasVisualIndicator: false,
              issue: 'Interactive element may be invisible in high contrast mode'
            });
          }

          // Check for color-only indicators
          const hasColorOnlyIndicator = element.classList.toString().includes('red-') ||
                                      element.classList.toString().includes('green-') ||
                                      element.classList.toString().includes('yellow-') ||
                                      styles.color.includes('rgb');

          if (hasColorOnlyIndicator && !hasBorder && !hasIcon) {
            results.problematicElements.push({
              tagName: element.tagName,
              className: element.className,
              hasAlternativeIndicator: false,
              issue: 'Element relies on color alone for meaning'
            });
          }
        });

        return results;
      }, { modeName: mode.name });

      console.log(`  Total elements: ${contrastAnalysis.totalElements}`);
      console.log(`  Elements with borders: ${contrastAnalysis.elementsWithBorders}`);
      console.log(`  Elements with backgrounds: ${contrastAnalysis.elementsWithBackgrounds}`);
      console.log(`  Elements with icons: ${contrastAnalysis.elementsWithIcons}`);

      if (contrastAnalysis.problematicElements.length > 0) {
        console.log(`  ⚠️  Potential issues: ${contrastAnalysis.problematicElements.length}`);
        contrastAnalysis.problematicElements.slice(0, 3).forEach((issue, index) => {
          console.log(`    ${index + 1}. ${issue.tagName}.${issue.className}: ${issue.issue}`);
        });
      }

      // High contrast mode requirements
      expect(contrastAnalysis.problematicElements.length).toBeLessThanOrEqual(3);

      // Should have reasonable number of elements with visual indicators
      const visualIndicatorRatio = (contrastAnalysis.elementsWithBorders +
                                   contrastAnalysis.elementsWithBackgrounds +
                                   contrastAnalysis.elementsWithIcons) / contrastAnalysis.totalElements;
      expect(visualIndicatorRatio).toBeGreaterThanOrEqual(0.6);
    }

    // Reset emulation
    await page.emulateMedia({});
  });

  test('should maintain usability across different viewport orientations', async ({ page }) => {
    console.log('\n=== VIEWPORT ORIENTATION TESTING ===');

    const orientationTests = [
      {
        name: 'Mobile Portrait',
        viewport: { width: 375, height: 667 },
        orientation: 'portrait',
        description: 'Standard mobile portrait'
      },
      {
        name: 'Mobile Landscape',
        viewport: { width: 667, height: 375 },
        orientation: 'landscape',
        description: 'Mobile rotated to landscape'
      },
      {
        name: 'Tablet Portrait',
        viewport: { width: 768, height: 1024 },
        orientation: 'portrait',
        description: 'Tablet portrait mode'
      },
      {
        name: 'Tablet Landscape',
        viewport: { width: 1024, height: 768 },
        orientation: 'landscape',
        description: 'Tablet landscape mode'
      }
    ];

    for (const orientationTest of orientationTests) {
      console.log(`\nTesting: ${orientationTest.name} (${orientationTest.description})`);

      await page.setViewportSize(orientationTest.viewport);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const orientationAnalysis = await page.evaluate(({ testName, viewport }) => {
        const results = {
          testName,
          viewport,
          contentFitsScreen: true,
          horizontalScroll: false,
          verticalScroll: false,
          hiddenContent: 0,
          accessibleElements: 0,
          totalElements: 0,
          tapTargetIssues: [] as any[]
        };

        // Check for content overflow
        results.horizontalScroll = document.body.scrollWidth > window.innerWidth;
        results.verticalScroll = document.body.scrollHeight > window.innerHeight;

        // Check interactive elements (tap targets)
        const interactiveElements = document.querySelectorAll('button, a, input, select, [role="button"]');
        results.totalElements = interactiveElements.length;

        interactiveElements.forEach(element => {
          const rect = element.getBoundingClientRect();

          // Check if element is accessible (visible and reasonably sized)
          const isAccessible = rect.width >= 44 && rect.height >= 44 && // WCAG minimum tap target size
                              rect.left >= 0 && rect.top >= 0 &&
                              rect.right <= window.innerWidth &&
                              rect.bottom <= window.innerHeight;

          if (isAccessible) {
            results.accessibleElements++;
          } else {
            // Check specific issues
            let issues = [];

            if (rect.width < 44 || rect.height < 44) {
              issues.push('Too small for touch interaction');
            }

            if (rect.left < 0 || rect.right > window.innerWidth) {
              issues.push('Horizontally off-screen');
            }

            if (rect.top < 0 || rect.bottom > window.innerHeight) {
              issues.push('Vertically off-screen');
            }

            if (rect.width === 0 || rect.height === 0) {
              issues.push('Hidden or collapsed');
              results.hiddenContent++;
            }

            results.tapTargetIssues.push({
              element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
              size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
              position: `${Math.round(rect.left)},${Math.round(rect.top)}`,
              issues: issues
            });
          }
        });

        return results;
      }, { testName: orientationTest.name, viewport: orientationTest.viewport });

      console.log(`  Content fits screen: ${!orientationAnalysis.horizontalScroll}`);
      console.log(`  Horizontal scroll needed: ${orientationAnalysis.horizontalScroll}`);
      console.log(`  Accessible tap targets: ${orientationAnalysis.accessibleElements}/${orientationAnalysis.totalElements}`);
      console.log(`  Hidden content elements: ${orientationAnalysis.hiddenContent}`);

      if (orientationAnalysis.tapTargetIssues.length > 0) {
        console.log(`  Tap target issues: ${orientationAnalysis.tapTargetIssues.length}`);
        orientationAnalysis.tapTargetIssues.slice(0, 3).forEach((issue, index) => {
          console.log(`    ${index + 1}. ${issue.element} (${issue.size}): ${issue.issues.join(', ')}`);
        });
      }

      // Orientation-specific requirements
      const accessibilityRatio = orientationAnalysis.accessibleElements / orientationAnalysis.totalElements;

      // Should not have horizontal scroll on mobile
      if (orientationTest.viewport.width <= 768) {
        expect(orientationAnalysis.horizontalScroll).toBe(false);
      }

      // Most interactive elements should be accessible
      expect(accessibilityRatio).toBeGreaterThanOrEqual(0.85);

      // Should not have too many hidden elements
      expect(orientationAnalysis.hiddenContent).toBeLessThanOrEqual(2);

      // Tap target issues should be minimal
      expect(orientationAnalysis.tapTargetIssues.length).toBeLessThanOrEqual(5);
    }
  });

  test('should handle battery saver and performance modes', async ({ page }) => {
    console.log('\n=== BATTERY SAVER AND PERFORMANCE MODE TESTING ===');

    const performanceModes = [
      {
        name: 'Battery Saver Mode',
        settings: {
          reducedMotion: 'reduce' as const,
          brightness: 0.6,
          animationsDisabled: true
        },
        description: 'Low power mode with reduced animations'
      },
      {
        name: 'Performance Mode',
        settings: {
          reducedMotion: 'no-preference' as const,
          brightness: 1.0,
          animationsDisabled: false
        },
        description: 'Full performance with all features'
      },
      {
        name: 'Data Saver Mode',
        settings: {
          reducedMotion: 'reduce' as const,
          brightness: 0.8,
          imagesDisabled: true
        },
        description: 'Reduced data usage mode'
      }
    ];

    for (const mode of performanceModes) {
      console.log(`\nTesting: ${mode.name} (${mode.description})`);

      // Apply performance settings
      await page.emulateMedia({
        reducedMotion: mode.settings.reducedMotion
      });

      if (mode.settings.animationsDisabled) {
        await page.addStyleTag({
          content: `
            *, *::before, *::after {
              animation-duration: 0s !important;
              animation-delay: 0s !important;
              transition-duration: 0s !important;
              transition-delay: 0s !important;
            }
          `
        });
      }

      if (mode.settings.brightness) {
        await page.addStyleTag({
          content: `
            body {
              filter: brightness(${mode.settings.brightness}) !important;
            }
          `
        });
      }

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const performanceAnalysis = await page.evaluate(({ modeName, settings }) => {
        const results = {
          modeName,
          functionalElements: 0,
          totalElements: 0,
          animatedElements: 0,
          imagesLoaded: 0,
          totalImages: 0,
          essentialContentVisible: true,
          userCanComplete: true
        };

        // Check essential interactive elements
        const essentialElements = document.querySelectorAll('button, a[href], input, select');
        results.totalElements = essentialElements.length;

        essentialElements.forEach(element => {
          const rect = element.getBoundingClientRect();
          const styles = window.getComputedStyle(element);

          const isFunctional = rect.width > 0 && rect.height > 0 &&
                             styles.display !== 'none' &&
                             styles.visibility !== 'hidden' &&
                             parseFloat(styles.opacity) > 0.1;

          if (isFunctional) results.functionalElements++;
        });

        // Check animations (should be disabled in battery saver mode)
        const animatableElements = document.querySelectorAll('*');
        animatableElements.forEach(element => {
          const styles = window.getComputedStyle(element);
          const hasAnimation = styles.animationName !== 'none' &&
                             styles.animationDuration !== '0s';
          if (hasAnimation) results.animatedElements++;
        });

        // Check images
        const images = document.querySelectorAll('img');
        results.totalImages = images.length;

        images.forEach(img => {
          if (img.complete && img.naturalHeight !== 0) {
            results.imagesLoaded++;
          }
        });

        // Check if essential content is visible
        const headings = document.querySelectorAll('h1, h2, h3');
        const navigation = document.querySelector('nav');
        const mainContent = document.querySelector('main');

        results.essentialContentVisible = headings.length > 0 && !!navigation && !!mainContent;

        // Check if user can complete essential tasks
        const forms = document.querySelectorAll('form');
        const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');

        results.userCanComplete = forms.length === 0 || submitButtons.length > 0;

        return results;
      }, { modeName: mode.name, settings: mode.settings });

      console.log(`  Functional elements: ${performanceAnalysis.functionalElements}/${performanceAnalysis.totalElements}`);
      console.log(`  Animated elements: ${performanceAnalysis.animatedElements}`);
      console.log(`  Images loaded: ${performanceAnalysis.imagesLoaded}/${performanceAnalysis.totalImages}`);
      console.log(`  Essential content visible: ${performanceAnalysis.essentialContentVisible}`);
      console.log(`  User can complete tasks: ${performanceAnalysis.userCanComplete}`);

      // Performance mode requirements
      const functionalityRatio = performanceAnalysis.functionalElements / performanceAnalysis.totalElements;
      expect(functionalityRatio).toBeGreaterThanOrEqual(0.95);

      // Essential content should always be visible
      expect(performanceAnalysis.essentialContentVisible).toBe(true);

      // Users should be able to complete essential tasks
      expect(performanceAnalysis.userCanComplete).toBe(true);

      // In battery saver mode, animations should be minimal
      if (mode.settings.animationsDisabled) {
        expect(performanceAnalysis.animatedElements).toBeLessThanOrEqual(2);
      }

      // Reset styles for next test
      await page.addStyleTag({
        content: `
          body { filter: none !important; }
          *, *::before, *::after {
            animation-duration: initial !important;
            transition-duration: initial !important;
          }
        `
      });
    }
  });

  test('should generate comprehensive multi-environment report', async ({ page }) => {
    console.log('\n=== MULTI-ENVIRONMENT ACCESSIBILITY REPORT ===');

    const report = {
      timestamp: new Date().toISOString(),
      environmentTests: [] as any[],
      overallScore: 0,
      criticalFindings: [] as string[],
      recommendations: [] as string[]
    };

    // Test subset of environments for reporting
    const reportEnvironments = [
      environmentConfigs[0], // Mobile Portrait
      environmentConfigs[4], // Tablet Landscape
      environmentConfigs[6], // Standard Desktop
      environmentConfigs[8]  // High Contrast Mode
    ];

    for (const env of reportEnvironments) {
      console.log(`\nGenerating report for: ${env.name}`);

      await page.setViewportSize(env.viewport);

      if (env.contrast || env.colorScheme) {
        await page.emulateMedia({
          colorScheme: env.colorScheme,
          forcedColors: env.contrast === 'high' ? 'active' : 'none'
        });
      }

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const envAnalysis = await page.evaluate(({ envName, viewport }) => {
        let score = 100;
        const issues: string[] = [];

        // Check basic usability
        const interactiveElements = document.querySelectorAll('button, a, input, select');
        let accessibleElements = 0;
        let tapTargetIssues = 0;

        interactiveElements.forEach(element => {
          const rect = element.getBoundingClientRect();
          const isAccessible = rect.width >= (viewport.width <= 768 ? 44 : 32) &&
                             rect.height >= (viewport.width <= 768 ? 44 : 32) &&
                             rect.left >= 0 && rect.top >= 0;

          if (isAccessible) {
            accessibleElements++;
          } else {
            tapTargetIssues++;
          }
        });

        if (tapTargetIssues > 0) {
          score -= Math.min(20, tapTargetIssues * 4);
          issues.push(`${tapTargetIssues} elements have tap target issues`);
        }

        // Check content overflow
        const hasHorizontalScroll = document.body.scrollWidth > window.innerWidth;
        if (hasHorizontalScroll && viewport.width <= 768) {
          score -= 15;
          issues.push('Horizontal scroll required on mobile');
        }

        // Check text readability
        const textElements = document.querySelectorAll('h1, h2, h3, p');
        let readableText = 0;

        textElements.forEach(element => {
          const styles = window.getComputedStyle(element);
          const fontSize = parseFloat(styles.fontSize);
          const minSize = viewport.width <= 768 ? 16 : 14;

          if (fontSize >= minSize) readableText++;
        });

        if (textElements.length > 0 && readableText / textElements.length < 0.8) {
          score -= 10;
          issues.push('Text may be too small for viewport');
        }

        // Check essential landmarks
        const hasMain = !!document.querySelector('main');
        const hasNav = !!document.querySelector('nav');

        if (!hasMain) {
          score -= 5;
          issues.push('Missing main landmark');
        }

        if (!hasNav) {
          score -= 5;
          issues.push('Missing navigation landmark');
        }

        return {
          score: Math.max(0, score),
          issues,
          metrics: {
            totalInteractive: interactiveElements.length,
            accessibleElements,
            tapTargetIssues,
            hasHorizontalScroll,
            textElements: textElements.length,
            readableText,
            hasMain,
            hasNav
          }
        };
      }, { envName: env.name, viewport: env.viewport });

      report.environmentTests.push({
        environment: env.name,
        description: env.description,
        viewport: env.viewport,
        score: envAnalysis.score,
        issues: envAnalysis.issues,
        metrics: envAnalysis.metrics
      });

      console.log(`  Score: ${envAnalysis.score}/100`);
      if (envAnalysis.issues.length > 0) {
        console.log(`  Issues: ${envAnalysis.issues.join(', ')}`);
      }
    }

    // Calculate overall score
    report.overallScore = Math.round(
      report.environmentTests.reduce((sum, test) => sum + test.score, 0) / report.environmentTests.length
    );

    // Identify critical findings
    const allIssues = report.environmentTests.flatMap(test => test.issues);
    const issueFrequency = allIssues.reduce((acc, issue) => {
      acc[issue] = (acc[issue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    report.criticalFindings = Object.entries(issueFrequency)
      .filter(([, count]) => count >= 2) // Issues in multiple environments
      .map(([issue]) => issue);

    // Generate recommendations
    if (report.criticalFindings.some(f => f.includes('tap target'))) {
      report.recommendations.push('Increase tap target sizes to minimum 44x44px on mobile devices');
    }
    if (report.criticalFindings.some(f => f.includes('scroll'))) {
      report.recommendations.push('Implement responsive design to prevent horizontal scrolling on mobile');
    }
    if (report.criticalFindings.some(f => f.includes('text'))) {
      report.recommendations.push('Use responsive typography with minimum 16px font size on mobile');
    }
    if (report.criticalFindings.some(f => f.includes('landmark'))) {
      report.recommendations.push('Add proper semantic landmarks for consistent navigation across devices');
    }

    console.log('\n=== MULTI-ENVIRONMENT REPORT SUMMARY ===');
    console.log(`Overall Score: ${report.overallScore}/100`);
    console.log(`Environments Tested: ${report.environmentTests.length}`);

    console.log('\nEnvironment Scores:');
    report.environmentTests.forEach(test => {
      console.log(`  ${test.environment}: ${test.score}/100`);
    });

    if (report.criticalFindings.length > 0) {
      console.log('\nCritical Findings (multiple environments):');
      report.criticalFindings.forEach((finding, index) => {
        console.log(`  ${index + 1}. ${finding}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    // Assert minimum standards
    expect(report.overallScore).toBeGreaterThanOrEqual(75);

    // Each environment should meet minimum standards
    report.environmentTests.forEach(test => {
      expect(test.score).toBeGreaterThanOrEqual(70);
    });

    // Should not have more than 3 critical findings
    expect(report.criticalFindings.length).toBeLessThanOrEqual(3);

    // Reset emulation
    await page.emulateMedia({});
  });
});