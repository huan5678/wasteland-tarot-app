/**
 * Card Image Utils
 * 卡牌圖片路徑映射與 alt 文字生成工具函式
 */

import type { TarotCard } from '@/types/api'
import { getSuitDisplayName } from '@/types/suits'

/**
 * Suit 到資料夾名稱的映射表
 * 用於將資料庫的 suit 值轉換為檔案系統的資料夾名稱
 */
const SUIT_FOLDER_MAP: Record<string, string> = {
  major_arcana: 'major-arcana',
  nuka_cola_bottles: 'nuka-cola-bottles',
  combat_weapons: 'combat-weapons',
  bottle_caps: 'bottle-caps',
  radiation_rods: 'radiation-rods',
}

/**
 * 取得卡牌圖片 URL
 *
 * 根據卡牌資料生成正確的圖片路徑:
 * - Major Arcana: /assets/cards/major-arcana/{number}.png
 * - Minor Arcana: /assets/cards/minor-arcana/{suitFolder}/{number}.png
 *
 * @param card - 卡牌資料物件
 * @returns 圖片完整路徑
 *
 * @example
 * // Major Arcana 卡牌
 * const wandererCard = { is_major_arcana: true, number: 0, ... }
 * getCardImageUrl(wandererCard) // '/assets/cards/major-arcana/00.png'
 *
 * @example
 * // Minor Arcana 卡牌
 * const aceOfCups = { suit: 'nuka_cola', number: 1, ... }
 * getCardImageUrl(aceOfCups) // '/assets/cards/minor-arcana/nuka-cola-bottles/01.png'
 */
export function getCardImageUrl(card: TarotCard): string {
  const baseUrl = '/assets/cards'

  // 檢查是否為 Major Arcana
  const isMajorArcana =
    card.is_major_arcana || card.suit === 'major_arcana' || card.suit === 'major-arcana'

  if (isMajorArcana) {
    // Major Arcana: 編號補零為兩位數
    const cardNumber = String(card.number ?? 0).padStart(2, '0')
    return `${baseUrl}/major-arcana/${cardNumber}.png`
  }

  // Minor Arcana: 映射 suit 到資料夾名稱
  const suitFolder = SUIT_FOLDER_MAP[card.suit]

  if (!suitFolder) {
    // 未知 suit: 返回 fallback 圖片
    console.warn(`[getCardImageUrl] Unknown suit: ${card.suit}. Using fallback image.`)
    return `${baseUrl}/card-backs/default.png`
  }

  // Minor Arcana: 編號補零為兩位數
  const cardNumber = String(card.number ?? 1).padStart(2, '0')
  return `${baseUrl}/minor-arcana/${suitFolder}/${cardNumber}.png`
}

/**
 * 取得卡牌圖片 alt 文字
 *
 * 優先使用卡牌的 visuals.image_alt_text,
 * 若不存在則生成預設的 alt 文字
 *
 * @param card - 卡牌資料物件
 * @returns 圖片 alt 文字
 *
 * @example
 * const card = { name: 'The Wanderer', visuals: { image_alt_text: '流浪者塔羅牌' } }
 * getCardImageAlt(card) // '流浪者塔羅牌'
 *
 * @example
 * const card = { name: 'The Wanderer', visuals: {} }
 * getCardImageAlt(card) // 'The Wanderer - Wasteland Tarot Card'
 */
export function getCardImageAlt(card: TarotCard): string {
  // 優先使用卡牌定義的 alt 文字
  if (card.visuals?.image_alt_text) {
    return card.visuals.image_alt_text
  }

  // Fallback: 使用卡牌名稱生成預設 alt 文字
  return `${card.name} - Wasteland Tarot Card`
}

/**
 * 驗證卡牌圖片路徑是否有效
 *
 * @param card - 卡牌資料物件
 * @returns 是否為有效路徑
 */
export function isValidCardImagePath(card: TarotCard): boolean {
  // 檢查必要欄位
  if (!card || !card.suit) {
    return false
  }

  // 檢查編號是否存在
  if (card.number === null || card.number === undefined) {
    return false
  }

  // Major Arcana: 編號範圍 0-21
  if (card.is_major_arcana || card.suit === 'major_arcana') {
    return card.number >= 0 && card.number <= 21
  }

  // Minor Arcana: 編號範圍 1-14
  return card.number >= 1 && card.number <= 14
}

/**
 * 取得 fallback 圖片 URL
 *
 * @returns Fallback 圖片路徑
 */
export function getFallbackImageUrl(): string {
  return '/assets/cards/card-backs/default.png'
}

/**
 * 預先載入卡牌圖片
 *
 * 用於效能優化,預先載入即將顯示的卡牌圖片
 *
 * @param cards - 要預先載入的卡牌陣列
 */
export function preloadCardImages(cards: TarotCard[]): void {
  if (typeof window === 'undefined') {
    // Server-side rendering: 不執行預先載入
    return
  }

  cards.forEach((card) => {
    const imageUrl = getCardImageUrl(card)
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'image'
    link.href = imageUrl
    document.head.appendChild(link)
  })
}
