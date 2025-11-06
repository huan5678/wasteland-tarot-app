/**
 * MusicPlayerDrawer - 主播放器 Drawer 容器
 * Task 9, 10, 16: 建立基礎包裝元件並整合所有子元件
 * Requirements 5.1, 5.2, 5.3, 7.1, 7.2, 7.3
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { usePlaylistManager } from '@/hooks/useMusicPlayer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useRhythmMusicEngine } from '@/hooks/audio/useRhythmMusicEngine';
import { useMusicPlayerStore } from '@/stores/musicPlayerStore';
import { useRhythmEngineStore } from '@/stores/rhythmEngineStore';
import { PixelIcon } from '@/components/ui/icons';

// Import all child components (will be created in following tasks)
import { PlaybackControls } from './PlaybackControls';
import { MusicModeSelector } from './MusicModeSelector';
import { RhythmProgressBar } from './RhythmProgressBar';
import { VolumeControl } from './VolumeControl';
import { MusicVisualizer } from './MusicVisualizer';
import { ShortcutHelp } from './ShortcutHelp';
import { PlaylistSheet } from './PlaylistSheet';

/**
 * Drawer 高度狀態
 * Requirements 5.2: 三種高度模式
 */import { Button } from "@/components/ui/button";
type DrawerHeightState = 'minimized' | 'normal' | 'expanded';

const DRAWER_HEIGHTS = {
  minimized: '80px',
  normal: '60%',
  expanded: '90%'
} as const;

/**
 * MusicPlayerDrawer Props
 */
export interface MusicPlayerDrawerProps {
  className?: string;
}

