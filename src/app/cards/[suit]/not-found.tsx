/**
 * Not Found Page - Invalid Suit
 * 修復：提供專用的 404 頁面，減少 Next.js 編譯 _not-found 的觸發
 */

import Link from 'next/link'
import { PipBoyButton } from '@/components/ui/pipboy'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-wasteland-dark p-4 md:p-6 lg:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="border-2 border-pip-boy-green bg-black/60 p-8 md:p-12">
          {/* 404 標題 */}
          <div className="text-center mb-8">
            <div className="text-8xl md:text-9xl font-bold text-pip-boy-green/30 mb-4">
              404
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-pip-boy-green uppercase tracking-wider mb-3">
              花色不存在
            </h1>
            <p className="text-pip-boy-green/70 text-lg">
              你訪問的花色路徑無效
            </p>
          </div>

          {/* 說明 */}
          <div className="border-t border-pip-boy-green/30 pt-6 mb-8">
            <p className="text-pip-boy-green/60 mb-4">
              有效的花色路徑：
            </p>
            <ul className="space-y-2 text-pip-boy-green/80 ml-4">
              <li>• <code className="bg-black/40 px-2 py-1">/cards/major</code> - 大阿爾克那</li>
              <li>• <code className="bg-black/40 px-2 py-1">/cards/bottles</code> - Nuka-Cola 瓶</li>
              <li>• <code className="bg-black/40 px-2 py-1">/cards/weapons</code> - 戰鬥武器</li>
              <li>• <code className="bg-black/40 px-2 py-1">/cards/caps</code> - 瓶蓋</li>
              <li>• <code className="bg-black/40 px-2 py-1">/cards/rods</code> - 輻射棒</li>
            </ul>
          </div>

          {/* 返回按鈕 */}
          <div className="flex justify-center">
            <Link href="/cards">
              <PipBoyButton variant="primary" size="lg">
                返回花色選擇
              </PipBoyButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
