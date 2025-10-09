import { test, expect, type Page } from '@playwright/test';

/**
 * Color Blindness Simulation Testing Suite
 *
 * Tests the application's usability for users with different types of color vision deficiencies:
 * - Protanopia (red-blind)
 * - Deuteranopia (green-blind)
 * - Tritanopia (blue-blind)
 * - Monochromacy (total color blindness)
 * - Protanomaly, Deuteranomaly, Tritanomaly (reduced color sensitivity)
 */

interface ColorBlindnessFilter {
  name: string;
  type: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'protanomaly' | 'deuteranomaly' | 'tritanomaly' | 'monochromacy';
  filter: string;
  description: string;
  prevalence: string;
}

interface ColorDependentElement {
  selector: string;
  elementType: string;
  colors: string[];
  hasNonColorIdentifiers: boolean;
  alternativeIdentifiers: string[];
}

const colorBlindnessFilters: ColorBlindnessFilter[] = [
  {
    name: 'Protanopia',
    type: 'protanopia',
    filter: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'protanopia\'%3E%3CfeColorMatrix values=\'0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0\'/%3E%3C/filter%3E%3C/svg%3E#protanopia")',
    description: 'Red-blind (L-cone deficiency)',
    prevalence: '1% of males'
  },
  {
    name: 'Deuteranopia',
    type: 'deuteranopia',
    filter: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'deuteranopia\'%3E%3CfeColorMatrix values=\'0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0\'/%3E%3C/filter%3E%3C/svg%3E#deuteranopia")',
    description: 'Green-blind (M-cone deficiency)',
    prevalence: '1% of males'
  },
  {
    name: 'Tritanopia',
    type: 'tritanopia',
    filter: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'tritanopia\'%3E%3CfeColorMatrix values=\'0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0\'/%3E%3C/filter%3E%3C/svg%3E#tritanopia")',
    description: 'Blue-blind (S-cone deficiency)',
    prevalence: '0.003% of population'
  },
  {
    name: 'Protanomaly',
    type: 'protanomaly',
    filter: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'protanomaly\'%3E%3CfeColorMatrix values=\'0.817,0.183,0,0,0 0.333,0.667,0,0,0 0,0.125,0.875,0,0 0,0,0,1,0\'/%3E%3C/filter%3E%3C/svg%3E#protanomaly")',
    description: 'Reduced red sensitivity',
    prevalence: '1% of males'
  },
  {
    name: 'Deuteranomaly',
    type: 'deuteranomaly',
    filter: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'deuteranomaly\'%3E%3CfeColorMatrix values=\'0.8,0.2,0,0,0 0.258,0.742,0,0,0 0,0.142,0.858,0,0 0,0,0,1,0\'/%3E%3C/filter%3E%3C/svg%3E#deuteranomaly")',
    description: 'Reduced green sensitivity',
    prevalence: '5% of males'
  },
  {
    name: 'Tritanomaly',
    type: 'tritanomaly',
    filter: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'tritanomaly\'%3E%3CfeColorMatrix values=\'0.967,0.033,0,0,0 0,0.733,0.267,0,0 0,0.183,0.817,0,0 0,0,0,1,0\'/%3E%3C/filter%3E%3C/svg%3E#tritanomaly")',
    description: 'Reduced blue sensitivity',
    prevalence: '0.01% of population'
  },
  {
    name: 'Monochromacy',
    type: 'monochromacy',
    filter: 'grayscale(100%)',
    description: 'Complete color blindness',
    prevalence: '0.003% of population'
  }
];

