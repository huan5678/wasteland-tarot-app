# 需求文檔 - 音樂系統整合方案（播放器 + 節奏編輯器）

## 簡介

本規格涵蓋兩個獨立但互補的音樂系統：

### 系統架構概覽（Pattern-Based 架構 + 訪客系統）⭐ v4.0 更新

```
訪客流程（v4.0 新增）：
訪客瀏覽公開歌曲
  ↓
選擇歌曲加入 localStorage 播放清單（上限 4 首）
  ↓
音樂播放器播放（RhythmAudioSynthesizer）
  ↓
註冊 → 選擇匯入播放清單到資料庫（可選）

註冊使用者流程：
使用者創建節奏（節奏編輯器）
  ↓
儲存為 Pattern (user_rhythm_presets) + 選擇公開/私密
  ↓
加入播放清單 (playlists + playlist_patterns)
  ↓
音樂播放器播放 (RhythmAudioSynthesizer)
```

### 系統組件架構

```
前台（公開使用者 + 訪客）:
├─ 音樂播放器 (MusicPlayerDrawer) - Pattern-Based 播放清單控制 ⭐
│   ├─ 播放清單選擇器（選擇 Pattern 播放清單）
│   ├─ 訪客播放清單管理（localStorage，上限 4 首）⭐ v4.0 新增
│   ├─ RhythmAudioSynthesizer（Web Audio API 合成器）⭐
│   ├─ 播放控制（播放/暫停/上一首/下一首/隨機/循環）
│   └─ 當前播放資訊（Pattern 名稱、描述、播放清單）
├─ 公開歌曲瀏覽器 ⭐ v4.0 新增
│   ├─ 系統預設歌曲（5 首）
│   ├─ 公開的使用者創作歌曲（is_public = true）
│   └─ 分頁、排序、搜尋功能
└─ 程序式音樂引擎 (ProceduralMusicEngine) - 保留作為備用

後台（登入使用者專屬）:
└─ /dashboard/rhythm-editor - 獨立節奏編輯器頁面 ★
    ├─ 16 步驟音序器（5 軌道：Kick、Snare、HiHat、OpenHat、Clap）
    ├─ AI 節奏生成（LLM + 配額管理 20 次/日）
    ├─ Preset 管理系統（系統預設 + 使用者自訂）
    ├─ 公開/私密設定（儲存時勾選）⭐ v4.0 新增
    └─ Web Audio API 合成器（獨立 AudioContext）
```

### 資料流架構

```
節奏編輯器 (Rhythm Editor):
  使用者操作 → 16 步驟網格
       ↓
  儲存 Preset → user_rhythm_presets 表
       ↓
  系統預設（5 個）+ 使用者自訂（最多 10 個）

播放清單管理 (Playlist Manager):
  瀏覽可用 Pattern → GET /api/v1/music/presets/available
       ↓
  建立播放清單 → playlists 表
       ↓
  加入 Pattern → playlist_patterns 表（關聯 pattern_id）
       ↓
  調整順序/移除 Pattern

音樂播放器 (Music Player):
  選擇播放清單 → GET /api/v1/playlists/{id}
       ↓
  載入 Pattern 陣列 → patterns[0].pattern
       ↓
  RhythmAudioSynthesizer 播放 → Web Audio API
       ↓
  循環 4 次後 → 下一個 Pattern
```

### 系統 A：播放清單音樂播放器（前台）

將 Wasteland Tarot 網站的自動場景音樂系統**完全移除**，改造為使用者主導的播放清單音樂控制系統。使用者可以瀏覽所有可用的音樂模式（synthwave、divination、lofi、ambient 等），建立自訂播放清單，並**完全手動控制**音樂播放。播放器介面將採用 Fallout Pip-Boy 美學風格，使用 shadcn/ui Drawer 作為主播放器介面，Sheet 作為彈窗播放清單。

### 系統 B：節奏編輯器（後台）⭐ 新增

**完全獨立的後台系統**，提供登入使用者創建和編輯節奏 pattern 的功能。使用 16 步驟音序器、AI 節奏生成、Preset 管理，並使用 Web Audio API 合成音效。此系統**不在**音樂播放器內，而是獨立的 `/dashboard/rhythm-editor` 頁面。

### 商業價值
- **完全使用者控制**：移除自動播放，所有音樂由使用者手動啟動和管理
- **提升使用者體驗**：從被動接受場景音樂改為主動控制，提高使用者滿意度
- **增加互動性**：播放清單建立和管理功能增強平台黏性
- **個人化體驗**：使用者可根據個人喜好選擇音樂，提升沉浸感
- **品牌一致性**：Pip-Boy 風格播放器強化 Fallout 主題體驗
- **創意工具提供**：節奏編輯器讓進階使用者創建自訂節奏，增加平台價值 ⭐
- **AI 增強功能**：整合 AI 生成節奏，提供創新的音樂創作體驗 ⭐

### 技術整合
- 整合現有 ProceduralMusicEngine（程序式音樂生成）
- 整合現有 audioStore（Zustand 狀態管理）
- 整合現有 VolumeControl 組件（音量控制）
- 使用 shadcn/ui Drawer 組件（主播放器介面）
- 使用 shadcn/ui Sheet 組件（彈窗播放清單）
- 使用 shadcn/ui 其他組件（保持設計一致性）
- **新增**：Web Audio API 音效合成器（節奏編輯器專用）⭐
- **新增**：AI Provider 整合（節奏生成）⭐
- **新增**：Supabase 配額管理系統（user_ai_quotas）⭐

## 訪客 vs 註冊使用者權限對比 ⭐ v4.0 新增

| 功能 | 訪客（未登入） | 註冊使用者（已登入） |
|------|---------------|---------------------|
| **查看公開歌曲** | ✅ 可以 | ✅ 可以 |
| **查看系統預設歌曲** | ✅ 可以（5 首） | ✅ 可以（5 首） |
| **查看自己的歌曲** | ❌ 無法 | ✅ 可以 |
| **創建節奏歌曲** | ❌ 無法 | ✅ 可以 |
| **儲存歌曲時選擇公開/私密** | ❌ 無法 | ✅ 可以 |
| **建立播放清單** | ✅ 可以（localStorage，上限 1 個清單） | ✅ 可以（資料庫，無限制） |
| **播放清單內歌曲數量** | ⚠️ 上限 4 首 | ✅ 無限制 |
| **播放清單持久化** | ⚠️ localStorage（換裝置會遺失） | ✅ 資料庫（跨裝置同步） |
| **AI 生成節奏** | ❌ 無法（需登入） | ✅ 可以（20 次/天） |

### 歌曲可見性規則

```
訪客可見的歌曲：
├─ 系統預設歌曲（5 首）
│   ├─ Techno
│   ├─ House
│   ├─ Trap
│   ├─ Breakbeat
│   └─ Minimal
└─ 公開的使用者創作歌曲（is_public = true）
    ├─ 使用者 A 的公開歌曲
    ├─ 使用者 B 的公開歌曲
    └─ ...

註冊使用者可見的歌曲：
├─ 系統預設歌曲（5 首）
├─ 公開的使用者創作歌曲（is_public = true）
└─ 自己的私密歌曲（is_public = false, user_id = 自己）
```

## 需求

### 【系統 A】播放清單音樂播放器需求

### 需求 1：音樂模式瀏覽與選擇
**使用者故事**：作為廢土塔羅使用者，我想要瀏覽所有可用的音樂模式，以便選擇符合當前心情的背景音樂。

#### 驗收標準

1. WHEN 使用者開啟播放器介面 THEN 系統 SHALL 顯示所有可用的音樂模式清單
2. WHERE 音樂模式清單中 THE 系統 SHALL 包含以下模式：synthwave、divination、lofi、ambient
3. WHEN 使用者點擊音樂模式 THEN 系統 SHALL 在 500ms 內開始播放該模式
4. IF 音樂模式正在播放 AND 使用者選擇新模式 THEN 系統 SHALL 使用 2 秒 crossfade 平滑切換
5. WHILE 音樂模式載入中 THE 系統 SHALL 顯示 Pip-Boy 風格載入動畫
6. WHERE 每個音樂模式項目中 THE 系統 SHALL 顯示模式名稱、描述和視覺化圖示
7. WHEN 使用者 hover 音樂模式項目 THEN 系統 SHALL 顯示 Pip-Boy 綠色發光效果

### 需求 2：播放控制功能
**使用者故事**：作為廢土塔羅使用者，我想要完整的播放控制功能，以便隨時管理音樂播放狀態。

#### 驗收標準

1. WHEN 使用者點擊播放按鈕 THEN 系統 SHALL 開始播放當前選擇的音樂模式
2. WHEN 使用者點擊暫停按鈕 THEN 系統 SHALL 暫停音樂播放並保留播放位置
3. WHEN 使用者點擊上一首按鈕 THEN 系統 SHALL 切換至播放清單中的上一個音樂模式
4. WHEN 使用者點擊下一首按鈕 THEN 系統 SHALL 切換至播放清單中的下一個音樂模式
5. IF 播放清單處於單曲循環模式 THEN 系統 SHALL 重複播放當前音樂模式
6. IF 播放清單處於列表循環模式 THEN 系統 SHALL 在播放完最後一首後回到第一首
7. IF 播放清單處於隨機播放模式 THEN 系統 SHALL 隨機選擇下一個音樂模式
8. WHEN 音樂切換發生 THEN 系統 SHALL 播放 pip-boy-beep 音效以提供反饋
9. WHERE 播放控制按鈕區域 THE 系統 SHALL 使用 Pip-Boy 綠色邊框和終端機字體

### 需求 3：播放清單管理（已棄用 - 見需求 28）⚠️
**狀態**：此需求已被需求 28（Pattern-Based 播放清單管理）取代

**使用者故事**：作為廢土塔羅使用者，我想要建立和管理自訂播放清單，以便組織我喜愛的音樂模式。

#### 驗收標準（已棄用）

1. ~~WHEN 使用者點擊「新增播放清單」按鈕 THEN 系統 SHALL 顯示播放清單建立對話框~~
2. ~~WHEN 使用者輸入播放清單名稱並確認 THEN 系統 SHALL 建立新的空白播放清單~~
3. ~~WHEN 使用者將音樂模式拖曳至播放清單 THEN 系統 SHALL 將該模式新增至播放清單~~
4. ~~WHEN 使用者點擊播放清單中的刪除按鈕 THEN 系統 SHALL 移除該音樂模式~~
5. ~~WHEN 使用者調整播放清單中的音樂順序 THEN 系統 SHALL 立即儲存新順序至 localStorage~~
6. ~~IF 使用者擁有多個播放清單 THEN 系統 SHALL 提供播放清單切換功能~~
7. ~~WHERE 播放清單名稱輸入欄位 THE 系統 SHALL 限制長度為 30 個字元~~
8. ~~WHEN 使用者刪除播放清單 THEN 系統 SHALL 顯示確認對話框以防誤刪~~

> **遷移說明**：請參考需求 28，播放清單現在包含 Pattern 引用（來自 `user_rhythm_presets`），而非音樂模式。

### 需求 4：Drawer 播放器介面設計
**使用者故事**：作為廢土塔羅使用者，我想要一個符合 Fallout 風格的 Drawer 播放器介面，以便保持沉浸式體驗。

#### 驗收標準

