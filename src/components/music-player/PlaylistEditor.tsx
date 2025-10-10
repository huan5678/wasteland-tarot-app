/**
 * PlaylistEditor - Playlist Editor Component
 * 播放清單編輯器元件
 *
 * Task 19: 實作 PlaylistEditor 播放清單編輯器
 * Requirements 3.1, 3.2, 3.4, 6.3
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, X } from 'lucide-react';
import { usePlaylistStore } from '@/stores/playlistStore';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { MusicMode, Playlist } from '@/lib/audio/playlistTypes';
import { MUSIC_MODES } from '@/lib/audio/playlistTypes';
import { ModeReorderList } from './ModeReorderList';

// ============================================================================
// Types
// ============================================================================

/**
 * 表單資料型別
 */
export interface PlaylistFormData {
  name: string;
  modes: MusicMode[];
}

export interface PlaylistEditorProps {
  /** 編輯模式：'create' 或 'edit' */
  mode: 'create' | 'edit';
  /** 當 mode='edit' 時，要編輯的播放清單 ID */
  playlistId?: string;
  /** 儲存成功回調 */
  onSave?: (playlist: Playlist) => void;
  /** 取消編輯回調 */
  onCancel?: () => void;
  /** 自訂樣式類別 */
  className?: string;
}

// ============================================================================
// Music Mode Metadata
// ============================================================================

const MUSIC_MODE_METADATA: Record<MusicMode, { label: string; icon: string; description: string }> = {
  synthwave: { label: 'Synthwave', icon: '🎹', description: '80 年代電子合成器風格' },
  divination: { label: '占卜', icon: '🔮', description: '神秘氛圍音樂' },
  lofi: { label: 'Lo-fi', icon: '🎧', description: 'Lo-fi 節奏音樂' },
  ambient: { label: 'Ambient', icon: '🌊', description: '環境氛圍音樂' },
};

// ============================================================================
// Component
// ============================================================================

/**
 * PlaylistEditor - 播放清單編輯器元件
 *
 * Features:
 * - 使用 react-hook-form 處理表單驗證
 * - 播放清單名稱：1-50 字元
 * - 音樂模式：至少 1 個，最多 20 個
 * - 支援拖曳排序（透過 ModeReorderList）
 * - 錯誤提示 UI
 *
 * @example
 * ```tsx
 * <PlaylistEditor
 *   mode="create"
 *   onSave={(playlist) => console.log('Saved:', playlist)}
 *   onCancel={() => console.log('Cancelled')}
 * />
 * ```
 */
