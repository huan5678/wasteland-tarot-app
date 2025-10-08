# Requirements Document

## Project Description (Input)

首頁的快速占卜重構, 請構思一個 demo 的一個抽卡占卜的頁面, 由大阿爾克納之中選5張卡排出來做一個mockup, 並將固定的占卜結果寫在頁面的程式區之中, 使用Carousel元件來做layout, 要做到和標準的登入後的占卜的結果, 完整功能包含語音解讀

**更新需求（2025-10-08）**：
- 訪客使用者（未登入）不應該有重新抽卡的選項
- 訪客抽取的占卜結果應儲存在 localStorage 中，每次進入頁面時直接讀取並顯示
- 如果 localStorage 已有結果，直接顯示，不執行重新抽卡
- 這是一個 demo 展示頁面，目的是讓訪客體驗一次性的占卜功能
- 首頁快速占卜入口需要根據登入狀態進行差異化處理：
  - 未登入狀態：顯示「快速占卜」，點擊後進入 `/readings/quick` demo 頁面
  - 已登入狀態：改變按鈕文字為「新占卜」，點擊後導向使用者的 Dashboard 或完整占卜頁面
- `/readings/quick` = 訪客 Demo 頁面（一次性體驗，無重新抽卡）
- Dashboard / `/readings/new` = 登入使用者的完整功能（包含保存、歷史記錄等）

## Introduction

本專案旨在為首頁建立一個互動式快速占卜頁面，讓未登入的訪客能夠體驗**一次性**的廢土塔羅抽卡流程。訪客將透過 Carousel 介面瀏覽 5 張卡背，選擇一張進行翻轉，系統將該選擇儲存至 localStorage 以保持狀態持久性。選中的卡牌會以 Modal 形式展示詳細解讀，並提供語音朗讀功能。

**重要變更**：
- **訪客模式特性**：訪客只能體驗一次抽卡，結果會永久保存在 localStorage 中，直到瀏覽器清除資料
- **無重新抽卡功能**：訪客不提供重新抽卡選項，強調這是一個「定格的命運展示」
- **首頁入口差異化**：根據登入狀態顯示不同的按鈕文字與導向目標

此功能的商業價值在於：
- 提供真實的抽卡互動體驗，增強訪客參與感
- 透過 Carousel 介面營造專業的占卜氛圍
- 透過 localStorage 保持狀態，讓訪客可重複檢視結果（但不能重新抽卡）
- 降低進入門檻，展示完整的占卜流程（瀏覽 → 抽卡 → 翻牌 → 解讀 → 語音）
- 透過明確的 CTA 引導，最大化註冊轉換率
- **透過「一次性體驗」的稀缺性，增強註冊動機**

## Requirements

### Requirement 1: Carousel 卡牌展示系統
**Objective:** 作為訪客，我想要透過 Carousel 介面瀏覽 5 張卡背，以便我能選擇其中一張進行占卜

#### Acceptance Criteria

1. WHEN 用戶首次進入快速占卜頁面 THEN 系統 SHALL 使用 Carousel 元件顯示 5 張卡背（背面朝上）
2. WHERE 卡牌資料來源 THE 系統 SHALL 從 `/src/data/enhancedCards.ts` 的大阿爾克納中隨機選取 5 張不重複的卡牌
3. WHEN 用戶在 Carousel 中導航 THEN 系統 SHALL 支援以下操作方式：
   - 左右箭頭按鈕點擊
   - 鍵盤方向鍵（左右）
   - 觸控滑動手勢（移動裝置）
4. WHILE 用戶瀏覽 Carousel THE 系統 SHALL 顯示當前卡牌位置指示器（例如：3/5）
5. WHEN 頁面載入中 THEN 系統 SHALL 顯示載入指示器
6. WHEN 所有卡背圖片載入完成 THEN 系統 SHALL 移除載入指示器並啟用 Carousel 互動與卡牌點擊
7. WHERE 響應式設計 THE Carousel 元件 SHALL 在桌面（≥1024px）、平板（768-1023px）、手機（<768px）上正確顯示

### Requirement 2: Carousel 內卡牌翻轉互動
**Objective:** 作為訪客，我想要在 Carousel 中點擊卡背後看到翻牌動畫，以便我能體驗真實的塔羅抽卡感受

#### Acceptance Criteria

