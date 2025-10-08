/**
 * Lighthouse Configuration for Wasteland Tarot
 * Pip-Boy performance standards for Vault-Tec compliance
 */

module.exports = {
  ci: {
    collect: {
      // URL patterns to test
      url: [
        'http://localhost:3000',
        'http://localhost:3000/auth/login',
        'http://localhost:3000/auth/register',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/reading/new',
        'http://localhost:3000/readings/quick'
      ],

      // Lighthouse settings optimized for Pip-Boy interface
      settings: {
        chromeFlags: [
          '--headless',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--allow-running-insecure-content'
        ],

        // Simulated Pip-Boy device conditions
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1280,
          height: 720,
          deviceScaleFactor: 1,
          disabled: false
        },

        // Wasteland network conditions
        throttling: {
          rttMs: 150, // Vault-Tec satellite delay
          throughputKbps: 1600, // Post-apocalyptic bandwidth
          cpuSlowdownMultiplier: 2, // Radiation-affected CPU
          requestLatencyMs: 0,
          downloadThroughputKbps: 1600,
          uploadThroughputKbps: 750
        },

        // Pip-Boy specific audits
        onlyAudits: [
          'first-contentful-paint',
          'largest-contentful-paint',
          'cumulative-layout-shift',
          'first-input-delay',
          'total-blocking-time',
          'speed-index',
          'interactive',
          'color-contrast',
          'aria-valid-attr',
          'button-name',
          'document-title',
          'html-has-lang',
          'image-alt',
          'label',
          'link-name',
          'meta-description',
          'meta-viewport'
        ]
      },

      // Number of runs for consistency
      numberOfRuns: 3
    },

    assert: {
      // Pip-Boy performance standards
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],

        // Core Web Vitals for Vault dwellers (任務 17.1 標準)
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }], // FCP < 1.5s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // LCP < 2.5s
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // CLS < 0.1
        'first-input-delay': ['error', { maxNumericValue: 100 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 4000 }],
        'interactive': ['error', { maxNumericValue: 3500 }], // TTI < 3.5s

        // Accessibility requirements for Vault interface
        'color-contrast': 'error',
        'aria-valid-attr': 'error',
        'button-name': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error'
      }
    },

    upload: {
      // Store results in Vault archives
      target: 'temporary-public-storage',

      // Custom build context for Fallout theme
      buildContext: {
        commitSha: process.env.GITHUB_SHA,
        branch: process.env.GITHUB_REF_NAME,
        commitMessage: process.env.GITHUB_EVENT_HEAD_COMMIT_MESSAGE,
        author: process.env.GITHUB_ACTOR,
        avatarUrl: `https://github.com/${process.env.GITHUB_ACTOR}.png`,
        externalBuildUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      }
    },

    server: {
      // Local server configuration
      port: 9001,
      storage: './lighthouse-reports'
    }
  },

  // Custom Fallout-themed reporting
  extends: 'lighthouse:default',

  settings: {
    // Additional settings for Wasteland testing
    emulatedUserAgent: 'Pip-Boy 3000 MkIV Lighthouse Agent',

    // Budget for Vault-Tec resources
    budgets: [
      {
        path: '/*',
        timings: [
          { metric: 'first-contentful-paint', budget: 2000 },
          { metric: 'largest-contentful-paint', budget: 3000 },
          { metric: 'cumulative-layout-shift', budget: 100 },
          { metric: 'first-input-delay', budget: 100 }
        ],
        resourceSizes: [
          { resourceType: 'document', budget: 50 },
          { resourceType: 'script', budget: 250 },
          { resourceType: 'stylesheet', budget: 50 },
          { resourceType: 'image', budget: 500 },
          { resourceType: 'font', budget: 100 },
          { resourceType: 'other', budget: 100 },
          { resourceType: 'total', budget: 1000 }
        ],
        resourceCounts: [
          { resourceType: 'document', budget: 1 },
          { resourceType: 'script', budget: 10 },
          { resourceType: 'stylesheet', budget: 5 },
          { resourceType: 'image', budget: 20 },
          { resourceType: 'font', budget: 3 },
          { resourceType: 'other', budget: 10 },
          { resourceType: 'total', budget: 50 }
        ]
      }
    ]
  }
}