export function PlaylistEditor({
  mode,
  playlistId,
  onSave,
  onCancel,
  className,
}: PlaylistEditorProps) {
  // ========== Hooks ==========
  const createPlaylist = usePlaylistStore((state) => state.createPlaylist);
  const updatePlaylist = usePlaylistStore((state) => state.updatePlaylist);
  const getPlaylistById = usePlaylistStore((state) => state.getPlaylistById);

  // ========== State ==========
  const [selectedModes, setSelectedModes] = useState<MusicMode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ========== Form ==========
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<PlaylistFormData>({
    defaultValues: {
      name: '',
      modes: [],
    },
  });

  // ========== Effects ==========

  /**
   * 載入編輯模式的播放清單資料
   */
  useEffect(() => {
    if (mode === 'edit' && playlistId) {
      const playlist = getPlaylistById(playlistId);
      if (playlist) {
        setValue('name', playlist.name);
        setSelectedModes(playlist.modes);
        setValue('modes', playlist.modes);
      } else {
        logger.error('[PlaylistEditor] Playlist not found for edit', { playlistId });
        setError('找不到指定的播放清單');
      }
    }
  }, [mode, playlistId, getPlaylistById, setValue]);

  // ========== Handlers ==========

  /**
   * 處理音樂模式選擇/取消選擇
   */
  const handleToggleMode = (modeToToggle: MusicMode) => {
    setSelectedModes((prev) => {
      const isSelected = prev.includes(modeToToggle);
      let newModes: MusicMode[];

      if (isSelected) {
        // 取消選擇
        newModes = prev.filter((m) => m !== modeToToggle);
      } else {
        // 選擇
        if (prev.length >= 20) {
          setError('最多只能選擇 20 個音樂模式');
          return prev;
        }
        newModes = [...prev, modeToToggle];
      }

      setValue('modes', newModes);
      setError(null);
      return newModes;
    });
  };

  /**
   * 處理模式重新排序
   */
  const handleReorderModes = (newModes: MusicMode[]) => {
    setSelectedModes(newModes);
    setValue('modes', newModes);
  };

  /**
   * 處理表單提交
   */
  const onSubmit = async (data: PlaylistFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // 驗證名稱
      if (!data.name || data.name.trim().length === 0) {
        setError('播放清單名稱不可為空');
        return;
      }

      if (data.name.trim().length > 50) {
        setError('播放清單名稱最多 50 個字元');
        return;
      }

      // 驗證音樂模式
      if (selectedModes.length === 0) {
        setError('至少選擇 1 個音樂模式');
        return;
      }

      if (selectedModes.length > 20) {
        setError('最多選擇 20 個音樂模式');
        return;
      }

      logger.info('[PlaylistEditor] Submitting form', {
        mode,
        name: data.name,
        modesCount: selectedModes.length,
      });

      // 建立或更新播放清單
      if (mode === 'create') {
        const newId = createPlaylist(data.name.trim(), selectedModes);
        const newPlaylist = getPlaylistById(newId);
        if (newPlaylist) {
          onSave?.(newPlaylist);
        }
      } else if (mode === 'edit' && playlistId) {
        updatePlaylist(playlistId, {
          name: data.name.trim(),
          modes: selectedModes,
        });
        const updatedPlaylist = getPlaylistById(playlistId);
        if (updatedPlaylist) {
          onSave?.(updatedPlaylist);
        }
      }

      // 重置表單
      reset();
      setSelectedModes([]);
    } catch (err) {
      logger.error('[PlaylistEditor] Failed to save playlist', { error: err });
      setError((err as Error).message || '儲存失敗，請重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 處理取消
   */
  const handleCancel = () => {
    reset();
    setSelectedModes([]);
    setError(null);
    onCancel?.();
  };

  // ========== Render ==========
  return (
    <div className={cn('space-y-6', className)} data-testid="playlist-editor">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert className="border-red-500 bg-red-500/10">
            <AlertDescription className="text-red-500 text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Playlist Name Input */}
        <div className="space-y-2">
          <label htmlFor="playlist-name" className="block text-sm font-medium text-pip-boy-green">
            播放清單名稱
          </label>
          <input
            id="playlist-name"
            type="text"
            {...register('name', {
              required: '請輸入播放清單名稱',
              minLength: { value: 1, message: '名稱至少 1 個字元' },
              maxLength: { value: 50, message: '名稱最多 50 個字元' },
            })}
            className={cn(
              'w-full px-4 py-2 rounded',
              'bg-black border-2 border-pip-boy-green/30',
              'text-pip-boy-green placeholder:text-pip-boy-green/30',
              'focus:outline-none focus:border-pip-boy-green focus:ring-2 focus:ring-pip-boy-green/30',
              'transition-all duration-200',
              errors.name && 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
            )}
            placeholder="輸入播放清單名稱..."
            disabled={isSubmitting}
            data-testid="playlist-name-input"
          />
          {errors.name && (
            <p className="text-xs text-red-500" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Music Mode Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-pip-boy-green">
              音樂模式選擇
            </label>
            <span className="text-xs text-pip-boy-green/50">
              已選擇 {selectedModes.length} / 20
            </span>
          </div>

          {/* Mode Checkboxes */}
          <div className="grid grid-cols-1 gap-2">
            {MUSIC_MODES.map((mode) => {
              const metadata = MUSIC_MODE_METADATA[mode];
              const isSelected = selectedModes.includes(mode);

              return (
                <label
                  key={mode}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded cursor-pointer',
                    'border-2 transition-all duration-200',
                    isSelected
                      ? 'border-pip-boy-green bg-pip-boy-green/10'
                      : 'border-pip-boy-green/30 hover:border-pip-boy-green/60',
                    isSubmitting && 'opacity-50 cursor-not-allowed'
                  )}
                  data-testid={`mode-checkbox-${mode}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleMode(mode)}
                    disabled={isSubmitting}
                    className="sr-only"
                  />
                  <span className="text-2xl">{metadata.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-pip-boy-green">
                      {metadata.label}
                    </div>
                    <div className="text-xs text-pip-boy-green/50">{metadata.description}</div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full border-2 border-pip-boy-green bg-pip-boy-green/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-pip-boy-green" />
                    </div>
                  )}
                </label>
              );
            })}
          </div>

          {selectedModes.length === 0 && (
            <p className="text-xs text-pip-boy-green/50">請至少選擇 1 個音樂模式</p>
          )}
        </div>

        {/* Mode Reorder List */}
        {selectedModes.length > 1 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-pip-boy-green">
              拖曳調整播放順序
            </label>
            <ModeReorderList
              modes={selectedModes}
              onChange={handleReorderModes}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t-2 border-pip-boy-green/30">
          <button
            type="submit"
            disabled={isSubmitting || selectedModes.length === 0}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded',
              'bg-pip-boy-green text-black font-semibold',
              'hover:bg-pip-boy-green/80 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-pip-boy-green focus:ring-offset-2 focus:ring-offset-black',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            data-testid="save-playlist-button"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? '儲存中...' : mode === 'create' ? '建立' : '儲存'}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2 rounded',
              'border-2 border-pip-boy-green/30 text-pip-boy-green',
              'hover:border-pip-boy-green hover:bg-pip-boy-green/10',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-pip-boy-green focus:ring-offset-2 focus:ring-offset-black',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            data-testid="cancel-button"
          >
            <X className="w-4 h-4" />
            取消
          </button>
        </div>
      </form>
    </div>
  );
}

PlaylistEditor.displayName = 'PlaylistEditor';
