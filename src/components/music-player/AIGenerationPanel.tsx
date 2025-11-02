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
import { useAuthStore } from '@/lib/authStore';
import Link from 'next/link';

/**
 * 快速關鍵字列表
 */
const QUICK_KEYWORDS = [
  '808 Cowbell',
  'Glitch',
  'Jazz Fusion',
  'Afrobeat',
  'Lo-Fi',
  'Stadium Rock',
  'Ambient',
] as const;

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
  // 認證狀態
  const { user } = useAuthStore();
  const isAuthenticated = !!user;

  // 使用穩定的 selector 避免無限迴圈
  const aiQuota = useRhythmEditorStore((state) => state.aiQuota);
  const generateRhythm = useRhythmEditorStore((state) => state.generateRhythm);
  const isLoading = useRhythmEditorStore((state) => state.isLoading);
  const error = useRhythmEditorStore((state) => state.error);
  const clearError = useRhythmEditorStore((state) => state.clearError);

  const [prompt, setPrompt] = useState('');
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hasLoadedQuota, setHasLoadedQuota] = useState(false);

  // 載入配額（只在已登入且未載入時執行）
  useEffect(() => {
    if (isAuthenticated && !hasLoadedQuota) {
      const store = useRhythmEditorStore.getState();
      store.fetchQuota();
      setHasLoadedQuota(true);
    }
  }, [isAuthenticated, hasLoadedQuota]);

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
        {isAuthenticated && aiQuota && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-mono',
                isQuotaExhausted ? 'text-red-400' : 'text-pip-boy-green'
              )}
            >
              {aiQuota.remaining}/{aiQuota.limit} remaining
            </span>
          </div>
        )}
      </div>

      {/* 未登入提示 */}
      {!isAuthenticated && (
        <div className="p-4 bg-yellow-900/20 border-2 border-yellow-600 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <PixelIcon name="lock" variant="warning" sizePreset="md" decorative />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-yellow-400">需要登入才能使用 AI 生成</h4>
              <p className="text-xs text-yellow-400/80 mt-1">
                登入後即可使用 AI 生成節奏功能，每日享有 20 次免費配額
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className={cn(
              'block w-full px-4 py-2.5 rounded-lg border-2',
              'bg-yellow-600/20 border-yellow-600 text-yellow-400',
              'hover:bg-yellow-600/30 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-yellow-600/50',
              'flex items-center justify-center gap-2 font-medium text-sm'
            )}
          >
            <PixelIcon name="login-box" sizePreset="sm" decorative />
            <span>前往登入</span>
          </Link>
        </div>
      )}

      {/* 已登入：顯示 AI 生成功能 */}
      {isAuthenticated && (
        <>
          {/* 配額用盡警告 */}
          {isQuotaExhausted && (
            <div className="p-3 bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-2">
              <PixelIcon name="forbid" variant="error" sizePreset="sm" decorative />
              <span className="text-xs text-red-400">
                今日配額已用完（{aiQuota?.used}/{aiQuota?.limit}），明日重置
              </span>
            </div>
          )}

          {/* 成功訊息 */}
          {successMessage && (
            <div className="p-3 bg-pip-boy-green/20 border border-pip-boy-green rounded-lg flex items-center gap-2">
              <PixelIcon name="checkbox-circle" variant="success" sizePreset="sm" decorative />
              <span className="text-sm text-pip-boy-green">{successMessage}</span>
            </div>
          )}

          {/* 錯誤訊息 */}
          {(validationError || error) && (
            <div className="p-3 bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-2">
              <PixelIcon name="error-warning" variant="error" sizePreset="sm" decorative />
              <span className="text-sm text-red-400">{validationError || error}</span>
            </div>
          )}

          {/* 快速關鍵字按鈕 */}
          <div>
            <label className="block text-sm text-pip-boy-green/70 font-medium mb-2">
              快速關鍵字
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_KEYWORDS.map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  onClick={() => handleKeywordClick(keyword)}
                  disabled={isLoading || isQuotaExhausted}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border-2 text-xs',
                    'bg-gray-800 border-gray-600 text-pip-boy-green',
                    'hover:border-pip-boy-green/70 hover:bg-gray-700',
                    'transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-pip-boy-green/50',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {keyword}
                </button>
              ))}
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
              )}
            />
            <div className="mt-1 text-xs text-pip-boy-green/60 text-right">
              {prompt.length} / 200
            </div>
          </div>

          {/* 生成按鈕 */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || isQuotaExhausted || !prompt.trim()}
            className={cn(
              'w-full px-4 py-3 rounded-lg border-2',
              'bg-pip-boy-green/20 border-pip-boy-green text-pip-boy-green',
              'hover:bg-pip-boy-green/30 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-pip-boy-green/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2 font-medium'
            )}
          >
            {isLoading ? (
              <>
                <PixelIcon name="loader-4" animation="spin" sizePreset="md" decorative />
                <span className="uppercase tracking-wide">Generating Rhythm...</span>
              </>
            ) : (
              <>
                <PixelIcon name="sparkling" sizePreset="md" decorative />
                <span>生成節奏</span>
              </>
            )}
          </button>
        </>
      )}

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
    </div>
  );
};

AIGenerationPanel.displayName = 'AIGenerationPanel';
