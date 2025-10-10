import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useAudioEffect } from "@/hooks/audio/useAudioEffect"

/**
 * Button component variants using class-variance-authority.
 *
 * Variants:
 * - default: Primary Pip-Boy green button with glow effect
 * - destructive: Radiation danger themed button for delete/remove actions
 * - outline: Secondary action button with transparent background
 * - secondary: Tertiary action button with dark background
 * - ghost: Minimal impact button with transparent background
 * - link: Inline navigation link with underline on hover
 * - warning: Vault warning themed button for caution actions
 * - success: Success themed button with Pip-Boy green
 * - info: Info themed button with vault blue styling
 *
 * Sizes:
 * - sm: 32px height (small)
 * - default: 36px height (standard)
 * - lg: 40px height (large)
 * - xl: 44px height (extra large, optimal touch target)
 * - icon: 36x36px square (icon-only button)
 * - icon-lg: 44x44px square (large icon button, touch-friendly)
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-border-focus/50",
  {
    variants: {
      variant: {
        default:
          "btn-pip-boy",
        destructive:
          "btn-radiation-danger",
        outline:
          "btn-wasteland-secondary",
        secondary:
          "bg-bg-secondary text-text-primary border border-border-secondary hover:bg-bg-tertiary hover:border-border-primary focus-visible:ring-border-focus",
        ghost:
          "text-text-primary hover:bg-bg-secondary hover:text-text-primary",
        link: "text-link hover:text-link-hover underline-offset-4 hover:underline link-pip-boy",
        warning:
          "btn-vault-warning",
        success:
          "btn-success-green",
        info:
          "bg-info text-white border border-info-border hover:bg-info-border focus-visible:ring-info glow-blue",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-11 rounded-md px-8 has-[>svg]:px-5 text-base",
        icon: "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  disableSound = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    disableSound?: boolean
  }) {
  const Comp = asChild ? Slot : "button"
  const { playSound } = useAudioEffect()

  const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // 播放按鈕點擊音效
    if (!disableSound) {
      playSound('button-click')
    }

    // 呼叫原本的 onClick
    props.onClick?.(e)
  }, [disableSound, playSound, props])

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
      onClick={handleClick}
    />
  )
}

export { Button, buttonVariants }
