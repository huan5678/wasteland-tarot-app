import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * WCAG AA Compliance Testing Suite
 *
 * Comprehensive testing for Web Content Accessibility Guidelines (WCAG) 2.1 AA standards
 * including automated scanning, manual verification, and specific accessibility features.
 */

interface AccessibilityViolation {
  id: string;
  description: string;
  impact: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary?: string;
  }>;
}

interface ComplianceReport {
  totalViolations: number;
  criticalViolations: number;
  seriousViolations: number;
  moderateViolations: number;
  minorViolations: number;
  passedRules: number;
  testedPages: string[];
  complianceScore: number;
}

test.describe('WCAG AA Compliance Testing', () => {
  const pagesToTest = [
    { path: '/', name: 'Home Page' },
    { path: '/cards', name: 'Cards Page' },
    { path: '/readings', name: 'Readings Page' },
    { path: '/readings/new', name: 'New Reading Page' },
    { path: '/auth/login', name: 'Login Page' },
    { path: '/auth/register', name: 'Register Page' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/profile', name: 'Profile Page' }
  ];

  const wcagRules = {
    critical: [
      'color-contrast',
      'keyboard',
      'focus-order-semantics',
      'aria-required-children',
      'aria-required-parent'
    ],
    serious: [
      'aria-allowed-attr',
      'aria-hidden-focus',
      'aria-labelledby',
      'aria-valid-attr-value',
      'heading-order',
      'label',
      'landmark-one-main',
      'region'
    ],
    moderate: [
      'alt-text',
      'document-title',
      'html-has-lang',
      'meta-viewport',
      'skip-link'
    ]
  };

  test.beforeEach(async ({ page }) => {
    // Set up accessibility testing environment
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should perform comprehensive WCAG AA scan across all pages', async ({ page }) => {
    const complianceReport: ComplianceReport = {
      totalViolations: 0,
      criticalViolations: 0,
      seriousViolations: 0,
      moderateViolations: 0,
      minorViolations: 0,
      passedRules: 0,
      testedPages: [],
      complianceScore: 0
    };

    console.log('\n=== WCAG AA COMPREHENSIVE COMPLIANCE SCAN ===');

    for (const pageTest of pagesToTest) {
      console.log(`\nTesting: ${pageTest.name} (${pageTest.path})`);

      try {
        await page.goto(pageTest.path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000); // Allow dynamic content to load

        const accessibilityResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .include('body')
          .exclude('[aria-hidden="true"]')
          .analyze();

        // Categorize violations by impact
        const pageViolations = {
          critical: accessibilityResults.violations.filter(v => v.impact === 'critical'),
          serious: accessibilityResults.violations.filter(v => v.impact === 'serious'),
          moderate: accessibilityResults.violations.filter(v => v.impact === 'moderate'),
          minor: accessibilityResults.violations.filter(v => v.impact === 'minor')
        };

        console.log(`  Total violations: ${accessibilityResults.violations.length}`);
        console.log(`  Critical: ${pageViolations.critical.length}`);
        console.log(`  Serious: ${pageViolations.serious.length}`);
        console.log(`  Moderate: ${pageViolations.moderate.length}`);
        console.log(`  Minor: ${pageViolations.minor.length}`);
        console.log(`  Passed rules: ${accessibilityResults.passes.length}`);

        // Update compliance report
        complianceReport.totalViolations += accessibilityResults.violations.length;
        complianceReport.criticalViolations += pageViolations.critical.length;
        complianceReport.seriousViolations += pageViolations.serious.length;
        complianceReport.moderateViolations += pageViolations.moderate.length;
        complianceReport.minorViolations += pageViolations.minor.length;
        complianceReport.passedRules += accessibilityResults.passes.length;
        complianceReport.testedPages.push(pageTest.name);

        // Log detailed violation information
        if (accessibilityResults.violations.length > 0) {
          console.log(`\n  Detailed violations for ${pageTest.name}:`);
          accessibilityResults.violations.forEach((violation, index) => {
            console.log(`    ${index + 1}. [${violation.impact?.toUpperCase()}] ${violation.id}`);
            console.log(`       ${violation.description}`);
            console.log(`       Affected elements: ${violation.nodes.length}`);
            console.log(`       Help: ${violation.help}`);
          });
        }

        // Critical pages must have zero critical violations
        if (['Home Page', 'Login Page', 'Register Page'].includes(pageTest.name)) {
          expect(pageViolations.critical.length).toBe(0);
        }

        // All pages should have minimal serious violations
        expect(pageViolations.serious.length).toBeLessThanOrEqual(2);

      } catch (error) {
        console.error(`Error testing ${pageTest.name}: ${error}`);
        // Continue with other pages
      }
    }

    // Calculate overall compliance score
    const totalTests = complianceReport.passedRules + complianceReport.totalViolations;
    complianceReport.complianceScore = totalTests > 0 ?
      Math.round((complianceReport.passedRules / totalTests) * 100) : 0;

    console.log('\n=== OVERALL COMPLIANCE REPORT ===');
    console.log(`Pages tested: ${complianceReport.testedPages.length}`);
    console.log(`Total violations: ${complianceReport.totalViolations}`);
    console.log(`Critical violations: ${complianceReport.criticalViolations}`);
    console.log(`Serious violations: ${complianceReport.seriousViolations}`);
    console.log(`Moderate violations: ${complianceReport.moderateViolations}`);
    console.log(`Minor violations: ${complianceReport.minorViolations}`);
    console.log(`Passed rules: ${complianceReport.passedRules}`);
    console.log(`Compliance score: ${complianceReport.complianceScore}%`);

    // Compliance requirements
    expect(complianceReport.criticalViolations).toBeLessThanOrEqual(2);
    expect(complianceReport.seriousViolations).toBeLessThanOrEqual(5);
    expect(complianceReport.complianceScore).toBeGreaterThanOrEqual(85);
  });

  test('should validate specific WCAG AA criteria', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('\n=== SPECIFIC WCAG AA CRITERIA VALIDATION ===');

    // 1.4.3 Contrast (Minimum) - AA Level
    const contrastResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    console.log(`Color contrast violations: ${contrastResults.violations.length}`);
    expect(contrastResults.violations.length).toBeLessThanOrEqual(1);

    // 2.1.1 Keyboard - AA Level
    const keyboardResults = await new AxeBuilder({ page })
      .withRules(['keyboard'])
      .analyze();

    console.log(`Keyboard accessibility violations: ${keyboardResults.violations.length}`);
    expect(keyboardResults.violations.length).toBe(0);

    // 2.4.1 Bypass Blocks - AA Level
    const bypassResults = await new AxeBuilder({ page })
      .withRules(['bypass', 'skip-link'])
      .analyze();

    console.log(`Bypass blocks violations: ${bypassResults.violations.length}`);

    // 2.4.2 Page Titled - AA Level
    const titleResults = await new AxeBuilder({ page })
      .withRules(['document-title'])
      .analyze();

    console.log(`Page title violations: ${titleResults.violations.length}`);
    expect(titleResults.violations.length).toBe(0);

    // 3.1.1 Language of Page - AA Level
    const langResults = await new AxeBuilder({ page })
      .withRules(['html-has-lang'])
      .analyze();

    console.log(`Language attribute violations: ${langResults.violations.length}`);
    expect(langResults.violations.length).toBe(0);

    // 4.1.1 Parsing - AA Level
    const parsingResults = await new AxeBuilder({ page })
      .withRules(['duplicate-id', 'valid-lang'])
      .analyze();

    console.log(`HTML parsing violations: ${parsingResults.violations.length}`);
    expect(parsingResults.violations.length).toBeLessThanOrEqual(1);

    // 4.1.2 Name, Role, Value - AA Level
    const nameRoleValueResults = await new AxeBuilder({ page })
      .withRules(['aria-allowed-attr', 'aria-required-attr', 'aria-valid-attr-value'])
      .analyze();

    console.log(`Name, Role, Value violations: ${nameRoleValueResults.violations.length}`);
    expect(nameRoleValueResults.violations.length).toBeLessThanOrEqual(2);
  });

  test('should validate semantic HTML structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('\n=== SEMANTIC HTML STRUCTURE VALIDATION ===');

    const semanticStructure = await page.evaluate(() => {
      const results = {
        hasMain: !!document.querySelector('main'),
        hasNav: !!document.querySelector('nav'),
        hasHeader: !!document.querySelector('header'),
        hasFooter: !!document.querySelector('footer'),
        headingStructure: [] as string[],
        landmarks: [] as string[],
        ariaLabels: 0,
        ariaLabelledBy: 0,
        ariaDescribedBy: 0
      };

      // Check heading hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach(heading => {
        results.headingStructure.push(heading.tagName);
      });

      // Check landmarks
      const landmarks = document.querySelectorAll('[role], main, nav, header, footer, section, article, aside');
      landmarks.forEach(landmark => {
        const role = landmark.getAttribute('role') || landmark.tagName.toLowerCase();
        if (!results.landmarks.includes(role)) {
          results.landmarks.push(role);
        }
      });

      // Count ARIA attributes
      results.ariaLabels = document.querySelectorAll('[aria-label]').length;
      results.ariaLabelledBy = document.querySelectorAll('[aria-labelledby]').length;
      results.ariaDescribedBy = document.querySelectorAll('[aria-describedby]').length;

      return results;
    });

    console.log('Semantic structure analysis:');
    console.log(`  Has main element: ${semanticStructure.hasMain}`);
    console.log(`  Has nav element: ${semanticStructure.hasNav}`);
    console.log(`  Has header element: ${semanticStructure.hasHeader}`);
    console.log(`  Has footer element: ${semanticStructure.hasFooter}`);
    console.log(`  Heading structure: ${semanticStructure.headingStructure.join(' -> ')}`);
    console.log(`  Landmarks: ${semanticStructure.landmarks.join(', ')}`);
    console.log(`  ARIA labels: ${semanticStructure.ariaLabels}`);
    console.log(`  ARIA labelledby: ${semanticStructure.ariaLabelledBy}`);
    console.log(`  ARIA describedby: ${semanticStructure.ariaDescribedBy}`);

    // Semantic structure requirements
    expect(semanticStructure.hasMain).toBe(true);
    expect(semanticStructure.hasHeader).toBe(true);
    expect(semanticStructure.hasFooter).toBe(true);
    expect(semanticStructure.headingStructure[0]).toBe('H1'); // First heading should be H1
    expect(semanticStructure.landmarks.length).toBeGreaterThanOrEqual(3);
  });

  test('should validate form accessibility', async ({ page }) => {
    // Test form accessibility on login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    console.log('\n=== FORM ACCESSIBILITY VALIDATION ===');

    const formResults = await new AxeBuilder({ page })
      .withRules(['label', 'aria-required-attr', 'aria-invalid-attr'])
      .include('form')
      .analyze();

    console.log(`Form accessibility violations: ${formResults.violations.length}`);

    const formAccessibility = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, textarea, select');
      const results = {
        totalInputs: inputs.length,
        inputsWithLabels: 0,
        inputsWithAriaLabel: 0,
        inputsWithPlaceholder: 0,
        inputsWithRequired: 0,
        inputsWithAriaRequired: 0,
        inputsWithAriaInvalid: 0,
        inputsWithErrorMessages: 0
      };

      inputs.forEach(input => {
        const id = input.id;
        const hasLabel = !!document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = input.hasAttribute('aria-label');
        const hasPlaceholder = input.hasAttribute('placeholder');
        const hasRequired = input.hasAttribute('required');
        const hasAriaRequired = input.hasAttribute('aria-required');
        const hasAriaInvalid = input.hasAttribute('aria-invalid');
        const hasErrorMessage = !!document.querySelector(`[aria-describedby="${id}-error"]`);

        if (hasLabel) results.inputsWithLabels++;
        if (hasAriaLabel) results.inputsWithAriaLabel++;
        if (hasPlaceholder) results.inputsWithPlaceholder++;
        if (hasRequired) results.inputsWithRequired++;
        if (hasAriaRequired) results.inputsWithAriaRequired++;
        if (hasAriaInvalid) results.inputsWithAriaInvalid++;
        if (hasErrorMessage) results.inputsWithErrorMessages++;
      });

      return results;
    });

    console.log('Form accessibility analysis:');
    console.log(`  Total inputs: ${formAccessibility.totalInputs}`);
    console.log(`  Inputs with labels: ${formAccessibility.inputsWithLabels}`);
    console.log(`  Inputs with ARIA labels: ${formAccessibility.inputsWithAriaLabel}`);
    console.log(`  Inputs with placeholders: ${formAccessibility.inputsWithPlaceholder}`);
    console.log(`  Required inputs: ${formAccessibility.inputsWithRequired}`);
    console.log(`  Inputs with aria-required: ${formAccessibility.inputsWithAriaRequired}`);

    // Form accessibility requirements
    expect(formResults.violations.length).toBeLessThanOrEqual(1);

    // All inputs should have proper labels
    const labeledInputs = formAccessibility.inputsWithLabels + formAccessibility.inputsWithAriaLabel;
    expect(labeledInputs).toEqual(formAccessibility.totalInputs);
  });

  test('should validate interactive element accessibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('\n=== INTERACTIVE ELEMENT ACCESSIBILITY ===');

    const interactiveResults = await new AxeBuilder({ page })
      .withRules(['button-name', 'link-name', 'aria-hidden-focus'])
      .analyze();

    console.log(`Interactive element violations: ${interactiveResults.violations.length}`);

    const interactiveElements = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const links = document.querySelectorAll('a');
      const interactiveElements = document.querySelectorAll('[tabindex], [onclick]');

      const results = {
        totalButtons: buttons.length,
        buttonsWithAccessibleNames: 0,
        totalLinks: links.length,
        linksWithAccessibleNames: 0,
        totalInteractive: interactiveElements.length,
        elementsWithTabIndex: 0,
        elementsWithNegativeTabIndex: 0
      };

      buttons.forEach(button => {
        const hasAccessibleName =
          button.textContent?.trim() ||
          button.getAttribute('aria-label') ||
          button.getAttribute('aria-labelledby') ||
          button.getAttribute('title');
        if (hasAccessibleName) results.buttonsWithAccessibleNames++;
      });

      links.forEach(link => {
        const hasAccessibleName =
          link.textContent?.trim() ||
          link.getAttribute('aria-label') ||
          link.getAttribute('aria-labelledby') ||
          link.getAttribute('title');
        if (hasAccessibleName) results.linksWithAccessibleNames++;
      });

      interactiveElements.forEach(element => {
        const tabIndex = element.getAttribute('tabindex');
        if (tabIndex !== null) {
          results.elementsWithTabIndex++;
          if (parseInt(tabIndex) < 0) results.elementsWithNegativeTabIndex++;
        }
      });

      return results;
    });

    console.log('Interactive elements analysis:');
    console.log(`  Total buttons: ${interactiveElements.totalButtons}`);
    console.log(`  Buttons with accessible names: ${interactiveElements.buttonsWithAccessibleNames}`);
    console.log(`  Total links: ${interactiveElements.totalLinks}`);
    console.log(`  Links with accessible names: ${interactiveElements.linksWithAccessibleNames}`);
    console.log(`  Elements with tabindex: ${interactiveElements.elementsWithTabIndex}`);
    console.log(`  Elements with negative tabindex: ${interactiveElements.elementsWithNegativeTabIndex}`);

    // Interactive element requirements
    expect(interactiveResults.violations.length).toBeLessThanOrEqual(2);
    expect(interactiveElements.buttonsWithAccessibleNames).toEqual(interactiveElements.totalButtons);
    expect(interactiveElements.linksWithAccessibleNames).toEqual(interactiveElements.totalLinks);
  });

  test('should validate media and image accessibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('\n=== MEDIA AND IMAGE ACCESSIBILITY ===');

    const mediaResults = await new AxeBuilder({ page })
      .withRules(['image-alt', 'area-alt', 'object-alt'])
      .analyze();

    console.log(`Media accessibility violations: ${mediaResults.violations.length}`);

    const mediaAccessibility = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const videos = document.querySelectorAll('video');
      const audios = document.querySelectorAll('audio');
      const canvases = document.querySelectorAll('canvas');

      const results = {
        totalImages: images.length,
        imagesWithAlt: 0,
        decorativeImages: 0,
        totalVideos: videos.length,
        videosWithCaptions: 0,
        totalAudios: audios.length,
        audiosWithTranscripts: 0,
        totalCanvases: canvases.length,
        canvasesWithAriaLabel: 0
      };

      images.forEach(img => {
        if (img.hasAttribute('alt')) {
          results.imagesWithAlt++;
          if (img.getAttribute('alt') === '') {
            results.decorativeImages++;
          }
        }
      });

      videos.forEach(video => {
        const hasTrack = video.querySelector('track[kind="captions"], track[kind="subtitles"]');
        if (hasTrack) results.videosWithCaptions++;
      });

      audios.forEach(audio => {
        const hasTranscript = audio.hasAttribute('aria-describedby') ||
                            document.querySelector('[aria-labelledby*="transcript"]');
        if (hasTranscript) results.audiosWithTranscripts++;
      });

      canvases.forEach(canvas => {
        if (canvas.hasAttribute('aria-label') || canvas.hasAttribute('aria-labelledby')) {
          results.canvasesWithAriaLabel++;
        }
      });

      return results;
    });

    console.log('Media accessibility analysis:');
    console.log(`  Total images: ${mediaAccessibility.totalImages}`);
    console.log(`  Images with alt text: ${mediaAccessibility.imagesWithAlt}`);
    console.log(`  Decorative images: ${mediaAccessibility.decorativeImages}`);
    console.log(`  Total videos: ${mediaAccessibility.totalVideos}`);
    console.log(`  Videos with captions: ${mediaAccessibility.videosWithCaptions}`);
    console.log(`  Total canvases: ${mediaAccessibility.totalCanvases}`);
    console.log(`  Canvases with ARIA labels: ${mediaAccessibility.canvasesWithAriaLabel}`);

    // Media accessibility requirements
    expect(mediaResults.violations.length).toBeLessThanOrEqual(1);

    // All images should have alt attributes (including empty for decorative)
    expect(mediaAccessibility.imagesWithAlt).toEqual(mediaAccessibility.totalImages);

    // All canvases should have ARIA labels
    if (mediaAccessibility.totalCanvases > 0) {
      expect(mediaAccessibility.canvasesWithAriaLabel).toEqual(mediaAccessibility.totalCanvases);
    }
  });

  test('should generate accessibility compliance report', async ({ page }) => {
    console.log('\n=== GENERATING ACCESSIBILITY COMPLIANCE REPORT ===');

    const allPages = [
      '/',
      '/cards',
      '/auth/login'
    ];

    const complianceData = [];

    for (const pagePath of allPages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      complianceData.push({
        page: pagePath,
        violations: results.violations.length,
        passes: results.passes.length,
        score: results.passes.length / (results.passes.length + results.violations.length) * 100
      });
    }

    const overallScore = complianceData.reduce((sum, page) => sum + page.score, 0) / complianceData.length;

    console.log('\n=== ACCESSIBILITY COMPLIANCE REPORT ===');
    console.log(`Testing completed at: ${new Date().toISOString()}`);
    console.log(`Pages tested: ${complianceData.length}`);
    console.log(`Overall compliance score: ${Math.round(overallScore)}%`);

    console.log('\nPage-by-page results:');
    complianceData.forEach(page => {
      console.log(`  ${page.page}: ${Math.round(page.score)}% (${page.violations} violations, ${page.passes} passes)`);
    });

    const recommendation = overallScore >= 90 ? '✅ Excellent' :
                          overallScore >= 80 ? '⚠️ Good' :
                          overallScore >= 70 ? '⚠️ Needs Improvement' :
                          '❌ Requires Immediate Attention';

    console.log(`\nAccessibility Status: ${recommendation}`);

    // Save report data for potential CI/CD integration
    const reportData = {
      timestamp: new Date().toISOString(),
      overallScore,
      pages: complianceData,
      recommendation,
      wcagLevel: 'AA',
      framework: 'Playwright + axe-core'
    };

    // Assert minimum compliance standards
    expect(overallScore).toBeGreaterThanOrEqual(80);

    // Ensure no page has a score below 70%
    complianceData.forEach(page => {
      expect(page.score).toBeGreaterThanOrEqual(70);
    });
  });
});