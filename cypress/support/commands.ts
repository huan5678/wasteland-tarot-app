/**
 * Cypress Custom Commands for Wasteland Tarot
 * Fallout-themed testing utilities and helpers
 */

/// <reference types="cypress" />

// Authentication Commands
Cypress.Commands.add('loginAsVaultDweller', (username = 'vault_dweller', password = 'password123!') => {
  cy.logWastelandAction(`Logging in as ${username}`)

  cy.visit('/auth/login')
  cy.get('[data-testid="username-input"]').type(username)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="login-button"]').click()

  // Wait for Pip-Boy authentication
  cy.waitForPipBoyAnimation()
  cy.url().should('include', '/dashboard')

  cy.logPipBoyStatus('Authentication successful')
})

Cypress.Commands.add('registerNewVaultDweller', (userData = {}) => {
  const defaultData = {
    username: `vault_dweller_${Date.now()}`,
    email: `dweller${Date.now()}@vault111.gov`,
    password: 'StrongPass123!',
    displayName: 'New Vault Dweller',
    factionAlignment: 'BROTHERHOOD_OF_STEEL',
    vaultNumber: '111',
    wastelandLocation: 'Commonwealth'
  }

  const data = { ...defaultData, ...userData }

  cy.logWastelandAction(`Registering new vault dweller: ${data.username}`)

  cy.visit('/auth/register')

  // Fill registration form
  cy.get('[data-testid="username-input"]').type(data.username)
  cy.get('[data-testid="email-input"]').type(data.email)
  cy.get('[data-testid="password-input"]').type(data.password)
  cy.get('[data-testid="confirm-password-input"]').type(data.password)
  cy.get('[data-testid="display-name-input"]').type(data.displayName)
  cy.get('[data-testid="faction-select"]').select(data.factionAlignment)
  cy.get('[data-testid="vault-number-input"]').type(data.vaultNumber)
  cy.get('[data-testid="location-input"]').type(data.wastelandLocation)

  // Accept terms
  cy.get('[data-testid="terms-checkbox"]').check()

  // Submit registration
  cy.get('[data-testid="register-button"]').click()

  cy.waitForPipBoyAnimation()
  cy.logPipBoyStatus('Registration completed')

  return cy.wrap(data)
})

Cypress.Commands.add('logout', () => {
  cy.logWastelandAction('Logging out of Pip-Boy')

  cy.get('[data-testid="user-menu"]').click()
  cy.get('[data-testid="logout-button"]').click()

  cy.waitForPipBoyAnimation()
  cy.url().should('include', '/auth/login')

  cy.logPipBoyStatus('Logout successful')
})

// Tarot Card Commands
Cypress.Commands.add('drawWastelandCards', (numCards = 1, radiationFactor = 0.5) => {
  cy.logWastelandAction(`Drawing ${numCards} cards with radiation factor ${radiationFactor}`)

  cy.get('[data-testid="card-draw-button"]').click()

  // Set number of cards
  if (numCards > 1) {
    cy.get('[data-testid="card-count-input"]').clear().type(numCards.toString())
  }

  // Set radiation factor
  cy.get('[data-testid="radiation-slider"]').invoke('val', radiationFactor).trigger('input')

  // Execute draw
  cy.get('[data-testid="execute-draw-button"]').click()

  // Wait for vault door animation and card reveal
  cy.waitForVaultDoor()
  cy.get('[data-testid="drawn-cards"]').should('be.visible')

  cy.logRadiationLevel(radiationFactor)
  cy.logPipBoyStatus(`${numCards} cards drawn successfully`)
})

Cypress.Commands.add('selectCardSpread', (spreadType = 'single_card') => {
  cy.logWastelandAction(`Selecting ${spreadType} spread`)

  cy.get('[data-testid="spread-selector"]').click()
  cy.get(`[data-testid="spread-${spreadType}"]`).click()

  cy.logPipBoyStatus(`${spreadType} spread selected`)
})

