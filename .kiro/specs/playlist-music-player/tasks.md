# Playlist Music Player - Implementation Tasks

**Version**: 1.0
**Language**: zh-TW (繁體中文)
**Status**: tasks-generated
**Last Updated**: 2025-01-10

---

## 任務總覽

本文件包含 Playlist Music Player 功能的分步驟實作任務，所有任務均可由程式碼生成代理執行。任務按技術依賴順序排列，每個任務預計 1-3 小時完成。

**基礎資訊**：
- 總任務數：35 個主要任務
- 預估總工時：約 70-105 小時
- 關鍵路徑：Foundation → State Management → UI Components → Integration → Testing

**技術棧**：
- React 19 + Next.js 15 + TypeScript 5
- Zustand 4.5+ (state management + persist middleware)
- shadcn/ui (Drawer + Sheet components)
- Web Audio API (ProceduralMusicEngine)
- Tailwind CSS v4
- Vitest + Playwright (testing)

---

## 📋 Phase 1: Foundation & Audio System

- [x] Task 1: 擴展 audioStore 支援音樂播放器狀態
- [x] Task 2: ProceduralMusicEngine 新增 crossfade 支援
- [x] Task 3: 建立 MusicMode 和 Playlist 型別定義
- [x] Task 4: 建立 ErrorHandler 錯誤處理模組

### 1. 擴展 audioStore 支援音樂播放器狀態

**目標**：在現有 `/src/lib/audio/audioStore.ts` 中新增音樂播放器專用狀態欄位。

**實作步驟**：
1. 在 `AudioState` interface 新增以下欄位：
   ```typescript
   currentMusicMode: MusicMode | null; // 當前播放的音樂模式
   musicPlayerInitialized: boolean;    // 音樂播放器初始化狀態
   ```
2. 更新 `persist` middleware 的 `partialize` 函數，確保 `currentMusicMode` 被持久化到 localStorage
3. 新增 `setCurrentMusicMode` action 方法：
   ```typescript
   setCurrentMusicMode: (mode: MusicMode | null) => void;
   ```
4. 更新現有的 `setIsPlaying` 方法，當 `type === 'music'` 時同步更新音樂播放器狀態
5. 新增單元測試 `/src/lib/audio/__tests__/audioStore.music.test.ts`，測試新增的 action 和狀態持久化

_Requirements: 1.1, 1.2, 2.1, 6.1 (audioStore 狀態擴展、音樂模式播放、localStorage 持久化)_

---

### 2. ProceduralMusicEngine 新增 crossfade 支援

**目標**：在 `/src/lib/audio/ProceduralMusicEngine.ts` 實作無縫淡入淡出切換功能。

**實作步驟**：
1. 新增 `crossfadeDuration` 參數到 `ProceduralMusicEngineConfig` interface (預設 2000ms)
2. 建立 `CrossfadeManager` 內部類別：
   ```typescript
   class CrossfadeManager {
     private currentGainNode: GainNode | null = null;
     private nextGainNode: GainNode | null = null;
     async crossfade(
       from: VoiceManager,
       to: VoiceManager,
       duration: number
     ): Promise<void>;
   }
   ```
3. 修改 `switchMode` 方法，使用 `CrossfadeManager` 實現淡出當前音樂、淡入新音樂
4. 實作漸變邏輯：
   - 當前音樂從 volume 1.0 → 0.0 (duration/2)
   - 新音樂從 volume 0.0 → 1.0 (duration/2)
   - 兩者重疊播放 (duration/2) 時段
5. 新增單元測試 `/src/lib/audio/__tests__/ProceduralMusicEngine.crossfade.test.ts`，驗證淡入淡出時間和音量變化

_Requirements: 1.4, 2.2 (無縫切換、淡入淡出效果)_

---

### 2. ProceduralMusicEngine 新增 crossfade 支援

**目標**：在 `/src/lib/audio/ProceduralMusicEngine.ts` 實作無縫淡入淡出切換功能。

**實作步驟**:
1. 新增 `crossfadeDuration` 參數到 `ProceduralMusicEngineConfig` interface (預設 2000ms)
2. 建立 `CrossfadeManager` 內部類別：
   ```typescript
   class CrossfadeManager {
     private currentGainNode: GainNode | null = null;
     private nextGainNode: GainNode | null = null;
     async crossfade(
       from: VoiceManager,
       to: VoiceManager,
       duration: number
     ): Promise<void>;
   }
   ```
3. 修改 `switchMode` 方法，使用 `CrossfadeManager` 實現淡出當前音樂、淡入新音樂
4. 實作漸變邏輯：
   - 當前音樂從 volume 1.0 → 0.0 (duration/2)
   - 新音樂從 volume 0.0 → 1.0 (duration/2)
   - 兩者重疊播放 (duration/2) 時段
5. 新增單元測試 `/src/lib/audio/__tests__/ProceduralMusicEngine.crossfade.test.ts`，驗證淡入淡出時間和音量變化

_Requirements: 1.4, 2.2 (無縫切換、淡入淡出效果)_

---

### 3. 建立 MusicMode 和 Playlist 型別定義

**目標**：建立共用型別定義檔案 `/src/lib/audio/types.ts`。

**實作步驟**：
1. 定義 `MusicMode` 型別：
   ```typescript
   export type MusicMode = 'synthwave' | 'divination' | 'lofi' | 'ambient';
   export const MUSIC_MODES: readonly MusicMode[] = ['synthwave', 'divination', 'lofi', 'ambient'] as const;
   ```
2. 定義 `Playlist` interface：
   ```typescript
   export interface Playlist {
     id: string;              // UUID
     name: string;            // 播放清單名稱 (1-50 字元)
     modes: MusicMode[];      // 音樂模式陣列 (1-20 個模式)
     createdAt: Date;
     updatedAt: Date;
   }
   ```
