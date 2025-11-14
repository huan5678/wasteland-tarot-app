import type { Metadata } from 'next';
import { PixelIcon } from '@/components/ui/icons'
import { OfflineActions } from './offline-actions'

export const metadata: Metadata = {
  title: '離線模式 | 廢土塔羅 - 網路連線中斷',
  description: '網路連線已中斷，廢土塔羅正在等待重新連線。請檢查你的網路設定，或稍後再試。部分功能可能無法使用。',
};

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
        <OfflineActions />

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