1. WHEN 用戶在 Carousel 中點擊當前顯示的卡背 THEN 系統 SHALL 執行翻牌動畫（卡背 → 卡面）
2. WHERE 翻牌動畫 THE 系統 SHALL 使用 3D 翻轉效果，持續時間 600ms（參考 `TarotCard` 元件既有實作）
3. WHEN 翻牌動畫完成 THEN 系統 SHALL 顯示該卡牌的正面圖案
4. WHEN 用戶完成翻牌 THEN 系統 SHALL 將 Carousel 中其餘 4 張卡片設為不可點擊狀態
5. WHERE 不可點擊狀態 THE 系統 SHALL 對未選中的卡片套用視覺效果（例如：降低不透明度至 50%、移除 hover 效果）
6. WHEN 用戶透過 Carousel 導航到未選中的卡片並嘗試點擊 THEN 系統 SHALL 不執行任何動作
7. IF 用戶已翻開一張卡牌 THEN 該卡牌 SHALL 保持正面朝上狀態並可繼續點擊以開啟 Modal
8. WHEN 用戶完成翻牌 THEN Carousel 導航功能 SHALL 仍然可用，允許用戶瀏覽其他卡片（但不可翻轉）

### Requirement 3: localStorage 持久化機制（訪客一次性體驗）
**Objective:** 作為訪客，我想要我的抽卡結果被永久保存，以便我重新整理頁面或重新進入時能看到相同的結果，而不會被重置

#### Acceptance Criteria

1. WHEN 用戶完成翻牌 THEN 系統 SHALL 將以下資料存入 localStorage：
   - 被選中的卡牌 ID
   - 卡牌池中的 5 張卡牌 ID（保持順序）
   - 翻牌時間戳記
2. WHERE localStorage 鍵名 THE 系統 SHALL 使用命名規則：`wasteland-tarot-quick-reading`
3. WHEN 用戶重新整理頁面 THEN 系統 SHALL 從 localStorage 讀取先前的抽卡結果
4. **IF localStorage 中存在有效的抽卡記錄 THEN 系統 SHALL 直接顯示翻開的卡牌狀態（跳過卡背階段）**
5. WHEN 系統載入已存在的抽卡記錄 THEN 未被選中的卡片 SHALL 維持不可點擊狀態
6. IF localStorage 資料格式錯誤或損壞 THEN 系統 SHALL 清除該資料並重新初始化卡牌池
7. **WHEN 用戶關閉瀏覽器後重新開啟 THEN 系統 SHALL 仍能載入先前的抽卡結果（無過期時間限制）**
8. **IF 用戶已有抽卡記錄 THEN 系統 SHALL 不提供「重新抽卡」選項（訪客模式限制）**
9. **WHEN 頁面載入時檢測到 localStorage 中有記錄 THEN 系統 SHALL 直接進入「已抽卡」狀態，顯示翻開的卡牌與 CTA**

### Requirement 4: 重新抽卡功能（訪客模式移除）
**Objective:** 作為產品擁有者，我希望訪客模式不提供重新抽卡功能，以強化「一次性體驗」的稀缺性，提升註冊轉換率

#### Acceptance Criteria

1. **WHEN 系統檢測到用戶未登入 THEN 介面 SHALL NOT 顯示「重新抽卡」按鈕**
2. **IF 用戶嘗試透過 localStorage 清除來重新抽卡 THEN 系統 SHALL 正常處理（這是瀏覽器行為，允許使用者自行決定）**
3. **WHEN 用戶已登入 THEN 重新抽卡功能 SHALL 在完整占卜頁面（Dashboard / `/readings/new`）中提供**
4. **WHEN 訪客查看 CTA 區塊 THEN 文案 SHALL 強調「想要再次抽卡？請註冊完整功能」**

**變更說明**：此需求從「提供重新抽卡確認對話框」變更為「完全移除訪客的重新抽卡功能」

### Requirement 5: Modal 解牌介面
**Objective:** 作為訪客，我想要點擊已翻開的卡牌後看到詳細解讀，以便我能深入了解卡牌的含義與建議

#### Acceptance Criteria

1. WHEN 用戶點擊已翻開的卡牌 THEN 系統 SHALL 開啟 Modal 視窗
2. WHERE Modal 內容 THE 系統 SHALL 顯示以下資訊：
   - 卡牌完整圖片（大尺寸）
   - 卡牌名稱（繁體中文）
   - 卡牌編號與花色
   - 正位含義
   - 關鍵字（至少 3-5 個）
   - Fallout 世界觀參考說明
   - 角色語音解讀（至少一個角色視角，例如：Pip-Boy、Brotherhood Scribe）
