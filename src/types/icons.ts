/**
 * Icon Component Types
 * 圖示元件型別定義
 */

import type { LucideIcon } from 'lucide-react'

/**
 * SuitIcon Props Interface
 *
 * SuitIcon 元件的 props 型別定義
 */
export interface SuitIconProps {
  /**
   * lucide-react 圖示元件
   */
  Icon: LucideIcon

  /**
   * 圖示尺寸預設值
   * - sm: 小尺寸 (32px)
   * - md: 中尺寸 (48px)
   * - lg: 大尺寸 (64-96px,響應式)
   * - xl: 超大尺寸 (80-112px,響應式)
   * @default 'lg'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'

  /**
   * 額外的 CSS 類別 (用於覆寫或擴展樣式)
   */
  className?: string

  /**
   * ARIA label (當圖示傳達重要資訊時使用)
   */
  ariaLabel?: string

  /**
   * ARIA hidden (當圖示為裝飾性或與文字並存時使用)
   * @default false
   */
  ariaHidden?: boolean

  /**
   * 筆畫寬度 (lucide-react strokeWidth prop)
   * @default 1.5
   */
  strokeWidth?: number
}
