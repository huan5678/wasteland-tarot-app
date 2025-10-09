/**
 * TiltVisualEffects - 3D 傾斜視覺效果元件
 *
 * 渲染動態光澤（gradient overlay）與增強陰影效果
 */

'use client'

import React from 'react'
import type { TiltVisualEffectsProps } from '@/types/tilt'
import { useDeviceCapabilities } from '@/hooks/tilt/useDeviceCapabilities'
import { cn } from '@/lib/utils'

/**
 * 3D 傾斜視覺效果元件
 *
 * 根據傾斜狀態渲染動態光澤（radial gradient overlay）與增強陰影效果，
 * 增強 3D 傾斜效果的視覺真實感。
 *
 * @param props - TiltVisualEffectsProps
 * @param props.tiltState - 傾斜狀態（來自 use3DTilt）
 * @param props.enableGloss - 是否啟用光澤效果（預設 true）
 * @param props.className - 自訂 CSS 類別
 *
 * @returns React 元件或 null（當停用或無傾斜時）
 *
 * @remarks
 * - 光澤位置根據 rotateX 與 rotateY 動態計算
 * - 陰影方向與傾斜方向相反，模擬光源效果
 * - 自動尊重 prefers-reduced-motion 使用者設定
 * - 使用 React.memo 優化效能，避免不必要的重渲染
 * - aria-hidden="true" 確保無障礙支援
 *
 * @example
 * 基本使用
 * ```tsx
 * const { tiltState } = use3DTilt()
 *
 * <div className="card-container" style={{ position: 'relative' }}>
 *   <TiltVisualEffects tiltState={tiltState} enableGloss={true} />
 *   <div className="card-content">卡片內容</div>
 * </div>
 * ```
 *
 * @example
 * 停用光澤（縮圖卡片）
 * ```tsx
 * <TiltVisualEffects tiltState={tiltState} enableGloss={false} />
 * ```
 */
export const TiltVisualEffects: React.FC<TiltVisualEffectsProps> = React.memo(
  ({ tiltState, enableGloss = true, className }) => {
    const { prefersReducedMotion } = useDeviceCapabilities()

    // 如果使用者偏好減少動畫，或未傾斜，則不渲染效果
    if (prefersReducedMotion || !tiltState.isTilted || !enableGloss) {
      return null
    }

    // 計算光澤位置（根據傾斜角度）
    const glossX = 50 + tiltState.rotateY * 2 // 50% ~ 80%（根據左右傾斜）
    const glossY = 50 - tiltState.rotateX * 2 // 20% ~ 50%（根據上下傾斜）

    // 計算陰影偏移（與傾斜方向相反，模擬光源）
    const shadowX = -tiltState.rotateY * 0.5 // px
    const shadowY = tiltState.rotateX * 0.5 // px

    return (
      <>
        {/* 動態光澤 overlay */}
        <div
          className={cn('tilt-gloss-overlay', className)}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(circle at ${glossX}% ${glossY}%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
            opacity: 0.6,
            transition: 'opacity 0.3s ease-out',
            mixBlendMode: 'overlay' as const,
            zIndex: 10
          }}
          aria-hidden="true"
        />

        {/* 動態陰影效果（透過 CSS 變數注入至父元素） */}
        <style jsx>{`
          :global(.card-container) {
            box-shadow: ${shadowX}px ${shadowY}px 20px rgba(0, 0, 0, 0.3);
            transition: box-shadow 0.3s ease-out;
          }
        `}</style>
      </>
    )
  }
)

TiltVisualEffects.displayName = 'TiltVisualEffects'
