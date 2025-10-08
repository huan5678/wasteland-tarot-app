import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Textarea component variants using class-variance-authority.
 *
 * Variants:
 * - default: Standard textarea field with terminal styling
 * - error: Error state with red border and aria-invalid
 * - success: Success state with green border
 */
const textareaVariants = cva(
  "input-terminal flex w-full rounded-md px-3 py-2 text-base shadow-sm disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200 outline-none focus:outline-2 focus:outline-offset-1 focus:shadow-[0_0_0_3px_var(--color-input-focus-ring)] resize-y min-h-[80px]",
  {
    variants: {
      variant: {
        default: "border-input-border focus:border-input-border-focus",
        error: "border-error focus:border-error",
        success: "border-success focus:border-success",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TextareaProps
  extends React.ComponentProps<"textarea">,
    VariantProps<typeof textareaVariants> {
  /**
   * Helper text to display below the textarea
   */
  helperText?: string
  /**
   * Error message to display (automatically sets variant to "error")
   */
  errorMessage?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, helperText, errorMessage, ...props }, ref) => {
    const id = props.id || React.useId()
    const helperId = `${id}-helper`
    const errorId = `${id}-error`

    // Automatically set variant to error if errorMessage is provided
    const computedVariant = errorMessage ? "error" : variant

    return (
      <div className="w-full">
        <textarea
          id={id}
          className={cn(textareaVariants({ variant: computedVariant, className }))}
          ref={ref}
          aria-invalid={computedVariant === "error" ? "true" : undefined}
          aria-describedby={
            errorMessage
              ? errorId
              : helperText
              ? helperId
              : undefined
          }
          {...props}
        />
        {helperText && !errorMessage && (
          <p id={helperId} className="mt-1.5 text-sm text-text-muted">
            {helperText}
          </p>
        )}
        {errorMessage && (
          <p id={errorId} className="mt-1.5 text-sm text-error" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
