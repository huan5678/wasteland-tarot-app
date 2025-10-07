/**
 * PaginationControls Component
 * 分頁導航控制項元件
 *
 * 特色:
 * - 上一頁/下一頁按鈕
 * - 頁碼指示器
 * - 自動禁用邊界按鈕
 * - 完整的無障礙性支援
 * - 響應式設計
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PipBoyButton } from '@/components/ui/pipboy'

export interface PaginationControlsProps {
  /**
   * 當前頁碼(從 1 開始)
   */
  currentPage: number

  /**
   * 總頁數
   */
  totalPages: number

  /**
   * 基礎 URL(例如 /cards/nuka-cola)
   */
  baseUrl: string

  /**
   * 頁碼變更回調(可選,用於客戶端導航)
   */
  onPageChange?: (page: number) => void

  /**
   * 自定義類別
   */
  className?: string

  /**
   * 是否使用客戶端導航(不使用 Link,僅觸發 onPageChange)
   */
  clientSideNavigation?: boolean
}

/**
 * PaginationControls 元件
 *
 * @example
 * ```tsx
 * <PaginationControls
 *   currentPage={2}
 *   totalPages={5}
 *   baseUrl="/cards/nuka-cola"
 * />
 * ```
 */
export function PaginationControls({
  currentPage,
  totalPages,
  baseUrl,
  onPageChange,
  className,
  clientSideNavigation = false,
}: PaginationControlsProps) {
  // 計算上一頁與下一頁
  const prevPage = currentPage - 1
  const nextPage = currentPage + 1

  const hasPrevPage = currentPage > 1
  const hasNextPage = currentPage < totalPages

  // 處理頁碼變更
  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page)
    }
  }

  // 建立頁碼 URL
  const createPageUrl = (page: number) => {
    return `${baseUrl}?page=${page}`
  }

  // 渲染按鈕(支援 Link 或純按鈕)
  const renderButton = (
    page: number,
    label: string,
    disabled: boolean,
    ariaLabel: string,
    direction: 'prev' | 'next'
  ) => {
    const buttonContent = (
      <PipBoyButton
        variant="secondary"
        size="md"
        disabled={disabled}
        className={cn(
          'min-w-[44px] min-h-[44px]', // 行動裝置最小觸控尺寸
          'flex items-center gap-2'
        )}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        onClick={clientSideNavigation ? () => handlePageChange(page) : undefined}
      >
        {direction === 'prev' && <span aria-hidden="true">←</span>}
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden" aria-hidden="true">
          {direction === 'prev' ? '←' : '→'}
        </span>
        {direction === 'next' && <span aria-hidden="true">→</span>}
      </PipBoyButton>
    )

    if (disabled || clientSideNavigation) {
      return buttonContent
    }

    return (
      <Link
        href={createPageUrl(page)}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-pip-boy-green focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
        aria-label={ariaLabel}
      >
        {buttonContent}
      </Link>
    )
  }

  return (
    <nav
      className={cn('flex items-center justify-center gap-4 md:gap-6', className)}
      role="navigation"
      aria-label="分頁導航"
    >
      {/* 上一頁按鈕 */}
      {renderButton(prevPage, '上一頁', !hasPrevPage, '前往上一頁', 'prev')}

      {/* 頁碼指示器 */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-2 border-pip-boy-green/50 bg-black/60 rounded-sm"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="font-mono text-sm md:text-base text-pip-boy-green">
          <span className="font-semibold">{currentPage}</span>
          <span className="mx-1 text-pip-boy-green/70">/</span>
          <span className="text-pip-boy-green/70">{totalPages}</span>
        </span>
      </div>

      {/* 下一頁按鈕 */}
      {renderButton(nextPage, '下一頁', !hasNextPage, '前往下一頁', 'next')}

      {/* 螢幕閱讀器專用頁碼資訊 */}
      <span className="sr-only">
        第 {currentPage} 頁,共 {totalPages} 頁
      </span>
    </nav>
  )
}

/**
 * PageNumbers - 頁碼列表元件
 *
 * 顯示可點擊的頁碼列表(適用於頁數較少的情況)
 */
export interface PageNumbersProps {
  currentPage: number
  totalPages: number
  baseUrl: string
  onPageChange?: (page: number) => void
  maxVisible?: number
  className?: string
  clientSideNavigation?: boolean
}

