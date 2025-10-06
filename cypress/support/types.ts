/**
 * Cypress Custom Command Type Definitions
 * Fallout-themed command types for TypeScript support
 */

declare namespace Cypress {
  interface Chainable {
    // Authentication Commands
    loginAsVaultDweller(username?: string, password?: string): Chainable<void>
    registerNewVaultDweller(userData?: Partial<UserRegistrationData>): Chainable<UserRegistrationData>
    logout(): Chainable<void>

    // Tarot Card Commands
    drawWastelandCards(numCards?: number, radiationFactor?: number): Chainable<void>
    selectCardSpread(spreadType?: string): Chainable<void>
    flipCard(cardIndex?: number): Chainable<void>

    // Character Voice Commands
    setCharacterVoice(voice?: CharacterVoice): Chainable<void>
    getInterpretation(): Chainable<void>

    // Pip-Boy Interface Commands
    openPipBoyMenu(section?: PipBoySection): Chainable<void>
    navigatePipBoyTabs(tab?: string): Chainable<void>
    addPipBoyStyles(): Chainable<void>

    // Reading Management Commands
    createNewReading(question?: string): Chainable<void>
    saveReading(): Chainable<void>
    shareReading(): Chainable<void>

    // Karma and Faction Commands
    checkKarmaLevel(): Chainable<void>
    switchFaction(newFaction?: FactionAlignment): Chainable<void>

    // Accessibility Testing Commands
    checkVaultAccessibility(): Chainable<void>
    testKeyboardNavigation(): Chainable<void>

    // Performance Testing Commands
    measureCardLoadTime(): Chainable<void>
    measurePipBoyPerformance(): Chainable<void>

    // Visual Testing Commands
    compareVaultInterface(name: string): Chainable<void>
    screenshotVault(name: string): Chainable<void>
    screenshotPipBoy(name: string): Chainable<void>

    // Animation and Timing Commands
    waitForPipBoyAnimation(): Chainable<void>
    waitForVaultDoor(): Chainable<void>

    // Network and Simulation Commands
    simulateWastelandConnection(): Chainable<void>
    mockGeigerCounter(level: number): Chainable<void>

    // Viewport Commands
    setVaultTerminal(): Chainable<void>
    setPipBoyPortable(): Chainable<void>
    setVaultMainframe(): Chainable<void>

    // Logging Commands
    logWastelandAction(action: string): Chainable<void>
    logPipBoyStatus(status: string): Chainable<void>
    logRadiationLevel(level: number): Chainable<void>

    // Error Handling Commands
    handleRadiationError(): Chainable<void>
    handleVaultMalfunction(): Chainable<void>

    // Data Management Commands
    clearVaultStorage(): Chainable<void>
    seedTestData(): Chainable<void>

    // Custom Assertions
    havePipBoyStyle(): Chainable<void>
    haveRadiationEffect(): Chainable<void>
    beAccessibleInVault(): Chainable<void>
  }
}

// Fallout-specific type definitions
interface UserRegistrationData {
  username: string
  email: string
  password: string
  displayName: string
  factionAlignment: FactionAlignment
  vaultNumber: string
  wastelandLocation: string
}

type CharacterVoice =
  | 'PIP_BOY'
  | 'SUPER_MUTANT'
  | 'GHOUL'
  | 'RAIDER'
  | 'BROTHERHOOD_SCRIBE'
  | 'NCR_RANGER'
  | 'VAULT_OVERSEER'

type FactionAlignment =
  | 'BROTHERHOOD_OF_STEEL'
  | 'NCR'
  | 'CAESARS_LEGION'
  | 'RAIDERS'
  | 'UNAFFILIATED'
  | 'VAULT_TEC'

type PipBoySection =
  | 'STATS'
  | 'INV'
  | 'DATA'
  | 'MAP'
  | 'RADIO'

type KarmaAlignment =
  | 'GOOD'
  | 'NEUTRAL'
  | 'EVIL'

type RadiationLevel =
  | 'CLEAN'
  | 'LIGHT'
  | 'MODERATE'
  | 'HEAVY'
  | 'LETHAL'

interface WastelandCard {
  id: string
  name: string
  description: string
  suit: string
  value: number
  card_number: number
  image_url: string
  upright_meaning: string
  reversed_meaning: string
  fallout_reference: string
  character_voice_interpretations: Record<CharacterVoice, string>
  radiation_factor: number
  karma_alignment: KarmaAlignment
}

interface ReadingData {
  id: string
  user_id: string
  question: string
  spread_type: string
  cards: Array<{
    id: string
    name: string
    position: string
    is_reversed: boolean
  }>
  interpretation: {
    character_voice: CharacterVoice
    overall_theme: string
    card_interpretations: Array<{
      card_id: string
      position: string
      meaning: string
      advice: string
    }>
    summary: string
    radiation_warning?: string
    karma_impact: number
  }
  radiation_factor: number
  karma_adjustment: number
  created_at: string
  is_private: boolean
  accuracy_rating?: number
  user_feedback?: string
  tags: string[]
}

interface UserProfile {
  id: string
  username: string
  email: string
  display_name: string
  faction_alignment: FactionAlignment
  karma_score: number
  karma_alignment: KarmaAlignment
  vault_number?: number
  wasteland_location?: string
  is_verified: boolean
  created_at: string
  preferences: {
    default_character_voice: CharacterVoice
    radiation_tolerance: number
    preferred_spread_type: string
    sound_effects_enabled: boolean
    pip_boy_theme: string
    auto_save_readings: boolean
  }
  statistics: {
    total_readings: number
    readings_this_month: number
    average_accuracy_rating: number
    total_karma_gained: number
    favorite_faction: FactionAlignment
    wasteland_survival_days: number
    radiation_exposure_level: RadiationLevel
    most_drawn_card: string
    longest_reading_streak: number
  }
}

// Test fixture types
interface TestFixtures {
  'test-cards.json': WastelandCard[]
  'test-users.json': UserProfile[]
  'test-readings.json': ReadingData[]
  'api-responses.json': Record<string, any>
}

// Cypress environment variables
interface CypressEnv {
  API_URL: string
  TEST_VAULT_NUMBER: string
  TEST_FACTION: FactionAlignment
  TEST_RADIATION_LEVEL: string
  ENABLE_SOUND_EFFECTS: boolean
  ENABLE_ANIMATIONS: boolean
  ENABLE_RADIATION_EFFECTS: boolean
  PERCY_TOKEN?: string
  CODE_COVERAGE: boolean
}

// Extend Cypress namespace
declare namespace Cypress {
  interface Env extends CypressEnv {}

  interface Fixtures extends TestFixtures {}
}

// Global type augmentations
declare global {
  interface Window {
    WastelandTarot: {
      PipBoyInterface: {
        playSound: (soundName: string) => void
        updateStats: (stats: any) => void
        scanlineEffect: () => void
      }
      RadiationEngine: {
        calculateFactor: () => number
        applyRadiation: (level: number) => void
      }
      KarmaSystem: {
        calculateAlignment: () => KarmaAlignment
        updateKarma: (change: number) => void
      }
    }
  }
}

export {}