3. 定義 `RepeatMode` 和 `ShuffleMode`：
   ```typescript
   export type RepeatMode = 'off' | 'one' | 'all';
   export type ShuffleMode = boolean;
   ```
4. 匯出 `PlaylistValidationError` 錯誤類別
5. 建立 `validatePlaylist` 輔助函數，驗證播放清單格式和長度限制

_Requirements: 3.1, 3.2, 4.1, 4.2 (播放清單建立、模式選擇、重複/隨機播放)_

---

### 4. 建立 ErrorHandler 錯誤處理模組

**目標**：實作集中式錯誤處理系統 `/src/lib/audio/errorHandler.ts`。

**實作步驟**：
1. 定義 `MusicPlayerErrorType` enum：
   ```typescript
   export enum MusicPlayerErrorType {
     ENGINE_INIT_FAILED = 'ENGINE_INIT_FAILED',
     MODE_LOAD_FAILED = 'MODE_LOAD_FAILED',
     AUDIO_CONTEXT_SUSPENDED = 'AUDIO_CONTEXT_SUSPENDED',
     STORAGE_WRITE_FAILED = 'STORAGE_WRITE_FAILED',
     PLAYLIST_CORRUPTED = 'PLAYLIST_CORRUPTED',
   }
   ```
2. 建立 `MusicPlayerError` 自訂錯誤類別：
   ```typescript
   export class MusicPlayerError extends Error {
     constructor(
       public type: MusicPlayerErrorType,
       public message: string,
       public recoverable: boolean,
       public originalError?: Error
     );
   }
   ```
3. 實作 `ErrorHandler` 單例類別：
   - `retry<T>()`: 重試機制 (最多 3 次，exponential backoff)
   - `trackError()`: 錯誤率監控 (30% 閾值)
   - `handleError()`: 統一錯誤處理邏輯
4. 新增單元測試 `/src/lib/audio/__tests__/errorHandler.test.ts`，驗證重試邏輯和錯誤率計算

_Requirements: 10.1, 10.2, 10.3 (錯誤處理、重試機制、錯誤率監控)_

---

## 📦 Phase 2: State Management

- [x] Task 5: 建立 musicPlayerStore (Zustand store)
- [x] Task 6: 建立 playlistStore (播放清單管理)
- [x] Task 7: 實作 useMusicPlayer 自訂 Hook
- [x] Task 8: 實作播放清單隨機播放邏輯

### 5. 建立 musicPlayerStore (Zustand store)

**目標**：實作音樂播放器專用 Zustand store `/src/stores/musicPlayerStore.ts`。

**實作步驟**：
1. 定義 `MusicPlayerState` interface：
   ```typescript
   export interface MusicPlayerState {
     // Playback State
     currentMode: MusicMode | null;
     isPlaying: boolean;
     currentPlaylist: string | null;  // Playlist ID
     currentModeIndex: number;

     // Playback Settings
     repeatMode: RepeatMode;
     shuffleEnabled: boolean;

     // UI State
     isDrawerOpen: boolean;
     isDrawerMinimized: boolean;
     isSheetOpen: boolean;

     // Actions (30+ methods)
     playMode: (mode: MusicMode) => Promise<void>;
     pause: () => void;
     resume: () => void;
     next: () => void;
     previous: () => void;
     setRepeatMode: (mode: RepeatMode) => void;
     toggleShuffle: () => void;
     openDrawer: () => void;
     closeDrawer: () => void;
     minimizeDrawer: () => void;
     openSheet: () => void;
     closeSheet: () => void;
     // ... 其他 actions
   }
   ```
2. 使用 `zustand/middleware` 的 `persist` 持久化以下欄位：
   - `repeatMode`, `shuffleEnabled`, `currentPlaylist`, `currentModeIndex`
3. 實作播放邏輯：
   - `playMode`: 調用 `ProceduralMusicEngine.start()` 和 `switchMode()`
   - `next/previous`: 處理循環播放、隨機播放邏輯
4. 整合 `audioStore`：在 `playMode` 中同步更新 `audioStore.setCurrentMusicMode()`

_Requirements: 1.1, 1.2, 1.3, 2.1, 4.2, 4.3, 6.1 (播放控制、音樂模式切換、重複/隨機播放、狀態持久化)_

---

### 6. 建立 playlistStore (播放清單管理)

**目標**：實作播放清單 CRUD 操作的 Zustand store `/src/stores/playlistStore.ts`。

**實作步驟**：
1. 定義 `PlaylistStore` interface：
   ```typescript
   export interface PlaylistStore {
     playlists: Playlist[];

     // CRUD Actions
     createPlaylist: (name: string, modes: MusicMode[]) => string;  // 回傳 UUID
     updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
     deletePlaylist: (id: string) => void;
     reorderPlaylistModes: (id: string, fromIndex: number, toIndex: number) => void;

     // Query Actions
     getPlaylistById: (id: string) => Playlist | undefined;
     getAllPlaylists: () => Playlist[];
   }
   ```
2. 使用 `persist` middleware 持久化 `playlists` 陣列到 localStorage
3. 實作驗證邏輯：
   - 播放清單名稱：1-50 字元
   - 音樂模式數量：1-20 個
   - UUID 唯一性檢查
4. 新增錯誤處理：當 localStorage 寫入失敗時拋出 `STORAGE_WRITE_FAILED` 錯誤
5. 新增單元測試 `/src/stores/__tests__/playlistStore.test.ts`

_Requirements: 3.1, 3.2, 3.3, 3.4, 6.1, 6.3 (播放清單 CRUD、模式管理、localStorage 持久化)_

---

### 7. 實作 useMusicPlayer 自訂 Hook

**目標**：建立便捷的 Hook `/src/hooks/useMusicPlayer.ts` 統一存取 musicPlayerStore。

