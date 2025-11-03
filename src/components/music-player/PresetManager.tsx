'use client';

/**
 * PresetManager - Preset 管理區塊
 * Task 6.5: 實作 PresetManager Preset 管理區塊
 * Feature: playlist-music-player
 * Requirements: 需求 24.1-24.11
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PixelIcon } from '@/components/ui/icons';
import { useRhythmEditorStore } from '@/lib/stores/rhythmEditorStore';
import type { UserRhythmPreset } from '@/lib/stores/rhythmPlaylistStore';

/**
 * PresetButton 組件 - 單個 Preset 按鈕
 */import { Button } from "@/components/ui/button";
interface PresetButtonProps {
  preset: UserRhythmPreset;
  isActive: boolean;
  isSystemPreset?: boolean;
  onLoad: (preset: UserRhythmPreset) => void;
  onDelete?: (presetId: string) => void;
}

const PresetButton: React.FC<PresetButtonProps> = ({
  preset,
  isActive,
  isSystemPreset = false,
  onLoad,
  onDelete
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete?.(preset.id);
    setShowDeleteDialog(false);
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Button size="icon" variant="default"
      type="button"
      onClick={() => onLoad(preset)}
      className="{expression}">










        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{preset.name}</div>
            {preset.description &&
            <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                {preset.description}
              </div>
            }
          </div>

          {/* 刪除按鈕（僅使用者 Preset） */}
          {!isSystemPreset && onDelete &&
          <Button size="icon" variant="destructive"
          type="button"
          onClick={handleDelete}
          className="{expression}"




          aria-label="刪除">

              <PixelIcon name="delete-bin" sizePreset="xs" variant="error" aria-label="刪除" />
            </Button>
          }
        </div>
      </Button>

      {/* 刪除確認對話框 */}
      {showDeleteDialog &&
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        role="dialog"
        aria-labelledby="delete-preset-dialog-title"
        aria-modal="true"
        onClick={cancelDelete}>

          <div
          className="bg-gray-900 border-2 border-pip-boy-green rounded-lg p-6 max-w-sm shadow-2xl"
          onClick={(e) => e.stopPropagation()}>

            <h3
            id="delete-preset-dialog-title"
            className="text-lg text-pip-boy-green font-bold mb-4">

              確認刪除
            </h3>
            <p className="text-sm text-gray-300 mb-6">
              確定要刪除「{preset.name}」嗎？此操作無法復原。
            </p>
            <div className="flex gap-3 justify-end">
              <Button size="default" variant="destructive"
            type="button"
            onClick={cancelDelete}
            className="{expression}">






                取消
              </Button>
              <Button size="default" variant="destructive"
            type="button"
            onClick={confirmDelete}
            className="{expression}">






                確認刪除
              </Button>
            </div>
          </div>
        </div>
      }
    </>);

};

/**
 * PresetManager 組件
 *
 * 功能：
 * - 顯示 5 個系統預設按鈕（Techno, House, Trap, Breakbeat, Minimal）
 * - 顯示使用者自訂 Preset 列表（捲動）
 * - 實作點擊載入 Preset
 * - 實作刪除按鈕（顯示確認對話框）
 * - 限制數量：最多 10 個使用者 Preset
 * - 啟用狀態：綠色背景填滿
 *
 * @example
 * ```tsx
 * <PresetManager />
 * ```
 */
export const PresetManager: React.FC = () => {
  const {
    pattern,
    systemPresets,
    userPresets,
    loadPreset,
    deletePreset,
    fetchSystemPresets,
    fetchUserPresets,
    isLoading,
    error
  } = useRhythmEditorStore((state) => ({
    pattern: state.pattern,
    systemPresets: state.systemPresets,
    userPresets: state.userPresets,
    loadPreset: state.loadPreset,
    deletePreset: state.deletePreset,
    fetchSystemPresets: state.fetchSystemPresets,
    fetchUserPresets: state.fetchUserPresets,
    isLoading: state.isLoading,
    error: state.error
  }));

  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // 載入 Presets
  useEffect(() => {
    fetchSystemPresets();
    fetchUserPresets();
  }, [fetchSystemPresets, fetchUserPresets]);

  // 載入 Preset
  const handleLoadPreset = (preset: UserRhythmPreset) => {
    loadPreset(preset);
    setActivePresetId(preset.id);
  };

  // 刪除 Preset
  const handleDeletePreset = async (presetId: string) => {
    try {
      await deletePreset(presetId);
      if (activePresetId === presetId) {
        setActivePresetId(null);
      }
    } catch (err) {
      console.error('Delete preset failed:', err);
    }
  };

  // 檢查是否達到上限
  const isAtLimit = userPresets.length >= 10;

  return (
    <div className="space-y-6">
      {/* 系統預設 Presets */}
      <div>
        <h3 className="text-lg text-pip-boy-green font-bold mb-3 flex items-center gap-2">
          <PixelIcon name="music" sizePreset="sm" decorative />
          系統預設
        </h3>

        {isLoading && systemPresets.length === 0 ?
        <div className="flex items-center justify-center py-8">
            <PixelIcon name="loader-4" animation="spin" sizePreset="md" decorative />
            <span className="ml-2 text-sm text-pip-boy-green">載入中...</span>
          </div> :

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {systemPresets.map((preset) =>
          <PresetButton
            key={preset.id}
            preset={preset}
            isActive={activePresetId === preset.id}
            isSystemPreset
            onLoad={handleLoadPreset} />

          )}
          </div>
        }
      </div>

      {/* 使用者自訂 Presets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg text-pip-boy-green font-bold flex items-center gap-2">
            <PixelIcon name="user" sizePreset="sm" decorative />
            我的創作
          </h3>
          <span className="text-xs text-pip-boy-green/60">
            {userPresets.length} / 10
          </span>
        </div>

        {/* 限制警告 */}
        {isAtLimit &&
        <div className="mb-3 p-3 bg-yellow-900/20 border border-yellow-500 rounded-lg flex items-center gap-2">
            <PixelIcon name="alert" variant="warning" sizePreset="sm" decorative />
            <span className="text-xs text-yellow-400">
              已達到上限（10 個），請刪除舊的 Preset 後再儲存新的
            </span>
          </div>
        }

        {/* 錯誤訊息 */}
        {error &&
        <div className="mb-3 p-3 bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-2">
            <PixelIcon name="error-warning" variant="error" sizePreset="sm" decorative />
            <span className="text-xs text-red-400">{error}</span>
          </div>
        }

        {isLoading && userPresets.length === 0 ?
        <div className="flex items-center justify-center py-8">
            <PixelIcon name="loader-4" animation="spin" sizePreset="md" decorative />
            <span className="ml-2 text-sm text-pip-boy-green">載入中...</span>
          </div> :
        userPresets.length === 0 ?
        <div className="text-center py-8 text-sm text-gray-400">
            還沒有自訂的 Preset，開始創作你的節奏吧！
          </div> :

        <div className="max-h-80 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {userPresets.map((preset) =>
          <PresetButton
            key={preset.id}
            preset={preset}
            isActive={activePresetId === preset.id}
            onLoad={handleLoadPreset}
            onDelete={handleDeletePreset} />

          )}
          </div>
        }
      </div>

      {/* 自訂捲軸樣式 */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #00ff88;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #00dd77;
        }
      `}</style>
    </div>);

};

PresetManager.displayName = 'PresetManager';