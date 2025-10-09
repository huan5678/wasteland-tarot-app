'use client'
import React from 'react'
import { useErrorStore } from '@/lib/errorStore'
import { XCircle, WifiOff, RefreshCw } from 'lucide-react'

export function GlobalErrorDisplay() {
  const errors = useErrorStore(s => s.errors)
  const dismiss = useErrorStore(s => s.dismissError)
  const online = useErrorStore(s => s.networkOnline)

  if (errors.length === 0 && online) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2 max-w-sm">
      {!online && (
        <div className="border-2 border-yellow-400 bg-yellow-900/30 p-3 text-yellow-200 font-mono text-xs">
          <div className="flex items-start gap-2">
            <WifiOff className="w-4 h-4" />
            <div className="flex-1">
              <div className="font-bold">離線模式</div>
              <div>偵測到網路中斷，請檢查連線。</div>
            </div>
          </div>
        </div>
      )}
      {errors.slice(-3).map(err => (
        <div key={err.id} className="border-2 border-red-400 bg-red-900/30 p-3 text-red-200 font-mono text-xs">
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4" />
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{err.message}</div>
              {err.statusCode && <div className="opacity-70">狀態: {err.statusCode}</div>}
              {err.retry && (
                <button onClick={() => err.retry && err.retry()} className="mt-1 flex items-center gap-1 text-red-100 hover:text-white">
                  <RefreshCw className="w-3 h-3" />重試
                </button>
              )}
            </div>
            <button onClick={() => dismiss(err.id)} className="opacity-70 hover:opacity-100">×</button>
          </div>
        </div>
      ))}
    </div>
  )
}
