'use client';

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Reading } from '@/types/database';

interface VirtualizedReadingListProps {
  readings: Reading[];
  onSelect?: (readingId: string) => void;
  isLoading?: boolean;
  enableVirtualization?: boolean;
  itemHeight?: number;
}

const VIRTUALIZATION_THRESHOLD = 100;
const DEFAULT_ITEM_HEIGHT = 120;

/**
 * VirtualizedReadingList Component
 *
 * Renders a list of reading records with automatic virtualization
 * when the number of records exceeds 100.
 *
 * Features:
 * - Automatic virtualization threshold (100 records)
 * - Variable height estimation based on card count
 * - Skeleton loading state
 * - Empty state handling
 * - Click selection support
 */
export function VirtualizedReadingList({
  readings,
  onSelect,
  isLoading = false,
  enableVirtualization = true,
  itemHeight = DEFAULT_ITEM_HEIGHT,
}: VirtualizedReadingListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Determine if virtualization should be enabled
  const shouldVirtualize =
    enableVirtualization && readings.length >= VIRTUALIZATION_THRESHOLD;

  // Estimate item height based on card count
  const estimateSize = (index: number) => {
    const reading = readings[index];
    if (!reading) return itemHeight;

    const cardCount = reading.cards_drawn?.length || 1;

    // Base height calculation:
    // - Header: 60px (date, spread type, title)
    // - Card thumbnails: cardCount × 40px (each card thumbnail)
    // - Footer: 40px (tags, action buttons)
    // - Padding: 20px
    const estimatedHeight = 60 + cardCount * 40 + 40 + 20;

    return estimatedHeight;
  };

  // Configure virtualizer
  const rowVirtualizer = useVirtualizer({
    count: readings.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5, // Render 5 extra items to reduce white screen
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="skeleton-loader">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="h-32 bg-pip-boy-green/10 animate-pulse rounded-lg border border-pip-boy-green/20"
            />
          ))}
      </div>
    );
  }

  // Empty state
  if (readings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-pip-boy-green/60 text-lg">
          沒有解讀記錄
        </p>
        <p className="text-pip-boy-green/40 text-sm mt-2">
          開始你的第一次塔羅解讀吧！
        </p>
      </div>
    );
  }

  // Virtualized rendering for large lists
  if (shouldVirtualize) {
    return (
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto"
        data-testid="virtual-scroll-container"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const reading = readings[virtualItem.index];
            return (
              <div
                key={reading.id}
                data-index={virtualItem.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <ReadingListItem reading={reading} onSelect={onSelect} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Simple list rendering for small lists
  return (
    <div className="space-y-4" data-testid="simple-list-container">
      {readings.map((reading) => (
        <ReadingListItem
          key={reading.id}
          reading={reading}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

/**
 * ReadingListItem Component
 *
 * Individual reading item with:
 * - Date, spread type, question
 * - Card thumbnails
 * - Tags and category
 * - Click to select
 */
function ReadingListItem({
  reading,
  onSelect,
}: {
  reading: Reading;
  onSelect?: (readingId: string) => void;
}) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(reading.id);
    }
  };

  const createdDate = new Date(reading.created_at).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      onClick={handleClick}
      className="border border-pip-boy-green/30 rounded-lg p-4 hover:bg-pip-boy-green/5 cursor-pointer transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-pip-boy-green/60">{createdDate}</div>
        <div className="text-sm font-mono text-pip-boy-green/80 uppercase">
          {reading.spread_type}
        </div>
      </div>

      {/* Question */}
      <div className="text-lg text-pip-boy-green font-medium mb-3">
        {reading.question || '未命名解讀'}
      </div>

      {/* Card Thumbnails */}
      {reading.cards_drawn && reading.cards_drawn.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {reading.cards_drawn.map((card, index) => (
            <div
              key={`${card.id}-${index}`}
              className="w-10 h-14 bg-pip-boy-green/10 border border-pip-boy-green/30 rounded flex-shrink-0 flex items-center justify-center"
              title={card.name}
            >
              <span className="text-xs text-pip-boy-green/50">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer - Tags and Favorite */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {reading.is_favorite && (
            <span className="text-xs text-radiation-orange">★ 收藏</span>
          )}
        </div>
      </div>
    </div>
  );
}
