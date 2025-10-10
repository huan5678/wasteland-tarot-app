# 程序式鼓組系統使用範例

## 概述

本模組提供完整的程序式鼓組系統，使用 Web Audio API 即時合成鼓聲，無需載入任何音檔。

## 快速開始

### 1. 基本鼓聲觸發

```typescript
import { DrumKit } from '@/lib/audio/drums';

// 初始化 AudioContext
const audioContext = new AudioContext();

// 建立 DrumKit 實例
const drumKit = new DrumKit(audioContext, {
  masterVolume: 0.8,
  synthwaveMode: false,
  lofiMode: false,
});

// 觸發 Kick Drum
drumKit.triggerKick();

// 觸發 Snare Drum
drumKit.triggerSnare();

// 觸發 Hi-hat
drumKit.triggerHiHat();

// 或使用統一介面
drumKit.trigger('kick');
drumKit.trigger('snare');
drumKit.trigger('hihat');
```

### 2. 自訂音色預設

```typescript
import { KickDrum, SnareDrum, HiHat } from '@/lib/audio/drums';

const audioContext = new AudioContext();

// Kick Drum 音色預設
const kick = new KickDrum(audioContext);
kick.trigger({ preset: '808' });        // 808 風格
kick.trigger({ preset: 'deep' });       // 深沉 Kick
kick.trigger({ preset: 'punchy' });     // 打擊感 Kick
kick.trigger({ preset: 'lofi' });       // Lofi 風格

// Snare Drum 音色預設
const snare = new SnareDrum(audioContext);
snare.trigger({ preset: 'tight' });     // 緊實 Snare
snare.trigger({ preset: 'fat' });       // 厚實 Snare
snare.trigger({ preset: 'clap' });      // Clap 聲
snare.trigger({ preset: 'lofi' });      // Lofi Snare

// Hi-hat 音色預設
const hihat = new HiHat(audioContext);
hihat.trigger({ preset: 'metallic' });  // 金屬質感
hihat.trigger({ preset: 'crisp' });     // 清脆
hihat.trigger({ preset: 'closed' });    // Closed Hi-hat
hihat.trigger({ preset: 'open' });      // Open Hi-hat
```

### 3. 進階參數調整

```typescript
// 自訂 Kick Drum 參數
drumKit.triggerKick({
  baseFreq: 55,        // 基礎頻率 (50-80Hz)
  pitchStart: 150,     // Pitch Envelope 起始頻率
  pitchDecay: 60,      // Pitch Envelope 衰減時間 (ms)
  attack: 5,           // Attack 時間 (ms)
  decay: 180,          // Decay 時間 (ms)
  addNoiseBurst: true, // 加入 Noise Burst
  volume: 1.0,         // 音量 (0-1)
});

// 自訂 Snare Drum 參數
drumKit.triggerSnare({
  toneFreq: 250,       // 音調頻率 (200-300Hz)
  toneType: 'square',  // 音調波形 ('triangle' | 'square')
  noiseFilter: 2500,   // 噪音濾波器截止頻率
  attack: 5,           // Attack 時間 (ms)
  decay: 120,          // Decay 時間 (ms)
  noiseMix: 0.5,       // 噪音混合比例 (0-1)
  volume: 1.0,
});

// 自訂 Hi-hat 參數
drumKit.triggerHiHat({
  type: 'closed',      // 'closed' | 'open'
  centerFreq: 9000,    // Bandpass 中心頻率 (6-12kHz)
  highpassFreq: 6000,  // Highpass 截止頻率 (5-8kHz)
  Q: 1.5,              // Bandpass Q 值
  attack: 2,           // Attack 時間 (ms)
  decay: 70,           // Decay 時間 (ms)
  volume: 0.9,
});
```

## 節奏模式引擎

### 1. 基本節奏播放

```typescript
import { DrumKit, DrumPatternEngine } from '@/lib/audio/drums';

const audioContext = new AudioContext();
const drumKit = new DrumKit(audioContext);

// 建立節奏引擎
const patternEngine = new DrumPatternEngine(audioContext, drumKit, {
  pattern: 'basic_lofi',  // 預設節奏模式
  bpm: 85,                // BPM
  swing: 0,               // Swing 百分比 (0-20)
  velocityVariation: 0.1, // 力度變化範圍 (0-0.2)
});

// 開始播放
patternEngine.start();

// 停止播放
patternEngine.stop();
```

### 2. 切換節奏模式

```typescript
// 可用的節奏模式
const patterns = patternEngine.getAvailablePatterns();
console.log(patterns); // ['basic_lofi', 'synthwave_groove', 'downtempo', 'divination']

// 切換至 Synthwave Groove
patternEngine.setPattern('synthwave_groove');

// 切換至占卜模式（簡化節奏，慢速 BPM）
patternEngine.setPattern('divination');

// 獲取模式資訊
const info = patternEngine.getPatternInfo('basic_lofi');
console.log(info.description); // "Basic Lofi - Kick on 1,3, Snare on 2,4, Hi-hat offbeat"
console.log(info.defaultBPM);  // 85
```

### 3. 動態調整參數

```typescript
// 調整 BPM
patternEngine.setBPM(110);  // 設定為 110 BPM

// 調整 Swing
patternEngine.setSwing(15); // 15% Swing
```

## 音訊效果模式

### 1. Synthwave 模式

```typescript
const drumKit = new DrumKit(audioContext, {
  synthwaveMode: true,  // 啟用 Synthwave 效果
});

// Synthwave 模式會在 Snare 上套用 Gated Reverb
drumKit.triggerSnare();
```

### 2. Lofi 模式

