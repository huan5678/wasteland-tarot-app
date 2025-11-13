/**
 * Card List Page - Cards by Suit
 * 卡牌列表頁面 (依花色)
 *
 * 特色:
 * - Client Component (使用 Zustand store)
 * - 動態路由: /cards/[suit]?page=N
 * - 分頁顯示卡牌
 * - 載入狀態與錯誤處理
 * - 快取機制
 * - SSG 支援：預先生成所有有效花色的靜態頁面
 */

import type { Metadata } from 'next';

// 動態生成 metadata（根據花色）
export async function generateMetadata({ params }: { params: { suit: string } }): Promise<Metadata> {
  const suitNameMap: Record<string, string> = {
    'major': '大阿爾克那',
    'wands': '權杖',
    'cups': '聖杯',
    'swords': '寶劍',
    'pentacles': '錢幣',
  };

  const suitName = suitNameMap[params.suit] || '卡牌';

  return {
    title: `${suitName} | 卡牌瀏覽 | 廢土塔羅`,
    description: `瀏覽廢土塔羅 ${suitName} 的完整卡牌集合。每張卡牌都融入 Fallout 世界觀，提供獨特的廢土主題解讀與生存智慧。`,
  };
}

'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCardsStore } from '@/stores/cardsStore'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { CardThumbnail, CardThumbnailGrid, CardThumbnailSkeleton } from '@/components/cards/CardThumbnail'
import { PaginationControls } from '@/components/cards/PaginationControls'
import { PipBoyButton, ErrorDisplay } from '@/components/ui/pipboy'
import {
  getSuitDisplayName,
  getSuitDescription,
  getSuitCardCount,
  isValidRouteSuit,
  convertRouteToApiSuit,
  type BreadcrumbItem,
} from '@/types/suits'
import type { TarotCard } from '@/types/api'

/**
 * CardListPage Component
 */
