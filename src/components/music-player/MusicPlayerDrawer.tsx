/**
 * MusicPlayerDrawer - 主播放器 Drawer 容器
 * Task 9, 10, 16: 建立基礎包裝元件並整合所有子元件
 * Requirements 5.1, 5.2, 5.3, 7.1, 7.2, 7.3
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { usePlaylistManager } from '@/hooks/useMusicPlayer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useMusicEngine } from '@/hooks/audio/useMusicEngine';
import { PixelIcon } from '@/components/ui/icons';

// Import all child components (will be created in following tasks)
import { PlaybackControls } from './PlaybackControls';
import { MusicModeSelector } from './MusicModeSelector';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';
import { MusicVisualizer } from './MusicVisualizer';
import { ShortcutHelp } from './ShortcutHelp';
import { PlaylistSheet } from './PlaylistSheet';

/**
 * Drawer 高度狀態
 * Requirements 5.2: 三種高度模式
 */
type DrawerHeightState = 'minimized' | 'normal' | 'expanded';

const DRAWER_HEIGHTS = {
  minimized: '80px',
  normal: '60%',
  expanded: '90%',
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
    next,
    previous,
    toggleShuffle,
    cycleRepeatMode,
    openDrawer,
    closeDrawer,
    minimizeDrawer,
    expandDrawer,
    openSheet,
  } = useMusicPlayer();

  const { currentPlaylist } = usePlaylistManager();

  // ========== Music Engine Integration ==========
  // Task: 整合 ProceduralMusicEngine 實際播放音樂
  const { engine, isReady } = useMusicEngine();

  // ========== Keyboard Shortcuts ==========
  const { showHelp, setShowHelp, shortcuts } = useKeyboardShortcuts({
    enabled: true,
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
    },
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

  return (
    <Drawer open={isDrawerOpen} onOpenChange={handleOpenChange}>
      {/* Floating Trigger Button - Fixed at bottom right */}
      <DrawerTrigger asChild>
        <button
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-pip-boy-green text-black rounded-full border-2 border-pip-boy-green-dark shadow-[0_0_20px_rgba(0,255,136,0.5)] hover:shadow-[0_0_30px_rgba(0,255,136,0.7)] transition-all focus:outline-none focus:ring-2 focus:ring-pip-boy-green focus:ring-offset-2 focus:ring-offset-black"
          aria-label="開啟音樂播放器"
        >
          <PixelIcon name="music" sizePreset="sm" animation={isPlaying ? 'pulse' : undefined} aria-label="音樂" />
          {isPlaying && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-pip-boy-green"
              animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </button>
      </DrawerTrigger>

      {/* Drawer Content */}
      <DrawerContent
        ref={drawerContentRef}
        className="border-2 border-pip-boy-green bg-wasteland-darker text-pip-boy-green"
        style={{
          height: isDrawerMinimized ? DRAWER_HEIGHTS.minimized : DRAWER_HEIGHTS[drawerHeight],
        }}
        aria-label="音樂播放器"
        aria-live="polite"
        aria-atomic="false"
        role="region"
      >
        {/* Visually Hidden Title & Description for Accessibility */}
        <DrawerTitle className="sr-only">音樂播放器</DrawerTitle>
        <DrawerDescription className="sr-only">
          控制音樂播放、選擇音樂模式、調整音量和查看音訊視覺化
        </DrawerDescription>

        {/* Minimized Mode (80px) */}
        {isDrawerMinimized ? (
          <motion.div
            className="flex items-center justify-between px-6 h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
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
            <button
              onClick={handlePlayPause}
              className="p-2 text-pip-boy-green bg-pip-boy-green/10 border border-pip-boy-green rounded hover:bg-pip-boy-green hover:text-black transition-colors"
              aria-label={isPlaying ? '暫停' : '播放'}
            >
              {isPlaying ? <PixelIcon name="pause" sizePreset="sm" aria-label="暫停" /> : <PixelIcon name="play" sizePreset="sm" aria-label="播放" />}
            </button>

            {/* Expand Button */}
            <button
              onClick={handleExpand}
              className="p-2 text-pip-boy-green bg-pip-boy-green/10 border border-pip-boy-green rounded hover:bg-pip-boy-green hover:text-black transition-colors"
              aria-label="展開播放器"
            >
              <PixelIcon name="maximize-2" sizePreset="sm" aria-label="展開" />
            </button>
          </motion.div>
        ) : (
          /* Normal/Expanded Mode */
          <motion.div
            className="flex flex-col h-full p-4 sm:p-6 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center flex-shrink-0">
              <div className="w-12 h-1 bg-pip-boy-green/50 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold">音樂播放器</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleMinimize}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-pip-boy-green bg-pip-boy-green/10 border border-pip-boy-green rounded hover:bg-pip-boy-green hover:text-black transition-colors"
                  aria-label="最小化播放器"
                >
                  <PixelIcon name="minimize-2" sizePreset="xs" aria-label="最小化" />
                </button>
                <button
                  onClick={openSheet}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-pip-boy-green bg-pip-boy-green/10 border border-pip-boy-green rounded hover:bg-pip-boy-green hover:text-black transition-colors"
                  aria-label="開啟播放清單"
                >
                  <PixelIcon name="playlist" sizePreset="xs" aria-label="播放清單" />
                </button>
              </div>
            </div>

            {/* Responsive Layout - 移除 overflow-y-auto 以防止拖動音量時頁面跳轉 */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4 min-h-0">
              {/* Left Column: Controls - 可以獨立捲動 */}
              <div className="flex flex-col gap-4 overflow-y-auto pr-2 min-w-0">
                {/* Music Mode Selector */}
                <div className="p-3 sm:p-4 bg-pip-boy-green/5 border border-pip-boy-green/30 rounded flex-shrink-0">
                  <h3 className="text-sm font-bold mb-3">音樂模式</h3>
                  <MusicModeSelector
                    currentMode={currentMode}
                    onModeSelect={playMode}
                  />
                </div>

                {/* Playback Controls */}
                <div className="p-3 sm:p-4 bg-pip-boy-green/5 border border-pip-boy-green/30 rounded flex-shrink-0">
                  <PlaybackControls
                    isPlaying={isPlaying}
                    onPlay={resume}
                    onPause={pause}
                    onNext={next}
                    onPrevious={previous}
                    onToggleShuffle={toggleShuffle}
                    onToggleRepeat={cycleRepeatMode}
                    shuffleEnabled={shuffleEnabled}
                    repeatMode={repeatMode}
                  />
                </div>

                {/* Progress Bar */}
                <div className="p-3 sm:p-4 bg-pip-boy-green/5 border border-pip-boy-green/30 rounded flex-shrink-0">
                  <h3 className="text-sm font-bold mb-3">播放進度</h3>
                  <ProgressBar isPlaying={isPlaying} />
                </div>
              </div>

              {/* Right Column: Visualizer + Volume Control */}
              <div className="flex flex-col gap-4 lg:overflow-y-auto">
                {/* Visualizer - 固定高度，不會太高 */}
                <div className="p-3 sm:p-4 bg-pip-boy-green/5 border border-pip-boy-green/30 rounded flex-shrink-0">
                  <h3 className="text-sm font-bold mb-3">音訊視覺化</h3>
                  <div className="h-48 sm:h-56">
                    <MusicVisualizer isPlaying={isPlaying} />
                  </div>
                </div>

                {/* Volume Control - 移到右側 */}
                <div className="p-3 sm:p-4 bg-pip-boy-green/5 border border-pip-boy-green/30 rounded flex-shrink-0">
                  <h3 className="text-sm font-bold mb-3">音量控制</h3>
                  <VolumeControl />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </DrawerContent>

      {/* Shortcut Help Modal */}
      <ShortcutHelp
        open={showHelp}
        onClose={() => setShowHelp(false)}
        shortcuts={shortcuts}
      />

      {/* Playlist Sheet */}
      <PlaylistSheet />
    </Drawer>
  );
}