3. WHEN Modal 開啟 THEN 系統 SHALL 套用 Pip-Boy 終端機風格的視覺設計
4. WHEN 用戶點擊 Modal 外部區域或按下 ESC 鍵 THEN 系統 SHALL 關閉 Modal
5. WHERE Modal 關閉按鈕 THE 系統 SHALL 提供明確的關閉按鈕（X 圖示）
6. WHEN Modal 開啟時 THEN 系統 SHALL 禁用背景頁面的捲動（防止穿透）
7. WHERE 響應式設計 THE Modal SHALL 在桌面使用固定寬度（例如：最大 800px），在移動裝置使用全螢幕或接近全螢幕的尺寸

### Requirement 6: Modal 內語音解讀功能
**Objective:** 作為訪客，我想要在 Modal 中聽到卡牌解讀的語音朗讀，以便我能以多感官方式理解占卜結果

#### Acceptance Criteria

1. WHEN Modal 開啟 THEN 系統 SHALL 在 Modal 內顯示語音播放控制按鈕
2. WHEN 用戶點擊語音播放按鈕 THEN 系統 SHALL 開始朗讀卡牌解讀文字（含義、關鍵字、角色解讀）
3. WHILE 語音播放進行中 THE 系統 SHALL 顯示播放狀態指示（例如：波形動畫、播放/暫停圖示切換）
4. WHEN 用戶點擊暫停按鈕 THEN 系統 SHALL 暫停語音播放並保留播放進度
5. WHEN 用戶關閉 Modal THEN 系統 SHALL 停止語音播放
6. IF 瀏覽器不支援 Web Speech API THEN 系統 SHALL 顯示降級提示訊息（例如：「您的瀏覽器不支援語音功能」）
7. WHEN 語音播放完成 THEN 系統 SHALL 重置播放按鈕狀態為「未播放」
8. WHERE 語音設定 THE 系統 SHALL 使用以下參數：
   - 語言：繁體中文（zh-TW）
   - 語速：可調整（預設為 1.0，範圍 0.5-2.0）
   - 音高：可調整（預設為 1.0，範圍 0.5-2.0）
9. WHEN 系統實作語音功能 THEN 系統 SHALL 使用現有的 `/src/hooks/useTextToSpeech.tsx` hook

### Requirement 7: 視覺風格與主題一致性
**Objective:** 作為訪客，我想要看到與主站一致的 Fallout 風格視覺設計，以便我能感受到品牌的整體性與沉浸感

#### Acceptance Criteria

1. WHEN 頁面渲染 THEN 系統 SHALL 套用 Pip-Boy 主題樣式（綠色單色調、終端機風格）
2. WHERE UI 元件 THE 系統 SHALL 使用專案既有的樣式系統：
   - Tailwind CSS v4 設定
   - Pip-Boy 綠色調色板（`--color-pip-boy-green` 系列）
   - Doto 字體用於數字顯示
   - Monospace 字體用於終端機風格文字
3. WHEN 用戶 hover 可點擊的卡背 THEN 系統 SHALL 顯示視覺回饋（發光效果、音效回饋，參考 `TarotCard` 的 hover 處理）
4. WHERE 翻牌動畫 THE 系統 SHALL 使用平滑的 3D transform 效果
5. IF 背景元素存在 THEN 系統 SHALL 使用 dither 效果或 wasteland 風格背景
6. WHEN 頁面載入或狀態轉換 THEN 系統 SHALL 使用符合主題的動畫效果（例如：終端機掃描線、輻射閃爍）
7. WHERE Modal 設計 THE 系統 SHALL 使用 Pip-Boy 終端機視窗風格（綠色邊框、掃描線效果、復古終端介面）

### Requirement 8: 效能與可用性
**Objective:** 作為訪客，我想要獲得流暢的互動體驗，以便我能順利完成快速占卜流程而不受技術問題干擾

#### Acceptance Criteria