**實作步驟**：
1. 使用 Zustand 的 `useStore` 和 selector 模式：
   ```typescript
   export function useMusicPlayer() {
     const {
       currentMode,
       isPlaying,
       playMode,
       pause,
       resume,
       next,
       previous
     } = useMusicPlayerStore();

     return {
       currentMode,
       isPlaying,
       playMode,
       pause,
       resume,
       next,
       previous
     };
   }
   ```
2. 實作 `usePlaybackControls` Hook (僅訂閱播放控制相關狀態)
3. 實作 `usePlaylistManager` Hook (僅訂閱播放清單相關狀態)
4. 使用 `useMemo` 和 `useCallback` 優化效能
5. 新增單元測試 `/src/hooks/__tests__/useMusicPlayer.test.ts`

_Requirements: 1.1, 1.2, 1.3, 2.1 (播放控制 Hook 封裝)_

---

### 8. 實作播放清單隨機播放邏輯

**目標**：在 `musicPlayerStore` 實作 Fisher-Yates 隨機演算法。

**實作步驟**：
1. 建立 `shuffleQueue` 內部狀態：
   ```typescript
   shuffleQueue: number[] | null; // 隨機播放時的索引佇列
   ```
2. 實作 `generateShuffleQueue` 輔助函數：
   ```typescript
   function generateShuffleQueue(length: number, currentIndex: number): number[] {
     // Fisher-Yates shuffle
     // 確保當前索引不在第一位
   }
   ```
3. 修改 `toggleShuffle` action：
   - 開啟隨機播放時生成 `shuffleQueue`
   - 關閉隨機播放時清空 `shuffleQueue`
4. 修改 `next/previous` action，根據 `shuffleEnabled` 使用不同的索引邏輯
5. 新增單元測試驗證隨機播放的唯一性和均勻分布

_Requirements: 4.3 (隨機播放功能)_

---

## 🎨 Phase 3: UI Components - Drawer (Main Player)

- [x] Task 9: 安裝並設定 shadcn/ui Drawer 元件
- [x] Task 10: 實作 MusicPlayerDrawer 佈局結構
- [x] Task 11: 實作 PlaybackControls 播放控制元件
- [x] Task 12: 實作 MusicModeSelector 音樂模式選擇器
- [x] Task 13: 實作 ProgressBar 播放進度條元件
- [x] Task 14: 實作 VolumeControl 音量控制元件
- [x] Task 15: 實作 MusicVisualizer 音樂視覺化元件
- [x] Task 16: 整合 MusicPlayerDrawer 所有子元件

### 9. 安裝並設定 shadcn/ui Drawer 元件

**目標**：使用 shadcn CLI 安裝 Drawer 元件並進行基礎設定。

**實作步驟**：
1. 執行指令安裝 Drawer：
   ```bash
   npx shadcn@latest add drawer
   ```
2. 確認生成的檔案：`/src/components/ui/drawer.tsx`
3. 檢查 `vaul` 依賴已正確安裝 (`package.json`)
4. 建立基礎包裝元件 `/src/components/music-player/MusicPlayerDrawer.tsx`：
   ```tsx
   import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';

   export function MusicPlayerDrawer() {
     return (
       <Drawer>
         <DrawerTrigger>Open Player</DrawerTrigger>
         <DrawerContent>
           {/* 待實作 */}
         </DrawerContent>
       </Drawer>
     );
   }
   ```
5. 新增 Playwright E2E 測試驗證 Drawer 可正常開啟和關閉

_Requirements: 5.1, 5.2 (Drawer 元件使用、底部滑出介面)_

---

### 10. 實作 MusicPlayerDrawer 佈局結構

**目標**：建立 Drawer 的完整 UI 佈局，包含縮小模式和展開模式。

**實作步驟**：
1. 定義 Drawer 高度狀態：
   ```typescript
   const [drawerHeight, setDrawerHeight] = useState<'minimized' | 'normal' | 'expanded'>('normal');
   // minimized: 80px, normal: 60%, expanded: 90%
   ```
2. 建立三層結構：
   - **縮小模式 (80px)**：當前音樂模式名稱 + 播放/暫停按鈕 + 展開按鈕
   - **正常模式 (60%)**：完整播放控制 + 播放清單按鈕 + 視覺化區域
   - **展開模式 (90%)**：額外顯示歌詞區域（未來擴充）
3. 使用 `motion.div` 實作平滑高度過渡動畫
4. 整合 `useMusicPlayer` Hook 取得播放狀態
5. 新增拖曳手勢支援 (vaul 內建功能)

_Requirements: 5.2, 5.3, 5.4, 7.1, 7.3 (Drawer 佈局、高度調整、拖曳手勢、響應式設計)_

---

### 11. 實作 PlaybackControls 播放控制元件

**目標**：建立播放控制按鈕群組 `/src/components/music-player/PlaybackControls.tsx`。

**實作步驟**：
1. 定義元件 Props：
   ```typescript
   interface PlaybackControlsProps {
     isPlaying: boolean;
     onPlay: () => void;
     onPause: () => void;
     onNext: () => void;
     onPrevious: () => void;
     onToggleShuffle: () => void;
     onToggleRepeat: () => void;
     shuffleEnabled: boolean;
     repeatMode: RepeatMode;
   }
   ```
2. 使用 `lucide-react` 圖示：
   - Play/Pause: `Play` / `Pause`
   - Next/Previous: `SkipForward` / `SkipBack`
   - Shuffle: `Shuffle` (啟用時改變顏色)
   - Repeat: `Repeat` / `Repeat1` (根據 repeatMode 切換)
3. 整合 `useAudioEffect` Hook 播放 UI 音效 ('button-click')
4. 新增鍵盤快捷鍵支援：
   - Space: 播放/暫停
   - Arrow Left/Right: 上一首/下一首