test.describe('Color Blindness Simulation Testing', () => {
  const criticalPages = [
    { path: '/', name: 'Home Page' },
    { path: '/cards', name: 'Cards Page' },
    { path: '/readings/new', name: 'New Reading Page' },
    { path: '/auth/login', name: 'Login Page' }
  ];

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should test application usability across all color blindness types', async ({ page }) => {
    console.log('\n=== COLOR BLINDNESS SIMULATION TESTING ===');

    for (const filterType of colorBlindnessFilters) {
      console.log(`\nTesting: ${filterType.name} (${filterType.description})`);
      console.log(`Prevalence: ${filterType.prevalence}`);

      for (const pageTest of criticalPages) {
        await page.goto(pageTest.path);
        await page.waitForLoadState('networkidle');

        // Apply color blindness filter
        await page.addStyleTag({
          content: `
            body {
              filter: ${filterType.filter} !important;
            }
          `
        });

        await page.waitForTimeout(500); // Allow filter to apply

        // Test if essential functionality is still accessible
        const functionalityTest = await page.evaluate(() => {
          const results = {
            visibleButtons: 0,
            visibleLinks: 0,
            visibleHeadings: 0,
            distinctiveElements: 0,
            textContent: [] as string[]
          };

          // Count visible interactive elements
          const buttons = document.querySelectorAll('button:not([aria-hidden="true"])');
          const links = document.querySelectorAll('a:not([aria-hidden="true"])');
          const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

          buttons.forEach(button => {
            const rect = button.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              results.visibleButtons++;
              if (button.textContent?.trim()) {
                results.textContent.push(button.textContent.trim());
              }
            }
          });

          links.forEach(link => {
            const rect = link.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              results.visibleLinks++;
              if (link.textContent?.trim()) {
                results.textContent.push(link.textContent.trim());
              }
            }
          });

          headings.forEach(heading => {
            const rect = heading.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              results.visibleHeadings++;
            }
          });

          // Check for elements with non-color distinctive features
          const distinctiveElements = document.querySelectorAll('[class*="border"], [class*="shadow"], [style*="border"], [style*="text-decoration"]');
          results.distinctiveElements = distinctiveElements.length;

          return results;
        });

        console.log(`  ${pageTest.name}:`);
        console.log(`    Visible buttons: ${functionalityTest.visibleButtons}`);
        console.log(`    Visible links: ${functionalityTest.visibleLinks}`);
        console.log(`    Visible headings: ${functionalityTest.visibleHeadings}`);
        console.log(`    Elements with non-color features: ${functionalityTest.distinctiveElements}`);

        // Essential functionality should remain accessible
        expect(functionalityTest.visibleButtons + functionalityTest.visibleLinks).toBeGreaterThan(0);
        expect(functionalityTest.visibleHeadings).toBeGreaterThan(0);
      }

      // Remove the filter for next test
      await page.addStyleTag({
        content: `
          body {
            filter: none !important;
          }
        `
      });
    }
  });

  test('should identify color-dependent interface elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('\n=== COLOR-DEPENDENT ELEMENTS ANALYSIS ===');

    const colorDependentElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const colorDependent: any[] = [];

      elements.forEach(element => {
        const styles = window.getComputedStyle(element);
        const hasColorStyling =
          styles.color !== 'rgb(0, 0, 0)' || // Not default black
          styles.backgroundColor !== 'rgba(0, 0, 0, 0)' || // Has background
          styles.borderColor !== 'rgb(0, 0, 0)' || // Has border color
          element.className.includes('text-') ||
          element.className.includes('bg-') ||
          element.className.includes('border-');

        if (hasColorStyling && element.textContent?.trim()) {
          const hasAlternativeIdentifiers =
            element.hasAttribute('aria-label') ||
            element.hasAttribute('title') ||
            element.querySelector('svg, img, [class*="icon"]') ||
            styles.borderWidth !== '0px' ||
            styles.textDecoration !== 'none' ||
            styles.fontWeight === 'bold' ||
            parseFloat(styles.fontSize) > 16;

          colorDependent.push({
            tagName: element.tagName,
            className: element.className,
            textContent: element.textContent.trim().substring(0, 50),
            hasAlternativeIdentifiers,
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            borderColor: styles.borderColor,
            fontWeight: styles.fontWeight,
            fontSize: styles.fontSize,
            textDecoration: styles.textDecoration
          });
        }
      });

      return colorDependent;
    });

    console.log(`Found ${colorDependentElements.length} elements with color styling`);

    const elementsWithoutAlternatives = colorDependentElements.filter(el => !el.hasAlternativeIdentifiers);
    console.log(`Elements relying solely on color: ${elementsWithoutAlternatives.length}`);

    if (elementsWithoutAlternatives.length > 0) {
      console.log('\nElements that may need additional non-color identifiers:');
      elementsWithoutAlternatives.slice(0, 10).forEach((element, index) => {
        console.log(`  ${index + 1}. ${element.tagName}.${element.className}`);
        console.log(`     Text: "${element.textContent}"`);
        console.log(`     Color: ${element.color}, Background: ${element.backgroundColor}`);
      });
    }

    // Should minimize elements that rely solely on color
    expect(elementsWithoutAlternatives.length).toBeLessThan(colorDependentElements.length * 0.3);
  });

  test('should test status indicators with color blindness simulation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('\n=== STATUS INDICATORS COLOR BLINDNESS TEST ===');

    // Test different status indicators common in web applications
    const statusTests = [
      { type: 'success', expectedText: ['success', 'complete', 'done', '✓'] },
      { type: 'error', expectedText: ['error', 'failed', 'invalid', '✗', '❌'] },
      { type: 'warning', expectedText: ['warning', 'caution', 'alert', '⚠'] },
      { type: 'info', expectedText: ['info', 'note', 'tip', 'ℹ'] }
    ];

    for (const filter of ['monochromacy', 'deuteranopia', 'protanopia']) {
      const colorFilter = colorBlindnessFilters.find(f => f.type === filter)?.filter || 'none';

      console.log(`\nTesting with ${filter} simulation:`);

      await page.addStyleTag({
        content: `
          body {
            filter: ${colorFilter} !important;
          }
        `
      });

      const statusElementsTest = await page.evaluate((statusTests) => {
        const results: any = {};

        statusTests.forEach(status => {
          // Look for elements that might be status indicators
          const potentialStatusElements = document.querySelectorAll(`
            [class*="${status.type}"],
            [class*="alert"],
            [class*="status"],
            [class*="badge"],
            .text-red-500, .text-green-500, .text-yellow-500, .text-blue-500,
            .bg-red-500, .bg-green-500, .bg-yellow-500, .bg-blue-500
          `);

          results[status.type] = {
            found: potentialStatusElements.length,
            withText: 0,
            withIcons: 0,
            withPatterns: 0
          };

          potentialStatusElements.forEach(element => {
            const text = element.textContent?.toLowerCase() || '';
            const hasStatusText = status.expectedText.some(keyword => text.includes(keyword));
            const hasIcon = element.querySelector('svg, img, [class*="icon"]');
            const styles = window.getComputedStyle(element);
            const hasPattern = styles.backgroundImage !== 'none' ||
                             styles.borderStyle !== 'none' ||
                             styles.textDecoration !== 'none';

            if (hasStatusText) results[status.type].withText++;
            if (hasIcon) results[status.type].withIcons++;
            if (hasPattern) results[status.type].withPatterns++;
          });
        });

        return results;
      }, statusTests);

      Object.keys(statusElementsTest).forEach(statusType => {
        const status = statusElementsTest[statusType];
        console.log(`  ${statusType}: ${status.found} elements found`);
        console.log(`    With descriptive text: ${status.withText}`);
        console.log(`    With icons: ${status.withIcons}`);
        console.log(`    With patterns: ${status.withPatterns}`);
      });
    }

    // Reset filter
    await page.addStyleTag({
      content: 'body { filter: none !important; }'
    });
  });

  test('should test button and link distinguishability', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('\n=== BUTTON AND LINK DISTINGUISHABILITY TEST ===');

    for (const filter of colorBlindnessFilters.slice(0, 4)) { // Test major types
      console.log(`\nTesting with ${filter.name}:`);

      await page.addStyleTag({
        content: `
          body {
            filter: ${filter.filter} !important;
          }
        `
      });

      await page.waitForTimeout(300);

      const interactiveElementsTest = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        const links = document.querySelectorAll('a');

        const results = {
          buttons: {
            total: buttons.length,
            withBorders: 0,
            withBackgrounds: 0,
            withShadows: 0,
            withHoverEffects: 0
          },
          links: {
            total: links.length,
            withUnderlines: 0,
            withDifferentFont: 0,
            withHoverEffects: 0
          }
        };

        buttons.forEach(button => {
          const styles = window.getComputedStyle(button);
          if (styles.borderWidth !== '0px') results.buttons.withBorders++;
          if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)') results.buttons.withBackgrounds++;
          if (styles.boxShadow !== 'none') results.buttons.withShadows++;

          // Simulate hover to check for effects
          button.dispatchEvent(new MouseEvent('mouseenter'));
          setTimeout(() => {
            const hoverStyles = window.getComputedStyle(button);
            if (hoverStyles.backgroundColor !== styles.backgroundColor ||
                hoverStyles.borderColor !== styles.borderColor ||
                hoverStyles.boxShadow !== styles.boxShadow) {
              results.buttons.withHoverEffects++;
            }
            button.dispatchEvent(new MouseEvent('mouseleave'));
          }, 50);
        });

        links.forEach(link => {
          const styles = window.getComputedStyle(link);
          if (styles.textDecoration.includes('underline')) results.links.withUnderlines++;
          if (styles.fontWeight === 'bold' || parseFloat(styles.fontSize) !== 16) {
            results.links.withDifferentFont++;
          }

          // Check hover effects
          link.dispatchEvent(new MouseEvent('mouseenter'));
          setTimeout(() => {
            const hoverStyles = window.getComputedStyle(link);
            if (hoverStyles.textDecoration !== styles.textDecoration ||
                hoverStyles.color !== styles.color) {
              results.links.withHoverEffects++;
            }
            link.dispatchEvent(new MouseEvent('mouseleave'));
          }, 50);
        });

        return results;
      });

      console.log(`  Buttons (${interactiveElementsTest.buttons.total} total):`);
      console.log(`    With borders: ${interactiveElementsTest.buttons.withBorders}`);
      console.log(`    With backgrounds: ${interactiveElementsTest.buttons.withBackgrounds}`);
      console.log(`    With shadows: ${interactiveElementsTest.buttons.withShadows}`);

      console.log(`  Links (${interactiveElementsTest.links.total} total):`);
      console.log(`    With underlines: ${interactiveElementsTest.links.withUnderlines}`);
      console.log(`    With different typography: ${interactiveElementsTest.links.withDifferentFont}`);

      // Buttons should have visual distinguishing features beyond color
      if (interactiveElementsTest.buttons.total > 0) {
        const buttonsWithFeatures = interactiveElementsTest.buttons.withBorders +
                                   interactiveElementsTest.buttons.withBackgrounds +
                                   interactiveElementsTest.buttons.withShadows;
        expect(buttonsWithFeatures).toBeGreaterThan(interactiveElementsTest.buttons.total * 0.8);
      }

      // Links should be distinguishable
      if (interactiveElementsTest.links.total > 0) {
        const linksWithFeatures = interactiveElementsTest.links.withUnderlines +
                                 interactiveElementsTest.links.withDifferentFont;
        expect(linksWithFeatures).toBeGreaterThan(interactiveElementsTest.links.total * 0.6);
      }
    }

    // Reset filter
    await page.addStyleTag({
      content: 'body { filter: none !important; }'
    });
  });

  test('should test critical user flows with color blindness', async ({ page }) => {
    console.log('\n=== CRITICAL USER FLOWS WITH COLOR BLINDNESS ===');

    // Test login flow with deuteranopia (most common form)
    const deuteranopiaFilter = colorBlindnessFilters.find(f => f.type === 'deuteranopia')?.filter;

    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await page.addStyleTag({
      content: `
        body {
          filter: ${deuteranopiaFilter} !important;
        }
      `
    });

    console.log('Testing login flow with deuteranopia simulation...');

    // Try to complete login form
    const loginFlowTest = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"], input[name="password"]') as HTMLInputElement;
      const submitButton = document.querySelector('button[type="submit"], input[type="submit"]') as HTMLElement;

      const results = {
        emailInputVisible: false,
        passwordInputVisible: false,
        submitButtonVisible: false,
        formLabelsVisible: false,
        errorMessagesVisible: false
      };

      if (emailInput) {
        const rect = emailInput.getBoundingClientRect();
        results.emailInputVisible = rect.width > 0 && rect.height > 0;
      }

      if (passwordInput) {
        const rect = passwordInput.getBoundingClientRect();
        results.passwordInputVisible = rect.width > 0 && rect.height > 0;
      }

      if (submitButton) {
        const rect = submitButton.getBoundingClientRect();
        results.submitButtonVisible = rect.width > 0 && rect.height > 0;
      }

      // Check for form labels
      const labels = document.querySelectorAll('label');
      results.formLabelsVisible = labels.length > 0;

      return results;
    });

    console.log('Login form accessibility with color blindness:');
    console.log(`  Email input visible: ${loginFlowTest.emailInputVisible}`);
    console.log(`  Password input visible: ${loginFlowTest.passwordInputVisible}`);
    console.log(`  Submit button visible: ${loginFlowTest.submitButtonVisible}`);
    console.log(`  Form labels present: ${loginFlowTest.formLabelsVisible}`);

    // Critical form elements should remain accessible
    expect(loginFlowTest.emailInputVisible).toBe(true);
    expect(loginFlowTest.passwordInputVisible).toBe(true);
    expect(loginFlowTest.submitButtonVisible).toBe(true);
    expect(loginFlowTest.formLabelsVisible).toBe(true);

    // Reset filter
    await page.addStyleTag({
      content: 'body { filter: none !important; }'
    });
  });

  test('should generate color blindness accessibility report', async ({ page }) => {
    console.log('\n=== COLOR BLINDNESS ACCESSIBILITY REPORT ===');

    const reportData = {
      timestamp: new Date().toISOString(),
      testResults: [] as any[],
      overallScore: 0,
      recommendations: [] as string[]
    };

    for (const filter of colorBlindnessFilters.slice(0, 3)) { // Test top 3 most common
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.addStyleTag({
        content: `body { filter: ${filter.filter} !important; }`
      });

      const accessibilityScore = await page.evaluate(() => {
        let score = 100;
        const deductions = {
          missingAltText: 0,
          colorOnlyElements: 0,
          poorContrast: 0,
          missingLabels: 0
        };

        // Check for elements that rely solely on color
        const colorOnlyElements = document.querySelectorAll('[style*="color"], [class*="text-"], [class*="bg-"]');
        colorOnlyElements.forEach(element => {
          const hasAlternative =
            element.hasAttribute('aria-label') ||
            element.hasAttribute('title') ||
            element.querySelector('svg, img') ||
            element.textContent?.includes('●') ||
            element.textContent?.includes('✓') ||
            element.textContent?.includes('✗');

          if (!hasAlternative) {
            deductions.colorOnlyElements++;
            score -= 2;
          }
        });

        // Check for missing alt text
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          if (!img.hasAttribute('alt')) {
            deductions.missingAltText++;
            score -= 5;
          }
        });

        // Check for unlabeled form elements
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
          const hasLabel =
            document.querySelector(`label[for="${input.id}"]`) ||
            input.hasAttribute('aria-label') ||
            input.hasAttribute('aria-labelledby');

          if (!hasLabel) {
            deductions.missingLabels++;
            score -= 3;
          }
        });

        return {
          score: Math.max(0, score),
          deductions
        };
      });

      reportData.testResults.push({
        filterType: filter.name,
        score: accessibilityScore.score,
        deductions: accessibilityScore.deductions
      });
    }

    // Calculate overall score
    const totalScore = reportData.testResults.reduce((sum, result) => sum + result.score, 0);
    reportData.overallScore = Math.round(totalScore / reportData.testResults.length);

    // Generate recommendations
    if (reportData.overallScore < 90) {
      reportData.recommendations.push('Add non-color identifiers (icons, patterns, text) to color-coded elements');
    }
    if (reportData.testResults.some(r => r.deductions.missingAltText > 0)) {
      reportData.recommendations.push('Add alt text to all images');
    }
    if (reportData.testResults.some(r => r.deductions.missingLabels > 0)) {
      reportData.recommendations.push('Ensure all form elements have proper labels');
    }
    if (reportData.testResults.some(r => r.deductions.colorOnlyElements > 5)) {
      reportData.recommendations.push('Reduce reliance on color-only indicators');
    }

    console.log('\n=== COLOR BLINDNESS ACCESSIBILITY REPORT ===');
    console.log(`Overall Score: ${reportData.overallScore}/100`);
    console.log('\nResults by color blindness type:');
    reportData.testResults.forEach(result => {
      console.log(`  ${result.filterType}: ${result.score}/100`);
      if (result.deductions.colorOnlyElements > 0) {
        console.log(`    - ${result.deductions.colorOnlyElements} elements rely solely on color`);
      }
      if (result.deductions.missingAltText > 0) {
        console.log(`    - ${result.deductions.missingAltText} images missing alt text`);
      }
      if (result.deductions.missingLabels > 0) {
        console.log(`    - ${result.deductions.missingLabels} form elements missing labels`);
      }
    });

    if (reportData.recommendations.length > 0) {
      console.log('\nRecommendations:');
      reportData.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    // Assert minimum accessibility standards
    expect(reportData.overallScore).toBeGreaterThanOrEqual(80);

    // No test should score below 70
    reportData.testResults.forEach(result => {
      expect(result.score).toBeGreaterThanOrEqual(70);
    });

    // Reset any applied filters
    await page.addStyleTag({
      content: 'body { filter: none !important; }'
    });
  });
});