1. WHEN 用戶首次載入頁面 THEN 系統 SHALL 在 3 秒內顯示完整的卡背陣列
2. WHEN 用戶點擊卡背觸發翻牌 THEN 系統 SHALL 在 100ms 內開始動畫回應
3. WHERE 圖片資源 THE 系統 SHALL 實作圖片預載入策略（卡背、卡面圖片）
4. WHEN 系統執行 localStorage 讀寫操作 THEN 操作 SHALL 在 50ms 內完成
5. IF JavaScript 執行錯誤發生 THEN 系統 SHALL 顯示友善的錯誤訊息並提供重新載入選項
6. WHEN 用戶使用鍵盤導航 THEN 所有互動元素 SHALL 具備可見的 focus 狀態指示
7. WHERE 無障礙需求 THE 系統 SHALL 符合 WCAG 2.1 AA 標準：
   - 提供適當的 ARIA 標籤（role="button" 用於卡片、role="dialog" 用於 Modal）
   - 支援螢幕閱讀器朗讀卡牌狀態（「未翻開」、「已選中」、「已禁用」）
   - 確保色彩對比度符合標準
8. WHEN Modal 開啟時 THEN 焦點 SHALL 自動移至 Modal 內的第一個可互動元素
9. WHEN Modal 關閉時 THEN 焦點 SHALL 返回至觸發開啟 Modal 的卡牌元素

### Requirement 9: 導流與轉換機制（強調訪客限制）
**Objective:** 作為產品擁有者，我想要在用戶抽卡後明確引導其註冊或登入，並透過「一次性體驗」的限制強化轉換動機

#### Acceptance Criteria

1. WHEN 用戶完成翻牌 THEN 系統 SHALL 在 Carousel 下方立即顯示明確的 CTA 區塊
2. WHERE 主要 CTA 區塊位置 THE 系統 SHALL 將其放置於 Carousel 正下方的顯眼位置
3. WHERE 主要 CTA 內容 THE 系統 SHALL 包含以下元素：
   - 醒目標題：「想獲得專屬於您的完整占卜體驗？」
   - **強化文案：「這是您的專屬命運展示 - 僅此一次。想要探索更多可能性？」**
   - 價值說明：列出登入後可獲得的功能（個人化 AI 解讀、占卜記錄保存、**無限次抽卡**、多種牌陣選擇、Karma 系統、Faction 陣營）
   - 主要行動按鈕：「立即註冊」（導向 `/auth/register`）
   - 次要行動連結：「已有帳號？立即登入」（導向 `/auth/login`）
4. WHEN 系統顯示主要 CTA 區塊 THEN 區塊 SHALL 使用 Pip-Boy 風格設計並具有視覺吸引力（例如：脈衝動畫邊框、輻射圖示）
5. WHEN 用戶檢視 Modal 解讀內容 THEN 系統 SHALL 在 Modal 底部額外顯示次要 CTA 區塊
6. WHERE 次要 CTA 內容（Modal 內） THE 系統 SHALL 包含：
   - 簡短標題：「想要更深入的解讀？」
   - **強化文案：「註冊後可無限次抽卡，探索完整塔羅智慧」**
   - 註冊按鈕（導向 `/auth/register`）
   - 登入連結（導向 `/auth/login`）
7. WHEN 用戶點擊任一註冊按鈕 THEN 系統 SHALL 導航至註冊頁面
8. WHEN 用戶點擊任一登入連結 THEN 系統 SHALL 導航至登入頁面
9. IF 用戶已登入 THEN 系統 SHALL 隱藏所有 CTA 區塊，改為顯示「前往完整占卜」按鈕（導向 `/readings/new`）
10. WHERE CTA 視覺層級 THE 主要 CTA（Carousel 下方）SHALL 比次要 CTA（Modal 內）更加醒目
11. **WHEN 用戶尚未翻牌 THEN 主要 CTA 區塊 SHALL 隱藏，僅在翻牌完成後顯示**
12. **WHEN 用戶載入頁面且 localStorage 已有記錄 THEN CTA 區塊 SHALL 立即顯示（因已處於「已抽卡」狀態）**

### Requirement 10: 首頁快速占卜入口差異化處理
**Objective:** 作為使用者，我希望首頁的快速占卜入口能根據我的登入狀態提供不同的功能導向

#### Acceptance Criteria