```typescript
const drumKit = new DrumKit(audioContext, {
  lofiMode: true,  // 啟用 Lofi 效果
});

// Lofi 模式會：
// - 降低鼓組音量 -3 to -6dB
// - 增加 Tape Saturation（未來實作）
drumKit.triggerKick();
```

### 3. 動態切換模式

```typescript
// 啟用 Synthwave 模式
drumKit.setSynthwaveMode(true);

// 啟用 Lofi 模式
drumKit.setLofiMode(true);

// 同時啟用兩種模式
drumKit.setSynthwaveMode(true);
drumKit.setLofiMode(true);
```

## 完整範例：互動式鼓機

```typescript
import { DrumKit, DrumPatternEngine } from '@/lib/audio/drums';

// 初始化
const audioContext = new AudioContext();
const drumKit = new DrumKit(audioContext, {
  masterVolume: 0.8,
  synthwaveMode: true,
  lofiMode: true,
});

const patternEngine = new DrumPatternEngine(audioContext, drumKit, {
  pattern: 'synthwave_groove',
  bpm: 110,
  swing: 10,
  velocityVariation: 0.15,
});

// 鍵盤觸發鼓聲
document.addEventListener('keydown', (e) => {
  switch (e.key.toLowerCase()) {
    case 'k':
      drumKit.triggerKick({}, undefined, 1.0);
      break;
    case 's':
      drumKit.triggerSnare({}, undefined, 0.9);
      break;
    case 'h':
      drumKit.triggerHiHat({}, undefined, 0.7);
      break;
    case ' ':
      // 空白鍵：開始/停止節奏
      if (patternEngine.isPlaying) {
        patternEngine.stop();
      } else {
        patternEngine.start();
      }
      break;
  }
});

// BPM 控制滑桿
const bpmSlider = document.getElementById('bpm-slider') as HTMLInputElement;
bpmSlider.addEventListener('input', (e) => {
  const bpm = parseInt((e.target as HTMLInputElement).value);
  patternEngine.setBPM(bpm);
});

// 模式切換
const patternSelect = document.getElementById('pattern-select') as HTMLSelectElement;
patternSelect.addEventListener('change', (e) => {
  const pattern = (e.target as HTMLSelectElement).value as PatternName;
  patternEngine.setPattern(pattern);
});
```

## React Hook 範例

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { DrumKit, DrumPatternEngine, type PatternName } from '@/lib/audio/drums';

export function useDrumMachine() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const drumKitRef = useRef<DrumKit | null>(null);
  const patternEngineRef = useRef<DrumPatternEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // 初始化 AudioContext
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      drumKitRef.current = new DrumKit(audioContextRef.current, {
        masterVolume: 0.8,
        synthwaveMode: true,
        lofiMode: false,
      });
      patternEngineRef.current = new DrumPatternEngine(
        audioContextRef.current,
        drumKitRef.current,
        {
          pattern: 'basic_lofi',
          bpm: 85,
        }
      );
      setIsInitialized(true);
    }

    // Cleanup
    return () => {
      patternEngineRef.current?.dispose();
      drumKitRef.current?.dispose();
    };
  }, []);

  const play = () => {
    patternEngineRef.current?.start();
    setIsPlaying(true);
  };

  const stop = () => {
    patternEngineRef.current?.stop();
    setIsPlaying(false);
  };

  const triggerKick = () => {
    drumKitRef.current?.triggerKick();
  };

  const triggerSnare = () => {
    drumKitRef.current?.triggerSnare();
  };

  const triggerHiHat = () => {
    drumKitRef.current?.triggerHiHat();
  };

  const setPattern = (pattern: PatternName) => {
    patternEngineRef.current?.setPattern(pattern);
  };

  const setBPM = (bpm: number) => {
    patternEngineRef.current?.setBPM(bpm);
  };

  return {
    isInitialized,
    isPlaying,
    play,
    stop,
    triggerKick,
    triggerSnare,
    triggerHiHat,
    setPattern,
    setBPM,
  };
}
```

## 效能建議

1. **重用 DrumKit 實例**：建立一個全域 DrumKit 實例並重用，避免重複建立 AudioContext
2. **精準時序**：DrumPatternEngine 使用 Web Audio Clock 排程，確保鼓聲觸發延遲 <10ms
3. **記憶體管理**：NoiseGenerator 生成的緩衝區會被自動回收，無需手動管理
4. **行動裝置優化**：在首次使用者互動時初始化 AudioContext

## 已知限制

1. **Gated Reverb**：目前 Synthwave 模式的 Gated Reverb 效果尚未實作，待 EffectsProcessor 提供
2. **Tape Saturation**：Lofi 模式的 Tape Saturation 效果尚未實作，待 EffectsProcessor 提供
3. **拍號支援**：DrumPatternEngine 當前僅支援 4/4 拍，3/4 和 6/8 拍號為未來擴展

## 技術參考

- **Kick Drum**：低頻正弦波 (50-80Hz) + Pitch Envelope (150Hz → 50-60Hz)
- **Snare Drum**：白噪音 (Highpass 200Hz) + 音調 (200-300Hz Triangle/Square Wave)
- **Hi-hat**：高頻噪音 (6-12kHz Bandpass) + Highpass Filter (5-8kHz)
- **Velocity Variation**：±10-20% 力度變化增加人性化
- **Swing**：延遲奇數拍 10-20% 營造 Shuffle 感覺

## 參考文件

- **Requirements**: `.kiro/specs/web-audio-system/requirements.md` 需求 11
- **Design**: `.kiro/specs/web-audio-system/design.md` 附錄 C, D
- **Tasks**: `.kiro/specs/web-audio-system/tasks.md` Tasks 76-80
