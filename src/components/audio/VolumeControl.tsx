'use client';

/**
 * VolumeControl - 音量控制組件
 * 使用 shadcn/ui Popover 和 Slider 組件
 * 符合 Fallout Pip-Boy 風格
 */

import React, { useState } from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { useAudioStore } from '@/lib/audio/audioStore';import { Button } from "@/components/ui/button";

export function VolumeControl() {
  const { volumes, muted, setVolume, toggleMute } = useAudioStore();
  const [isOpen, setIsOpen] = useState(false);

  // 計算主音量（平均值）
  const masterVolume = Math.round((volumes.sfx + volumes.music + volumes.voice) / 3 * 100);
  const isMuted = muted.sfx && muted.music && muted.voice;

  // 根據音量選擇圖示名稱
  const volumeIconName = isMuted ?
  'volume-x' :
  masterVolume < 50 ?
  'volume-1' :
  'volume-2';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="outline"
        className="relative p-2 rounded\n transition-all duration-200\n border"








        aria-label="音量控制">

          <PixelIcon name={volumeIconName as any} size={24} decorative />
          {isMuted &&
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="
          w-80 p-4
          bg-wasteland-darker border-2 border-pip-boy-green/50
          shadow-[0_0_20px_rgba(0,255,136,0.3)]
        "




        align="end"
        sideOffset={8}>

        <div className="space-y-4">
          {/* 標題 */}
          <div className="flex items-center justify-between pb-2 border-b border-pip-boy-green/30">
            <h3 className="text-sm font-bold text-pip-boy-green uppercase tracking-wider">
              音量控制
            </h3>
            <span className="text-xs text-pip-boy-green/70">
              VOL-CTRL v1.0
            </span>
          </div>

          {/* 主音量（靜音按鈕） */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-pip-boy-green uppercase">
                主音量
              </label>
              <Button size="icon" variant="outline"
              onClick={() => {
                toggleMute('sfx');
                toggleMute('music');
                toggleMute('voice');
              }}
              className="px-3 py-1 uppercase\n border rounded\n transition-all duration-200\n">







                {isMuted ? '取消靜音' : '靜音'}
              </Button>
            </div>
            <div className="text-xs text-pip-boy-green/70 text-right">
              {isMuted ? 'MUTED' : `${masterVolume}%`}
            </div>
          </div>

          {/* 音效音量 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-pip-boy-green uppercase">
                音效 (SFX)
              </label>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="link"
                onClick={() => toggleMute('sfx')}
                className="transition-colors"
                aria-label="切換音效靜音">

                  {muted.sfx ?
                  <PixelIcon name="volume-x" size={16} decorative /> :

                  <PixelIcon name="volume-2" size={16} decorative />
                  }
                </Button>
                <span className="text-xs text-pip-boy-green/70 w-10 text-right">
                  {muted.sfx ? 'OFF' : `${Math.round(volumes.sfx * 100)}%`}
                </span>
              </div>
            </div>
            <Slider
              value={[volumes.sfx * 100]}
              onValueChange={(value) => setVolume('sfx', value[0] / 100)}
              max={100}
              step={1}
              disabled={muted.sfx}
              className="pip-boy-slider" />

          </div>

          {/* 音樂音量 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-pip-boy-green uppercase">
                音樂 (MUSIC)
              </label>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="link"
                onClick={() => toggleMute('music')}
                className="transition-colors"
                aria-label="切換音樂靜音">

                  {muted.music ?
                  <PixelIcon name="volume-x" size={16} decorative /> :

                  <PixelIcon name="volume-2" size={16} decorative />
                  }
                </Button>
                <span className="text-xs text-pip-boy-green/70 w-10 text-right">
                  {muted.music ? 'OFF' : `${Math.round(volumes.music * 100)}%`}
                </span>
              </div>
            </div>
            <Slider
              value={[volumes.music * 100]}
              onValueChange={(value) => setVolume('music', value[0] / 100)}
              max={100}
              step={1}
              disabled={muted.music}
              className="pip-boy-slider" />

          </div>

          {/* 語音音量 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-pip-boy-green uppercase">
                語音 (VOICE)
              </label>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="link"
                onClick={() => toggleMute('voice')}
                className="transition-colors"
                aria-label="切換語音靜音">

                  {muted.voice ?
                  <PixelIcon name="volume-x" size={16} decorative /> :

                  <PixelIcon name="volume-2" size={16} decorative />
                  }
                </Button>
                <span className="text-xs text-pip-boy-green/70 w-10 text-right">
                  {muted.voice ? 'OFF' : `${Math.round(volumes.voice * 100)}%`}
                </span>
              </div>
            </div>
            <Slider
              value={[volumes.voice * 100]}
              onValueChange={(value) => setVolume('voice', value[0] / 100)}
              max={100}
              step={1}
              disabled={muted.voice}
              className="pip-boy-slider" />

          </div>

          {/* 底部資訊 */}
          <div className="pt-2 border-t border-pip-boy-green/30">
            <p className="text-xs text-pip-boy-green/50 text-center">
              VAULT-TEC AUDIO SYSTEM
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>);

}