1. **WHEN 用戶未登入且瀏覽首頁 THEN 快速占卜按鈕 SHALL 顯示文字「快速占卜」**
2. **WHEN 用戶點擊未登入狀態的快速占卜按鈕 THEN 系統 SHALL 導航至 `/readings/quick`（demo 頁面）**
3. **WHEN 用戶已登入且瀏覽首頁 THEN 快速占卜按鈕 SHALL 顯示文字「新占卜」或「開始占卜」**
4. **WHEN 用戶點擊已登入狀態的快速占卜按鈕 THEN 系統 SHALL 導航至 `/readings/new` 或 Dashboard 的占卜頁面**
5. **WHERE 按鈕說明文字（subtitle） THE 未登入狀態 SHALL 顯示「嘗試樣本占卜 - 無需 Vault 註冊」**
6. **WHERE 按鈕說明文字（subtitle） THE 已登入狀態 SHALL 顯示「開始一場全新的塔羅占卜」**
7. **WHEN 首頁按鈕狀態切換 THEN 系統 SHALL 根據 `useAuthStore` 的 `user` 狀態動態調整文字與導向**

**實作位置**：`/src/app/page.tsx` 的 `handleQuickReading` 函式

### Requirement 11: 技術實作約束
**Objective:** 作為開發者，我需要遵循專案技術規範，以便確保程式碼品質與維護性

#### Acceptance Criteria

1. WHERE 前端技術棧 THE 系統 SHALL 使用以下技術：
   - Next.js 15 (App Router)
   - React 19
   - TypeScript 5
   - Tailwind CSS v4
2. WHERE UI 元件優先順序 THE 系統 SHALL 遵循以下選擇順序：
   - **第一優先**：shadcn/ui 元件
   - **第二優先**：Framer Motion 或 GSAP 動畫方案
   - **第三優先**：其他第三方套件或自訂實作
3. WHERE Carousel 實作 THE 系統 SHALL 優先使用 shadcn/ui Carousel 元件，如不存在則考慮 `embla-carousel-react`（shadcn/ui 底層使用）
4. WHERE Modal 實作 THE 系統 SHALL 使用 shadcn/ui 的 Dialog 元件
5. WHERE 按鈕與表單元件 THE 系統 SHALL 使用 shadcn/ui 的 Button、Form 等元件
6. WHERE 卡牌元件 THE 系統 SHALL 參考並複用以下既有元件：
   - `/src/components/tarot/TarotCard.tsx` - 支援翻牌動畫、觸控互動、音效整合
   - `/src/components/tarot/CardDetailModal.tsx` - Modal 解牌介面範本（含語音、分頁、Fallout 風格）
   - `/src/components/cards/CardThumbnail.tsx` - 卡牌縮圖元件（可選用於 Carousel）
7. WHERE 卡牌資料 THE 系統 SHALL 從 `/src/data/enhancedCards.ts` 匯入並過濾出大阿爾克納卡牌（`suit === '大阿爾克那'`）
8. WHEN 實作卡牌翻轉 THEN 系統 SHALL 參考 `TarotCard` 元件的翻牌邏輯（已實作 3D 翻轉、音效、觸控支援）
9. WHEN 實作 Modal 解牌 THEN 系統 SHALL 參考 `CardDetailModal` 元件的設計結構（已實作 Framer Motion 動畫、語音整合、分頁介面）
10. WHEN 實作語音功能 THEN 系統 SHALL 使用 `/src/hooks/useTextToSpeech.tsx` 現有的 hook（已在 `CardDetailModal` 中整合）
11. WHERE 檔案組織 THE 新頁面 SHALL 建立於 `/src/app/readings/quick/page.tsx`
12. IF 需要新的共享元件 THEN 元件 SHALL 放置於 `/src/components/readings/` 目錄下
13. **WHERE 確認對話框（已移除） THE 系統 SHALL NOT 實作重新抽卡確認對話框（訪客模式不提供）**
14. WHERE localStorage 操作 THE 系統 SHALL 實作錯誤處理機制（try-catch）以應對 storage quota 或隱私模式限制
15. WHEN 撰寫程式碼 THEN 系統 SHALL 遵循專案的 TypeScript 嚴格模式與程式碼風格規範

## Out of Scope (不在此階段範圍)

以下功能明確不在本需求範圍內，將於後續階段評估：

