# Audio Library - Web Audio API 音訊合成系統

Part 3 實作完成：前端核心音訊系統（Frontend Audio Core）

## 概述

本音訊庫提供兩個獨立的 Web Audio API 音訊合成器：

1. **RhythmAudioSynthesizer** - 播放器專用音訊合成器
2. **EditorAudioSynthesizer** - 編輯器專用音訊合成器

兩個合成器使用獨立的 AudioContext，互不干擾。

## 功能特色

- 🎵 **5 種樂器音效合成**：Kick, Snare, HiHat, OpenHat, Clap
- 🔁 **16 步驟循環播放**：基於 16 分音符的節奏循環
- ⚡ **精準排程**：使用 Web Audio API 時間戳確保節奏穩定
- 🎛️ **速度調整**：支援 60-180 BPM 範圍
- 🔄 **自動切換**：每個 Pattern 循環 4 次後自動切換下一首
- 🎹 **即時預覽**：編輯器支援即時音效測試

## 安裝與使用

### 1. 匯入模組

```typescript
import {
  RhythmAudioSynthesizer,
  EditorAudioSynthesizer,
  type Pattern,
  type InstrumentType,
} from '@/lib/audio';
```

### 2. 定義 Pattern

```typescript
// 範例：Techno Pattern
const technoPattern: Pattern = {
  kick:    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
  snare:   [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
  hihat:   [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
  openhat: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
  clap:    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
};
```

### 3. 使用 RhythmAudioSynthesizer（播放器）

```typescript
// 初始化播放器合成器
const audioContext = new AudioContext();
const playerSynthesizer = new RhythmAudioSynthesizer({
  audioContext,
  patterns: [technoPattern, housePattern],
  tempo: 120,
  loopCount: 4, // 每個 Pattern 循環 4 次
});

// 設定 Pattern 完成回呼
playerSynthesizer.setOnPatternComplete(() => {
  console.log('Pattern 完成，已切換到下一首');
});

// 播放控制
playerSynthesizer.play();
playerSynthesizer.pause();
playerSynthesizer.stop();

// 切換 Pattern
playerSynthesizer.next();
playerSynthesizer.previous();

// 調整速度
playerSynthesizer.setTempo(140);

// 獲取當前狀態
const state = playerSynthesizer.getState();
console.log('當前步驟:', state.currentStep);
console.log('當前循環:', state.currentLoop);

// 釋放資源
playerSynthesizer.destroy();
```

### 4. 使用 EditorAudioSynthesizer（編輯器）

```typescript
// 初始化編輯器合成器（獨立 AudioContext）
const editorAudioContext = new AudioContext();
const editorSynthesizer = new EditorAudioSynthesizer({
  audioContext: editorAudioContext,
  tempo: 120,
});

// 播放單一樂器音效（點擊步驟格子時）
editorSynthesizer.playInstrument('kick');
editorSynthesizer.playInstrument('snare');
editorSynthesizer.playInstrument('hihat');

// 預覽完整 Pattern（16 步驟循環一次）
editorSynthesizer.previewPattern(technoPattern);

// 停止預覽
editorSynthesizer.stopPreview();

// 檢查預覽狀態
if (editorSynthesizer.isPreviewingPattern()) {
  console.log('正在預覽中...');
}

// 釋放資源
editorSynthesizer.destroy();
```

## API 文件

### RhythmAudioSynthesizer

#### 建構子

```typescript
constructor(config: RhythmAudioSynthesizerConfig)
```

**參數：**
- `audioContext: AudioContext` - Web Audio API AudioContext
- `patterns: Pattern[]` - 播放清單中的所有 Pattern
- `tempo: number` - BPM（預設 120）
- `loopCount: number` - 每個 Pattern 循環次數（預設 4）

#### 方法

