/**
 * Wasteland Tarot Core Flow E2E Tests
 * Complete user journey from registration to tarot reading
 */

describe('Wasteland Tarot - Core User Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.visit('/')
  })

  describe('Vault Dweller Registration Journey', () => {
    it('should complete full registration and first reading flow', () => {
      // Starting complete vault dweller journey

      // Step 1: Registration
      cy.visit('/auth/register')
      cy.screenshotVault('registration-page')

      cy.registerNewVaultDweller({
        username: 'test_survivor',
        email: 'survivor@vault111.gov',
        factionAlignment: 'BROTHERHOOD_OF_STEEL'
      }).then((userData) => {
        cy.logPipBoyStatus(`Registered: ${userData.username}`)

        // Step 2: Email verification simulation
        cy.visit('/auth/verify-email?token=test-token')
        cy.get('[data-testid="verification-success"]').should('be.visible')
        cy.screenshotPipBoy('email-verified')

        // Step 3: First login
        cy.visit('/auth/login')
        cy.loginAsVaultDweller(userData.username, userData.password)

        // Step 4: Dashboard welcome
        cy.get('[data-testid="welcome-vault-dweller"]').should('contain', userData.displayName)
        cy.get('[data-testid="first-time-tutorial"]').should('be.visible')
        cy.screenshotVault('dashboard-welcome')

        // Step 5: Complete onboarding
        cy.get('[data-testid="start-tutorial"]').click()
        cy.waitForPipBoyAnimation()

        // Tutorial: Pip-Boy interface explanation
        cy.get('[data-testid="tutorial-pip-boy"]').should('be.visible')
        cy.get('[data-testid="tutorial-next"]').click()

        // Tutorial: Faction and karma explanation
        cy.get('[data-testid="tutorial-faction"]').should('be.visible')
        cy.get('[data-testid="tutorial-next"]').click()

        // Tutorial: Tarot cards introduction
        cy.get('[data-testid="tutorial-cards"]').should('be.visible')
        cy.get('[data-testid="tutorial-finish"]').click()

        cy.screenshotPipBoy('tutorial-completed')

        // Step 6: First reading creation
        cy.createNewReading('What does my journey in the wasteland hold?')

        // Select character voice
        cy.setCharacterVoice('PIP_BOY')

        // Choose three-card spread
        cy.selectCardSpread('three_card')
        cy.screenshotVault('spread-selected')

        // Draw cards with moderate radiation
        cy.drawWastelandCards(3, 0.4)
        cy.screenshotVault('cards-drawn')

        // Verify cards are displayed
        cy.get('[data-testid="drawn-cards"]').should('have.length', 3)
        cy.get('[data-testid="card-0"]').should('be.visible')
        cy.get('[data-testid="card-1"]').should('be.visible')
        cy.get('[data-testid="card-2"]').should('be.visible')

        // Flip each card
        cy.flipCard(0) // Past
        cy.flipCard(1) // Present
        cy.flipCard(2) // Future

        cy.screenshotVault('all-cards-flipped')

        // Get interpretation
        cy.getInterpretation()

        // Verify interpretation content
        cy.get('[data-testid="interpretation-overall"]').should('be.visible')
        cy.get('[data-testid="interpretation-cards"]').should('have.length', 3)
        cy.get('[data-testid="interpretation-summary"]').should('be.visible')

        cy.screenshotPipBoy('interpretation-received')

        // Save the reading
        cy.saveReading()

        // Check karma was updated
        cy.checkKarmaLevel()
        cy.get('[data-testid="karma-indicator"]').should('contain.text', '25') // First reading bonus

        cy.screenshotVault('first-reading-complete')

        cy.logPipBoyStatus('First vault dweller journey completed successfully')
      })
    })
  })

  describe('Returning Vault Dweller Experience', () => {
    beforeEach(() => {
      // Login as existing user
      cy.loginAsVaultDweller('vault_dweller', 'password123!')
    })

    it('should access reading history and create new reading', () => {
      cy.logWastelandAction('Testing returning vault dweller experience')

      // Navigate to reading history
      cy.navigatePipBoyTabs('READINGS')

      // Verify previous readings exist
      cy.get('[data-testid="reading-history"]').should('be.visible')
      cy.get('[data-testid="reading-item"]').should('have.length.greaterThan', 0)

      cy.screenshotVault('reading-history')

      // View a previous reading
      cy.get('[data-testid="reading-item"]').first().click()
      cy.get('[data-testid="reading-details"]').should('be.visible')

      cy.screenshotPipBoy('reading-details')

      // Create a new reading with different settings
      cy.get('[data-testid="new-reading-button"]').click()

      // Try single card reading
      cy.createNewReading('Should I trust the mysterious stranger?')
      cy.setCharacterVoice('GHOUL')
      cy.selectCardSpread('single_card')

      // Draw with higher radiation for variety
      cy.drawWastelandCards(1, 0.7)

      // Check for radiation warning
      cy.get('[data-testid="radiation-warning"]').should('be.visible')
      cy.screenshotVault('high-radiation-warning')

      // Continue with reading despite radiation
      cy.get('[data-testid="continue-despite-radiation"]').click()

      cy.flipCard(0)
      cy.getInterpretation()

      // Verify ghoul interpretation style
      cy.get('[data-testid="character-voice-indicator"]').should('contain', 'GHOUL')
      cy.get('[data-testid="interpretation-text"]').should('contain.text', 'smoothskin')

      cy.screenshotPipBoy('ghoul-interpretation')

      // Share this reading
      cy.shareReading()
      cy.get('[data-testid="share-url"]').should('be.visible')

      cy.logPipBoyStatus('Returning user experience tested successfully')
    })
  })

  describe('Advanced Features Testing', () => {
    beforeEach(() => {
      cy.loginAsVaultDweller('vault_dweller', 'password123!')
    })

    it('should test faction change and karma impact', () => {
      cy.logWastelandAction('Testing faction and karma mechanics')

      // Check initial faction
      cy.get('[data-testid="faction-badge"]').should('contain', 'BROTHERHOOD_OF_STEEL')

      // Change faction
      cy.switchFaction('NCR')

      // Verify faction change warning
      cy.get('[data-testid="faction-change-warning"]').should('be.visible')
      cy.get('[data-testid="confirm-faction-change"]').click()

      cy.screenshotVault('faction-changed')

      // Create reading as NCR member
      cy.createNewReading('How can I help the NCR expand?')
      cy.setCharacterVoice('NCR_RANGER')
      cy.selectCardSpread('five_card')

      cy.drawWastelandCards(5, 0.2)

      // Verify faction affects interpretation
      cy.get('[data-testid="card-0"]').click()
      cy.getInterpretation()

      cy.get('[data-testid="interpretation-text"]').should('contain.text', 'NCR')
      cy.screenshotPipBoy('ncr-interpretation')

      cy.logPipBoyStatus('Faction and karma mechanics tested')
    })

    it('should test accessibility features', () => {
      cy.logWastelandAction('Testing vault accessibility compliance')

      // Check overall accessibility
      cy.checkVaultAccessibility()

      // Test keyboard navigation
      cy.testKeyboardNavigation()

      // Test screen reader compatibility
      cy.get('[data-testid="pip-boy-interface"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="main-content"]').should('have.attr', 'role', 'main')

      // Test high contrast mode
      cy.get('[data-testid="accessibility-menu"]').click()
      cy.get('[data-testid="high-contrast-toggle"]').click()

      cy.screenshotVault('high-contrast-mode')

      // Test screen reader announcements
      cy.createNewReading('Test accessibility')
      cy.drawWastelandCards(1)

      cy.get('[data-testid="screen-reader-announcement"]')
        .should('contain.text', 'Card drawn successfully')

      cy.logPipBoyStatus('Accessibility features verified')
    })
  })

  describe('Performance and Error Handling', () => {
    beforeEach(() => {
      cy.loginAsVaultDweller('vault_dweller', 'password123!')
    })

    it('should handle network issues gracefully', () => {
      cy.logWastelandAction('Testing wasteland network conditions')

      // Simulate poor network conditions
      cy.simulateWastelandConnection()

      // Test slow loading
      cy.createNewReading('Test network resilience')
      cy.drawWastelandCards(1)

      // Verify loading states
      cy.get('[data-testid="pip-boy-loader"]').should('be.visible')
      cy.waitForPipBoyAnimation()

      cy.screenshotVault('slow-network-loading')

      // Test offline mode
      cy.intercept('**', { forceNetworkError: true }).as('networkError')

      cy.get('[data-testid="new-reading-button"]').click()

      // Verify offline message
      cy.get('[data-testid="offline-message"]').should('be.visible')
      cy.get('[data-testid="offline-message"]').should('contain', 'Connection to Vault-Tec servers lost')

      cy.screenshotVault('offline-mode')

      cy.logPipBoyStatus('Network resilience tested')
    })

    it('should handle radiation contamination errors', () => {
      cy.logWastelandAction('Testing radiation contamination handling')

      // Set very high radiation level
      cy.mockGeigerCounter(0.95)

      cy.createNewReading('Test high radiation')

      // Attempt to draw cards in high radiation
      cy.drawWastelandCards(3, 0.95)

      // Should trigger radiation error
      cy.handleRadiationError()

      cy.screenshotVault('radiation-contamination')

      // Test decontamination process
      cy.get('[data-testid="decontamination-protocol"]').should('be.visible')
      cy.get('[data-testid="start-decontamination"]').click()

      cy.waitForPipBoyAnimation()

      // Verify clean state
      cy.get('[data-testid="radiation-level"]').should('contain', 'CLEAN')

      cy.logPipBoyStatus('Radiation contamination handled successfully')
    })
  })

  describe('Visual Regression Testing', () => {
    beforeEach(() => {
      cy.loginAsVaultDweller('vault_dweller', 'password123!')
    })

    it('should maintain consistent Pip-Boy interface styling', () => {
      cy.logWastelandAction('Running visual regression tests')

      // Test main dashboard
      cy.compareVaultInterface('dashboard')

      // Test card drawing interface
      cy.createNewReading('Visual test reading')
      cy.compareVaultInterface('card-drawing')

      // Test different screen sizes
      cy.setVaultTerminal()
      cy.compareVaultInterface('terminal-view')

      cy.setPipBoyPortable()
      cy.compareVaultInterface('portable-view')

      cy.setVaultMainframe()
      cy.compareVaultInterface('mainframe-view')

      // Test dark/light theme variations
      cy.get('[data-testid="theme-toggle"]').click()
      cy.compareVaultInterface('light-theme')

      cy.logPipBoyStatus('Visual regression testing completed')
    })
  })

  after(() => {
    cy.logWastelandAction('Wasteland Tarot E2E testing completed')
    cy.measurePipBoyPerformance()
    cy.clearVaultStorage()
  })
})