Cypress.Commands.add('flipCard', (cardIndex = 0) => {
  cy.logWastelandAction(`Flipping card at index ${cardIndex}`)

  cy.get(`[data-testid="card-${cardIndex}"]`).click()
  cy.get(`[data-testid="card-${cardIndex}"]`).should('have.class', 'flipped')

  cy.logPipBoyStatus('Card flipped successfully')
})

// Character Voice Commands
Cypress.Commands.add('setCharacterVoice', (voice = 'PIP_BOY') => {
  cy.logWastelandAction(`Setting character voice to ${voice}`)

  cy.get('[data-testid="character-voice-selector"]').click()
  cy.get(`[data-testid="voice-${voice}"]`).click()

  cy.logPipBoyStatus(`Character voice set to ${voice}`)
})

Cypress.Commands.add('getInterpretation', () => {
  cy.logWastelandAction('Requesting card interpretation')

  cy.get('[data-testid="get-interpretation-button"]').click()
  cy.waitForPipBoyAnimation()

  cy.get('[data-testid="card-interpretation"]').should('be.visible')
  cy.logPipBoyStatus('Interpretation received')
})

// Pip-Boy Interface Commands
Cypress.Commands.add('openPipBoyMenu', (section = 'STATS') => {
  cy.logWastelandAction(`Opening Pip-Boy ${section} section`)

  cy.get('[data-testid="pip-boy-interface"]').should('be.visible')
  cy.get(`[data-testid="pip-boy-${section.toLowerCase()}"]`).click()

  cy.waitForPipBoyAnimation()
  cy.logPipBoyStatus(`${section} section opened`)
})

Cypress.Commands.add('navigatePipBoyTabs', (tab = 'READINGS') => {
  cy.logWastelandAction(`Navigating to ${tab} tab`)

  cy.get(`[data-testid="tab-${tab.toLowerCase()}"]`).click()
  cy.get(`[data-testid="${tab.toLowerCase()}-content"]`).should('be.visible')

  cy.logPipBoyStatus(`Navigated to ${tab} tab`)
})

Cypress.Commands.add('addPipBoyStyles', () => {
  cy.get('head').invoke('append', `
    <style>
      .pip-boy-test {
        color: #00FF41 !important;
        background-color: #1a1a1a !important;
        font-family: 'Share Tech Mono', monospace !important;
      }
      .radiation-test {
        animation: radiation-pulse 2s infinite !important;
        box-shadow: 0 0 20px #ff6b35 !important;
      }
      .vault-door-test {
        transform: rotateY(90deg) !important;
        transition: transform 2s ease-in-out !important;
      }
    </style>
  `)
})

// Reading Management Commands
Cypress.Commands.add('createNewReading', (question = 'What does my future hold?') => {
  cy.logWastelandAction('Creating new tarot reading')

  cy.get('[data-testid="new-reading-button"]').click()
  cy.get('[data-testid="question-input"]').type(question)
  cy.get('[data-testid="create-reading-button"]').click()

  cy.waitForPipBoyAnimation()
  cy.logPipBoyStatus('New reading created')
})

Cypress.Commands.add('saveReading', () => {
  cy.logWastelandAction('Saving reading to Vault archives')

  cy.get('[data-testid="save-reading-button"]').click()
  cy.waitForPipBoyAnimation()

  cy.get('[data-testid="save-success-message"]').should('be.visible')
  cy.logPipBoyStatus('Reading saved successfully')
})

Cypress.Commands.add('shareReading', () => {
  cy.logWastelandAction('Sharing reading with other vault dwellers')

  cy.get('[data-testid="share-reading-button"]').click()
  cy.get('[data-testid="share-url"]').should('be.visible')

  cy.logPipBoyStatus('Reading shared successfully')
})

// Karma and Faction Commands
Cypress.Commands.add('checkKarmaLevel', () => {
  cy.get('[data-testid="karma-indicator"]')
    .should('be.visible')
    .then((karma) => {
      const karmaText = karma.text()
      cy.logPipBoyStatus(`Current karma: ${karmaText}`)
    })
})

