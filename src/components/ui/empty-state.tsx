import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * EmptyState component for displaying empty data states.
 *
 * This component provides a centered layout with icon, title, description,
 * and optional action button slots.
 */
const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center space-y-4",
  {
    variants: {
      size: {
        sm: "py-8 px-4",
        md: "py-12 px-6",
        lg: "py-16 px-8",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  /**
   * Icon to display at the top (React node, typically a Lucide icon)
   */
  icon?: React.ReactNode
  /**
   * Title text for the empty state
   */
  title: string
  /**
   * Optional description text
   */
  description?: string
  /**
   * Optional action button or component
   */
  action?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, size, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(emptyStateVariants({ size, className }))}
        {...props}
      >
        {icon && (
          <div className="text-text-muted" aria-hidden="true">
            {icon}
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-lg font-mono font-semibold text-text-primary">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-text-muted max-w-md">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="pt-2">
            {action}
          </div>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export { EmptyState, emptyStateVariants }
