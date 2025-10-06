import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Accessibility Testing
 *
 * Specialized configuration optimized for comprehensive accessibility testing
 * including multiple browsers, devices, and environmental conditions.
 */

export default defineConfig({
  testDir: './tests/accessibility',

  /* Maximum time one test can run for */
  timeout: 60 * 1000,

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,

  /* Opt out of parallel tests on CI for more stable results */
  workers: process.env.CI ? 1 : 2,

  /* Reporter configuration optimized for accessibility testing */
  reporter: [
    ['html', {
      outputFolder: './test-results/accessibility-reports/playwright-html',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    ['json', {
      outputFile: './test-results/accessibility-reports/playwright-results.json'
    }],
    ['junit', {
      outputFile: './test-results/accessibility-reports/junit-results.xml'
    }],
    ['list'], // Console output for CI/CD
    // Custom accessibility reporter could be added here
  ],

  /* Global test settings */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure for accessibility issues analysis */
    video: 'retain-on-failure',

    /* Extended timeout for accessibility testing */
    actionTimeout: 30 * 1000,
    navigationTimeout: 30 * 1000,

    /* User agent for accessibility testing tools */
    userAgent: 'Mozilla/5.0 (compatible; AccessibilityTestBot/1.0)',

    /* Locale for testing internationalization */
    locale: 'en-US',

    /* Timezone for consistent testing */
    timezoneId: 'America/New_York',

    /* Color scheme testing */
    colorScheme: 'dark', // Start with dark mode for contrast testing

    /* Reduced motion for accessibility testing */
    reducedMotion: 'no-preference', // Test both states

    /* Extra HTTP headers for testing */
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  /* Configure projects for major browsers and accessibility scenarios */
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        // Enhanced viewport for desktop accessibility testing
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'chromium-high-contrast',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        colorScheme: 'dark',
        forcedColors: 'active', // Simulate Windows high contrast mode
      },
    },

    {
      name: 'chromium-reduced-motion',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        reducedMotion: 'reduce',
      },
    },

    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    /* Mobile testing for responsive accessibility */
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },

    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
    },

    /* Tablet testing */
    {
      name: 'tablet-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
        deviceScaleFactor: 2,
      },
    },

    /* Large screen testing for accessibility */
    {
      name: 'large-screen',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 2560, height: 1440 },
        deviceScaleFactor: 2,
      },
    },

    /* Screen reader simulation (using Chrome with extensions) */
    {
      name: 'screen-reader-simulation',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Additional context for screen reader testing
        extraHTTPHeaders: {
          'User-Agent': 'Mozilla/5.0 (compatible; ScreenReader/1.0)',
        },
      },
    },

    /* Color blindness testing scenarios */
    {
      name: 'colorblind-protanopia',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Custom CSS will be injected to simulate color blindness
      },
    },

    {
      name: 'colorblind-deuteranopia',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    /* Low vision simulation */
    {
      name: 'low-vision-zoom',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 3, // Simulate 300% zoom
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  /* Global setup for accessibility testing */
  globalSetup: require.resolve('./tests/accessibility/global-setup.ts'),

  /* Global teardown */
  globalTeardown: require.resolve('./tests/accessibility/global-teardown.ts'),

  /* Test match patterns */
  testMatch: [
    '**/tests/accessibility/**/*.spec.ts',
    '**/tests/accessibility/**/*.test.ts',
  ],

  /* Ignore patterns */
  testIgnore: [
    '**/node_modules/**',
    '**/test-results/**',
    '**/coverage/**',
  ],

  /* Output directory */
  outputDir: './test-results/accessibility-artifacts',

  /* Expect configuration */
  expect: {
    /* Maximum time expect() should wait for the condition to be met */
    timeout: 10 * 1000,

    /* Threshold for screenshot comparisons */
    threshold: 0.2,

    /* Animation handling for visual testing */
    animations: 'disabled',
  },

  /* Test metadata */
  metadata: {
    testSuite: 'Accessibility Testing Suite',
    wcagLevel: 'AA',
    framework: 'Playwright + axe-core',
    version: '1.0.0',
  },
});