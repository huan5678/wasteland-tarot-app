/**
 * SuitIcon Component
 * 花色圖示包裝元件
 *
 * 為 PixelIcon 提供一致的 Pip-Boy 風格樣式
 *
 * @example
 * ```tsx
 * import { SuitIcon } from '@/components/icons/SuitIcon'
 *
 * <SuitIcon iconName="sparkles" size="lg" ariaHidden />
 * ```
 */

'use client'

import { cn } from '@/lib/utils'
import { PixelIcon } from '@/components/ui/icons'
import type { SuitIconProps } from '@/types/icons'

export function SuitIcon({
  iconName,
  size = 'lg',
  className,
  ariaLabel,
  ariaHidden = false,
}: SuitIconProps) {
  // 執行時保護
  if (!iconName) {
    console.error('[SuitIcon] iconName prop is required')
    return null
  }

  // 尺寸映射 (轉換為 px)
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 80,
  }

  const pixelSize = sizeMap[size] || sizeMap.lg

  return (
    <PixelIcon
      name={iconName as any}
      size={pixelSize}
      className={cn(
        'text-pip-boy-green transition-transform duration-300',
        className
      )}
      style={{
        filter: 'drop-shadow(0 0 10px rgba(51, 255, 51, 0.4))',
      }}
      aria-label={ariaLabel}
      decorative={ariaHidden}
    />
  )
}
