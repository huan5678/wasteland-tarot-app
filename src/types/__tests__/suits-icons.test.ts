/**
 * Suits Icon Configuration Tests
 * 驗證花色配置中的圖示元件
 */

import { SUIT_CONFIG, SuitType } from '../suits'

describe('SUIT_CONFIG Icon Integration', () => {
  describe('Icon 屬性存在性驗證', () => {
    it('所有花色應該包含 Icon 屬性', () => {
      const suits = Object.values(SuitType)

      suits.forEach((suit) => {
        const metadata = SUIT_CONFIG[suit]
        expect(metadata.Icon).toBeDefined()
        expect(typeof metadata.Icon).toBe('function') // LucideIcon 是一個 React 元件函式
      })
    })

    it('MAJOR_ARCANA 應該有 Sparkles 圖示', () => {
      const metadata = SUIT_CONFIG[SuitType.MAJOR_ARCANA]
      expect(metadata.Icon).toBeDefined()
      expect(metadata.Icon.name).toBe('Sparkles')
    })

    it('NUKA_COLA_BOTTLES 應該有 Wine 圖示', () => {
      const metadata = SUIT_CONFIG[SuitType.NUKA_COLA_BOTTLES]
      expect(metadata.Icon).toBeDefined()
      expect(metadata.Icon.name).toBe('Wine')
    })

    it('COMBAT_WEAPONS 應該有 Swords 圖示', () => {
      const metadata = SUIT_CONFIG[SuitType.COMBAT_WEAPONS]
      expect(metadata.Icon).toBeDefined()
      expect(metadata.Icon.name).toBe('Swords')
    })

    it('BOTTLE_CAPS 應該有 Coins 圖示', () => {
      const metadata = SUIT_CONFIG[SuitType.BOTTLE_CAPS]
      expect(metadata.Icon).toBeDefined()
      expect(metadata.Icon.name).toBe('Coins')
    })

    it('RADIATION_RODS 應該有 Zap 圖示', () => {
      const metadata = SUIT_CONFIG[SuitType.RADIATION_RODS]
      expect(metadata.Icon).toBeDefined()
      expect(metadata.Icon.name).toBe('Zap')
    })
  })

  describe('向後相容性驗證', () => {
    it('所有花色應該仍保留 icon 字串屬性（向後相容）', () => {
      const suits = Object.values(SuitType)

      suits.forEach((suit) => {
        const metadata = SUIT_CONFIG[suit]
        expect(metadata.icon).toBeDefined()
        expect(typeof metadata.icon).toBe('string')
      })
    })

    it('emoji 圖示字串應該與原始值匹配', () => {
      expect(SUIT_CONFIG[SuitType.MAJOR_ARCANA].icon).toBe('🌟')
      expect(SUIT_CONFIG[SuitType.NUKA_COLA_BOTTLES].icon).toBe('🥤')
      expect(SUIT_CONFIG[SuitType.COMBAT_WEAPONS].icon).toBe('⚔️')
      expect(SUIT_CONFIG[SuitType.BOTTLE_CAPS].icon).toBe('💰')
      expect(SUIT_CONFIG[SuitType.RADIATION_RODS].icon).toBe('☢️')
    })
  })

  describe('型別安全性驗證', () => {
    it('Icon 屬性應該是可呼叫的 React 元件', () => {
      const metadata = SUIT_CONFIG[SuitType.MAJOR_ARCANA]

      // 驗證 Icon 可以被當作 React 元件使用
      expect(() => {
        const IconComponent = metadata.Icon
        // React 元件應該是函式
        expect(typeof IconComponent).toBe('function')
      }).not.toThrow()
    })

    it('所有 Icon 屬性應該有一致的型別', () => {
      const suits = Object.values(SuitType)
      const iconTypes = suits.map((suit) => typeof SUIT_CONFIG[suit].Icon)

      // 所有 Icon 都應該是 function 型別
      const allFunctions = iconTypes.every((type) => type === 'function')
      expect(allFunctions).toBe(true)
    })
  })

  describe('配置完整性驗證', () => {
    it('應該有恰好 5 個花色配置', () => {
      const suits = Object.keys(SUIT_CONFIG)
      expect(suits).toHaveLength(5)
    })

    it('每個配置應該包含所有必需屬性', () => {
      const suits = Object.values(SuitType)
      const requiredProps = ['suit', 'name_zh_tw', 'name_en', 'description', 'card_count', 'Icon']

      suits.forEach((suit) => {
        const metadata = SUIT_CONFIG[suit]
        requiredProps.forEach((prop) => {
          expect(metadata).toHaveProperty(prop)
        })
      })
    })
  })
})
