/**
 * Tabs Component - Pip-Boy Styled Tabs
 * Fallout 風格的分頁切換元件
 */

'use client'

import React, { createContext, useContext, useState } from 'react'

// ============================================================================
// Context
// ============================================================================

interface TabsContextValue {
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

const useTabsContext = () => {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within Tabs')
  }
  return context
}

// ============================================================================
// Tabs Root
// ============================================================================

interface TabsProps {
  defaultValue: string
  children: React.ReactNode
  className?: string
}

export function Tabs({ defaultValue, children, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

// ============================================================================
// TabsList
// ============================================================================

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div
      className={`flex border-2 border-pip-boy-green bg-black ${className}`}
      role="tablist"
    >
      {children}
    </div>
  )
}

// ============================================================================
// TabsTrigger
// ============================================================================

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabsTrigger({ value, children, className = '' }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext()
  const isActive = activeTab === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      className={`
        flex-1 px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider
        transition-all duration-200 border-r border-pip-boy-green last:border-r-0
        ${
          isActive
            ? 'bg-pip-boy-green text-black shadow-[0_0_10px_rgba(0,255,65,0.5)]'
            : 'bg-black text-pip-boy-green hover:bg-pip-boy-green/10'
        }
        ${className}
      `}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  )
}

// ============================================================================
// TabsContent
// ============================================================================

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabsContent({ value, children, className = '' }: TabsContentProps) {
  const { activeTab } = useTabsContext()

  if (activeTab !== value) {
    return null
  }

  return (
    <div
      role="tabpanel"
      className={className}
    >
      {children}
    </div>
  )
}
