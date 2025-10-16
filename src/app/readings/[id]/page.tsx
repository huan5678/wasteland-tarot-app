/**
 * Reading Detail Page - 占卜詳情頁面
 *
 * 顯示單一占卜記錄的完整資訊，包含：
 * - 占卜問題與時間
 * - 所有抽到的卡牌（可點擊查看詳情）
 * - 解讀結果
 * - 其他元資料（角色聲音、業力背景、派系影響）
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { readingsAPI } from '@/lib/api'
import { PixelIcon } from '@/components/ui/icons'
import { ReadingCardDetail } from '@/components/readings/ReadingCardDetail'
import type { Reading } from '@/lib/api'
import type { ReadingCard } from '@/components/readings/ReadingCardDetail'

export default function ReadingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const readingId = params.id as string

  const [reading, setReading] = useState<Reading | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<ReadingCard | null>(null)
  const [isCardDetailOpen, setIsCardDetailOpen] = useState(false)

  useEffect(() => {
    const fetchReading = async () => {
      if (!readingId) return

      setIsLoading(true)
      setError(null)

      try {
        const data = await readingsAPI.getById(readingId)
        setReading(data)
      } catch (err: any) {
        console.error('Failed to fetch reading:', err)
        setError(err.message || '無法載入占卜記錄')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReading()
  }, [readingId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getSpreadTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'single': '單張牌',
      'three_card': '三張牌',
      'celtic_cross': '凱爾特十字',
      'past_present_future': '過去現在未來',
    }
    return typeMap[type] || type
  }

  const handleCardClick = (card: any, index: number) => {
    // 將卡牌資料轉換為 ReadingCard 格式，直接使用後端提供的 position_meaning
    const readingCard: ReadingCard = {
      id: card.card_id || card.id || `card-${index}`,
      name: card.name || card.card_name || '未知卡牌',
      suit: card.suit || 'Unknown',
      image_url: card.image_url || '',
      is_reversed: card.is_reversed || false,
      position: card.position,
      upright_meaning: card.upright_meaning,
      reversed_meaning: card.reversed_meaning,
      meaning_upright: card.meaning_upright,
      meaning_reversed: card.meaning_reversed,
      description: card.description,
      keywords: card.keywords,
      fallout_reference: card.fallout_reference,
      character_voice_interpretations: card.character_voice_interpretations,
      radiation_factor: card.radiation_factor,
      karma_alignment: card.karma_alignment,
      symbolism: card.symbolism,
      element: card.element,
      astrological_association: card.astrological_association,
      card_number: card.card_number || card.number,
      // 占卜情境資訊 - 直接使用後端提供的資料
      position_in_reading: card.position_name || card.position_in_reading || `位置 ${index + 1}`,
      position_meaning: card.position_meaning || '', // 從後端取得，不硬編碼
      card_index: index
    }

    setSelectedCard(readingCard)
    setIsCardDetailOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pip-boy-green">載入占卜記錄...</p>
        </div>
      </div>
    )
  }

  if (error || !reading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="border-2 border-red-500 bg-red-500/10 p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <PixelIcon name="alert-triangle" sizePreset="lg" variant="error" animation="pulse" decorative />
            <h2 className="text-xl font-bold text-red-400 uppercase">錯誤</h2>
          </div>
          <p className="text-red-300 mb-6">{error || '找不到此占卜記錄'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-4 py-3 border-2 border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green hover:bg-pip-boy-green/20 transition-all duration-200 uppercase text-sm font-bold tracking-wider"
          >
            <span className="flex items-center justify-center gap-2">
              <PixelIcon name="arrow-left" sizePreset="xs" variant="default" decorative />
              返回 Dashboard
            </span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-pip-boy-green p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-pip-boy-green hover:text-pip-boy-green/80 transition-colors mb-4"
          >
            <PixelIcon name="arrow-left" sizePreset="xs" variant="default" decorative />
            <span className="text-sm uppercase tracking-wider">返回 Dashboard</span>
          </button>

          <div className="border-2 border-pip-boy-green bg-pip-boy-green/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold uppercase tracking-wider">占卜記錄</h1>
              <span className="text-sm text-pip-boy-green/70">
                {formatDate(reading.created_at)}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-pip-boy-green/20 border border-pip-boy-green/50 text-sm rounded">
                {getSpreadTypeName(reading.spread_type)}
              </span>
              {reading.faction_influence && (
                <span className="px-3 py-1 bg-pip-boy-green/10 border border-pip-boy-green/30 text-sm rounded">
                  派系: {reading.faction_influence}
                </span>
              )}
            </div>

            <div className="border-l-4 border-pip-boy-green/50 pl-4 py-2 bg-pip-boy-green/5">
              <p className="text-pip-boy-green italic text-lg">
                "{reading.question}"
              </p>
            </div>
          </div>
        </div>

        {/* Cards Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <PixelIcon name="spade" sizePreset="sm" variant="primary" decorative />
            抽到的卡牌（點擊查看詳情）
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(reading.cards_drawn || []).map((card: any, index: number) => (
              <button
                key={index}
                onClick={() => handleCardClick(card, index)}
                className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 hover:border-pip-boy-green hover:bg-pip-boy-green/10 hover:scale-105 transition-all duration-200 text-left group cursor-pointer"
              >
                <div className="aspect-[2/3] bg-pip-boy-green/20 border border-pip-boy-green/50 rounded flex flex-col items-center justify-center mb-3 relative overflow-hidden">
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt={card.name || '卡牌'}
                      className={`w-full h-full object-cover ${card.is_reversed ? 'rotate-180' : ''}`}
                    />
                  ) : (
                    <>
                      <PixelIcon name="spade" sizePreset="lg" variant="primary" decorative />
                      <span className="text-xs text-pip-boy-green/70 mt-2">
                        {card.position_name || `位置 ${index + 1}`}
                      </span>
                    </>
                  )}
                  {/* Hover 效果 */}
                  <div className="absolute inset-0 bg-pip-boy-green/0 group-hover:bg-pip-boy-green/20 transition-colors flex items-center justify-center">
                    <PixelIcon
                      name="eye"
                      sizePreset="lg"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-pip-boy-green"
                      decorative
                    />
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm font-bold text-pip-boy-green mb-1">
                    {card.name || card.card_name || '未知卡牌'}
                  </p>
                  {(card.position_name || card.position) && (
                    <p className="text-xs text-pip-boy-green/70">
                      {card.position_name || card.position}
                    </p>
                  )}
                  {card.is_reversed && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-red-500/20 border border-red-500/50 text-red-400 text-xs rounded">
                      逆位
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Interpretation Section */}
        {reading.interpretation && (
          <div className="mb-6">
            <h2 className="text-xl font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <PixelIcon name="book" sizePreset="sm" variant="primary" decorative />
              解讀結果
            </h2>

            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
              <p className="text-pip-boy-green/90 whitespace-pre-wrap leading-relaxed">
                {reading.interpretation}
              </p>
            </div>
          </div>
        )}

        {/* Metadata Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reading.character_voice && (
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <PixelIcon name="user" sizePreset="xs" variant="primary" decorative />
                角色聲音
              </h3>
              <p className="text-pip-boy-green/80 text-sm">{reading.character_voice}</p>
            </div>
          )}

          {reading.karma_context && (
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <PixelIcon name="zap" sizePreset="xs" variant="warning" decorative />
                業力背景
              </h3>
              <p className="text-pip-boy-green/80 text-sm">{reading.karma_context}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 px-4 py-3 border-2 border-pip-boy-green bg-transparent text-pip-boy-green hover:bg-pip-boy-green/10 transition-all duration-200 uppercase text-sm font-bold tracking-wider"
          >
            <span className="flex items-center justify-center gap-2">
              <PixelIcon name="arrow-left" sizePreset="xs" variant="default" decorative />
              返回 Dashboard
            </span>
          </button>

          <button
            onClick={() => router.push('/readings/new')}
            className="flex-1 px-4 py-3 border-2 border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green hover:bg-pip-boy-green/30 transition-all duration-200 uppercase text-sm font-bold tracking-wider"
          >
            <span className="flex items-center justify-center gap-2">
              <PixelIcon name="plus" sizePreset="xs" variant="success" decorative />
              新占卜
            </span>
          </button>
        </div>
      </div>

      {/* Card Detail Modal */}
      <ReadingCardDetail
        card={selectedCard}
        isOpen={isCardDetailOpen}
        onClose={() => setIsCardDetailOpen(false)}
        readingType={reading?.spread_type}
        readingQuestion={reading?.question}
        totalCards={reading?.cards_drawn?.length || 0}
        enableAudio={true}
        showQuickActions={true}
      />
    </div>
  )
}
