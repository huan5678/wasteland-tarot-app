/**
 * useGyroscopePermission Hook - 陀螺儀權限管理
 *
 * 處理 iOS 13+ DeviceOrientation API 權限請求流程
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { UseGyroscopePermissionReturn, DeviceOrientationEventiOS } from '@/types/tilt'

/**
 * 陀螺儀權限管理 Hook (iOS 13+ 專用)
 *
 * @example
 * ```tsx
 * const { status, requestPermission, error } = useGyroscopePermission()
 *
 * if (status === 'prompt') {
 *   return <button onClick={requestPermission}>啟用傾斜效果</button>
 * }
 * ```
 *
 * @returns UseGyroscopePermissionReturn 物件
 */
export function useGyroscopePermission(): UseGyroscopePermissionReturn {
  const [status, setStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 檢查是否在瀏覽器環境
    if (typeof window === 'undefined') {
      setStatus('unsupported')
      return
    }

    // 檢查是否支援 DeviceOrientationEvent
    if (typeof DeviceOrientationEvent === 'undefined') {
      setStatus('unsupported')
      return
    }

    // 檢查是否需要權限請求（iOS 13+）
    const DeviceOrientationEvt = DeviceOrientationEvent as unknown as typeof DeviceOrientationEventiOS
    if (typeof DeviceOrientationEvt.requestPermission !== 'function') {
      // 非 iOS 13+ 或桌面，直接授予權限
      setStatus('granted')
    }
  }, [])

  const requestPermission = useCallback(async () => {
    try {
      // 檢查是否支援權限 API
      const DeviceOrientationEvt = DeviceOrientationEvent as unknown as typeof DeviceOrientationEventiOS
      if (typeof DeviceOrientationEvt.requestPermission !== 'function') {
        setStatus('granted')
        return
      }

      // 請求權限（必須在 user gesture 中呼叫）
      const permissionState = await DeviceOrientationEvt.requestPermission()

      if (permissionState === 'granted') {
        setStatus('granted')
        setError(null)
      } else {
        setStatus('denied')
        setError('權限被拒絕，請至裝置設定中允許動作與方向存取')
      }
    } catch (err) {
      setStatus('denied')
      setError('無法請求權限，請確認瀏覽器版本與裝置設定')
      console.error('[useGyroscopePermission] 權限請求失敗:', err)
    }
  }, [])

  return {
    status,
    requestPermission,
    error
  }
}