1. **多張卡牌選擇**：本版本僅支援選擇一張卡牌，不支援多張卡牌的牌陣
2. **用戶輸入問題**：無需實作問題輸入欄位，直接進行通用占卜
3. **個人化解讀**：不需整合用戶的 Karma 或 Faction 資料
4. **占卜記錄雲端儲存**：僅使用 localStorage，不同步至後端資料庫
5. **多語言支援**：僅支援繁體中文（zh-TW）
6. **AI 生成解讀**：使用 `enhancedCards.ts` 預先撰寫的固定解讀文字，不呼叫 AI API
7. **社交分享功能**：本階段不實作分享至社群媒體功能
8. **列印功能**：不提供列印占卜結果功能
9. **自動播放 Carousel**：不實作自動輪播功能，僅支援手動導航
10. **過期機制**：localStorage 中的抽卡記錄無自動過期時間
11. **訪客重新抽卡功能**：訪客模式不提供重新抽卡功能（已明確移除）
12. **跨裝置同步**：localStorage 資料不跨裝置同步（僅存在於當前瀏覽器）

## Technical Dependencies

### 核心框架
- 前端框架：Next.js 15.1.7, React 19
- 語言：TypeScript 5
- 樣式系統：Tailwind CSS v4

### UI 元件（優先順序）
1. **shadcn/ui 元件（第一優先）**：
   - Carousel（基於 embla-carousel-react）
   - Dialog（Modal）
   - ~~AlertDialog（確認對話框）~~ - 已移除
   - Button
   - 其他 UI 元件
2. **動畫方案（第二優先）**：
   - Framer Motion（複雜動畫）
   - GSAP（高效能動畫）
3. **其他方案（第三優先）**：
   - CSS Transforms + Transitions（簡單動畫）
   - 自訂元件

### 現有資源與可複用元件

**卡牌元件（完全可複用）**：
- **`TarotCard.tsx`**（`/src/components/tarot/`）
  - ✅ 支援翻牌動畫（3D transform, 600ms）
  - ✅ 音效整合（翻牌、hover 音效）
  - ✅ 觸控互動（tap, long-press, swipe）
  - ✅ 狀態指示（idle, revealing, revealed, selected）
  - ✅ 兩種風格：default / kokonut（Pip-Boy 風格）
  - ✅ 響應式設計與無障礙支援

- **`CardDetailModal.tsx`**（`/src/components/tarot/`）
  - ✅ Framer Motion 動畫 Modal
  - ✅ 語音播放整合（含 AudioVisualizer）
  - ✅ 分頁介面（overview, meanings, characters, lore）
  - ✅ Fallout 主題設計
  - ✅ 完整卡牌資訊展示（含 character_voice_interpretations）
  - ✅ 書籤、分享、學習模式功能

- **`CardThumbnail.tsx`**（`/src/components/cards/`）
  - ✅ 卡牌縮圖展示
  - ✅ 延遲載入、錯誤處理
  - ✅ Pip-Boy 風格卡片設計

**其他現有資源**：
- 語音功能：`/src/hooks/useTextToSpeech.tsx`（已在 `CardDetailModal` 整合）
- 音效系統：`/src/hooks/audio/useAudioEffect.ts`（已在 `TarotCard` 整合）
- 觸控互動：`/src/hooks/useTouchInteractions.ts`
- 資料來源：`/src/data/enhancedCards.ts`（含 `DetailedTarotCard` 介面）
- 本地儲存：Browser localStorage API

## Success Criteria

此功能成功的標準包括：

1. 頁面載入時間 < 3 秒
2. Carousel 滑動操作流暢，轉場動畫 < 300ms
3. 翻牌動畫流暢，持續時間 600-800ms
4. localStorage 讀寫操作 < 50ms
5. Modal 開啟/關閉動畫 < 300ms
6. 語音播放功能在主流瀏覽器（Chrome, Firefox, Safari, Edge）正常運作
7. 通過 WCAG 2.1 AA 無障礙檢測
8. 移動裝置響應式設計測試通過（375px, 768px, 1024px, 1280px）
9. localStorage 持久化功能在頁面重新整理、關閉瀏覽器後重新開啟時正常運作
10. 訪客完成占卜後看到 CTA 的比例達 100%
11. 訪客完成占卜後的註冊轉換率提升可測量（目標：至少 15% 點擊 CTA）
12. **訪客重新進入頁面時，能直接看到已抽取的卡牌（無重新抽卡選項）**
13. **首頁快速占卜按鈕根據登入狀態正確顯示不同文字與導向**

