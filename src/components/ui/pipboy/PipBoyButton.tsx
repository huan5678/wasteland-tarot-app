'use client'

/**
 * PipBoyButton Component
 * Pip-Boy 風格按鈕元件 - 使用 CVA 變體系統重構
 *
 * 特色:
 * - 使用 class-variance-authority (CVA) 管理變體
 * - 支援 9 個變體: default, outline, destructive, secondary, ghost, link, success, warning, info
 * - 支援 6 個尺寸: xs, sm, default, lg, xl, icon
 * - 整合音效系統 (useAudioEffect)
 * - React 19 ref-as-prop 支援
 * - 完整 TypeScript 類型推斷
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useAudioEffect } from '@/hooks/audio/useAudioEffect';

/**
 * Button Variants Definition using CVA
 * 使用 CVA 定義按鈕變體系統
 */
const buttonVariants = cva(
  // 基礎樣式 - 所有變體共用
  [
    'inline-flex items-center justify-center',
    'font-semibold uppercase tracking-wider',
    'transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-pip-boy-green focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        // default: 對應舊的 primary - 實心背景
        default: [
          'bg-pip-boy-green text-black',
          'border-2 border-pip-boy-green',
          'hover:bg-pip-boy-green/80 hover:shadow-[0_0_15px_rgba(51,255,51,0.5)]',
          'active:bg-pip-boy-green/60',
        ],
        // outline: 對應舊的 secondary - 透明背景
        outline: [
          'bg-transparent text-pip-boy-green-bright',
          'border-2 border-pip-boy-green',
          'hover:bg-pip-boy-green/20 hover:shadow-[0_0_10px_rgba(51,255,51,0.3)] hover:text-pip-boy-green',
          'active:bg-pip-boy-green/10',
        ],
        // destructive: 錯誤/刪除操作 - Deep Red
        destructive: [
          'bg-[#ef4444] text-white',
          'border-2 border-[#ef4444]',
          'hover:bg-[#ef4444]/80 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]',
          'active:bg-[#ef4444]/60',
        ],
        // secondary: 次要操作 - Pip-Boy Bright Green (參考 Fallout 4 Pip-Boy UI)
        secondary: [
          'bg-[#4cfe51] text-black',
          'border-2 border-[#4cfe51]',
          'hover:bg-[#4cfe51]/85 hover:shadow-[0_0_20px_rgba(76,254,81,0.6)]',
          'active:bg-[#4cfe51]/70 active:shadow-[0_0_10px_rgba(76,254,81,0.4)]',
        ],
        // ghost: 幽靈按鈕 - 無邊框
        ghost: [
          'bg-transparent text-pip-boy-green',
          'border-0',
          'hover:bg-pip-boy-green/10 hover:text-pip-boy-green-bright',
          'active:bg-pip-boy-green/20',
        ],
        // link: 連結樣式
        link: [
          'bg-transparent text-pip-boy-green',
          'border-0',
          'underline-offset-4',
          'hover:underline hover:text-pip-boy-green-bright',
        ],
        // success: 成功狀態 - Bright Green
        success: [
          'bg-[#00ff41] text-black',
          'border-2 border-[#00ff41]',
          'hover:bg-[#00ff41]/80 hover:shadow-[0_0_15px_rgba(0,255,65,0.5)]',
          'active:bg-[#00ff41]/60',
        ],
        // warning: 警告狀態 - Warning Yellow
        warning: [
          'bg-[#ffdd00] text-black',
          'border-2 border-[#ffdd00]',
          'hover:bg-[#ffdd00]/80 hover:shadow-[0_0_15px_rgba(255,221,0,0.5)]',
          'active:bg-[#ffdd00]/60',
        ],
        // info: 資訊狀態 - Vault Blue
        info: [
          'bg-[#0055aa] text-white',
          'border-2 border-[#0055aa]',
          'hover:bg-[#0055aa]/80 hover:shadow-[0_0_15px_rgba(0,85,170,0.5)]',
          'active:bg-[#0055aa]/60',
        ],
      },
      size: {
        xs: 'px-2 py-1 text-xs h-7',
        sm: 'px-3 py-1.5 text-xs h-8',
        default: 'px-4 py-2 text-sm h-10',
        lg: 'px-6 py-3 text-base h-12',
        xl: 'px-8 py-4 text-lg h-14',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 * Button Props Interface
 * 使用 CVA VariantProps 自動生成類型
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * 是否停用音效
   * @default false
   */
  disableAudio?: boolean;

  /**
   * React 19 ref prop support
   */
  ref?: React.RefObject<HTMLButtonElement>;
}

/**
 * PipBoyButton Component
 *
 * @example
 * ```tsx
 * // Default variant (實心背景)
 * <PipBoyButton onClick={handleClick}>
 *   點擊我
 * </PipBoyButton>
 *
 * // Outline variant (透明背景)
 * <PipBoyButton variant="outline" onClick={handleClick}>
 *   取消
 * </PipBoyButton>
 *
 * // Destructive variant (錯誤操作)
 * <PipBoyButton variant="destructive" onClick={handleDelete}>
 *   刪除
 * </PipBoyButton>
 *
 * // Large size
 * <PipBoyButton variant="default" size="lg" onClick={handleClick}>
 *   開始解讀
 * </PipBoyButton>
 * ```
 */
export function PipBoyButton({
  variant,
  size,
  className,
  disableAudio = false,
  onClick,
  disabled,
  children,
  ref,
  ...props
}: ButtonProps) {
  const { playSound } = useAudioEffect();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // 播放按鈕點擊音效
    if (!disabled && !disableAudio) {
      playSound('button-click');
    }

    // 呼叫原始 onClick handler
    onClick?.(event);
  };

  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled}
      aria-disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * PipBoyIconButton - 圖示按鈕變體
 * 用於只包含圖示的按鈕
 *
 * @example
 * ```tsx
 * <PipBoyIconButton aria-label="關閉">
 *   <CloseIcon />
 * </PipBoyIconButton>
 * ```
 */
export interface PipBoyIconButtonProps extends Omit<ButtonProps, 'size'> {
  /**
   * 圖示按鈕尺寸 (正方形)
   */
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl';

  /**
   * ARIA label (必須提供，確保無障礙性)
   */
  'aria-label': string;
}

export function PipBoyIconButton({
  size = 'default',
  variant = 'ghost',
  className,
  children,
  ...props
}: PipBoyIconButtonProps) {
  // 將 size 映射為 icon size
  const iconSizeMap = {
    xs: 'h-7 w-7',
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-14 w-14',
  };

  return (
    <PipBoyButton
      variant={variant}
      size="icon"
      className={cn('aspect-square p-0', iconSizeMap[size], className)}
      {...props}
    >
      {children}
    </PipBoyButton>
  );
}

/**
 * Export variant types for external use
 * 匯出類型供外部使用
 */
export type ButtonVariant = NonNullable<ButtonProps['variant']>;
export type ButtonSize = NonNullable<ButtonProps['size']>;

/**
 * Export buttonVariants for custom styling
 * 匯出 buttonVariants 供自訂樣式使用
 */
export { buttonVariants };
