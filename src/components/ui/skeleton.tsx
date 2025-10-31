/**
 * Skeleton Loading Components
 * 載入骨架屏元件
 *
 * 提供各種載入狀態的骨架屏幕，改善使用者體驗
 */

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

/**
 * 基礎骨架元件
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-pip-boy-green/10 border border-pip-boy-green/20',
        className
      )}
    />
  )
}

/**
 * 卡牌列表骨架屏
 */
export function CardListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3 border-2 border-pip-boy-green/20 bg-pip-boy-green/5"
        >
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

/**
 * 解讀列表骨架屏
 */
export function InterpretationListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border-2 border-pip-boy-green/20 bg-pip-boy-green/5 p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-4 h-4" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-16 h-7" />
              <Skeleton className="w-8 h-8" />
              <Skeleton className="w-8 h-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 統計卡片骨架屏
 */
export function StatCardSkeleton() {
  return (
    <div className="border-2 border-pip-boy-green/20 bg-pip-boy-green/5 p-4">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-16" />
    </div>
  )
}

/**
 * 表格骨架屏
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/10 p-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-2 border-pip-boy-green/20 bg-pip-boy-green/5 p-3">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
