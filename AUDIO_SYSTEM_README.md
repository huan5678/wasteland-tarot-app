# 🎵 Wasteland Tarot 音訊系統

完整的 Web Audio 系統實作，提供沉浸式 Fallout 主題音效體驗。

## 📋 功能概覽

### ✅ 已實作核心功能

#### 1. 音效播放系統
- Singleton AudioEngine 核心引擎
- LRU 快取和記憶體管理 (<50MB)
- 並發播放限制 (桌面 8 個，行動 4 個)
- 自動播放政策處理
- iOS Safari 特殊優化

#### 2. 語音合成 (TTS)
- Web Speech API 整合
- 角色語音配置 (Pip-Boy, Mr. Handy, Brotherhood Scribe 等)
- 即時進度追蹤
- 播放控制 (播放/暫停/停止)

#### 3. 背景音樂管理
- 場景音樂自動切換
- 2 秒 crossfade 淡入淡出
- 無縫循環播放
- 音量獨立控制

#### 4. 音訊效果處理
- Reverb (迴響) - Vault 場景
- 8-bit 降採樣 - 經典模式
- Radio 無線電效果 - 角色語音
- Distortion 失真 - 終端機音效

#### 5. 狀態管理
- Zustand Store 整合
- localStorage 音量持久化
- 響應式狀態更新

#### 6. React Hooks 層
- `useAudioEffect` - 簡化音效播放
- `useTextToSpeech` - TTS 控制
- `useBackgroundMusic` - 自動場景音樂
- `useAudioInitialization` - 一鍵初始化

## 🚀 快速開始

### 安裝
```bash
# 已安裝 Zustand
bun add zustand
```

### 基本使用

#### 初始化音訊系統
```typescript
// app/layout.tsx
import { useAudioInitialization } from '@/hooks/audio/useAudioInitialization';

export default function RootLayout({ children }) {
  const { isInitialized } = useAudioInitialization();

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

#### 播放音效
```typescript
import { useAudioEffect } from '@/hooks/audio/useAudioEffect';

function MyButton() {
  const { playSound } = useAudioEffect();

  return (
    <button onClick={() => playSound('button-click')}>
      Click Me
    </button>
  );
}
```

#### 使用音效觸發包裝
```typescript
import { SoundEffectTrigger } from '@/components/audio/SoundEffectTrigger';

function CardButton() {
  return (
    <SoundEffectTrigger soundId="card-flip" trigger="click">
      <button>翻牌</button>
    </SoundEffectTrigger>
  );
}
```

#### 語音合成
```typescript
import { useTextToSpeech } from '@/hooks/audio/useTextToSpeech';

function ReadingCard({ interpretation }) {
  const { speak, stop, isSpeaking } = useTextToSpeech();

  return (
    <button onClick={() => isSpeaking ? stop() : speak(interpretation)}>
      {isSpeaking ? '停止' : '朗讀'}
    </button>
  );
}
```

#### 音量控制
```typescript
import { AudioControls } from '@/components/audio/AudioControls';

function SettingsPage() {
  return (
    <>
      <AudioControls type="sfx" label="音效" />
      <AudioControls type="music" label="音樂" />
      <AudioControls type="voice" label="語音" />
    </>
  );
}
```

## 📁 專案結構

```
src/lib/audio/
├── AudioEngine.ts          # 核心音效引擎
├── SpeechEngine.ts         # 語音合成引擎
├── MusicManager.ts         # 背景音樂管理
├── VolumeController.ts     # 音量控制
├── EffectsProcessor.ts     # 音訊效果處理
├── AudioErrorHandler.ts    # 錯誤處理
├── manifest.ts             # 音訊清單載入
├── audioStore.ts           # Zustand 狀態
├── types.ts                # TypeScript 類型
├── constants.ts            # 常數定義
└── index.ts                # 公開 API

src/hooks/audio/
├── useAudioEffect.ts
├── useTextToSpeech.ts
├── useBackgroundMusic.ts
└── useAudioInitialization.ts

src/components/audio/
├── AudioControls.tsx
└── SoundEffectTrigger.tsx

public/sounds/
├── manifest.json           # 音效清單
├── sfx/                    # 音效檔案
└── music/                  # 音樂檔案
```

## 🔊 音效清單配置

編輯 `public/sounds/manifest.json`:

```json
{
  "version": "1.0.0",
  "sounds": [
    {
      "id": "button-click",
      "type": "sfx",
      "url": "/sounds/sfx/button-click.mp3",
      "priority": "critical",
      "size": 15360
    }
  ],
  "music": [
    {
      "id": "wasteland-ambient",
      "url": "/sounds/music/wasteland-ambient.mp3",
      "scene": "home",
      "size": 2048000
    }
  ]
}
```

## ⚙️ 進階配置

### 角色語音自訂
```typescript
import { SpeechEngine } from '@/lib/audio';

