/**
 * Daily Card Back Test Page
 * 測試每日隨機卡背功能
 */

'use client'

import React, { useState } from 'react'
import { DailyCardBackProvider, useDailyCardBackContext } from '@/components/providers/DailyCardBackProvider'
import { TarotCardWithDailyBack } from '@/components/tarot/TarotCardWithDailyBack'
import { PipBoyButton, PipBoyCard } from '@/components/ui/pipboy'
import { PixelIcon } from '@/components/ui/icons'
import { CARD_BACKS, getCardBackPath } from '@/config/cardBackConfig'
import { getDailyCardBackData, clearDailyCardBackData } from '@/hooks/useDailyCardBack'

/**
 * 測試用卡牌資料
 */
const mockCard = {
  id: 1,
  name: '新手避難所居民',
  suit: 'major_arcana',
  number: 0,
  meaning_upright: '天真、新開始、無知即福',
  meaning_reversed: '魯莽、缺乏準備',
  image_url: '/assets/cards/placeholder.png',
  keywords: ['新開始', '冒險', '天真'],
}

/**
 * 測試頁面內容元件
 */
function TestPageContent() {
  const { cardBackPath, isLoading, refreshCardBack } = useDailyCardBackContext()
  const [showInfo, setShowInfo] = useState(false)

  // 取得儲存的資料
  const savedData = getDailyCardBackData()

  /**
   * 清除並重新整理
   */
  const handleClear = () => {
    clearDailyCardBackData()
    refreshCardBack()
  }

  return (
    <div className="min-h-screen bg-wasteland-dark p-6">
      <div className="max-w-6xl mx-auto">
        {/* 標題 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-pip-boy-green uppercase tracking-wider mb-2">
            每日隨機卡背測試
          </h1>
          <p className="text-pip-boy-green/70">
            Daily Random Card Back Test
          </p>
        </div>

        {/* 控制面板 */}
        <PipBoyCard className="mb-8">
          <h2 className="text-xl font-bold text-pip-boy-green uppercase mb-4">
            <PixelIcon name="settings" size={20} className="inline mr-2" decorative />
            控制面板
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <PipBoyButton
              onClick={refreshCardBack}
              disabled={isLoading}
              className="w-full"
            >
              <PixelIcon name="refresh" size={16} className="inline mr-2" decorative />
              重新隨機選擇
            </PipBoyButton>

            <PipBoyButton
              onClick={handleClear}
              variant="secondary"
              className="w-full"
            >
              <PixelIcon name="trash" size={16} className="inline mr-2" decorative />
              清除並重設
            </PipBoyButton>

            <PipBoyButton
              onClick={() => setShowInfo(!showInfo)}
              variant="secondary"
              className="w-full"
            >
              <PixelIcon name="info" size={16} className="inline mr-2" decorative />
              {showInfo ? '隱藏' : '顯示'}資訊
            </PipBoyButton>
          </div>

          {/* 資訊顯示 */}
          {showInfo && savedData && (
            <div className="bg-black/40 border border-pip-boy-green/30 p-4 rounded">
              <div className="text-sm text-pip-boy-green/70 space-y-2">
                <div>
                  <strong className="text-pip-boy-green">當前卡背：</strong>{' '}
                  {savedData.cardBackFile}
                </div>
                <div>
                  <strong className="text-pip-boy-green">記錄日期：</strong>{' '}
                  {savedData.date}
                </div>
                <div>
                  <strong className="text-pip-boy-green">記錄時間：</strong>{' '}
                  {new Date(savedData.timestamp).toLocaleString('zh-TW')}
                </div>
                <div>
                  <strong className="text-pip-boy-green">完整路徑：</strong>{' '}
                  {cardBackPath}
                </div>
              </div>
            </div>
          )}
        </PipBoyCard>

        {/* 卡牌展示區 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* 未翻開的卡片（使用每日卡背） */}
          <div>
            <PipBoyCard className="mb-4">
              <h3 className="text-lg font-bold text-pip-boy-green uppercase mb-4 text-center">
                未翻開（每日卡背）
              </h3>
              <div className="flex justify-center">
                <TarotCardWithDailyBack
                  card={mockCard}
                  isRevealed={false}
                  position="upright"
                  size="medium"
                  flipStyle="kokonut"
                />
              </div>
            </PipBoyCard>
          </div>

          {/* 翻開的卡片 */}
          <div>
            <PipBoyCard className="mb-4">
              <h3 className="text-lg font-bold text-pip-boy-green uppercase mb-4 text-center">
                已翻開
              </h3>
              <div className="flex justify-center">
                <TarotCardWithDailyBack
                  card={mockCard}
                  isRevealed={true}
                  position="upright"
                  size="medium"
                  flipStyle="kokonut"
                />
              </div>
            </PipBoyCard>
          </div>

          {/* 自訂卡背 */}
          <div>
            <PipBoyCard className="mb-4">
              <h3 className="text-lg font-bold text-pip-boy-green uppercase mb-4 text-center">
                自訂卡背
              </h3>
              <div className="flex justify-center">
                <TarotCardWithDailyBack
                  card={mockCard}
                  isRevealed={false}
                  position="upright"
                  size="medium"
                  flipStyle="kokonut"
                  cardBackUrl="/assets/cards/card-backs/05.png"
                />
              </div>
            </PipBoyCard>
          </div>
        </div>

        {/* 可用卡背列表 */}
        <PipBoyCard>
          <h2 className="text-xl font-bold text-pip-boy-green uppercase mb-4">
            <PixelIcon name="list" size={20} className="inline mr-2" decorative />
            可用卡背列表 ({CARD_BACKS.length} 張)
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {CARD_BACKS.map((cardBack) => (
              <div
                key={cardBack.filename}
                className="border border-pip-boy-green/30 p-2 rounded hover:border-pip-boy-green transition-colors"
              >
                <div className="aspect-[2/3] bg-black mb-2 rounded overflow-hidden">
                  <img
                    src={getCardBackPath(cardBack.filename)}
                    alt={cardBack.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/cards/card-backs/01.png'
                    }}
                  />
                </div>
                <div className="text-xs text-pip-boy-green text-center truncate">
                  {cardBack.name}
                </div>
                <div className="text-xs text-pip-boy-green/60 text-center truncate">
                  {cardBack.theme}
                </div>
              </div>
            ))}
          </div>
        </PipBoyCard>

        {/* 使用說明 */}
        <PipBoyCard className="mt-8">
          <h2 className="text-xl font-bold text-pip-boy-green uppercase mb-4">
            <PixelIcon name="book" size={20} className="inline mr-2" decorative />
            使用說明
          </h2>

          <div className="text-sm text-pip-boy-green/70 space-y-2">
            <p>
              <strong className="text-pip-boy-green">每日隨機：</strong>
              系統會在每天第一次進入網站時隨機選擇一張卡背，並記錄到 localStorage。
            </p>
            <p>
              <strong className="text-pip-boy-green">換日更新：</strong>
              當再次進入網站時，系統會檢查日期，如果已經換日則重新隨機選擇。
            </p>
            <p>
              <strong className="text-pip-boy-green">手動更新：</strong>
              點擊「重新隨機選擇」可以立即選擇新的卡背。
            </p>
            <p>
              <strong className="text-pip-boy-green">清除資料：</strong>
              點擊「清除並重設」會刪除 localStorage 中的記錄並重新選擇。
            </p>
          </div>
        </PipBoyCard>
      </div>
    </div>
  )
}

/**
 * 測試頁面（包含 Provider）
 */
export default function TestDailyCardBackPage() {
  return (
    <DailyCardBackProvider>
      <TestPageContent />
    </DailyCardBackProvider>
  )
}
