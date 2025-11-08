'use client'

import { cn } from '@/lib/utils'

interface DynamicMainContentProps {
  children: React.ReactNode
  className?: string
}

export function DynamicMainContent({
  children,
  className
}: DynamicMainContentProps) {
  return (
    <main
      className={cn(
        "flex-1 overflow-y-auto w-full",
        className
      )}
    >
      {children}
    </main>
  )
}
