/**
 * PipBoyButton Component
 * Pip-Boy 風格按鈕元件
 *
 * 特色:
 * - 綠色邊框與文字
 * - Monospace 字體(終端機風格)
 * - Hover 與 Disabled 狀態
 * - 支援兩種變體: primary 與 secondary
 */

import React from 'react'
import { cn } from '@/lib/utils'

export interface PipBoyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 按鈕變體
   * - primary: 實心背景
   * - secondary: 透明背景
   */
  variant?: 'primary' | 'secondary'

  /**
   * 按鈕大小
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * 是否為全寬按鈕
   */
  fullWidth?: boolean
}

/**
 * PipBoyButton 元件
 *
 * @example
 * ```tsx
 * <PipBoyButton variant="primary" onClick={handleClick}>
 *   點擊我
 * </PipBoyButton>
 * ```
 */
export function PipBoyButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}: PipBoyButtonProps) {
  return (
    <button
      className={cn(
        // 基礎樣式
        'font-mono font-semibold uppercase tracking-wider transition-all duration-200',
        'border-2 border-pip-boy-green',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-pip-boy-green focus-visible:ring-offset-2',

        // 變體樣式
        variant === 'primary' && [
          'bg-pip-boy-green text-black',
          'hover:bg-pip-boy-green/80 hover:shadow-[0_0_15px_rgba(51,255,51,0.5)]',
          'active:bg-pip-boy-green/60',
        ],
        variant === 'secondary' && [
          'bg-transparent text-pip-boy-green-bright',
          'hover:bg-pip-boy-green/20 hover:shadow-[0_0_10px_rgba(51,255,51,0.3)] hover:text-pip-boy-green',
          'active:bg-pip-boy-green/10',
        ],

        // 大小樣式
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',

        // 全寬
        fullWidth && 'w-full',

        // 禁用狀態
        disabled && [
          'opacity-50 cursor-not-allowed',
          'hover:bg-pip-boy-green hover:shadow-none', // 覆蓋 hover 效果
        ],

        // 自定義類別
        className
      )}
      disabled={disabled}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * PipBoyIconButton - 圖示按鈕變體
 * 用於只包含圖示的按鈕
 */
export interface PipBoyIconButtonProps extends Omit<PipBoyButtonProps, 'size'> {
  /**
   * 圖示按鈕大小 (正方形)
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * ARIA label (必須提供,確保無障礙性)
   */
  'aria-label': string
}

export function PipBoyIconButton({
  size = 'md',
  className,
  children,
  ...props
}: PipBoyIconButtonProps) {
  return (
    <PipBoyButton
      className={cn(
        'aspect-square p-0 inline-flex items-center justify-center',
        size === 'sm' && 'h-8 w-8',
        size === 'md' && 'h-10 w-10',
        size === 'lg' && 'h-12 w-12',
        className
      )}
      {...props}
    >
      {children}
    </PipBoyButton>
  )
}
