'use client'

import React from 'react'

interface ClientLayoutProps {
  children: React.ReactNode
}

/**
 * ClientLayout - 暫時簡化以修復 SSR 錯誤
 *
 * 修復說明：
 * - 移除了 dynamic import 以避免 "Bail out to client-side rendering" 錯誤
 * - GlobalErrorDisplay 和 MetricsInitializer 已在 AppProviders 中處理
 */
export function ClientLayout({ children }: ClientLayoutProps) {
  return <>{children}</>
}