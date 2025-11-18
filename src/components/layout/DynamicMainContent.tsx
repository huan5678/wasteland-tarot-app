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
  const mainRef = useRef<HTMLElement>(null)

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

  // Broadcast main content scroll position for Header scroll-hide behavior
  useEffect(() => {
    const mainElement = mainRef.current
    if (!mainElement) return

    const handleScroll = () => {
      window.dispatchEvent(
        new CustomEvent('main-scroll', {
          detail: { scrollY: mainElement.scrollTop }
        })
      )
    }

    mainElement.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      mainElement.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <main
      ref={mainRef}
      id="main-content"
      className={cn(
        "w-full flex-1 overflow-y-auto",
        // ✅ overflow-y-auto: Main content has its own scrollbar
        // ✅ ScrollTrigger will use this element as scroller via id="main-content"
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
