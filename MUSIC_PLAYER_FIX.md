# 音樂播放器問題修復

## 問題描述
1. 播放音樂時沒有正確播放音樂，但進度條有正確進行
2. 按下暫停後音樂沒有暫停但按鈕有變狀態
3. 再度按下播放就又有新的音樂在播，造成音樂重疊
4. Console 錯誤: "AudioContext was not allowed to start"
5. Console 錯誤: "Cannot control playback - synth not ready"

## 根本原因

### 1. React Strict Mode 重複渲染
- 在開發模式下，React Strict Mode 會觸發兩次 mount
- 導致 `useRhythmMusicEngine` 被調用兩次
- 創建多個 `RhythmAudioSynthesizer` 實例

### 2. AudioContext Suspension
- Browser 安全策略：AudioContext 需要在用戶互動後才能啟動
- AudioContext 處於 'suspended' 狀態時無法播放音樂

### 3. 非同步初始化問題
- `RhythmAudioSynthesizer` 初始化是非同步的
- 用戶可能在初始化完成前按下播放按鈕
- 導致 "Cannot control playback - synth not ready" 錯誤

### 4. 狀態不同步
- Synth 狀態沒有正確同步到 UI
- 導致按鈕狀態與實際播放狀態不一致

## 修復方案

### 修改檔案: `src/hooks/audio/useRhythmMusicEngine.ts`

#### 1. 防止重複初始化
```typescript
// 添加 synth 到依賴陣列，防止重複初始化
useEffect(() => {
  if (typeof window === 'undefined') return;
  if (isInitialized || synth) return; // 已初始化或已有 synth，跳過
  // ...
}, [systemPresets, isInitialized, synth, isPlaying]);
```

#### 2. 自動 Resume AudioContext
```typescript
// Resume AudioContext if suspended
if (context.state === 'suspended') {
  logger.info('[useRhythmMusicEngine] Resuming suspended AudioContext');
  await context.resume();
}
```

#### 3. 初始化完成後自動播放
```typescript
setSynth(newSynth);
setInitialized(true);

logger.info('[useRhythmMusicEngine] Initialized successfully');

// 如果用戶在初始化過程中點擊了播放，現在開始播放
if (isPlaying) {
  logger.info('[useRhythmMusicEngine] Auto-starting playback after initialization');
  newSynth.play();
}
```

#### 4. 播放前確保 AudioContext 運行
```typescript
// 確保 AudioContext 是 running 狀態
if (audioContext && audioContext.state === 'suspended') {
  logger.info('[useRhythmMusicEngine] Resuming AudioContext before playback');
  audioContext.resume().catch(error => {
    logger.error('[useRhythmMusicEngine] Failed to resume AudioContext', error);
  });
}
```

#### 5. 簡化 Cleanup 邏輯
```typescript
return () => {
  isCancelled = true; // Mark as cancelled
  logger.event('[useRhythmMusicEngine] Cleanup triggered - component unmount');
};
```

## 預期結果

修復後應該：
1. ✅ 音樂能正常播放
2. ✅ 暫停按鈕能正確暫停音樂（保留播放位置）
3. ✅ 停止按鈕能正確停止音樂（重置到開頭）
4. ✅ 不會有多個音樂實例同時播放
5. ✅ 進度條能正確更新
6. ✅ AudioContext 能正常啟動

## 測試步驟

1. 打開音樂播放器
2. 點擊播放按鈕
   - 應該聽到音樂
   - 進度條開始移動
3. 點擊暫停按鈕
   - 音樂應該暫停
   - 進度條停止移動
   - 位置保留
4. 再次點擊播放按鈕
   - 音樂從暫停位置繼續播放
   - 不應該有重疊音樂
5. 點擊停止按鈕
   - 音樂完全停止
   - 進度條重置到開頭
6. 刷新頁面後測試
   - 應該只有一個 synth 實例
   - Console 沒有重複的初始化訊息

## 相關檔案

- `src/hooks/audio/useRhythmMusicEngine.ts` - 主要修改檔案
- `src/stores/rhythmEngineStore.ts` - Synth 狀態管理
- `src/components/music-player/MusicPlayerDrawer.tsx` - 播放器 UI
- `src/components/music-player/PlaybackControls.tsx` - 播放控制
- `src/components/music-player/RhythmProgressBar.tsx` - 進度條顯示

## 注意事項

1. **AudioContext 限制**: Browser 要求 AudioContext 必須在用戶互動後才能啟動
2. **React Strict Mode**: 開發模式會觸發雙重渲染，需要正確處理 cleanup
3. **非同步初始化**: 確保在初始化完成前不會嘗試播放
4. **狀態同步**: 使用 Zustand store 確保狀態在所有元件間同步

## 後續改進建議

1. 添加錯誤處理 UI，顯示初始化失敗訊息
2. 添加載入狀態指示器
3. 考慮使用 Web Worker 處理音訊合成
4. 添加單元測試確保播放控制邏輯正確
5. 考慮使用 React Context 替代 Zustand (如果不需要跨頁面狀態持久化)
