import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * LoadingState component with size variants.
 *
 * Sizes:
 * - sm: Small spinner (24px) for inline loading
 * - md: Medium spinner (48px) for card loading
 * - lg: Large spinner (96px) for full-page loading
 */
const loadingStateVariants = cva(
  "inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]",
  {
    variants: {
      size: {
        sm: "size-6",
        md: "size-12",
        lg: "size-24",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface LoadingStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingStateVariants> {
  /**
   * Optional loading message to display below the spinner
   */
  message?: string
}

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ className, size, message, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn("flex flex-col items-center justify-center gap-4", className)}
        {...props}
      >
        <div
          className={cn(loadingStateVariants({ size }), "text-pip-boy")}
          aria-hidden="true"
        />
        {message && (
          <p className="text-sm text-text-muted text-center">{message}</p>
        )}
        <span className="sr-only">Loading...</span>
      </div>
    )
  }
)
LoadingState.displayName = "LoadingState"

export { LoadingState, loadingStateVariants }
