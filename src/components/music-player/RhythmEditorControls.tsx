'use client';

/**
 * RhythmEditorControls - 編輯器控制組件
 * Task 6.3: 實作 RhythmEditorControls 編輯器控制
 * Feature: playlist-music-player
 * Requirements: 需求 22.1-22.9
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { PixelIcon } from '@/components/ui/icons';
import { useRhythmEditorStore } from '@/lib/stores/rhythmEditorStore';
import { EditorAudioSynthesizer } from '@/lib/audio/EditorAudioSynthesizer';

/**
 * RhythmEditorControls 組件屬性
 */
export interface RhythmEditorControlsProps {
  /** 開啟儲存 Preset 對話框的回調 */
  onOpenSaveDialog?: () => void;
}

/**
 * RhythmEditorControls 組件
 *
 * 功能：
 * - 按鈕：Play/Pause（切換）、Stop、Clear、Save
 * - 實作 Tempo 滑桿（60-180 BPM，預設 120）
 * - 顯示當前 BPM 數值
 * - Clear 按鈕顯示確認對話框
 * - Save 按鈕開啟儲存對話框
 * - 使用 PixelIcon 圖示
 * - 整合 rhythmEditorStore
 *
 * @example
 * ```tsx
 * <RhythmEditorControls onOpenSaveDialog={() => setIsDialogOpen(true)} />
 * ```
 */
