/**
 * Wasteland Faction Alignment Mapping
 * 陣營歸屬映射表 - 與後端 FactionAlignment enum 保持一致
 */

export interface FactionInfo {
  value: string
  label: string
  description: string
  themeColor: string
}

/**
 * 完整的陣營列表（合併 Fallout 3/4/NV）
 * 順序：獨立派 → 經典陣營 → Fallout 4 陣營
 */
export const FACTIONS: FactionInfo[] = [
  {
    value: 'independent',
    label: 'Independent（獨立派）',
    description: '不隸屬於任何組織，自由探索廢土',
    themeColor: '#00ff88', // pip-boy-green
  },
  {
    value: 'vault_dweller',
    label: 'Vault Dweller（避難所居民）',
    description: '來自 Vault-Tec 避難所的居民，擁有科技知識',
    themeColor: '#0ea5e9', // blue
  },
  {
    value: 'brotherhood',
    label: 'Brotherhood of Steel（鋼鐵兄弟會）',
    description: '致力於保護和收集前戰爭科技的軍事組織',
    themeColor: '#3b82f6', // steel blue
  },
  {
    value: 'minutemen',
    label: 'Minutemen（民兵組織）',
    description: '保護聯邦平民的志願軍事組織',
    themeColor: '#10b981', // green
  },
  {
    value: 'railroad',
    label: 'Railroad（地下鐵路）',
    description: '解放合成人的秘密組織',
    themeColor: '#8b5cf6', // purple
  },
  {
    value: 'institute',
    label: 'Institute（學院）',
    description: '地下高科技研究機構，創造合成人',
    themeColor: '#06b6d4', // cyan
  },
  {
    value: 'ncr',
    label: 'NCR（新加州共和國）',
    description: '民主政府組織，試圖恢復戰前文明',
    themeColor: '#f59e0b', // amber
  },
  {
    value: 'legion',
    label: "Caesar's Legion（凱薩軍團）",
    description: '以古羅馬為範本的獨裁軍事帝國',
    themeColor: '#dc2626', // red
  },
  {
    value: 'raiders',
    label: 'Raiders（掠奪者）',
    description: '廢土的掠奪者和無政府主義者',
    themeColor: '#f97316', // orange
  },
]

/**
 * 陣營值到標籤的映射（用於快速查詢）
 */
export const FACTION_LABELS: Record<string, string> = FACTIONS.reduce(
  (acc, faction) => {
    acc[faction.value] = faction.label
    return acc
  },
  {} as Record<string, string>
)

/**
 * 陣營值到完整資訊的映射
 */
export const FACTION_MAP: Record<string, FactionInfo> = FACTIONS.reduce(
  (acc, faction) => {
    acc[faction.value] = faction
    return acc
  },
  {} as Record<string, FactionInfo>
)

/**
 * 獲取陣營的顯示名稱
 */
export function getFactionLabel(value: string): string {
  return FACTION_LABELS[value] || value
}

/**
 * 獲取陣營的完整資訊
 */
export function getFactionInfo(value: string): FactionInfo | undefined {
  return FACTION_MAP[value]
}

/**
 * 獲取陣營的主題顏色
 */
export function getFactionColor(value: string): string {
  return FACTION_MAP[value]?.themeColor || '#00ff88'
}
