/**
 * PipBoyCard Component
 * Pip-Boy 風格卡片容器元件
 *
 * 特色:
 * - 綠色邊框與陰影
 * - 終端機風格背景
 * - 可選的發光效果
 * - 響應式設計
 */

import React from 'react'
import { cn } from '@/lib/utils'

export interface PipBoyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 是否顯示發光效果
   */
  glowEffect?: boolean

  /**
   * 是否為可互動卡片(顯示 hover 效果)
   */
  interactive?: boolean

  /**
   * 內邊距變體
   */
  padding?: 'none' | 'sm' | 'md' | 'lg'

  /**
   * 是否為全寬卡片
   */
  fullWidth?: boolean
}

/**
 * PipBoyCard 元件
 *
 * @example
 * ```tsx
 * <PipBoyCard glowEffect interactive>
 *   <h2>卡片標題</h2>
 *   <p>卡片內容</p>
 * </PipBoyCard>
 * ```
 */
export function PipBoyCard({
  glowEffect = false,
  interactive = false,
  padding = 'md',
  fullWidth = false,
  className,
  children,
  ...props
}: PipBoyCardProps) {
  return (
    <div
      className={cn(
        // 基礎樣式
        'border-2 border-pip-boy-green',
        'bg-black/80 backdrop-blur-sm',
        'font-mono text-pip-boy-green',
        'transition-all duration-300',

        // 發光效果
        glowEffect && 'shadow-[0_0_20px_rgba(51,255,51,0.3)]',

        // 互動效果
        interactive && [
          'cursor-pointer',
          'hover:border-pip-boy-green/80',
          'hover:shadow-[0_0_25px_rgba(51,255,51,0.5)]',
          'hover:scale-[1.02]',
          'active:scale-100',
        ],

        // 內邊距
        padding === 'none' && 'p-0',
        padding === 'sm' && 'p-3',
        padding === 'md' && 'p-4 md:p-6',
        padding === 'lg' && 'p-6 md:p-8',

        // 全寬
        fullWidth && 'w-full',

        // 自定義類別
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * PipBoyCardHeader - 卡片標題區域
 */
export interface PipBoyCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 是否顯示底部邊框
   */
  bordered?: boolean
}

export function PipBoyCardHeader({
  bordered = true,
  className,
  children,
  ...props
}: PipBoyCardHeaderProps) {
  return (
    <div
      className={cn(
        'mb-4',
        bordered && 'border-b border-pip-boy-green/50 pb-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * PipBoyCardTitle - 卡片標題
 */
export function PipBoyCardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-lg md:text-xl font-bold uppercase tracking-wider',
        'text-pip-boy-green',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

/**
 * PipBoyCardContent - 卡片內容區域
 */
export function PipBoyCardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('text-sm md:text-base', className)} {...props}>
      {children}
    </div>
  )
}

/**
 * PipBoyCardFooter - 卡片頁腳
 */
export interface PipBoyCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 是否顯示頂部邊框
   */
  bordered?: boolean
}

export function PipBoyCardFooter({
  bordered = true,
  className,
  children,
  ...props
}: PipBoyCardFooterProps) {
  return (
    <div
      className={cn(
        'mt-4',
        bordered && 'border-t border-pip-boy-green/50 pt-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
