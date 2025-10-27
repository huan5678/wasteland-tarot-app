/**
 * SuccessPulse 元件
 *
 * 成功狀態動畫元件，顯示脈衝效果的成功圖示
 *
 * Requirements: 7.5, 7.6
 *
 * @example
 * ```tsx
 * <SuccessPulse onComplete={() => console.log('Done')} />
 * <SuccessPulse size="lg" duration={2000} />
 * ```
 */

import { useEffect } from 'react'
import { PixelIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

export interface SuccessPulseProps {
  /**
   * 動畫完成回調
   */
  onComplete?: () => void

  /**
   * 動畫持續時間（毫秒）
   * @default 1500
   */
  duration?: number

  /**
   * 圖示尺寸
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * 自訂 className
   */
  className?: string
}

const sizeConfig = {
  sm: 48,
  md: 64,
  lg: 96,
} as const

/**
 * SuccessPulse - 成功狀態動畫
 *
 * 特色:
 * - 使用 PixelIcon checkbox-circle 圖示
 * - 成功色變體 (#00ff41)
 * - 脈衝動畫效果
 * - 縮放進入動畫
 * - 可選的完成回調
 * - 響應式尺寸
 */
export function SuccessPulse({
  onComplete,
  duration = 1500,
  size = 'md',
  className,
}: SuccessPulseProps) {
  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, duration)
      return () => clearTimeout(timer)
    }
  }, [onComplete, duration])

  return (
    <div
      className={cn(
        'flex items-center justify-center animate-scale-in',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <PixelIcon
        name="checkbox-circle"
        size={sizeConfig[size]}
        variant="success"
        className="animate-pip-boy-pulse"
        decorative
      />
    </div>
  )
}
