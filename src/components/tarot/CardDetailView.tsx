/**
 * CardDetailView - 統一的卡牌詳情內容組件
 * 可用於桌面端 Modal 和移動端 Page
 *
 * 支援場景：
 * 1. /readings/quick - 快速解讀（4張卡）
 * 2. /readings/[id] - 完整占卜記錄（1/3/10張卡）
 */

'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { PixelIcon } from '@/components/ui/icons'
import type { IconName } from '@/components/ui/icons'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getCardImageUrl, getCardImageAlt } from '@/lib/utils/cardImages'

/**
 * 卡牌資料介面（與 WastelandCard 相容）
 */
export interface CardDetailData {
  id: string | number
  name: string
  suit: string
  number?: number
  card_number?: number
  image_url?: string
  description?: string
  upright_meaning?: string
  reversed_meaning?: string
  meaning_upright?: string
  meaning_reversed?: string
  keywords?: string[]
  fallout_reference?: string
  radiation_factor?: number
  karma_alignment?: 'GOOD' | 'NEUTRAL' | 'EVIL'
  element?: string
  astrological_association?: string
  symbolism?: string
}

/**
 * 占卜情境資訊（來自 /readings/[id]）
 */
export interface ReadingContext {
  question?: string
  spreadType?: string
  positionName?: string
  positionMeaning?: string
  cardIndex?: number
  totalCards?: number
}

/**
 * CardDetailView Props
 */
export interface CardDetailViewProps {
  // 核心資料
  card: CardDetailData

  // 占卜情境（可選，僅 /readings/[id] 使用）
  readingContext?: ReadingContext

  // 交互
  onClose: () => void

  // 佈局模式
  isFullPage?: boolean  // true = 移動端全頁面，false = 桌面端 Modal

  // 功能開關（未來擴展）
  enableAudio?: boolean
  showQuickActions?: boolean
  isGuestMode?: boolean
}

/**
 * Tab 類型
 */
type TabType = 'overview' | 'meanings' | 'lore'

interface TabConfig {
  id: TabType
  label: string
  icon: IconName
  color: string
}

const TABS: TabConfig[] = [
  { id: 'overview', label: '總覽', icon: 'eye-2', color: 'text-pip-boy-green' },
  { id: 'meanings', label: '牌義', icon: 'book-open', color: 'text-blue-400' },
  { id: 'lore', label: '故事', icon: 'fire', color: 'text-radiation-orange' }
]

/**
 * 輔助函式：取得輻射等級
 */
