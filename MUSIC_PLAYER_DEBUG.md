# 音樂播放器問題診斷與修復方案

## 當前狀態（2025-01-06）

### 已修復的問題 ✅
1. **Synth 無法初始化**
   - **原因**：初始化檢查 `if (isInitialized || synth)` 太嚴格
   - **修復**：改為 `if (isInitialized && synth)`，允許第一次初始化

2. **重複狀態輪詢**
   - **原因**：MusicPlayerDrawer 和 useRhythmMusicEngine 都在輪詢
   - **修復**：移除 MusicPlayerDrawer 中的輪詢，統一由 hook 處理

3. **React Strict Mode 導致重複銷毀/創建**
   - **原因**：unmount 時銷毀 synth，Strict Mode 會觸發兩次
   - **修復**：暫時註解掉 unmount 清理邏輯

4. **AudioContext suspended**
   - **原因**：瀏覽器政策要求用戶交互後才能播放
   - **修復**：在 play() 前先 resume AudioContext

---

## 仍需修復的問題 ⚠️

### 1. 暫停功能無效
**症狀**：按下暫停按鈕後，圖標變化但音樂繼續播放

**根本原因**：
```typescript
// src/stores/musicPlayerStore.ts:216-228
pause: () => {
  // 只設置狀態，沒有真正暫停 synth
  set({ isPlaying: false });
}
```

**解決方案**：
狀態管理流程應該是：
```
用戶按暫停 → musicPlayerStore.pause() 設置 isPlaying=false 
→ useRhythmMusicEngine 監聽 isPlaying 變化 → 調用 synth.pause()
```

目前流程已經正確，問題可能在於：
- synth.pause() 沒有真正暫停音頻
- 有多個 synth 實例在播放

### 2. 多重音樂重疊播放
**症狀**：按下播放後有多個音樂同時播放，按停止還有音樂繼續

**可能原因**：
1. **多個 synth 實例被創建**
   - React Strict Mode 會導致 component mount 兩次
   - useEffect cleanup 被註解掉，舊實例沒有清理
   
2. **synth.play() 被多次調用**
   - store 狀態更新觸發多次 re-render
   - useEffect dependency array 導致重複執行

3. **AudioContext 創建多個連接**
   - 每次初始化都創建新的 synth
   - 舊的 synth 仍然連接到 destination

**解決方案**：
A. **使用全域單例模式**（推薦）
```typescript
// 在 RhythmEngineStore 中確保單一實例
setSynth: (synth) => {
  const { synth: existingSynth } = get();
  
  // 如果已經有 synth，先清理
  if (existingSynth && existingSynth !== synth) {
    logger.warn('[RhythmEngineStore] Cleaning up existing synth before setting new one');
    existingSynth.stop();
    existingSynth.destroy();
  }
  
  set({ synth });
}
```

B. **添加初始化鎖**
```typescript
// 在 hook 中添加 ref 追蹤初始化狀態
const isInitializing = useRef(false);

const initSynth = async () => {
  if (isInitializing.current) {
    logger.warn('[useRhythmMusicEngine] Already initializing, skip');
    return;
  }
  
  isInitializing.current = true;
  try {
    // ... initialization code
  } finally {
    isInitializing.current = false;
  }
};
```

### 3. 進度條不更新
**症狀**：播放時進度條不動，只有暫停時會更新

**原因**：
輪詢已經實作，但可能有以下問題：
1. `isPlaying` 狀態不正確（synth 在播但 store 說沒播）
2. `updateSynthState()` 沒有觸發 re-render
3. RhythmProgressBar 沒有正確訂閱狀態

**Debug 方法**：
```typescript
// 在輪詢中添加 log
const intervalId = setInterval(() => {
  const state = synth.getState();
  console.log('[Polling]', state);
  updateSynthState();
}, 100);
```

---

## 推薦修復順序

### Phase 1: 確保單一 Synth 實例 （最優先）
1. 在 `RhythmEngineStore.setSynth()` 中添加舊實例清理
2. 在 `useRhythmMusicEngine` 添加初始化鎖
3. 測試：打開 music player，檢查 console 確認只初始化一次

### Phase 2: 修復播放控制
1. 添加 debug log 到 synth.play()/pause()/stop()
2. 確認 isPlaying 狀態同步
3. 測試：play → pause → play → stop

### Phase 3: 修復進度更新
1. 確認輪詢正在運行（添加 log）
2. 確認 RhythmProgressBar 正確訂閱 store
3. 測試：播放時進度條應該平滑移動

---

## 測試檢查表

```bash
# 測試 1：單一實例
□ 打開 music player drawer
□ Console 應該只看到一次 "Initializing RhythmAudioSynthesizer"
□ Console 不應該看到 "Cleaning up existing synth"

# 測試 2：播放控制
□ 按下播放 → 音樂開始播放
□ 按下暫停 → 音樂立即停止（不是重置）
□ 再按播放 → 音樂從暫停處繼續（不是重新開始）
□ 按下停止 → 音樂停止且進度歸零
□ 再按播放 → 音樂從頭開始

# 測試 3：進度顯示
□ 播放時，進度條平滑移動
□ 暫停時，進度條停止但保持當前位置
□ 停止時，進度條歸零
□ 波形視覺化正常顯示

# 測試 4：無重疊
□ 任何時候都只有一個音樂在播放
□ 按停止後，完全沒有音樂聲音
□ 快速點擊播放/暫停不會產生多個音源
```

---

## 下一步行動

1. **立即執行**：添加單例檢查到 `RhythmEngineStore.setSynth()`
2. **添加 Debug Log**：在關鍵位置添加 console.log
3. **測試並驗證**：按照測試檢查表逐項確認
4. **移除 Debug Log**：修復完成後清理日誌

---

## 技術債務

- [ ] 重新啟用 unmount 清理（需要正確處理 Strict Mode）
- [ ] 實作 synth 實例的生命週期管理
- [ ] 考慮使用 React Context 而不是全域 store
- [ ] 添加 E2E 測試確保播放功能正常
