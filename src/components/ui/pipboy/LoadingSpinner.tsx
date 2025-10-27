/**
 * LoadingSpinner Component
 * Pip-Boy 風格載入動畫元件
 *
 * 特色:
 * - 旋轉輻射符號動畫
 * - 綠色發光效果
 * - 三種尺寸變體
 * - 可選的載入文字
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { PixelIcon } from '@/components/ui/icons/PixelIcon'

export interface LoadingSpinnerProps {
  /**
   * 載入動畫大小
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * 載入文字(可選)
   */
  text?: string

  /**
   * 是否置中顯示
   */
  centered?: boolean

  /**
   * 自定義類別
   */
  className?: string
}

/**
 * LoadingSpinner 元件
 *
 * @example
 * ```tsx
 * <LoadingSpinner size="md" text="載入中..." centered />
 * ```
 */
export function LoadingSpinner({
  size = 'md',
  text,
  centered = false,
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3',
        centered && 'justify-center min-h-[200px]',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={text || '載入中'}
      suppressHydrationWarning
    >
      {/* 輻射符號旋轉動畫 */}
      <div
        className="animate-spin"
        style={{
          filter: 'drop-shadow(0 0 10px rgba(51, 255, 51, 0.7))',
          animationDuration: '2s',
        }}
        suppressHydrationWarning
      >
        <PixelIcon
          name="loader-3-line"
          size={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
          className="text-pip-boy-green"
          decorative
        />
      </div>

      {/* 載入文字 */}
      {text && (
        <p
          className={cn(
            'text-pip-boy-green uppercase tracking-wider animate-pulse',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base'
          )}
          suppressHydrationWarning
        >
          {text}
        </p>
      )}

      {/* 視覺上隱藏但螢幕閱讀器可讀 */}
      <span className="sr-only">{text || '載入中,請稍候...'}</span>
    </div>
  )
}

/**
 * LoadingDots - 點狀載入動畫(替代變體)
 *
 * 較輕量的載入指示器,適用於按鈕或小型區域
 */
export interface LoadingDotsProps {
  /**
   * 點的大小
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * 自定義類別
   */
  className?: string
}

export function LoadingDots({ size = 'md', className }: LoadingDotsProps) {
  return (
    <div
      className={cn('flex items-center gap-1', className)}
      role="status"
      aria-label="載入中"
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            'rounded-full bg-pip-boy-green animate-bounce',
            size === 'sm' && 'h-1 w-1',
            size === 'md' && 'h-1.5 w-1.5',
            size === 'lg' && 'h-2 w-2'
          )}
          style={{
            animationDelay: `${index * 0.15}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
      <span className="sr-only">載入中</span>
    </div>
  )
}

/**
 * LoadingOverlay - 全螢幕載入覆蓋層
 *
 * 用於阻擋整個頁面的載入狀態
 */
export interface LoadingOverlayProps {
  /**
   * 是否顯示覆蓋層
   */
  show: boolean

  /**
   * 載入文字
   */
  text?: string

  /**
   * 背景透明度
   */
  opacity?: 'light' | 'medium' | 'heavy'
}

export function LoadingOverlay({ show, text, opacity = 'medium' }: LoadingOverlayProps) {
  if (!show) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        'flex items-center justify-center',
        'backdrop-blur-sm',
        opacity === 'light' && 'bg-black/50',
        opacity === 'medium' && 'bg-black/70',
        opacity === 'heavy' && 'bg-black/90'
      )}
      role="dialog"
      aria-modal="true"
      aria-label="載入中"
    >
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

/**
 * LoadingSkeleton - 骨架屏載入元件
 *
 * 用於內容載入時的佔位符
 */
export interface LoadingSkeletonProps {
  /**
   * 骨架屏行數
   */
  lines?: number

  /**
   * 高度
   */
  height?: string

  /**
   * 自定義類別
   */
  className?: string
}

export function LoadingSkeleton({ lines = 3, height = 'h-4', className }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="載入中">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'animate-pulse rounded',
            'bg-pip-boy-green/20',
            'border border-pip-boy-green/30',
            height,
            // 最後一行稍短
            index === lines - 1 && 'w-3/4'
          )}
          style={{
            animationDelay: `${index * 0.1}s`,
          }}
        />
      ))}
      <span className="sr-only">載入中</span>
    </div>
  )
}
