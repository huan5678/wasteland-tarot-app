/**
 * Cypress E2E Support File
 * Fallout-themed custom commands and utilities
 */

// Core Cypress commands
import './commands'

// Percy visual testing
import '@percy/cypress'

// Accessibility testing
import 'cypress-axe'

// Custom Cypress commands for Wasteland Tarot

// Import custom types
import './types'

// Fallout-themed before hooks
beforeEach(() => {
  // Initialize Pip-Boy interface
  cy.task('log', '🎮 Initializing Pip-Boy interface...')

  // Set up intercepts for API calls
  cy.intercept('GET', '/api/**', { fixture: 'api-responses.json' }).as('apiCall')

  // Mock audio context for sound effects
  cy.window().then((win) => {
    win.AudioContext = win.AudioContext || win.webkitAudioContext
    if (!win.AudioContext) {
      // Mock AudioContext for headless testing
      win.AudioContext = class MockAudioContext {
        createOscillator() {
          return {
            connect: cy.stub(),
            start: cy.stub(),
            stop: cy.stub(),
            frequency: { value: 0 }
          }
        }
        createGain() {
          return {
            connect: cy.stub(),
            gain: { value: 0 }
          }
        }
        destination = {}
      }
    }
  })

  // Set default radiation level
  cy.task('setRadiationLevel', Cypress.env('TEST_RADIATION_LEVEL'))

  // Ensure consistent viewport for Pip-Boy interface
  cy.viewport(1280, 720)

  // Add CSS for Pip-Boy theme testing
  cy.addPipBoyStyles()
})

// After each test
afterEach(() => {
  // Clean up any persistent state
  cy.clearLocalStorage()
  cy.clearCookies()

  // Log test completion
  cy.task('log', '✅ Test completed - Pip-Boy interface cleaned')
})

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Don't fail tests on uncaught exceptions from third-party libraries
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }

  // Log Fallout-themed error
  cy.task('log', `💥 Wasteland error detected: ${err.message}`)

  return true
})

// Custom assertions for Fallout theme
chai.use((chai, utils) => {
  chai.Assertion.addMethod('havePipBoyStyle', function () {
    const obj = this._obj

    this.assert(
      obj.hasClass('text-pip-boy-green') ||
      obj.hasClass('bg-vault-dark') ||
      obj.hasClass('font-mono'),
      'expected #{this} to have Pip-Boy styling',
      'expected #{this} not to have Pip-Boy styling'
    )
  })

  chai.Assertion.addMethod('haveRadiationEffect', function () {
    const obj = this._obj

    this.assert(
      obj.hasClass('animate-radiation-pulse') ||
      obj.hasClass('glow-radiation') ||
      obj.hasClass('radiation-warning'),
      'expected #{this} to have radiation effects',
      'expected #{this} not to have radiation effects'
    )
  })

  chai.Assertion.addMethod('beAccessibleInVault', function () {
    const obj = this._obj

    const hasAria = obj.attr('aria-label') ||
                   obj.attr('role') ||
                   obj.attr('tabindex')

    this.assert(
      hasAria,
      'expected #{this} to be accessible in Vault interface',
      'expected #{this} not to be accessible in Vault interface'
    )
  })
})

// Add viewport presets for different devices
Cypress.Commands.add('setVaultTerminal', () => {
  cy.viewport(800, 600) // Vault terminal
})

Cypress.Commands.add('setPipBoyPortable', () => {
  cy.viewport(375, 667) // Pip-Boy portable device
})

Cypress.Commands.add('setVaultMainframe', () => {
  cy.viewport(1920, 1080) // Vault mainframe
})

// Logging utilities with Fallout theme
Cypress.Commands.add('logWastelandAction', (action: string) => {
  cy.task('log', `🏜️ Wasteland Action: ${action}`)
})

Cypress.Commands.add('logPipBoyStatus', (status: string) => {
  cy.task('log', `📟 Pip-Boy Status: ${status}`)
})

Cypress.Commands.add('logRadiationLevel', (level: number) => {
  cy.task('log', `☢️ Radiation Level: ${level}`)
})

// Performance monitoring
Cypress.Commands.add('measurePipBoyPerformance', () => {
  cy.window().then((win) => {
    const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const loadTime = navigation.loadEventEnd - navigation.loadEventStart

    cy.task('log', `⚡ Pip-Boy Load Time: ${loadTime}ms`)

    // Fail if load time is too slow (Pip-Boy should be responsive)
    expect(loadTime).to.be.lessThan(3000)
  })
})

// Screenshot utilities with Fallout naming
Cypress.Commands.add('screenshotVault', (name: string) => {
  cy.screenshot(`vault-${name}`, {
    capture: 'viewport',
    overwrite: true
  })
})

Cypress.Commands.add('screenshotPipBoy', (name: string) => {
  cy.screenshot(`pipboy-${name}`, {
    capture: 'viewport',
    overwrite: true
  })
})

// Wait for Pip-Boy animations
Cypress.Commands.add('waitForPipBoyAnimation', () => {
  // Wait for common Pip-Boy animations
  cy.wait(1000) // Scanline effects
  cy.get('[data-testid="pip-boy-loader"]', { timeout: 10000 }).should('not.exist')
})

// Wait for vault door animations
Cypress.Commands.add('waitForVaultDoor', () => {
  cy.get('[data-testid="vault-door"]', { timeout: 15000 }).should('have.class', 'open')
})

// Custom network conditions for wasteland
Cypress.Commands.add('simulateWastelandConnection', () => {
  // Simulate poor network conditions in the wasteland
  cy.intercept('**', (req) => {
    req.reply((res) => {
      res.delay(Math.random() * 1000 + 500) // 500-1500ms delay
    })
  })
})

// Mock Geiger counter
Cypress.Commands.add('mockGeigerCounter', (level: number) => {
  cy.window().then((win) => {
    win.localStorage.setItem('radiation-level', level.toString())
    cy.task('setRadiationLevel', level)
  })
})

// Console command overrides for cleaner logs
const origLog = Cypress.log
Cypress.log = function (opts) {
  if (opts.displayName === 'log' && opts.message && opts.message.includes('Pip-Boy')) {
    opts.displayName = '📟'
  }
  if (opts.displayName === 'task' && opts.message && opts.message.includes('radiation')) {
    opts.displayName = '☢️'
  }
  return origLog(opts)
}