5. 使用 `React.memo` 優化效能
6. 新增單元測試驗證按鈕點擊和鍵盤事件

_Requirements: 1.1, 1.2, 1.3, 4.2, 4.3, 8.1 (播放控制、重複/隨機播放、鍵盤快捷鍵)_

---

### 12. 實作 MusicModeSelector 音樂模式選擇器

**目標**：建立音樂模式選擇 UI `/src/components/music-player/MusicModeSelector.tsx`。

**實作步驟**：
1. 顯示 4 個音樂模式按鈕：
   ```typescript
   const MODES: { id: MusicMode; label: string; icon: string }[] = [
     { id: 'synthwave', label: 'Synthwave', icon: '🎹' },
     { id: 'divination', label: '占卜', icon: '🔮' },
     { id: 'lofi', label: 'Lo-fi', icon: '🎧' },
     { id: 'ambient', label: 'Ambient', icon: '🌊' },
   ];
   ```
2. 當前播放模式高亮顯示 (Pip-Boy 綠色邊框)
3. 點擊模式按鈕時：
   - 調用 `playMode(mode)`
   - 播放切換音效 ('ui-hover')
   - 顯示載入動畫 (< 500ms)
4. 使用 `AnimatePresence` 實作模式切換動畫
5. 新增單元測試驗證模式選擇邏輯

_Requirements: 2.1, 2.2, 9.2, 11.1 (音樂模式切換、視覺反饋、Fallout Pip-Boy 風格)_

---

### 13. 實作 ProgressBar 播放進度條元件

**目標**：建立進度條 UI `/src/components/music-player/ProgressBar.tsx`（僅視覺效果，無實際時間軸）。

**實作步驟**：
1. 由於 ProceduralMusicEngine 是程序生成音樂（無固定長度），進度條顯示循環動畫
2. 使用 `motion.div` 實作循環進度動畫：
   ```tsx
   <motion.div
     className="h-1 bg-pip-boy-green"
     animate={{ width: ['0%', '100%'] }}
     transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
   />
   ```
3. 當音樂暫停時停止動畫
4. 進度條可點擊但不支援拖曳（因為無時間軸）
5. 新增 Storybook story 展示不同狀態

_Requirements: 5.3, 11.1 (播放進度視覺化、Pip-Boy 風格)_

---

### 14. 實作 VolumeControl 音量控制元件

**目標**：建立音量滑桿 UI `/src/components/music-player/VolumeControl.tsx`。

**實作步驟**：
1. 使用 shadcn/ui `Slider` 元件
2. 整合 `audioStore` 的 `volumes.music` 和 `setVolume` action
3. 新增靜音按鈕 (lucide-react `Volume2` / `VolumeX`)
4. 實作音量變化時的視覺反饋動畫
5. 確保音量調整即時同步到 `ProceduralMusicEngine.setVolume()`
6. 新增單元測試驗證音量同步邏輯

_Requirements: 4.1, 9.2 (音量控制、視覺反饋)_

---

### 15. 實作 MusicVisualizer 音樂視覺化元件

**目標**：建立簡易音訊視覺化 `/src/components/music-player/MusicVisualizer.tsx`。

**實作步驟**：
1. 使用 Web Audio API 的 `AnalyserNode` 取得頻率數據
2. 實作 Canvas 繪製頻譜圖：
   ```typescript
   function drawVisualizer(dataArray: Uint8Array, canvas: HTMLCanvasElement) {
     // 繪製 16 個柱狀圖，高度對應頻率強度
   }
   ```
3. 使用 `requestAnimationFrame` 更新動畫 (60 FPS)
4. 當音樂暫停時顯示靜態波形圖
5. 記憶體優化：元件卸載時清理 AnalyserNode
6. 新增效能測試驗證 FPS ≥ 30

_Requirements: 9.1, 9.3, 9.4, 11.1 (音訊視覺化、效能優化、Pip-Boy 風格)_

---

### 16. 整合 MusicPlayerDrawer 所有子元件

**目標**：組裝所有子元件到 `MusicPlayerDrawer` 主元件。

**實作步驟**：
1. 在 `MusicPlayerDrawer` 中引入所有子元件：
   - `PlaybackControls`
   - `MusicModeSelector`
   - `ProgressBar`
   - `VolumeControl`
   - `MusicVisualizer`
2. 建立響應式佈局：
   - 桌面版 (≥768px)：左右分欄，左側控制區，右側視覺化區
   - 行動版 (<768px)：垂直堆疊
3. 整合 `useMusicPlayer` 和 `usePlaylistStore` Hooks
4. 新增播放清單按鈕，點擊時開啟 Sheet
5. 新增 Playwright E2E 測試驗證完整互動流程

_Requirements: 5.1, 5.2, 5.3, 7.1, 7.2, 7.3 (Drawer 完整功能、響應式設計)_

---

## 📜 Phase 4: UI Components - Sheet (Playlist)

- [x] Task 17: 安裝並設定 shadcn/ui Sheet 元件
- [x] Task 18: 實作 PlaylistList 播放清單列表元件
- [x] Task 19: 實作 PlaylistEditor 播放清單編輯器
- [x] Task 20: 實作 ModeReorderList 模式重新排序元件
- [x] Task 21: 實作 PlaylistSheet 完整功能

### 17. 安裝並設定 shadcn/ui Sheet 元件

**目標**：使用 shadcn CLI 安裝 Sheet 元件並進行基礎設定。

**實作步驟**：
1. 執行指令安裝 Sheet：
   ```bash
   npx shadcn@latest add sheet
   ```
