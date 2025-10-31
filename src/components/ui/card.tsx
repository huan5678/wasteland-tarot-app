/**
 * Card Component - Pip-Boy Style
 * 整合版本: 結合 pipboy-ui-vibe 結構 + PipBoyCard 功能
 *
 * Features:
 * - 4 variants: default, elevated, ghost, interactive
 * - 5 padding options: none, sm, default, lg, xl
 * - glowEffect, isClickable, isLoading props
 * - Audio effects integration
 * - React 19 ref-as-prop support
 * - OKLCH color system
 * - Complete subcomponent API (Header, Title, Description, Content, Footer)
 *
 * @see https://github.com/huan5678/pipboy-ui-vibe
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useAudioEffect } from '@/hooks/audio/useAudioEffect';

/**
 * Card Variants Definition using CVA
 * 使用 OKLCH 色彩系統
 */
const cardVariants = cva(
  [
    'border-2',
    'backdrop-blur-sm',
    'transition-all duration-300',
  ],
  {
    variants: {
      variant: {
        // default: Standard card with OKLCH colors
        default: [
          'bg-card text-card-foreground',
          'border-border',
          'shadow-sm',
        ],
        // elevated: Enhanced shadow effect
        elevated: [
          'bg-card text-card-foreground',
          'border-primary/50',
          'shadow-[0_0_20px_hsl(var(--primary)/0.3)]',
          'hover:shadow-[0_0_25px_hsl(var(--primary)/0.4)]',
        ],
        // ghost: Subtle card
        ghost: [
          'bg-card/60 text-card-foreground',
          'border-border/30',
          'shadow-none',
        ],
        // interactive: Clickable card
        interactive: [
          'bg-card text-card-foreground',
          'border-primary',
          'cursor-pointer',
          'hover:border-primary/80',
          'hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)]',
          'hover:scale-[1.02]',
          'active:scale-100',
          'active:shadow-[0_0_15px_hsl(var(--primary)/0.3)_inset]',
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
 */
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * Enable glow effect
   * @default false
   */
  glowEffect?: boolean;

  /**
   * Make card clickable (adds hover effects and plays audio)
   * @default false
   */
  isClickable?: boolean;

  /**
   * Disable audio effects
   * @default false
   */
  disableAudio?: boolean;

  /**
   * Show loading state (pulse animation)
   * @default false
   */
  isLoading?: boolean;

  /**
   * Show Vault-Tec corner decorations
   * @default false
   */
  showCornerIcons?: boolean;

  /**
   * Full width card
   * @default false
   */
  fullWidth?: boolean;

  /**
   * React 19 ref prop support
   */
  ref?: React.RefObject<HTMLDivElement>;
}

/**
 * Card Component
 *
 * @example
 * ```tsx
 * // Standard card
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Card content</p>
 *   </CardContent>
 * </Card>
 *
 * // Interactive card
 * <Card variant="interactive" isClickable onClick={handleClick}>
 *   <CardTitle>Click me</CardTitle>
 * </Card>
 *
 * // Loading state
 * <Card isLoading>
 *   <CardContent>Loading...</CardContent>
 * </Card>
 * ```
 */
export function Card({
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
  ref,
  ...props
}: CardProps) {
  const { playSound } = useAudioEffect();

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Play card click sound
    if (isClickable && !disableAudio) {
      playSound('card-click');
    }

    // Call original onClick handler
    onClick?.(event);
  };

  return (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant: isClickable ? 'interactive' : variant, padding }),
        glowEffect && 'shadow-[0_0_20px_hsl(var(--primary)/0.3)] animate-pulse-glow',
        isLoading && 'animate-pulse shadow-[0_0_20px_hsl(var(--primary)/0.4)]',
        fullWidth && 'w-full',
        showCornerIcons && 'relative',
        className
      )}
      onClick={isClickable ? handleClick : onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      {...props}
    >
      {/* Vault-Tec corner decorations */}
      {showCornerIcons && (
        <>
          <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-primary" />
          <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-primary" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-primary" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-primary" />
        </>
      )}

      {children}
    </div>
  );
}

/**
 * CardHeader - Card header section
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Show bottom border
   * @default true
   */
  bordered?: boolean;

  /**
   * React 19 ref prop support
   */
  ref?: React.RefObject<HTMLDivElement>;
}

export function CardHeader({
  bordered = true,
  className,
  children,
  ref,
  ...props
}: CardHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn(
        'mb-4',
        bordered && 'border-b border-border/50 pb-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardTitle - Card title
 */
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * React 19 ref prop support
   */
  ref?: React.RefObject<HTMLHeadingElement>;
}

export function CardTitle({
  className,
  children,
  ref,
  ...props
}: CardTitleProps) {
  return (
    <h3
      ref={ref}
      className={cn(
        'text-lg md:text-xl font-bold uppercase tracking-wider',
        'text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * CardDescription - Card description
 */
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /**
   * React 19 ref prop support
   */
  ref?: React.RefObject<HTMLParagraphElement>;
}

export function CardDescription({
  className,
  children,
  ref,
  ...props
}: CardDescriptionProps) {
  return (
    <p
      ref={ref}
      className={cn(
        'text-sm text-muted-foreground mt-1',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * CardContent - Card content section
 */
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * React 19 ref prop support
   */
  ref?: React.RefObject<HTMLDivElement>;
}

export function CardContent({
  className,
  children,
  ref,
  ...props
}: CardContentProps) {
  return (
    <div
      ref={ref}
      className={cn('text-sm md:text-base', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardFooter - Card footer section
 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Show top border
   * @default true
   */
  bordered?: boolean;

  /**
   * React 19 ref prop support
   */
  ref?: React.RefObject<HTMLDivElement>;
}

export function CardFooter({
  bordered = true,
  className,
  children,
  ref,
  ...props
}: CardFooterProps) {
  return (
    <div
      ref={ref}
      className={cn(
        'mt-4',
        bordered && 'border-t border-border/50 pt-3',
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
 */
export type CardVariant = NonNullable<CardProps['variant']>;
export type CardPadding = NonNullable<CardProps['padding']>;

/**
 * Export cardVariants for custom styling
 */
export { cardVariants };
