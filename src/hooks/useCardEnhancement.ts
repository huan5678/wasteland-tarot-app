/**
 * useCardEnhancement Hook
 * 用於載入和增強卡牌資料，包含角色解讀
 *
 * 替代硬編碼的 enhanceCardWithWastelandData 函式
 */

import { useMemo } from 'react'
import { useCardInterpretations } from './useCharacterVoices'
import type { DetailedTarotCard } from '@/components/tarot/CardDetailModal'

/**
 * Hook: 增強單一卡牌資料（載入角色解讀）
 */
export function useCardEnhancement(card: any | null | undefined) {
  const cardId = card?.id || card?.uuid
  const { interpretations, isLoading, error } = useCardInterpretations(cardId)

  const enhancedCard = useMemo((): DetailedTarotCard | null => {
    if (!card) return null

    // 將 interpretations 轉換為 character_voices 格式
    const characterVoiceInterpretations: Record<string, string> = {}

    if (interpretations && interpretations.length > 0) {
      interpretations.forEach((interp) => {
        if (interp.character_key && interp.interpretation_text) {
          characterVoiceInterpretations[interp.character_key] = interp.interpretation_text
        }
      })
    }

    // 建立增強的卡牌資料
    const enhanced: DetailedTarotCard = {
      // 基本資料
      id: card.id || card.uuid || '',
      name: card.name || '未知卡牌',
      description: card.description || '',
      suit: card.suit || '',
      number: card.number || card.card_number,
      card_number: card.card_number || card.number,
      image_url: card.image_url || '',

      // 含義
      upright_meaning: card.upright_meaning || card.meaning_upright || '未知含義',
      reversed_meaning: card.reversed_meaning || card.meaning_reversed || '未知含義',
      meaning_upright: card.meaning_upright || card.upright_meaning || '未知含義',
      meaning_reversed: card.meaning_reversed || card.reversed_meaning || '未知含義',

      // 關鍵詞和象徵
      keywords: card.keywords || [],
      symbolism: card.symbolism || '',
      element: card.element || '',
      astrological_association: card.astrological_association || '',

      // Fallout 主題資料
      fallout_reference: card.fallout_reference || '',
      radiation_factor: card.radiation_factor || 0,
      karma_alignment: card.karma_alignment || 'NEUTRAL',
      vault_reference: card.vault_reference,
      threat_level: card.threat_level,
      wasteland_humor: card.wasteland_humor || '',
      nuka_cola_reference: card.nuka_cola_reference || '',
      special_ability: card.special_ability || '',

      // 統計資料
      draw_frequency: card.draw_frequency,
      total_appearances: card.total_appearances,
      positive_feedback_count: card.positive_feedback_count,
      negative_feedback_count: card.negative_feedback_count,
      average_rating: card.average_rating,
      rarity_level: card.rarity_level,

      // 狀態
      position: card.position || 'upright',
      is_active: card.is_active ?? true,
      is_complete: card.is_complete ?? true,

      // 時間戳記
      created_at: card.created_at,
      updated_at: card.updated_at,

      // ✅ 角色解讀資料（從 API 載入）
      character_voices: characterVoiceInterpretations,
    }

    return enhanced
  }, [card, interpretations])

  return {
    enhancedCard,
    isLoading,
    error,
  }
}

/**
 * Hook: 批量增強多張卡牌資料
 */
export function useCardsEnhancement(cards: any[] | null | undefined) {
  // 這個 Hook 可以用於批量處理，但目前簡化為對每張卡片使用單一 Hook
  // 未來可以優化為一次 API 呼叫載入所有卡片的解讀

  return {
    enhancedCards: cards || [],
    isLoading: false,
    error: null,
  }
}

/**
 * 輔助函式：同步版本的卡牌增強（用於不需要 API 的場景）
 *
 * 注意：這個版本不會包含角色解讀，僅用於基本資料增強
 */
export function enhanceCardBasic(card: any): DetailedTarotCard {
  return {
    id: card.id || card.uuid || '',
    name: card.name || '未知卡牌',
    description: card.description || '',
    suit: card.suit || '',
    number: card.number || card.card_number,
    card_number: card.card_number || card.number,
    image_url: card.image_url || '',

    upright_meaning: card.upright_meaning || card.meaning_upright || '未知含義',
    reversed_meaning: card.reversed_meaning || card.meaning_reversed || '未知含義',
    meaning_upright: card.meaning_upright || card.upright_meaning || '未知含義',
    meaning_reversed: card.meaning_reversed || card.reversed_meaning || '未知含義',

    keywords: card.keywords || [],
    symbolism: card.symbolism || '',
    element: card.element || '',
    astrological_association: card.astrological_association || '',

    fallout_reference: card.fallout_reference || '',
    radiation_factor: card.radiation_factor || 0,
    karma_alignment: card.karma_alignment || 'NEUTRAL',
    vault_reference: card.vault_reference,
    threat_level: card.threat_level,
    wasteland_humor: card.wasteland_humor || '',
    nuka_cola_reference: card.nuka_cola_reference || '',
    special_ability: card.special_ability || '',

    position: card.position || 'upright',
    is_active: card.is_active ?? true,
    is_complete: card.is_complete ?? true,

    created_at: card.created_at,
    updated_at: card.updated_at,

    // 空的角色解讀（需要使用 useCardEnhancement 來載入）
    character_voices: card.character_voices || {},
  }
}
