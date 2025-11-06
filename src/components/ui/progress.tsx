import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    segmented?: boolean;
    segments?: number;
  }
>(({ className, value, segmented = false, segments = 20, ...props }, ref) => {
  if (segmented) {
    const filledSegments = Math.floor(((value || 0) / 100) * segments);
    
    return (
      <ProgressPrimitive.Root
        ref={ref}
        className={cn("relative h-4 w-full overflow-hidden bg-secondary/30 border border-primary/30", className)}
        {...props}
      >
        <div className="h-full w-full flex gap-[2px] p-[2px]">
          {Array.from({ length: segments }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "flex-1 transition-all duration-300",
                index < filledSegments ? "bg-primary" : "bg-transparent"
              )}
            />
          ))}
        </div>
      </ProgressPrimitive.Root>
    );
  }

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