1. WHERE 播放器主介面 THE 系統 SHALL 使用 shadcn/ui Drawer 組件實現
2. WHEN 使用者點擊播放器觸發按鈕 THEN 系統 SHALL 從畫面底部滑入 Drawer 播放器
3. WHERE Drawer 播放器 THE 系統 SHALL 使用 Pip-Boy 綠色主題（#00ff88）
4. WHERE Drawer 文字內容 THE 系統 SHALL 使用終端機風格字體（font-mono）
5. WHEN Drawer 顯示時 THEN 系統 SHALL 包含 CRT 掃描線效果
6. WHERE Drawer 邊框 THE 系統 SHALL 使用 2px Pip-Boy 綠色邊框
7. WHERE 按鈕和互動元素 THE 系統 SHALL 具備綠色發光效果
8. WHERE Drawer 高度 THE 系統 SHALL 為螢幕高度的 60%（可拖曳調整至 30%-90%）
9. WHEN 使用者向下拖曳 Drawer THE 系統 SHALL 最小化為底部浮動控制條
10. WHEN 使用者點擊浮動控制條 THE 系統 SHALL 展開完整 Drawer 播放器
11. WHERE Drawer 動畫 THE 系統 SHALL 使用 300ms ease-out 滑入/滑出效果
12. WHEN 使用者點擊 Drawer 外部區域 OR 按下 Esc 鍵 THEN 系統 SHALL 最小化為浮動控制條
13. WHERE Drawer 內容 THE 系統 SHALL 包含：播放控制按鈕、當前曲目資訊、進度條、音量控制、播放清單按鈕

### 需求 5：音量控制整合
**使用者故事**：作為廢土塔羅使用者，我想要在播放器中直接控制音量，以便快速調整音樂大小。

#### 驗收標準

1. WHERE 播放器介面 THE 系統 SHALL 整合現有 VolumeControl 組件
2. WHEN 使用者調整音樂音量滑桿 THEN 系統 SHALL 即時更新 audioStore 中的 music 音量
3. WHEN 使用者點擊靜音按鈕 THEN 系統 SHALL 切換音樂靜音狀態
4. IF 音樂音量為 0 THEN 系統 SHALL 自動切換靜音圖示為 VolumeX
5. IF 音樂音量 > 0 AND < 50 THEN 系統 SHALL 顯示 Volume1 圖示
6. IF 音樂音量 >= 50 THEN 系統 SHALL 顯示 Volume2 圖示
7. WHERE 音量滑桿 THE 系統 SHALL 使用 Pip-Boy 風格設計（綠色軌道和把手）
8. WHEN 音量變更發生 THEN 系統 SHALL 儲存至 localStorage 以保持持久化

### 需求 6：狀態持久化
**使用者故事**：作為廢土塔羅使用者，我想要系統記住我的音樂偏好，以便下次訪問時繼續使用。

#### 驗收標準

1. WHEN 使用者選擇音樂模式 THEN 系統 SHALL 儲存至 localStorage（鍵：wasteland-tarot-audio）
2. WHEN 使用者建立播放清單 THEN 系統 SHALL 儲存至 localStorage
3. WHEN 使用者調整循環模式 THEN 系統 SHALL 儲存設定至 localStorage
4. WHEN 使用者調整音量 THEN 系統 SHALL 透過 audioStore 儲存至 localStorage
5. WHEN 使用者重新載入頁面 THEN 系統 SHALL 恢復上次的播放狀態
6. IF localStorage 資料損壞 THEN 系統 SHALL 使用預設設定（synthwave 模式）
7. WHERE localStorage 資料結構 THE 系統 SHALL 包含版本號以支援未來資料遷移
8. WHEN 使用者清除瀏覽器資料 THEN 系統 SHALL 顯示提示訊息並重置為預設設定

### 需求 7：鍵盤導航
**使用者故事**：作為廢土塔羅使用者，我想要使用鍵盤控制播放器，以便提高操作效率。

#### 驗收標準

1. WHEN 使用者按下空白鍵 THEN 系統 SHALL 切換播放/暫停狀態
2. WHEN 使用者按下左方向鍵 THEN 系統 SHALL 切換至上一首
3. WHEN 使用者按下右方向鍵 THEN 系統 SHALL 切換至下一首
4. WHEN 使用者按下 M 鍵 THEN 系統 SHALL 切換靜音狀態
5. WHEN 使用者按下 L 鍵 THEN 系統 SHALL 切換循環模式
6. WHEN 使用者按下 Esc 鍵 THEN 系統 SHALL 收合播放器
7. WHERE 鍵盤快捷鍵 THE 系統 SHALL 僅在播放器獲得焦點時生效
8. WHEN 使用者使用 Tab 鍵導航 THEN 系統 SHALL 顯示清晰的焦點指示（綠色外框）

### 需求 8：效能要求
**使用者故事**：作為廢土塔羅使用者，我想要播放器快速響應，以便流暢使用系統。

#### 驗收標準

1. WHEN 使用者切換音樂模式 THEN 系統 SHALL 在 500ms 內開始播放
2. WHERE 記憶體使用 THE 系統 SHALL 不超過現有音訊系統限制（50MB）
3. WHEN 播放器介面渲染時 THEN 系統 SHALL 在 100ms 內完成首次繪製
4. IF 音樂模式切換中 AND 使用者再次點擊 THEN 系統 SHALL 取消前次切換並執行新切換
5. WHERE ProceduralMusicEngine 生成 THE 系統 SHALL 使用 Web Audio API 降低 CPU 使用
6. WHEN 播放器最小化時 THEN 系統 SHALL 釋放不必要的 DOM 元素以節省記憶體
7. IF FPS 低於 30 THEN 系統 SHALL 降級動畫效果以維持流暢度
8. WHERE 音樂切換過渡 THE 系統 SHALL 使用 2 秒 crossfade 以避免突兀感

### 需求 9：無障礙支援
**使用者故事**：作為使用輔助技術的廢土塔羅使用者，我想要播放器支援螢幕閱讀器，以便平等使用音樂功能。

#### 驗收標準

1. WHERE 播放器主容器 THE 系統 SHALL 具備 role="region" 和 aria-label="音樂播放器"
2. WHERE 播放按鈕 THE 系統 SHALL 具備 aria-label="播放" 或 "暫停"（根據狀態）
3. WHERE 音樂模式選項 THE 系統 SHALL 具備 role="radio" 和 aria-checked 屬性
4. WHEN 音樂模式變更 THEN 系統 SHALL 透過 aria-live="polite" 通知螢幕閱讀器
5. WHERE 音量滑桿 THE 系統 SHALL 具備 role="slider" 和 aria-valuenow 屬性
6. IF 使用者啟用 prefers-reduced-motion THEN 系統 SHALL 停用所有動畫效果
7. WHERE 所有互動元素 THE 系統 SHALL 具備明確的 aria-label
8. WHEN 使用者使用鍵盤導航 THEN 系統 SHALL 顯示清晰的焦點指示

### 需求 10：錯誤處理
**使用者故事**：作為廢土塔羅使用者，我想要系統優雅處理錯誤，以便在問題發生時仍能繼續使用。

#### 驗收標準

1. IF ProceduralMusicEngine 初始化失敗 THEN 系統 SHALL 顯示 Pip-Boy 風格錯誤訊息
2. IF 音樂模式載入失敗 THEN 系統 SHALL 自動重試 3 次（根據 MAX_LOAD_RETRIES）
3. IF 重試 3 次後仍失敗 THEN 系統 SHALL 回退至預設 synthwave 模式
4. WHERE 錯誤率 THE 系統 SHALL 監控並在超過 30% 時停用音樂功能（ERROR_RATE_THRESHOLD）
5. WHEN localStorage 寫入失敗 THEN 系統 SHALL 記錄錯誤並繼續運作（不中斷使用者）
6. IF AudioContext 被瀏覽器暫停 THEN 系統 SHALL 顯示提示要求使用者互動以恢復
7. WHERE 錯誤訊息 THE 系統 SHALL 使用 Pip-Boy 綠色文字和終端機風格
8. WHEN 嚴重錯誤發生 THEN 系統 SHALL 提供「重置播放器」按鈕以恢復預設狀態

### 需求 11：移除自動場景音樂系統
**使用者故事**：作為廢土塔羅使用者，我想要音樂完全由我控制，而不是系統自動根據頁面播放，以便擁有完整的自主權。

#### 驗收標準

1. WHEN 使用者進入任何頁面 THEN 系統 SHALL NOT 自動開始播放音樂
2. WHERE 現有場景音樂邏輯（SCENE_MUSIC_MAP） THE 系統 SHALL 完全移除或停用
3. WHEN 使用者切換頁面 THEN 系統 SHALL 保持當前播放狀態（不自動切換音樂）
4. IF 使用者正在播放音樂 AND 切換頁面 THEN 系統 SHALL 繼續播放當前音樂
5. WHERE MusicGenerator 中的場景音樂自動播放邏輯 THE 系統 SHALL 移除或註解
6. WHEN 使用者首次訪問網站 THEN 系統 SHALL 顯示靜音狀態（無音樂播放）
7. WHERE audioStore 初始化 THE 系統 SHALL 設定 isPlaying.music 為 false
8. WHEN 系統啟動時 THEN 系統 SHALL NOT 呼叫任何自動播放音樂的函數

### 需求 12：Sheet 彈窗播放清單介面
**使用者故事**：作為廢土塔羅使用者，我想要隨時開啟播放清單彈窗，以便快速瀏覽和管理我的音樂播放清單。

#### 驗收標準

1. WHERE 播放清單彈窗介面 THE 系統 SHALL 使用 shadcn/ui Sheet 組件實現（桌面和行動裝置通用）
2. WHEN 使用者點擊 Drawer 播放器中的「播放清單」按鈕 THEN 系統 SHALL 從螢幕右側滑入 Sheet 彈窗
3. WHERE Sheet 彈窗寬度 THE 系統 SHALL 在行動裝置（< 768px）為螢幕寬度的 90%，桌面（>= 768px）為固定 400px
4. WHEN Sheet 彈窗開啟時 THEN 系統 SHALL 顯示完整播放清單內容和音樂模式瀏覽器
5. WHERE Sheet 彈窗內容區塊 THE 系統 SHALL 包含：
   - 音樂模式瀏覽器（synthwave、divination、lofi、ambient 四種模式）
   - 當前播放清單顯示（可捲動）
   - 播放清單管理按鈕（新增播放清單、刪除、重新命名）
   - 每個音樂模式的播放按鈕和資訊
6. WHEN 使用者在 Sheet 中點擊音樂模式 THEN 系統 SHALL 立即開始播放該模式
7. WHEN 使用者點擊 Sheet 外部區域 OR 按下 Esc 鍵 THEN 系統 SHALL 關閉 Sheet 彈窗
8. WHERE Sheet 樣式 THE 系統 SHALL 使用 Pip-Boy 綠色主題（#00ff88）和終端機字體（font-mono）
9. WHERE Sheet 動畫 THE 系統 SHALL 使用 300ms ease-out 滑入/滑出效果
10. WHEN Sheet 開啟時 THEN 系統 SHALL 播放 pip-boy-beep 音效以提供反饋
11. WHERE Sheet 背景遮罩 THE 系統 SHALL 使用半透明黑色（rgba(0, 0, 0, 0.8)）
12. WHEN 使用者將音樂模式拖曳至播放清單 THEN 系統 SHALL 在 Sheet 內即時更新播放清單順序
13. WHERE Sheet 標題列 THE 系統 SHALL 包含「播放清單」標題和關閉按鈕（X）
14. WHEN Sheet 內容超出可視區域 THEN 系統 SHALL 提供符合網站風格的自訂捲軸（綠色 thumb）

### 【系統 B】節奏編輯器需求 ⭐ 新增

### 需求 20：獨立節奏編輯器頁面路由與訪問控制
**使用者故事**：作為廢土塔羅登入使用者，我想要訪問獨立的節奏編輯器頁面，以便創建和編輯自訂節奏 pattern。

#### 驗收標準