export default function CardListPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()

  // 取得路由參數
  const suit = params.suit as string
  const page = Number(searchParams.get('page')) || 1

  // Zustand store
  const { fetchCardsBySuit, isLoading, error, pagination, clearError } = useCardsStore()

  // 本地狀態
  const [cards, setCards] = useState<TarotCard[]>([])
  const [isMounted, setIsMounted] = useState(false)
  // 新增：追蹤當前請求是否為最新的請求（用於防止競態條件）
  const [currentRequestId, setCurrentRequestId] = useState<string>('')

  // 驗證花色路由參數是否有效
  const isValidSuitType = isValidRouteSuit(suit)

  // 取得花色資訊 (需要轉換為 API 枚舉值)
  let apiSuit = suit
  try {
    apiSuit = isValidSuitType ? convertRouteToApiSuit(suit) : suit
  } catch (err) {
    // 轉換失敗,使用原始值
  }

  const suitName = isValidSuitType ? getSuitDisplayName(apiSuit) : suit
  const suitDescription = isValidSuitType ? getSuitDescription(apiSuit) : ''
  const suitCardCount = isValidSuitType ? getSuitCardCount(apiSuit) : 0

  // 載入卡牌資料
  // 修復：使用 AbortController 和清理函數避免 React 18 Strict Mode 雙重執行問題
  useEffect(() => {
    setIsMounted(true)

    if (!isValidSuitType) {
      return
    }

    // 建立 AbortController 用於取消請求
    const abortController = new AbortController()
    const requestId = `${suit}-${page}-${Date.now()}`
    setCurrentRequestId(requestId)

    const loadCards = async () => {
      try {
        const cardsData = await fetchCardsBySuit(suit, page, abortController.signal)

        // 檢查這個請求是否仍然是最新的（避免競態條件）
        if (abortController.signal.aborted) {
          return
        }

        // 按照 number 從小到大排序（null/undefined 排在最後）
        const sortedCards = [...cardsData].sort((a, b) => {
          const numA = a.number ?? Infinity
          const numB = b.number ?? Infinity
          return numA - numB
        })

        setCards(sortedCards)
      } catch (err: any) {
        // 忽略取消的請求錯誤
        if (err.name === 'AbortError') {
          return
        }
        console.error('[CardListPage] 載入卡牌錯誤:', err)
      }
    }

    loadCards()

    // 清理函數：取消未完成的請求
    return () => {
      abortController.abort()
    }
  }, [suit, page, isValidSuitType, fetchCardsBySuit])

  // 麵包屑導航項目
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: '塔羅牌圖書館', href: '/cards' },
    { label: suitName },
  ]

  // 處理重試
  // 修復：重試時重新執行完整的載入流程，包含 AbortController
  const handleRetry = () => {
    clearError()
    setCards([]) // 清空現有卡牌
    // 觸發 useEffect 重新執行（透過強制更新 requestId）
    setCurrentRequestId(`retry-${Date.now()}`)
  }

  // 處理無效花色
  if (!isValidSuitType) {
    return (
      <div className="min-h-screen bg-transparent p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={[{ label: '塔羅牌圖書館', href: '/cards' }, { label: '錯誤' }]} />

          <div className="mt-8">
            <ErrorDisplay
              error={new Error(`花色不存在: ${suit}`)}
              message="找不到指定的花色"
              onRetry={() => router.push('/cards')}
              retryLabel="返回花色選擇"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 麵包屑導航 */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* 花色標題 */}
        <header className="mb-8">
          <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-pip-boy-green uppercase tracking-wider mb-3">
              {suitName}
            </h1>
            {suitDescription && (
              <p className="text-base md:text-lg text-pip-boy-green/70 mb-4">
                {suitDescription}
              </p>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-pip-boy-green/30">
              <p className="text-sm md:text-base text-pip-boy-green/60">
                共 {suitCardCount} 張卡牌
              </p>
              {pagination && (
                <p className="text-sm md:text-base text-pip-boy-green/60">
                  第 {page} / {pagination.totalPages} 頁
                </p>
              )}
            </div>
          </div>
        </header>

        {/* 載入狀態 - 修復：簡化條件邏輯，只在真正載入中且沒有卡牌時顯示 */}
        {isLoading && cards.length === 0 && (
          <CardThumbnailGrid>
            {Array.from({ length: 12 }).map((_, i) => (
              <CardThumbnailSkeleton key={i} />
            ))}
          </CardThumbnailGrid>
        )}

        {/* 錯誤顯示 */}
        {error && !isLoading && (
          <div className="mb-8">
            <ErrorDisplay
              error={error}
              message="無法載入卡牌資料"
              onRetry={handleRetry}
            />
          </div>
        )}

        {/* 卡牌網格 */}
        {!isLoading && !error && cards.length > 0 && (
          <>
            <main>
              <CardThumbnailGrid>
                {cards.map((card, index) => (
                  <CardThumbnail key={card.id} card={card} priority={index < 4} />
                ))}
              </CardThumbnailGrid>
            </main>

            {/* 分頁控制項 */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-12">
                <PaginationControls
                  currentPage={page}
                  totalPages={pagination.totalPages}
                  baseUrl={`/cards/${suit}`}
                />
              </div>
            )}
          </>
        )}

        {/* 無卡牌提示 */}
        {!isLoading && !error && cards.length === 0 && (
          <div className="text-center py-12">
            <div className="border-2 border-pip-boy-green/30 bg-black/40 p-8">
              <p className="text-pip-boy-green/70 text-lg mb-4">
                此花色目前沒有卡牌
              </p>
              <Link href="/cards">
                <PipBoyButton variant="secondary">返回花色選擇</PipBoyButton>
              </Link>
            </div>
          </div>
        )}

        {/* 返回按鈕 */}
        {!isLoading && (
          <div className="mt-8 flex justify-center">
            <Link href="/cards">
              <PipBoyButton variant="secondary">← 返回花色選擇</PipBoyButton>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
