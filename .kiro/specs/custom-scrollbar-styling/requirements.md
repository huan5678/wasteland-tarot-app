# Requirements Document

## Introduction

本功能旨在為 Wasteland Tarot 平台實作自訂捲軸條（scrollbar）樣式，使其視覺風格與現有的 Fallout 主題設計系統保持一致。透過自訂 scrollbar 的顏色、樣式與互動效果，提升整體使用者介面的沉浸感與視覺一致性。

### 商業價值
- **視覺一致性**：統一的 scrollbar 設計強化 Pip-Boy 介面的真實感
- **品牌識別**：獨特的廢土風格 scrollbar 提升品牌辨識度
- **使用者體驗**：符合主題的互動元素增強沉浸式體驗
- **無障礙支援**：確保自訂 scrollbar 不影響鍵盤導航與螢幕閱讀器功能

## Requirements

### Requirement 1: Scrollbar 基礎樣式

**User Story:** 作為使用者，我希望看到符合廢土主題的捲軸條設計，以便獲得一致的視覺體驗

#### Acceptance Criteria

1. WHEN 頁面載入 THEN 系統 SHALL 套用自訂 scrollbar 樣式至所有可捲動容器
2. WHERE scrollbar track（軌道）區域 THE 系統 SHALL 使用 `--color-wasteland-medium` (#2d2d2d) 作為背景色
3. WHERE scrollbar thumb（滑塊）區域 THE 系統 SHALL 使用 `--color-pip-boy-green-dark` (#00cc66) 作為主要顏色
4. WHEN scrollbar thumb 處於預設狀態 THEN 系統 SHALL 套用 2px 圓角邊框
5. IF 瀏覽器支援 CSS scrollbar 自訂 THEN 系統 SHALL 套用完整的 Fallout 主題樣式
6. IF 瀏覽器不支援 CSS scrollbar 自訂 THEN 系統 SHALL 保持瀏覽器預設 scrollbar 外觀

### Requirement 2: Scrollbar 互動狀態

**User Story:** 作為使用者，我希望 scrollbar 在互動時提供視覺回饋，以便清楚了解當前狀態

#### Acceptance Criteria

1. WHEN 使用者將滑鼠懸停於 scrollbar thumb THEN 系統 SHALL 將顏色變更為 `--color-pip-boy-green` (#00ff88)
2. WHEN 使用者將滑鼠懸停於 scrollbar thumb THEN 系統 SHALL 套用微光效果（glow effect）使用 `--color-glow-green`
3. WHEN 使用者按住並拖曳 scrollbar thumb THEN 系統 SHALL 將顏色變更為 `--color-pip-boy-green-bright` (#00ff41)
4. WHEN 使用者按住並拖曳 scrollbar thumb THEN 系統 SHALL 增強微光效果至 0.8 透明度
5. WHEN 使用者停止互動 THEN 系統 SHALL 在 0.2 秒內平滑過渡回預設狀態

### Requirement 3: 跨瀏覽器相容性

**User Story:** 作為使用者，我希望在不同瀏覽器上都能看到一致的 scrollbar 樣式，以便獲得統一體驗

#### Acceptance Criteria

1. WHERE 瀏覽器為 Chrome/Edge/Safari THE 系統 SHALL 使用 `::-webkit-scrollbar` 偽元素實作樣式
2. WHERE 瀏覽器為 Firefox THE 系統 SHALL 使用 `scrollbar-width` 與 `scrollbar-color` 屬性實作樣式
3. WHEN 瀏覽器不支援 scrollbar 樣式自訂 THEN 系統 SHALL 優雅降級至瀏覽器預設樣式
4. WHERE 在所有支援的瀏覽器中 THE 系統 SHALL 確保 scrollbar 寬度為 12px（桌面）或 8px（行動裝置）

### Requirement 4: 響應式設計

**User Story:** 作為使用者，我希望 scrollbar 在不同裝置上都能正常顯示，以便在各種螢幕尺寸下使用

#### Acceptance Criteria

1. WHEN 螢幕寬度 >= 1024px（桌面）THEN 系統 SHALL 設定 scrollbar 寬度為 12px
2. WHEN 螢幕寬度 >= 768px AND < 1024px（平板）THEN 系統 SHALL 設定 scrollbar 寬度為 10px
3. WHEN 螢幕寬度 < 768px（手機）THEN 系統 SHALL 設定 scrollbar 寬度為 8px
4. WHERE 在觸控裝置上 THE 系統 SHALL 在滑動時顯示 scrollbar，靜止 1.5 秒後自動隱藏
5. WHEN 使用者在行動裝置上觸控捲動 THEN 系統 SHALL 顯示簡化版 scrollbar（僅 thumb，無 track）

### Requirement 5: 無障礙功能

**User Story:** 作為使用輔助技術的使用者，我希望自訂 scrollbar 不影響鍵盤導航與螢幕閱讀器，以便正常使用網站

#### Acceptance Criteria

1. WHEN 使用者使用鍵盤導航（方向鍵、Page Up/Down、Home/End）THEN 系統 SHALL 正常捲動頁面
2. WHEN 使用者使用螢幕閱讀器 THEN 系統 SHALL 不因自訂 scrollbar 而影響內容讀取順序
3. WHEN 使用者啟用 `prefers-reduced-motion` THEN 系統 SHALL 移除 scrollbar 的過渡動畫效果
4. WHERE 使用者啟用高對比模式 THE 系統 SHALL 確保 scrollbar 與背景有足夠的對比度（至少 3:1）
5. IF 使用者透過 Tab 鍵導航至可捲動區域 THEN 系統 SHALL 確保 focus 狀態可見且不被 scrollbar 遮擋

### Requirement 6: 特殊容器支援

**User Story:** 作為使用者，我希望網站中的所有可捲動容器都套用一致的 scrollbar 樣式，以便獲得統一體驗

#### Acceptance Criteria

1. WHERE 全域頁面捲動（body/html）THE 系統 SHALL 套用完整的 Fallout 主題 scrollbar 樣式
2. WHERE 卡牌詳情彈窗（modals）THE 系統 SHALL 套用相同的 scrollbar 樣式
3. WHERE 閱讀歷史列表容器 THE 系統 SHALL 套用相同的 scrollbar 樣式
4. WHERE 下拉選單（select/dropdown）THE 系統 SHALL 套用相同的 scrollbar 樣式
5. WHERE textarea 與 contenteditable 元素 THE 系統 SHALL 套用相同的 scrollbar 樣式
6. WHEN 容器有 `overflow-y: auto` 或 `overflow-y: scroll` THEN 系統 SHALL 自動套用自訂 scrollbar 樣式

### Requirement 7: 效能最佳化

**User Story:** 作為使用者，我希望自訂 scrollbar 不影響頁面效能，以便流暢地使用網站

#### Acceptance Criteria

1. WHEN 頁面載入 THEN 系統 SHALL 在初始 CSS 中包含 scrollbar 樣式，避免閃爍（FOUC）
2. WHEN 使用者捲動頁面 THEN 系統 SHALL 確保 scrollbar 動畫不觸發不必要的重排（reflow）
3. WHERE scrollbar 使用 GPU 加速屬性（如 opacity, transform）THE 系統 SHALL 優先使用這些屬性實作動畫
4. WHEN 頁面包含多個可捲動容器 THEN 系統 SHALL 確保 scrollbar 樣式不影響整體渲染效能
5. IF 偵測到效能問題（FPS < 30）THEN 系統 SHALL 停用 scrollbar 動畫效果

### Requirement 8: 樣式一致性與維護性

**User Story:** 作為開發者，我希望 scrollbar 樣式使用現有的設計系統變數，以便易於維護與更新

#### Acceptance Criteria

1. WHERE scrollbar 樣式定義 THE 系統 SHALL 使用 `globals.css` 中定義的 CSS 變數（如 `--color-pip-boy-green`）
2. WHEN 設計系統顏色變更 THEN scrollbar 樣式 SHALL 自動繼承新的顏色值
3. WHERE scrollbar 樣式代碼 THE 系統 SHALL 集中於 `globals.css` 的 `@layer components` 區塊中
4. WHEN 新增 scrollbar 樣式類別 THEN 系統 SHALL 遵循現有的命名慣例（如 `.scrollbar-pip-boy`）
5. WHERE scrollbar 相關代碼 THE 系統 SHALL 包含清楚的註解說明各瀏覽器的實作差異