1. WHERE 節奏編輯器路由 THE 系統 SHALL 建立 `/dashboard/rhythm-editor` 頁面路由
2. WHEN 未登入使用者嘗試訪問 `/dashboard/rhythm-editor` THEN 系統 SHALL 重導向至登入頁面
3. WHERE 存取控制 THE 系統 SHALL 使用現有 auth middleware 保護路由（驗證 Supabase session）
4. WHEN 登入使用者訪問 `/dashboard/rhythm-editor` THEN 系統 SHALL 在 200ms 內載入編輯器介面
5. WHERE 頁面佈局 THE 系統 SHALL 使用完整頁面佈局（非 Drawer 或 Modal）
6. WHERE 設計風格 THE 系統 SHALL 使用 Fallout Pip-Boy 美學（Cubic 11 字體、#00ff88 主色、CRT 效果）
7. WHERE 響應式支援 THE 系統 SHALL 支援桌面（>= 768px）和手機（< 768px）佈局
8. WHEN 使用者 session 過期 THEN 系統 SHALL 顯示「Session 已過期，請重新登入」並重導向至登入頁

### 需求 21：16 步驟音序器 UI
**使用者故事**：作為廢土塔羅登入使用者，我想要使用 16 步驟音序器創建節奏 pattern，以便精確控制每個樂器的節奏。

#### 驗收標準

1. WHERE 音序器軌道 THE 系統 SHALL 顯示 5 個樂器軌道：Kick、Snare、HiHat、OpenHat、Clap
2. WHERE 步驟網格 THE 系統 SHALL 為每個軌道顯示 16 個步驟按鈕（5 × 16 網格）
3. WHEN 使用者點擊步驟格子 THEN 系統 SHALL 切換該格子的啟用/停用狀態（視覺反轉）
4. WHERE 步驟啟用狀態 THE 系統 SHALL 使用 Pip-Boy 綠色（#00ff88）表示啟用，深灰色表示停用
5. WHERE 視覺分組 THE 系統 SHALL 每 4 步驟顯示視覺分隔線（模仿傳統音序器）
6. WHEN 音序器播放時 THEN 系統 SHALL 高亮當前步驟列（使用脈衝動畫）
7. WHERE 軌道標籤 THE 系統 SHALL 在每個軌道左側顯示樂器名稱（Kick、Snare、HiHat、OpenHat、Clap）
8. WHERE Pattern 資料結構 THE 系統 SHALL 使用以下 TypeScript 介面：
   ```typescript
   type InstrumentTrack = 'kick' | 'snare' | 'hihat' | 'openhat' | 'clap';
   type Pattern = {
     kick: boolean[];    // 16 步驟
     snare: boolean[];   // 16 步驟
     hihat: boolean[];   // 16 步驟
     openhat: boolean[]; // 16 步驟
     clap: boolean[];    // 16 步驟
   };
   ```
9. WHERE 響應式佈局 THE 系統 SHALL 在手機上提供橫向捲動網格 + 垂直堆疊控制項

### 需求 22：傳輸控制與 Tempo 調整
**使用者故事**：作為廢土塔羅登入使用者，我想要控制音序器的播放狀態和速度，以便即時調整節奏效果。

#### 驗收標準

1. WHERE 傳輸控制按鈕 THE 系統 SHALL 提供 Play/Pause（切換）、Stop、Clear 按鈕
2. WHEN 使用者點擊 Play/Pause 按鈕 THEN 系統 SHALL 切換播放狀態（播放 ↔ 暫停）
3. WHEN 使用者點擊 Stop 按鈕 THEN 系統 SHALL 停止播放並重置播放頭至步驟 0
4. WHEN 使用者點擊 Clear 按鈕 THEN 系統 SHALL 清空所有軌道的所有步驟（顯示確認對話框）
5. WHERE Tempo 控制 THE 系統 SHALL 提供滑桿控制 BPM 範圍 60-180
6. WHEN 使用者調整 Tempo 滑桿 THEN 系統 SHALL 即時顯示當前 BPM 數值
7. WHEN Tempo 調整時 AND 音序器正在播放 THEN 系統 SHALL 立即調整播放速度（無延遲）
8. WHERE Tempo 預設值 THE 系統 SHALL 設定初始 BPM 為 120
9. WHERE 按鈕樣式 THE 系統 SHALL 使用 Pip-Boy 綠色邊框和發光效果（模仿 sample.html）

### 需求 23：AI 節奏生成功能（需登入）
**使用者故事**：作為廢土塔羅登入使用者，我想要使用 AI 生成節奏 pattern，以便快速獲得創意靈感。

#### 驗收標準

1. WHERE AI 生成介面 THE 系統 SHALL 提供文字輸入框（描述節奏風格，最多 200 字元）
2. WHERE 快速關鍵字按鈕 THE 系統 SHALL 提供預設按鈕：808 Cowbell、Glitch、Jazz Fusion、Afrobeat、Lo-Fi、Stadium Rock、Ambient
3. WHEN 使用者點擊快速關鍵字按鈕 THEN 系統 SHALL 自動填入對應關鍵字至輸入框
4. WHEN 使用者點擊「生成節奏」按鈕 THEN 系統 SHALL 顯示 Pip-Boy 風格載入動畫（旋轉圖示 + "GENERATING RHYTHM..." 文字）
5. WHERE AI Provider 整合 THE 系統 SHALL 使用現有 AI provider 系統（OpenAI/Gemini）
6. WHERE API Endpoint THE 系統 SHALL 呼叫 `POST /api/v1/music/generate-rhythm`
7. WHERE Request Body THE 系統 SHALL 傳送 `{ prompt: string, userId: string }`
8. WHERE Response THE 系統 SHALL 接收 `{ pattern: Pattern, presetName?: string, quotaRemaining: number }`
9. WHEN AI 生成成功 THEN 系統 SHALL 在 3 秒內套用 pattern 至音序器網格
10. IF AI 生成失敗 THEN 系統 SHALL 顯示錯誤訊息「AI 生成失敗，請重試」並保持原 pattern
11. WHERE 配額限制整合 THE 系統 SHALL 整合 `user_ai_quotas` 表（每日生成次數限制）
12. WHEN 使用者達到配額上限 THEN 系統 SHALL 顯示「今日配額已用完（20/20），明日重置」並停用生成按鈕
13. WHERE 配額顯示 THE 系統 SHALL 在 AI 生成區塊顯示剩餘配額（例如：15/20 remaining）

### 需求 24：Preset 系統（預設 + 使用者自訂）
**使用者故事**：作為廢土塔羅登入使用者，我想要載入預設 preset 和儲存自己的 preset，以便快速切換不同節奏風格。

#### 驗收標準

1. WHERE 預設 Preset THE 系統 SHALL 提供以下 5 個預設 preset（來自 sample.html）：
   - Techno
   - House
   - Trap
   - Breakbeat
   - Minimal
2. WHEN 使用者點擊預設 Preset 按鈕 THEN 系統 SHALL 在 200ms 內載入對應 pattern 至音序器
3. WHERE Preset 按鈕樣式 THE 系統 SHALL 使用 Pip-Boy 綠色邊框，啟用時背景填滿綠色
4. WHEN 使用者點擊「儲存 Preset」按鈕 THEN 系統 SHALL 顯示命名對話框（最多 30 字元）
5. WHEN 使用者輸入 Preset 名稱並確認 THEN 系統 SHALL 儲存當前 pattern 至 `user_rhythm_presets` 表
6. WHERE 資料庫儲存 THE 系統 SHALL 使用以下欄位：
   - `id`：UUID
   - `user_id`：UUID（FK 至 auth.users）
   - `name`：TEXT（Preset 名稱）
   - `pattern`：JSONB（Pattern 資料）
   - `created_at`：TIMESTAMP
   - `updated_at`：TIMESTAMP
7. WHERE 使用者 Preset 列表 THE 系統 SHALL 顯示使用者儲存的所有 preset（捲動列表）
8. WHEN 使用者點擊自訂 Preset THEN 系統 SHALL 載入對應 pattern 至音序器
9. WHEN 使用者點擊自訂 Preset 的刪除按鈕 THEN 系統 SHALL 顯示確認對話框並刪除該 preset
10. WHERE Preset 數量限制 THE 系統 SHALL 限制每位使用者最多儲存 10 個自訂 preset
11. WHEN 使用者達到 preset 上限 THEN 系統 SHALL 顯示「已達上限（10 個），請刪除舊 preset」

### 需求 25：Web Audio API 音效合成（參考 sample.html）
**使用者故事**：作為廢土塔羅登入使用者，我想要聽到真實的合成鼓聲音效，以便評估我創建的節奏 pattern。

#### 驗收標準

1. WHERE 音訊合成 THE 系統 SHALL 使用 Web Audio API 合成所有樂器音效（不使用現有 ProceduralMusicEngine）
2. WHERE AudioContext THE 系統 SHALL 建立獨立的 AudioContext 實例（不干擾前台音樂播放器）
3. WHERE Kick 音效 THE 系統 SHALL 使用以下合成參數（參考 sample.html）：
   - OscillatorNode：frequency 150 Hz → 0.01 Hz（exponentialRamp 0.5s）
   - GainNode：gain 1.0 → 0.01（exponentialRamp 0.5s）
   - 波形：sine
4. WHERE Snare 音效 THE 系統 SHALL 使用白噪音 + 振盪器混合：
   - NoiseBuffer：白噪音（AudioBufferSourceNode）
   - OscillatorNode：triangle wave @ 180 Hz
   - BiquadFilterNode：highpass @ 1000 Hz
   - Envelope：Attack 0.01s, Decay 0.15s
5. WHERE HiHat 音效 THE 系統 SHALL 使用高頻方波：
   - OscillatorNode：square wave @ 10000 Hz
   - BiquadFilterNode：highpass @ 7000 Hz
   - Envelope：Attack 0.01s, Decay 0.05s
6. WHERE OpenHat 音效 THE 系統 SHALL 使用高頻方波（延長 decay）：
   - OscillatorNode：square wave @ 10000 Hz
   - BiquadFilterNode：highpass @ 7000 Hz
   - Envelope：Attack 0.01s, Decay 0.3s
7. WHERE Clap 音效 THE 系統 SHALL 使用白噪音：
   - NoiseBuffer：白噪音
   - BiquadFilterNode：bandpass @ 1500 Hz
   - Envelope：Attack 0.01s, Decay 0.1s
8. WHEN 步驟啟用 AND 播放頭到達該步驟 THEN 系統 SHALL 觸發對應樂器音效
9. WHERE 音效播放函數 THE 系統 SHALL 實作 `playSound(instrument: InstrumentTrack, time: number)` 方法
10. WHEN 音序器停止 THEN 系統 SHALL 釋放所有 AudioNode 以節省記憶體

### 需求 26：後端 API 整合（AI 生成與 Preset 管理）
**使用者故事**：作為系統管理員，我想要後端 API 支援節奏 AI 生成和 Preset 管理，以便提供完整的節奏編輯功能。

#### 驗收標準

1. WHERE AI 生成 API THE 系統 SHALL 提供 `POST /api/v1/music/generate-rhythm` endpoint
2. WHERE Request 格式 THE API SHALL 接受：
   ```json
   {
     "prompt": "808 cowbell rhythm"
   }
   ```
3. WHERE Response 格式 THE API SHALL 回傳：
   ```json
   {
     "pattern": {
       "kick": [true, false, false, false, ...],
       "snare": [false, false, false, false, ...],
       "hihat": [false, false, true, false, ...],
       "openhat": [false, false, false, false, ...],
       "clap": [false, false, false, false, ...]
     },
     "quotaRemaining": 15
   }
   ```
4. WHERE 配額檢查 THE API SHALL 在生成前檢查 `user_ai_quotas` 表（每日限制 20 次）
5. IF 配額用盡 THEN API SHALL 回傳 400 錯誤：
   ```json
   {
     "error": "Daily quota exceeded",
     "quotaLimit": 20,
     "quotaUsed": 20,
     "resetAt": "2025-10-14T00:00:00Z"
   }
   ```
6. WHERE 儲存 Preset API THE 系統 SHALL 提供 `POST /api/v1/music/presets` endpoint
7. WHERE 儲存 Request THE API SHALL 接受：
   ```json
   {
     "name": "My Techno Beat",
     "pattern": { ... }
   }
   ```