2. 確認生成的檔案：`/src/components/ui/sheet.tsx`
3. 檢查 `@radix-ui/react-dialog` 依賴已正確安裝
4. 建立基礎包裝元件 `/src/components/music-player/PlaylistSheet.tsx`：
   ```tsx
   import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

   export function PlaylistSheet() {
     return (
       <Sheet>
         <SheetTrigger>Open Playlist</SheetTrigger>
         <SheetContent side="right">
           <SheetHeader>
             <SheetTitle>播放清單</SheetTitle>
           </SheetHeader>
           {/* 待實作 */}
         </SheetContent>
       </Sheet>
     );
   }
   ```
5. 設定 Sheet 寬度：桌面版 400px，行動版 90vw

_Requirements: 5.5, 5.6 (Sheet 元件使用、右側滑出介面)_

---

### 18. 實作 PlaylistList 播放清單列表元件

**目標**：建立播放清單列表 UI `/src/components/music-player/PlaylistList.tsx`。

**實作步驟**：
1. 從 `playlistStore` 取得所有播放清單
2. 顯示播放清單卡片，每個卡片包含：
   - 播放清單名稱
   - 音樂模式數量 (例: "4 首")
   - 建立時間 (相對時間，例: "2 天前")
   - 播放按鈕 (Play icon)
   - 編輯按鈕 (Pencil icon)
   - 刪除按鈕 (Trash icon)
3. 當前播放的播放清單高亮顯示
4. 點擊播放按鈕時：
   - 調用 `musicPlayerStore.loadPlaylist(playlistId)`
   - 自動開始播放第一首
5. 使用 `AnimatePresence` 實作列表新增/刪除動畫
6. 新增單元測試驗證 CRUD 操作

_Requirements: 3.1, 3.2, 3.3, 5.6 (播放清單列表、CRUD 操作、Sheet 內容)_

---

### 19. 實作 PlaylistEditor 播放清單編輯器

**目標**：建立播放清單編輯表單 `/src/components/music-player/PlaylistEditor.tsx`。

**實作步驟**：
1. 使用 `react-hook-form` 處理表單驗證
2. 表單欄位：
   - 播放清單名稱 (input, 1-50 字元)
   - 音樂模式選擇器 (multi-select checkboxes)
3. 模式列表可拖曳排序 (使用 `@dnd-kit/core`)
4. 驗證規則：
   - 名稱不可為空
   - 至少選擇 1 個音樂模式
   - 最多 20 個音樂模式
5. 儲存時調用 `playlistStore.createPlaylist()` 或 `updatePlaylist()`
6. 新增錯誤提示 UI (使用 shadcn/ui `Alert`)
7. 新增單元測試驗證表單驗證邏輯

_Requirements: 3.1, 3.2, 3.4, 6.3 (播放清單建立、模式選擇、重新排序)_

---

### 20. 實作 ModeReorderList 模式重新排序元件

**目標**：建立可拖曳排序的音樂模式列表 `/src/components/music-player/ModeReorderList.tsx`。

**實作步驟**：
1. 安裝 `@dnd-kit/core` 和 `@dnd-kit/sortable`
2. 實作拖曳排序邏輯：
   ```tsx
   import { DndContext, closestCenter } from '@dnd-kit/core';
   import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

   function ModeReorderList({ modes, onReorder }: Props) {
     const handleDragEnd = (event: DragEndEvent) => {
       const { active, over } = event;
       if (active.id !== over.id) {
         onReorder(oldIndex, newIndex);
       }
     };
     // ...
   }
   ```
3. 每個模式項目顯示：
   - 拖曳手柄 (GripVertical icon)
   - 音樂模式圖示和名稱
   - 刪除按鈕
4. 整合 `playlistStore.reorderPlaylistModes()`
5. 新增單元測試驗證排序邏輯

_Requirements: 3.4 (模式重新排序)_

---

### 21. 實作 PlaylistSheet 完整功能

**目標**：組裝所有子元件到 `PlaylistSheet` 主元件。

**實作步驟**：
1. 整合 `PlaylistList` 和 `PlaylistEditor` 元件
2. 實作兩種模式切換：
   - 列表模式 (預設)
   - 編輯模式 (點擊 "新增播放清單" 或 "編輯" 按鈕時)
3. 新增搜尋框過濾播放清單 (使用 `useDeferredValue` 優化效能)
4. 新增空狀態提示 (無播放清單時)
5. 整合 `usePlaylistStore` Hook
6. 新增 Playwright E2E 測試驗證完整播放清單管理流程

_Requirements: 3.1, 3.2, 3.3, 3.4, 5.5, 5.6, 7.1, 7.2 (播放清單管理、Sheet 完整功能、響應式設計)_

---

## 🔗 Phase 5: Integration & Data Persistence

- [x] Task 22: 實作 localStorage 持久化邏輯
- [x] Task 23: 實作音樂播放器初始化邏輯
- [x] Task 24: 整合 MusicPlayerDrawer 到全域佈局
- [x] Task 25: 實作 Drawer 與 Sheet 的協調邏輯

### 22. 實作 localStorage 持久化邏輯

**目標**：確保所有狀態正確持久化到 localStorage。

**實作步驟**：
1. 驗證 `musicPlayerStore` 的 persist 配置：
   ```typescript
   persist(
     (set, get) => ({ /* state */ }),
     {
       name: 'wasteland-tarot-music-player',
       partialize: (state) => ({
         repeatMode: state.repeatMode,
         shuffleEnabled: state.shuffleEnabled,
         currentPlaylist: state.currentPlaylist,
         currentModeIndex: state.currentModeIndex,
       }),
     }
   )
   ```
2. 驗證 `playlistStore` 的 persist 配置：
   ```typescript
   persist(
     (set, get) => ({ /* state */ }),
     {
       name: 'wasteland-tarot-playlists',
       partialize: (state) => ({
         playlists: state.playlists,
       }),
     }
   )
   ```