const speechEngine = SpeechEngine.getInstance();

speechEngine.setVoiceConfig('mr_handy', {
  pitch: 1.8,
  rate: 1.3,
  volume: 1.0,
  effects: ['radio', 'distortion'],
});
```

### 音訊效果套用
```typescript
import { useAudioEffect } from '@/hooks/audio/useAudioEffect';

const { playSound } = useAudioEffect();

// 套用 reverb 效果
playSound('vault-door', {
  effectsChain: ['reverb'],
  volume: 0.8,
});
```

### 場景音樂映射
```typescript
// lib/audio/constants.ts
export const SCENE_MUSIC_MAP = {
  '/': 'wasteland-ambient',
  '/readings/new': 'divination-theme',
  '/dashboard': 'vault-theme',
};
```

## 🎯 效能優化

### 記憶體管理
- 自動 LRU 快取清除（超過 50MB）
- 關鍵音效永不清除
- 閒置 5 分鐘釋放快取

### 行動裝置優化
- 自動偵測行動裝置
- 降低並發播放數（4 個）
- 電池低於 20% 降低音樂音量
- iOS 特殊解鎖邏輯

### 預載策略
- 關鍵音效優先載入
- 非關鍵音效延遲載入（requestIdleCallback）
- 並發載入限制（3 個）

## 🧪 測試 (待實作)

```bash
# 單元測試
bun test src/lib/audio/__tests__

# 整合測試
bun test:integration

# E2E 測試
bun test:e2e

# 無障礙測試
bun test:a11y
```

## 🐛 錯誤處理

### 瀏覽器不支援
```typescript
// 自動降級至 HTML5 Audio
// 或顯示友善錯誤訊息
```

### 音效載入失敗
```typescript
// 自動重試最多 3 次
// 失敗後跳過該音效
```

### 錯誤率監控
```typescript
// 錯誤率超過 30% 自動停用音效系統
```

## 📊 已完成任務統計

- ✅ **28/75** 任務完成 (37%)
- ✅ **100%** 核心引擎實作
- ✅ **100%** 狀態管理實作
- ✅ **100%** Hooks 層實作
- 🟡 **40%** UI 組件實作
- 🔴 **0%** 測試覆蓋率

## 🚧 待完成任務

### 高優先級
1. 實作剩餘 UI 組件 (VoiceSelector, SpeechControls, AudioVisualizer, AudioSettings)
2. 建立測試套件 (單元、整合、E2E)
3. 整合至主應用程式 Layout
4. 準備實際音效資源檔案

### 中優先級
5. 行動裝置優化實作
6. 無障礙功能完善
7. 效能調校和優化
8. 跨瀏覽器相容性測試

### 低優先級
9. 文件和註解完善
10. 進階功能擴展

## 📝 需求映射

| 需求類別 | EARS 需求 | 實作狀態 |
|---------|----------|---------|
| 音效播放 | 1.1-1.7 | ✅ 完成 |
| 語音合成 | 2.1-2.7 | ✅ 完成 |
| 背景音樂 | 3.1-3.6 | ✅ 完成 |
| 音量控制 | 4.1-4.7 | ✅ 完成 |
| 快取管理 | 5.1-5.6 | ✅ 完成 |
| 行動優化 | 6.1-6.6 | 🟡 部分 |
| 音訊效果 | 7.1-7.6 | ✅ 完成 |
| 錯誤處理 | 8.1-8.6 | ✅ 完成 |
| 效能管理 | 9.1-9.6 | ✅ 完成 |
| 無障礙 | 10.1-10.6 | 🟡 部分 |

## 🤝 貢獻指南

### 添加新音效
1. 將音效檔案放入 `public/sounds/sfx/`
2. 更新 `manifest.json`
3. 在組件中使用 `playSound('your-sound-id')`

### 添加新角色語音
1. 在 `constants.ts` 的 `DEFAULT_VOICE_CONFIGS` 添加配置
2. 在 `types.ts` 的 `CharacterVoice` 添加類型
3. 使用 `setSelectedVoice('your-character')`

## 📄 授權

與主專案相同授權。

---

**版本**: 1.0.0
**最後更新**: 2025-10-01
**狀態**: 核心功能完成，待整合測試
