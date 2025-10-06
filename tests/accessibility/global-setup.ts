import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global Setup for Accessibility Testing
 *
 * Prepares the testing environment and performs initial setup tasks
 * required for comprehensive accessibility testing.
 */

async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up accessibility testing environment...');

  // Ensure test directories exist
  const baseDir = path.join(process.cwd(), 'test-results');
  const reportsDir = path.join(baseDir, 'accessibility-reports');
  const artifactsDir = path.join(baseDir, 'accessibility-artifacts');

  [baseDir, reportsDir, artifactsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });

  // Create a session state for consistent testing
  const browser = await chromium.launch();
  const context = await browser.newContext({
    // Set up a consistent user agent for accessibility testing
    userAgent: 'Mozilla/5.0 (compatible; AccessibilityTestBot/1.0; +https://example.com/bot)',

    // Configure for accessibility testing
    colorScheme: 'dark',
    reducedMotion: 'no-preference',

    // Set up viewport for consistent testing
    viewport: { width: 1920, height: 1080 },

    // Performance and network settings
    permissions: ['accessibility-events'],

    // Locale settings
    locale: 'en-US',
    timezoneId: 'UTC',
  });

  // Navigate to base URL to warm up the application
  const page = await context.newPage();

  try {
    const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
    console.log(`🌐 Warming up application at ${baseURL}...`);

    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30000 });

    // Check if the application is responding correctly
    const title = await page.title();
    console.log(`📄 Application title: ${title}`);

    // Perform basic accessibility setup checks
    const hasMainLandmark = await page.locator('main, [role="main"]').count() > 0;
    const hasNavigation = await page.locator('nav, [role="navigation"]').count() > 0;
    const hasHeadings = await page.locator('h1, h2, h3, h4, h5, h6').count() > 0;

    console.log('🔍 Basic accessibility structure check:');
    console.log(`   Main landmark: ${hasMainLandmark ? '✅' : '❌'}`);
    console.log(`   Navigation: ${hasNavigation ? '✅' : '❌'}`);
    console.log(`   Headings: ${hasHeadings ? '✅' : '❌'}`);

    // Save session state for potential reuse
    const sessionPath = path.join(artifactsDir, 'session-state.json');
    await context.storageState({ path: sessionPath });
    console.log(`💾 Session state saved to: ${sessionPath}`);

  } catch (error) {
    console.error('❌ Failed to set up application session:', error);
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  // Set up test environment variables
  process.env.ACCESSIBILITY_SETUP_COMPLETE = 'true';
  process.env.TEST_START_TIME = Date.now().toString();

  // Create initial test manifest
  const testManifest = {
    setupTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'test',
    baseURL: config.projects[0]?.use?.baseURL || 'http://localhost:3000',
    browsers: config.projects.map(project => project.name),
    testFiles: [
      'color-contrast.spec.ts',
      'wcag-aa-compliance.spec.ts',
      'color-blindness-simulation.spec.ts',
      'keyboard-navigation.spec.ts',
      'screen-reader-compatibility.spec.ts',
      'multi-environment-testing.spec.ts',
      'automated-reporting.spec.ts'
    ],
    wcagLevel: 'AA',
    expectedDuration: '5-10 minutes'
  };

  const manifestPath = path.join(reportsDir, 'test-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(testManifest, null, 2));
  console.log(`📋 Test manifest created: ${manifestPath}`);

  // Inject accessibility testing utilities
  await setupAccessibilityHelpers();

  console.log('✅ Global setup completed successfully!');
}

async function setupAccessibilityHelpers() {
  console.log('🛠️  Setting up accessibility testing helpers...');

  const helpersDir = path.join(process.cwd(), 'tests', 'accessibility', 'helpers');

  if (!fs.existsSync(helpersDir)) {
    fs.mkdirSync(helpersDir, { recursive: true });
  }

  // Create accessibility testing utilities
  const accessibilityHelpers = `
/**
 * Accessibility Testing Helper Functions
 * Auto-generated during global setup
 */

export class AccessibilityHelpers {
  /**
   * Calculate color contrast ratio between two colors
   */
  static calculateContrastRatio(color1: string, color2: string): number {
    // Simplified contrast calculation - would use full implementation in production
    const getLuminance = (color: string): number => {
      // Parse RGB values and calculate relative luminance
      const rgb = color.match(/\\d+/g);
      if (!rgb) return 0;

      const [r, g, b] = rgb.map(c => {
        const val = parseInt(c) / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if an element meets WCAG color contrast requirements
   */
  static meetsContrastRequirement(ratio: number, isLargeText: boolean = false): boolean {
    const requiredRatio = isLargeText ? 3 : 4.5; // WCAG AA standards
    return ratio >= requiredRatio;
  }

  /**
   * Generate accessibility test report metadata
   */
  static generateTestMetadata() {
    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      },
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches
    };
  }

  /**
   * Wait for accessibility tree to be updated
   */
  static async waitForAccessibilityTree(timeout: number = 1000): Promise<void> {
    return new Promise(resolve => {
      const startTime = Date.now();
      const check = () => {
        if (Date.now() - startTime > timeout) {
          resolve();
          return;
        }

        // Use requestAnimationFrame to wait for next paint
        requestAnimationFrame(() => {
          setTimeout(check, 16); // ~60fps
        });
      };
      check();
    });
  }
}

export default AccessibilityHelpers;
`;

  const helpersPath = path.join(helpersDir, 'accessibility-helpers.ts');
  fs.writeFileSync(helpersPath, accessibilityHelpers);

  // Create color blindness simulation CSS
  const colorBlindnessCSS = `
/* Color Blindness Simulation Filters */
.protanopia-filter {
  filter: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='protanopia'%3E%3CfeColorMatrix values='0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0'/%3E%3C/filter%3E%3C/svg%3E#protanopia");
}

.deuteranopia-filter {
  filter: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='deuteranopia'%3E%3CfeColorMatrix values='0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0'/%3E%3C/filter%3E%3C/svg%3E#deuteranopia");
}

.tritanopia-filter {
  filter: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='tritanopia'%3E%3CfeColorMatrix values='0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0'/%3E%3C/filter%3E%3C/svg%3E#tritanopia");
}

.monochromacy-filter {
  filter: grayscale(100%);
}

/* High Contrast Mode Simulation */
.high-contrast-mode {
  filter: contrast(200%) brightness(150%);
}

.high-contrast-mode * {
  background-color: black !important;
  color: white !important;
  border-color: white !important;
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0s !important;
    transition-duration: 0s !important;
  }
}
`;

  const cssPath = path.join(helpersDir, 'accessibility-filters.css');
  fs.writeFileSync(cssPath, colorBlindnessCSS);

  console.log(`📦 Accessibility helpers created in: ${helpersDir}`);
}

export default globalSetup;