'use client';

/**
 * RhythmPlaybackControls - Pattern-Based 播放控制組件
 * Task 5.5: 實作 PlaybackControls 播放控制組件
 * Feature: playlist-music-player
 * Requirements: 需求 2.1-2.9, 需求 30.3-30.5
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { RhythmAudioSynthesizer } from '@/lib/audio/RhythmAudioSynthesizer';
import { useRhythmPlaylistStore, type Pattern } from '@/lib/stores/rhythmPlaylistStore';
import { useAudioStore } from '@/lib/audio/audioStore';

/**
 * 循環模式類型
 */import { Button } from "@/components/ui/button";
type RepeatMode = 'off' | 'all' | 'one';

export interface RhythmPlaybackControlsProps {
  className?: string;
}

/**
 * RhythmPlaybackControls - 整合 RhythmAudioSynthesizer 的播放控制
 *
 * 功能：
 * - 播放/暫停/停止
 * - 上一首/下一首
 * - 隨機播放
 * - 循環模式（單曲循環、列表循環、不循環）
 * - 整合 audioStore 音效播放
 */
export function RhythmPlaybackControls({ className }: RhythmPlaybackControlsProps) {
  // ========== Refs ==========
  const synthesizerRef = useRef<RhythmAudioSynthesizer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // ========== State ==========
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);

  // ========== Store ==========
  const { currentPlaylist } = useRhythmPlaylistStore();
  const { playSound } = useAudioStore();

  // ========== Effects ==========

  /**
   * 初始化 AudioContext 和 Synthesizer
   */
  useEffect(() => {
    // 初始化 AudioContext（單例）
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    // 初始化 Synthesizer
    if (currentPlaylist && currentPlaylist.patterns.length > 0 && audioContextRef.current) {
      const patterns: Pattern[] = currentPlaylist.patterns.map((preset) => preset.pattern);

      synthesizerRef.current = new RhythmAudioSynthesizer({
        audioContext: audioContextRef.current,
        patterns,
        tempo: 120,
        loopCount: 4
      });

      // 設定 Pattern 完成回呼（4 次循環後自動切歌）
      synthesizerRef.current.setOnPatternComplete(() => {
        handlePatternComplete();
      });
    }

    // Cleanup
    return () => {
      if (synthesizerRef.current) {
        synthesizerRef.current.stop();
      }
    };
  }, [currentPlaylist]);

  /**
   * Pattern 完成回呼（4 次循環後）
   */
  const handlePatternComplete = useCallback(() => {
    if (!synthesizerRef.current) return;

    if (repeatMode === 'one') {
      // 單曲循環：重新開始當前 Pattern
      synthesizerRef.current.stop();
      synthesizerRef.current.play();
    } else if (repeatMode === 'all') {
      // 列表循環：自動切換到下一首
      handleNext();
    } else {
      // 不循環：停止播放
      setIsPlaying(false);
      synthesizerRef.current.stop();
    }
  }, [repeatMode]);

  // ========== Handlers ==========

  /**
   * 播放/暫停切換
   */
  const handlePlayPause = useCallback(() => {
    if (!synthesizerRef.current) return;

    // 播放音效
    playSound('pip-boy-beep');

    if (isPlaying) {
      synthesizerRef.current.pause();
      setIsPlaying(false);
    } else {
      // 恢復 AudioContext（處理瀏覽器自動播放限制）
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      synthesizerRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, playSound]);

  /**
   * 停止播放（重置到步驟 0）
   */
  const handleStop = useCallback(() => {
    if (!synthesizerRef.current) return;

    playSound('pip-boy-beep');
    synthesizerRef.current.stop();
    setIsPlaying(false);
  }, [playSound]);

  /**
   * 下一首
   */
  const handleNext = useCallback(() => {
    if (!synthesizerRef.current) return;

    playSound('pip-boy-beep');

    if (shuffleEnabled && currentPlaylist && currentPlaylist.patterns.length > 1) {
      // 隨機播放：隨機選擇下一首（排除當前）
      const availableIndexes = currentPlaylist.patterns.
      map((_, i) => i).
      filter((i) => i !== currentPatternIndex);
      const randomIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];

      setCurrentPatternIndex(randomIndex);
      synthesizerRef.current.loadPattern(currentPlaylist.patterns[randomIndex].pattern);
    } else {
      // 順序播放
      synthesizerRef.current.next();
      const state = synthesizerRef.current.getState();
      setCurrentPatternIndex(state.currentPatternIndex);
    }

    // 如果正在播放，重新開始新 Pattern
    if (isPlaying) {
      synthesizerRef.current.stop();
      synthesizerRef.current.play();
    }
  }, [shuffleEnabled, currentPatternIndex, currentPlaylist, isPlaying, playSound]);

  /**
   * 上一首
   */
  const handlePrevious = useCallback(() => {
    if (!synthesizerRef.current) return;

    playSound('pip-boy-beep');

    if (shuffleEnabled && currentPlaylist && currentPlaylist.patterns.length > 1) {
      // 隨機播放：隨機選擇上一首（排除當前）
      const availableIndexes = currentPlaylist.patterns.
      map((_, i) => i).
      filter((i) => i !== currentPatternIndex);
      const randomIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];

      setCurrentPatternIndex(randomIndex);
      synthesizerRef.current.loadPattern(currentPlaylist.patterns[randomIndex].pattern);
    } else {
      // 順序播放
      synthesizerRef.current.previous();
      const state = synthesizerRef.current.getState();
      setCurrentPatternIndex(state.currentPatternIndex);
    }

    // 如果正在播放，重新開始新 Pattern
    if (isPlaying) {
      synthesizerRef.current.stop();
      synthesizerRef.current.play();
    }
  }, [shuffleEnabled, currentPatternIndex, currentPlaylist, isPlaying, playSound]);

  /**
   * 切換隨機播放
   */
  const handleToggleShuffle = useCallback(() => {
    playSound('pip-boy-beep');
    setShuffleEnabled((prev) => !prev);
  }, [playSound]);

  /**
   * 循環切換循環模式
   */
  const handleCycleRepeatMode = useCallback(() => {
    playSound('pip-boy-beep');
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, [playSound]);

  // ========== Keyboard Shortcuts ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 避免在輸入框時觸發
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleNext, handlePrevious]);

  // ========== Render ==========

  // 檢查是否有播放清單
  const hasPlaylist = currentPlaylist && currentPlaylist.patterns.length > 0;

  return (
    <div className={`flex flex-col gap-4 ${className || ''}`}>
      {/* Main Playback Controls */}
      <div
        className="flex items-center justify-center gap-4"
        role="group"
        aria-label="播放控制">

        {/* Previous Button */}
        <Button size="icon" variant="outline"
        onClick={handlePrevious}
        disabled={!hasPlaylist}
        className="flex items-center justify-center w-10 h-10\n transition-all\n disabled:opacity-50 disabled:cursor-not-allowed\n"









        aria-label="上一首">

          <PixelIcon name="skip-back" sizePreset="sm" aria-label="上一首" />
        </Button>

        {/* Play/Pause Button */}
        <Button size="icon" variant="outline"
        onClick={handlePlayPause}
        disabled={!hasPlaylist}
        className="flex items-center justify-center w-14 h-14\n transition-all\n disabled:opacity-50 disabled:cursor-not-allowed\n"











        aria-label={isPlaying ? '暫停' : '播放'}>

          {isPlaying ?
          <PixelIcon name="pause" sizePreset="sm" aria-label="暫停" /> :

          <PixelIcon name="play" sizePreset="sm" aria-label="播放" />
          }
        </Button>

        {/* Next Button */}
        <Button size="icon" variant="outline"
        onClick={handleNext}
        disabled={!hasPlaylist}
        className="flex items-center justify-center w-10 h-10\n transition-all\n disabled:opacity-50 disabled:cursor-not-allowed\n"









        aria-label="下一首">

          <PixelIcon name="skip-forward" sizePreset="sm" aria-label="下一首" />
        </Button>
      </div>

      {/* Secondary Controls: Shuffle & Repeat */}
      <div
        className="flex items-center justify-center gap-6"
        role="group"
        aria-label="播放模式控制">

        {/* Shuffle Button */}
        <Button size="icon" variant="default"
        onClick={handleToggleShuffle}
        disabled={!hasPlaylist}
        className="{expression}"











        aria-label={shuffleEnabled ? '停用隨機播放' : '啟用隨機播放'}
        aria-pressed={shuffleEnabled}>

          <PixelIcon
            name="shuffle"
            sizePreset="sm"
            variant={shuffleEnabled ? 'primary' : 'muted'}
            aria-label={shuffleEnabled ? '停用隨機播放' : '啟用隨機播放'} />

        </Button>

        {/* Repeat Button */}
        <Button size="icon" variant="default"
        onClick={handleCycleRepeatMode}
        disabled={!hasPlaylist}
        className="{expression}"











        aria-label={
        repeatMode === 'off' ?
        '不循環' :
        repeatMode === 'one' ?
        '單曲循環' :
        '列表循環'
        }
        aria-pressed={repeatMode !== 'off'}>

          <PixelIcon
            name={repeatMode === 'one' ? 'repeat-1' : 'repeat'}
            sizePreset="sm"
            variant={repeatMode !== 'off' ? 'primary' : 'muted'}
            aria-label={
            repeatMode === 'off' ?
            '不循環' :
            repeatMode === 'one' ?
            '單曲循環' :
            '列表循環'
            } />

        </Button>
      </div>

      {/* 無播放清單提示 */}
      {!hasPlaylist &&
      <div className="text-center text-xs text-pip-boy-green/50">
          請先加入歌曲到播放清單
        </div>
      }

      {/* Keyboard Hints */}
      {hasPlaylist &&
      <div className="text-center text-xs text-pip-boy-green/50">
          快捷鍵: 空白鍵 (播放/暫停) | ← → (上一首/下一首)
        </div>
      }
    </div>);

}