8. WHERE 儲存 Response THE API SHALL 回傳：
   ```json
   {
     "id": "uuid",
     "name": "My Techno Beat",
     "pattern": { ... },
     "createdAt": "2025-10-13T12:00:00Z"
   }
   ```
9. WHERE 獲取 Preset 列表 API THE 系統 SHALL 提供 `GET /api/v1/music/presets` endpoint
10. WHERE 刪除 Preset API THE 系統 SHALL 提供 `DELETE /api/v1/music/presets/:id` endpoint
11. WHERE 認證 THE 所有 API SHALL 使用 `Authorization: Bearer <token>` 驗證 Supabase session

### 需求 27：UI/UX 設計與無障礙
**使用者故事**：作為廢土塔羅登入使用者，我想要節奏編輯器具備 Fallout 美學和無障礙支援，以便沉浸式使用並支援所有使用者。

#### 驗收標準

1. WHERE 設計系統 THE 系統 SHALL 使用 Fallout Pip-Boy 綠色終端機美學（#00ff88、Cubic 11 字體）
2. WHERE 圖示系統 THE 系統 SHALL 使用 PixelIcon 圖示（不使用 lucide-react）
3. WHERE 響應式佈局 THE 系統 SHALL 在桌面顯示完整網格，手機提供橫向捲動
4. WHERE 無障礙標籤 THE 系統 SHALL 為所有互動元素提供完整 ARIA 標籤：
   - 步驟格子：`aria-label="Kick 步驟 1"`
   - 播放按鈕：`aria-label="播放節奏"` / `aria-label="暫停節奏"`
   - Tempo 滑桿：`role="slider" aria-valuenow={bpm} aria-valuemin="60" aria-valuemax="180"`
5. WHERE 鍵盤操作 THE 系統 SHALL 支援以下快捷鍵：
   - 空白鍵：播放/暫停
   - 方向鍵：移動焦點於步驟格子
   - Enter：切換當前格子狀態
   - Delete：清空所有軌道（需確認）
6. WHERE Screen Reader 支援 THE 系統 SHALL 使用 `aria-live="polite"` 通知播放狀態變更
7. IF 使用者啟用 `prefers-reduced-motion` THEN 系統 SHALL 停用所有動畫效果
8. WHERE 顏色對比度 THE 系統 SHALL 確保 Pip-Boy 綠色與背景對比度 > 4.5:1

---

## 🔄 系統整合需求（Pattern-Based 架構）⭐ 新增

### 需求 28：播放清單管理（Pattern-Based）
**使用者故事**：作為廢土塔羅使用者，我想要建立播放清單並加入自己或系統的 pattern，以便組織和播放自訂節奏。

#### 驗收標準

1. WHEN 使用者建立新播放清單 THEN 系統 SHALL 在 `playlists` 表中建立記錄
2. WHEN 使用者將 pattern 加入播放清單 THEN 系統 SHALL 在 `playlist_patterns` 表中建立關聯
3. WHEN 使用者調整 pattern 順序 THEN 系統 SHALL 更新 `position` 欄位
4. WHEN 使用者移除 pattern THEN 系統 SHALL 刪除對應的 `playlist_patterns` 記錄
5. WHERE 使用者只能編輯自己的播放清單 THEN 系統 SHALL 驗證 `user_id` 擁有權
6. WHERE 播放清單內容 THE 系統 SHALL 支援同時包含系統預設 pattern 和使用者自訂 pattern
7. WHEN 使用者刪除播放清單 THEN 系統 SHALL 級聯刪除所有關聯的 `playlist_patterns` 記錄
8. WHERE 播放清單公開設定 THE 系統 SHALL 允許使用者設定 `is_public` 欄位（未來功能）
9. WHEN 使用者查看播放清單 THEN 系統 SHALL 透過 JOIN 查詢回傳完整的 pattern 資料

**資料模型**：
```typescript
interface Playlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  patterns: PlaylistPattern[];  // ⭐ 包含 pattern 引用
  createdAt: Date;
  updatedAt: Date;
}

interface PlaylistPattern {
  id: string;
  playlistId: string;
  patternId: string;
  position: number;
  pattern: RhythmPreset;  // 完整的 pattern 資料（join）
  createdAt: Date;
}
```

**資料庫結構**：
```sql
CREATE TABLE playlist_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  pattern_id UUID NOT NULL REFERENCES user_rhythm_presets(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(playlist_id, position),
  UNIQUE(playlist_id, pattern_id)  -- 同一 pattern 不能重複加入
);

CREATE INDEX idx_playlist_patterns_playlist_id ON playlist_patterns(playlist_id);
CREATE INDEX idx_playlist_patterns_pattern_id ON playlist_patterns(pattern_id);
```

### 需求 29：系統預設 Pattern 管理
**使用者故事**：作為廢土塔羅使用者，我想要使用系統提供的預設 pattern 作為可播放的「歌曲」，以便快速開始體驗音樂功能。

#### 驗收標準

1. WHEN 系統初始化 THEN 系統 SHALL 自動建立 5 個預設 pattern（`is_system_preset = true`）
2. WHERE pattern 為系統預設 THEN 系統 SHALL 使用特殊系統帳號（`user_id = '00000000-0000-0000-0000-000000000000'`）
3. WHEN 使用者查看可用 pattern THEN 系統 SHALL 顯示所有系統預設 + 使用者自己的 pattern
4. WHEN 使用者將系統預設 pattern 加入播放清單 THEN 系統 SHALL 允許操作（不需擁有該 pattern）
5. WHERE pattern 為系統預設 THEN 系統 SHALL 禁止刪除或修改
6. WHERE 系統預設 pattern THE 系統 SHALL 包含以下 5 個預設：Techno、House、Trap、Breakbeat、Minimal
7. WHERE pattern 資料結構 THE 系統 SHALL 在 `user_rhythm_presets` 表中儲存 JSONB 格式
8. WHEN 使用者區分系統預設與自訂 pattern THEN 系統 SHALL 透過 `is_system_preset` 欄位標記
9. WHERE API 回應 THE 系統 SHALL 分別回傳 `systemPresets` 和 `userPresets` 陣列

**系統預設 Pattern 定義**：
```typescript
const SYSTEM_PRESETS: RhythmPreset[] = [
  {
    name: 'Techno',
    description: '經典 Techno 節奏',
    pattern: {
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]
    }
  },
  {
    name: 'House',
    description: 'House 音樂節奏',
    pattern: {
      kick:    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      hihat:   [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      openhat: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
      clap:    [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]
    }
  },
  {
    name: 'Trap',
    description: 'Trap 節奏',
    pattern: {
      kick:    [1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0],
      snare:   [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      hihat:   [1,0,1,0,1,0,1,0,1,1,0,1,0,1,1,1],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
      clap:    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]
    }
  },
  {
    name: 'Breakbeat',
    description: 'Breakbeat 節奏',
    pattern: {
      kick:    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0],
      snare:   [0,0,0,0,1,0,0,0,0,1,0,0,1,0,0,0],
      hihat:   [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
      clap:    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    }
  },
  {
    name: 'Minimal',
    description: 'Minimal 節奏',
    pattern: {
      kick:    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
      snare:   [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      hihat:   [0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1],
      openhat: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      clap:    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]
    }
  }
];
```

**資料庫遷移腳本**：
```sql
-- 1. 更新 user_rhythm_presets（加入系統預設標記）
ALTER TABLE user_rhythm_presets
ADD COLUMN IF NOT EXISTS is_system_preset BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. 插入系統預設 pattern
INSERT INTO user_rhythm_presets (user_id, name, description, pattern, is_system_preset)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'Techno', '經典 Techno 節奏',
   '{"kick": [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], "snare": [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], "hihat": [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], "openhat": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], "clap": [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]}'::jsonb, true),
  ('00000000-0000-0000-0000-000000000000', 'House', 'House 音樂節奏',
   '{"kick": [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], "snare": [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], "hihat": [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], "openhat": [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1], "clap": [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]}'::jsonb, true),
  ('00000000-0000-0000-0000-000000000000', 'Trap', 'Trap 節奏',
   '{"kick": [1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0], "snare": [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], "hihat": [1,0,1,0,1,0,1,0,1,1,0,1,0,1,1,1], "openhat": [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0], "clap": [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]}'::jsonb, true),
  ('00000000-0000-0000-0000-000000000000', 'Breakbeat', 'Breakbeat 節奏',
   '{"kick": [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0], "snare": [0,0,0,0,1,0,0,0,0,1,0,0,1,0,0,0], "hihat": [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], "openhat": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0], "clap": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}'::jsonb, true),
  ('00000000-0000-0000-0000-000000000000', 'Minimal', 'Minimal 節奏',
   '{"kick": [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0], "snare": [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], "hihat": [0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1], "openhat": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "clap": [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]}'::jsonb, true)
ON CONFLICT DO NOTHING;
```

### 需求 30：播放器整合節奏播放
**使用者故事**：作為廢土塔羅使用者，我想要音樂播放器能夠播放播放清單中的 pattern，以便欣賞自訂節奏音樂。

#### 驗收標準

1. WHEN 使用者選擇播放清單並點擊播放 THEN 系統 SHALL 載入第一個 pattern 並開始播放
2. WHEN pattern 播放完畢（例如 4 個循環後）THEN 系統 SHALL 自動播放下一個 pattern
3. WHEN 使用者點擊上一首/下一首 THEN 系統 SHALL 切換到對應 pattern
4. WHEN 使用者啟用隨機播放 THEN 系統 SHALL 隨機選擇下一個 pattern
5. WHEN 使用者啟用循環播放 THEN 系統 SHALL 在播放清單結束後重新開始
6. WHERE pattern 播放 THE 系統 SHALL 使用 RhythmAudioSynthesizer 合成音訊（Web Audio API）
7. WHERE 播放循環邏輯 THE 系統 SHALL 每個 pattern 預設循環 4 次後切換下一首
8. WHEN 使用者調整 BPM THEN 系統 SHALL 即時調整播放速度（預設 120 BPM）
9. WHERE 當前播放資訊 THE 系統 SHALL 顯示 pattern 名稱、播放清單名稱、播放進度
10. WHEN pattern 切換時 THEN 系統 SHALL 使用 2 秒 crossfade 平滑過渡（若支援）
11. WHERE 播放狀態持久化 THE 系統 SHALL 儲存當前播放清單、pattern 索引、播放位置至 localStorage

**播放邏輯實作**：
```typescript
class PlaylistPlayer {
  private currentPlaylist: Playlist;
  private currentPatternIndex: number = 0;
  private synthesizer: RhythmAudioSynthesizer;
  private loopCount: number = 0;
  private maxLoopsPerPattern: number = 4;  // 每個 pattern 循環 4 次

  async playPattern(pattern: Pattern): Promise<void> {
    // 使用 RhythmAudioSynthesizer 播放 pattern
    await this.synthesizer.loadPattern(pattern);
    this.synthesizer.play();
  }

  onPatternComplete(): void {
    this.loopCount++;
    if (this.loopCount >= this.maxLoopsPerPattern) {
      this.loopCount = 0;
      this.nextPattern();
    } else {
      // 繼續循環當前 pattern
      this.synthesizer.restart();
    }
  }

  nextPattern(): void {
    // 播放下一個 pattern
    const nextIndex = (this.currentPatternIndex + 1) % this.currentPlaylist.patterns.length;
    this.currentPatternIndex = nextIndex;
    this.playPattern(this.currentPlaylist.patterns[nextIndex].pattern);
  }

  previousPattern(): void {
    // 播放上一個 pattern
    const prevIndex = this.currentPatternIndex === 0
      ? this.currentPlaylist.patterns.length - 1
      : this.currentPatternIndex - 1;
    this.currentPatternIndex = prevIndex;
    this.playPattern(this.currentPlaylist.patterns[prevIndex].pattern);
  }

  randomPattern(): void {
    // 隨機播放
    const randomIndex = Math.floor(Math.random() * this.currentPlaylist.patterns.length);
    this.currentPatternIndex = randomIndex;
    this.playPattern(this.currentPlaylist.patterns[randomIndex].pattern);
  }
}
```

