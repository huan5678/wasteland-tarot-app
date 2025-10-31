/**
 * PixelIcon Lite - Lightweight Server Component Version
 *
 * 輕量版圖示元件，專為 Server Components 設計（如 404 頁面、靜態頁面）
 *
 * 特點:
 * - 無 'use client' - 純 Server Component
 * - 不載入 iconMetadata.ts - 避免 3000+ modules bundle
 * - 保留完整 API - variant, sizePreset, animation 等
 * - 內聯輕量 mappings - 只有必要的 CSS class 對照
 *
 * 效能:
 * - 編譯時間: <1s (vs 7.2s)
 * - 模組數量: ~50 (vs 3,127)
 * - Bundle 大小: +2KB (vs +120KB)
 *
 * 使用場景:
 * - ✅ Server Components (layout, 404, static pages)
 * - ❌ 需要 onClick 等互動功能 → 使用完整版 PixelIcon
 *
 * @module PixelIconLite
 * @version 1.0
 */

import { cn } from '@/lib/utils'
import type { PixelIconProps } from '@/types/icons'

/**
 * 顏色變體 CSS class mapping (內聯版本)
 * 避免引入 iconUtils.ts 導致額外依賴
 */
const VARIANT_CLASSES = {
  default: '',
  primary: 'text-pip-boy-green',
  secondary: 'text-radiation-orange',
  success: 'text-pip-boy-green-bright',
  warning: 'text-warning-yellow',
  error: 'text-red-500',
  info: 'text-vault-blue-light',
  muted: 'text-gray-500',
} as const

/**
 * 尺寸預設 CSS class mapping (內聯版本)
 * 對應 iconUtils.ts 的 SIZE_PRESETS
 */
const SIZE_CLASSES = {
  xs: 'text-base',      // 16px - 小型圖示、表單錯誤
  sm: 'text-2xl',       // 24px - 中型按鈕、控制項
  md: 'text-[32px]',    // 32px - 標準圖示
  lg: 'text-5xl',       // 48px - 大型圖示、空狀態
  xl: 'text-[72px]',    // 72px - 超大圖示、警告
  xxl: 'text-[96px]',   // 96px - 巨大圖示、展示
} as const

/**
 * 動畫效果 CSS class mapping (內聯版本)
 * 對應 globals.css 中定義的動畫
 */
const ANIMATION_CLASSES = {
  spin: 'animate-spin',           // 旋轉 - 載入、同步
  pulse: 'animate-pulse',         // 脈衝 - 載入、通知
  bounce: 'animate-bounce',       // 彈跳 - 提示、警告
  ping: 'animate-ping',           // Ping - 通知點
  fade: 'animate-fade-in-out',    // 淡入淡出 - 切換
  wiggle: 'animate-wiggle',       // 搖晃 - 錯誤、警告
  float: 'animate-float',         // 懸浮 - 提示
} as const

/**
 * PixelIconLite 元件
 *
 * Server Component 版本的圖示元件，語法與 PixelIcon 完全一致
 *
 * @example
 * ```tsx
 * // 基本使用
 * <PixelIconLite name="home" />
 *
 * // 使用尺寸預設
 * <PixelIconLite name="user" sizePreset="lg" />
 *
 * // 使用顏色變體
 * <PixelIconLite name="check" variant="success" />
 *
 * // 使用動畫
 * <PixelIconLite name="loader" animation="spin" />
 *
 * // 組合使用
 * <PixelIconLite
 *   name="error-warning"
 *   variant="error"
 *   sizePreset="md"
 *   animation="wiggle"
 *   aria-label="錯誤"
 * />
 *
 * // 裝飾性圖示（無語意）
 * <PixelIconLite name="sparkles" decorative />
 * ```
 */
export function PixelIconLite({
  name,
  remixVariant = 'line',
  variant = 'default',
  sizePreset,
  size,
  animation,
  className,
  decorative = false,
  ...props
}: Omit<PixelIconProps, 'onClick'>) { // Server Component 不支援 onClick

  // 組合 RemixIcon CSS class name
  // 格式: ri-{name}-{style} (e.g., ri-home-line, ri-user-fill)
  const remixIconClass = `ri-${name}-${remixVariant}`

  // 組合所有 CSS classes
  const iconClass = cn(
    // RemixIcon base class
    remixIconClass,

    // Variant (語意化顏色)
    variant && VARIANT_CLASSES[variant],

    // Size (優先使用 sizePreset，否則用自訂 size)
    sizePreset && SIZE_CLASSES[sizePreset],
    !sizePreset && size && `text-[${size}px]`,

    // Animation (動畫效果)
    animation && ANIMATION_CLASSES[animation],

    // Custom className
    className
  )

  // Accessibility attributes
  // decorative=true → aria-hidden="true" (對螢幕閱讀器隱藏)
  // decorative=false → 需要 aria-label (提供語意描述)
  const ariaProps = decorative
    ? { 'aria-hidden': 'true' as const }
    : { 'aria-label': props['aria-label'] }

  // 渲染 <i> 標籤（RemixIcon 使用 <i class="ri-*-*">）
  return <i className={iconClass} {...ariaProps} {...props} />
}

/**
 * 預設匯出
 * 方便直接 import
 */
export default PixelIconLite
