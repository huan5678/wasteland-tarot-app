/**
 * Hero Section 動態標題系統型別定義
 *
 * 此檔案定義 Hero Section 文案資料結構與相關型別介面
 */

/**
 * 單一 Hero Section 文案配置
 */
export interface HeroTitle {
  /** 唯一識別碼 */
  id: string;
  /** 主標題（打字動畫） */
  title: string;
  /** 副標題（立即顯示） */
  subtitle: string;
  /** 描述段落（淡入顯示） */
  description: string;
  /** 是否啟用此文案 */
  enabled: boolean;
}

/**
 * 文案集合（JSON 根結構）
 */
export interface HeroTitlesCollection {
  /** 版本號（用於未來相容性） */
  version: string;
  /** 文案陣列 */
  titles: HeroTitle[];
  /** 預設配置 */
  defaultConfig?: {
    /** 預設打字速度（毫秒/字元） */
    typingSpeed?: number;
    /** 預設輪播間隔（毫秒） */
    autoPlayInterval?: number;
  };
}

/**
 * 降級預設文案（當 JSON 載入失敗時）
 */
export const FALLBACK_TITLE: HeroTitle = {
  id: 'fallback-0',
  title: '玄學的盡頭是科學™',
  subtitle: '由 Nuka-Cola 量子科學部贊助播出',
  description: '「經過 200 年的實驗室驗證與田野測試，我們證實了一件事：命運不是迷信，而是尚未被完全理解的統計學。現在就用 Pip-Boy 量測你的概率吧。」',
  enabled: true,
};