**前端整合範例**：
```typescript
// 播放清單選擇器
function PlaylistSelector() {
  const { playlists } = usePlaylistManager();
  const { loadPlaylist, play } = useMusicPlayer();

  return (
    <select onChange={(e) => {
      const playlist = playlists.find(p => p.id === e.target.value);
      loadPlaylist(playlist);
      play();
    }}>
      {playlists.map(playlist => (
        <option key={playlist.id} value={playlist.id}>
          {playlist.name} ({playlist.patterns.length} 首)
        </option>
      ))}
    </select>
  );
}

// 當前播放資訊
function NowPlaying() {
  const { currentPattern, currentPlaylist } = useMusicPlayer();

  return (
    <div>
      <div className="text-pip-boy-green font-cubic">
        {currentPlaylist?.name}
      </div>
      <div className="text-2xl font-bold">
        {currentPattern?.name}
      </div>
      <div className="text-sm text-gray-400">
        {currentPattern?.description}
      </div>
    </div>
  );
}
```

### 【系統 C】訪客與公開歌曲系統需求 ⭐ 新增

### 需求 31：訪客瀏覽公開歌曲
**使用者故事**：作為訪客（未登入使用者），我想要瀏覽所有公開的歌曲（系統預設 + 使用者公開創作），以便試用音樂系統功能。

#### 驗收標準

1. WHEN 訪客訪問歌曲列表頁 THEN 系統 SHALL 顯示所有 `is_system_preset = true` 的歌曲
2. WHEN 訪客訪問歌曲列表頁 THEN 系統 SHALL 顯示所有 `is_public = true` 的使用者創作歌曲
3. WHERE 歌曲為私密（`is_public = false`）THEN 系統 SHALL NOT 顯示給訪客
4. WHEN 訪客點擊公開歌曲 THEN 系統 SHALL 顯示歌曲詳情（名稱、描述、pattern）
5. WHEN 訪客點擊「加入播放清單」THEN 系統 SHALL 將歌曲加入 localStorage 播放清單
6. WHERE 歌曲列表顯示 THE 系統 SHALL 顯示創作者名稱（使用者創作歌曲）或「系統預設」標籤
7. WHERE 分頁 THE 系統 SHALL 支援分頁瀏覽（每頁 20 首，上限 100 首/頁）
8. WHERE 排序 THE 系統 SHALL 支援按建立時間、名稱排序（created_at_desc | created_at_asc | name_asc | name_desc）

**API 端點**：
```http
GET /api/v1/music/presets/public
Authorization: Optional

Query Parameters:
- page: integer (default: 1)
- limit: integer (default: 20, max: 100)
- sort: string (created_at_desc | created_at_asc | name_asc | name_desc)

Response (200):
{
  "systemPresets": [
    {
      "id": "uuid",
      "name": "Techno",
      "description": "經典 Techno 節奏",
      "isSystemPreset": true,
      "isPublic": true,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "publicPresets": [
    {
      "id": "uuid",
      "name": "我的 House Mix",
      "description": "自訂的 House 節奏",
      "userId": "uuid",
      "userName": "使用者A",
      "isPublic": true,
      "createdAt": "2025-01-13T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 150,
    "totalPages": 8
  }
}
```

### 需求 32：使用者創作歌曲時選擇公開/私密
**使用者故事**：作為註冊使用者，我想要在儲存節奏歌曲時選擇是否公開，以便與其他使用者分享我的創作。

#### 驗收標準

1. WHEN 使用者在節奏編輯器中點擊「儲存」THEN 系統 SHALL 顯示儲存對話框
2. WHERE 儲存對話框 THEN 系統 SHALL 提供「公開分享」勾選框（預設：未勾選/私密）
3. WHEN 使用者勾選「公開分享」並儲存 THEN 系統 SHALL 設定 `is_public = true`
4. WHEN 使用者未勾選「公開分享」並儲存 THEN 系統 SHALL 設定 `is_public = false`
5. WHEN 使用者儲存後 THEN 系統 SHALL 顯示確認訊息「已儲存為公開歌曲」或「已儲存為私密歌曲」
6. WHERE 編輯現有歌曲 THE 系統 SHALL 允許使用者變更公開/私密狀態
7. WHERE 公開歌曲 THE 系統 SHALL 在歌曲列表顯示「公開」標籤
8. WHERE 私密歌曲 THE 系統 SHALL 在歌曲列表顯示「私密」標籤（僅使用者自己可見）

**UI 設計**：
```typescript
// 儲存對話框
<Dialog>
  <DialogTitle>儲存節奏</DialogTitle>
  <DialogContent>
    <Input
      label="歌曲名稱"
      value={name}
      maxLength={50}
      required
    />
    <Textarea
      label="描述（可選）"
      value={description}
      maxLength={200}
    />
    <Checkbox
      label="公開分享"
      description="勾選後其他使用者（含訪客）可以查看並使用此節奏"
      checked={isPublic}
      onChange={setIsPublic}
    />
  </DialogContent>
  <DialogActions>
    <Button variant="secondary" onClick={onCancel}>取消</Button>
    <Button variant="primary" onClick={handleSave}>儲存</Button>
  </DialogActions>
</Dialog>
```

**API 端點**：
```http
POST /api/v1/music/presets
Authorization: Bearer <token>

Request Body:
{
  "name": "我的 Techno Mix",
  "description": "自訂的 Techno 節奏",
  "pattern": {
    "kick": [1,0,0,0, ...],
    "snare": [0,0,0,0, ...],
    ...
  },
  "isPublic": true
}

Response (201):
{
  "id": "uuid",
  "userId": "uuid",
  "name": "我的 Techno Mix",
  "description": "自訂的 Techno 節奏",
  "isPublic": true,
  "createdAt": "2025-01-13T12:00:00Z",
  "message": "已儲存為公開歌曲"
}
```

```http
PUT /api/v1/music/presets/{preset_id}
Authorization: Bearer <token>

Request Body:
{
  "name": "更新名稱",
  "description": "更新描述",
  "isPublic": false
}

Response (200):
{
  "id": "uuid",
  "name": "更新名稱",
  "isPublic": false,
  "message": "已更新為私密歌曲"
}
```

### 需求 33：訪客播放清單（localStorage）
**使用者故事**：作為訪客，我想要建立一個播放清單，以便試用音樂播放功能，但我知道這是臨時的且有限制。

#### 驗收標準

1. WHEN 訪客訪問音樂播放器 THEN 系統 SHALL 從 localStorage 讀取播放清單（key: `guest_playlist`）
2. WHEN 訪客首次訪問 THEN 系統 SHALL 建立空的播放清單
3. WHEN 訪客加入歌曲到播放清單 THEN 系統 SHALL 檢查歌曲數量
4. WHERE 播放清單已有 4 首歌曲 THEN 系統 SHALL 顯示「訪客播放清單已滿（上限 4 首），請註冊以解除限制」
5. WHEN 訪客加入歌曲成功 THEN 系統 SHALL 儲存到 localStorage
6. WHEN 訪客移除歌曲 THEN 系統 SHALL 更新 localStorage
7. WHERE 播放清單顯示 THE 系統 SHALL 顯示「訪客播放清單（{count}/4 首）」
8. WHERE 資料清除 THE 系統 SHALL 在播放清單介面提示「訪客資料會在清除瀏覽器資料時遺失」
9. WHEN 訪客清空瀏覽器資料 THEN 播放清單 SHALL 遺失（正常行為）
10. WHERE 播放清單名稱 THE 系統 SHALL 固定使用「訪客播放清單」（不可修改）

**localStorage 資料結構**：
```typescript
interface GuestPlaylist {
  id: string;  // 固定為 "guest-playlist-local"
  name: string;  // 固定為「訪客播放清單」
  patterns: Array<{
    patternId: string;  // 引用 DB 中的 pattern ID
    position: number;
    addedAt: string;  // ISO timestamp
  }>;
  createdAt: string;
  updatedAt: string;
}

// localStorage 儲存範例
const guestPlaylist: GuestPlaylist = {
  id: "guest-playlist-local",
  name: "訪客播放清單",
  patterns: [
    { patternId: "uuid-1", position: 0, addedAt: "2025-01-13T12:00:00Z" },
    { patternId: "uuid-2", position: 1, addedAt: "2025-01-13T12:05:00Z" }
  ],
  createdAt: "2025-01-13T12:00:00Z",
  updatedAt: "2025-01-13T12:05:00Z"
};

localStorage.setItem('guest_playlist', JSON.stringify(guestPlaylist));
```

**限制提示 UI**：
```typescript
// 當訪客嘗試加入第 5 首歌曲時
<Alert variant="warning">
  <PixelIcon name="alert-triangle" variant="warning" sizePreset="sm" decorative />
  <AlertTitle>訪客播放清單已滿</AlertTitle>
  <AlertDescription>
    訪客最多只能加入 4 首歌曲到播放清單。
    <Link href="/auth/register" className="underline">立即註冊</Link>以解除限制，享受無限播放清單！
  </AlertDescription>
</Alert>

// 播放清單標題顯示
<div className="flex items-center justify-between">
  <h3 className="font-cubic text-pip-boy-green">訪客播放清單</h3>
  <span className="text-sm text-muted">
    {guestPlaylist.patterns.length}/4 首
  </span>
</div>
<p className="text-xs text-warning mt-1">
  ⚠️ 訪客資料會在清除瀏覽器資料時遺失
</p>
```

### 需求 34：註冊使用者播放清單（無限制）
**使用者故事**：作為註冊使用者，我想要建立無限數量的播放清單，每個清單包含無限首歌曲，以便完整使用音樂系統。

#### 驗收標準

1. WHEN 使用者登入 THEN 系統 SHALL 從資料庫載入所有播放清單
2. WHEN 使用者建立新播放清單 THEN 系統 SHALL NOT 限制清單數量
3. WHEN 使用者加入歌曲到播放清單 THEN 系統 SHALL NOT 限制歌曲數量
4. WHEN 使用者切換裝置並登入 THEN 系統 SHALL 同步顯示所有播放清單
5. WHEN 使用者登出 THEN 系統 SHALL 清除本地快取的播放清單資料
6. WHERE 播放清單顯示 THE 系統 SHALL 顯示「我的播放清單（共 {count} 個）」
7. WHERE 歌曲數量顯示 THE 系統 SHALL 顯示「{playlistName}（{songCount} 首）」
8. WHERE 跨裝置同步 THE 系統 SHALL 在 5 秒內完成資料同步

**API 端點**：
```http
GET /api/v1/playlists
Authorization: Bearer <token>

Response (200):
{
  "playlists": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "我的 Techno 合集",
      "description": "最愛的 Techno 節奏",
      "patternCount": 15,
      "createdAt": "2025-01-10T12:00:00Z",
      "updatedAt": "2025-01-13T12:00:00Z"
    },
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "放鬆時刻",
      "patternCount": 8,
      "createdAt": "2025-01-12T15:00:00Z"
    }
  ],
  "totalCount": 2
}
```

**UI 設計**：
```typescript
// 使用者播放清單列表
<div>
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-cubic text-pip-boy-green">我的播放清單</h3>
    <span className="text-sm text-muted">共 {playlists.length} 個</span>
  </div>
  <Button onClick={createNewPlaylist}>
    <PixelIcon name="plus" sizePreset="xs" decorative />
    建立新播放清單
  </Button>
  <div className="space-y-2 mt-4">
    {playlists.map(playlist => (
      <PlaylistCard key={playlist.id} playlist={playlist}>
        <div className="flex items-center justify-between">
          <span className="font-cubic">{playlist.name}</span>
          <span className="text-sm text-muted">{playlist.patternCount} 首</span>
        </div>
      </PlaylistCard>
    ))}
  </div>
</div>
```

