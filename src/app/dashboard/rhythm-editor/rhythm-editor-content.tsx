'use client'

/**
 * Rhythm Editor Page - 節奏編輯器頁面
 * Task 7.1: 整合所有節奏編輯器組件
 * Requirements 20.1-20.8
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { PixelIcon } from '@/components/ui/icons';
import { RhythmGrid } from '@/components/music-player/RhythmGrid';
import { RhythmEditorControls } from '@/components/music-player/RhythmEditorControls';
import { PresetManager } from '@/components/music-player/PresetManager';
import { AIGenerationPanel } from '@/components/music-player/AIGenerationPanel';
import { SavePresetDialog } from '@/components/music-player/SavePresetDialog';

/**
 * RhythmEditorPage Component
 * 節奏編輯器頁面 - 僅註冊使用者可存取
 */
export function RhythmEditorContent() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user, isLoading } = useAuthStore();

  // ========== Route Protection ==========
  // 檢查使用者是否已登入，未登入則重導向至登入頁面
  useEffect(() => {
    // 等待 authStore 載入完成
    if (isLoading) return;

    // 如果沒有使用者，重導向到登入頁面
    if (!user) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-wasteland-dark text-pip-boy-green">
      {/* Page Header */}
      <div className="border-b-2 border-pip-boy-green bg-wasteland-darker">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <PixelIcon
              name="music"
              sizePreset="lg"
              variant="primary"
              decorative
            />
            <div>
              <h1 className="text-3xl font-bold text-glow-green">
                節奏編輯器
              </h1>
              <p className="text-sm text-pip-boy-green/60 mt-1">
                RHYTHM SEQUENCER - 建立你的音樂節奏
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 音序器與播放控制 */}
        <section
          className="bg-wasteland-darker border-2 border-pip-boy-green p-4 sm:p-6 space-y-6"
          aria-labelledby="sequencer-heading"
        >
          {/* 16 步驟音序器 */}
          <div>
            <h2
              id="sequencer-heading"
              className="text-xl font-bold mb-4 flex items-center gap-2"
            >
              <PixelIcon
                name="grid"
                sizePreset="sm"
                variant="primary"
                decorative
              />
              16 步驟音序器
            </h2>
            <RhythmGrid />
          </div>

          {/* 播放控制 */}
          <div>
            <h2
              id="controls-heading"
              className="text-xl font-bold mb-4 flex items-center gap-2"
            >
              <PixelIcon
                name="settings"
                sizePreset="sm"
                variant="primary"
                decorative
              />
              播放控制
            </h2>
            <RhythmEditorControls onOpenSaveDialog={() => setIsDialogOpen(true)} />
          </div>
        </section>

        {/* 響應式佈局：桌面 2 欄，手機單欄 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preset 管理 */}
          <section
            className="bg-wasteland-darker border-2 border-pip-boy-green p-4 sm:p-6"
            aria-labelledby="preset-heading"
          >
            <h2
              id="preset-heading"
              className="text-xl font-bold mb-4 flex items-center gap-2"
            >
              <PixelIcon
                name="bookmark"
                sizePreset="sm"
                variant="primary"
                decorative
              />
              Preset 管理
            </h2>
            <PresetManager />
          </section>

          {/* AI 生成面板 */}
          <section className="bg-wasteland-darker border-2 border-pip-boy-green p-4 sm:p-6">
            <AIGenerationPanel onOpenSaveDialog={() => setIsDialogOpen(true)} />
          </section>
        </div>

        {/* Help Section */}
        <section
          className="bg-wasteland-darker border-2 border-pip-boy-green p-4 sm:p-6"
          aria-labelledby="help-heading"
        >
          <h2
            id="help-heading"
            className="text-lg font-bold mb-3 flex items-center gap-2"
          >
            <PixelIcon
              name="help-circle"
              sizePreset="sm"
              variant="info"
              decorative
            />
            使用說明
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-pip-boy-green/80">
            <div className="flex items-start gap-2">
              <PixelIcon
                name="mouse"
                sizePreset="xs"
                variant="primary"
                decorative
              />
              <div>
                <strong className="text-pip-boy-green">點擊步驟格子</strong>
                <p className="text-xs text-pip-boy-green/60">
                  啟用/停用該步驟的音效
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <PixelIcon
                name="play"
                sizePreset="xs"
                variant="success"
                decorative
              />
              <div>
                <strong className="text-pip-boy-green">播放控制</strong>
                <p className="text-xs text-pip-boy-green/60">
                  播放/暫停/停止你的節奏
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <PixelIcon
                name="save"
                sizePreset="xs"
                variant="warning"
                decorative
              />
              <div>
                <strong className="text-pip-boy-green">儲存 Preset</strong>
                <p className="text-xs text-pip-boy-green/60">
                  將你的創作保存為 Preset
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Save Preset Dialog */}
      <SavePresetDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />

      {/* CRT Scanline Effect */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent via-pip-boy-green/5 to-transparent opacity-20" />
    </div>
  );
}
