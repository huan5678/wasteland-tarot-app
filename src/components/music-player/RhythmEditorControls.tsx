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
 * RhythmEditorControls 組件
 *
 * 功能：
 * - 按鈕：Play/Pause（切換）、Stop、Clear
 * - 實作 Tempo 滑桿（60-180 BPM，預設 120）
 * - 顯示當前 BPM 數值
 * - Clear 按鈕顯示確認對話框
 * - 使用 PixelIcon 圖示
 * - 整合 rhythmEditorStore
 *
 * @example
 * ```tsx
 * <RhythmEditorControls />
 * ```
 */
export const RhythmEditorControls: React.FC = () => {
  const {
    pattern,
    tempo,
    isPlaying,
    play,
    pause,
    stop,
    clear,
    setTempo,
    setCurrentStep,
  } = useRhythmEditorStore((state) => ({
    pattern: state.pattern,
    tempo: state.tempo,
    isPlaying: state.isPlaying,
    play: state.play,
    pause: state.pause,
    stop: state.stop,
    clear: state.clear,
    setTempo: state.setTempo,
    setCurrentStep: state.setCurrentStep,
  }));

  // AudioSynthesizer 實例
  const synthesizerRef = useRef<EditorAudioSynthesizer | null>(null);

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

  // 播放控制
  const handlePlay = () => {
    if (synthesizerRef.current) {
      synthesizerRef.current.previewPattern(pattern);
      play();

      // 模擬播放頭更新（實際應該從 EditorAudioSynthesizer 取得）
      const stepDuration = (60 / tempo) / 4 * 1000; // 毫秒
      const intervalId = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % 16);
      }, stepDuration);

      // 16 步驟後停止（約 4 小節）
      setTimeout(() => {
        clearInterval(intervalId);
        stop();
      }, stepDuration * 16);
    }
  };

  const handlePause = () => {
    synthesizerRef.current?.stopPreview();
    pause();
  };

  const handleStop = () => {
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

  return (
    <div className="space-y-4">
      {/* 播放控制按鈕 */}
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
      </div>

      {/* Tempo 滑桿 */}
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

      {/* Clear 確認對話框 */}
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
    </div>
  );
};

RhythmEditorControls.displayName = 'RhythmEditorControls';