### 需求 35：訪客轉註冊使用者時的播放清單遷移
**使用者故事**：作為剛註冊的使用者，我想要將訪客模式建立的播放清單匯入到我的帳號，以便保留我的選擇。

#### 驗收標準

1. WHEN 訪客完成註冊並首次登入 THEN 系統 SHALL 檢查 localStorage 是否有 `guest_playlist`
2. WHERE localStorage 有訪客播放清單 THEN 系統 SHALL 顯示匯入對話框
3. WHEN 使用者點擊「匯入」THEN 系統 SHALL 建立新播放清單並加入所有歌曲
4. WHEN 使用者點擊「跳過」THEN 系統 SHALL 清除 localStorage 的 `guest_playlist`
5. WHEN 匯入完成 THEN 系統 SHALL 清除 localStorage 的 `guest_playlist`
6. WHERE 匯入播放清單名稱 THE 系統 SHALL 使用「訪客播放清單（已匯入）」
7. WHERE 匯入失敗 THE 系統 SHALL 顯示錯誤訊息且不清除 localStorage（使用者可重試）
8. WHEN 匯入成功 THEN 系統 SHALL 顯示確認訊息「已成功匯入 {count} 首歌曲」

**UI 流程**：
```typescript
// 註冊完成後首次登入時顯示
<Dialog open={hasGuestPlaylist}>
  <DialogTitle>匯入訪客播放清單</DialogTitle>
  <DialogContent>
    <p className="mb-2">
      你在訪客模式時建立了一個包含 <strong>{guestPlaylist.patterns.length} 首歌曲</strong>的播放清單。
    </p>
    <p>是否要將這些歌曲匯入到你的帳號中？</p>
    <Alert variant="info" className="mt-4">
      <PixelIcon name="info" variant="info" sizePreset="sm" decorative />
      <AlertDescription>
        匯入後將建立名為「訪客播放清單（已匯入）」的新播放清單
      </AlertDescription>
    </Alert>
  </DialogContent>
  <DialogActions>
    <Button variant="secondary" onClick={handleSkip}>
      <PixelIcon name="close" sizePreset="xs" decorative />
      跳過
    </Button>
    <Button variant="primary" onClick={handleImport}>
      <PixelIcon name="download" sizePreset="xs" decorative />
      匯入到我的帳號
    </Button>
  </DialogActions>
</Dialog>

// 匯入成功提示
<Toast variant="success">
  <PixelIcon name="check" variant="success" sizePreset="sm" decorative />
  已成功匯入 {count} 首歌曲到「訪客播放清單（已匯入）」
</Toast>
```

**API 端點**：
```http
POST /api/v1/playlists/import-guest
Authorization: Bearer <token>

Request Body:
{
  "guestPlaylist": {
    "patterns": [
      { "patternId": "uuid-1", "position": 0 },
      { "patternId": "uuid-2", "position": 1 }
    ]
  }
}

Response (201):
{
  "playlistId": "uuid",
  "name": "訪客播放清單（已匯入）",
  "patternCount": 2,
  "message": "已成功匯入 2 首歌曲"
}

Error Response (400):
{
  "error": "INVALID_PATTERN_ID",
  "message": "部分歌曲 ID 無效，請重試",
  "invalidPatternIds": ["uuid-3"]
}
```

## 非功能性需求

### 效能需求
- **音樂切換延遲**：< 500ms（播放器）
- **節奏編輯器載入時間**：< 200ms（頁面初始化）⭐
- **AI 生成回應時間**：< 3 秒（LLM API 呼叫）⭐
- **音效合成延遲**：< 10ms（Web Audio API 觸發）⭐
- **介面渲染時間**：< 100ms
- **記憶體使用上限**：50MB（整合現有音訊系統限制）
- **CPU 使用率**：維持 FPS >= 30

### 相容性需求
- **瀏覽器支援**：Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Web Audio API 支援**：所有主流瀏覽器（Chrome 90+、Firefox 88+、Safari 14.1+）⭐
- **響應式設計**：支援桌面（>= 768px）和行動裝置（< 768px）
- **觸控支援**：支援觸控手勢和滑動操作

### 安全性需求
- **資料儲存**：僅使用 localStorage（不涉及敏感資料）
- **XSS 防護**：所有使用者輸入（播放清單名稱）需經過 sanitize
- **CORS 策略**：遵循現有 CORS 設定
- **API 認證**：所有節奏編輯器 API 使用 Supabase Auth token 驗證 ⭐
- **Row Level Security**：Preset 表使用 RLS policy（僅訪問自己的 preset）⭐
- **配額限制**：每日 AI 生成次數限制（20 次/天）⭐

### 可維護性需求
- **TypeScript**：所有程式碼使用 TypeScript 5 嚴格模式
- **元件化**：播放器和節奏編輯器拆分為獨立可重用元件
- **測試覆蓋率**：單元測試覆蓋率 >= 80%
- **文件化**：所有公開 API 需包含 JSDoc
- **音訊模組分離**：節奏編輯器音訊合成器與播放器音訊引擎完全獨立 ⭐

### 無障礙需求
- **WCAG 2.1 AA 合規**：符合 AA 等級無障礙標準
- **螢幕閱讀器支援**：完整 ARIA 標籤
- **鍵盤導航**：所有功能可透過鍵盤操作
- **顏色對比度**：Pip-Boy 綠色（#00ff88）與黑色背景對比度 > 4.5:1
- **動畫控制**：支援 `prefers-reduced-motion` 偏好設定 ⭐

## 技術限制與依賴

### 現有架構依賴
- **ProceduralMusicEngine**：程序式音樂生成引擎（`/src/lib/audio/ProceduralMusicEngine.ts`）- 僅用於播放器
- **audioStore**：Zustand 音訊狀態管理（`/src/lib/audio/audioStore.ts`）
- **VolumeControl**：音量控制組件（`/src/components/audio/VolumeControl.tsx`）
- **constants.ts**：音訊系統常數（包含 SCENE_MUSIC_MAP）

### 技術堆疊
- **前端框架**：Next.js 15 (App Router)
- **狀態管理**：Zustand 4.5+
- **UI 組件庫**：shadcn/ui（Radix UI primitives）
  - **Drawer 組件**：主播放器介面（從底部滑入）
  - **Sheet 組件**：播放清單彈窗（從右側滑入）
  - **Popover 組件**：音量控制彈窗
  - **Slider 組件**：音量滑桿、Tempo 控制 ⭐
- **樣式方案**：Tailwind CSS v4
- **TypeScript**：TypeScript 5（嚴格模式）
- **套件管理**：Bun
- **後端框架**：FastAPI (Python) ⭐
- **資料庫**：Supabase PostgreSQL ⭐
- **認證系統**：Supabase Auth（現有系統）⭐
- **AI 服務**：
  - **OpenAI API**：GPT-4 Turbo / GPT-3.5 Turbo（節奏參數解析）⭐
  - **Google Gemini API**：Gemini Pro / Gemini 1.5 Flash（快速解析）⭐
- **音訊技術**：
  - **Web Audio API**：瀏覽器原生音訊處理
  - **AudioContext**：音訊上下文管理（播放器 + 節奏編輯器各自獨立）⭐
  - **OscillatorNode**：音波生成器
  - **GainNode**：音量控制
  - **BiquadFilterNode**：頻率濾波器
  - **NoiseBuffer**：白噪音生成（節奏編輯器專用）⭐
  - **AudioBufferSourceNode**：音訊緩衝播放（節奏編輯器專用）⭐

### 參考檔案
- **節奏編輯器設計參考**：`/src/components/music-player/sample.html`（完整音序器實作）⭐
- **現有 Auth 系統**：Supabase Auth 中介層（登入驗證）⭐
- **現有 AI Provider**：AI provider 整合模組（生成功能）⭐

### 資料庫結構（新增）⭐

#### user_rhythm_presets 表
```sql
CREATE TABLE user_rhythm_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  description TEXT,
  pattern JSONB NOT NULL,
  is_system_preset BOOLEAN DEFAULT FALSE,  -- ⭐ 標記系統預設
  is_public BOOLEAN DEFAULT FALSE,  -- ⭐ 新增：公開/私密標記（v4.0）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_user_rhythm_presets_user_id ON user_rhythm_presets(user_id);
CREATE INDEX idx_user_rhythm_presets_created_at ON user_rhythm_presets(created_at DESC);
CREATE INDEX idx_user_rhythm_presets_public ON user_rhythm_presets(is_public) WHERE is_public = true;  -- ⭐ 新增：公開歌曲索引（v4.0）
CREATE INDEX idx_user_rhythm_presets_system ON user_rhythm_presets(is_system_preset) WHERE is_system_preset = true;  -- ⭐ 新增：系統預設索引（v4.0）

-- RLS Policies（v4.0 更新）⭐
ALTER TABLE user_rhythm_presets ENABLE ROW LEVEL SECURITY;

-- 查看權限：系統預設 OR 公開 OR 自己的
CREATE POLICY "Allow read access to public and own presets" ON user_rhythm_presets
  FOR SELECT USING (
    is_system_preset = true OR
    is_public = true OR
    auth.uid() = user_id
  );

-- 建立權限：僅限已登入使用者
CREATE POLICY "Allow insert for authenticated users" ON user_rhythm_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 更新權限：僅限擁有者
CREATE POLICY "Allow update for owners" ON user_rhythm_presets
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 刪除權限：僅限擁有者且非系統預設
CREATE POLICY "Allow delete for owners (non-system)" ON user_rhythm_presets
  FOR DELETE USING (auth.uid() = user_id AND is_system_preset = false);
```

#### playlists 表
```sql
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_playlists_user_id ON playlists(user_id);

-- RLS Policies
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own playlists" ON playlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own playlists" ON playlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists" ON playlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists" ON playlists
  FOR DELETE USING (auth.uid() = user_id);
```

#### playlist_patterns 表（⭐ 新增 - 取代 playlist_tracks）
```sql
CREATE TABLE playlist_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  pattern_id UUID NOT NULL REFERENCES user_rhythm_presets(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(playlist_id, position),
  UNIQUE(playlist_id, pattern_id)  -- 同一 pattern 不能重複加入
);

CREATE INDEX idx_playlist_patterns_playlist_id ON playlist_patterns(playlist_id);
CREATE INDEX idx_playlist_patterns_pattern_id ON playlist_patterns(pattern_id);

-- RLS Policies
ALTER TABLE playlist_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own playlist patterns" ON playlist_patterns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_patterns.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert patterns to own playlists" ON playlist_patterns
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_patterns.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete patterns from own playlists" ON playlist_patterns
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_patterns.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );
```

#### user_ai_quotas 表（整合現有）⭐
```sql
-- 假設已存在，需確保包含節奏生成配額欄位
ALTER TABLE user_ai_quotas ADD COLUMN IF NOT EXISTS rhythm_quota_used INTEGER DEFAULT 0;
ALTER TABLE user_ai_quotas ADD COLUMN IF NOT EXISTS rhythm_quota_limit INTEGER DEFAULT 20;
```

#### ⚠️ 已刪除的表
- ❌ `music_tracks` - 不再需要外部音樂檔案
- ❌ `playlist_tracks` - 改用 `playlist_patterns`

### 音樂模式定義（已棄用）⚠️
> **注意**：以下音樂模式定義已被 Pattern-Based 系統取代，請參考需求 29 的系統預設 Pattern。

- ~~**synthwave**：首頁背景音樂（電子合成器風格）~~
- ~~**divination**：占卜頁面音樂（神秘氛圍）~~
- ~~**lofi**：儀表板/個人資料頁（Lo-fi 節奏）~~
- ~~**ambient**：卡牌瀏覽頁（環境音樂）~~

