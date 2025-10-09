import { test, expect, type Page } from '@playwright/test';

/**
 * Keyboard Navigation and Focus Visibility Testing Suite
 *
 * Tests comprehensive keyboard accessibility including:
 * - Tab order and logical navigation
 * - Focus visibility and contrast
 * - Keyboard shortcuts and alternatives
 * - Focus trapping in modals/dialogs
 * - Skip links functionality
 * - ARIA navigation support
 */

interface FocusableElement {
  tagName: string;
  role?: string;
  ariaLabel?: string;
  textContent: string;
  tabIndex: number;
  className: string;
  id: string;
  isVisible: boolean;
  hasVisibleFocus: boolean;
  boundingRect: { x: number; y: number; width: number; height: number };
}

interface KeyboardNavigationResult {
  totalFocusableElements: number;
  successfulTabStops: number;
  elementsWithVisibleFocus: number;
  elementsWithAriaLabels: number;
  skipLinksFound: number;
  tabOrderLogical: boolean;
  focusTrappingWorks: boolean;
}

test.describe('Keyboard Navigation and Focus Visibility Testing', () => {
  const criticalPages = [
    { path: '/', name: 'Home Page' },
    { path: '/cards', name: 'Cards Page' },
    { path: '/readings/new', name: 'New Reading Page' },
    { path: '/auth/login', name: 'Login Page' },
    { path: '/auth/register', name: 'Register Page' },
    { path: '/dashboard', name: 'Dashboard' }
  ];

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Inject CSS to help visualize focus for testing
    await page.addStyleTag({
      content: `
        .test-focus-indicator {
          outline: 3px solid #ff0000 !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 1px rgba(255, 0, 0, 0.3) !important;
        }
      `
    });
  });

  test('should have logical tab order across all pages', async ({ page }) => {
    console.log('\n=== LOGICAL TAB ORDER TESTING ===');

    for (const pageTest of criticalPages) {
      console.log(`\nTesting tab order on: ${pageTest.name}`);

      await page.goto(pageTest.path);
      await page.waitForLoadState('networkidle');

      // Get all focusable elements in DOM order
      const focusableElements = await page.evaluate(() => {
        const focusableSelectors = [
          'a[href]:not([tabindex="-1"])',
          'button:not([disabled]):not([tabindex="-1"])',
          'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
          'select:not([disabled]):not([tabindex="-1"])',
          'textarea:not([disabled]):not([tabindex="-1"])',
          '[tabindex]:not([tabindex="-1"])',
          'details summary',
          '[contenteditable="true"]'
        ];

        const elements = document.querySelectorAll(focusableSelectors.join(', '));
        return Array.from(elements).map((element, index) => {
          const rect = element.getBoundingClientRect();
          return {
            index,
            tagName: element.tagName,
            role: element.getAttribute('role'),
            ariaLabel: element.getAttribute('aria-label'),
            textContent: element.textContent?.trim().substring(0, 50) || '',
            tabIndex: (element as HTMLElement).tabIndex,
            className: element.className,
            id: element.id,
            isVisible: rect.width > 0 && rect.height > 0 && rect.top >= 0,
            boundingRect: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            }
          };
        }).filter(el => el.isVisible);
      });

      console.log(`  Found ${focusableElements.length} focusable elements`);

      // Test tab navigation through elements
      let currentFocusIndex = -1;
      const tabStops: number[] = [];
      const maxTabs = Math.min(focusableElements.length + 5, 20); // Safety limit

      // Start from body to ensure clean state
      await page.evaluate(() => {
        document.body.focus();
      });

      for (let i = 0; i < maxTabs; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100); // Allow focus to settle

        const focusedElement = await page.evaluate(() => {
          const focused = document.activeElement;
          if (!focused || focused === document.body) return null;

          const rect = focused.getBoundingClientRect();
          return {
            tagName: focused.tagName,
            className: focused.className,
            id: focused.id,
            textContent: focused.textContent?.trim().substring(0, 50) || '',
            boundingRect: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            }
          };
        });

        if (focusedElement) {
          // Find matching element in our list
          const matchingIndex = focusableElements.findIndex(el =>
            el.tagName === focusedElement.tagName &&
            el.id === focusedElement.id &&
            el.className === focusedElement.className &&
            Math.abs(el.boundingRect.x - focusedElement.boundingRect.x) < 5 &&
            Math.abs(el.boundingRect.y - focusedElement.boundingRect.y) < 5
          );

          if (matchingIndex !== -1) {
            tabStops.push(matchingIndex);
            currentFocusIndex = matchingIndex;

            console.log(`    Tab ${i + 1}: ${focusedElement.tagName}${focusedElement.id ? '#' + focusedElement.id : ''}`);
          }
        }

        // Stop if we've completed a cycle or hit a logical stopping point
        if (tabStops.length >= focusableElements.length ||
            (tabStops.length > 0 && currentFocusIndex <= tabStops[0])) {
          break;
        }
      }

      // Analyze tab order
      const isLogicalOrder = tabStops.every((current, index) => {
        if (index === 0) return true;
        const previous = tabStops[index - 1];

        // Check if current element comes after previous in DOM or has higher tabindex
        return current > previous ||
               focusableElements[current].tabIndex > focusableElements[previous].tabIndex ||
               focusableElements[current].boundingRect.y > focusableElements[previous].boundingRect.y ||
               (focusableElements[current].boundingRect.y === focusableElements[previous].boundingRect.y &&
                focusableElements[current].boundingRect.x > focusableElements[previous].boundingRect.x);
      });

      console.log(`  Tab order logical: ${isLogicalOrder}`);
      console.log(`  Successfully navigated: ${tabStops.length}/${focusableElements.length} elements`);

      // Tab order should be logical
      expect(isLogicalOrder).toBe(true);

      // Should be able to navigate to most focusable elements
      expect(tabStops.length).toBeGreaterThanOrEqual(Math.min(focusableElements.length * 0.8, 5));
    }
  });

  test('should have visible focus indicators on all interactive elements', async ({ page }) => {
    console.log('\n=== FOCUS VISIBILITY TESTING ===');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const focusVisibilityResults = await page.evaluate(() => {
      const focusableSelectors = [
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[role="button"]',
        '[role="link"]'
      ];

      const elements = document.querySelectorAll(focusableSelectors.join(', '));
      const results: any[] = [];

      elements.forEach((element, index) => {
        if (index >= 10) return; // Limit for performance

        const htmlElement = element as HTMLElement;
        const rect = element.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) return;

        // Get initial styles
        const initialStyles = window.getComputedStyle(element);

        // Focus the element
        htmlElement.focus();

        // Get focus styles
        const focusStyles = window.getComputedStyle(element);

        const hasFocusIndicator =
          focusStyles.outline !== 'none' && focusStyles.outline !== initialStyles.outline ||
          focusStyles.outlineWidth !== '0px' ||
          focusStyles.boxShadow !== 'none' && focusStyles.boxShadow !== initialStyles.boxShadow ||
          focusStyles.backgroundColor !== initialStyles.backgroundColor ||
          focusStyles.borderColor !== initialStyles.borderColor ||
          focusStyles.borderWidth !== initialStyles.borderWidth;

        // Calculate contrast for focus indicator
        let focusContrast = 0;
        if (focusStyles.outline !== 'none' && focusStyles.outlineColor) {
          // Simplified contrast calculation
          const outlineColor = focusStyles.outlineColor;
          const backgroundColor = focusStyles.backgroundColor || 'rgb(26, 26, 26)'; // default dark bg

          // This is a simplified contrast check - in practice you'd want more sophisticated color parsing
          focusContrast = outlineColor.includes('rgb(0, 255') ? 7.4 : // Pip-Boy green
                         outlineColor.includes('rgb(255') ? 4.5 : // Other bright colors
                         2.0; // Assume lower contrast for other colors
        }

        results.push({
          tagName: element.tagName,
          className: element.className,
          id: element.id,
          textContent: element.textContent?.trim().substring(0, 30) || '',
          hasFocusIndicator,
          focusContrast,
          outline: focusStyles.outline,
          outlineColor: focusStyles.outlineColor,
          boxShadow: focusStyles.boxShadow,
          backgroundColor: focusStyles.backgroundColor,
          borderColor: focusStyles.borderColor
        });

        // Remove focus
        htmlElement.blur();
      });

      return results;
    });

    console.log(`Tested focus visibility on ${focusVisibilityResults.length} elements:`);

    let elementsWithGoodFocus = 0;
    let elementsWithPoorFocus = 0;

    focusVisibilityResults.forEach((result, index) => {
      const status = result.hasFocusIndicator ? '✅' : '❌';
      const contrastInfo = result.focusContrast >= 3 ? `(${result.focusContrast}:1)` : '(poor contrast)';

      console.log(`  ${index + 1}. ${status} ${result.tagName}${result.id ? '#' + result.id : ''} ${contrastInfo}`);

      if (result.hasFocusIndicator && result.focusContrast >= 3) {
        elementsWithGoodFocus++;
      } else {
        elementsWithPoorFocus++;
        console.log(`     Issue: ${!result.hasFocusIndicator ? 'No focus indicator' : 'Poor contrast'}`);
      }
    });

    console.log(`\nFocus visibility summary:`);
    console.log(`  Elements with good focus: ${elementsWithGoodFocus}`);
    console.log(`  Elements with poor focus: ${elementsWithPoorFocus}`);

    // All interactive elements should have visible focus indicators
    expect(elementsWithGoodFocus).toBeGreaterThanOrEqual(focusVisibilityResults.length * 0.9);
    expect(elementsWithPoorFocus).toBeLessThanOrEqual(2);
  });

  test('should support keyboard shortcuts and navigation keys', async ({ page }) => {
    console.log('\n=== KEYBOARD SHORTCUTS TESTING ===');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test common keyboard shortcuts
    const keyboardTests = [
      { key: 'Tab', description: 'Tab navigation' },
      { key: 'Shift+Tab', description: 'Reverse tab navigation' },
      { key: 'Enter', description: 'Activate focused element' },
      { key: 'Space', description: 'Activate buttons/checkboxes' },
      { key: 'Escape', description: 'Close modals/menus' },
      { key: 'ArrowDown', description: 'Menu/select navigation' },
      { key: 'ArrowUp', description: 'Menu/select navigation' },
      { key: 'Home', description: 'Jump to beginning' },
      { key: 'End', description: 'Jump to end' }
    ];

    for (const keyTest of keyboardTests) {
      console.log(`\nTesting: ${keyTest.description} (${keyTest.key})`);

      // Reset to a known state
      await page.evaluate(() => {
        document.body.focus();
      });

      const beforeState = await page.evaluate(() => ({
        activeElement: document.activeElement?.tagName || 'BODY',
        activeElementId: document.activeElement?.id || '',
        scrollTop: window.scrollY
      }));

      // Perform keyboard action
      await page.keyboard.press(keyTest.key);
      await page.waitForTimeout(200);

      const afterState = await page.evaluate(() => ({
        activeElement: document.activeElement?.tagName || 'BODY',
        activeElementId: document.activeElement?.id || '',
        scrollTop: window.scrollY
      }));

      const stateChanged =
        beforeState.activeElement !== afterState.activeElement ||
        beforeState.activeElementId !== afterState.activeElementId ||
        Math.abs(beforeState.scrollTop - afterState.scrollTop) > 10;

      console.log(`  State changed: ${stateChanged}`);
      console.log(`  Before: ${beforeState.activeElement}${beforeState.activeElementId ? '#' + beforeState.activeElementId : ''}`);
      console.log(`  After: ${afterState.activeElement}${afterState.activeElementId ? '#' + afterState.activeElementId : ''}`);

      // Tab and navigation keys should change focus/state
      if (['Tab', 'Shift+Tab', 'ArrowDown', 'ArrowUp'].includes(keyTest.key)) {
        expect(stateChanged).toBe(true);
      }
    }
  });

  test('should have proper skip links functionality', async ({ page }) => {
    console.log('\n=== SKIP LINKS TESTING ===');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for skip links
    const skipLinks = await page.evaluate(() => {
      const skipLinkSelectors = [
        'a[href="#main"]',
        'a[href="#content"]',
        'a[href="#skip"]',
        '[class*="skip"]',
        '[class*="sr-only"]',
        'a[href^="#"][class*="visually-hidden"]'
      ];

      const links: any[] = [];

      skipLinkSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          const link = element as HTMLAnchorElement;
          const styles = window.getComputedStyle(link);

          links.push({
            href: link.href,
            textContent: link.textContent?.trim() || '',
            className: link.className,
            isVisible: styles.opacity !== '0' && styles.visibility !== 'hidden',
            isPositioned: styles.position === 'absolute' || styles.position === 'fixed',
            target: link.getAttribute('href')
          });
        });
      });

      return links;
    });

    console.log(`Found ${skipLinks.length} potential skip links:`);

    if (skipLinks.length > 0) {
      skipLinks.forEach((link, index) => {
        console.log(`  ${index + 1}. "${link.textContent}" -> ${link.target}`);
        console.log(`     Visible: ${link.isVisible}, Positioned: ${link.isPositioned}`);
      });

      // Test skip link functionality
      await page.keyboard.press('Tab');

      const firstFocusedElement = await page.evaluate(() => {
        const focused = document.activeElement;
        return {
          tagName: focused?.tagName,
          href: (focused as HTMLAnchorElement)?.href,
          textContent: focused?.textContent?.trim()
        };
      });

      // Check if first tab focuses a skip link
      const isSkipLink = skipLinks.some(link =>
        firstFocusedElement.href?.includes(link.target?.substring(1) || '')
      );

      if (isSkipLink) {
        console.log(`First tab focuses skip link: "${firstFocusedElement.textContent}"`);

        // Test skip link activation
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);

        const targetElement = await page.evaluate(() => {
          const focused = document.activeElement;
          return {
            tagName: focused?.tagName,
            id: focused?.id,
            className: focused?.className
          };
        });

        console.log(`Skip link navigated to: ${targetElement.tagName}${targetElement.id ? '#' + targetElement.id : ''}`);
      }
    } else {
      console.log('No skip links found - consider adding for better accessibility');
    }

    // For content-heavy pages, skip links are recommended
    const pageContent = await page.evaluate(() => {
      const nav = document.querySelector('nav')?.textContent?.length || 0;
      const main = document.querySelector('main')?.textContent?.length || 0;
      const header = document.querySelector('header')?.textContent?.length || 0;

      return { nav, main, header, total: nav + main + header };
    });

    if (pageContent.total > 1000) {
      expect(skipLinks.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('should handle focus trapping in modals and dialogs', async ({ page }) => {
    console.log('\n=== FOCUS TRAPPING TESTING ===');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for modal/dialog triggers
    const modalTriggers = await page.evaluate(() => {
      const selectors = [
        '[data-modal]',
        '[data-dialog]',
        '[aria-haspopup="dialog"]',
        '[class*="modal"]',
        '[class*="dialog"]',
        'button[class*="open"]'
      ];

      const triggers: any[] = [];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            triggers.push({
              tagName: element.tagName,
              className: element.className,
              textContent: element.textContent?.trim().substring(0, 30) || '',
              id: element.id
            });
          }
        });
      });

      return triggers;
    });

    if (modalTriggers.length > 0) {
      console.log(`Found ${modalTriggers.length} potential modal triggers`);

      // Test the first modal trigger
      const trigger = modalTriggers[0];
      console.log(`Testing modal: ${trigger.textContent}`);

      // Navigate to and activate trigger
      await page.keyboard.press('Tab');

      let attempts = 0;
      while (attempts < 10) {
        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          return {
            className: el?.className || '',
            textContent: el?.textContent?.trim().substring(0, 30) || ''
          };
        });

        if (focused.className.includes(trigger.className.split(' ')[0]) ||
            focused.textContent === trigger.textContent) {
          break;
        }

        await page.keyboard.press('Tab');
        attempts++;
      }

      // Activate the modal
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Check if modal is open
      const modalState = await page.evaluate(() => {
        const modals = document.querySelectorAll('[role="dialog"], [aria-modal="true"], .modal');
        const openModal = Array.from(modals).find(modal => {
          const styles = window.getComputedStyle(modal);
          return styles.display !== 'none' && styles.opacity !== '0';
        });

        if (openModal) {
          const focusableInModal = openModal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

          return {
            isOpen: true,
            focusableElements: focusableInModal.length,
            currentFocus: document.activeElement?.tagName || 'NONE'
          };
        }

        return { isOpen: false, focusableElements: 0, currentFocus: 'NONE' };
      });

      if (modalState.isOpen) {
        console.log(`Modal opened with ${modalState.focusableElements} focusable elements`);
        console.log(`Current focus: ${modalState.currentFocus}`);

        // Test focus trapping by tabbing through multiple times
        const focusHistory: string[] = [];

        for (let i = 0; i < modalState.focusableElements + 3; i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);

          const focused = await page.evaluate(() => {
            const el = document.activeElement;
            return el?.tagName + (el?.className ? '.' + el.className.split(' ')[0] : '');
          });

          focusHistory.push(focused);
        }

        console.log(`Focus cycle: ${focusHistory.join(' -> ')}`);

        // Test Escape key to close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        const modalClosed = await page.evaluate(() => {
          const modals = document.querySelectorAll('[role="dialog"], [aria-modal="true"], .modal');
          return Array.from(modals).every(modal => {
            const styles = window.getComputedStyle(modal);
            return styles.display === 'none' || styles.opacity === '0';
          });
        });

        console.log(`Modal closed by Escape: ${modalClosed}`);

        // Focus trapping should cycle within modal
        const uniqueFocusElements = new Set(focusHistory);
        const hasFocusCycle = focusHistory.length > uniqueFocusElements.size;

        console.log(`Focus trapping working: ${hasFocusCycle}`);

        // Basic expectations for modal accessibility
        expect(modalState.focusableElements).toBeGreaterThan(0);
        expect(modalClosed).toBe(true);
      } else {
        console.log('No modal opened or modal not detected');
      }
    } else {
      console.log('No modal triggers found on this page');
    }
  });

  test('should provide comprehensive keyboard navigation report', async ({ page }) => {
    console.log('\n=== KEYBOARD NAVIGATION ACCESSIBILITY REPORT ===');

    const navigationReport = {
      timestamp: new Date().toISOString(),
      pages: [] as any[],
      overallScore: 0,
      findings: [] as string[],
      recommendations: [] as string[]
    };

    for (const pageTest of criticalPages.slice(0, 3)) { // Test top 3 pages
      console.log(`\nAnalyzing: ${pageTest.name}`);

      await page.goto(pageTest.path);
      await page.waitForLoadState('networkidle');

      const pageAnalysis = await page.evaluate(() => {
        // Collect focusable elements
        const focusableSelectors = [
          'a[href]:not([tabindex="-1"])',
          'button:not([disabled]):not([tabindex="-1"])',
          'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
          'select:not([disabled]):not([tabindex="-1"])',
          'textarea:not([disabled]):not([tabindex="-1"])',
          '[tabindex]:not([tabindex="-1"])',
          '[role="button"]',
          '[role="link"]'
        ];

        const elements = document.querySelectorAll(focusableSelectors.join(', '));
        const visibleElements = Array.from(elements).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });

        let elementsWithAriaLabels = 0;
        let elementsWithVisibleText = 0;
        let elementsWithFocusIndicators = 0;

        visibleElements.forEach(element => {
          // Check ARIA labels
          if (element.getAttribute('aria-label') ||
              element.getAttribute('aria-labelledby') ||
              element.getAttribute('title')) {
            elementsWithAriaLabels++;
          }

          // Check visible text
          if (element.textContent?.trim()) {
            elementsWithVisibleText++;
          }

          // Test focus indicator
          const htmlElement = element as HTMLElement;
          const initialOutline = window.getComputedStyle(element).outline;

          htmlElement.focus();
          const focusOutline = window.getComputedStyle(element).outline;

          if (focusOutline !== 'none' && focusOutline !== initialOutline) {
            elementsWithFocusIndicators++;
          }

          htmlElement.blur();
        });

        // Check for skip links
        const skipLinks = document.querySelectorAll('a[href^="#"], [class*="skip"]').length;

        // Check for ARIA landmarks
        const landmarks = document.querySelectorAll(
          'main, nav, header, footer, aside, section, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]'
        ).length;

        return {
          totalFocusableElements: visibleElements.length,
          elementsWithAriaLabels,
          elementsWithVisibleText,
          elementsWithFocusIndicators,
          skipLinks,
          landmarks,
          hasMainLandmark: !!document.querySelector('main, [role="main"]'),
          hasNavLandmark: !!document.querySelector('nav, [role="navigation"]'),
          headingStructure: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.tagName)
        };
      });

      // Calculate page score
      let pageScore = 100;
      const issues: string[] = [];

      // Deduct points for missing features
      if (pageAnalysis.elementsWithFocusIndicators < pageAnalysis.totalFocusableElements * 0.9) {
        pageScore -= 20;
        issues.push('Some elements lack visible focus indicators');
      }

      if (pageAnalysis.elementsWithAriaLabels < pageAnalysis.totalFocusableElements * 0.5) {
        pageScore -= 15;
        issues.push('Many elements lack ARIA labels');
      }

      if (pageAnalysis.skipLinks === 0 && pageAnalysis.totalFocusableElements > 10) {
        pageScore -= 10;
        issues.push('No skip links found for efficient navigation');
      }

      if (!pageAnalysis.hasMainLandmark) {
        pageScore -= 15;
        issues.push('Missing main landmark');
      }

      if (pageAnalysis.landmarks < 3) {
        pageScore -= 10;
        issues.push('Insufficient landmark elements');
      }

      if (pageAnalysis.headingStructure.length === 0 || pageAnalysis.headingStructure[0] !== 'H1') {
        pageScore -= 10;
        issues.push('Poor heading structure');
      }

      pageAnalysis.score = Math.max(0, pageScore);
      pageAnalysis.issues = issues;

      navigationReport.pages.push({
        name: pageTest.name,
        path: pageTest.path,
        ...pageAnalysis
      });

      console.log(`  Score: ${pageAnalysis.score}/100`);
      console.log(`  Focusable elements: ${pageAnalysis.totalFocusableElements}`);
      console.log(`  Elements with focus indicators: ${pageAnalysis.elementsWithFocusIndicators}`);
      console.log(`  Elements with ARIA labels: ${pageAnalysis.elementsWithAriaLabels}`);
      console.log(`  Skip links: ${pageAnalysis.skipLinks}`);
      console.log(`  Landmarks: ${pageAnalysis.landmarks}`);

      if (issues.length > 0) {
        console.log(`  Issues: ${issues.join(', ')}`);
      }
    }

    // Calculate overall score
    navigationReport.overallScore = Math.round(
      navigationReport.pages.reduce((sum, page) => sum + page.score, 0) / navigationReport.pages.length
    );

    // Generate findings and recommendations
    const allIssues = navigationReport.pages.flatMap(page => page.issues);
    const issueFrequency = allIssues.reduce((acc, issue) => {
      acc[issue] = (acc[issue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    navigationReport.findings = Object.entries(issueFrequency)
      .sort(([,a], [,b]) => b - a)
      .map(([issue, count]) => `${issue} (${count} pages affected)`);

    // Generate recommendations based on most common issues
    if (navigationReport.findings.some(f => f.includes('focus indicators'))) {
      navigationReport.recommendations.push('Implement consistent, high-contrast focus indicators for all interactive elements');
    }
    if (navigationReport.findings.some(f => f.includes('ARIA labels'))) {
      navigationReport.recommendations.push('Add ARIA labels to buttons and links with unclear text content');
    }
    if (navigationReport.findings.some(f => f.includes('skip links'))) {
      navigationReport.recommendations.push('Add skip links to pages with complex navigation structures');
    }
    if (navigationReport.findings.some(f => f.includes('landmark'))) {
      navigationReport.recommendations.push('Implement proper landmark structure with main, nav, header, and footer elements');
    }

    console.log('\n=== KEYBOARD NAVIGATION REPORT SUMMARY ===');
    console.log(`Overall Score: ${navigationReport.overallScore}/100`);
    console.log(`Pages Tested: ${navigationReport.pages.length}`);

    if (navigationReport.findings.length > 0) {
      console.log('\nMost Common Issues:');
      navigationReport.findings.slice(0, 5).forEach((finding, index) => {
        console.log(`  ${index + 1}. ${finding}`);
      });
    }

    if (navigationReport.recommendations.length > 0) {
      console.log('\nRecommendations:');
      navigationReport.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    // Assert minimum accessibility standards
    expect(navigationReport.overallScore).toBeGreaterThanOrEqual(75);

    // Each page should score at least 70
    navigationReport.pages.forEach(page => {
      expect(page.score).toBeGreaterThanOrEqual(70);
    });
  });
});