| 方法 | 描述 |
|------|------|
| `play(): void` | 開始播放 |
| `pause(): void` | 暫停播放（保留位置） |
| `stop(): void` | 停止播放（重置到步驟 0） |
| `next(): void` | 下一個 Pattern |
| `previous(): void` | 上一個 Pattern |
| `setTempo(bpm: number): void` | 設定速度（60-180 BPM） |
| `setPatterns(patterns: Pattern[]): void` | 設定播放清單 |
| `loadPattern(pattern: Pattern): void` | 載入單一 Pattern |
| `setOnPatternComplete(callback: OnPatternCompleteCallback): void` | 設定 Pattern 完成回呼 |
| `getState(): RhythmAudioSynthesizerState` | 獲取當前狀態 |
| `destroy(): void` | 釋放資源 |

### EditorAudioSynthesizer

#### 建構子

```typescript
constructor(config: EditorAudioSynthesizerConfig)
```

**參數：**
- `audioContext: AudioContext` - Web Audio API AudioContext
- `tempo: number` - BPM（預設 120）

#### 方法

| 方法 | 描述 |
|------|------|
| `playInstrument(instrument: InstrumentType): void` | 播放單一樂器音效 |
| `previewPattern(pattern: Pattern): void` | 預覽完整 Pattern（16 步驟） |
| `stopPreview(): void` | 停止預覽 |
| `isPreviewingPattern(): boolean` | 檢查是否正在預覽 |
| `setTempo(bpm: number): void` | 設定速度（60-180 BPM） |
| `destroy(): void` | 釋放資源 |

#### InstrumentType

```typescript
type InstrumentType = 'kick' | 'snare' | 'hihat' | 'openhat' | 'clap';
```

## 音效合成參數

### Kick Drum
- 波形：Sine Wave
- 頻率：150 Hz → 0.01 Hz（exponential ramp 0.5s）
- 增益：1 → 0.01（exponential ramp 0.5s）

### Snare Drum
- 白噪音：highpass @ 1000 Hz，decay 0.2s
- Triangle Wave：180 Hz，decay 0.1s

### Hi-Hat
- Square Wave：10000 Hz
- Highpass Filter：7000 Hz
- 增益：0.3 → 0.01（decay 0.05s）

### Open Hi-Hat
- Square Wave：10000 Hz
- Highpass Filter：7000 Hz
- 增益：0.3 → 0.01（decay 0.3s）

### Clap
- 白噪音
- Bandpass Filter：1500 Hz
- 增益：1 → 0.01（decay 0.1s）

## 測試

執行測試：

```bash
bun test src/lib/audio/__tests__/RhythmAudioSynthesizer.test.ts
bun test src/lib/audio/__tests__/EditorAudioSynthesizer.test.ts
```

測試覆蓋：
- ✅ 5 種樂器音效播放
- ✅ Pattern 循環播放（4 次循環）
- ✅ 播放控制（播放/暫停/停止）
- ✅ Pattern 切換邏輯
- ✅ Tempo 調整
- ✅ 獨立 AudioContext（不干擾播放器）

## 設計文件

詳細設計文件請參考：
- **設計文件**: `.kiro/specs/playlist-music-player/design.md`（附錄 B: Web Audio API 音效合成參數）
- **任務計畫**: `.kiro/specs/playlist-music-player/tasks.md`（Part 3: 任務 3.1-3.5）

## 已完成任務

- [x] 3.1 實作 RhythmAudioSynthesizer 類別（播放器專用）
- [x] 3.2 實作 Pattern 播放邏輯（16 步驟循環）
- [x] 3.3 實作播放控制方法（play/pause/stop/setTempo）
- [x] 3.4 實作 EditorAudioSynthesizer 類別（編輯器專用）
- [x] 3.5 實作 Pattern 循環切換邏輯（4 次循環後切歌）
- [x] 3.6 建立測試檔案並執行測試驗證

## 授權

本專案使用 MIT 授權。

---

**版本**: 1.0.0
**建立日期**: 2025-10-13
**語言**: 繁體中文（zh-TW）
