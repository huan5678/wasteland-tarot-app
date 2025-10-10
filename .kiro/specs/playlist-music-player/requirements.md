# 需求文檔 - 播放清單音樂播放器

## 簡介

將 Wasteland Tarot 網站的自動場景音樂系統**完全移除**，改造為使用者主導的播放清單音樂控制系統。使用者可以瀏覽所有可用的音樂模式（synthwave、divination、lofi、ambient 等），建立自訂播放清單，並**完全手動控制**音樂播放。播放器介面將採用 Fallout Pip-Boy 美學風格，使用 shadcn/ui Drawer 作為主播放器介面，Sheet 作為彈窗播放清單。

### 商業價值
- **完全使用者控制**：移除自動播放，所有音樂由使用者手動啟動和管理
- **提升使用者體驗**：從被動接受場景音樂改為主動控制，提高使用者滿意度
- **增加互動性**：播放清單建立和管理功能增強平台黏性
- **個人化體驗**：使用者可根據個人喜好選擇音樂，提升沉浸感
- **品牌一致性**：Pip-Boy 風格播放器強化 Fallout 主題體驗

### 技術整合
- 整合現有 ProceduralMusicEngine（程序式音樂生成）
- 整合現有 audioStore（Zustand 狀態管理）
- 整合現有 VolumeControl 組件（音量控制）
- 使用 shadcn/ui Drawer 組件（主播放器介面）
- 使用 shadcn/ui Sheet 組件（彈窗播放清單）
- 使用 shadcn/ui 其他組件（保持設計一致性）

## 需求

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

### 需求 3：播放清單管理
**使用者故事**：作為廢土塔羅使用者，我想要建立和管理自訂播放清單，以便組織我喜愛的音樂模式。

#### 驗收標準

1. WHEN 使用者點擊「新增播放清單」按鈕 THEN 系統 SHALL 顯示播放清單建立對話框
2. WHEN 使用者輸入播放清單名稱並確認 THEN 系統 SHALL 建立新的空白播放清單
3. WHEN 使用者將音樂模式拖曳至播放清單 THEN 系統 SHALL 將該模式新增至播放清單
4. WHEN 使用者點擊播放清單中的刪除按鈕 THEN 系統 SHALL 移除該音樂模式
5. WHEN 使用者調整播放清單中的音樂順序 THEN 系統 SHALL 立即儲存新順序至 localStorage
6. IF 使用者擁有多個播放清單 THEN 系統 SHALL 提供播放清單切換功能
7. WHERE 播放清單名稱輸入欄位 THE 系統 SHALL 限制長度為 30 個字元
8. WHEN 使用者刪除播放清單 THEN 系統 SHALL 顯示確認對話框以防誤刪

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

## 非功能性需求

### 效能需求
- **音樂切換延遲**：< 500ms
- **介面渲染時間**：< 100ms
- **記憶體使用上限**：50MB（整合現有音訊系統限制）
- **CPU 使用率**：維持 FPS >= 30

### 相容性需求
- **瀏覽器支援**：Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **響應式設計**：支援桌面（>= 768px）和行動裝置（< 768px）
- **觸控支援**：支援觸控手勢和滑動操作

### 安全性需求
- **資料儲存**：僅使用 localStorage（不涉及敏感資料）
- **XSS 防護**：所有使用者輸入（播放清單名稱）需經過 sanitize
- **CORS 策略**：遵循現有 CORS 設定

### 可維護性需求
- **TypeScript**：所有程式碼使用 TypeScript 5 嚴格模式
- **元件化**：播放器拆分為獨立可重用元件
- **測試覆蓋率**：單元測試覆蓋率 >= 80%
- **文件化**：所有公開 API 需包含 JSDoc

### 無障礙需求
- **WCAG 2.1 AA 合規**：符合 AA 等級無障礙標準
- **螢幕閱讀器支援**：完整 ARIA 標籤
- **鍵盤導航**：所有功能可透過鍵盤操作
- **顏色對比度**：Pip-Boy 綠色（#00ff88）與黑色背景對比度 > 4.5:1

## 技術限制與依賴

### 現有架構依賴
- **ProceduralMusicEngine**：程序式音樂生成引擎（`/src/lib/audio/ProceduralMusicEngine.ts`）
- **audioStore**：Zustand 音訊狀態管理（`/src/lib/audio/audioStore.ts`）
- **VolumeControl**：音量控制組件（`/src/components/audio/VolumeControl.tsx`）
- **constants.ts**：音訊系統常數（包含 SCENE_MUSIC_MAP）

### 技術堆疊
- **前端框架**：Next.js 15 (App Router)
- **狀態管理**：Zustand 4.5+
- **UI 組件庫**：shadcn/ui（Radix UI primitives）
  - **Drawer 組件**：主播放器介面（從底部滑入，https://ui.shadcn.com/docs/components/drawer）
  - **Sheet 組件**：播放清單彈窗（從右側滑入，https://ui.shadcn.com/docs/components/sheet）
  - **Popover 組件**：音量控制彈窗（已使用）
  - **Slider 組件**：音量滑桿（已使用）
- **樣式方案**：Tailwind CSS v4
- **TypeScript**：TypeScript 5（嚴格模式）
- **套件管理**：Bun

### 音樂模式定義
- **synthwave**：首頁背景音樂（電子合成器風格）
- **divination**：占卜頁面音樂（神秘氛圍）
- **lofi**：儀表板/個人資料頁（Lo-fi 節奏）
- **ambient**：卡牌瀏覽頁（環境音樂）

## UI/UX 規格

### 設計系統
- **主色調**：Pip-Boy 綠色 `#00ff88`
- **背景色**：`var(--color-wasteland-darker)` 或 `#000000`
- **文字字體**：`font-mono`（終端機風格等寬字體）
- **邊框樣式**：2px solid `#00ff88` 或 `#00ff88/50`
- **陰影效果**：`shadow-pip-boy-green` 或 `0 0 10px rgba(0, 255, 136, 0.5)`

### 視覺效果
- **CRT 掃描線**：使用 CSS `background-image` 或 `::before` pseudo-element
- **綠色發光**：`box-shadow: 0 0 10px var(--color-glow-green)`
- **過渡動畫**：300ms ease-out（按鈕、hover 效果）
- **載入動畫**：旋轉 Pip-Boy 圖示或掃描線效果

### 響應式佈局
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

### 互動模式
- **Hover 效果**：綠色發光 + 輕微放大（scale: 1.05）
- **點擊反饋**：pip-boy-beep 音效 + 按鈕縮小動畫
- **拖曳操作**：音樂模式項目可拖曳至播放清單
- **滑動手勢**：行動裝置支援左右滑動切換曲目

---

**文檔版本**：1.2
**建立日期**：2025-01-10
**更新日期**：2025-01-10 15:00
**變更記錄**：
- v1.2: 修正元件角色定義 - Drawer 為主播放器介面、Sheet 為播放清單彈窗（更新需求 4、12 及 UI/UX 規格）
- v1.1: 新增需求 11（移除自動場景音樂）和需求 12（Sheet/Drawer 彈窗播放清單介面）
- v1.0: 初始版本（10 個需求）

**語言**：繁體中文（zh-TW）
