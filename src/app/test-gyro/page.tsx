'use client'

import { useEffect, useState } from 'react'
import { PipBoyCard, PipBoyButton } from '@/components/ui/pipboy'
import { useGyroscopePermission } from '@/hooks/tilt/useGyroscopePermission'
import { useDeviceCapabilities } from '@/hooks/tilt/useDeviceCapabilities'

/**
 * 陀螺儀權限測試頁面
 *
 * 用於診斷 iOS DeviceOrientation API 權限請求流程
 */
export default function TestGyroPage() {
  const { status, requestPermission, error } = useGyroscopePermission()
  const { isTouchDevice, isIOS } = useDeviceCapabilities()
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 })
  const [eventCount, setEventCount] = useState(0)

  // 監聽 deviceorientation 事件
  useEffect(() => {
    if (status !== 'granted') return

    const handler = (event: DeviceOrientationEvent) => {
      setOrientation({
        alpha: event.alpha ?? 0,
        beta: event.beta ?? 0,
        gamma: event.gamma ?? 0
      })
      setEventCount(prev => prev + 1)
    }

    window.addEventListener('deviceorientation', handler)

    return () => {
      window.removeEventListener('deviceorientation', handler)
    }
  }, [status])

  // 檢測 requestPermission API
  const hasRequestPermission = typeof (DeviceOrientationEvent as any).requestPermission === 'function'

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-mono text-pip-boy-green mb-6">
          陀螺儀權限測試
        </h1>

        {/* 裝置資訊 */}
        <PipBoyCard>
          <h2 className="text-lg font-mono text-pip-boy-green mb-3">裝置資訊</h2>
          <div className="space-y-2 font-mono text-sm text-pip-boy-green/80">
            <div>User Agent: {navigator.userAgent}</div>
            <div>isTouchDevice: {isTouchDevice ? '是' : '否'}</div>
            <div>isIOS: {isIOS ? '是' : '否'}</div>
            <div>HTTPS: {window.location.protocol === 'https:' ? '是' : '否'}</div>
            <div>DeviceOrientationEvent 支援: {typeof DeviceOrientationEvent !== 'undefined' ? '是' : '否'}</div>
            <div>requestPermission API: {hasRequestPermission ? '是' : '否'}</div>
          </div>
        </PipBoyCard>

        {/* 權限狀態 */}
        <PipBoyCard>
          <h2 className="text-lg font-mono text-pip-boy-green mb-3">權限狀態</h2>
          <div className="space-y-3">
            <div className="font-mono text-pip-boy-green">
              狀態: <span className="text-pip-boy-green-bright font-bold">{status}</span>
            </div>

            {error && (
              <div className="font-mono text-red-500 text-sm">
                錯誤: {error}
              </div>
            )}

            {/* 權限請求按鈕 */}
            {status === 'prompt' && (
              <div className="space-y-2">
                <div className="text-sm font-mono text-pip-boy-green/70">
                  iOS 13+ 需要使用者授權才能存取陀螺儀資料
                </div>
                <PipBoyButton
                  onClick={async () => {
                    console.log('[TestGyro] 開始請求權限...')
                    try {
                      await requestPermission()
                      console.log('[TestGyro] 權限請求完成')
                    } catch (err) {
                      console.error('[TestGyro] 權限請求錯誤:', err)
                    }
                  }}
                  variant="primary"
                  size="lg"
                >
                  🎯 請求陀螺儀權限
                </PipBoyButton>
              </div>
            )}

            {status === 'granted' && (
              <div className="text-sm font-mono text-green-500">
                ✅ 權限已授予！陀螺儀資料應該正在接收中...
              </div>
            )}

            {status === 'denied' && (
              <div className="text-sm font-mono text-red-500">
                ❌ 權限被拒絕。請至 Safari 設定重置權限。
              </div>
            )}

            {status === 'unsupported' && (
              <div className="text-sm font-mono text-yellow-500">
                ⚠️ 此裝置不支援 DeviceOrientation API
              </div>
            )}
          </div>
        </PipBoyCard>

        {/* 陀螺儀資料即時顯示 */}
        {status === 'granted' && (
          <PipBoyCard>
            <h2 className="text-lg font-mono text-pip-boy-green mb-3">陀螺儀資料</h2>
            <div className="space-y-2 font-mono text-sm">
              <div className="text-pip-boy-green/70">事件次數: {eventCount}</div>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="text-center">
                  <div className="text-pip-boy-green/70 text-xs mb-1">Alpha</div>
                  <div className="text-pip-boy-green text-lg font-bold">
                    {orientation.alpha.toFixed(1)}°
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-pip-boy-green/70 text-xs mb-1">Beta (X)</div>
                  <div className="text-pip-boy-green text-lg font-bold">
                    {orientation.beta.toFixed(1)}°
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-pip-boy-green/70 text-xs mb-1">Gamma (Y)</div>
                  <div className="text-pip-boy-green text-lg font-bold">
                    {orientation.gamma.toFixed(1)}°
                  </div>
                </div>
              </div>
              <div className="text-xs text-pip-boy-green/60 mt-3">
                傾斜你的裝置以查看數值變化
              </div>
            </div>
          </PipBoyCard>
        )}

        {/* 視覺化傾斜指示器 */}
        {status === 'granted' && (
          <PipBoyCard className="relative overflow-hidden">
            <h2 className="text-lg font-mono text-pip-boy-green mb-3">3D 傾斜視覺化</h2>
            <div className="flex items-center justify-center h-64">
              <div
                className="w-32 h-48 bg-pip-boy-green/20 border-2 border-pip-boy-green rounded-lg transition-transform duration-100"
                style={{
                  transform: `perspective(1000px) rotateX(${orientation.beta * 0.5}deg) rotateY(${orientation.gamma * 0.5}deg)`,
                  boxShadow: '0 0 20px rgba(51, 255, 51, 0.3)'
                }}
              >
                <div className="flex items-center justify-center h-full text-pip-boy-green font-mono text-sm">
                  傾斜我
                </div>
              </div>
            </div>
          </PipBoyCard>
        )}

        {/* 手動測試按鈕 */}
        <PipBoyCard>
          <h2 className="text-lg font-mono text-pip-boy-green mb-3">手動測試</h2>
          <div className="space-y-2">
            <PipBoyButton
              onClick={() => {
                console.log('[TestGyro] 當前狀態:', {
                  status,
                  hasRequestPermission,
                  isIOS,
                  isTouchDevice,
                  userAgent: navigator.userAgent
                })
                alert(`狀態: ${status}\nrequestPermission API: ${hasRequestPermission}\niOS: ${isIOS}`)
              }}
              variant="secondary"
              size="md"
            >
              📋 記錄當前狀態
            </PipBoyButton>

            <PipBoyButton
              onClick={() => {
                window.location.reload()
              }}
              variant="secondary"
              size="md"
            >
              🔄 重新載入頁面
            </PipBoyButton>
          </div>
        </PipBoyCard>

        {/* 說明文件 */}
        <PipBoyCard>
          <h2 className="text-lg font-mono text-pip-boy-green mb-3">測試步驟</h2>
          <ol className="list-decimal list-inside space-y-2 font-mono text-sm text-pip-boy-green/80">
            <li>在 iOS 裝置（iPhone/iPad）上使用 Safari 瀏覽器開啟此頁面</li>
            <li>確認「裝置資訊」顯示 isIOS: 是</li>
            <li>確認「裝置資訊」顯示 requestPermission API: 是</li>
            <li>點擊「請求陀螺儀權限」按鈕</li>
            <li>應該會看到 Safari 的權限對話框</li>
            <li>點選「允許」授予權限</li>
            <li>「陀螺儀資料」區塊應該開始顯示即時數據</li>
            <li>傾斜裝置，觀察數值變化</li>
          </ol>
        </PipBoyCard>
      </div>
    </div>
  )
}
