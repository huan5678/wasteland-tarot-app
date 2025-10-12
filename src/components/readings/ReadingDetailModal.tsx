'use client'
import React from 'react'
import { PixelIcon } from '@/components/ui/icons'
import { ReadingMetaEditor } from './ReadingMetaEditor'
import { CategoryManager } from './CategoryManager'
import { TagsManager } from './TagsManager'
import { ReadingNotesSystem } from './ReadingNotesSystem'
import { ExportShareTools } from './ExportShareTools'
import { useState } from 'react'
import { useReadingsStore } from '@/lib/readingsStore'
import { CardDetailModal, DetailedTarotCard } from '@/components/tarot/CardDetailModal'
import { enhanceCardWithWastelandData } from '@/data/enhancedCards'

interface Props {
  id: string | null
  onClose: () => void
}

export function ReadingDetailModal({ id, onClose }: Props) {
  const { byId, toggleFavorite, toggleArchived, categories } = useReadingsStore()
  const reading = id ? byId[id] : null
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'category' | 'tags' | 'export'>('overview')
  const [editing, setEditing] = useState(false)
  const [selectedCard, setSelectedCard] = useState<DetailedTarotCard | null>(null)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)

  // Get category info
  const category = reading?.category_id ? categories.find(c => c.id === reading.category_id) : null

  const handleCardClick = (card: any) => {
    const detailedCard = enhanceCardWithWastelandData(card)
    setSelectedCard(detailedCard)
    setIsCardModalOpen(true)
  }

  const handleCloseCardModal = () => {
    setIsCardModalOpen(false)
    setSelectedCard(null)
  }

  if (!id || !reading) return null

  const tabButtons = [
    { id: 'overview', label: '總覽', icon: Spade },
    { id: 'notes', label: '筆記', icon: FileText, badge: reading.detailed_notes?.length },
    { id: 'category', label: '類別', icon: Hash },
    { id: 'tags', label: '標籤', icon: Tag, badge: reading.tags?.length },
    { id: 'export', label: '分享', icon: Share2 },
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
              <button
                onClick={() => setEditing(!editing)}
                className="px-3 py-1 border border-pip-boy-green/50 text-pip-boy-green text-xs hover:bg-pip-boy-green/10"
              >
                {editing ? '完成' : '編輯'}
              </button>
              <button onClick={onClose} className="text-pip-boy-green hover:text-pip-boy-green/80 text-2xl font-bold">×</button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1">
            {tabButtons.map(tab => {
              const Icon = tab.icon
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
                  <Icon className="w-4 h-4" />
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
                {editing && <ReadingMetaEditor readingId={reading.id} onClose={() => setEditing(false)} />}

                {/* Reading Header */}
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-pip-boy-green">
                        {reading.spread_type === 'single' ? '單張卡牌' : '三張卡牌'} 占卜
                      </h3>
                      {category && (
                        <div className="flex items-center gap-1 px-2 py-1 border border-pip-boy-green/30 bg-pip-boy-green/5">
                          <span style={{ color: category.color }}>{category.icon}</span>
                          <span className="text-pip-boy-green/70 text-xs">{category.name}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-pip-boy-green/70 text-sm">
                      {new Date(reading.created_at || reading.date).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-pip-boy-green/80 text-sm italic mb-4">
                    問題："{reading.question}"
                  </p>

                  {/* Tags */}
                  {reading.tags && reading.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {reading.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-pip-boy-green/20 border border-pip-boy-green/30 text-pip-boy-green text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cards */}
                <div>
                  <h4 className="text-pip-boy-green font-bold mb-3">抽取的卡牌：</h4>
                  <div className="grid gap-3">
                    {(reading.cards_drawn || reading.cards || []).map((card: any, index: number) => (
                      <div
                        key={index}
                        className="border border-pip-boy-green/30 bg-pip-boy-green/5 p-3 cursor-pointer hover:bg-pip-boy-green/10 hover:border-pip-boy-green/50 transition-colors"
                        onClick={() => handleCardClick(card)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-18 bg-pip-boy-green/20 border border-pip-boy-green/50 rounded flex items-center justify-center">
                            < PixelIcon name="spade" className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-pip-boy-green text-sm font-bold">{card.name || '未知卡牌'}</p>
                            <p className="text-pip-boy-green/70 text-xs">{card.suit || 'Suit'}</p>
                            {reading.spread_type === 'three_card' && (
                              <p className="text-pip-boy-green/60 text-xs">
                                {index === 0 ? '過去' : index === 1 ? '現在' : '未來'}
                              </p>
                            )}
                          </div>
                          <div className="text-pip-boy-green/40 text-xs">點擊查看詳情</div>
                        </div>
                      </div>
                    ))}
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

            {/* Category Tab */}
            {activeTab === 'category' && (
              <CategoryManager
                selectedReadingId={reading.id}
                onCategoryAssigned={() => {
                  // Category was assigned, could refresh data or show success message
                }}
              />
            )}

            {/* Tags Tab */}
            {activeTab === 'tags' && (
              <TagsManager
                selectedTags={reading.tags || []}
                onTagsChange={async (tags) => {
                  // Update reading with new tags
                  const { updateReading } = useReadingsStore.getState()
                  await updateReading(reading.id, { tags })
                }}
                mode="select"
              />
            )}

            {/* Export Tab */}
            {activeTab === 'export' && (
              <ExportShareTools selectedReadingIds={[reading.id]} />
            )}
          </div>
        </div>
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        isOpen={isCardModalOpen}
        onClose={handleCloseCardModal}
      />
    </div>
  )
}
