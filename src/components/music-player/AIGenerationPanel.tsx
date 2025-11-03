'use client';

/**
 * AIGenerationPanel - AI 生成面板
 * Task 6.6: 實作 AIGenerationPanel AI 生成面板
 * Feature: playlist-music-player
 * Requirements: 需求 23.1-23.13
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PixelIcon } from '@/components/ui/icons';
import { useRhythmEditorStore } from '@/lib/stores/rhythmEditorStore';

/**
 * 快速關鍵字列表
 */import { Button } from "@/components/ui/button";
const QUICK_KEYWORDS = [
'808 Cowbell',
'Glitch',
'Jazz Fusion',
'Afrobeat',
'Lo-Fi',
'Stadium Rock',
'Ambient'] as
const;

/**
 * AIGenerationPanel 組件
 *
 * 功能：
 * - 文字輸入框（最多 200 字元）
 * - 快速關鍵字按鈕：808 Cowbell, Glitch, Jazz Fusion, Afrobeat, Lo-Fi, Stadium Rock, Ambient
 * - 點擊關鍵字自動填入輸入框
 * - 生成按鈕：整合 rhythmEditorStore.generateRhythm()
 * - 顯示載入動畫：Pip-Boy 風格旋轉圖示 + "GENERATING RHYTHM..." 文字
 * - 顯示配額：「15/20 remaining」
 * - 配額用盡時停用按鈕並顯示「今日配額已用完（20/20），明日重置」
 *
 * @example
 * ```tsx
 * <AIGenerationPanel />
 * ```
 */
export const AIGenerationPanel: React.FC = () => {
  const {
    aiQuota,
    generateRhythm,
    fetchQuota,
    isLoading,
    error,
    clearError
  } = useRhythmEditorStore((state) => ({
    aiQuota: state.aiQuota,
    generateRhythm: state.generateRhythm,
    fetchQuota: state.fetchQuota,
    isLoading: state.isLoading,
    error: state.error,
    clearError: state.clearError
  }));

  const [prompt, setPrompt] = useState('');
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 載入配額
  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  // 檢查配額是否用盡
  const isQuotaExhausted = aiQuota ? aiQuota.used >= aiQuota.limit : false;

  // 處理快速關鍵字點擊
  const handleKeywordClick = (keyword: string) => {
    setPrompt(keyword);
    clearError();
    setValidationError('');
  };

  // 驗證輸入
  const validateInput = (): boolean => {
    if (!prompt.trim()) {
      setValidationError('請輸入生成提示');
      return false;
    }

    if (prompt.length > 200) {
      setValidationError('提示不得超過 200 字元');
      return false;
    }

    setValidationError('');
    return true;
  };

  // 處理生成
  const handleGenerate = async () => {
    if (!validateInput()) return;

    try {
      await generateRhythm(prompt.trim());

      // 顯示成功訊息
      setSuccessMessage('節奏已生成！');

      // 2 秒後清除成功訊息
      setTimeout(() => {
        setSuccessMessage('');
      }, 2000);

      // 清空輸入框
      setPrompt('');
    } catch (err) {
      // 錯誤由 rhythmEditorStore 處理
      console.error('Generate rhythm failed:', err);
    }
  };

  // 處理輸入變更
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    clearError();
    setValidationError('');
  };

  return (
    <div className="space-y-4">
      {/* 標題與配額顯示 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg text-pip-boy-green font-bold flex items-center gap-2">
          <PixelIcon name="magic" sizePreset="sm" decorative />
          AI 節奏生成
        </h3>
        {aiQuota &&
        <div className="flex items-center gap-2">
            <span
            className={cn(
              'text-sm font-mono',
              isQuotaExhausted ? 'text-red-400' : 'text-pip-boy-green'
            )}>

              {aiQuota.remaining}/{aiQuota.limit} remaining
            </span>
          </div>
        }
      </div>

      {/* 配額用盡警告 */}
      {isQuotaExhausted &&
      <div className="p-3 bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-2">
          <PixelIcon name="forbid" variant="error" sizePreset="sm" decorative />
          <span className="text-xs text-red-400">
            今日配額已用完（{aiQuota?.used}/{aiQuota?.limit}），明日重置
          </span>
        </div>
      }

      {/* 成功訊息 */}
      {successMessage &&
      <div className="p-3 bg-pip-boy-green/20 border border-pip-boy-green rounded-lg flex items-center gap-2">
          <PixelIcon name="checkbox-circle" variant="success" sizePreset="sm" decorative />
          <span className="text-sm text-pip-boy-green">{successMessage}</span>
        </div>
      }

      {/* 錯誤訊息 */}
      {(validationError || error) &&
      <div className="p-3 bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-2">
          <PixelIcon name="error-warning" variant="error" sizePreset="sm" decorative />
          <span className="text-sm text-red-400">{validationError || error}</span>
        </div>
      }

      {/* 快速關鍵字按鈕 */}
      <div>
        <label className="block text-sm text-pip-boy-green/70 font-medium mb-2">
          快速關鍵字
        </label>
        <div className="flex flex-wrap gap-2">
          {QUICK_KEYWORDS.map((keyword) =>
          <Button size="icon" variant="default"
          key={keyword}
          type="button"
          onClick={() => handleKeywordClick(keyword)}
          disabled={isLoading || isQuotaExhausted}
          className="{expression}">








              {keyword}
            </Button>
          )}
        </div>
      </div>

      {/* 文字輸入框 */}
      <div>
        <label htmlFor="ai-prompt" className="block text-sm text-pip-boy-green font-medium mb-2">
          生成提示
        </label>
        <textarea
          id="ai-prompt"
          value={prompt}
          onChange={handlePromptChange}
          maxLength={200}
          rows={3}
          placeholder="描述你想要的節奏風格...（例如：808 Cowbell、Glitch、Jazz Fusion）"
          disabled={isLoading || isQuotaExhausted}
          className={cn(
            'w-full px-3 py-2 rounded-lg resize-none',
            'bg-gray-800 border-2 border-gray-600',
            'text-pip-boy-green placeholder-gray-500',
            'focus:outline-none focus:border-pip-boy-green focus:ring-2 focus:ring-pip-boy-green/50',
            'transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )} />

        <div className="mt-1 text-xs text-pip-boy-green/60 text-right">
          {prompt.length} / 200
        </div>
      </div>

      {/* 生成按鈕 */}
      <Button size="icon" variant="default"
      type="button"
      onClick={handleGenerate}
      disabled={isLoading || isQuotaExhausted || !prompt.trim()}
      className="{expression}">








        {isLoading ?
        <>
            <PixelIcon name="loader-4" animation="spin" sizePreset="md" decorative />
            <span className="uppercase tracking-wide">Generating Rhythm...</span>
          </> :

        <>
            <PixelIcon name="sparkling" sizePreset="md" decorative />
            <span>生成節奏</span>
          </>
        }
      </Button>

      {/* 使用說明 */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <h4 className="text-xs text-pip-boy-green font-medium mb-2 flex items-center gap-2">
          <PixelIcon name="information" sizePreset="xs" decorative />
          使用說明
        </h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• 每日配額：20 次生成</li>
          <li>• 輸入風格關鍵字（例如：Techno、Lo-Fi、Jazz）</li>
          <li>• AI 將根據提示生成獨特的 16 步驟節奏</li>
          <li>• 生成後可直接編輯或儲存為 Preset</li>
        </ul>
      </div>
    </div>);

};

AIGenerationPanel.displayName = 'AIGenerationPanel';