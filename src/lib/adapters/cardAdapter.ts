import type { TarotCard } from '@/types/api'

/**
 * 將後端 API 返回的原始卡牌數據轉換為前端使用的 TarotCard 格式
 * 
 * 職責：
 * 1. 處理欄位名稱不一致（別名映射）
 * 2. 確保嵌套對象存在（避免 undefined）
 * 3. 提供默認值
 * 
 * @param data 後端返回的原始數據
 * @returns 清洗後的 TarotCard 對象
 */
export function adaptBackendCardToFrontend(data: any): TarotCard {
  if (!data) {
    throw new Error('adaptBackendCardToFrontend: data is null or undefined');
  }

  // 處理嵌套屬性的安全訪問
  const metadata = data.metadata || {};
  const visuals = data.visuals || {};
  const characterVoices = data.character_voices || {};
  const factionMeanings = data.faction_meanings || {};
  const stats = data.stats || {};

  // 核心映射邏輯
  const card: TarotCard = {
    ...data,
    
    // 1. 關鍵屬性映射
    // 映射 metadata.radiation_level → radiation_factor
    // 優先級: metadata.radiation_level > data.radiation_factor > 0
    radiation_factor: metadata.radiation_level ?? data.radiation_factor ?? 0,
    
    // 映射 visuals.image_url → image_url
    // 優先級: visuals.image_url > data.image_url > ''
    image_url: visuals.image_url ?? data.image_url ?? '',
    
    // 2. 角色語音映射 (解決後端命名不一致問題)
    character_voices: {
      // 展開原始對象以保留可能存在的其他屬性
      ...characterVoices,
      
      // 顯式映射主要角色
      pip_boy: characterVoices.pip_boy_analysis ?? characterVoices.pip_boy,
      vault_dweller: characterVoices.vault_dweller_perspective ?? characterVoices.vault_dweller,
      wasteland_trader: characterVoices.wasteland_trader_wisdom ?? characterVoices.wasteland_trader,
      super_mutant: characterVoices.super_mutant_simplicity ?? characterVoices.super_mutant,
      codsworth: characterVoices.codsworth_analysis ?? characterVoices.codsworth,
    },
    
    // 3. Fallout 特定屬性映射
    fallout_reference: data.fallout_reference ?? data.fallout_easter_egg,
    vault_reference: metadata.vault_number ?? data.vault_reference,
    threat_level: metadata.threat_level ?? data.threat_level,

    // 4. 確保結構完整性 (Zod Schema 兼容性)
    metadata: {
      radiation_level: 0,
      threat_level: 1,
      ...metadata
    },
    
    visuals: {
      geiger_sound_intensity: 0.1,
      ...visuals
    },
    
    stats: {
      draw_frequency: 0,
      total_appearances: 0,
      ...stats
    },
    
    faction_meanings: {
      ...factionMeanings
    }
  };

  return card;
}
