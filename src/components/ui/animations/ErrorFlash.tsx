/**
 * ErrorFlash 元件
 *
 * 錯誤狀態動畫元件，顯示搖晃效果的錯誤圖示和訊息
 *
 * Requirements: 7.5, 7.6
 *
 * @example
 * ```tsx
 * <ErrorFlash message="連線失敗，請重試" />
 * <ErrorFlash size="lg" />
 * ```
 */

import { PixelIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

export interface ErrorFlashProps {
  /**
   * 錯誤訊息文字（選填）
   */
  message?: string

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
  sm: {
    icon: 48,
    text: 'text-sm',
  },
  md: {
    icon: 64,
    text: 'text-base',
  },
  lg: {
    icon: 96,
    text: 'text-lg',
  },
} as const

/**
 * ErrorFlash - 錯誤狀態動畫
 *
 * 特色:
 * - 使用 PixelIcon error-warning 圖示
 * - 錯誤色變體 (#ef4444)
 * - 搖晃動畫效果
 * - 文字脈衝動畫
 * - 響應式尺寸
 * - 支援 role="alert" 無障礙
 */
export function ErrorFlash({
  message,
  size = 'md',
  className,
}: ErrorFlashProps) {
  const config = sizeConfig[size]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        className
      )}
      role={message ? 'alert' : undefined}
      aria-live={message ? 'assertive' : undefined}
    >
      {/* 錯誤圖示 */}
      <PixelIcon
        name="error-warning"
        size={config.icon}
        variant="error"
        className="animate-wiggle"
        decorative={!message}
      />

      {/* 錯誤訊息（選填） */}
      {message && (
        <p
          className={cn(
            'text-red-500 font-cubic animate-pulse text-center max-w-md',
            config.text
          )}
        >
          {message}
        </p>
      )}
    </div>
  )
}
