'use client';

/**
 * SavePresetDialog - 儲存 Preset 對話框
 * Task 6.4: 實作 SavePresetDialog 儲存對話框
 * Feature: playlist-music-player
 * Requirements: 需求 32.1-32.8
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { PixelIcon } from '@/components/ui/icons';
import { useRhythmEditorStore } from '@/lib/stores/rhythmEditorStore';

/**
 * SavePresetDialog 組件屬性
 */import { Button } from "@/components/ui/button";
export interface SavePresetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: () => void;
}

/**
 * SavePresetDialog 組件
 *
 * 功能：
 * - 輸入欄位：名稱（最多 50 字元，必填）
 * - 輸入欄位：描述（最多 200 字元，可選）
 * - 勾選框：公開分享（預設未勾選）
 * - 說明文字：「勾選後其他使用者（含訪客）可以查看並使用此節奏」
 * - 驗證輸入
 * - 呼叫 API：POST /api/v1/music/presets
 * - 顯示成功訊息：「已儲存為公開歌曲」或「已儲存為私密歌曲」
 *
 * @example
 * ```tsx
 * <SavePresetDialog
 *   isOpen={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   onSaveSuccess={() => console.log('Saved!')}
 * />
 * ```
 */
export const SavePresetDialog: React.FC<SavePresetDialogProps> = ({
  isOpen,
  onClose,
  onSaveSuccess
}) => {
  // 使用穩定的 selector 避免無限迴圈
  const savePreset = useRhythmEditorStore((state) => state.savePreset);
  const isLoading = useRhythmEditorStore((state) => state.isLoading);
  const error = useRhythmEditorStore((state) => state.error);
  const clearError = useRhythmEditorStore((state) => state.clearError);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 驗證輸入
  const validateInput = (): boolean => {
    if (!name.trim()) {
      setValidationError('請輸入 Preset 名稱');
      return false;
    }

    if (name.length > 50) {
      setValidationError('Preset 名稱不得超過 50 字元');
      return false;
    }

    if (description.length > 200) {
      setValidationError('描述不得超過 200 字元');
      return false;
    }

    setValidationError('');
    return true;
  };

  // 處理儲存
  const handleSave = async () => {
    if (!validateInput()) return;

    try {
      await savePreset(name.trim(), description.trim() || undefined, isPublic);

      // 顯示成功訊息
      const message = isPublic ? '已儲存為公開歌曲' : '已儲存為私密歌曲';
      setSuccessMessage(message);

      // 2 秒後關閉對話框
      setTimeout(() => {
        handleClose();
        onSaveSuccess?.();
      }, 2000);
    } catch (err) {
      // 錯誤由 rhythmEditorStore 處理
      console.error('Save preset failed:', err);
    }
  };

  // 關閉對話框
  const handleClose = () => {
    setName('');
    setDescription('');
    setIsPublic(false);
    setValidationError('');
    setSuccessMessage('');
    clearError();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-labelledby="save-preset-dialog-title"
      aria-modal="true"
      onClick={handleClose}>

      <div
        className="bg-gray-900 border-2 border-pip-boy-green rounded-lg p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* 標題 */}
        <div className="flex items-center justify-between mb-6">
          <h2
            id="save-preset-dialog-title"
            className="text-xl text-pip-boy-green font-bold">

            儲存節奏
          </h2>
          <Button size="icon" variant="link"
          type="button"
          onClick={handleClose}
          className="transition-colors"
          aria-label="關閉">

            <PixelIcon name="close" sizePreset="sm" aria-label="關閉" />
          </Button>
        </div>

        {/* 成功訊息 */}
        {successMessage &&
        <div className="mb-4 p-3 bg-pip-boy-green/20 border border-pip-boy-green rounded-lg flex items-center gap-2">
            <PixelIcon name="checkbox-circle" variant="success" sizePreset="sm" decorative />
            <span className="text-sm text-pip-boy-green">{successMessage}</span>
          </div>
        }

        {/* 錯誤訊息 */}
        {(validationError || error) &&
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-2">
            <PixelIcon name="error-warning" variant="error" sizePreset="sm" decorative />
            <span className="text-sm text-red-400">{validationError || error}</span>
          </div>
        }

        {/* 表單內容 */}
        <div className="space-y-4">
          {/* 名稱輸入 */}
          <div>
            <label htmlFor="preset-name" className="block text-sm text-pip-boy-green font-medium mb-2">
              歌曲名稱 <span className="text-red-500">*</span>
            </label>
            <input
              id="preset-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              placeholder="輸入歌曲名稱..."
              required
              className={cn(
                'w-full px-3 py-2 rounded-lg',
                'bg-gray-800 border-2 border-gray-600',
                'text-pip-boy-green placeholder-gray-500',
                'focus:outline-none focus:border-pip-boy-green focus:ring-2 focus:ring-pip-boy-green/50',
                'transition-colors'
              )}
              disabled={isLoading || !!successMessage} />

            <div className="mt-1 text-xs text-pip-boy-green/60 text-right">
              {name.length} / 50
            </div>
          </div>

          {/* 描述輸入 */}
          <div>
            <label htmlFor="preset-description" className="block text-sm text-pip-boy-green font-medium mb-2">
              描述（可選）
            </label>
            <textarea
              id="preset-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="輸入歌曲描述..."
              className={cn(
                'w-full px-3 py-2 rounded-lg resize-none',
                'bg-gray-800 border-2 border-gray-600',
                'text-pip-boy-green placeholder-gray-500',
                'focus:outline-none focus:border-pip-boy-green focus:ring-2 focus:ring-pip-boy-green/50',
                'transition-colors'
              )}
              disabled={isLoading || !!successMessage} />

            <div className="mt-1 text-xs text-pip-boy-green/60 text-right">
              {description.length} / 200
            </div>
          </div>

          {/* 公開分享勾選框 */}
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isLoading || !!successMessage}
                className={cn(
                  'mt-0.5 w-5 h-5 rounded border-2 border-pip-boy-green',
                  'bg-gray-900 checked:bg-pip-boy-green',
                  'focus:outline-none focus:ring-2 focus:ring-pip-boy-green/50',
                  'transition-colors cursor-pointer',
                  'appearance-none relative',
                  'after:content-[""] after:absolute after:inset-0',
                  'after:bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20fill%3D%22%23000%22%20d%3D%22M9%2016.17L4.83%2012l-1.42%201.41L9%2019%2021%207l-1.41-1.41z%22%2F%3E%3C%2Fsvg%3E")] after:bg-center after:bg-no-repeat after:bg-contain',
                  'after:opacity-0 checked:after:opacity-100'
                )} />

              <div className="flex-1">
                <div className="text-sm text-pip-boy-green font-medium">
                  公開分享
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  勾選後其他使用者（含訪客）可以查看並使用此節奏
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* 按鈕 */}
        <div className="flex gap-3 mt-6">
          <Button size="default" variant="default"
          type="button"
          onClick={handleClose}
          disabled={isLoading || !!successMessage}
          className="{expression}">







            取消
          </Button>
          <Button size="icon" variant="default"
          type="button"
          onClick={handleSave}
          disabled={isLoading || !!successMessage}
          className="{expression}">








            {isLoading ?
            <>
                <PixelIcon name="loader-4" animation="spin" sizePreset="sm" decorative />
                <span>儲存中...</span>
              </> :

            '儲存'
            }
          </Button>
        </div>
      </div>
    </div>);

};

SavePresetDialog.displayName = 'SavePresetDialog';