import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { icons, iconSizes, type IconName, type IconSize } from "@/lib/icons"

/**
 * Icon component with standardized sizing.
 *
 * Sizes:
 * - xs: 16px (inline text icons)
 * - sm: 20px (button icons, form field icons)
 * - base/md: 24px (default size)
 * - lg: 32px (section headers)
 * - xl: 48px (hero icons, empty states)
 *
 * @example
 * ```tsx
 * <Icon name="check-circle" size="sm" />
 * <Icon name="alert-triangle" size="lg" className="text-warning" />
 * ```
 */
const iconVariants = cva("", {
  variants: {
    size: {
      xs: "size-4",
      sm: "size-5",
      base: "size-6",
      md: "size-6",
      lg: "size-8",
      xl: "size-12",
    },
  },
  defaultVariants: {
    size: "base",
  },
})

export interface IconProps
  extends Omit<React.SVGProps<SVGSVGElement>, "size">,
    VariantProps<typeof iconVariants> {
  /**
   * Icon name from the icon registry
   */
  name: IconName
  /**
   * Icon size
   */
  size?: IconSize
}

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, size = "base", className, ...props }, ref) => {
    const IconComponent = icons[name]
    const sizeValue = iconSizes[size]

    if (!IconComponent) {
      console.warn(`Icon "${name}" not found in registry`)
      return null
    }

    return (
      <IconComponent
        ref={ref}
        size={sizeValue}
        className={cn(iconVariants({ size, className }))}
        {...props}
      />
    )
  }
)
Icon.displayName = "Icon"

export { Icon, iconVariants }
