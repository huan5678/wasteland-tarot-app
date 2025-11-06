'use client';

import React, { useState, useEffect } from 'react';
import { useTitleStore } from '@/lib/stores/titleStore';
import { PixelIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

/**
 * TitleSelector - 個人稱號設定元件
 *
 * Fallout/Wasteland 風格的稱號選擇器
 * - 顯示當前稱號
 * - 列出所有已解鎖稱號
 * - 允許選擇或取消稱號
 */
export const TitleSelector: React.FC = () => {
  const { currentTitle, unlockedTitles, isLoading, error, setTitle, fetchTitles, clearError } = useTitleStore();
  const [selectedTitle, setSelectedTitle] = useState<string | null>(currentTitle);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 初始載入稱號資料
  useEffect(() => {
    fetchTitles();
  }, [fetchTitles]);

  // 同步當前稱號到選擇狀態
  useEffect(() => {
    setSelectedTitle(currentTitle);
  }, [currentTitle]);

  // 檢查是否有變更
  useEffect(() => {
    setHasChanges(selectedTitle !== currentTitle);
  }, [selectedTitle, currentTitle]);

  const handleSave = async () => {
    const success = await setTitle(selectedTitle);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleTitleSelect = (title: string | null) => {
    setSelectedTitle(title);
    if (error) clearError();
  };

  if (isLoading && unlockedTitles.length === 0) {
    return (
      <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
        <div className="text-center py-6">
          <div className="w-8 h-8 border-2 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-pip-boy-green/70 text-sm">載入稱號資料中...</p>
        </div>
      </div>);

  }

  return (
    <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
      {/* Header */}
      <h2 className="text-xl font-bold text-pip-boy-green mb-4 flex items-center gap-2">
        <PixelIcon name="award" sizePreset="md" variant="primary" decorative />
        個人稱號設定
      </h2>

      {/* 當前稱號顯示 */}
      <div className="mb-6 p-4 bg-wasteland-dark border border-pip-boy-green/30 rounded">
        <div className="text-sm text-pip-boy-green/70 mb-1">當前稱號</div>
        <div className="text-lg font-semibold text-pip-boy-green">
          {currentTitle ?
          <span className="inline-flex items-center gap-2">
              <PixelIcon name="badge" sizePreset="sm" variant="primary" decorative />
              {currentTitle}
            </span> :

          <span className="text-pip-boy-green/50">無</span>
          }
        </div>
      </div>

      {/* 稱號選擇列表 */}
      <div className="space-y-2 mb-6">
        <h3 className="text-sm font-semibold text-pip-boy-green mb-3 flex items-center gap-2">
          <PixelIcon name="list" sizePreset="xs" decorative />
          已解鎖稱號 ({unlockedTitles.length})
        </h3>

        {unlockedTitles.length === 0 ?
        <div className="text-center py-6 px-4 border border-pip-boy-green/20 bg-pip-boy-green/5 rounded">
            <PixelIcon name="lock" sizePreset="lg" variant="muted" decorative />
            <p className="mt-3 text-pip-boy-green/60 text-sm">尚未解鎖任何稱號</p>
            <p className="mt-1 text-pip-boy-green/40 text-xs">
              完成成就來獲得稱號吧！
            </p>
          </div> :

        <div className="space-y-2">
            {/* 無稱號選項 */}
            <button
              type="button"
              onClick={() => handleTitleSelect(null)}
              className="w-full flex items-center gap-3 px-4 py-3 border-2 border-pip-boy-green/30 bg-wasteland-dark hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-all cursor-pointer"
            >
              {/* Radio Button */}
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            selectedTitle === null ?
            'border-pip-boy-green bg-pip-boy-green/20' :
            'border-pip-boy-green/50'}`
            }>
                {selectedTitle === null &&
              <div className="w-2.5 h-2.5 rounded-full bg-pip-boy-green shadow-[0_0_6px_rgba(0,255,136,0.8)]"></div>
              }
              </div>

              {/* Label */}
              <span className={`flex-1 text-left ${
            selectedTitle === null ?
            'text-pip-boy-green font-semibold' :
            'text-pip-boy-green/70'}`
            }>
                無稱號
              </span>

              {/* Current Badge */}
              {currentTitle === null &&
            <span className="text-xs px-2 py-0.5 border border-pip-boy-green/50 text-pip-boy-green/70 rounded-sm">
                  當前
                </span>
            }
            </button>

            {/* 已解鎖稱號列表 */}
            {unlockedTitles.map((title) => (
              <button
                key={title}
                type="button"
                onClick={() => handleTitleSelect(title)}
                className="w-full flex items-center gap-3 px-4 py-3 border-2 border-pip-boy-green/30 bg-wasteland-dark hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-all cursor-pointer"
              >

                {/* Radio Button */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            selectedTitle === title ?
            'border-pip-boy-green bg-pip-boy-green/20' :
            'border-pip-boy-green/50'}`
            }>
                  {selectedTitle === title &&
              <div className="w-2.5 h-2.5 rounded-full bg-pip-boy-green shadow-[0_0_6px_rgba(0,255,136,0.8)]"></div>
              }
                </div>

                {/* Title Label */}
                <span className={`flex-1 text-left flex items-center gap-2 ${
            selectedTitle === title ?
            'text-pip-boy-green font-semibold' :
            'text-pip-boy-green/70'}`
            }>
                  <PixelIcon name="badge" sizePreset="xs" decorative />
                  {title}
                </span>

                {/* Current Badge */}
                {currentTitle === title && (
                  <span className="text-xs px-2 py-0.5 border border-pip-boy-green/50 text-pip-boy-green/70 rounded-sm">
                    當前
                  </span>
                )}
              </button>
            ))}
          </div>
        }
      </div>

      {/* Error Message */}
      {error &&
      <div className="mb-4 p-3 border border-red-400/50 bg-red-900/20 rounded flex items-start gap-2">
          <PixelIcon name="alert-circle" sizePreset="sm" variant="error" aria-label="錯誤" />
          <div className="flex-1">
            <p className="text-red-400 text-sm font-semibold">設定失敗</p>
            <p className="text-red-400/80 text-xs mt-1">{error}</p>
          </div>
          <Button size="icon" variant="link"
        onClick={clearError}
        className="transition-colors"
        aria-label="關閉錯誤訊息">

            <PixelIcon name="close" sizePreset="xs" decorative />
          </Button>
        </div>
      }

      {/* Success Message */}
      {showSuccess &&
      <div className="mb-4 p-3 bg-pip-boy-green/10 border border-pip-boy-green rounded flex items-center gap-2">
          <PixelIcon name="check-circle" sizePreset="sm" variant="success" decorative />
          <span className="text-pip-boy-green text-sm font-semibold">稱號設定成功！</span>
        </div>
      }

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isLoading || !hasChanges || unlockedTitles.length === 0}
        className="w-full"
        variant="default">

        {isLoading ?
        <>
            <PixelIcon name="loader" sizePreset="sm" animation="spin" decorative />
            處理中...
          </> :

        <>
            <PixelIcon name="check" sizePreset="sm" decorative />
            確認變更
          </>
        }
      </Button>

      {/* Helper Text */}
      {!hasChanges && unlockedTitles.length > 0 &&
      <p className="mt-3 text-center text-pip-boy-green/50 text-xs">
          選擇不同的稱號來啟用變更按鈕
        </p>
      }
    </div>);

};