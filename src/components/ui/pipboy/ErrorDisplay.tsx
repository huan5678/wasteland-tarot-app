/**
 * ErrorDisplay Component
 * Pip-Boy 風格錯誤顯示元件
 *
 * 特色:
 * - 紅色警告樣式
 * - 錯誤訊息與堆疊追蹤
 * - 重試按鈕
 * - 可關閉
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { PipBoyButton } from './PipBoyButton'

export interface ErrorDisplayProps {
  /**
   * 錯誤物件
   */
  error: Error

  /**
   * 重試回調函式
   */
  onRetry?: () => void

  /**
   * 關閉回調函式
   */
  onDismiss?: () => void

  /**
   * 錯誤標題(預設為 "錯誤")
   */
  title?: string

  /**
   * 是否顯示錯誤堆疊(開發環境可啟用)
   */
  showStack?: boolean

  /**
   * 是否置中顯示
   */
  centered?: boolean

  /**
   * 自定義類別
   */
  className?: string
}

/**
 * ErrorDisplay 元件
 *
 * @example
 * ```tsx
 * <ErrorDisplay
 *   error={new Error('載入失敗')}
 *   onRetry={handleRetry}
 *   onDismiss={handleDismiss}
 * />
 * ```
 */
export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  title = '發生錯誤',
  showStack = false,
  centered = false,
  className,
}: ErrorDisplayProps) {
  return (
    <div
      className={cn(
        'border-2 border-red-500',
        'bg-black/90 backdrop-blur-sm',
        'p-6 rounded-md',
        'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
        centered && 'flex flex-col items-center justify-center min-h-[300px] text-center',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* 錯誤圖示與標題 */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="text-4xl text-red-500"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))',
          }}
          aria-hidden="true"
        >
          ⚠️
        </div>
        <h3 className="text-xl font-bold text-red-500 uppercase tracking-wider">
          {title}
        </h3>
        {/* 關閉按鈕 */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-auto text-red-500 hover:text-red-400 transition-colors"
            aria-label="關閉錯誤訊息"
          >
            <span className="text-2xl">×</span>
          </button>
        )}
      </div>

      {/* 錯誤訊息 */}
      <div className="mb-6">
        <p className="text-red-400 text-sm md:text-base mb-2">
          {error.message || '未知錯誤'}
        </p>

        {/* 錯誤堆疊(開發模式) */}
        {showStack && error.stack && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-red-500/70 hover:text-red-500 mb-2">
              顯示詳細資訊
            </summary>
            <pre className="text-xs text-red-400/60 overflow-x-auto bg-black/50 p-3 rounded border border-red-500/30">
              {error.stack}
            </pre>
          </details>
        )}
      </div>

      {/* 操作按鈕 */}
      <div className="flex flex-wrap gap-3">
        {onRetry && (
          <PipBoyButton
            variant="primary"
            size="md"
            onClick={onRetry}
            className="border-red-500 bg-red-500 text-black hover:bg-red-600 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
          >
            重試
          </PipBoyButton>
        )}
        {onDismiss && (
          <PipBoyButton
            variant="secondary"
            size="md"
            onClick={onDismiss}
            className="border-red-500 text-red-500 hover:bg-red-500/20"
          >
            關閉
          </PipBoyButton>
        )}
      </div>
    </div>
  )
}

/**
 * ErrorBoundaryFallback - 錯誤邊界 Fallback 元件
 *
 * 用於 React Error Boundary 的 fallback UI
 */
export interface ErrorBoundaryFallbackProps {
  error: Error
  resetErrorBoundary?: () => void
}

export function ErrorBoundaryFallback({ error, resetErrorBoundary }: ErrorBoundaryFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <ErrorDisplay
        error={error}
        title="應用程式錯誤"
        onRetry={resetErrorBoundary}
        showStack={process.env.NODE_ENV === 'development'}
        centered
      />
    </div>
  )
}

/**
 * InlineError - 內聯錯誤訊息
 *
 * 用於表單欄位或小型區域的錯誤提示
 */
export interface InlineErrorProps {
  message: string
  className?: string
}

export function InlineError({ message, className }: InlineErrorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2',
        'text-red-500 text-xs md:text-sm',
        'mt-1',
        className
      )}
      role="alert"
    >
      <span aria-hidden="true">⚠</span>
      <span>{message}</span>
    </div>
  )
}

/**
 * NotFound - 404 錯誤元件
 *
 * 用於資源不存在的情況
 */
export interface NotFoundProps {
  title?: string
  message?: string
  onBackHome?: () => void
}

export function NotFound({
  title = '找不到頁面',
  message = '您要找的資源不存在或已被移除。',
  onBackHome,
}: NotFoundProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div
        className="border-2 border-pip-boy-green bg-black/90 p-8 rounded-md text-center max-w-md"
        role="alert"
      >
        {/* 404 圖示 */}
        <div
          className="text-6xl text-pip-boy-green mb-4"
          style={{
            filter: 'drop-shadow(0 0 10px rgba(51, 255, 51, 0.5))',
          }}
          aria-hidden="true"
        >
          🔍
        </div>

        {/* 標題與訊息 */}
        <h1 className="text-3xl font-bold text-pip-boy-green uppercase mb-4">
          {title}
        </h1>
        <p className="text-pip-boy-green/80 text-sm mb-6">{message}</p>

        {/* 返回首頁按鈕 */}
        {onBackHome && (
          <PipBoyButton variant="primary" size="md" onClick={onBackHome}>
            返回首頁
          </PipBoyButton>
        )}
      </div>
    </div>
  )
}