3. 實作錯誤處理：當 localStorage 配額超限時顯示警告
4. 新增 Playwright E2E 測試驗證重新整理後狀態恢復

_Requirements: 6.1, 6.2, 6.3 (localStorage 持久化、重新整理恢復)_

---

### 23. 實作音樂播放器初始化邏輯

**目標**：在應用啟動時自動恢復音樂播放器狀態。

**實作步驟**：
1. 建立 `useMusicPlayerInitializer` Hook `/src/hooks/useMusicPlayerInitializer.ts`
2. 在 Hook 中執行初始化流程：
   ```typescript
   useEffect(() => {
     const init = async () => {
       try {
         // 1. 從 localStorage 恢復狀態
         const savedState = localStorage.getItem('wasteland-tarot-music-player');

         // 2. 如果有儲存的播放清單，載入它
         if (savedState?.currentPlaylist) {
           await musicPlayerStore.loadPlaylist(savedState.currentPlaylist);
         }

         // 3. 初始化 ProceduralMusicEngine
         await audioEngine.initialize();

         // 4. 標記初始化完成
         musicPlayerStore.setInitialized(true);
       } catch (error) {
         ErrorHandler.handleError(error);
       }
     };
     init();
   }, []);
   ```
3. 在 `/src/app/layout.tsx` 中引入此 Hook
4. 新增單元測試驗證初始化流程

_Requirements: 6.1, 6.2 (應用啟動時恢復狀態)_

---

### 24. 整合 MusicPlayerDrawer 到全域佈局

**目標**：將 Drawer 放置在全域佈局中，所有頁面可存取。

**實作步驟**：
1. 在 `/src/app/layout.tsx` 新增 `MusicPlayerDrawer` 元件：
   ```tsx
   export default function RootLayout({ children }: Props) {
     return (
       <html>
         <body>
           <MusicPlayerInitializer />
           {children}
           <MusicPlayerDrawer />
         </body>
       </html>
     );
   }
   ```
2. 新增浮動觸發按鈕 (固定在右下角)：
   - 顯示當前播放狀態 (播放中/暫停)
   - 點擊時開啟 Drawer
3. 使用 CSS `position: fixed` 確保 Drawer 不受頁面滾動影響
4. 新增 Playwright E2E 測試驗證全域存取

_Requirements: 5.1, 5.2, 7.1 (Drawer 全域存取)_

---

### 25. 實作 Drawer 與 Sheet 的協調邏輯

**目標**：確保 Drawer 和 Sheet 的開啟/關閉狀態正確協調。

**實作步驟**：
1. 在 `musicPlayerStore` 實作狀態協調邏輯：
   ```typescript
   openSheet: () => set({ isSheetOpen: true, isDrawerMinimized: true }),
   closeSheet: () => set({ isSheetOpen: false }),
   ```
2. 當 Sheet 開啟時，自動最小化 Drawer (避免視覺衝突)
3. 當 Sheet 關閉時，Drawer 恢復原始高度
4. 實作 `useMediaQuery` Hook 偵測桌面/行動裝置，行動裝置開啟 Sheet 時關閉 Drawer
5. 新增 Playwright E2E 測試驗證協調邏輯

_Requirements: 5.1, 5.5, 7.1, 7.2 (Drawer 與 Sheet 協調)_

---

## ⌨️ Phase 6: Accessibility & Keyboard Support

- [x] Task 26: 實作鍵盤快捷鍵系統
- [x] Task 27: 實作 ARIA 無障礙屬性
- [x] Task 28: 實作焦點管理邏輯

### 26. 實作鍵盤快捷鍵系統

**目標**：建立全域鍵盤快捷鍵 Hook `/src/hooks/useKeyboardShortcuts.ts`。

**實作步驟**：
1. 定義快捷鍵映射：
   ```typescript
   const SHORTCUTS = {
     'Space': 'toggle-play',           // 播放/暫停
     'ArrowRight': 'next',              // 下一首
     'ArrowLeft': 'previous',           // 上一首
     'KeyM': 'toggle-mute',             // 靜音
     'KeyS': 'toggle-shuffle',          // 隨機播放
     'KeyR': 'cycle-repeat',            // 循環重複模式
     'KeyP': 'open-playlist',           // 開啟播放清單
     'Escape': 'close-all',             // 關閉所有彈出視窗
   } as const;
   ```
2. 使用 `useEffect` 監聽 `keydown` 事件
3. 實作快捷鍵衝突處理：當輸入框 focus 時停用快捷鍵
4. 新增快捷鍵提示 UI (按下 `?` 時顯示)
5. 新增 Playwright E2E 測試驗證所有快捷鍵

_Requirements: 8.1, 8.2 (鍵盤快捷鍵、快捷鍵提示)_

---

### 27. 實作 ARIA 無障礙屬性

**目標**：為所有音樂播放器元件新增完整的 ARIA 屬性。

**實作步驟**：
1. 為 `MusicPlayerDrawer` 新增 ARIA 屬性：
   ```tsx
   <Drawer
     aria-label="音樂播放器"
     role="region"
     aria-live="polite"
   >
   ```
2. 為播放按鈕新增 ARIA 標籤：
   ```tsx
   <button
     aria-label={isPlaying ? '暫停' : '播放'}
     aria-pressed={isPlaying}
   >
   ```
3. 為音量滑桿新增 ARIA 屬性：
   ```tsx
   <Slider
     aria-label="音量控制"
     aria-valuemin={0}
     aria-valuemax={100}
     aria-valuenow={volume}
   />
   ```
4. 為播放清單新增 ARIA 屬性：
   ```tsx
   <ul role="list" aria-label="播放清單">
     <li role="listitem">...</li>
   </ul>
   ```
5. 使用 `axe-core` 進行無障礙測試

_Requirements: 8.3 (螢幕閱讀器支援)_

---

