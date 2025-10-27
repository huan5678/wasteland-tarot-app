/**
 * PipBoyLoader 元件
 *
 * Pip-Boy 主題載入動畫元件，使用掃描線效果和脈衝動畫
 *
 * Requirements: 7.3, 7.4, 7.5
 *
 * @example
 * ```tsx
 * <PipBoyLoader text="載入避難所資料..." />
 * <PipBoyLoader size="lg" />
 * ```
 */

import { PixelIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

export interface PipBoyLoaderProps {
  /**
   * 載入提示文字
   * @default "Pip-Boy 掃描中..."
   */
  text?: string

  /**
   * 元件尺寸
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
 * PipBoyLoader - Pip-Boy 主題載入動畫
 *
 * 特色:
 * - 使用 PixelIcon loader-4 圖示配合旋轉動畫
 * - Pip-Boy 綠色主題 (#00ff88)
 * - 掃描線效果（可選）
 * - 文字脈衝動畫
 * - 響應式尺寸
 * - 支援 prefers-reduced-motion
 */
export function PipBoyLoader({
  text = 'Pip-Boy 掃描中...',
  size = 'md',
  className,
}: PipBoyLoaderProps) {
  const config = sizeConfig[size]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Loader 圖示容器（含掃描線效果） */}
      <div className="relative">
        {/* 主要 Loader 圖示 */}
        <PixelIcon
          name="loader-4"
          size={config.icon}
          className="text-pip-boy-green animate-spin"
          decorative
        />

        {/* 掃描線效果（可選） */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="absolute w-full h-0.5 bg-pip-boy-green/30 animate-scanline"
            style={{
              boxShadow: '0 0 8px rgba(0, 255, 136, 0.5)',
            }}
          />
        </div>
      </div>

      {/* 載入文字 */}
      <p
        className={cn(
          'text-pip-boy-green font-cubic animate-pulse',
          config.text
        )}
      >
        {text}
      </p>
    </div>
  )
}
