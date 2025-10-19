'use client'

/**
 * ActivityProgressCard Component
 *
 * 活躍度進度追蹤卡片
 * - 顯示即時活躍度進度（0-100%）
 * - 顯示累積時間（MM:SS 格式）
 * - 活躍/閒置狀態指示器
 * - 完成狀態慶祝效果
 */

import React, { useMemo } from 'react'
import { SimpleProgressBar } from '@/components/ui/ProgressBar'
import { PixelIcon } from '@/components/ui/icons'

interface ActivityProgressCardProps {
  /** 當前是否處於活躍狀態 */
  isActive: boolean
  /** 累積活躍時間（毫秒） */
  activeTime: number
  /** 進度百分比 (0-100) */
  progress: number
}

/**
 * 將毫秒轉換為 MM:SS 格式
 * @param ms - 毫秒數
 * @returns 格式化的時間字串 (e.g., "15:30")
 */
function formatTime(ms: number): string {
  // 處理異常值
  if (!ms || isNaN(ms) || ms < 0) {
    return '00:00'
  }

  // 限制最大時間為 30 分鐘
  const clampedMs = Math.min(ms, 30 * 60 * 1000)

  const totalSeconds = Math.floor(clampedMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * 限制進度在 0-100 範圍內
 */
function clampProgress(progress: number): number {
  if (isNaN(progress) || progress < 0) return 0
  if (progress > 100) return 100
  return Math.round(progress)
}

export default function ActivityProgressCard({
  isActive,
  activeTime,
  progress,
}: ActivityProgressCardProps) {
  // 格式化時間
  const formattedTime = useMemo(() => formatTime(activeTime), [activeTime])
  const targetTime = '30:00'

  // 限制進度範圍
  const safeProgress = useMemo(() => clampProgress(progress), [progress])

  // 是否已完成
  const isComplete = safeProgress >= 100

  return (
    <section className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <PixelIcon
            name="battery-charge"
            sizePreset="md"
            variant="primary"
            decorative
          />
          <h3 className="text-xl font-bold text-pip-boy-green">
            Pip-Boy 活躍度系統
          </h3>
        </div>

        {/* Status Indicator */}
        <div
          data-testid="status-indicator"
          className={`
            px-3 py-1 border-2 font-bold text-xs tracking-wider
            ${
              isActive
                ? 'border-pip-boy-green text-pip-boy-green bg-pip-boy-green/10 animate-pulse'
                : 'border-pip-boy-green/30 text-pip-boy-green/50 bg-black'
            }
          `}
        >
          {isActive ? 'ACTIVE' : 'IDLE'}
        </div>
      </div>

      {/* Time Display */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-pip-boy-green/70 text-sm">累積時間</span>
          <span className="text-pip-boy-green font-mono text-lg tabular-nums">
            {formattedTime} / {targetTime}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div
          role="progressbar"
          aria-valuenow={safeProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`活躍度進度：${safeProgress}%`}
          className="relative h-6 border-2 border-pip-boy-green/30 bg-black overflow-hidden"
        >
          {/* Fill */}
          <div
            data-testid="progress-bar-fill"
            className={`
              absolute inset-y-0 left-0 transition-all duration-300 ease-out
              ${isComplete ? 'bg-pip-boy-green' : 'bg-pip-boy-green/30'}
            `}
            style={{ width: `${safeProgress}%` }}
          />

          {/* Percentage Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-pip-boy-green font-bold text-sm uppercase tracking-wider mix-blend-difference">
              {safeProgress}%
            </span>
          </div>
        </div>
      </div>

      {/* Completion Message or Hint */}
      {isComplete ? (
        <div className="flex items-center gap-2 text-pip-boy-green">
          <PixelIcon
            name="zap"
            sizePreset="sm"
            variant="success"
            data-testid="complete-icon"
            aria-label="延長成功"
          />
          <span className="text-sm font-bold">
            已達到 30 分鐘！Token 延長已觸發，時間持續累計中。
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-pip-boy-green/70">
          <PixelIcon
            name="bulb"
            sizePreset="xs"
            variant="default"
            decorative
          />
          <p className="text-xs leading-relaxed">
            累計活躍 30 分鐘可延長 Token。每日重置。活躍定義：頁面 focus + 5 分鐘內有互動。
          </p>
        </div>
      )}
    </section>
  )
}
