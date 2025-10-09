/**
 * API Types 測試 - 驗證嵌套結構
 */

import { describe, it, expect } from 'vitest'
import {
  TarotCardSchema,
  CardMetadataSchema,
  CharacterVoicesSchema,
  FactionMeaningsSchema,
  CardVisualsSchema,
  CardStatsSchema,
} from '../api'

describe('TarotCard Schema - Nested Structure', () => {
  describe('CardMetadataSchema', () => {
    it('應驗證有效的 metadata 物件', () => {
      const validMetadata = {
        radiation_level: 0.3,
        threat_level: 5,
        vault_number: 111,
      }

      expect(() => CardMetadataSchema.parse(validMetadata)).not.toThrow()
    })

    it('應拒絕無效的 radiation_level (超出範圍)', () => {
      const invalidMetadata = {
        radiation_level: 1.5, // 超過 1.0
        threat_level: 5,
      }

      expect(() => CardMetadataSchema.parse(invalidMetadata)).toThrow()
    })

    it('應拒絕無效的 threat_level (超出範圍)', () => {
      const invalidMetadata = {
        radiation_level: 0.3,
        threat_level: 15, // 超過 10
      }

      expect(() => CardMetadataSchema.parse(invalidMetadata)).toThrow()
    })

    it('vault_number 應為可選', () => {
      const metadataWithoutVault = {
        radiation_level: 0.5,
        threat_level: 3,
      }

      expect(() => CardMetadataSchema.parse(metadataWithoutVault)).not.toThrow()
    })
  })

  describe('CharacterVoicesSchema', () => {
    it('應驗證有效的 character_voices 物件', () => {
      const validVoices = {
        pip_boy_analysis: 'Statistical probability: 73.2%',
        vault_dweller_perspective: 'A new beginning awaits',
      }

      expect(() => CharacterVoicesSchema.parse(validVoices)).not.toThrow()
    })

    it('所有欄位應為可選', () => {
      const emptyVoices = {}

      expect(() => CharacterVoicesSchema.parse(emptyVoices)).not.toThrow()
    })
  })

  describe('FactionMeaningsSchema', () => {
    it('應驗證有效的 faction_meanings 物件', () => {
      const validFactions = {
        brotherhood_significance: 'Technology must be preserved',
        ncr_significance: 'Order must be maintained',
      }

      expect(() => FactionMeaningsSchema.parse(validFactions)).not.toThrow()
    })

    it('所有欄位應為可選', () => {
      const emptyFactions = {}

      expect(() => FactionMeaningsSchema.parse(emptyFactions)).not.toThrow()
    })
  })

  describe('CardVisualsSchema', () => {
    it('應驗證有效的 visuals 物件', () => {
      const validVisuals = {
        image_url: '/cards/the_wanderer.jpg',
        image_alt_text: 'A lone vault dweller',
        geiger_sound_intensity: 0.3,
      }

      expect(() => CardVisualsSchema.parse(validVisuals)).not.toThrow()
    })

    it('geiger_sound_intensity 應有預設值', () => {
      const result = CardVisualsSchema.parse({})

      expect(result.geiger_sound_intensity).toBe(0.1)
    })
  })

  describe('CardStatsSchema', () => {
    it('應驗證有效的 stats 物件', () => {
      const validStats = {
        draw_frequency: 127,
        total_appearances: 89,
        last_drawn_at: '2024-01-15T14:30:00Z',
      }

      expect(() => CardStatsSchema.parse(validStats)).not.toThrow()
    })

    it('應有預設值', () => {
      const result = CardStatsSchema.parse({})

      expect(result.draw_frequency).toBe(0)
      expect(result.total_appearances).toBe(0)
    })
  })

  describe('TarotCardSchema - 完整嵌套結構', () => {
    it('應驗證完整的嵌套 card 物件', () => {
      const validCard = {
        id: 'wanderer-001',
        name: 'The Wanderer',
        suit: 'major_arcana',
        number: 0,
        upright_meaning: 'New beginnings',
        reversed_meaning: 'Fear of change',
        metadata: {
          radiation_level: 0.3,
          threat_level: 5,
          vault_number: 111,
        },
        character_voices: {
          pip_boy_analysis: 'Analysis complete',
        },
        faction_meanings: {
          brotherhood_significance: 'Preservation of knowledge',
        },
        visuals: {
          image_url: '/cards/wanderer.jpg',
        },
        stats: {
          draw_frequency: 10,
          total_appearances: 5,
        },
        is_major_arcana: true,
        is_court_card: false,
      }

      expect(() => TarotCardSchema.parse(validCard)).not.toThrow()
    })

    it('應拒絕舊的扁平結構格式', () => {
      const oldFlatCard = {
        id: 'test-001',
        name: 'Test Card',
        suit: 'major_arcana',
        upright_meaning: 'Test',
        reversed_meaning: 'Test',
        // ❌ 扁平結構 - 應該失敗
        radiation_level: 0.3,
        threat_level: 5,
        pip_boy_analysis: 'Old format',
        is_major_arcana: true,
        is_court_card: false,
      }

      expect(() => TarotCardSchema.parse(oldFlatCard)).toThrow()
    })

    it('嵌套物件可以使用預設工廠', () => {
      const minimalCard = {
        id: 'minimal-001',
        name: 'Minimal Card',
        suit: 'major_arcana',
        upright_meaning: 'Test',
        reversed_meaning: 'Test',
        metadata: {
          radiation_level: 0,
          threat_level: 1,
        },
        character_voices: {},
        faction_meanings: {},
        visuals: {},
        stats: {},
        is_major_arcana: true,
        is_court_card: false,
      }

      const result = TarotCardSchema.parse(minimalCard)

      expect(result.metadata).toBeDefined()
      expect(result.character_voices).toBeDefined()
      expect(result.faction_meanings).toBeDefined()
      expect(result.visuals).toBeDefined()
      expect(result.stats).toBeDefined()
    })
  })

  describe('向後相容性', () => {
    it('應允許可選的嵌套欄位為空物件', () => {
      const cardWithEmptyNested = {
        id: 'test-001',
        name: 'Test Card',
        suit: 'major_arcana',
        upright_meaning: 'Test',
        reversed_meaning: 'Test',
        metadata: {
          radiation_level: 0.5,
          threat_level: 5,
        },
        character_voices: {},
        faction_meanings: {},
        visuals: {},
        stats: {},
        is_major_arcana: true,
        is_court_card: false,
      }

      expect(() => TarotCardSchema.parse(cardWithEmptyNested)).not.toThrow()
    })
  })
})
