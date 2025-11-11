'use client';

import React, { useState } from 'react';
import { PixelIcon } from '@/components/ui/icons';

interface CardWithPosition {
  id: string;
  name: string;
  suit: 'major_arcana' | 'nuka_cola' | 'combat_weapons' | 'bottle_caps' | 'radiation_rods';
  upright_meaning: string;
  reversed_meaning: string;
  image_url: string;
  keywords: string[];
  position: 'upright' | 'reversed';
  positionIndex: number;
  positionLabel?: string;
}

interface SpreadTemplateBasic {
  id: string;
  name: string;
  display_name: string;
  card_count: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
}

interface CategoryBasic {
  id: string;
  name: string;
  color: string;
}

interface Reading {
  id: string;
  question: string;
  spread_type: string;
  spread_template: SpreadTemplateBasic;
  cards_drawn: CardWithPosition[];
  interpretation?: string;
  created_at: string;
  is_favorite: boolean;
  tags: string[];
  category: CategoryBasic | null;
  character_voice?: string;
  karma_alignment?: string;
  faction_alignment?: string;
}

interface ReadingDetailViewProps {
  reading: Reading;
  onFavoriteToggle?: (readingId: string, newState: boolean) => void;
  onTagsChange?: (readingId: string, tags: string[]) => void;
  onCategoryChange?: (readingId: string, categoryId: string | null) => void;
}

const ReadingDetailView: React.FC<ReadingDetailViewProps> = ({
  reading,
  onFavoriteToggle,
  onTagsChange,
  onCategoryChange
}) => {
  const [isFavorite, setIsFavorite] = useState(reading.is_favorite);

  const handleFavoriteToggle = () => {
    const newState = !isFavorite;
    setIsFavorite(newState);
    onFavoriteToggle?.(reading.id, newState);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="reading-detail-view p-6 bg-pip-boy-bg text-pip-boy-green font-cubic">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl mb-2">{reading.question || '未命名解讀'}</h2>
          <p className="text-sm opacity-70">{formatDate(reading.created_at)}</p>
        </div>
        <button
          onClick={handleFavoriteToggle}
          className="flex items-center gap-2 px-4 py-2 border border-pip-boy-green hover:bg-pip-boy-green hover:text-black transition-colors"
          aria-label={isFavorite ? '取消收藏' : '收藏'}
        >
          <PixelIcon name={isFavorite ? 'star-fill' : 'star-line'} sizePreset="sm" />
          {isFavorite ? '★ 已收藏' : '收藏'}
        </button>
      </div>

      {/* Spread Info */}
      <div className="mb-6 pb-4 border-b border-pip-boy-green">
        <p className="text-sm">
          <span className="opacity-70">牌陣類型：</span>
          {reading.spread_template.display_name}
        </p>
      </div>

      {/* Cards Drawn */}
      <div className="mb-6">
        <h3 className="text-lg mb-4">抽取的卡片</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reading.cards_drawn.map((card) => (
            <div
              key={`${card.id}-${card.positionIndex}`}
              className="border border-pip-boy-green p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm opacity-70">{card.positionLabel}</span>
              </div>
              <p className="font-bold mb-2">{card.name}</p>
              <p className="text-sm opacity-70 mb-1">
                {card.position === 'upright' ? '正位' : '逆位'}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {card.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="text-xs px-2 py-1 border border-pip-boy-green opacity-60"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interpretation */}
      {reading.interpretation && (
        <div className="mb-6">
          <h3 className="text-lg mb-4">解讀內容</h3>
          <div className="p-4 border border-pip-boy-green bg-black/30 whitespace-pre-wrap">
            {reading.interpretation}
          </div>
        </div>
      )}

      {/* Context Information */}
      <div className="mb-6 pb-4 border-b border-pip-boy-green">
        <h3 className="text-lg mb-4">解讀情境</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {reading.character_voice && (
            <div>
              <span className="opacity-70">角色聲音：</span>
              <span className="ml-2">{reading.character_voice}</span>
            </div>
          )}
          {reading.karma_alignment && (
            <div>
              <span className="opacity-70">Karma：</span>
              <span className="ml-2">{reading.karma_alignment}</span>
            </div>
          )}
          {reading.faction_alignment && (
            <div>
              <span className="opacity-70">派系：</span>
              <span className="ml-2">{reading.faction_alignment}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-6">
        <h3 className="text-lg mb-4">標籤</h3>
        {reading.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {reading.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 border border-pip-boy-green text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm opacity-70">尚未新增標籤</p>
        )}
      </div>

      {/* Category */}
      {reading.category && (
        <div className="mb-6">
          <h3 className="text-lg mb-4">分類</h3>
          <span
            className="px-3 py-1 text-sm text-black font-bold"
            style={{ backgroundColor: reading.category.color }}
          >
            {reading.category.name}
          </span>
        </div>
      )}
    </div>
  );
};

export default ReadingDetailView;
