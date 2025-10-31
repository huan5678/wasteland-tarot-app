import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * PipBoyInput - Pip-Boy 終端機風格輸入框
 *
 * 對齊 shadcn/ui Input API，使用 Pip-Boy Green 配色與 Cubic 11 字體
 *
 * @example
 * ```tsx
 * <PipBoyInput
 *   type="text"
 *   placeholder="輸入訊息..."
 *   error="錯誤訊息"
 * />
 * ```
 */

export interface PipBoyInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * 錯誤訊息（顯示於輸入框下方）
   */
  error?: string
  /**
   * React 19 ref-as-prop
   */
  ref?: React.RefObject<HTMLInputElement>
}

export const PipBoyInput = ({
  className,
  type = 'text',
  error,
  ref,
  ...props
}: PipBoyInputProps) => {
  return (
    <div className="w-full">
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-10 w-full px-3 py-2',
          'border-2 transition-colors',
          'bg-wasteland-dark/50',
          'text-pip-boy-green placeholder:text-pip-boy-green/40',
          'focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-40',
          // 正常狀態邊框
          error ? 'border-deep-red' : 'border-pip-boy-green/50',
          // focus 狀態 - 綠色脈衝外框
          !error && 'focus-visible:border-pip-boy-green focus-visible:shadow-[0_0_10px_rgba(0,255,136,0.5)]',
          // hover 狀態
          !error && 'hover:border-pip-boy-green/70',
          // 字體
          'font-[family-name:var(--font-cubic),monospace]',
          className
        )}
        style={{ fontFamily: 'var(--font-cubic), monospace' }}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${props.id}-error` : undefined}
        {...props}
      />
      {error && (
        <p
          id={`${props.id}-error`}
          className="mt-2 text-sm text-radiation-orange"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}

PipBoyInput.displayName = 'PipBoyInput'
