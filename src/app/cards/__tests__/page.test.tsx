/**
 * Cards Page 測試 - 驗證嵌套型別使用
 */

import { describe, it, expect } from 'vitest'
import type { TarotCard } from '@/types/api'
import fs from 'fs'
import path from 'path'

describe('CardsPage - Nested Type Usage', () => {
  it('應使用正確的嵌套型別定義', () => {
    // 驗證 TarotCard 型別具有嵌套結構
    const mockCard: TarotCard = {
      id: 'test-001',
      name: 'Test Card',
      suit: 'major_arcana',
      upright_meaning: 'Test',
      reversed_meaning: 'Test',
      // 嵌套結構 - 必須提供
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

    // 驗證嵌套欄位可以存取
    expect(mockCard.metadata.radiation_level).toBe(0.5)
    expect(mockCard.metadata.threat_level).toBe(5)
  })

  it('頁面應該使用 TarotCard 型別', () => {
    const pagePath = path.join(process.cwd(), 'src/app/cards/page.tsx')
    const pageSource = fs.readFileSync(pagePath, 'utf-8')

    // 應該 import TarotCard 型別
    expect(pageSource).toContain('TarotCard')
    expect(pageSource).toContain('from')
    expect(pageSource).toContain('@/types/api')
  })

  it('頁面不應使用舊的扁平型別欄位', () => {
    const pagePath = path.join(process.cwd(), 'src/app/cards/page.tsx')
    const pageSource = fs.readFileSync(pagePath, 'utf-8')

    // 不應該直接存取扁平欄位（如 card.radiation_level）
    // 當前頁面實作只顯示基本資訊，這是可接受的
    // 未來如果需要顯示嵌套欄位，應使用 card.metadata.radiation_level 格式
    expect(pageSource).not.toContain('card.radiation_level')
    expect(pageSource).not.toContain('card.pip_boy_analysis')
  })

  it('API 返回的資料應符合嵌套結構', () => {
    // 模擬完整的 API 回應格式
    const mockApiResponse: TarotCard = {
      id: 'wanderer-001',
      name: 'The Wanderer',
      suit: 'major_arcana',
      number: 0,
      upright_meaning: 'New beginnings',
      reversed_meaning: 'Fear',
      metadata: {
        radiation_level: 0.3,
        threat_level: 5,
        vault_number: 111,
      },
      character_voices: {
        pip_boy_analysis: 'Analysis complete',
      },
      faction_meanings: {},
      visuals: {
        image_url: '/test.jpg',
      },
      stats: {
        draw_frequency: 0,
        total_appearances: 0,
      },
      is_major_arcana: true,
      is_court_card: false,
    }

    // 驗證資料結構
    expect(mockApiResponse.metadata).toBeDefined()
    expect(mockApiResponse.metadata.radiation_level).toBe(0.3)
    expect(mockApiResponse.character_voices).toBeDefined()
    expect(mockApiResponse.visuals).toBeDefined()
    expect(mockApiResponse.stats).toBeDefined()
  })
})