### 28. 實作焦點管理邏輯

**目標**：確保鍵盤導航時的焦點順序合理。

**實作步驟**：
1. 使用 `useFocusTrap` Hook 限制焦點在 Drawer/Sheet 內
2. 當 Drawer 開啟時，自動將焦點移到第一個可互動元素
3. 當 Sheet 開啟時，自動將焦點移到搜尋框
4. 按下 Escape 時關閉彈出視窗並恢復焦點到觸發元素
5. 新增 Playwright E2E 測試驗證焦點順序

_Requirements: 8.3 (鍵盤導航焦點管理)_

---

## 🎯 Phase 7: Error Handling & Edge Cases

- [x] Task 29: 實作音訊載入失敗處理
- [x] Task 30: 實作 localStorage 配額超限處理
- [x] Task 31: 實作播放清單損壞恢復邏輯

### 29. 實作音訊載入失敗處理

**目標**：當 ProceduralMusicEngine 初始化失敗時顯示錯誤 UI。

**實作步驟**：
1. 在 `musicPlayerStore.playMode()` 包裝錯誤處理：
   ```typescript
   playMode: async (mode: MusicMode) => {
     try {
       await ErrorHandler.retry(
         () => audioEngine.start(mode),
         { maxRetries: 3, backoff: 'exponential' }
       );
     } catch (error) {
       set({ error: new MusicPlayerError(...) });
       // 顯示 Toast 錯誤提示
     }
   },
   ```
2. 建立 `ErrorToast` 元件顯示錯誤訊息
3. 實作重試按鈕，允許用戶手動重試
4. 當錯誤率超過 30% 時停用音樂播放器並顯示警告
5. 新增單元測試模擬音訊載入失敗場景

_Requirements: 10.1, 10.2, 10.3 (錯誤處理、重試機制、錯誤率監控)_

---

### 30. 實作 localStorage 配額超限處理

**目標**：當 localStorage 寫入失敗時清理舊資料。

**實作步驟**：
1. 在 `playlistStore` 包裝 `createPlaylist` 錯誤處理：
   ```typescript
   createPlaylist: (name, modes) => {
     try {
       const playlist = { id: uuid(), name, modes, ... };
       set({ playlists: [...get().playlists, playlist] });
     } catch (error) {
       if (error.name === 'QuotaExceededError') {
         // 清理最舊的播放清單
         const sorted = get().playlists.sort((a, b) => a.createdAt - b.createdAt);
         set({ playlists: sorted.slice(1) });
         // 重試
         return this.createPlaylist(name, modes);
       }
       throw new MusicPlayerError(MusicPlayerErrorType.STORAGE_WRITE_FAILED, ...);
     }
   },
   ```
2. 顯示 Toast 提示用戶配額超限
3. 實作手動清理功能 (設定頁面)
4. 新增單元測試模擬配額超限場景

_Requirements: 10.1, 10.3 (localStorage 錯誤處理)_

---

### 31. 實作播放清單損壞恢復邏輯

**目標**：當 localStorage 資料格式錯誤時自動修復或清空。

**實作步驟**：
1. 在 `playlistStore` 初始化時驗證資料格式：
   ```typescript
   const validatePlaylists = (playlists: unknown): Playlist[] => {
     if (!Array.isArray(playlists)) return [];
     return playlists.filter((p) => {
       return (
         typeof p.id === 'string' &&
         typeof p.name === 'string' &&
         Array.isArray(p.modes) &&
         p.modes.every((m) => MUSIC_MODES.includes(m))
       );
     });
   };
   ```
2. 當驗證失敗時：
   - 記錄錯誤到 ErrorHandler
   - 清空損壞的播放清單
   - 顯示 Toast 提示用戶資料已重置
3. 新增單元測試模擬損壞的 localStorage 資料

_Requirements: 10.1, 10.4 (播放清單損壞恢復)_

---

## 🧪 Phase 8: Testing & Quality Assurance

- [x] Task 32: 撰寫單元測試 (Unit Tests)
- [x] Task 33: 撰寫整合測試 (Integration Tests)
- [x] Task 34: 撰寫 E2E 測試 (End-to-End Tests)
- [x] Task 35: 效能測試與優化

### 32. 撰寫單元測試 (Unit Tests)

**目標**：為所有核心邏輯撰寫單元測試，覆蓋率 ≥ 80%。

**實作步驟**：
1. 測試 `musicPlayerStore` 所有 actions：
   - `playMode`, `pause`, `resume`, `next`, `previous`
   - `setRepeatMode`, `toggleShuffle`
   - `openDrawer`, `closeDrawer`, `minimizeDrawer`
2. 測試 `playlistStore` CRUD 操作：
   - `createPlaylist`, `updatePlaylist`, `deletePlaylist`
   - `reorderPlaylistModes`
3. 測試 `ErrorHandler` 重試邏輯和錯誤率計算
4. 測試 `validatePlaylist` 輸入驗證
5. 使用 Vitest 執行測試，產生覆蓋率報告

_Requirements: 12.1, 12.2 (單元測試、測試覆蓋率)_

---

### 33. 撰寫整合測試 (Integration Tests)

**目標**：測試 UI 元件與 store 的整合邏輯。

**實作步驟**：
1. 測試 `MusicPlayerDrawer` 整合：
   - 點擊播放按鈕時調用 `musicPlayerStore.playMode()`
   - 拖曳 Drawer 時高度正確更新
   - 音量滑桿調整時同步到 `audioStore`
2. 測試 `PlaylistSheet` 整合：
   - 建立播放清單時調用 `playlistStore.createPlaylist()`
   - 編輯播放清單時調用 `playlistStore.updatePlaylist()`
   - 刪除播放清單時調用 `playlistStore.deletePlaylist()`
3. 測試鍵盤快捷鍵整合
4. 使用 Vitest + Testing Library 執行測試

