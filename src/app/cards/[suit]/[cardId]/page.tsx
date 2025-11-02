/**
 * Card Detail Page
 * 卡牌詳細頁面
 *
 * 特色:
 * - Client Component (使用 Zustand store)
 * - 動態路由: /cards/[suit]/[cardId]
 * - 顯示完整卡牌資訊
 * - 上一張/下一張導航
 * - 載入狀態與錯誤處理
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCardsStore } from '@/stores/cardsStore'
import { useAdjacentCards } from '@/hooks/useAdjacentCards'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { PipBoyButton, PipBoyCard, LoadingSpinner, ErrorDisplay } from '@/components/ui/pipboy'
import { WastelandStorySection } from '@/components/cards/WastelandStorySection'
import {
  getSuitDisplayName,
  isValidSuit,
  isValidRouteSuit,
  convertRouteToApiSuit,
  convertApiToRouteSuit,
  type BreadcrumbItem,
  SuitType,
} from '@/types/suits'
import { getCardImageUrl, getCardImageAlt, getFallbackImageUrl } from '@/lib/utils/cardImages'
import type { TarotCard } from '@/types/api'

/**
 * CardDetailPage Component
 */
export default function CardDetailPage() {
  const router = useRouter()
  const params = useParams()

  // 取得路由參數
  const routeSuit = params.suit as string
  const cardId = params.cardId as string

  // 驗證路由參數並轉換為 API 枚舉值
  const isValidSuitType = isValidRouteSuit(routeSuit)
  let apiSuit = routeSuit
  try {
    apiSuit = isValidSuitType ? convertRouteToApiSuit(routeSuit) : routeSuit
  } catch (err) {
    // 轉換失敗，使用原始值
  }
  const suitName = isValidSuitType ? getSuitDisplayName(apiSuit) : routeSuit

  // Zustand store
  const { fetchCardById, isLoading, error, clearError } = useCardsStore()

  // 本地狀態
  const [card, setCard] = useState<TarotCard | null>(null)
  const [imageError, setImageError] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // 相鄰卡牌（傳入簡短路由名稱）
  const { previousCard, nextCard, currentPage, isLoading: adjacentLoading } = useAdjacentCards(routeSuit, cardId)

  // 載入卡牌資料
  useEffect(() => {
    setIsMounted(true)
    // 重要：當 cardId 改變時，立即清空舊卡牌避免閃現錯誤頁面
    setCard(null)
    // 同時重置圖片錯誤狀態，避免新卡片使用舊的 fallback 圖片
    setImageError(false)

    const loadCard = async () => {
      try {
        const cardData = await fetchCardById(cardId)
        setCard(cardData)
      } catch (err) {
        console.error('[CardDetailPage] Error loading card:', err)
      }
    }

    loadCard()
  }, [cardId, fetchCardById])

  // 麵包屑導航項目（使用簡短路由名稱）
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: '塔羅牌圖書館', href: '/cards' },
    { label: suitName, href: `/cards/${routeSuit}` },
    { label: card?.name || '載入中...' },
  ]

  // 處理重試
  const handleRetry = () => {
    clearError()
    fetchCardById(cardId)
  }

  // 處理圖片錯誤
  const handleImageError = () => {
    setImageError(true)
  }

  // 載入狀態：顯示載入畫面直到卡牌資料載入完成
  if ((isLoading || !card) && !error) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // 錯誤狀態：API 請求失敗
  if (error && !card) {
    return (
      <div className="min-h-screen bg-transparent p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={breadcrumbItems} />
          <div className="mt-8">
            <ErrorDisplay
              error={error}
              message="無法載入卡牌資訊"
              onRetry={handleRetry}
            />
          </div>
        </div>
      </div>
    )
  }

  // 卡牌不存在：API 回應 null（不應該發生）
  if (!card) {
    return (
      <div className="min-h-screen bg-transparent p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={breadcrumbItems} />
          <div className="mt-8">
            <ErrorDisplay
              error={new Error('找不到卡牌')}
              message={`找不到 ID 為 ${cardId} 的卡牌`}
              onRetry={() => router.push(`/cards/${routeSuit}`)}
              retryLabel="返回卡牌列表"
            />
          </div>
        </div>
      </div>
    )
  }

  const imageUrl = imageError ? getFallbackImageUrl() : getCardImageUrl(card)
  const imageAlt = getCardImageAlt(card)

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 麵包屑導航 */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* 卡牌內容 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* 左側:卡牌圖片 */}
          <div className="flex flex-col items-center">
            {/* 卡牌圖片 */}
            <PipBoyCard padding="sm" className="w-full max-w-md">
              <div className="relative aspect-[2/3] bg-black overflow-hidden">
                <Image
                  key={card.id}
                  src={imageUrl}
                  alt={imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 500px"
                  className="object-contain"
                  priority
                  onError={handleImageError}
                />

                {/* Pip-Boy 掃描線效果 */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(51, 255, 51, 0.1) 2px, rgba(51, 255, 51, 0.1) 4px)',
                  }}
                />
              </div>
            </PipBoyCard>

            {/* 導航按鈕 */}
            <div className="mt-6 w-full max-w-md">
              <div className="flex items-center justify-between gap-4">
                {/* 上一張按鈕 */}
                {previousCard ? (
                  <Link href={`/cards/${routeSuit}/${previousCard.id}`} className="flex-1">
                    <PipBoyButton variant="secondary" className="w-full">
                      ← 上一張
                    </PipBoyButton>
                  </Link>
                ) : (
                  <PipBoyButton variant="secondary" disabled className="flex-1">
                    ← 上一張
                  </PipBoyButton>
                )}

                {/* 返回按鈕 */}
                <Link href={`/cards/${routeSuit}${currentPage > 1 ? `?page=${currentPage}` : ''}`} className="flex-1">
                  <PipBoyButton variant="secondary" className="w-full">
                    返回列表
                  </PipBoyButton>
                </Link>

                {/* 下一張按鈕 */}
                {nextCard ? (
                  <Link href={`/cards/${routeSuit}/${nextCard.id}`} className="flex-1">
                    <PipBoyButton variant="secondary" className="w-full">
                      下一張 →
                    </PipBoyButton>
                  </Link>
                ) : (
                  <PipBoyButton variant="secondary" disabled className="flex-1">
                    下一張 →
                  </PipBoyButton>
                )}
              </div>
            </div>
          </div>

          {/* 右側:卡牌資訊 */}
          <div className="space-y-6">
            {/* 卡牌標題 */}
            <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-6">
              <h1 className="text-3xl md:text-4xl font-bold text-pip-boy-green uppercase tracking-wider mb-2">
                {card.name}
              </h1>
              {card.name_en && (
                <p className="text-lg md:text-xl text-pip-boy-green/70 uppercase mb-4">
                  {card.name_en}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm md:text-base text-pip-boy-green/60">
                <span>{suitName}</span>
                {card.number !== null && card.number !== undefined && (
                  <span>#{String(card.number).padStart(2, '0')}</span>
                )}
              </div>
            </div>

            {/* 正位牌義 */}
            {card.upright_meaning && (
              <PipBoyCard>
                <h2 className="text-xl md:text-2xl font-bold text-pip-boy-green uppercase mb-4">
                  正位牌義
                </h2>
                <p className="text-sm md:text-base text-pip-boy-green/70 leading-relaxed whitespace-pre-wrap">
                  {card.upright_meaning}
                </p>
              </PipBoyCard>
            )}

            {/* 逆位牌義 */}
            {card.reversed_meaning && (
              <PipBoyCard>
                <h2 className="text-xl md:text-2xl font-bold text-pip-boy-green uppercase mb-4">
                  逆位牌義
                </h2>
                <p className="text-sm md:text-base text-pip-boy-green/70 leading-relaxed whitespace-pre-wrap">
                  {card.reversed_meaning}
                </p>
              </PipBoyCard>
            )}

            {/* Fallout 主題描述 */}
            {card.fallout_description && (
              <PipBoyCard>
                <h2 className="text-xl md:text-2xl font-bold text-pip-boy-green uppercase mb-4">
                  廢土主題
                </h2>
                <p className="text-sm md:text-base text-pip-boy-green/70 leading-relaxed whitespace-pre-wrap">
                  {card.fallout_description}
                </p>
              </PipBoyCard>
            )}

            {/* 關鍵字 */}
            {card.keywords && card.keywords.length > 0 && (
              <PipBoyCard>
                <h2 className="text-xl md:text-2xl font-bold text-pip-boy-green uppercase mb-4">
                  關鍵字
                </h2>
                <div className="flex flex-wrap gap-2">
                  {card.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-pip-boy-green/20 border border-pip-boy-green/50 text-pip-boy-green text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </PipBoyCard>
            )}

            {/* 元資料 */}
            {card.metadata && (
              <PipBoyCard>
                <h2 className="text-xl md:text-2xl font-bold text-pip-boy-green uppercase mb-4">
                  輻射與威脅等級
                </h2>
                <div className="space-y-2 text-sm md:text-base text-pip-boy-green/70">
                  {card.metadata.radiation_level !== undefined && (
                    <div className="flex justify-between">
                      <span>輻射等級:</span>
                      <span className="text-pip-boy-green">
                        {(card.metadata.radiation_level * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  {card.metadata.threat_level !== undefined && (
                    <div className="flex justify-between">
                      <span>威脅等級:</span>
                      <span className="text-pip-boy-green">{card.metadata.threat_level}/10</span>
                    </div>
                  )}
                  {card.metadata.vault_number !== null &&
                    card.metadata.vault_number !== undefined && (
                      <div className="flex justify-between">
                        <span>避難所編號:</span>
                        <span className="text-pip-boy-green">Vault {card.metadata.vault_number}</span>
                      </div>
                    )}
                </div>
              </PipBoyCard>
            )}

            {/* Wasteland Story Section */}
            <WastelandStorySection
              story={card.story}
              audioUrls={card.audio_urls}
              cardName={card.name}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
