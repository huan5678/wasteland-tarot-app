/**
 * Breadcrumb Component
 * 麵包屑導航元件
 *
 * 特色:
 * - 顯示當前頁面在導航階層中的位置
 * - Pip-Boy 風格設計
 * - 完整的無障礙性支援
 * - 響應式設計
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { BreadcrumbItem } from '@/types/suits'

export interface BreadcrumbProps {
  /**
   * 麵包屑項目列表
   */
  items: BreadcrumbItem[]

  /**
   * 分隔符(預設為 '/')
   */
  separator?: React.ReactNode

  /**
   * 自定義類別
   */
  className?: string

  /**
   * 是否顯示首頁連結
   */
  showHome?: boolean

  /**
   * 首頁標籤(預設為 '首頁')
   */
  homeLabel?: string

  /**
   * 首頁路徑(預設為 '/')
   */
  homePath?: string
}

/**
 * Breadcrumb 元件
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: '卡牌圖書館', href: '/cards' },
 *     { label: 'Nuka-Cola 瓶', href: '/cards/nuka-cola' },
 *     { label: 'Ace of Nuka-Cola' }
 *   ]}
 * />
 * ```
 */
export function Breadcrumb({
  items,
  separator = '/',
  className,
  showHome = true,
  homeLabel = '首頁',
  homePath = '/',
}: BreadcrumbProps) {
  // 組合完整的導航項目(包含首頁)
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: homeLabel, href: homePath }, ...items]
    : items

  return (
    <nav
      className={cn('flex items-center flex-wrap gap-2 text-sm md:text-base', className)}
      aria-label="麵包屑導航"
    >
      <ol className="flex items-center flex-wrap gap-2" role="list">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          const isClickable = item.href && !isLast

          return (
            <li key={index} className="flex items-center gap-2" role="listitem">
              {/* 麵包屑項目 */}
              {isClickable ? (
                <Link
                  href={item.href}
                  className={cn(
                    'font-mono text-pip-boy-green hover:text-pip-boy-green-bright',
                    'transition-colors duration-200',
                    'focus:outline-none focus-visible:underline focus-visible:underline-offset-4',
                    'hover:underline hover:underline-offset-4'
                  )}
                  aria-label={`前往 ${item.label}`}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'font-mono',
                    isLast
                      ? 'text-pip-boy-green-bright font-semibold' // 當前頁面
                      : 'text-pip-boy-green/70' // 無連結項目
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}

              {/* 分隔符 */}
              {!isLast && (
                <span
                  className="text-pip-boy-green/50 font-mono select-none"
                  aria-hidden="true"
                >
                  {separator}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * CompactBreadcrumb - 緊湊版麵包屑
 *
 * 僅顯示上一層與當前頁(適用於行動裝置或空間有限的情況)
 */
export interface CompactBreadcrumbProps {
  /**
   * 上一層項目
   */
  parent: BreadcrumbItem

  /**
   * 當前頁面名稱
   */
  current: string

  /**
   * 自定義類別
   */
  className?: string
}

export function CompactBreadcrumb({ parent, current, className }: CompactBreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-2 text-sm', className)} aria-label="麵包屑導航">
      {/* 返回按鈕 */}
      {parent.href && (
        <Link
          href={parent.href}
          className={cn(
            'flex items-center gap-1',
            'font-mono text-pip-boy-green hover:text-pip-boy-green-bright',
            'transition-colors duration-200',
            'focus:outline-none focus-visible:underline'
          )}
          aria-label={`返回 ${parent.label}`}
        >
          <span aria-hidden="true">←</span>
          <span className="hidden sm:inline">{parent.label}</span>
          <span className="sm:hidden">返回</span>
        </Link>
      )}

      {/* 分隔符 */}
      <span className="text-pip-boy-green/50 font-mono" aria-hidden="true">
        /
      </span>

      {/* 當前頁面 */}
      <span
        className="font-mono text-pip-boy-green-bright font-semibold truncate"
        aria-current="page"
      >
        {current}
      </span>
    </nav>
  )
}

/**
 * BreadcrumbSkeleton - 麵包屑載入骨架屏
 */
export function BreadcrumbSkeleton({ items = 3 }: { items?: number }) {
  return (
    <nav className="flex items-center gap-2" aria-label="載入中">
      <div className="flex items-center gap-2 animate-pulse">
        {Array.from({ length: items }).map((_, index) => (
          <React.Fragment key={index}>
            <div className="h-4 w-20 bg-pip-boy-green/20 rounded" />
            {index < items - 1 && (
              <span className="text-pip-boy-green/30 font-mono">/</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  )
}

/**
 * IconBreadcrumb - 帶圖示的麵包屑
 *
 * 每個項目可以包含圖示
 */
export interface IconBreadcrumbItem extends BreadcrumbItem {
  icon?: React.ReactNode
}

export interface IconBreadcrumbProps {
  items: IconBreadcrumbItem[]
  separator?: React.ReactNode
  className?: string
}

export function IconBreadcrumb({ items, separator = '/', className }: IconBreadcrumbProps) {
  return (
    <nav
      className={cn('flex items-center flex-wrap gap-2 text-sm md:text-base', className)}
      aria-label="麵包屑導航"
    >
      <ol className="flex items-center flex-wrap gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isClickable = item.href && !isLast

          return (
            <li key={index} className="flex items-center gap-2">
              {/* 項目 */}
              {isClickable ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5',
                    'font-mono text-pip-boy-green hover:text-pip-boy-green-bright',
                    'transition-colors duration-200',
                    'focus:outline-none focus-visible:underline'
                  )}
                >
                  {item.icon && (
                    <span className="text-base" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    'flex items-center gap-1.5 font-mono',
                    isLast ? 'text-pip-boy-green-bright font-semibold' : 'text-pip-boy-green/70'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon && (
                    <span className="text-base" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </span>
              )}

              {/* 分隔符 */}
              {!isLast && (
                <span className="text-pip-boy-green/50 font-mono" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
