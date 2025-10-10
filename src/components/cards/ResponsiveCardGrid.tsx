'use client';

import React from 'react';
import Image from 'next/image';
import type { WastelandCard } from '@/types/database';
import { useTouchInteraction } from '@/hooks/useTouchInteraction';

interface ResponsiveCardGridProps {
  cards: WastelandCard[];
  onCardClick?: (card: WastelandCard) => void;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  compactMobile?: boolean;
  loading?: boolean;
  aspectRatio?: 'portrait' | 'square' | 'landscape';
}

export function ResponsiveCardGrid({
  cards,
  onCardClick,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  compactMobile = false,
  loading = false,
  aspectRatio = 'portrait',
}: ResponsiveCardGridProps) {
  if (loading) {
    return (
      <div data-testid="card-grid" className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            data-testid={`skeleton-${i}`}
            className="animate-pulse bg-green-900/20 rounded-lg"
            style={{ aspectRatio: aspectRatio === 'portrait' ? '2/3' : '1/1' }}
          />
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-400 text-center">
          No cards available
        </p>
      </div>
    );
  }

  const gridCols = {
    mobile: `grid-cols-${columns.mobile || 1}`,
    tablet: `md:grid-cols-${columns.tablet || 2}`,
    desktop: `lg:grid-cols-${columns.desktop || 3}`,
  };

  const aspectRatioClass = {
    portrait: 'aspect-[2/3]',
    square: 'aspect-square',
    landscape: 'aspect-[3/2]',
  }[aspectRatio];

  return (
    <div
      data-testid="card-grid"
      className={`grid gap-4 ${gridCols.mobile} ${gridCols.tablet} ${gridCols.desktop}`}
    >
      {cards.map((card) => (
        <CardGridItem
          key={card.id}
          card={card}
          onClick={onCardClick}
          compact={compactMobile}
          aspectRatio={aspectRatioClass}
        />
      ))}
    </div>
  );
}

interface CardGridItemProps {
  card: WastelandCard;
  onClick?: (card: WastelandCard) => void;
  compact: boolean;
  aspectRatio: string;
}

function CardGridItem({ card, onClick, compact, aspectRatio }: CardGridItemProps) {
  const touchHandler = useTouchInteraction({
    onTap: () => onClick?.(card),
  });

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'legendary':
        return 'border-amber-400 shadow-amber-400/50';
      case 'rare':
        return 'border-purple-400 shadow-purple-400/50';
      case 'uncommon':
        return 'border-blue-400 shadow-blue-400/50';
      case 'common':
        return 'border-gray-400 shadow-gray-400/50';
      default:
        return 'border-green-400 shadow-green-400/50';
    }
  };

  const compactClass = compact ? 'compact' : '';

  return (
    <div
      ref={touchHandler.ref}
      data-testid={`card-${card.id}`}
      className={`
        ${compactClass}
        group relative overflow-hidden rounded-lg
        border-2 ${getRarityColor(card.rarity_level)}
        bg-black/60 backdrop-blur-sm
        transition-all duration-300 ease-out
        hover:scale-105 hover:shadow-lg
        active:scale-95
        cursor-pointer
        ${touchHandler.isTouching ? 'scale-95' : ''}
      `}
      onClick={() => onClick?.(card)}
    >
      {/* Card image */}
      <div className={`relative w-full ${aspectRatio} overflow-hidden`}>
        <Image
          src={card.image_url}
          alt={`${card.name} card`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
          quality={75}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Rarity badge */}
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-xs font-bold uppercase">
            {card.rarity_level}
          </span>
        </div>
      </div>

      {/* Card info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
        <h3 className="text-green-400 font-bold text-sm sm:text-base mb-1 truncate">
          {card.name}
        </h3>

        {!compact && (
          <>
            <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 mb-2">
              {card.upright_meaning}
            </p>

            {/* Card metadata */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="px-2 py-0.5 bg-black/60 rounded">
                {card.suit.replace(/_/g, ' ').toLowerCase()}
              </span>
              <span className="px-2 py-0.5 bg-black/60 rounded">
                {(card.radiation_factor * 100).toFixed(0)}% RAD
              </span>
            </div>
          </>
        )}
      </div>

      {/* Touch feedback indicator */}
      {touchHandler.isTouching && (
        <div className="absolute inset-0 bg-green-400/10 pointer-events-none" />
      )}
    </div>
  );
}