export function PageNumbers({
  currentPage,
  totalPages,
  baseUrl,
  onPageChange,
  maxVisible = 7,
  className,
  clientSideNavigation = false,
}: PageNumbersProps) {
  // 計算要顯示的頁碼範圍
  const getPageRange = (): number[] => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const pageRange = getPageRange()

  return (
    <div className={cn('flex items-center gap-1 md:gap-2', className)} role="navigation">
      {/* 第一頁(如果不在範圍內) */}
      {pageRange[0] > 1 && (
        <>
          <PageNumberButton
            page={1}
            currentPage={currentPage}
            baseUrl={baseUrl}
            onPageChange={onPageChange}
            clientSideNavigation={clientSideNavigation}
          />
          {pageRange[0] > 2 && <span className="text-pip-boy-green/50 px-1">...</span>}
        </>
      )}

      {/* 頁碼按鈕 */}
      {pageRange.map((page) => (
        <PageNumberButton
          key={page}
          page={page}
          currentPage={currentPage}
          baseUrl={baseUrl}
          onPageChange={onPageChange}
          clientSideNavigation={clientSideNavigation}
        />
      ))}

      {/* 最後一頁(如果不在範圍內) */}
      {pageRange[pageRange.length - 1] < totalPages && (
        <>
          {pageRange[pageRange.length - 1] < totalPages - 1 && (
            <span className="text-pip-boy-green/50 px-1">...</span>
          )}
          <PageNumberButton
            page={totalPages}
            currentPage={currentPage}
            baseUrl={baseUrl}
            onPageChange={onPageChange}
            clientSideNavigation={clientSideNavigation}
          />
        </>
      )}
    </div>
  )
}

/**
 * PageNumberButton - 單一頁碼按鈕
 */
interface PageNumberButtonProps {
  page: number
  currentPage: number
  baseUrl: string
  onPageChange?: (page: number) => void
  clientSideNavigation?: boolean
}

function PageNumberButton({
  page,
  currentPage,
  baseUrl,
  onPageChange,
  clientSideNavigation = false,
}: PageNumberButtonProps) {
  const isCurrent = page === currentPage

  const buttonContent = (
    <button
      className={cn(
        'min-w-[44px] min-h-[44px] px-3 py-2',
        'font-mono text-sm md:text-base font-semibold',
        'border-2 transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-pip-boy-green focus-visible:ring-offset-2',
        isCurrent
          ? 'bg-pip-boy-green text-black border-pip-boy-green'
          : 'bg-transparent text-pip-boy-green border-pip-boy-green/50 hover:border-pip-boy-green hover:bg-pip-boy-green/10'
      )}
      aria-label={isCurrent ? `當前頁碼 ${page}` : `前往第 ${page} 頁`}
      aria-current={isCurrent ? 'page' : undefined}
      disabled={isCurrent}
      onClick={clientSideNavigation && !isCurrent ? () => onPageChange?.(page) : undefined}
    >
      {page}
    </button>
  )

  if (isCurrent || clientSideNavigation) {
    return buttonContent
  }

  return (
    <Link href={`${baseUrl}?page=${page}`} aria-label={`前往第 ${page} 頁`}>
      {buttonContent}
    </Link>
  )
}

/**
 * SimplePagination - 簡化版分頁(僅顯示上一頁/下一頁)
 *
 * 適用於無限捲動或不需要顯示總頁數的情況
 */
export interface SimplePaginationProps {
  hasPrevPage: boolean
  hasNextPage: boolean
  onPrevPage: () => void
  onNextPage: () => void
  className?: string
}

export function SimplePagination({
  hasPrevPage,
  hasNextPage,
  onPrevPage,
  onNextPage,
  className,
}: SimplePaginationProps) {
  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      <PipBoyButton
        variant="secondary"
        size="md"
        disabled={!hasPrevPage}
        onClick={onPrevPage}
        aria-label="載入上一頁"
      >
        ← 上一頁
      </PipBoyButton>

      <PipBoyButton
        variant="secondary"
        size="md"
        disabled={!hasNextPage}
        onClick={onNextPage}
        aria-label="載入下一頁"
      >
        下一頁 →
      </PipBoyButton>
    </div>
  )
}
