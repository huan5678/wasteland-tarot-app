/**
 * Cypress Configuration for Wasteland Tarot E2E Tests
 * Fallout-themed end-to-end testing setup
 */

import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // Base URL for the application
    baseUrl: 'http://localhost:3000',

    // Test files pattern
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',

    // Support file
    supportFile: 'cypress/support/e2e.ts',

    // Screenshots and videos
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',

    // Viewport settings for Pip-Boy interface
    viewportWidth: 1280,
    viewportHeight: 720,

    // Timeouts adjusted for Fallout animations
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 15000,
    responseTimeout: 15000,

    // Retry configuration for flaky tests
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // Video compression for CI
    video: true,
    videoCompression: 32,

    // Screenshots on failure
    screenshotOnRunFailure: true,

    // Setup node events
    setupNodeEvents(on, config) {
      // Basic tasks
      on('task', {
        log(message) {
          console.log(message)
          return null
        },
        table(message) {
          console.table(message)
          return null
        }
      })

      return config
    },

    // Environment variables
    env: {
      // API configuration
      API_URL: 'http://localhost:8000',

      // Fallout-specific test data
      TEST_VAULT_NUMBER: '111',
      TEST_FACTION: 'BROTHERHOOD_OF_STEEL',
      TEST_RADIATION_LEVEL: '0.3',

      // Feature flags
      ENABLE_SOUND_EFFECTS: true,
      ENABLE_ANIMATIONS: true,
      ENABLE_RADIATION_EFFECTS: true,

      // Coverage
      CODE_COVERAGE: true
    },

    // Exclude files from test runner
    excludeSpecPattern: [
      '**/__snapshots__/*',
      '**/__image_snapshots__/*'
    ],
  },

  component: {
    // Component testing configuration
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },
})