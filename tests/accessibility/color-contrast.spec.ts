import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Comprehensive Color Contrast Testing Suite for WCAG AA Compliance
 *
 * This test suite validates that all color combinations in the Wasteland Tarot app
 * meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).
 */

interface ContrastResult {
  element: string;
  foregroundColor: string;
  backgroundColor: string;
  fontSize: number;
  contrastRatio: number;
  wcagCompliant: boolean;
  elementText: string;
  isLargeText: boolean;
}

interface ColorAnalysis {
  r: number;
  g: number;
  b: number;
  a?: number;
}

test.describe('Color Contrast Testing - WCAG AA Compliance', () => {
  // Helper function to calculate relative luminance
  const calculateLuminance = (color: ColorAnalysis): number => {
    const { r, g, b } = color;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  // Helper function to calculate contrast ratio
  const calculateContrastRatio = (color1: ColorAnalysis, color2: ColorAnalysis): number => {
    const lum1 = calculateLuminance(color1);
    const lum2 = calculateLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  };

  // Helper function to parse CSS color to RGB
  const parseColor = (colorString: string): ColorAnalysis | null => {
    const rgbMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3]),
        a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
      };
    }

    // Handle hex colors
    const hexMatch = colorString.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
      return {
        r: parseInt(hexMatch[1], 16),
        g: parseInt(hexMatch[2], 16),
        b: parseInt(hexMatch[3], 16),
        a: 1
      };
    }

    // Handle CSS variables and computed values
    if (colorString.includes('rgb(')) {
      const cleanRgb = colorString.replace('rgb(', '').replace(')', '');
      const [r, g, b] = cleanRgb.split(',').map(v => parseInt(v.trim()));
      return { r, g, b, a: 1 };
    }

    return null;
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });
  });

  test('should analyze color contrast across all text elements', async ({ page }) => {
    const contrastResults = await page.evaluate(() => {
      const textSelectors = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'span', 'a', 'button',
        'label', 'input', 'textarea',
        '.text-pip-boy', '.text-pip-boy-green',
        '.btn-pip-boy', '.interface-header'
      ];

      const results: any[] = [];
      const processedElements = new Set<Element>();

      textSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (processedElements.has(element)) return;
          processedElements.add(element);

          const styles = window.getComputedStyle(element);
          const textContent = element.textContent?.trim();

          if (!textContent || textContent.length === 0) return;

          const fontSize = parseFloat(styles.fontSize);
          const fontWeight = styles.fontWeight;
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;

          // Determine if text is "large" according to WCAG
          const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));

          results.push({
            selector,
            element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
            foregroundColor: color,
            backgroundColor: backgroundColor,
            fontSize: fontSize,
            fontWeight: fontWeight,
            textContent: textContent.substring(0, 100),
            isLargeText,
            computedStyle: {
              color: color,
              backgroundColor: backgroundColor,
              fontSize: styles.fontSize,
              fontWeight: styles.fontWeight
            }
          });
        });
      });

      return results;
    });

    // Parse colors and calculate contrast ratios
    const analysisResults: ContrastResult[] = [];

    for (const result of contrastResults) {
      const foregroundColor = parseColor(result.foregroundColor);
      let backgroundColor = parseColor(result.backgroundColor);

      // If no background color is set, use the page background
      if (!backgroundColor || backgroundColor.a === 0) {
        backgroundColor = { r: 26, g: 26, b: 26, a: 1 }; // --color-wasteland-dark
      }

      if (foregroundColor && backgroundColor) {
        const contrastRatio = calculateContrastRatio(foregroundColor, backgroundColor);
        const requiredRatio = result.isLargeText ? 3 : 4.5;
        const wcagCompliant = contrastRatio >= requiredRatio;

        analysisResults.push({
          element: result.element,
          foregroundColor: result.foregroundColor,
          backgroundColor: result.backgroundColor,
          fontSize: result.fontSize,
          contrastRatio: Math.round(contrastRatio * 100) / 100,
          wcagCompliant,
          elementText: result.textContent,
          isLargeText: result.isLargeText
        });
      }
    }

    // Log detailed results
    console.log('\n=== COLOR CONTRAST ANALYSIS RESULTS ===');
    analysisResults.forEach(result => {
      const status = result.wcagCompliant ? '✅ PASS' : '❌ FAIL';
      const requirement = result.isLargeText ? '3:1 (large text)' : '4.5:1 (normal text)';
      console.log(`${status} ${result.element}: ${result.contrastRatio}:1 (Required: ${requirement})`);
      if (!result.wcagCompliant) {
        console.log(`  Text: "${result.elementText}"`);
        console.log(`  Colors: ${result.foregroundColor} on ${result.backgroundColor}`);
      }
    });

    // Check overall compliance
    const failedElements = analysisResults.filter(r => !r.wcagCompliant);
    const passedElements = analysisResults.filter(r => r.wcagCompliant);

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total elements tested: ${analysisResults.length}`);
    console.log(`Passed: ${passedElements.length}`);
    console.log(`Failed: ${failedElements.length}`);
    console.log(`Compliance rate: ${Math.round((passedElements.length / analysisResults.length) * 100)}%`);

    // Ensure critical elements pass
    const criticalSelectors = ['h1', 'h2', 'h3', 'button', 'a'];
    const criticalFailures = failedElements.filter(r =>
      criticalSelectors.some(sel => r.element.toLowerCase().includes(sel.toLowerCase()))
    );

    if (criticalFailures.length > 0) {
      console.log('\n❌ CRITICAL FAILURES (headings, buttons, links):');
      criticalFailures.forEach(failure => {
        console.log(`  - ${failure.element}: ${failure.contrastRatio}:1`);
      });
    }

    // We should have at least 90% compliance
    expect(passedElements.length / analysisResults.length).toBeGreaterThanOrEqual(0.9);

    // Critical elements must be 100% compliant
    expect(criticalFailures.length).toBe(0);
  });

  test('should test specific Pip-Boy color combinations', async ({ page }) => {
    const pipBoyColors = await page.evaluate(() => {
      // Define expected Pip-Boy color combinations
      const combinations = [
        {
          name: 'Primary Pip-Boy Green on Dark Background',
          foreground: '#00ff88', // --color-pip-boy-green
          background: '#1a1a1a'  // --color-wasteland-dark
        },
        {
          name: 'Secondary Pip-Boy Green on Medium Background',
          foreground: '#00cc66', // --color-pip-boy-green-dark
          background: '#2d2d2d'  // --color-wasteland-medium
        },
        {
          name: 'Terminal Green on Dark Background',
          foreground: '#00cc66', // --color-terminal-green
          background: '#0c0c0c'  // --color-wasteland-darker
        },
        {
          name: 'Warning Yellow on Dark Background',
          foreground: '#ffdd00', // --color-warning-yellow
          background: '#1a1a1a'  // --color-wasteland-dark
        },
        {
          name: 'Error Red on Dark Background',
          foreground: '#ff4444', // --color-error
          background: '#1a1a1a'  // --color-wasteland-dark
        },
        {
          name: 'Success Green on Dark Background',
          foreground: '#00ff88', // --color-success
          background: '#004433'  // --color-success-bg
        }
      ];

      return combinations;
    });

    console.log('\n=== PIP-BOY COLOR COMBINATIONS TEST ===');

    pipBoyColors.forEach(combo => {
      const fg = parseColor(combo.foreground);
      const bg = parseColor(combo.background);

      if (fg && bg) {
        const contrastRatio = calculateContrastRatio(fg, bg);
        const wcagAAPass = contrastRatio >= 4.5;
        const wcagLargePass = contrastRatio >= 3;

        console.log(`\n${combo.name}:`);
        console.log(`  Contrast Ratio: ${Math.round(contrastRatio * 100) / 100}:1`);
        console.log(`  WCAG AA (4.5:1): ${wcagAAPass ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`  WCAG AA Large (3:1): ${wcagLargePass ? '✅ PASS' : '❌ FAIL'}`);

        // Primary combinations should meet AA standards
        if (combo.name.includes('Primary') || combo.name.includes('Terminal')) {
          expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
        }

        // All combinations should at least meet large text standards
        expect(contrastRatio).toBeGreaterThanOrEqual(3);
      }
    });
  });

  test('should validate color contrast in different states', async ({ page }) => {
    // Test interactive states: hover, focus, active, disabled
    const interactiveTests = [
      { selector: 'button', state: 'hover' },
      { selector: 'button', state: 'focus' },
      { selector: 'a', state: 'hover' },
      { selector: 'a', state: 'focus' },
      { selector: 'input', state: 'focus' }
    ];

    console.log('\n=== INTERACTIVE STATES COLOR CONTRAST ===');

    for (const test of interactiveTests) {
      const elements = await page.locator(test.selector).first();

      if (await elements.count() > 0) {
        // Trigger the state
        if (test.state === 'hover') {
          await elements.hover();
        } else if (test.state === 'focus') {
          await elements.focus();
        }

        await page.waitForTimeout(200); // Allow styles to apply

        const stateColors = await page.evaluate(({ selector, state }) => {
          const element = document.querySelector(selector) as HTMLElement;
          if (!element) return null;

          const styles = window.getComputedStyle(element);
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            borderColor: styles.borderColor,
            outline: styles.outline,
            boxShadow: styles.boxShadow
          };
        }, test);

        if (stateColors) {
          const fg = parseColor(stateColors.color);
          let bg = parseColor(stateColors.backgroundColor);

          if (!bg || bg.a === 0) {
            bg = { r: 26, g: 26, b: 26, a: 1 }; // Default background
          }

          if (fg && bg) {
            const contrastRatio = calculateContrastRatio(fg, bg);
            const wcagPass = contrastRatio >= 4.5;

            console.log(`${test.selector}:${test.state} - Contrast: ${Math.round(contrastRatio * 100) / 100}:1 ${wcagPass ? '✅' : '❌'}`);

            // Interactive elements should maintain good contrast in all states
            expect(contrastRatio).toBeGreaterThanOrEqual(3);
          }
        }
      }
    }
  });

  test('should test contrast with axe-core integration', async ({ page }) => {
    const accessibilityResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .include('body')
      .analyze();

    // Filter for color contrast violations
    const contrastViolations = accessibilityResults.violations.filter(violation =>
      violation.id === 'color-contrast' ||
      violation.id === 'color-contrast-enhanced'
    );

    console.log('\n=== AXE-CORE COLOR CONTRAST RESULTS ===');

    if (contrastViolations.length === 0) {
      console.log('✅ No color contrast violations found by axe-core');
    } else {
      console.log(`❌ Found ${contrastViolations.length} color contrast violations:`);

      contrastViolations.forEach((violation, index) => {
        console.log(`\n${index + 1}. ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Help: ${violation.help}`);

        violation.nodes.forEach((node, nodeIndex) => {
          console.log(`   Node ${nodeIndex + 1}: ${node.html.substring(0, 100)}...`);
          console.log(`   Target: ${node.target.join(', ')}`);
          if (node.failureSummary) {
            console.log(`   Issue: ${node.failureSummary}`);
          }
        });
      });
    }

    // Ensure no critical contrast violations
    const criticalViolations = contrastViolations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(criticalViolations.length).toBe(0);
  });

  test('should validate contrast in dark/light mode variations', async ({ page }) => {
    const colorSchemes = ['dark', 'light'];

    for (const scheme of colorSchemes) {
      console.log(`\n=== TESTING ${scheme.toUpperCase()} MODE ===`);

      await page.emulateMedia({ colorScheme: scheme as 'dark' | 'light' });
      await page.reload();
      await page.waitForSelector('.wasteland-background', { state: 'visible' });

      const accessibilityResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .include('body')
        .analyze();

      const contrastViolations = accessibilityResults.violations.filter(v =>
        v.id === 'color-contrast'
      );

      console.log(`Color contrast violations in ${scheme} mode: ${contrastViolations.length}`);

      // Both modes should have minimal violations
      expect(contrastViolations.length).toBeLessThanOrEqual(2);
    }
  });

  test('should test gradient and transparent overlays', async ({ page }) => {
    const gradientElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const gradientElements = [];

      for (const element of elements) {
        const styles = window.getComputedStyle(element);
        const background = styles.background || styles.backgroundImage;

        if (background.includes('gradient') || background.includes('rgba')) {
          const textContent = element.textContent?.trim();
          if (textContent && textContent.length > 0) {
            gradientElements.push({
              tagName: element.tagName,
              className: element.className,
              background: background.substring(0, 200),
              color: styles.color,
              textContent: textContent.substring(0, 50)
            });
          }
        }
      }

      return gradientElements;
    });

    console.log('\n=== GRADIENT AND TRANSPARENT OVERLAY ANALYSIS ===');
    console.log(`Found ${gradientElements.length} elements with gradients or transparency`);

    gradientElements.forEach((element, index) => {
      console.log(`\n${index + 1}. ${element.tagName}.${element.className}`);
      console.log(`   Text: "${element.textContent}"`);
      console.log(`   Background: ${element.background}`);
      console.log(`   Color: ${element.color}`);
    });

    // Elements with gradients should be manually reviewed for accessibility
    expect(gradientElements.length).toBeLessThan(20); // Reasonable limit
  });
});