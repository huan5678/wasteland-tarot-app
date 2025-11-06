/**
 * PipBoyCard Component
 * Pip-Boy 風格卡片容器元件 - 使用 CVA 變體系統重構
 *
 * 特色:
 * - 使用 class-variance-authority (CVA) 管理變體
 * - 支援 4 個變體: default, elevated, ghost, interactive
 * - 支援 5 個 padding 選項: none, sm, default, lg, xl
 * - 雙層綠色邊框與終端機風格背景
 * - 整合音效系統與載入狀態
 * - 完整的子元件系統（對齊 shadcn/ui Card API）
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useAudioEffect } from '@/hooks/audio/useAudioEffect';

/**
 * Card Variants Definition using CVA
 * 使用 CVA 定義卡片變體系統
 */
const cardVariants = cva(
  // 基礎樣式 - 所有變體共用
  [
    'border-2 border-pip-boy-green',
    'bg-black/75 backdrop-blur-sm',
    'text-pip-boy-green',
    'transition-all duration-300',
  ],
  {
    variants: {
      variant: {
        // default: 標準卡片樣式
        default: [
          'border-pip-boy-green',
          'shadow-[0_0_10px_rgba(51,255,51,0.2)]',
        ],
        // elevated: 提升效果，更強的陰影
        elevated: [
          'border-pip-boy-green',
          'shadow-[0_0_20px_rgba(51,255,51,0.3)]',
          'hover:shadow-[0_0_25px_rgba(51,255,51,0.4)]',
        ],
        // ghost: 幽靈卡片，無邊框
        ghost: [
          'border-pip-boy-green/30',
          'bg-black/60',
          'shadow-none',
        ],
        // interactive: 互動卡片，支援 hover 效果
        interactive: [
          'cursor-pointer',
          'border-pip-boy-green',
          'hover:border-pip-boy-green-bright',
          'hover:shadow-[0_0_25px_rgba(51,255,51,0.5)]',
          'hover:scale-[1.02]',
          'active:scale-100',
          'active:shadow-[0_0_15px_rgba(51,255,51,0.3)_inset]',
        ],
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        default: 'p-4 md:p-6',
        lg: 'p-6 md:p-8',
        xl: 'p-8 md:p-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  }
);

/**
 * Card Props Interface
 * 使用 CVA VariantProps 自動生成類型
 */
export interface PipBoyCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * 是否顯示發光效果
   * @default false
   */
  glowEffect?: boolean;

  /**
   * 是否為可點擊卡片（顯示 hover 效果並播放音效）
   * @default false
   */
  isClickable?: boolean;

  /**
   * 是否停用音效
   * @default false
   */
  disableAudio?: boolean;

  /**
   * 是否顯示載入狀態（綠色脈衝動畫）
   * @default false
   */
  isLoading?: boolean;

  /**
   * 是否顯示四個角落的 Vault-Tec 裝飾圖示
   * @default false
   */
  showCornerIcons?: boolean;

  /**
   * 是否為全寬卡片
   * @default false
   */
  fullWidth?: boolean;
}

/**
 * PipBoyCard Component
 *
 * @example
 * ```tsx
 * // 標準卡片
 * <PipBoyCard>
 *   <PipBoyCardHeader>
 *     <PipBoyCardTitle>卡片標題</PipBoyCardTitle>
 *   </PipBoyCardHeader>
 *   <PipBoyCardContent>
 *     <p>卡片內容</p>
 *   </PipBoyCardContent>
 * </PipBoyCard>
 *
 * // 互動卡片
 * <PipBoyCard variant="interactive" isClickable onClick={handleClick}>
 *   <PipBoyCardTitle>點擊我</PipBoyCardTitle>
 * </PipBoyCard>
 *
 * // 載入狀態卡片
 * <PipBoyCard isLoading>
 *   <PipBoyCardContent>載入中...</PipBoyCardContent>
 * </PipBoyCard>
 * ```
 */
export function PipBoyCard({
  variant,
  padding,
  glowEffect = false,
  isClickable = false,
  disableAudio = false,
  isLoading = false,
  showCornerIcons = false,
  fullWidth = false,
  className,
  onClick,
  children,
  ...props
}: PipBoyCardProps) {
  const { playSound } = useAudioEffect();

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // 播放卡片點擊音效
    if (isClickable && !disableAudio) {
      playSound('card-click');
    }

    // 呼叫原始 onClick handler
    onClick?.(event);
  };

  return (
    <div
      className={cn(
        cardVariants({ variant: isClickable ? 'interactive' : variant, padding }),
        glowEffect && 'shadow-[0_0_20px_rgba(51,255,51,0.3)] animate-pulse-glow',
        isLoading && 'animate-pulse shadow-[0_0_20px_rgba(51,255,51,0.4)]',
        fullWidth && 'w-full',
        showCornerIcons && 'relative',
        className
      )}
      onClick={isClickable ? handleClick : onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      {...props}
    >
      {/* Vault-Tec 角落裝飾圖示 */}
      {showCornerIcons && (
        <>
          <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-pip-boy-green" />
          <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-pip-boy-green" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-pip-boy-green" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-pip-boy-green" />
        </>
      )}

      {children}
    </div>
  );
}

/**
 * PipBoyCardHeader - 卡片標題區域
 */
export interface PipBoyCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 是否顯示底部邊框
   * @default true
   */
  bordered?: boolean;
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
  );
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
  );
}

/**
 * PipBoyCardDescription - 卡片描述（新增）
 */
export function PipBoyCardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-sm text-pip-boy-green/70 mt-1',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
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
  );
}

/**
 * PipBoyCardFooter - 卡片頁腳
 */
export interface PipBoyCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 是否顯示頂部邊框
   * @default true
   */
  bordered?: boolean;
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
  );
}

/**
 * Export variant types for external use
 * 匯出類型供外部使用
 */
export type CardVariant = NonNullable<PipBoyCardProps['variant']>;
export type CardPadding = NonNullable<PipBoyCardProps['padding']>;

/**
 * Export cardVariants for custom styling
 * 匯出 cardVariants 供自訂樣式使用
 */
export { cardVariants };