---

## 資料庫遷移腳本（v4.0）⭐ 新增

### 遷移腳本：新增訪客與公開歌曲支援

```sql
-- 1. 更新 user_rhythm_presets 表（新增 is_public 欄位）
ALTER TABLE user_rhythm_presets
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- 2. 建立索引（優化公開歌曲查詢）
CREATE INDEX IF NOT EXISTS idx_user_rhythm_presets_public
ON user_rhythm_presets(is_public)
WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_user_rhythm_presets_system
ON user_rhythm_presets(is_system_preset)
WHERE is_system_preset = true;

-- 3. 更新系統預設歌曲為公開
UPDATE user_rhythm_presets
SET is_public = true
WHERE is_system_preset = true;

-- 4. 刪除舊的 RLS policies
DROP POLICY IF EXISTS "Users can view own presets and system presets" ON user_rhythm_presets;
DROP POLICY IF EXISTS "Users can insert own presets" ON user_rhythm_presets;
DROP POLICY IF EXISTS "Users can delete own presets" ON user_rhythm_presets;

-- 5. 建立新的 RLS policies（支援訪客查看公開歌曲）
CREATE POLICY "Allow read access to public and own presets" ON user_rhythm_presets
  FOR SELECT USING (
    is_system_preset = true OR
    is_public = true OR
    auth.uid() = user_id
  );

CREATE POLICY "Allow insert for authenticated users" ON user_rhythm_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow update for owners" ON user_rhythm_presets
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow delete for owners (non-system)" ON user_rhythm_presets
  FOR DELETE USING (auth.uid() = user_id AND is_system_preset = false);

-- 6. 驗證遷移結果
-- 檢查 is_public 欄位是否存在
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_rhythm_presets'
AND column_name = 'is_public';

-- 檢查索引是否建立成功
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_rhythm_presets'
AND indexname IN ('idx_user_rhythm_presets_public', 'idx_user_rhythm_presets_system');

-- 檢查 RLS policies 是否正確
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'user_rhythm_presets';
```

### 遷移驗證清單

- [ ] `is_public` 欄位已新增至 `user_rhythm_presets` 表
- [ ] 索引 `idx_user_rhythm_presets_public` 已建立
- [ ] 索引 `idx_user_rhythm_presets_system` 已建立
- [ ] 系統預設歌曲的 `is_public` 已設為 `true`
- [ ] RLS policy "Allow read access to public and own presets" 已建立
- [ ] RLS policy "Allow insert for authenticated users" 已建立
- [ ] RLS policy "Allow update for owners" 已建立
- [ ] RLS policy "Allow delete for owners (non-system)" 已建立
- [ ] 舊的 RLS policies 已刪除

### 回滾腳本（若需要）

```sql
-- 1. 刪除新的 RLS policies
DROP POLICY IF EXISTS "Allow read access to public and own presets" ON user_rhythm_presets;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON user_rhythm_presets;
DROP POLICY IF EXISTS "Allow update for owners" ON user_rhythm_presets;
DROP POLICY IF EXISTS "Allow delete for owners (non-system)" ON user_rhythm_presets;

-- 2. 恢復舊的 RLS policies
CREATE POLICY "Users can view own presets and system presets" ON user_rhythm_presets
  FOR SELECT USING (auth.uid() = user_id OR is_system_preset = true);

CREATE POLICY "Users can insert own presets" ON user_rhythm_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system_preset = false);

CREATE POLICY "Users can delete own presets" ON user_rhythm_presets
  FOR DELETE USING (auth.uid() = user_id AND is_system_preset = false);

-- 3. 刪除索引
DROP INDEX IF EXISTS idx_user_rhythm_presets_public;
DROP INDEX IF EXISTS idx_user_rhythm_presets_system;

-- 4. 刪除 is_public 欄位
ALTER TABLE user_rhythm_presets DROP COLUMN IF EXISTS is_public;
```

---

## API 端點規格（Pattern-Based 架構）⭐ 新增

### 播放清單 API

#### 1. 建立播放清單
```http
POST /api/v1/playlists
Authorization: Bearer <token>

Request Body:
{
  "name": "我的 Techno Mix",
  "description": "最愛的 Techno 節奏合集",
  "isPublic": false
}

Response (201):
{
  "id": "uuid",
  "userId": "uuid",
  "name": "我的 Techno Mix",
  "description": "最愛的 Techno 節奏合集",
  "isPublic": false,
  "patterns": [],
  "createdAt": "2025-10-13T12:00:00Z",
  "updatedAt": "2025-10-13T12:00:00Z"
}
```

#### 2. 加入 Pattern 到播放清單
```http
POST /api/v1/playlists/{playlist_id}/patterns
Authorization: Bearer <token>

Request Body:
{
  "patternId": "uuid",
  "position": 0  // 插入位置（可選，預設加到最後）
}

Response (201):
{
  "id": "uuid",
  "playlistId": "uuid",
  "patternId": "uuid",
  "position": 0,
  "pattern": {
    "id": "uuid",
    "name": "Techno",
    "description": "經典 Techno 節奏",
    "isSystemPreset": true,
    "pattern": {
      "kick": [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      "snare": [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      "hihat": [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      "openhat": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      "clap": [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]
    }
  },
  "createdAt": "2025-10-13T12:00:00Z"
}
```

#### 3. 獲取播放清單（含 Pattern）
```http
GET /api/v1/playlists/{playlist_id}
Authorization: Bearer <token>

Response (200):
{
  "id": "uuid",
  "userId": "uuid",
  "name": "我的 Techno Mix",
  "description": "最愛的 Techno 節奏合集",
  "isPublic": false,
  "patterns": [
    {
      "id": "uuid",
      "position": 0,
      "pattern": {
        "id": "uuid",
        "name": "Techno",
        "description": "經典 Techno 節奏",
        "isSystemPreset": true,
        "pattern": {
          "kick": [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
          "snare": [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
          "hihat": [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
          "openhat": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
          "clap": [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]
        }
      }
    },
    {
      "id": "uuid",
      "position": 1,
      "pattern": {
        "id": "uuid",
        "name": "我的自訂節奏",
        "description": "實驗性節奏",
        "isSystemPreset": false,
        "pattern": {
          "kick": [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
          "snare": [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
          "hihat": [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          "openhat": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          "clap": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        }
      }
    }
  ],
  "createdAt": "2025-10-13T12:00:00Z",
  "updatedAt": "2025-10-13T12:30:00Z"
}
```

#### 4. 獲取使用者所有播放清單
```http
GET /api/v1/playlists
Authorization: Bearer <token>

Response (200):
{
  "playlists": [
    {
      "id": "uuid",
      "name": "我的 Techno Mix",
      "description": "最愛的 Techno 節奏合集",
      "patternCount": 5,
      "createdAt": "2025-10-13T12:00:00Z"
    },
    {
      "id": "uuid",
      "name": "放鬆節奏",
      "description": "適合工作的節奏",
      "patternCount": 3,
      "createdAt": "2025-10-12T10:00:00Z"
    }
  ]
}
```

#### 5. 移除 Pattern
```http
DELETE /api/v1/playlists/{playlist_id}/patterns/{pattern_id}
Authorization: Bearer <token>

Response (204): No Content
```

#### 6. 調整 Pattern 順序
```http
PUT /api/v1/playlists/{playlist_id}/patterns/{pattern_id}/position
Authorization: Bearer <token>

Request Body:
{
  "position": 2
}

Response (200):
{
  "id": "uuid",
  "playlistId": "uuid",
  "patternId": "uuid",
  "position": 2,
  "createdAt": "2025-10-13T12:00:00Z"
}
```

#### 7. 更新播放清單資訊
```http
PUT /api/v1/playlists/{playlist_id}
Authorization: Bearer <token>

Request Body:
{
  "name": "新的播放清單名稱",
  "description": "新的描述",
  "isPublic": true
}

Response (200):
{
  "id": "uuid",
  "userId": "uuid",
  "name": "新的播放清單名稱",
  "description": "新的描述",
  "isPublic": true,
  "updatedAt": "2025-10-13T13:00:00Z"
}
```

#### 8. 刪除播放清單
```http
DELETE /api/v1/playlists/{playlist_id}
Authorization: Bearer <token>

Response (204): No Content
```

### Pattern 管理 API

#### 9. 獲取所有可用 Pattern（系統 + 使用者）
```http
GET /api/v1/music/presets/available
Authorization: Bearer <token>

Response (200):
{
  "systemPresets": [
    {
      "id": "uuid",
      "name": "Techno",
      "description": "經典 Techno 節奏",
      "isSystemPreset": true,
      "pattern": {
        "kick": [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
        "snare": [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
        "hihat": [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
        "openhat": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        "clap": [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]
      },
      "createdAt": "2025-01-01T00:00:00Z"
    }
    // ... 其他系統預設 (House, Trap, Breakbeat, Minimal)
  ],
  "userPresets": [
    {
      "id": "uuid",
      "name": "我的節奏",
      "description": "實驗性節奏",
      "isSystemPreset": false,
      "pattern": {
        "kick": [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
        "snare": [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
        "hihat": [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        "openhat": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        "clap": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      },
      "createdAt": "2025-10-13T12:00:00Z"
    }
  ]
}
```

#### 10. 儲存使用者自訂 Preset（來自節奏編輯器）
```http
POST /api/v1/music/presets
Authorization: Bearer <token>

Request Body:
{
  "name": "My Techno Beat",
  "description": "實驗性 Techno 節奏",
  "pattern": {
    "kick": [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
    "snare": [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    "hihat": [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
    "openhat": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    "clap": [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]
  }
}

Response (201):
{
  "id": "uuid",
  "userId": "uuid",
  "name": "My Techno Beat",
  "description": "實驗性 Techno 節奏",
  "pattern": { ... },
  "isSystemPreset": false,
  "createdAt": "2025-10-13T12:00:00Z"
}
```

#### 11. 刪除使用者 Preset
```http
DELETE /api/v1/music/presets/{preset_id}
Authorization: Bearer <token>

Response (204): No Content

Error (403) - 嘗試刪除系統預設:
{
  "error": "Cannot delete system preset"
}
```

### AI 生成 API（節奏編輯器專用）

#### 12. AI 生成節奏 Pattern
```http
POST /api/v1/music/generate-rhythm
Authorization: Bearer <token>

Request Body:
{
  "prompt": "808 cowbell rhythm with heavy trap influence"
}

Response (200):
{
  "pattern": {
    "kick": [1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0],
    "snare": [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    "hihat": [1,0,1,0,1,0,1,0,1,1,0,1,0,1,1,1],
    "openhat": [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
    "clap": [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]
  },
  "quotaRemaining": 15
}

Error (400) - 配額用盡:
{
  "error": "Daily quota exceeded",
  "quotaLimit": 20,
  "quotaUsed": 20,
  "resetAt": "2025-10-14T00:00:00Z"
}

Error (500) - AI 生成失敗:
{
  "error": "AI generation failed",
  "message": "Unable to parse rhythm from AI response"
}
```

#### 13. 獲取使用者 AI 配額狀態
```http
GET /api/v1/music/quota
Authorization: Bearer <token>

Response (200):
{
  "quotaLimit": 20,
  "quotaUsed": 5,
  "quotaRemaining": 15,
  "resetAt": "2025-10-14T00:00:00Z"
}
```

### ⚠️ 已刪除的 API 端點

以下 API 端點已從系統中移除，因為不再使用外部音樂檔案：

- ❌ `POST /api/v1/playlists/tracks` - 新增音樂檔案至播放清單（改用 Pattern）
- ❌ `GET /api/v1/playlists/tracks` - 獲取播放清單音樂檔案（改用 Pattern）
- ❌ `DELETE /api/v1/playlists/tracks/{track_id}` - 移除音樂檔案（改用 Pattern）
- ❌ `GET /api/v1/music/tracks` - 獲取所有可用音樂檔案（改用系統預設 Pattern）
- ❌ `POST /api/v1/music/upload` - 上傳音樂檔案（改用節奏編輯器創建 Pattern）

