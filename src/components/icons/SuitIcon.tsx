/**
 * SuitIcon Component
 * 花色圖示包裝元件
 *
 * 為 lucide-react 圖示提供一致的 Pip-Boy 風格樣式
 *
 * @example
 * ```tsx
 * import { Sparkles } from 'lucide-react'
 * import { SuitIcon } from '@/components/icons/SuitIcon'
 *
 * <SuitIcon Icon={Sparkles} size="lg" ariaHidden />
 * ```
 */

'use client'

import { cn } from '@/lib/utils'
import type { SuitIconProps } from '@/types/icons'

export function SuitIcon({
  Icon,
  size = 'lg',
  className,
  ariaLabel,
  ariaHidden = false,
  strokeWidth = 1.5,
}: SuitIconProps) {
  // 執行時保護 (TypeScript 應在編譯時捕捉此錯誤)
  if (!Icon) {
    console.error('[SuitIcon] Icon prop is required')
    return null
  }

  // 尺寸映射
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24',
    xl: 'w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28',
  }

  // 回退至預設 size 如果提供的 size 無效
  const sizeClass = sizeClasses[size] || sizeClasses.lg

  return (
    <Icon
      className={cn(
        sizeClass,
        'text-pip-boy-green transition-transform duration-300',
        className
      )}
      style={{
        filter: 'drop-shadow(0 0 10px rgba(51, 255, 51, 0.4))',
      }}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
      strokeWidth={strokeWidth}
    />
  )
}