## Data Structure for localStorage

```typescript
interface QuickReadingState {
  selectedCardId: string;        // 被選中的卡牌 ID
  cardPoolIds: string[];         // 卡牌池中的 5 張卡牌 ID（保持順序）
  timestamp: number;             // 翻牌時間戳記（Unix timestamp）
}

// localStorage key: 'wasteland-tarot-quick-reading'
// 範例值：
// {
//   "selectedCardId": "0",
//   "cardPoolIds": ["0", "5", "12", "18", "21"],
//   "timestamp": 1696800000000
// }
```

## User Story Scenarios

### Scenario 1: 訪客首次體驗快速占卜

**故事描述**：
小明是一位對塔羅感興趣但從未註冊過廢土塔羅的訪客。他在首頁看到「快速占卜」按鈕，好奇點擊後進入了快速占卜頁面。系統隨機生成 5 張大阿爾克納卡牌並以 Carousel 形式展示。小明透過左右箭頭瀏覽卡牌，最後選擇了第三張卡背點擊，卡牌翻轉展示正面，系統將結果儲存至 localStorage。小明點擊翻開的卡牌後，Modal 開啟並顯示詳細解讀，他點擊語音播放按鈕聽取卡牌的含義。完成體驗後，他看到明確的 CTA 區塊，了解到註冊後可以無限次抽卡並獲得更多功能，決定註冊帳號。

#### Acceptance Criteria 1.1: 首次進入頁面顯示卡背
- **Given** 小明未登入且從未訪問過快速占卜頁面
- **When** 小明點擊首頁的「快速占卜」按鈕並導航至 `/readings/quick`
- **Then** 系統應該顯示 5 張隨機選取的大阿爾克納卡背，以 Carousel 形式排列

#### Acceptance Criteria 1.2: 翻牌後儲存至 localStorage
- **Given** 小明正在瀏覽 Carousel 中的卡背
- **When** 小明點擊第三張卡背並完成翻牌動畫
- **Then** 系統應該將選中的卡牌 ID 與卡牌池 ID 儲存至 localStorage，並將其他 4 張卡片設為不可點擊狀態

#### Acceptance Criteria 1.3: 重新整理後恢復狀態
- **Given** 小明已經完成翻牌並關閉瀏覽器
- **When** 小明重新開啟瀏覽器並導航至 `/readings/quick`
- **Then** 系統應該從 localStorage 讀取先前的抽卡結果，直接顯示翻開的卡牌狀態，而非重新開始抽卡流程

### Scenario 2: 已註冊使用者從首頁進入完整占卜

**故事描述**：
小華是一位已註冊的廢土塔羅使用者。他登入後瀏覽首頁，看到快速占卜按鈕的文字變更為「新占卜」。他點擊按鈕後，系統將他導向至完整的占卜頁面（`/readings/new`），在那裡他可以選擇不同的牌陣、儲存占卜記錄、並無限次重新抽卡。

#### Acceptance Criteria 2.1: 首頁按鈕根據登入狀態調整
- **Given** 小華已登入並瀏覽首頁
- **When** 小華查看快速占卜按鈕
- **Then** 按鈕應該顯示文字「新占卜」而非「快速占卜」，並且說明文字為「開始一場全新的塔羅占卜」

#### Acceptance Criteria 2.2: 已登入使用者導向完整功能
- **Given** 小華已登入並在首頁
- **When** 小華點擊「新占卜」按鈕
- **Then** 系統應該導航至 `/readings/new` 或 Dashboard 的占卜頁面，而非 `/readings/quick`

#### Acceptance Criteria 2.3: 訪客 Demo 頁面對已登入使用者的處理
- **Given** 小華已登入且直接訪問 `/readings/quick` URL
- **When** 頁面載入完成
- **Then** 系統應該隱藏 CTA 區塊，並顯示「前往完整占卜」按鈕，引導使用者前往完整功能頁面

## Boundary Conditions and Edge Cases

### Edge Case 1: localStorage 配額超限
**描述**：當瀏覽器的 localStorage 配額已滿時，系統嘗試儲存抽卡結果失敗
**預期行為**：
- 捕捉 `QuotaExceededError` 錯誤
- 嘗試清除非關鍵的 localStorage 項目並重試
- 若仍失敗，降級至 sessionStorage 或純記憶體狀態
- 顯示友善提示：「由於儲存空間限制，結果僅在當前分頁有效」

