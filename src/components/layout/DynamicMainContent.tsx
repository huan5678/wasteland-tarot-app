'use client'

import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface DynamicMainContentProps {
  children: React.ReactNode
  className?: string
}

export function DynamicMainContent({
  children,
  className
}: DynamicMainContentProps) {
  const [headerHeight, setHeaderHeight] = useState(0)

  useEffect(() => {
    // Listen to header height changes
    const handleHeaderHeightChange = (event: CustomEvent) => {
      setHeaderHeight(event.detail.height)
    }

    window.addEventListener('header-height-change', handleHeaderHeightChange as EventListener)

    return () => {
      window.removeEventListener('header-height-change', handleHeaderHeightChange as EventListener)
    }
  }, [])

  // Broadcast window scroll position for Header scroll-hide behavior
  useEffect(() => {
    const handleScroll = () => {
      window.dispatchEvent(
        new CustomEvent('main-scroll', {
          detail: { scrollY: window.scrollY }
        })
      )
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <main
      className={cn(
        "w-full flex-1 overflow-y-auto",
        // Mobile: limit height to keep MobileBottomNav visible
        // Desktop: no limit, let content flow naturally
        "max-h-[calc(100vh-104px)] sm:max-h-none",
        className
      )}
      style={{
        paddingTop: headerHeight > 0 ? `${headerHeight}px` : undefined
      }}
    >
      {children}
    </main>
  )
}
