'use client'

import { PixelIcon } from '@/components/ui/icons'

export function OfflineActions() {
  return (
    <div className="space-y-3">
      <button
        onClick={() => window.location.reload()}
        className="w-full px-6 py-3 bg-pip-boy-green/10 hover:bg-pip-boy-green/20 border border-pip-boy-green/30 rounded-lg text-pip-boy-green font-medium transition-colors"
      >
        <span className="flex items-center justify-center gap-2">
          <PixelIcon name="refresh" sizePreset="sm" decorative />
          重新連線
        </span>
      </button>

      <button
        onClick={() => window.history.back()}
        className="w-full px-6 py-3 border border-pip-boy-green/30 rounded-lg text-pip-boy-green/80 font-medium hover:bg-pip-boy-green/5 transition-colors"
      >
        返回上一頁
      </button>
    </div>
  )
}
