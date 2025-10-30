'use client'

import { useEffect, useState } from 'react'

interface DynamicMainContentProps {
  children: React.ReactNode
}

export function DynamicMainContent({ children }: DynamicMainContentProps) {
  const [headerHeight, setHeaderHeight] = useState(120) // 預設值

  useEffect(() => {
    const handleHeaderHeightChange = ((e: CustomEvent) => {
      setHeaderHeight(e.detail.height)
    }) as EventListener

    window.addEventListener('header-height-change', handleHeaderHeightChange)

    return () => {
      window.removeEventListener('header-height-change', handleHeaderHeightChange)
    }
  }, [])

  return (
    <main
      className="flex-1 transition-all duration-300"
      style={{ paddingTop: `${headerHeight}px` }}
    >
      {children}
    </main>
  )
}
