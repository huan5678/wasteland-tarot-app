'use client'

import { PixelIcon } from '@/components/ui/icons'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Pip-Boy Terminal Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-pip-boy-green/10 flex items-center justify-center animate-pulse">
              <PixelIcon
                name="wifi-off"
                sizePreset="xxl"
                variant="primary"
                decorative
              />
            </div>
            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="scanline" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-pip-boy-green tracking-wider">
            離線模式
          </h1>
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-pip-boy-green to-transparent" />
        </div>

        {/* Message */}
        <div className="space-y-4 text-pip-boy-green/80">
          <p className="text-lg">
            Pip-Boy 終端機目前無法連接至 Vault-Tec 網路
          </p>
          <p className="text-sm opacity-60">
            請檢查你的網路連線，或稍後再試
          </p>
        </div>

        {/* Status Box */}
        <div className="border border-pip-boy-green/30 rounded-lg p-6 bg-pip-boy-green/5">
          <div className="space-y-3 text-sm text-left">
            <div className="flex items-center justify-between">
              <span className="text-pip-boy-green/60">系統狀態</span>
              <span className="text-radiation-orange">離線</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-pip-boy-green/60">快取資料</span>
              <span className="text-pip-boy-green">可用</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-pip-boy-green/60">本地功能</span>
              <span className="text-pip-boy-green">正常</span>
            </div>
          </div>
        </div>

        {/* Actions */}
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

        {/* Tips */}
        <div className="pt-6 border-t border-pip-boy-green/20">
          <p className="text-xs text-pip-boy-green/50">
            提示：部分已快取的內容仍可離線瀏覽
          </p>
        </div>
      </div>
    </div>
  )
}
