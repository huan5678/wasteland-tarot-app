/**
 * Card Back Configuration
 * 卡背設定檔案
 *
 * 管理所有可用的卡背圖片
 */

/**
 * 卡背資訊介面
 */
export interface CardBackInfo {
  /** 檔案名稱 */
  filename: string
  /** 顯示名稱 */
  name: string
  /** 描述 */
  description: string
  /** 主題 (vault-tec, nuka-cola, brotherhood, etc.) */
  theme?: string
}

/**
 * 所有可用的卡背列表
 *
 * 🎨 設計指南：
 * - 所有卡背應放在 public/assets/cards/card-backs/ 目錄
 * - 建議尺寸：400x600px (2:3 比例)
 * - 檔案格式：PNG 或 JPG
 * - 命名規範：01.png, 02.png, ... 或 kebab-case
 */
export const CARD_BACKS: CardBackInfo[] = [
  {
    filename: '01.png',
    name: '廢土卡背 #1',
    description: '廢土塔羅卡背設計 #1',
    theme: 'wasteland',
  },
  {
    filename: '02.png',
    name: '廢土卡背 #2',
    description: '廢土塔羅卡背設計 #2',
    theme: 'wasteland',
  },
  {
    filename: '03.png',
    name: '廢土卡背 #3',
    description: '廢土塔羅卡背設計 #3',
    theme: 'wasteland',
  },
  {
    filename: '04.png',
    name: '廢土卡背 #4',
    description: '廢土塔羅卡背設計 #4',
    theme: 'wasteland',
  },
  {
    filename: '05.png',
    name: '廢土卡背 #5',
    description: '廢土塔羅卡背設計 #5',
    theme: 'wasteland',
  },
  {
    filename: '06.png',
    name: '廢土卡背 #6',
    description: '廢土塔羅卡背設計 #6',
    theme: 'wasteland',
  },
  {
    filename: '07.png',
    name: '廢土卡背 #7',
    description: '廢土塔羅卡背設計 #7',
    theme: 'wasteland',
  },
  {
    filename: '08.png',
    name: '廢土卡背 #8',
    description: '廢土塔羅卡背設計 #8',
    theme: 'wasteland',
  },
  {
    filename: '09.png',
    name: '廢土卡背 #9',
    description: '廢土塔羅卡背設計 #9',
    theme: 'wasteland',
  },
  {
    filename: '10.png',
    name: '廢土卡背 #10',
    description: '廢土塔羅卡背設計 #10',
    theme: 'wasteland',
  },
  {
    filename: '11.png',
    name: '廢土卡背 #11',
    description: '廢土塔羅卡背設計 #11',
    theme: 'wasteland',
  },
  {
    filename: '12.png',
    name: '廢土卡背 #12',
    description: '廢土塔羅卡背設計 #12',
    theme: 'wasteland',
  },
]

/**
 * 預設卡背 (當列表為空或載入失敗時使用)
 */
export const DEFAULT_CARD_BACK: CardBackInfo = {
  filename: '01.png',
  name: '預設卡背',
  description: '基本的廢土塔羅卡背設計',
}

/**
 * 卡背圖片基礎路徑
 */
export const CARD_BACK_BASE_PATH = '/assets/cards/card-backs'

/**
 * 取得所有卡背的檔案名稱列表
 */
export function getCardBackFilenames(): string[] {
  return CARD_BACKS.map((cardBack) => cardBack.filename)
}

/**
 * 根據檔案名稱取得卡背資訊
 */
export function getCardBackInfo(filename: string): CardBackInfo | undefined {
  return CARD_BACKS.find((cardBack) => cardBack.filename === filename)
}

/**
 * 根據主題取得卡背列表
 */
export function getCardBacksByTheme(theme: string): CardBackInfo[] {
  return CARD_BACKS.filter((cardBack) => cardBack.theme === theme)
}

/**
 * 取得完整的卡背圖片路徑
 */
export function getCardBackPath(filename: string): string {
  return `${CARD_BACK_BASE_PATH}/${filename}`
}

/**
 * 取得預設卡背路徑
 */
export function getDefaultCardBackPath(): string {
  return getCardBackPath(DEFAULT_CARD_BACK.filename)
}