Cypress.Commands.add('switchFaction', (newFaction = 'NCR') => {
  cy.logWastelandAction(`Switching faction to ${newFaction}`)

  cy.get('[data-testid="faction-selector"]').click()
  cy.get(`[data-testid="faction-${newFaction}"]`).click()

  cy.get('[data-testid="confirm-faction-change"]').click()
  cy.waitForPipBoyAnimation()

  cy.logPipBoyStatus(`Faction changed to ${newFaction}`)
})

// Accessibility Testing Commands
Cypress.Commands.add('checkVaultAccessibility', () => {
  cy.logWastelandAction('Checking Vault accessibility compliance')

  cy.injectAxe()
  cy.checkA11y(null, {
    includedImpacts: ['critical', 'serious']
  })

  cy.logPipBoyStatus('Accessibility check completed')
})

Cypress.Commands.add('testKeyboardNavigation', () => {
  cy.logWastelandAction('Testing keyboard navigation')

  cy.get('body').tab()
  cy.focused().should('have.attr', 'tabindex', '0')

  // Test common keyboard shortcuts
  cy.get('body').type('{esc}') // Close modals
  cy.get('body').type(' ') // Activate buttons
  cy.get('body').type('{enter}') // Submit forms

  cy.logPipBoyStatus('Keyboard navigation tested')
})

// Performance Testing Commands
Cypress.Commands.add('measureCardLoadTime', () => {
  cy.logWastelandAction('Measuring card loading performance')

  const startTime = performance.now()

  cy.get('[data-testid="card-loader"]').should('not.exist')
  cy.get('[data-testid="wasteland-card"]').should('be.visible')

  const endTime = performance.now()
  const loadTime = endTime - startTime

  cy.task('log', `⚡ Card load time: ${loadTime}ms`)
  expect(loadTime).to.be.lessThan(2000) // Should load within 2 seconds

  cy.logPipBoyStatus('Card performance measured')
})

// Visual Testing Commands
Cypress.Commands.add('compareVaultInterface', (name: string) => {
  cy.logWastelandAction(`Taking visual snapshot: ${name}`)

  cy.percySnapshot(`vault-interface-${name}`, {
    widths: [1280, 768, 375],
    scope: '[data-testid="vault-interface"]'
  })

  cy.logPipBoyStatus('Visual snapshot captured')
})

// Error Handling Commands
Cypress.Commands.add('handleRadiationError', () => {
  cy.get('[data-testid="radiation-error"]').then(($error) => {
    if ($error.is(':visible')) {
      cy.logWastelandAction('Handling radiation contamination error')
      cy.get('[data-testid="decontaminate-button"]').click()
      cy.waitForPipBoyAnimation()
      cy.logPipBoyStatus('Decontamination complete')
    }
  })
})

Cypress.Commands.add('handleVaultMalfunction', () => {
  cy.get('[data-testid="vault-error"]').then(($error) => {
    if ($error.is(':visible')) {
      cy.logWastelandAction('Handling Vault-Tec system malfunction')
      cy.get('[data-testid="system-repair-button"]').click()
      cy.waitForPipBoyAnimation()
      cy.logPipBoyStatus('System repair complete')
    }
  })
})

// Data Management Commands
Cypress.Commands.add('clearVaultStorage', () => {
  cy.logWastelandAction('Clearing Vault storage systems')

  cy.clearLocalStorage()
  cy.clearCookies()
  cy.clearSessionStorage()

  cy.logPipBoyStatus('Vault storage cleared')
})

Cypress.Commands.add('seedTestData', () => {
  cy.logWastelandAction('Seeding test data for Vault experiments')

  cy.fixture('test-cards.json').then((cards) => {
    cy.window().then((win) => {
      win.localStorage.setItem('test-cards', JSON.stringify(cards))
    })
  })

  cy.fixture('test-users.json').then((users) => {
    cy.window().then((win) => {
      win.localStorage.setItem('test-users', JSON.stringify(users))
    })
  })

  cy.logPipBoyStatus('Test data seeded successfully')
})