import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Input component variants using class-variance-authority.
 *
 * Variants:
 * - default: Standard input field with terminal styling
 * - error: Error state with red border and aria-invalid
 * - success: Success state with green border
 *
 * Sizes:
 * - sm: 32px height (small)
 * - default: 36px height (standard)
 * - lg: 40px height (large)
 */
const inputVariants = cva(
  "input-terminal flex w-full rounded-md px-3 py-1 text-base shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-input-fg disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200 outline-none focus:outline-2 focus:outline-offset-1 focus:shadow-[0_0_0_3px_var(--color-input-focus-ring)]",
  {
    variants: {
      variant: {
        default: "border-input-border focus:border-input-border-focus",
        error: "border-error focus:border-error",
        success: "border-success focus:border-success",
      },
      inputSize: {
        sm: "h-8 text-sm",
        default: "h-9",
        lg: "h-10 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  /**
   * Helper text to display below the input
   */
  helperText?: string
  /**
   * Error message to display (automatically sets variant to "error")
   */
  errorMessage?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, helperText, errorMessage, ...props }, ref) => {
    const id = props.id || React.useId()
    const helperId = `${id}-helper`
    const errorId = `${id}-error`

    // Automatically set variant to error if errorMessage is provided
    const computedVariant = errorMessage ? "error" : variant

    return (
      <div className="w-full">
        <input
          id={id}
          type={type}
          className={cn(inputVariants({ variant: computedVariant, inputSize, className }))}
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
Input.displayName = "Input"

export { Input, inputVariants }