const getRadiationLevel = (factor: number = 0) => {
  if (factor >= 0.8) return { label: '極高輻射', color: 'text-red-400', bgColor: 'bg-red-900/30' }
  if (factor >= 0.6) return { label: '高輻射', color: 'text-orange-400', bgColor: 'bg-orange-900/30' }
  if (factor >= 0.4) return { label: '中等輻射', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' }
  if (factor >= 0.2) return { label: '低輻射', color: 'text-pip-boy-green/60', bgColor: 'bg-pip-boy-green/10' }
  return { label: '安全', color: 'text-pip-boy-green', bgColor: 'bg-pip-boy-green/10' }
}

/**
 * 輔助函式：取得業力顏色
 */
const getKarmaColor = (alignment?: string) => {
  switch (alignment) {
    case 'GOOD': return 'text-blue-400'
    case 'EVIL': return 'text-red-400'
    default: return 'text-pip-boy-green/70'
  }
}

/**
 * CardDetailView 組件
 */
export function CardDetailView({
  card,
  readingContext,
  onClose,
  isFullPage = false,
  enableAudio = false,
  showQuickActions = false,
  isGuestMode = false
}: CardDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [imageLoaded, setImageLoaded] = useState(false)

  // 相容性處理：支援兩種欄位命名
  const meaningUpright = card.meaning_upright || card.upright_meaning || ''
  const meaningReversed = card.meaning_reversed || card.reversed_meaning || ''

  // 輻射等級
  const radiationLevel = useMemo(
    () => getRadiationLevel(card.radiation_factor),
    [card.radiation_factor]
  )

  // 業力顏色
  const karmaColor = useMemo(
    () => getKarmaColor(card.karma_alignment),
    [card.karma_alignment]
  )

  // 圖片 URL
  const imageUrl = card.image_url || getCardImageUrl(card as any)

  /**
   * 渲染 Header（固定在頂部）
   */
  const renderHeader = () => (
    <div
      className={cn(
        'flex items-center justify-between border-b border-pip-boy-green/30 bg-wasteland-dark',
        isFullPage ? 'sticky top-0 z-20 px-4 py-3' : 'p-4'
      )}
    >
      {/* 返回按鈕 */}
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-pip-boy-green hover:text-pip-boy-green/80 transition-colors"
        aria-label="返回"
      >
        <PixelIcon name="arrow-left" sizePreset="sm" decorative />
        <span className="text-sm font-bold uppercase tracking-wider">
          {isFullPage ? '返回' : '關閉'}
        </span>
      </button>

      {/* 占卜情境標籤（如果有）*/}
      {readingContext && (
        <div className="flex items-center gap-2 text-xs text-pip-boy-green/60">
          <PixelIcon name="spade" sizePreset="xs" decorative />
          <span>
            {readingContext.cardIndex !== undefined && readingContext.totalCards
              ? `${readingContext.cardIndex + 1}/${readingContext.totalCards}`
              : readingContext.positionName}
          </span>
        </div>
      )}
    </div>
  )

  /**
   * 渲染 Tab 導航
   */
  const renderTabs = () => (
    <div className="border-b border-pip-boy-green/30 bg-wasteland-dark/50 flex overflow-x-auto">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-all whitespace-nowrap',
              isActive
                ? `${tab.color} border-current bg-pip-boy-green/5`
                : 'text-pip-boy-green/60 border-transparent hover:text-pip-boy-green/80'
            )}
          >
            <PixelIcon name={tab.icon} sizePreset="xs" decorative />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )

  /**
   * 渲染總覽 Tab
   */
  const renderOverviewTab = () => (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* 占卜情境資訊（如果有）*/}
      {readingContext && (
        <div className="bg-pip-boy-green/5 border border-pip-boy-green/30 p-4 rounded">
          <h3 className="text-sm font-bold text-pip-boy-green mb-2 flex items-center gap-2">
            <PixelIcon name="info" sizePreset="xs" decorative />
            占卜情境
          </h3>

          {readingContext.question && (
            <p className="text-xs text-pip-boy-green/80 mb-2 italic">
              "{readingContext.question}"
            </p>
          )}

          <div className="flex flex-wrap gap-2 text-xs">
            {readingContext.spreadType && (
              <span className="px-2 py-1 bg-pip-boy-green/20 border border-pip-boy-green/50 rounded">
                {readingContext.spreadType}
              </span>
            )}
            {readingContext.positionName && (
              <span className="px-2 py-1 bg-pip-boy-green/10 border border-pip-boy-green/30 rounded">
                {readingContext.positionName}
              </span>
            )}
          </div>

          {readingContext.positionMeaning && (
            <p className="text-xs text-pip-boy-green/70 mt-2">
              {readingContext.positionMeaning}
            </p>
          )}
        </div>
      )}

      {/* 卡牌圖片 */}
      <div className="relative aspect-[2/3] max-w-xs mx-auto border-2 border-pip-boy-green/60 rounded-lg overflow-hidden bg-black">
        <Image
          src={imageUrl}
          alt={getCardImageAlt(card as any)}
          fill
          className={cn(
            'object-contain transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          priority
        />

        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <PixelIcon
              name="loader"
              animation="spin"
              sizePreset="lg"
              variant="primary"
              decorative
            />
          </div>
        )}
      </div>

      {/* 基本資訊 */}
      <div className="text-center">
        <h2 className="text-2xl text-pip-boy-green font-bold mb-2">
          {card.name}
        </h2>
        <div className="flex items-center justify-center gap-2 text-sm text-pip-boy-green/70">
          <PixelIcon name="spade" sizePreset="xs" decorative />
          <span>{card.suit}</span>
        </div>
      </div>

      {/* 屬性標籤 */}
      <div className="flex flex-wrap justify-center gap-2">
        {/* 輻射等級 */}
        {card.radiation_factor !== undefined && (
          <div className={cn('px-3 py-1.5 rounded border text-xs font-bold', radiationLevel.bgColor, radiationLevel.color)}>
            <PixelIcon name="radioactive" size={12} className="inline mr-1" decorative />
            {radiationLevel.label}
          </div>
        )}

        {/* 業力陣營 */}
        {card.karma_alignment && (
          <div className={cn('px-3 py-1.5 rounded border text-xs font-bold bg-black/30', `border-${karmaColor.replace('text-', '')}/50`, karmaColor)}>
            <PixelIcon name="zap" size={12} className="inline mr-1" decorative />
            {card.karma_alignment}
          </div>
        )}

        {/* 元素 */}
        {card.element && (
          <div className="px-3 py-1.5 rounded border border-pip-boy-green/30 bg-pip-boy-green/5 text-xs font-bold text-pip-boy-green">
            {card.element}
          </div>
        )}
      </div>

      {/* 關鍵詞 */}
      {card.keywords && card.keywords.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-pip-boy-green mb-2">關鍵詞</h3>
          <div className="flex flex-wrap gap-2">
            {card.keywords.map((keyword, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-pip-boy-green/10 border border-pip-boy-green/30 text-xs rounded text-pip-boy-green/80"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 描述 */}
      {card.description && (
        <div className="bg-black/50 border border-pip-boy-green/20 p-4 rounded">
          <p className="text-sm text-pip-boy-green/90 leading-relaxed">
            {card.description}
          </p>
        </div>
      )}
    </motion.div>
  )

  /**
   * 渲染牌義 Tab
   */
  const renderMeaningsTab = () => (
    <motion.div
      key="meanings"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* 正位牌義 */}
      {meaningUpright && (
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 rounded">
          <h3 className="text-sm font-bold text-pip-boy-green mb-3 flex items-center gap-2">
            <PixelIcon name="arrow-up-s" sizePreset="xs" decorative />
            正位牌義
          </h3>
          <p className="text-sm text-pip-boy-green/90 leading-relaxed whitespace-pre-wrap">
            {meaningUpright}
          </p>
        </div>
      )}

      {/* 逆位牌義 */}
      {meaningReversed && (
        <div className="border-2 border-orange-400/30 bg-orange-500/5 p-4 rounded">
          <h3 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
            <PixelIcon name="arrow-down-s" sizePreset="xs" decorative />
            逆位牌義
          </h3>
          <p className="text-sm text-orange-300/90 leading-relaxed whitespace-pre-wrap">
            {meaningReversed}
          </p>
        </div>
      )}

      {/* 象徵意義 */}
      {card.symbolism && (
        <div className="border border-pip-boy-green/20 bg-black/50 p-4 rounded">
          <h3 className="text-sm font-bold text-pip-boy-green mb-2 flex items-center gap-2">
            <PixelIcon name="star" sizePreset="xs" decorative />
            象徵意義
          </h3>
          <p className="text-sm text-pip-boy-green/80 leading-relaxed">
            {card.symbolism}
          </p>
        </div>
      )}

      {/* 占星關聯 */}
      {card.astrological_association && (
        <div className="border border-pip-boy-green/20 bg-black/50 p-4 rounded">
          <h3 className="text-sm font-bold text-pip-boy-green mb-2 flex items-center gap-2">
            <PixelIcon name="sun" sizePreset="xs" decorative />
            占星關聯
          </h3>
          <p className="text-sm text-pip-boy-green/80">
            {card.astrological_association}
          </p>
        </div>
      )}
    </motion.div>
  )

  /**
   * 渲染故事 Tab
   */
  const renderLoreTab = () => (
    <motion.div
      key="lore"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Fallout 典故 */}
      {card.fallout_reference && (
        <div className="border-2 border-radiation-orange/30 bg-radiation-orange/5 p-4 rounded">
          <h3 className="text-sm font-bold text-radiation-orange mb-3 flex items-center gap-2">
            <PixelIcon name="fire" sizePreset="xs" decorative />
            廢土典故
          </h3>
          <p className="text-sm text-radiation-orange/90 leading-relaxed whitespace-pre-wrap">
            {card.fallout_reference}
          </p>
        </div>
      )}

      {!card.fallout_reference && (
        <div className="text-center py-8 text-pip-boy-green/50">
          <PixelIcon name="alert" sizePreset="lg" className="mx-auto mb-2" decorative />
          <p className="text-sm">此卡牌尚無廢土故事資料</p>
        </div>
      )}
    </motion.div>
  )

  /**
   * 主渲染
   */
  return (
    <div
      className={cn(
        'bg-wasteland-dark text-pip-boy-green flex flex-col',
        isFullPage ? 'min-h-screen pb-20' : 'h-full'
      )}
    >
      {/* Header - 固定 */}
      {renderHeader()}

      {/* Tab 導航 - 固定 */}
      {renderTabs()}

      {/* 內容區域 - 可滾動 */}
      <div className={cn('flex-1 overflow-y-auto', isFullPage ? 'px-4 py-6' : 'p-6')}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'meanings' && renderMeaningsTab()}
        {activeTab === 'lore' && renderLoreTab()}
      </div>
    </div>
  )
}