export function MusicPlayerDrawer({ className }: MusicPlayerDrawerProps) {
  // ========== State ==========
  const [drawerHeight, setDrawerHeight] = useState<DrawerHeightState>('normal');
  
  // 從 Zustand store 獲取 synth 狀態
  const synthCurrentStep = useRhythmEngineStore((state) => state.currentStep);
  const synthCurrentLoop = useRhythmEngineStore((state) => state.currentLoop);

  // ========== Hooks ==========
  const {
    currentMode,
    isPlaying,
    repeatMode,
    shuffleEnabled,
    isDrawerOpen,
    isDrawerMinimized,
    isSheetOpen,
    playMode,
    pause,
    resume,
    stop,
    next,
    previous,
    toggleShuffle,
    cycleRepeatMode,
    openDrawer,
    closeDrawer,
    minimizeDrawer,
    expandDrawer,
    openSheet
  } = useMusicPlayer();

  const { currentPlaylist, currentModeIndex } = usePlaylistManager();

  // ========== Music Engine Integration ==========
  // Task: 整合 RhythmAudioSynthesizer 從資料庫播放 Pattern
  const { synth, isReady, systemPresets, stopAndReset } = useRhythmMusicEngine();
  
  // 取得 analyserNode 供視覺化使用
  const analyserNodeForViz = synth?.getAnalyserNode() ?? null;

  // 注意：synth 狀態現在由 useRhythmMusicEngine 通過 Zustand store 自動更新
  // 不需要在這裡輪詢

  // Store actions
  const setModeIndex = useMusicPlayerStore((state) => state.setModeIndex);

  // ========== Keyboard Shortcuts ==========
  const { showHelp, setShowHelp, shortcuts } = useKeyboardShortcuts({
    enabled: true
  });

  // ========== Focus Management ==========
  // Task 28: 焦點陷阱 - 當 Drawer 開啟時限制焦點在 Drawer 內
  const drawerContentRef = useFocusTrap<HTMLDivElement>({
    enabled: isDrawerOpen && !isDrawerMinimized,
    autoFocus: true,
    restoreFocus: true,
    onEscape: () => {
      if (!isSheetOpen) {
        closeDrawer();
      }
    }
  });

  // ========== Handlers ==========
  const handleOpenChange = (open: boolean) => {
    if (open) {
      openDrawer();
    } else {
      closeDrawer();
    }
  };

  const handleMinimize = () => {
    setDrawerHeight('minimized');
    minimizeDrawer();
  };

  const handleExpand = () => {
    setDrawerHeight('normal');
    expandDrawer();
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleStop = () => {
    // 先重置播放位置，再停止播放
    stopAndReset();
    stop();
    // 狀態會通過 Zustand store 自動同步
  };

  return (
    <Drawer open={isDrawerOpen} onOpenChange={handleOpenChange}>
      {/* Floating Trigger Button - Fixed at bottom right */}
      <DrawerTrigger asChild>
        <button
          className="
            fixed bottom-6 right-6 z-40
            w-14 h-14
            rounded-full
            bg-wasteland-dark
            border-2 border-pip-boy-green
            flex items-center justify-center
            transition-all duration-300
            hover:bg-pip-boy-green/10
            hover:shadow-[0_0_20px_rgba(0,255,136,0.4)]
            active:scale-95
          "
          aria-label="開啟音樂播放器"
        >
          {/* 外圈光暈效果（播放中時顯示） */}
          {isPlaying && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-pip-boy-green"
                animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="absolute inset-0 rounded-full bg-pip-boy-green/20 animate-pulse" />
            </>
          )}

          <PixelIcon
            name="music"
            sizePreset="sm"
            variant="primary"
            animation={isPlaying ? 'pulse' : undefined}
            decorative
          />

          {/* 播放狀態指示點 */}
          {isPlaying && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-pip-boy-green rounded-full animate-ping" />
          )}
        </button>
      </DrawerTrigger>

      {/* Drawer Content */}
      <DrawerContent
        ref={drawerContentRef}
        className="border-2 border-pip-boy-green bg-wasteland-darker text-pip-boy-green"
        style={{
          height: isDrawerMinimized ? DRAWER_HEIGHTS.minimized : DRAWER_HEIGHTS[drawerHeight]
        }}
        aria-label="音樂播放器"
        aria-live="polite"
        aria-atomic="false"
        role="region"
        aria-describedby="music-player-description">

        {/* Visually Hidden Title & Description for Accessibility */}
        <DrawerTitle className="sr-only">音樂播放器</DrawerTitle>
        <DrawerDescription id="music-player-description" className="sr-only">
          控制音樂播放、選擇音樂模式、調整音量和查看音訊視覺化。使用空白鍵播放/暫停，左右方向鍵切換歌曲，M 鍵靜音，Esc 鍵關閉。
        </DrawerDescription>

        {/* Minimized Mode (80px) */}
        {isDrawerMinimized ?
        <motion.div
          className="flex items-center justify-between px-6 h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}>

            {/* Current Mode Name */}
            <div className="flex items-center gap-4">
              <PixelIcon name="music" sizePreset="sm" variant="primary" decorative />
              <div>
                <div className="text-sm font-bold">
                  {currentMode || '未播放'}
                </div>
                <div className="text-xs text-pip-boy-green/60">
                  {isPlaying ? '播放中' : '已暫停'}
                </div>
              </div>
            </div>

            {/* Play/Pause Button */}
            <Button size="icon" variant="outline"
          onClick={handlePlayPause}
          className="p-2 border rounded transition-colors"
          aria-label={isPlaying ? '暫停音樂播放' : '開始音樂播放'}
          aria-pressed={isPlaying}>

              {isPlaying ? <PixelIcon name="pause" sizePreset="sm" aria-label="暫停圖示" /> : <PixelIcon name="play" sizePreset="sm" aria-label="播放圖示" />}
            </Button>

            {/* Expand Button */}
            <Button size="icon" variant="outline"
          onClick={handleExpand}
          className="p-2 border rounded transition-colors"
          aria-label="展開播放器至完整模式"
          aria-expanded="false">

              <PixelIcon name="maximize-2" sizePreset="sm" aria-label="展開圖示" />
            </Button>
          </motion.div> : (

        /* Normal/Expanded Mode */
        <motion.div
          className="flex flex-col h-full p-4 sm:p-6 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}>

            {/* Drag Handle */}
            <div className="flex justify-center flex-shrink-0">
              <div className="w-12 h-1 bg-pip-boy-green/50 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">音樂播放器</h2>
                <p className="text-xs text-pip-boy-green/70 mt-1">
                  [ 避難所標準作業程序 §17.9：命運預測時啟用音樂可提升準確度 3.6% ]
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="outline"
              onClick={handleMinimize}
              className="flex items-center gap-1.5 px-2 py-1 border rounded transition-colors"
              aria-label="最小化播放器至控制條"
              aria-expanded="true">

                  <PixelIcon name="minimize-2" sizePreset="xs" aria-label="最小化圖示" />
                </Button>
                <Button size="icon" variant="outline"
              onClick={openSheet}
              className="flex items-center gap-1.5 px-2 py-1 border rounded transition-colors"
              aria-label="開啟播放清單面板"
              aria-haspopup="dialog">

                  <PixelIcon name="playlist" sizePreset="xs" aria-label="播放清單圖示" />
                </Button>
              </div>
            </div>

            {/* Responsive Layout - 移除 overflow-y-auto 以防止拖動音量時頁面跳轉 */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4 min-h-0">
              {/* Left Column: Controls - 可以獨立捲動 */}
              <div className="flex flex-col gap-4 overflow-y-auto pr-2 min-w-0">
                {/* Music Mode Selector */}
                <div className="p-3 sm:p-4 bg-pip-boy-green/5 border border-pip-boy-green/30 rounded flex-shrink-0">
                  <h3 className="text-sm font-bold mb-3">節奏 Pattern</h3>
                  <MusicModeSelector
                  currentMode={systemPresets[currentModeIndex]?.name || null}
                  onModeSelect={async (index: number) => {
                    setModeIndex(index);
                  }} />

                </div>

                {/* Progress Bar + Playback Controls (整合) */}
                <div className="p-3 sm:p-4 bg-pip-boy-green/5 border border-pip-boy-green/30 rounded flex-shrink-0">
                  <h3 className="text-sm font-bold mb-3">播放進度</h3>
                  <RhythmProgressBar 
                    currentStep={synthCurrentStep}
                    currentLoop={synthCurrentLoop}
                  />
                  
                  <div className="mt-4 pt-4 border-t border-pip-boy-green/20">
                    <PlaybackControls
                      isPlaying={isPlaying}
                      onPlay={resume}
                      onPause={pause}
                      onStop={handleStop}
                      onNext={next}
                      onPrevious={previous}
                      onToggleShuffle={toggleShuffle}
                      onToggleRepeat={cycleRepeatMode}
                      shuffleEnabled={shuffleEnabled}
                      repeatMode={repeatMode}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Visualizer + Volume Control */}
              <div className="flex flex-col gap-4 lg:overflow-y-auto">
                {/* Visualizer - 固定高度，不會太高 */}
                <div className="p-3 sm:p-4 bg-pip-boy-green/5 border border-pip-boy-green/30 rounded flex-shrink-0">
                  <h3 className="text-sm font-bold mb-3">音訊視覺化</h3>
                  <div className="h-48 sm:h-56">
                    <MusicVisualizer
                    isPlaying={isPlaying}
                    analyserNode={analyserNodeForViz} />

                  </div>
                </div>

                {/* Volume Control - 移到右側 */}
                <div className="p-3 sm:p-4 bg-pip-boy-green/5 border border-pip-boy-green/30 rounded flex-shrink-0">
                  <h3 className="text-sm font-bold mb-3">音量控制</h3>
                  <VolumeControl />
                </div>
              </div>
            </div>
          </motion.div>)
        }
      </DrawerContent>

      {/* Shortcut Help Modal */}
      <ShortcutHelp
        open={showHelp}
        onClose={() => setShowHelp(false)}
        shortcuts={shortcuts} />


      {/* Playlist Sheet */}
      <PlaylistSheet />
    </Drawer>);

}