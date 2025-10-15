'use client'
import React from 'react'
import { PixelIcon } from '@/components/ui/icons'
import { ReadingNotesSystem } from './ReadingNotesSystem'
import { ExportShareTools } from './ExportShareTools'
import { useState, useEffect } from 'react'
import { useReadingsStore } from '@/lib/readingsStore'
import { CardDetailModal, DetailedTarotCard } from '@/components/tarot/CardDetailModal'
import { enhanceCardWithWastelandData } from '@/data/enhancedCards'
import { useSpreadTemplatesStore } from '@/lib/spreadTemplatesStore'

interface Props {
  id: string | null
  onClose: () => void
}

export function ReadingDetailModal({ id, onClose }: Props) {
  const { byId, toggleFavorite, toggleArchived } = useReadingsStore()
  const reading = id ? byId[id] : null
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'export'>('overview')
  const { templates, fetchTemplates } = useSpreadTemplatesStore()
  const [spreadTemplate, setSpreadTemplate] = useState<any>(null)

  // Fetch spread template
  useEffect(() => {
    if (reading?.spread_template_id) {
      fetchTemplates()
    }
  }, [reading?.spread_template_id, fetchTemplates])

  // Find matching template
  useEffect(() => {
    if (reading?.spread_template_id && templates.length > 0) {
      const template = templates.find(t => t.id === reading.spread_template_id)
      setSpreadTemplate(template)
    }
  }, [reading?.spread_template_id, templates])

  if (!id || !reading) return null

  const tabButtons = [
    { id: 'overview', label: '總覽', icon: 'spade' },
    { id: 'notes', label: '筆記', icon: 'note', badge: reading.detailed_notes?.length },
    { id: 'export', label: '分享', icon: 'share' },
  ] as const

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-wasteland-dark border-2 border-pip-boy-green max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-pip-boy-green/30 p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-pip-boy-green">占卜詳細資訊</h2>
              {reading.is_favorite && < PixelIcon name="star" className="w-5 h-5 text-yellow-400" />}
              {reading.archived && < PixelIcon name="archive" className="w-5 h-5 text-pip-boy-green/60" />}
              {reading._offline && <div className="px-2 py-1 bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs">離線</div>}
            </div>
            <div className="flex items-center gap-2">
              {/* Quick Actions */}
              <button
                onClick={() => toggleFavorite(reading.id)}
                className={`p-2 border border-pip-boy-green/30 hover:border-pip-boy-green/60 ${reading.is_favorite ? 'text-yellow-400' : 'text-pip-boy-green/70'}`}
                title={reading.is_favorite ? '移除最愛' : '加入最愛'}
              >
                < PixelIcon name="star" className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleArchived(reading.id)}
                className={`p-2 border border-pip-boy-green/30 hover:border-pip-boy-green/60 ${reading.archived ? 'text-pip-boy-green' : 'text-pip-boy-green/70'}`}
                title={reading.archived ? '取消封存' : '封存'}
              >
                < PixelIcon name="archive" className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="text-pip-boy-green hover:text-pip-boy-green/80 text-2xl font-bold">×</button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1">
            {tabButtons.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm border transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green'
                      : 'border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60'
                  }`}
                >
                  <PixelIcon name={tab.icon} className="w-4 h-4" />
                  {tab.label}
                  {tab.badge && tab.badge > 0 && (
                    <span className="px-1.5 py-0.5 bg-pip-boy-green text-wasteland-dark text-xs rounded">
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Reading Header */}
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-pip-boy-green">
                      {reading.spread_type === 'single' ? '單張卡牌' : '三張卡牌'} 占卜
                    </h3>
                    <span className="text-pip-boy-green/70 text-sm">
                      {new Date(reading.created_at || reading.date).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-pip-boy-green/80 text-sm italic mb-4">
                    問題："{reading.question}"
                  </p>
                </div>

                {/* Cards */}
                <div>
                  <h4 className="text-pip-boy-green font-bold mb-3">抽取的卡牌：</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {(reading.cards_drawn || reading.cards || []).map((card: any, index: number) => {
                      // Get position label from spread template positions
                      const positionLabel = spreadTemplate?.positions?.[index]?.chinese_name
                        || spreadTemplate?.positions?.[index]?.name
                        || `位置 ${index + 1}`

                      // Get card image URL - need to convert to TarotCard format
                      const cardImagePath = card.slug
                        ? `/images/cards/${card.slug}.jpg`
                        : '/images/cards/back.jpg'

                      return (
                        <div key={index} className="flex flex-col items-center space-y-2">
                          {/* Card Image */}
                          <div className="relative w-full aspect-[2/3] border-2 border-pip-boy-green/50 bg-pip-boy-green/5 overflow-hidden">
                            <img
                              src={cardImagePath}
                              alt={card.name || '未知卡牌'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/images/cards/back.jpg'
                              }}
                            />
                          </div>

                          {/* Position Label */}
                          <div className="w-full px-2 py-1.5 border border-pip-boy-green/30 bg-pip-boy-green/10 text-center">
                            <p className="text-pip-boy-green text-xs font-bold">
                              {positionLabel}
                            </p>
                          </div>

                          {/* Card Info */}
                          <div className="w-full text-center space-y-0.5">
                            <p className="text-pip-boy-green text-sm font-bold">
                              {card.name || '未知卡牌'}
                            </p>
                            <p className="text-pip-boy-green/70 text-xs">
                              {card.suit || 'Unknown Suit'}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Interpretation */}
                <div>
                  <h4 className="text-pip-boy-green font-bold mb-3">解讀：</h4>
                  <div className="border border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
                    <p className="text-pip-boy-green/80 text-sm leading-relaxed whitespace-pre-line">
                      {reading.interpretation}
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                {(reading.character_voice || reading.karma_context || reading.faction_influence) && (
                  <div className="space-y-3">
                    {reading.character_voice && (
                      <div>
                        <h5 className="text-pip-boy-green font-bold text-sm mb-2">角色觀點：</h5>
                        <div className="border border-pip-boy-green/30 bg-pip-boy-green/5 p-3">
                          <p className="text-pip-boy-green/70 text-sm">{reading.character_voice}</p>
                        </div>
                      </div>
                    )}

                    {reading.karma_context && (
                      <div>
                        <h5 className="text-pip-boy-green font-bold text-sm mb-2">業力脈絡：</h5>
                        <div className="border border-pip-boy-green/30 bg-pip-boy-green/5 p-3">
                          <p className="text-pip-boy-green/70 text-sm">{reading.karma_context}</p>
                        </div>
                      </div>
                    )}

                    {reading.faction_influence && (
                      <div>
                        <h5 className="text-pip-boy-green font-bold text-sm mb-2">派系影響：</h5>
                        <div className="border border-pip-boy-green/30 bg-pip-boy-green/5 p-3">
                          <p className="text-pip-boy-green/70 text-sm">{reading.faction_influence}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <ReadingNotesSystem readingId={reading.id} />
            )}

            {/* Export Tab */}
            {activeTab === 'export' && (
              <ExportShareTools selectedReadingIds={[reading.id]} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
