/**
 * Progress Bar Component
 * 進度條元件
 *
 * 用於顯示批次操作的進度
 */

import { PixelIcon } from './icons'

export interface ProgressStats {
  total: number
  completed: number
  success: number
  failed: number
}

interface ProgressBarProps {
  stats: ProgressStats
  label?: string
  showDetails?: boolean
}

export function ProgressBar({ stats, label, showDetails = true }: ProgressBarProps) {
  const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
  const isComplete = stats.completed === stats.total

  return (
    <div className="border-2 border-pip-boy-green/30 bg-black p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PixelIcon
            name={isComplete ? 'check-circle' : 'loader'}
            sizePreset="sm"
            variant="primary"
            animation={isComplete ? undefined : 'spin'}
            decorative
          />
          <span className="font-bold text-pip-boy-green uppercase tracking-wider">
            {label || '處理中...'}
          </span>
        </div>
        <span className="text-pip-boy-green font-mono text-sm">
          {stats.completed} / {stats.total}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-6 border-2 border-pip-boy-green/30 bg-black overflow-hidden">
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 bg-pip-boy-green/30 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />

        {/* Animated Stripes */}
        {!isComplete && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-pip-boy-green/20 to-transparent animate-shimmer"
            style={{
              backgroundSize: '200% 100%',
            }}
          />
        )}

        {/* Percentage Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-pip-boy-green font-bold text-xs uppercase tracking-wider mix-blend-difference">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <PixelIcon name="check" sizePreset="xs" variant="success" decorative />
              <span className="text-green-400">{stats.success} 成功</span>
            </div>
            {stats.failed > 0 && (
              <div className="flex items-center gap-1">
                <PixelIcon name="close" sizePreset="xs" variant="error" decorative />
                <span className="text-red-400">{stats.failed} 失敗</span>
              </div>
            )}
          </div>
          {!isComplete && (
            <span className="text-pip-boy-green/70 animate-pulse">
              處理中...
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 簡化版進度條（只顯示百分比）
 */
export function SimpleProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="relative h-2 border border-pip-boy-green/30 bg-black overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 bg-pip-boy-green transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      />
    </div>
  )
}
