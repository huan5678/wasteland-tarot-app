'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

/**
 * PipBoyLabel - Pip-Boy 終端機風格標籤
 *
 * 基於 Radix UI Label Primitive，提供正確的表單關聯
 *
 * @example
 * ```tsx
 * <PipBoyLabel htmlFor="username" required>
 *   使用者名稱
 * </PipBoyLabel>
 * <PipBoyInput id="username" />
 * ```
 */

export interface PipBoyLabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  /**
   * 是否為必填欄位（顯示紅色 *）
   */
  required?: boolean
}

const PipBoyLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  PipBoyLabelProps
>(({ className, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none',
      'text-pip-boy-green',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-40',
      'font-[family-name:var(--font-cubic),monospace]',
      className
    )}
    style={{ fontFamily: 'var(--font-cubic), monospace' }}
    {...props}
  >
    {children}
    {required && (
      <span className="ml-1 text-deep-red" aria-label="必填">
        *
      </span>
    )}
  </LabelPrimitive.Root>
))

PipBoyLabel.displayName = 'PipBoyLabel'

export { PipBoyLabel }