_Requirements: 12.1, 12.3 (整合測試)_

---

### 34. 撰寫 E2E 測試 (End-to-End Tests)

**目標**：使用 Playwright 撰寫 3 個關鍵 E2E 流程測試。

**實作步驟**：
1. **E2E Flow 1: 播放音樂完整流程**
   ```typescript
   test('播放音樂完整流程', async ({ page }) => {
     await page.goto('/');
     await page.click('[aria-label="開啟音樂播放器"]');
     await page.click('button:has-text("Synthwave")');
     await expect(page.locator('[aria-label="暫停"]')).toBeVisible();
     await page.click('[aria-label="下一首"]');
     await expect(page.locator('text=Divination')).toBeVisible();
   });
   ```
2. **E2E Flow 2: 播放清單管理流程**
   ```typescript
   test('播放清單管理流程', async ({ page }) => {
     await page.goto('/');
     await page.click('[aria-label="開啟播放清單"]');
     await page.click('button:has-text("新增播放清單")');
     await page.fill('input[name="name"]', 'My Playlist');
     await page.check('label:has-text("Synthwave")');
     await page.check('label:has-text("Lo-fi")');
     await page.click('button:has-text("儲存")');
     await expect(page.locator('text=My Playlist')).toBeVisible();
   });
   ```
3. **E2E Flow 3: 狀態持久化流程**
   ```typescript
   test('狀態持久化流程', async ({ page }) => {
     await page.goto('/');
     await page.click('[aria-label="開啟音樂播放器"]');
     await page.click('button:has-text("Synthwave")');
     await page.reload();
     await expect(page.locator('text=Synthwave')).toBeVisible();
   });
   ```
4. 新增視覺回歸測試 (Playwright screenshots)

_Requirements: 12.1, 12.4 (E2E 測試、視覺回歸測試)_

---

### 35. 效能測試與優化

**目標**：驗證效能指標並進行必要優化。

**實作步驟**：
1. 測試音樂切換延遲 (目標: < 500ms)：
   ```typescript
   test('音樂切換延遲', async () => {
     const start = performance.now();
     await musicPlayerStore.playMode('synthwave');
     const end = performance.now();
     expect(end - start).toBeLessThan(500);
   });
   ```
2. 測試 UI 渲染效能 (目標: < 100ms)：
   - 使用 React Profiler 測量組件渲染時間
   - 優化使用 `React.memo`, `useMemo`, `useCallback`
3. 測試記憶體使用 (目標: ≤ 50MB)：
   - 使用 Chrome DevTools Memory Profiler
   - 確保 `AnalyserNode` 和 `AudioContext` 正確清理
4. 測試 FPS (目標: ≥ 30)：
   - 使用 Playwright 測量視覺化元件的 FPS
5. 產生效能報告

_Requirements: 9.1, 9.2, 9.3, 9.4, 9.5 (效能目標驗證)_

---

## 📊 任務完成檢查清單

完成所有 35 個任務後，請驗證以下檢查項目：

### 功能完整性
- [ ] 音樂播放、暫停、上一首、下一首功能正常
- [ ] 4 種音樂模式可正常切換，支援無縫淡入淡出
- [ ] 播放清單 CRUD 功能完整 (建立、編輯、刪除、重新排序)
- [ ] 重複播放模式 (關閉/單曲/全部) 正常運作
- [ ] 隨機播放功能正常運作
- [ ] 音量控制和靜音功能正常
- [ ] Drawer 可正常開啟、關閉、最小化、拖曳
- [ ] Sheet 可正常開啟、關閉
- [ ] 桌面版和行動版響應式佈局正確
- [ ] 鍵盤快捷鍵全部可用
- [ ] ARIA 無障礙屬性完整

### 資料持久化
- [ ] 播放清單儲存到 localStorage
- [ ] 播放器狀態 (重複模式、隨機播放) 儲存到 localStorage
- [ ] 重新整理後狀態正確恢復
- [ ] localStorage 配額超限時自動清理

### 錯誤處理
- [ ] 音訊載入失敗時顯示錯誤提示並支援重試
- [ ] localStorage 寫入失敗時顯示錯誤提示
- [ ] 播放清單損壞時自動修復或清空
- [ ] 錯誤率超過 30% 時停用音樂播放器

### 效能指標
- [ ] 音樂切換延遲 < 500ms
- [ ] UI 渲染時間 < 100ms
- [ ] 記憶體使用 ≤ 50MB
- [ ] 視覺化元件 FPS ≥ 30

### 測試覆蓋率
- [ ] 單元測試覆蓋率 ≥ 80%
- [ ] 整合測試涵蓋所有關鍵互動
- [ ] E2E 測試涵蓋 3 個關鍵流程
- [ ] 所有測試通過

### 程式碼品質
- [ ] 所有 TypeScript 型別定義完整
- [ ] 所有元件使用 `React.memo` 優化
- [ ] 所有 Hook 使用 `useMemo` 和 `useCallback` 優化
- [ ] 無 ESLint 錯誤和警告
- [ ] 程式碼符合專案風格指南 (Fallout Pip-Boy 風格)

---

## 📝 附註

1. **任務順序**: 本文件的任務已按技術依賴排序，建議按順序執行
2. **時間估計**: 每個任務預計 1-3 小時，實際時間可能因實作細節而異
3. **測試優先**: 高風險區域 (H) 優先撰寫測試，確保穩定性
4. **效能監控**: 在實作過程中持續監控效能指標，避免最後才發現問題
5. **文件更新**: 實作完成後更新 `spec.json` 的 `tasks.approved` 和 `ready_for_implementation` 欄位

---

**生成時間**: 2025-01-10T17:00:00Z
**需求版本**: v1.2
**設計版本**: v1.0
**任務版本**: v1.0
