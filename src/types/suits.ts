/**
 * Suit Types and Configuration
 * 花色型別定義與配置常數
 */

/**
 * 花色類型枚舉
 * 包含 Major Arcana 和 4 個 Minor Arcana 花色
 */
export enum SuitType {
  MAJOR_ARCANA = 'major_arcana',
  NUKA_COLA_BOTTLES = 'nuka_cola_bottles',
  COMBAT_WEAPONS = 'combat_weapons',
  BOTTLE_CAPS = 'bottle_caps',
  RADIATION_RODS = 'radiation_rods',
}

/**
 * 花色元資料介面
 */
export interface SuitMetadata {
  suit: SuitType
  name_zh_tw: string
  name_en: string
  description: string
  card_count: number
  icon?: string // 圖示名稱(可選)
}

/**
 * 花色配置常數
 * 包含所有 5 個花色的完整元資料
 */
export const SUIT_CONFIG: Record<SuitType, SuitMetadata> = {
  [SuitType.MAJOR_ARCANA]: {
    suit: SuitType.MAJOR_ARCANA,
    name_zh_tw: '大阿爾克那',
    name_en: 'Major Arcana',
    description: '代表生命中的重大主題與轉折點',
    card_count: 22,
    icon: '🌟',
  },
  [SuitType.NUKA_COLA_BOTTLES]: {
    suit: SuitType.NUKA_COLA_BOTTLES,
    name_zh_tw: 'Nuka-Cola 瓶',
    name_en: 'Nuka-Cola Bottles (Cups)',
    description: '代表情感、關係與內在體驗',
    card_count: 14,
    icon: '🥤',
  },
  [SuitType.COMBAT_WEAPONS]: {
    suit: SuitType.COMBAT_WEAPONS,
    name_zh_tw: '戰鬥武器',
    name_en: 'Combat Weapons (Swords)',
    description: '代表衝突、挑戰與智慧行動',
    card_count: 14,
    icon: '⚔️',
  },
  [SuitType.BOTTLE_CAPS]: {
    suit: SuitType.BOTTLE_CAPS,
    name_zh_tw: '瓶蓋',
    name_en: 'Bottle Caps (Pentacles)',
    description: '代表物質、資源與實際成就',
    card_count: 14,
    icon: '💰',
  },
  [SuitType.RADIATION_RODS]: {
    suit: SuitType.RADIATION_RODS,
    name_zh_tw: '輻射棒',
    name_en: 'Radiation Rods (Wands)',
    description: '代表能量、創造力與靈性追求',
    card_count: 14,
    icon: '☢️',
  },
}

/**
 * 麵包屑項目介面
 */
export interface BreadcrumbItem {
  label: string
  href?: string
}

/**
 * 分頁元資料介面
 */
export interface PaginationMetadata {
  page: number
  totalPages: number
  hasMore: boolean
}

/**
 * 取得花色顯示名稱(中文)
 */
export function getSuitDisplayName(suit: string): string {
  const suitType = suit as SuitType
  const metadata = SUIT_CONFIG[suitType]
  return metadata?.name_zh_tw || suit
}

/**
 * 取得花色英文名稱
 */
export function getSuitEnglishName(suit: string): string {
  const suitType = suit as SuitType
  const metadata = SUIT_CONFIG[suitType]
  return metadata?.name_en || suit
}

/**
 * 取得花色描述
 */
export function getSuitDescription(suit: string): string {
  const suitType = suit as SuitType
  const metadata = SUIT_CONFIG[suitType]
  return metadata?.description || ''
}

/**
 * 取得花色卡牌數量
 */
export function getSuitCardCount(suit: string): number {
  const suitType = suit as SuitType
  const metadata = SUIT_CONFIG[suitType]
  return metadata?.card_count || 0
}

/**
 * 驗證花色是否有效
 */
export function isValidSuit(suit: string): boolean {
  return Object.values(SuitType).includes(suit as SuitType)
}

/**
 * 取得所有花色列表
 */
export function getAllSuits(): SuitMetadata[] {
  return Object.values(SUIT_CONFIG)
}
