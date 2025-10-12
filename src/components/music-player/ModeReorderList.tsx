/**
 * ModeReorderList - Mode Reorder List Component
 * 模式重新排序元件
 *
 * Task 20: 實作 ModeReorderList 模式重新排序元件
 * Requirements 3.4
 */

'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PixelIcon } from '@/components/ui/icons/PixelIcon';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import type { MusicMode } from '@/lib/audio/playlistTypes';

// ============================================================================
// Music Mode Metadata
// ============================================================================

const MUSIC_MODE_METADATA: Record<MusicMode, { label: string; iconName: string }> = {
  synthwave: { label: 'Synthwave', iconName: 'music' },
  divination: { label: '占卜', iconName: 'sparkling-2' },
  lofi: { label: 'Lo-fi', iconName: 'headphone' },
  ambient: { label: 'Ambient', iconName: 'disc' },
};

// ============================================================================
// Types
// ============================================================================

export interface ModeReorderListProps {
  /** 音樂模式陣列 */
  modes: MusicMode[];
  /** 當順序改變時的回調 */
  onChange: (modes: MusicMode[]) => void;
  /** 當刪除模式時的回調 */
  onRemove?: (modeIndex: number) => void;
  /** 自訂樣式類別 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

interface SortableItemProps {
  mode: MusicMode;
  index: number;
  onRemove?: (index: number) => void;
  disabled?: boolean;
  isDragging?: boolean;
}

// ============================================================================
// Sortable Item Component
// ============================================================================

/**
 * SortableItem - 可排序的單個模式項目
 */
function SortableItem({ mode, index, onRemove, disabled, isDragging }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isItemDragging,
  } = useSortable({ id: mode, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const metadata = MUSIC_MODE_METADATA[mode];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 rounded',
        'border-2 border-pip-boy-green/30 bg-black/60',
        'transition-all duration-200',
        isItemDragging && 'opacity-50 scale-95',
        !disabled && 'hover:border-pip-boy-green/60 hover:shadow-[0_0_10px_rgba(0,255,136,0.2)]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      data-testid={`sortable-mode-${mode}`}
    >
      {/* Drag Handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={disabled}
        className={cn(
          'p-1 rounded cursor-grab active:cursor-grabbing',
          'text-pip-boy-green/50 hover:text-pip-boy-green hover:bg-pip-boy-green/10',
          'focus:outline-none focus:ring-2 focus:ring-pip-boy-green',
          'transition-all duration-200',
          disabled && 'cursor-not-allowed opacity-30'
        )}
        aria-label={`拖曳 ${metadata.label}`}
        data-testid={`drag-handle-${mode}`}
      >
        <PixelIcon name="draggable" sizePreset="xs" decorative />
      </button>

      {/* Mode Icon */}
      <PixelIcon name={metadata.iconName} sizePreset="md" variant="primary" decorative />

      {/* Mode Label */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-pip-boy-green">{metadata.label}</div>
        <div className="text-xs text-pip-boy-green/50">位置 {index + 1}</div>
      </div>

      {/* Remove Button */}
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={disabled}
          className={cn(
            'p-1 rounded',
            'text-red-500/50 hover:text-red-500 hover:bg-red-500/10',
            'focus:outline-none focus:ring-2 focus:ring-red-500',
            'transition-all duration-200',
            disabled && 'cursor-not-allowed opacity-30'
          )}
          aria-label={`移除 ${metadata.label}`}
          data-testid={`remove-mode-${mode}`}
        >
          <PixelIcon name="close" sizePreset="xs" variant="error" decorative />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Drag Overlay Item Component
// ============================================================================

/**
 * DragOverlayItem - 拖曳時顯示的覆蓋層項目
 */
function DragOverlayItem({ mode }: { mode: MusicMode }) {
  const metadata = MUSIC_MODE_METADATA[mode];

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded',
        'border-2 border-pip-boy-green bg-black/90',
        'shadow-[0_0_20px_rgba(0,255,136,0.5)]',
        'cursor-grabbing'
      )}
    >
      <PixelIcon name="draggable" sizePreset="xs" variant="primary" decorative />
      <PixelIcon name={metadata.iconName} sizePreset="md" variant="primary" decorative />
      <div className="text-sm font-semibold text-pip-boy-green">{metadata.label}</div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ModeReorderList - 模式重新排序元件
 *
 * Features:
 * - 使用 @dnd-kit 實作拖曳排序
 * - 支援鍵盤導航
 * - 支援觸控裝置
 * - 顯示拖曳手柄和刪除按鈕
 * - 整合 playlistStore 的 reorderPlaylistModes
 *
 * @example
 * ```tsx
 * <ModeReorderList
 *   modes={['synthwave', 'lofi']}
 *   onChange={(newModes) => console.log('New order:', newModes)}
 *   onRemove={(index) => console.log('Remove index:', index)}
 * />
 * ```
 */
export function ModeReorderList({
  modes,
  onChange,
  onRemove,
  className,
  disabled = false,
}: ModeReorderListProps) {
  // ========== State ==========
  const [activeId, setActiveId] = useState<MusicMode | null>(null);

  // ========== Sensors ==========
  // 設定拖曳觸發器（滑鼠和鍵盤）
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 需要移動 8px 才觸發拖曳
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ========== Handlers ==========

  /**
   * 處理拖曳開始
   */
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as MusicMode);
    logger.info('[ModeReorderList] Drag started', { activeId: active.id });
  };

  /**
   * 處理拖曳結束
   * Requirements 3.4: 調整播放清單中的音樂順序
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = modes.indexOf(active.id as MusicMode);
      const newIndex = modes.indexOf(over.id as MusicMode);

      const newModes = arrayMove(modes, oldIndex, newIndex);

      logger.info('[ModeReorderList] Reordered modes', {
        oldIndex,
        newIndex,
        oldOrder: modes,
        newOrder: newModes,
      });

      onChange(newModes);
    }

    setActiveId(null);
  };

  /**
   * 處理刪除模式
   */
  const handleRemove = (index: number) => {
    logger.info('[ModeReorderList] Removing mode', { index, mode: modes[index] });
    onRemove?.(index);
  };

  // ========== Render ==========
  return (
    <div className={cn('space-y-2', className)} data-testid="mode-reorder-list">
      {/* Instructions */}
      {modes.length > 1 && !disabled && (
        <p className="text-xs text-pip-boy-green/50 mb-3">
          拖曳左側手柄圖示以調整播放順序
        </p>
      )}

      {/* DnD Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={modes} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {modes.map((mode, index) => (
              <SortableItem
                key={mode}
                mode={mode}
                index={index}
                onRemove={onRemove ? handleRemove : undefined}
                disabled={disabled}
                isDragging={activeId === mode}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drag Overlay (顯示拖曳中的項目) */}
        <DragOverlay>
          {activeId ? <DragOverlayItem mode={activeId} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {modes.length === 0 && (
        <div className="text-center py-8 text-pip-boy-green/50 text-sm">
          尚未選擇任何音樂模式
        </div>
      )}
    </div>
  );
}

ModeReorderList.displayName = 'ModeReorderList';
