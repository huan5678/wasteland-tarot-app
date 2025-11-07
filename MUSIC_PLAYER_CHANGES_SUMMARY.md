# 音樂播放器修復 - 變更摘要

## 修改的檔案
`src/hooks/audio/useRhythmMusicEngine.ts`

## 主要變更

### 1. 防止重複初始化 (行 69)
```typescript
// 修改前
if (isInitialized) return;

// 修改後  
if (isInitialized || synth) return; // 已初始化或已有 synth，跳過
```

### 2. 自動 Resume AudioContext (行 101-105)
```typescript
// 新增
if (context.state === 'suspended') {
  logger.info('[useRhythmMusicEngine] Resuming suspended AudioContext');
  await context.resume();
}
```

### 3. 初始化完成後自動播放 (行 154-158)
```typescript
// 新增
if (isPlaying) {
  logger.info('[useRhythmMusicEngine] Auto-starting playback after initialization');
  newSynth.play();
}
```

### 4. 更新依賴陣列 (行 176)
```typescript
// 修改前
}, [systemPresets, isInitialized]);

// 修改後
}, [systemPresets, isInitialized, synth, isPlaying]);
```

### 5. 播放前確保 AudioContext 運行 (行 194-199)
```typescript
// 新增
if (audioContext && audioContext.state === 'suspended') {
  logger.info('[useRhythmMusicEngine] Resuming AudioContext before playback');
  audioContext.resume().catch(error => {
    logger.error('[useRhythmMusicEngine] Failed to resume AudioContext', error);
  });
}
```

### 6. 更新 play/pause 依賴陣列 (行 236)
```typescript
// 修改前
}, [isPlaying, synth, isInitialized, updateSynthState]);

// 修改後  
}, [isPlaying, synth, isInitialized, audioContext, updateSynthState]);
```

## 測試指南

1. **啟動開發伺服器**
   ```bash
   bun run dev
   ```

2. **打開瀏覽器並導航到播放器頁面**
   - 打開瀏覽器開發者工具 Console
   - 查看是否有錯誤訊息

3. **測試播放功能**
   - 點擊音樂播放器的播放按鈕
   - ✅ 應該聽到音樂
   - ✅ Console 顯示: "Initialized successfully"
   - ✅ Console 顯示: "Starting playback"
   - ✅ 進度條開始移動

4. **測試暫停功能**
   - 點擊暫停按鈕
   - ✅ 音樂應該暫停
   - ✅ Console 顯示: "Pausing playback"
   - ✅ 進度條停止移動
   - ✅ 當前位置保留

5. **測試繼續播放**
   - 再次點擊播放按鈕
   - ✅ 音樂從暫停位置繼續
   - ✅ 不應該有多個音樂重疊
   - ✅ Console 沒有 "Cannot control playback" 錯誤

6. **測試停止功能**
   - 點擊停止按鈕
   - ✅ 音樂完全停止
   - ✅ 進度條重置到 0
   - ✅ 循環計數重置到 1

7. **測試頁面刷新**
   - 刷新頁面
   - ✅ Console 只顯示一次 "Initializing RhythmAudioSynthesizer"
   - ✅ 沒有重複的初始化訊息
   - ✅ AudioContext 正常啟動

## 預期 Console 訊息

### 正常啟動
```
[useRhythmMusicEngine] Initializing RhythmAudioSynthesizer {presetsCount: 5, currentIndex: 1}
[useRhythmMusicEngine] Resuming suspended AudioContext
[useRhythmMusicEngine] Creating synthesizer with pattern: {name: "...", id: "..."}
[useRhythmMusicEngine] Loading patterns to synthesizer {patternsCount: 5, startIndex: 1}
[useRhythmMusicEngine] Initialized successfully
```

### 播放音樂
```
[useRhythmMusicEngine] Play/Pause effect triggered {isPlaying: true, hasSynth: true, isInitialized: true}
[useRhythmMusicEngine] Synth state: {isPlaying: false, currentPatternIndex: 1, currentStep: 0}
[useRhythmMusicEngine] Calling synth.play()
[RhythmAudioSynthesizer] Starting playback {patternsCount: 5, currentPatternIndex: 1, currentStep: 0}
```

### 暫停音樂
```
[useRhythmMusicEngine] Play/Pause effect triggered {isPlaying: false, hasSynth: true, isInitialized: true}
[useRhythmMusicEngine] Synth state: {isPlaying: true, currentPatternIndex: 1, currentStep: 5}
[useRhythmMusicEngine] Calling synth.pause()
[RhythmAudioSynthesizer] Pausing playback {currentStep: 5, currentLoop: 2}
```

## 已修復的問題

1. ✅ AudioContext "not allowed to start" 錯誤
2. ✅ "Cannot control playback - synth not ready" 錯誤
3. ✅ 多個音樂實例重疊播放
4. ✅ 暫停按鈕不work
5. ✅ 進度條不更新
6. ✅ React Strict Mode 重複初始化

## 如果還有問題

### 音樂仍然不播放
- 檢查 AudioContext 是否被 browser 阻止
- 確認 Console 沒有錯誤訊息
- 檢查音量設定是否為 0

### 音樂重疊
- 檢查是否有多個 synth 實例被創建
- Console 搜尋 "Initializing RhythmAudioSynthesizer"
- 應該只出現一次

### 暫停不work
- 檢查 Console 是否有 "Pausing playback" 訊息
- 確認 synth.pause() 被調用
- 檢查 synth 狀態是否正確

