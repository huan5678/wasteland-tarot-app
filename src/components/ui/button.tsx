/**
 * Button Component - Pip-Boy Style
 * 整合版本: 結合 pipboy-ui-vibe 結構 + PipBoyButton 功能
 *
 * Features:
 * - 9 variants: default, outline, destructive, secondary, ghost, link, success, warning, info
 * - 6 sizes: xs, sm, default, lg, xl, icon
 * - Audio effects integration (useAudioEffect)
 * - React 19 ref-as-prop support
 * - OKLCH color system
 * - Radix UI Slot support (asChild prop)
 *
 * @see https://github.com/huan5678/pipboy-ui-vibe
 */

import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useAudioEffect } from '@/hooks/audio/useAudioEffect';

/**
 * Button Variants Definition using CVA
 * 使用 OKLCH 色彩系統和 shadcn-ui 標準變數
 */
const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'whitespace-nowrap',
    'font-semibold uppercase tracking-wider',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        // default: Primary Pip-Boy green (使用 OKLCH --primary)
        default: [
          'bg-primary text-primary-foreground',
          'border-2 border-primary',
          'hover:bg-primary/90 hover:shadow-[0_0_15px_hsl(var(--primary)/0.5)]',
          'active:bg-primary/80',
        ],
        // outline: Transparent with border
        outline: [
          'bg-transparent text-primary',
          'border-2 border-primary',
          'hover:bg-primary/20 hover:shadow-[0_0_10px_hsl(var(--primary)/0.3)]',
          'active:bg-primary/10',
        ],
        // destructive: Error/delete actions (使用 OKLCH --destructive)
        destructive: [
          'bg-destructive text-destructive-foreground',
          'border-2 border-destructive',
          'hover:bg-destructive/90 hover:shadow-[0_0_15px_hsl(var(--destructive)/0.5)]',
          'active:bg-destructive/80',
        ],
        // secondary: Secondary actions (使用 OKLCH --secondary)
        secondary: [
          'bg-secondary text-secondary-foreground',
          'border-2 border-secondary',
          'hover:bg-secondary/80 hover:shadow-[0_0_15px_hsl(var(--secondary)/0.5)]',
          'active:bg-secondary/70',
        ],
        // ghost: No border, subtle hover
        ghost: [
          'bg-transparent text-primary',
          'border-0',
          'hover:bg-accent hover:text-accent-foreground',
          'active:bg-accent/80',
        ],
        // link: Link style
        link: [
          'bg-transparent text-primary',
          'border-0',
          'underline-offset-4',
          'hover:underline hover:text-primary/90',
        ],
        // success: Success state - Bright Green
        success: [
          'bg-pip-boy-green-bright text-black',
          'border-2 border-pip-boy-green-bright',
          'hover:bg-pip-boy-green-bright/80 hover:shadow-[0_0_15px_rgba(0,255,65,0.5)]',
          'active:bg-pip-boy-green-bright/70',
        ],
        // warning: Warning state - Warning Yellow
        warning: [
          'bg-warning-yellow text-black',
          'border-2 border-warning-yellow',
          'hover:bg-warning-yellow/80 hover:shadow-[0_0_15px_rgba(255,221,0,0.5)]',
          'active:bg-warning-yellow/70',
        ],
        // info: Information state - Vault Blue
        info: [
          'bg-vault-blue-light text-white',
          'border-2 border-vault-blue-light',
          'hover:bg-vault-blue-light/80 hover:shadow-[0_0_15px_rgba(0,85,170,0.5)]',
          'active:bg-vault-blue-light/70',
        ],
      },
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        'icon-xxs': 'h-4 w-4 p-0',
        'icon-xs': 'h-6 w-6 p-0',
        'icon-sm': 'h-7 w-7 p-0',
        icon: 'h-10 w-10 p-0',
        'icon-lg': 'h-12 w-12 p-0',
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
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Render as a child component (Radix Slot pattern)
   * @default false
   */
  asChild?: boolean;

  /**
   * Disable audio effects
   * @default false
   */
  disableAudio?: boolean;

  /**
   * React 19 ref prop support
   */
  ref?: React.RefObject<HTMLButtonElement>;
}

/**
 * Button Component
 *
 * @example
 * ```tsx
 * // Default variant (solid background)
 * <Button onClick={handleClick}>
 *   Click me
 * </Button>
 *
 * // Outline variant (transparent)
 * <Button variant="outline" onClick={handleClick}>
 *   Cancel
 * </Button>
 *
 * // Destructive variant (error action)
 * <Button variant="destructive" onClick={handleDelete}>
 *   Delete
 * </Button>
 *
 * // Large size
 * <Button size="lg" onClick={handleClick}>
 *   Start Reading
 * </Button>
 *
 * // As child (Slot pattern)
 * <Button asChild>
 *   <a href="/readings">Go to Readings</a>
 * </Button>
 * ```
 */
export function Button({
  className,
  variant,
  size,
  asChild = false,
  disableAudio = false,
  onClick,
  disabled,
  ref,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  const { playSound } = useAudioEffect();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Play button click sound
    if (!disabled && !disableAudio) {
      playSound('button-click');
    }

    // Call original onClick handler
    onClick?.(event);
  };

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={disabled}
      aria-disabled={disabled}
      onClick={handleClick}
      {...props}
    />
  );
}

/**
 * Export variant types for external use
 */
export type ButtonVariant = NonNullable<ButtonProps['variant']>;
export type ButtonSize = NonNullable<ButtonProps['size']>;

/**
 * Export buttonVariants for custom styling
 */
export { buttonVariants };
