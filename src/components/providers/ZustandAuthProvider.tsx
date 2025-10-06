'use client'
import React, { useEffect } from 'react'
import { useAuthStore } from '@/lib/authStore'

export function ZustandAuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore(s => s.initialize)
  const isInitialized = useAuthStore(s => s.isInitialized)

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-pip-boy-green font-mono">初始化使用者狀態...</div>
      </div>
    )
  }
  return <>{children}</>
}