## UI/UX 規格

### 設計系統
- **主色調**：Pip-Boy 綠色 `#00ff88`
- **背景色**：`var(--color-wasteland-darker)` 或 `#000000`
- **文字字體**：Cubic 11 像素字體（全站統一）⭐
- **邊框樣式**：2px solid `#00ff88` 或 `#00ff88/50`
- **陰影效果**：`shadow-pip-boy-green` 或 `0 0 10px rgba(0, 255, 136, 0.5)`
- **圖示系統**：PixelIcon（不使用 lucide-react）⭐

### 視覺效果
- **CRT 掃描線**：使用 CSS `background-image` 或 `::before` pseudo-element
- **綠色發光**：`box-shadow: 0 0 10px var(--color-glow-green)`
- **過渡動畫**：300ms ease-out（按鈕、hover 效果）
- **載入動畫**：旋轉 Pip-Boy 圖示或掃描線效果
- **步驟高亮動畫**：播放時脈衝效果（節奏編輯器）⭐

### 響應式佈局

#### 播放器（系統 A）

- **桌面版（>= 768px）**：
  - Drawer 播放器主介面從底部滑入，預設高度為螢幕高度的 60%（可拖曳調整 30%-90%）
  - Drawer 可最小化為底部浮動控制條（顯示當前曲目、播放/暫停按鈕）
  - 點擊 Drawer 內的「播放清單」按鈕開啟 Sheet 彈窗（從右側滑入，寬度 400px）
  - Sheet 彈窗內顯示音樂模式瀏覽器和完整播放清單（可捲動）
  - Drawer 內顯示當前曲目資訊、播放控制、進度條、音量控制

- **行動版（< 768px）**：
  - Drawer 播放器主介面從底部滑入，預設高度為螢幕高度的 60%
  - Drawer 可向下拖曳最小化為底部浮動控制條
  - 點擊浮動控制條可重新展開完整 Drawer 播放器
  - 點擊 Drawer 內的「播放清單」按鈕開啟 Sheet 彈窗（從右側滑入，寬度為螢幕的 90%）
  - Sheet 彈窗內顯示音樂模式瀏覽器和播放清單管理

#### 節奏編輯器（系統 B）⭐

- **桌面版（>= 768px）**：
  - 完整頁面佈局（`/dashboard/rhythm-editor`）
  - 16 步驟網格完整顯示（5 軌道 × 16 步驟）
  - 左側：軌道標籤（Kick、Snare、HiHat、OpenHat、Clap）
  - 中央：步驟網格
  - 右側：控制面板（Tempo、Play/Pause/Stop、Clear、Preset、AI 生成）
  - 底部：配額顯示和使用者 Preset 列表

- **行動版（< 768px）**：
  - 完整頁面佈局
  - 步驟網格橫向捲動（5 軌道 × 16 步驟）
  - 控制面板垂直堆疊於網格下方
  - Tempo 控制條和傳輸按鈕固定於底部

### 互動模式
- **Hover 效果**：綠色發光 + 輕微放大（scale: 1.05）
- **點擊反饋**：pip-boy-beep 音效 + 按鈕縮小動畫
- **拖曳操作**：音樂模式項目可拖曳至播放清單
- **滑動手勢**：行動裝置支援左右滑動切換曲目
- **步驟點擊反饋**：節奏編輯器步驟格子點擊時觸發視覺反轉 + 音效預覽 ⭐
- **鍵盤導航**：Tab 鍵聚焦、Enter 切換、方向鍵移動（節奏編輯器）⭐

---

## 重要提醒 ⚠️

### 系統分離原則
1. **節奏編輯器是獨立頁面**：`/dashboard/rhythm-editor`，不在 MusicPlayerDrawer 內
2. **兩個系統互不干擾**：播放器使用 ProceduralMusicEngine，節奏編輯器使用獨立 Web Audio API 合成器
3. **認證隔離**：節奏編輯器需登入，播放器公開使用
4. **AudioContext 獨立**：各自管理獨立的 AudioContext 實例

### 技術約束
1. **完全模仿 sample.html**：節奏編輯器的音訊合成、UI 佈局、互動方式參考 sample.html
2. **樂器名稱一致**：使用 sample.html 原始名稱（Kick、Snare、HiHat、OpenHat、Clap）
3. **不使用 lucide-react**：全站統一使用 PixelIcon
4. **不使用現有合成器**：節奏編輯器不使用 Bass、Pad、Lead 合成器

### 資料流
1. **AI 生成流程**：前端 → FastAPI → AI Provider → 解析 pattern → 回傳前端
2. **Preset 儲存流程**：前端 → FastAPI → Supabase `user_rhythm_presets` 表
3. **配額管理流程**：前端檢查 → FastAPI 驗證 → `user_ai_quotas` 表 → 回傳剩餘配額

---

**文檔版本**：4.0
**建立日期**：2025-01-10
**更新日期**：2025-10-13
**變更記錄**：
- v4.0: **訪客系統與公開歌曲** - 新增訪客功能與公開分享機制 ⭐
  - **新增需求 31-35**：訪客瀏覽公開歌曲、公開/私密歌曲控制、訪客播放清單（localStorage）、註冊使用者播放清單（無限制）、訪客轉註冊使用者的播放清單遷移
  - **資料庫變更**：
    - `user_rhythm_presets` 表新增 `is_public` 欄位（公開/私密標記）
    - 新增索引：`idx_user_rhythm_presets_public`（公開歌曲索引）
    - 新增索引：`idx_user_rhythm_presets_system`（系統預設索引）
    - 更新 RLS Policies：支援訪客查看公開歌曲、系統預設歌曲
  - **API 端點更新**：
    - 新增 `GET /api/v1/music/presets/public`（訪客可用，查看公開歌曲）
    - 新增 `POST /api/v1/playlists/import-guest`（匯入訪客播放清單）
    - 更新 `POST /api/v1/music/presets`（支援 `isPublic` 參數）
    - 更新 `PUT /api/v1/music/presets/{preset_id}`（支援更新 `isPublic` 狀態）
  - **前端功能新增**：
    - localStorage 播放清單管理（訪客專用，上限 4 首歌曲）
    - 訪客轉註冊使用者時的播放清單匯入流程
    - 公開/私密歌曲切換 UI（儲存對話框中的勾選框）
    - 訪客限制提示 UI（播放清單已滿提示、註冊導引）
  - **權限對比表**：新增訪客 vs 註冊使用者功能對比表
  - **歌曲可見性規則**：明確定義訪客和註冊使用者的歌曲查看權限
- v3.0: **架構重構** - Pattern-Based 播放系統整合 ⭐
  - **新增需求 28-30**：Pattern-Based 播放清單管理、系統預設 Pattern、播放器整合節奏播放
  - **更新需求 3**：標記為已棄用，改用 Pattern-Based 播放清單（需求 28）
  - **資料庫變更**：
    - 新增 `playlist_patterns` 表（取代 `playlist_tracks`）
    - 更新 `user_rhythm_presets` 表（新增 `is_system_preset`、`description` 欄位）
    - 刪除 `music_tracks` 表（不再使用外部音樂檔案）
    - 刪除 `playlist_tracks` 表（改用 `playlist_patterns`）
  - **API 端點更新**：
    - 新增 13 個 Pattern-Based API 端點
    - 刪除 5 個基於音樂檔案的 API 端點
  - **系統預設 Pattern**：新增 5 個系統預設（Techno、House、Trap、Breakbeat、Minimal）
  - **架構圖更新**：反映 Pattern → Playlist → Player 資料流
  - **播放器邏輯**：新增 PlaylistPlayer 類別實作（循環播放、隨機播放、Pattern 切換）
- v2.0: **重大更新** - 新增獨立節奏編輯器系統（系統 B）
  - 新增需求 20-27：獨立頁面路由、16 步驟音序器、AI 生成、Preset 系統、Web Audio API 合成器、後端 API、UI/UX
  - 新增資料庫結構：`user_rhythm_presets` 表、`user_ai_quotas` 配額欄位
  - 新增技術堆疊：FastAPI 後端、Supabase Auth、AI Provider 整合
  - 新增響應式佈局規格：節奏編輯器桌面/手機版
  - 更新系統架構圖：前台播放器 + 後台節奏編輯器分離
- v1.3: 新增需求 13（AI 驅動音樂生成）、需求 14（LLM Provider 整合）、需求 15（Web Audio API 程序式音樂生成引擎）
- v1.2: 修正元件角色定義 - Drawer 為主播放器介面、Sheet 為播放清單彈窗
- v1.1: 新增需求 11（移除自動場景音樂）和需求 12（Sheet/Drawer 彈窗播放清單介面）
- v1.0: 初始版本（10 個需求）

**語言**：繁體中文（zh-TW）

---

## 📋 需求摘要（v4.0）

### 核心需求（35 個）
- **需求 1-2**：音樂模式瀏覽與播放控制（保留）
- **需求 3**：播放清單管理（已棄用 → 見需求 28）⚠️
- **需求 4-12**：UI/UX、音量控制、狀態持久化、鍵盤導航、效能、無障礙、移除自動音樂、Sheet 彈窗（保留）
- **需求 20-27**：節奏編輯器系統（獨立頁面、音序器、AI 生成、Preset、合成器、API、UI/UX）
- **需求 28**：播放清單管理（Pattern-Based）⭐ v3.0
- **需求 29**：系統預設 Pattern 管理 ⭐ v3.0
- **需求 30**：播放器整合節奏播放 ⭐ v3.0
- **需求 31**：訪客瀏覽公開歌曲 ⭐ v4.0 新增
- **需求 32**：使用者創作歌曲時選擇公開/私密 ⭐ v4.0 新增
- **需求 33**：訪客播放清單（localStorage） ⭐ v4.0 新增
- **需求 34**：註冊使用者播放清單（無限制） ⭐ v4.0 新增
- **需求 35**：訪客轉註冊使用者時的播放清單遷移 ⭐ v4.0 新增

### 核心變更（v4.0）
1. **訪客系統** ⭐ 新增
   - 訪客可瀏覽系統預設歌曲（5 首）和公開的使用者創作歌曲
   - 訪客可建立 localStorage 播放清單（上限 1 個清單、4 首歌曲）
   - 訪客無法使用節奏編輯器和 AI 生成功能
2. **公開/私密歌曲機制** ⭐ 新增
   - `user_rhythm_presets` 新增 `is_public` 欄位
   - 使用者可在儲存歌曲時選擇公開/私密
   - 公開歌曲可被所有人（含訪客）查看和使用
   - 私密歌曲只有擁有者可見
3. **RLS Policies 更新** ⭐ 新增
   - 訪客可查看：系統預設歌曲 (`is_system_preset = true`) + 公開歌曲 (`is_public = true`)
   - 註冊使用者可查看：系統預設 + 公開歌曲 + 自己的私密歌曲
4. **播放清單遷移流程** ⭐ 新增
   - 訪客註冊後可選擇匯入 localStorage 播放清單到資料庫
   - 匯入後自動清除 localStorage 資料

### 核心變更（v3.0）
1. **刪除歌曲（Tracks）概念** ⚠️
   - 移除 `music_tracks` 表
   - 移除 `POST /api/v1/playlists/tracks` 等相關 API
2. **Pattern 即歌曲** ⭐
   - `user_rhythm_presets` 表的每一筆記錄 = 一首「歌曲」
   - 播放清單包含多個 pattern 引用（`playlist_patterns` 表）
3. **系統預設歌曲** ⭐
   - 5 個系統預設 pattern（Techno、House、Trap、Breakbeat、Minimal）
   - 系統帳號（`00000000-0000-0000-0000-000000000000`）擁有
   - 所有使用者都可以加入播放清單
