/**
 * Faction-Voice Mapping Configuration (Frontend)
 * 定義陣營與角色聲音的對應關係，用於過濾顯示相關的角色解讀
 *
 * ✅ API-Driven Version - 改用 useFactions() Hook 載入的資料
 */

import type { FactionWithCharacters } from '@/types/character-voice'

/**
 * 從 API 資料建立陣營-角色映射表
 *
 * @param factions - 從 useFactions() Hook 載入的陣營資料
 * @returns 陣營 key -> 角色 key[] 的映射表
 */
export function buildFactionVoiceMapping(
  factions: FactionWithCharacters[] | null | undefined
): Record<string, string[]> {
  if (!factions || factions.length === 0) {
    return {}
  }

  const mapping: Record<string, string[]> = {}

  factions.forEach((faction) => {
    if (!faction.characters || faction.characters.length === 0) {
      return
    }

    // 取得該陣營所有角色的 key
    const characterKeys = faction.characters.map((char) => char.key)

    // 正規化陣營 key（處理大小寫和連字符）
    const normalizedKey = faction.key.toLowerCase().replace('-', '_')
    mapping[normalizedKey] = characterKeys
    
    // 同時保留原始的連字符版本（支援 'vault-tec' 等）
    const withHyphen = faction.key.toLowerCase().replace('_', '-')
    if (withHyphen !== normalizedKey) {
      mapping[withHyphen] = characterKeys
    }

    // 處理 vault-tec 變體（前端常用的連字符版本）
    if (normalizedKey === 'vault_dweller') {
      mapping['vault-tec'] = characterKeys
      mapping['vault_tec'] = characterKeys
    }
  })

  return mapping
}

/**
 * 根據陣營取得允許的角色聲音列表（API 驅動版本）
 *
 * @param faction - 陣營 key
 * @param factions - 從 useFactions() Hook 載入的陣營資料
 * @returns 允許的角色 key 列表
 */
export function getAllowedVoicesForFaction(
  faction: string | undefined,
  factions: FactionWithCharacters[] | null | undefined
): string[] {
  if (!faction) {
    // 沒有陣營時，只返回 pip_boy
    return ['pip_boy']
  }

  // 建立映射表
  const mapping = buildFactionVoiceMapping(factions)

  // 正規化陣營名稱（處理大小寫和連字符）
  const normalizedFaction = faction.toLowerCase().replace('-', '_')

  // 取得允許的角色聲音列表
  let allowedVoices = mapping[normalizedFaction] || ['pip_boy']

  // 雙重保險：確保 pip_boy 在列表中
  if (!allowedVoices.includes('pip_boy')) {
    allowedVoices = ['pip_boy', ...allowedVoices]
  }

  return allowedVoices
}

/**
 * 從角色欄位名稱中提取基礎角色名稱
 * 例如：pip_boy_analysis -> pip_boy, vault_dweller_perspective -> vault_dweller
 */
function extractBaseVoiceName(voiceField: string): string {
  // 移除常見的後綴
  const suffixes = ['_analysis', '_perspective', '_wisdom', '_simplicity', '_commentary']
  let baseName = voiceField.toLowerCase()

  for (const suffix of suffixes) {
    if (baseName.endsWith(suffix)) {
      baseName = baseName.slice(0, -suffix.length)
      break
    }
  }

  return baseName
}

/**
 * 根據陣營過濾角色聲音解讀（API 驅動版本）
 *
 * @param characterVoices - 角色解讀資料（key: 角色key, value: 解讀文字）
 * @param faction - 陣營 key
 * @param factions - 從 useFactions() Hook 載入的陣營資料
 * @returns 過濾後的角色解讀
 */
export function filterCharacterVoicesByFaction(
  characterVoices: Record<string, string | null>,
  faction: string | undefined,
  factions: FactionWithCharacters[] | null | undefined
): Record<string, string> {
  const allowedVoices = getAllowedVoicesForFaction(faction, factions)

  return Object.entries(characterVoices).reduce((filtered, [voice, interpretation]) => {
    // 跳過 null 或空字串的解讀
    if (!interpretation) {
      return filtered
    }

    // 提取基礎角色名稱（處理 _analysis, _perspective 等後綴）
    const baseVoice = extractBaseVoiceName(voice)

    // 檢查是否在允許列表中
    if (allowedVoices.includes(baseVoice)) {
      filtered[voice] = interpretation
    }

    return filtered
  }, {} as Record<string, string>)
}

/**
 * 取得陣營的顯示名稱（API 驅動版本）
 *
 * @param factionKey - 陣營 key
 * @param factions - 從 useFactions() Hook 載入的陣營資料
 * @returns 陣營的顯示名稱（中文）
 */
export function getFactionDisplayName(
  factionKey: string,
  factions: FactionWithCharacters[] | null | undefined
): string {
  if (!factions || factions.length === 0) {
    return factionKey
  }

  // 正規化陣營 key
  const normalizedKey = factionKey.toLowerCase().replace('-', '_')

  // 查找陣營
  const faction = factions.find(
    (f) => f.key.toLowerCase().replace('-', '_') === normalizedKey
  )

  return faction?.name || factionKey
}
