'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { logError } from '@/lib/logger'

const GlobalErrorDisplay = dynamic(() => import('@/components/common/GlobalErrorDisplay').then(m => m.GlobalErrorDisplay), { ssr: false })
const MetricsInitializer = dynamic(async () => {
  try {
    const m = await import('@/components/system/MetricsInitializer')
    return m.MetricsInitializer
  } catch (e) {
    logError(e, { component: 'MetricsInitializerDynamicImport' })
    return () => null
  }
}, { ssr: false })

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      <GlobalErrorDisplay />
      <MetricsInitializer />
      {children}
    </>
  )
}