### Edge Case 2: 隱私模式或 localStorage 被禁用
**描述**：使用者在瀏覽器隱私模式下訪問頁面，localStorage API 不可用
**預期行為**：
- 檢測 localStorage 可用性
- 降級至純 React state（無持久化）
- 顯示警告訊息：「瀏覽器隱私模式下無法保存結果，關閉分頁後將清除」
- 功能仍可正常使用，僅無法持久化

### Edge Case 3: localStorage 資料損壞
**描述**：localStorage 中的 JSON 資料格式錯誤或缺少必要欄位
**預期行為**：
- 捕捉 `JSON.parse()` 錯誤或驗證失敗
- 自動清除損壞的資料
- 重新初始化卡牌池，讓使用者重新抽卡
- 不顯示錯誤訊息（對使用者透明處理）

### Edge Case 4: 卡牌資料載入失敗
**描述**：`enhancedCards.ts` 匯入失敗或資料格式不符預期
**預期行為**：
- 捕捉匯入錯誤
- 顯示錯誤訊息：「卡牌資料載入失敗」
- 提供「重新載入」按鈕或「返回首頁」選項
- 記錄錯誤至 console（開發環境）

### Edge Case 5: 圖片載入失敗
**描述**：卡牌圖片 404 或網路錯誤導致圖片無法顯示
**預期行為**：
- `TarotCard` 元件已內建錯誤處理，顯示佔位圖
- 不中斷使用者流程
- 記錄錯誤但不通知使用者

### Edge Case 6: 大阿爾克納數量不足
**描述**：`enhancedCards.ts` 中的大阿爾克納少於 5 張
**預期行為**：
- 使用所有可用的大阿爾克納（例如僅 3 張）
- 調整 Carousel 顯示數量
- 記錄警告至 console

### Edge Case 7: 已登入使用者訪問訪客 Demo 頁面
**描述**：已登入使用者直接輸入 `/readings/quick` URL
**預期行為**：
- 允許訪問（不強制重定向）
- 隱藏 CTA 區塊，改為顯示「前往完整占卜」按鈕
- 功能正常運作，但強調這是簡化版本

### Edge Case 8: 訪客嘗試清除 localStorage 重新抽卡
**描述**：訪客透過瀏覽器開發者工具或清除快取來刪除 localStorage 資料
**預期行為**：
- 允許此行為（這是使用者的主動選擇）
- 系統檢測到無 localStorage 記錄後，重新初始化卡牌池
- 允許訪客重新體驗一次抽卡流程

## Constraints and Assumptions

### Technical Constraints
- **前端技術棧**：Next.js 15, React 19, TypeScript 5, Tailwind CSS v4
- **瀏覽器支援**：現代瀏覽器（Chrome, Firefox, Safari, Edge）最新兩個版本
- **localStorage 容量**：約 5-10MB，本功能使用 < 1KB
- **Web Speech API**：僅部分瀏覽器支援，需提供降級方案

### Business Constraints
- **開發時間**：預計 3-4 天完成開發、測試與部署
- **無後端整合**：純前端功能，不依賴後端 API
- **無 AI 整合**：使用預先撰寫的固定解讀文字

### Assumptions
- **訪客行為假設**：訪客在首次體驗後會有動機註冊以獲得更多功能
- **localStorage 可用性**：假設大部分使用者瀏覽器支援 localStorage
- **卡牌資料完整性**：假設 `enhancedCards.ts` 包含至少 5 張大阿爾克納且資料格式正確
- **圖片資源可用性**：假設卡背與卡面圖片檔案存在於指定路徑
- **使用者網路環境**：假設使用者網路連線穩定，能正常載入圖片與腳本

---

**Document Version**: 2.0 (Updated 2025-10-08)
**Last Updated**: 2025-10-08
**Status**: Requirements Updated, Pending Design & Implementation Review
**Change Summary**:
- 移除訪客的重新抽卡功能（Requirement 4）
- 更新 localStorage 持久化機制為永久保存（Requirement 3）
- 新增首頁快速占卜入口差異化處理（Requirement 10）
- 強化 CTA 文案以反映「一次性體驗」的稀缺性（Requirement 9）
- 新增兩個使用者故事場景（Scenario 1 & 2）
- 新增多個邊界情況與例外場景（Edge Cases 1-8）