export const RhythmEditorControls: React.FC<RhythmEditorControlsProps> = ({ onOpenSaveDialog }) => {
  // 使用穩定的 selector 避免無限迴圈
  const pattern = useRhythmEditorStore((state) => state.pattern);
  const tempo = useRhythmEditorStore((state) => state.tempo);
  const isPlaying = useRhythmEditorStore((state) => state.isPlaying);
  const loop = useRhythmEditorStore((state) => state.loop);
  const play = useRhythmEditorStore((state) => state.play);
  const pause = useRhythmEditorStore((state) => state.pause);
  const stop = useRhythmEditorStore((state) => state.stop);
  const clear = useRhythmEditorStore((state) => state.clear);
  const setTempo = useRhythmEditorStore((state) => state.setTempo);
  const setCurrentStep = useRhythmEditorStore((state) => state.setCurrentStep);
  const setLoop = useRhythmEditorStore((state) => state.setLoop);

  // AudioSynthesizer 實例
  const synthesizerRef = useRef<EditorAudioSynthesizer | null>(null);

  // 播放控制 Refs
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Clear 確認對話框狀態
  const [showClearDialog, setShowClearDialog] = useState(false);

  // 初始化 AudioSynthesizer
  useEffect(() => {
    if (!synthesizerRef.current) {
      synthesizerRef.current = new EditorAudioSynthesizer({
        audioContext: new (window.AudioContext || (window as any).webkitAudioContext)(),
        tempo,
      });
    }

    return () => {
      synthesizerRef.current?.destroy();
    };
  }, []);

  // 同步 tempo 到 AudioSynthesizer
  useEffect(() => {
    synthesizerRef.current?.setTempo(tempo);
  }, [tempo]);

  // 清除播放計時器
  const clearTimers = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  };

  // 開始播放循環
  const startPlayback = () => {
    if (!synthesizerRef.current) return;

    synthesizerRef.current.previewPattern(pattern);
    play();

    // 模擬播放頭更新（實際應該從 EditorAudioSynthesizer 取得）
    const stepDuration = (60 / tempo) / 4 * 1000; // 毫秒

    intervalIdRef.current = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 16);
    }, stepDuration);

    // 16 步驟後的處理
    timeoutIdRef.current = setTimeout(() => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }

      // 檢查是否循環播放
      const currentLoop = useRhythmEditorStore.getState().loop;
      if (currentLoop) {
        // 循環播放：重新開始
        setCurrentStep(0);
        startPlayback();
      } else {
        // 不循環：停止
        stop();
      }
    }, stepDuration * 16);
  };

  // 播放控制
  const handlePlay = () => {
    clearTimers();
    startPlayback();
  };

  const handlePause = () => {
    clearTimers();
    synthesizerRef.current?.stopPreview();
    pause();
  };

  const handleStop = () => {
    clearTimers();
    synthesizerRef.current?.stopPreview();
    stop();
  };

  const handleClear = () => {
    setShowClearDialog(true);
  };

  const confirmClear = () => {
    clear();
    setShowClearDialog(false);
  };

  const cancelClear = () => {
    setShowClearDialog(false);
  };

  const handleTempoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempo(Number(e.target.value));
  };

  const handleToggleLoop = () => {
    setLoop(!loop);
  };

  // 組件卸載時清除計時器
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左欄：播放控制按鈕 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {/* Play/Pause 按鈕 */}
            <button
              type="button"
              onClick={isPlaying ? handlePause : handlePlay}
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-lg',
                'border-2 transition-all duration-200',
                'hover:scale-105 active:scale-95',
                'focus:outline-none focus:ring-2 focus:ring-pip-boy-green/50',
                isPlaying
                  ? 'bg-pip-boy-green/20 border-pip-boy-green text-pip-boy-green'
                  : 'bg-gray-800 border-gray-600 text-pip-boy-green hover:border-pip-boy-green/70'
              )}
              aria-label={isPlaying ? '暫停' : '播放'}
            >
              <PixelIcon
                name={isPlaying ? 'pause' : 'play'}
                sizePreset="md"
                variant="primary"
                animation={isPlaying ? 'pulse' : undefined}
                aria-label={isPlaying ? '暫停' : '播放'}
              />
            </button>

            {/* Stop 按鈕 */}
            <button
              type="button"
              onClick={handleStop}
              disabled={!isPlaying}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg',
                'border-2 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-pip-boy-green/50',
                !isPlaying
                  ? 'bg-gray-900 border-gray-700 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-800 border-gray-600 text-red-500 hover:border-red-500/70 hover:scale-105'
              )}
              aria-label="停止"
            >
              <PixelIcon name="stop" sizePreset="sm" variant="error" aria-label="停止" />
            </button>

            {/* Clear 按鈕 */}
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg',
                'border-2 bg-gray-800 border-gray-600 transition-all duration-200',
                'text-yellow-500 hover:border-yellow-500/70 hover:scale-105',
                'focus:outline-none focus:ring-2 focus:ring-pip-boy-green/50'
              )}
              aria-label="清除"
            >
              <PixelIcon name="delete-bin" sizePreset="sm" variant="warning" aria-label="清除" />
            </button>

            {/* 分隔線 */}
            <div className="w-px h-10 bg-gray-700" />

            {/* 循環播放按鈕 */}
            <button
              type="button"
              onClick={handleToggleLoop}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg',
                'border-2 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-pip-boy-green/50',
                loop
                  ? 'bg-pip-boy-green/20 border-pip-boy-green text-pip-boy-green'
                  : 'bg-gray-800 border-gray-600 text-gray-500 hover:border-gray-500/70 hover:scale-105'
              )}
              aria-label={loop ? '停用循環播放' : '啟用循環播放'}
              aria-pressed={loop}
            >
              <PixelIcon
                name="repeat"
                sizePreset="sm"
                variant={loop ? 'primary' : 'muted'}
                aria-label={loop ? '停用循環播放' : '啟用循環播放'}
              />
            </button>

            {/* 儲存按鈕 */}
            {onOpenSaveDialog && (
              <>
                {/* 分隔線 */}
                <div className="w-px h-10 bg-gray-700" />

                <button
                  type="button"
                  onClick={onOpenSaveDialog}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-lg',
                    'border-2 bg-gray-800 border-gray-600 transition-all duration-200',
                    'text-pip-boy-green hover:border-pip-boy-green/70 hover:scale-105',
                    'focus:outline-none focus:ring-2 focus:ring-pip-boy-green/50'
                  )}
                  aria-label="儲存節奏"
                >
                  <PixelIcon name="save" sizePreset="sm" variant="primary" aria-label="儲存" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 右欄：Tempo 滑桿 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="tempo-slider" className="text-sm text-pip-boy-green font-medium">
                Tempo (BPM)
              </label>
              <span className="text-lg text-pip-boy-green font-mono font-bold">{tempo}</span>
            </div>

            <input
              id="tempo-slider"
              type="range"
              min="60"
              max="180"
              step="1"
              value={tempo}
              onChange={handleTempoChange}
              className={cn(
                'w-full h-2 rounded-lg appearance-none cursor-pointer',
                'bg-gray-700',
                '[&::-webkit-slider-thumb]:appearance-none',
                '[&::-webkit-slider-thumb]:w-4',
                '[&::-webkit-slider-thumb]:h-4',
                '[&::-webkit-slider-thumb]:rounded-full',
                '[&::-webkit-slider-thumb]:bg-pip-boy-green',
                '[&::-webkit-slider-thumb]:cursor-pointer',
                '[&::-webkit-slider-thumb]:transition-transform',
                '[&::-webkit-slider-thumb]:hover:scale-110',
                '[&::-moz-range-thumb]:w-4',
                '[&::-moz-range-thumb]:h-4',
                '[&::-moz-range-thumb]:rounded-full',
                '[&::-moz-range-thumb]:bg-pip-boy-green',
                '[&::-moz-range-thumb]:border-0',
                '[&::-moz-range-thumb]:cursor-pointer'
              )}
              role="slider"
              aria-valuenow={tempo}
              aria-valuemin={60}
              aria-valuemax={180}
              aria-label={`節拍速度 ${tempo} BPM`}
            />

            <div className="flex items-center justify-between text-xs text-pip-boy-green/60">
              <span>60</span>
              <span>120</span>
              <span>180</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clear 確認對話框（在 grid 外部） */}
      {showClearDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          role="dialog"
          aria-labelledby="clear-dialog-title"
          aria-modal="true"
        >
          <div className="bg-gray-900 border-2 border-pip-boy-green rounded-lg p-6 max-w-sm mx-4 shadow-2xl">
            <h3
              id="clear-dialog-title"
              className="text-lg text-pip-boy-green font-bold mb-4"
            >
              確認清除
            </h3>
            <p className="text-sm text-gray-300 mb-6">
              確定要清除所有步驟嗎？此操作無法復原。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={cancelClear}
                className={cn(
                  'px-4 py-2 rounded-lg border-2',
                  'bg-gray-800 border-gray-600 text-gray-300',
                  'hover:border-pip-boy-green/70 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-pip-boy-green/50'
                )}
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmClear}
                className={cn(
                  'px-4 py-2 rounded-lg border-2',
                  'bg-red-900/50 border-red-500 text-red-400',
                  'hover:bg-red-900/70 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-red-500/50'
                )}
              >
                確認清除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

RhythmEditorControls.displayName = 'RhythmEditorControls';
