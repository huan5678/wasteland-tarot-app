# Requirements Document

## Introduction

本需求文件定義擴充並統一現有 PipBoy UI 元件系統 (`src/components/ui/pipboy/`) 的完整規範。專案現已具備基礎 PipBoy 元件（PipBoyButton、PipBoyCard、LoadingSpinner、ErrorDisplay），以及完整的 Cubic 11 字體系統、Pip-Boy Green 配色系統、CRT 掃描線效果，以及統一的 PixelIcon 圖示系統。本次擴充將補齊缺少的表單控制元件（Input、Select、Label）、對話框元件（Dialog），並增強現有元件以對齊 shadcn/ui 的 API 規範，最終將所有頁面（首頁、卡牌、賓果、成就、解讀）從 shadcn/ui 平滑遷移至完整的 PipBoy 元件體系。

此整合將在保持向後相容性的同時，為 Wasteland Tarot 平台帶來更沉浸式的廢土風格體驗，並確保全站視覺風格統一、無障礙支援完整，以及 TypeScript 類型安全。

專案目標包含：
1. 擴充現有 PipBoy 元件系統，新建缺失的核心 UI 元件
2. 逐步將頁面中的 shadcn/ui 元件替換為 PipBoy 元件
3. 統一全站視覺風格，強化 Pip-Boy 終端機美學
4. 提升無障礙支援並確保 WCAG AA 合規
5. 增強 TypeScript 類型安全與開發體驗
6. 確保所有現有頁面（首頁、卡牌、賓果、成就、解讀）平滑過渡

---

## Requirements

### Requirement 1: PipBoy 元件系統基礎擴充

**Objective:** 作為開發人員，我需要建立 PipBoy 元件系統的完整基礎設施，以便能夠統一管理、匯出和使用所有 PipBoy 風格元件。

#### Acceptance Criteria

1. WHEN 開發人員需要使用 PipBoy 元件 THEN 元件系統 SHALL 提供統一的匯出檔案 `src/components/ui/pipboy/index.ts`
2. WHEN 建立匯出檔案 THEN 元件系統 SHALL 包含所有 PipBoy 元件的命名匯出（PipBoyButton, PipBoyCard, PipBoyInput, PipBoySelect, PipBoyLabel, PipBoyDialog, LoadingSpinner, ErrorDisplay）
3. WHEN 定義元件 API THEN 元件系統 SHALL 與 shadcn/ui 元件 API 保持一致（相同的 prop 名稱與類型）
4. WHERE 元件支援變體功能 THEN 元件系統 SHALL 使用 class-variance-authority (CVA) 套件定義變體系統
5. WHEN 元件使用 CVA 變體 THEN 元件系統 SHALL 定義 variants 物件包含所有可用的變體選項
6. WHEN 整合 Tailwind CSS THEN 元件系統 SHALL 使用現有的 Tailwind 配置檔案（`tailwind.config.ts`）
7. IF Tailwind 配置缺少必要的 CSS 變數 THEN 元件系統 SHALL 在全域 CSS 中補充 PipBoy 主題變數
8. WHEN 開發人員查看元件目錄 THEN 檔案系統 SHALL 在 `src/components/ui/pipboy/README.md` 提供完整的元件使用指南

---

### Requirement 2: CRT 掃描線視覺效果

**Objective:** 作為使用者，我希望所有 PipBoy 元件都具備 CRT 掃描線效果，以獲得真實的 Pip-Boy 終端機視覺體驗。

#### Acceptance Criteria

1. WHEN 任何 PipBoy 元件渲染至畫面 THEN UI 系統 SHALL 自動套用 CRT 掃描線效果
2. WHEN CRT 掃描線效果啟用 THEN UI 系統 SHALL 使用水平掃描線動畫，間距為 2-4 像素
3. WHEN CRT 效果渲染 THEN UI 系統 SHALL 確保掃描線透明度為 5-10%，不影響內容可讀性
4. IF 使用者裝置效能較低 THEN UI 系統 SHALL 自動降低掃描線動畫幀率或關閉效果
5. WHERE 元件包含文字內容 THEN UI 系統 SHALL 確保 CRT 效果不降低文字對比度至 WCAG AA 標準以下
6. WHILE 掃描線效果運作中 THE UI 系統 SHALL 維持 60fps 的畫面更新率（桌面裝置）
7. WHEN 使用者啟用減少動畫偏好設定 THEN UI 系統 SHALL 自動停用 CRT 掃描線動畫效果

---

### Requirement 3: Pip-Boy Green 配色系統

**Objective:** 作為使用者，我希望所有 PipBoy 元件採用一致的 Pip-Boy 綠色配色方案，以強化 Fallout 主題的沉浸感。

#### Acceptance Criteria

1. WHEN PipBoy 元件渲染 THEN UI 系統 SHALL 使用主要色彩 Pip-Boy Green (#00ff88)
2. WHEN 元件需要次要色彩 THEN UI 系統 SHALL 使用 Radiation Orange (#ff8800) 作為強調色
3. WHEN 元件需要成功狀態指示 THEN UI 系統 SHALL 使用 Bright Green (#00ff41)
4. WHEN 元件需要警告狀態指示 THEN UI 系統 SHALL 使用 Warning Yellow (#ffdd00)
5. WHEN 元件需要錯誤狀態指示 THEN UI 系統 SHALL 使用 Deep Red (#ef4444)
6. WHEN 元件需要資訊狀態指示 THEN UI 系統 SHALL 使用 Vault Blue (#0055aa)
7. WHERE 文字顯示在背景上 THEN UI 系統 SHALL 確保色彩對比度至少達到 WCAG AA 標準（4.5:1）
8. IF 元件支援暗色模式 THEN UI 系統 SHALL 自動調整 Pip-Boy Green 色調以維持對比度
9. WHEN 滑鼠懸停於互動元件 THEN UI 系統 SHALL 將 Pip-Boy Green 亮度提升 20%
10. WHEN 元件處於停用狀態 THEN UI 系統 SHALL 將色彩飽和度降低 60% 並降低不透明度至 40%

---

### Requirement 4: Cubic 11 字體整合

**Objective:** 作為使用者，我希望所有 PipBoy 元件使用 Cubic 11 像素字體，以確保與全站字體系統一致。

#### Acceptance Criteria

1. WHEN PipBoy 元件渲染文字內容 THEN UI 系統 SHALL 使用 Cubic 11 字體（11×11 像素點陣字體）
2. WHEN 元件需要顯示繁體中文 THEN UI 系統 SHALL 確保 Cubic 11 字體正確渲染 4808+ 繁體中文字元
3. WHEN 元件需要顯示拉丁字母 THEN UI 系統 SHALL 確保 Cubic 11 字體正確渲染完整拉丁字母集
4. IF Cubic 11 字體載入失敗 THEN UI 系統 SHALL 自動降級至系統 monospace 字體
5. WHERE 元件包含多種字體大小 THEN UI 系統 SHALL 確保所有尺寸皆保持像素完美對齊
6. WHEN 元件使用 font-family CSS 屬性 THEN UI 系統 SHALL 設定為 `var(--font-cubic)` 或繼承自父元素
7. WHEN 瀏覽器不支援 WOFF2 格式 THEN UI 系統 SHALL 自動載入 WOFF 格式的 Cubic 11 備援字體

---

### Requirement 5: PipBoyButton 元件擴充與增強

**Objective:** 作為開發人員，我需要擴充現有的 PipBoyButton 元件，增加完整的變體選項以對齊 shadcn/ui Button API，以獲得增強的 Fallout 風格按鈕樣式。

#### Acceptance Criteria

1. WHEN 擴充 PipBoyButton 元件 THEN 元件系統 SHALL 保留現有的 2 個基礎變體（default, outline）
2. WHEN 擴充變體系統 THEN 元件系統 SHALL 新增 7 個額外變體（destructive, secondary, ghost, link, success, warning, info）以對齊 shadcn/ui
3. WHEN 擴充尺寸系統 THEN 元件系統 SHALL 支援所有尺寸選項（default, sm, lg, icon）
4. WHEN PipBoyButton 渲染 THEN 元件系統 SHALL 自動套用 Pip-Boy 綠色邊框與終端機風格陰影
5. WHEN 使用者點擊 PipBoyButton THEN 元件系統 SHALL 播放終端機按鍵音效（如果音效系統已啟用）
6. WHEN 滑鼠懸停於 PipBoyButton THEN 元件系統 SHALL 顯示綠色發光效果並提升亮度
7. IF PipBoyButton 處於 disabled 狀態 THEN 元件系統 SHALL 顯示灰色調且不回應任何互動事件
8. WHERE PipBoyButton 使用於表單提交 THEN 元件系統 SHALL 在提交期間顯示載入旋轉圖示
9. WHEN PipBoyButton 包含圖示 THEN 元件系統 SHALL 確保圖示與文字之間有適當的間距（8px）
10. WHEN 元件擴充完成後 THEN 元件系統 SHALL 匯出完整的 TypeScript 類型定義（ButtonProps, ButtonVariant, ButtonSize）

---

### Requirement 6: PipBoy 表單控制元件建立

**Objective:** 作為開發人員，我需要建立全新的 PipBoyInput、PipBoySelect、PipBoyLabel 元件，以獲得一致的復古終端機輸入風格。

#### Acceptance Criteria

1. WHEN 建立 PipBoyInput 元件 THEN 元件系統 SHALL 對齊 shadcn/ui Input 元件的 API 與 prop 類型
2. WHEN PipBoyInput 渲染 THEN 元件系統 SHALL 套用 Pip-Boy 綠色邊框與終端機風格背景（半透明黑底）
3. WHEN 使用者聚焦於 PipBoyInput THEN 元件系統 SHALL 顯示脈衝綠色外框動畫
4. WHEN 使用者輸入文字 THEN 元件系統 SHALL 播放終端機打字音效（如果音效系統已啟用）
5. WHEN PipBoyInput 顯示錯誤狀態 THEN 元件系統 SHALL 切換邊框色彩至 Deep Red (#ef4444)
6. WHEN 建立 PipBoySelect 元件 THEN 元件系統 SHALL 使用 Radix UI Select Primitive 作為底層實作
7. WHEN PipBoySelect 開啟下拉選單 THEN 元件系統 SHALL 顯示終端機風格的選單背景與綠色邊框
8. WHEN 使用者懸停於 PipBoySelect 選項 THEN 元件系統 SHALL 以 Pip-Boy Green 高亮顯示該選項
9. WHEN 建立 PipBoyLabel 元件 THEN 元件系統 SHALL 對齊 shadcn/ui Label 元件的 API（使用 Radix UI Label Primitive）
10. WHEN PipBoyLabel 渲染 THEN 元件系統 SHALL 使用 Cubic 11 字體並套用 Pip-Boy Green 色彩
11. IF 任何表單控制元件處於 disabled 狀態 THEN 元件系統 SHALL 降低不透明度至 40% 並移除所有互動效果
12. WHERE 表單包含驗證錯誤 THEN 元件系統 SHALL 在對應 Input 下方顯示 Radiation Orange 色彩的錯誤訊息

---

### Requirement 7: PipBoyDialog 元件建立

**Objective:** 作為開發人員，我需要建立全新的 PipBoyDialog 元件，以獲得 Vault-Tec 品牌風格的彈出視窗。

#### Acceptance Criteria

1. WHEN 建立 PipBoyDialog 元件 THEN 元件系統 SHALL 使用 Radix UI Dialog Primitive 作為底層實作
2. WHEN PipBoyDialog 開啟 THEN 元件系統 SHALL 顯示終端機風格的標題列，包含 Vault-Tec 標誌
3. WHEN PipBoyDialog 渲染 THEN 元件系統 SHALL 套用 CRT 掃描線效果於整個對話框區域
4. WHEN PipBoyDialog 開啟動畫執行 THEN 元件系統 SHALL 使用淡入效果搭配綠色閃爍（持續時間 300ms）
5. WHEN PipBoyDialog 關閉動畫執行 THEN 元件系統 SHALL 使用淡出效果搭配掃描線收縮（持續時間 250ms）
6. WHEN 使用者點擊 PipBoyDialog 背景遮罩 THEN 元件系統 SHALL 關閉 Dialog（除非 closeOnBackdropClick 設為 false）
7. WHEN 使用者按下 Escape 鍵 THEN 元件系統 SHALL 關閉 Dialog（除非 closeOnEscape 設為 false）
8. WHERE PipBoyDialog 包含表單內容 THEN 元件系統 SHALL 自動將焦點設定至第一個可聚焦元素
9. WHEN PipBoyDialog 關閉 THEN 元件系統 SHALL 恢復焦點至開啟 Dialog 前的觸發元素
10. IF PipBoyDialog 內容超過視窗高度 THEN 元件系統 SHALL 啟用垂直捲軸並保持標題列固定
11. WHEN PipBoyDialog 元件建立完成 THEN 元件系統 SHALL 提供子元件（DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter）
12. WHEN 現有專案使用 `@/components/ui/sheet` 或 `@/components/ui/morphing-dialog` THEN 遷移指南 SHALL 建議評估是否可替換為 PipBoyDialog

---

### Requirement 8: PipBoyCard 元件擴充與增強

**Objective:** 作為開發人員，我需要擴充現有的 PipBoyCard 元件，對齊 shadcn/ui Card API，以獲得廢土主題的卡片樣式與陰影效果。

#### Acceptance Criteria

1. WHEN 擴充 PipBoyCard 元件 THEN 元件系統 SHALL 保留現有的基礎卡片樣式
2. WHEN 對齊 shadcn/ui API THEN 元件系統 SHALL 提供子元件（CardHeader, CardTitle, CardDescription, CardContent, CardFooter）
3. WHEN PipBoyCard 渲染 THEN 元件系統 SHALL 套用雙層綠色邊框（外層亮綠、內層暗綠）
4. WHEN PipBoyCard 渲染 THEN 元件系統 SHALL 套用終端機風格的背景（半透明黑底，不透明度 85%）
5. WHEN 滑鼠懸停於 PipBoyCard THEN 元件系統 SHALL 提升邊框亮度 30% 並顯示內側綠色陰影
6. WHEN PipBoyCard 包含 CardHeader THEN 元件系統 SHALL 在標題下方顯示細綠色分隔線
7. WHEN PipBoyCard 包含 CardFooter THEN 元件系統 SHALL 在頁腳上方顯示細綠色分隔線
8. IF PipBoyCard 處於可點擊狀態（isClickable prop） THEN 元件系統 SHALL 在點擊時顯示內凹效果並播放終端機音效
9. WHERE PipBoyCard 用於顯示塔羅牌資訊 THEN 元件系統 SHALL 在四個角落顯示小型 Vault-Tec 裝飾圖示（可選）
10. WHEN PipBoyCard 顯示載入狀態（isLoading prop） THEN 元件系統 SHALL 顯示綠色脈衝動畫於整個卡片區域

---

### Requirement 9: 響應式設計支援

**Objective:** 作為使用者，我希望所有 PipBoy 元件在不同裝置尺寸下都能正常運作，以獲得一致的使用體驗。

#### Acceptance Criteria

1. WHEN 使用者在桌面裝置（>= 1024px）瀏覽網站 THEN UI 系統 SHALL 以完整尺寸顯示所有 PipBoy 元件
2. WHEN 使用者在平板裝置（768px - 1023px）瀏覽網站 THEN UI 系統 SHALL 縮小元件間距並調整 PipBoyDialog 寬度至 90% 視窗寬度
3. WHEN 使用者在手機裝置（< 768px）瀏覽網站 THEN UI 系統 SHALL 將 PipBoyDialog 切換為全螢幕模式
4. WHEN 手機裝置顯示 PipBoyButton THEN UI 系統 SHALL 增加最小可點擊區域至 44x44 像素（符合觸控目標標準）
5. WHEN 手機裝置顯示 PipBoyInput THEN UI 系統 SHALL 增加字體大小至最少 16px（避免自動縮放）
6. WHERE 螢幕寬度 < 640px THEN UI 系統 SHALL 將 PipBoySelect 下拉選單切換為原生 mobile picker
7. WHEN 裝置方向從直向切換至橫向 THEN UI 系統 SHALL 自動重新計算 PipBoyDialog 與 Modal 的尺寸
8. IF 裝置支援觸控輸入 THEN UI 系統 SHALL 增加所有互動元件的觸控目標區域至最少 44x44 像素
9. WHEN 使用者在小螢幕裝置開啟長內容 PipBoyDialog THEN UI 系統 SHALL 確保標題列固定且內容區域可捲動
10. WHEN 響應式斷點變更 THEN UI 系統 SHALL 在 300ms 內完成版面重排，不產生可見的閃爍

---

### Requirement 10: 無障礙支援

**Objective:** 作為輔助技術使用者，我希望所有 PipBoy 元件都符合 WCAG AA 標準，以便能夠無障礙地使用網站。

#### Acceptance Criteria

1. WHEN 任何 PipBoy 元件渲染 THEN 元件系統 SHALL 確保包含正確的 ARIA 屬性（role, aria-label, aria-describedby）
2. WHEN PipBoyButton 僅包含圖示 THEN 元件系統 SHALL 要求提供 aria-label 屬性
3. WHEN PipBoyDialog 開啟 THEN 元件系統 SHALL 設定 role="dialog" 及 aria-modal="true" 屬性
4. WHEN PipBoyDialog 開啟 THEN 元件系統 SHALL 將焦點鎖定於 Dialog 內部，防止焦點移至背景內容
5. WHEN 使用者使用 Tab 鍵導航 THEN 元件系統 SHALL 確保所有互動元件都可以鍵盤聚焦
6. WHEN 使用者按下 Enter 或 Space 鍵於 PipBoyButton 上 THEN 元件系統 SHALL 觸發點擊事件
7. WHEN 使用者按下上下方向鍵於 PipBoySelect 元件 THEN 元件系統 SHALL 移動選項焦點
8. WHERE 任何文字顯示於背景上 THEN 元件系統 SHALL 確保色彩對比度至少達到 4.5:1（WCAG AA 標準）
9. WHERE 大型文字（>= 18pt）顯示 THEN 元件系統 SHALL 確保色彩對比度至少達到 3:1
10. WHEN 表單驗證失敗 THEN 元件系統 SHALL 提供 aria-invalid="true" 及 aria-describedby 連結至錯誤訊息
11. WHEN PipBoyInput 獲得焦點 THEN 螢幕閱讀器 SHALL 能夠朗讀關聯的 PipBoyLabel 文字
12. IF 元件包含動畫效果 THEN 元件系統 SHALL 在使用者啟用 prefers-reduced-motion 時自動停用動畫
13. WHEN 使用螢幕閱讀器導航 THEN 元件系統 SHALL 確保所有 landmark regions 都有正確的 role 標記
14. WHEN 執行無障礙測試 THEN 測試系統 SHALL 使用 axe-core 驗證所有元件符合 WCAG AA 標準

---

### Requirement 11: TypeScript 類型安全

**Objective:** 作為開發人員，我需要 PipBoy 元件提供完整的 TypeScript 類型定義，以獲得更好的開發體驗與編譯時期錯誤檢查。

#### Acceptance Criteria

1. WHEN 建立 PipBoy 元件 THEN 元件系統 SHALL 為每個元件提供完整的 TypeScript 介面定義
2. WHEN 開發人員使用 PipBoy 元件 THEN IDE SHALL 提供自動完成建議（props, variants, sizes）
3. WHEN 開發人員傳入錯誤的 prop 類型 THEN TypeScript 編譯器 SHALL 顯示類型錯誤
4. WHEN 開發人員使用 PipBoyButton THEN TypeScript SHALL 驗證 variant prop 僅接受定義的值（default, destructive, outline, secondary, ghost, link, success, warning, info）
5. WHEN 開發人員使用 PipBoyButton THEN TypeScript SHALL 驗證 size prop 僅接受定義的值（default, sm, lg, icon）
6. IF 元件支援泛型類型參數 THEN TypeScript SHALL 正確推斷元件內部的類型
7. WHERE 元件接受 children prop THEN TypeScript SHALL 正確定義 children 類型（ReactNode）
8. WHEN 元件使用 forwardRef THEN TypeScript SHALL 正確推斷 ref 的類型（HTMLElement）
9. WHEN 開發人員擴展元件 props THEN TypeScript SHALL 支援類型交集與擴展（如 `ButtonProps & CustomProps`）
10. WHEN 執行 TypeScript 編譯 THEN 編譯系統 SHALL 在 strict mode 下無類型錯誤
11. WHEN 開發人員查看元件 props THEN IDE SHALL 顯示完整的 JSDoc 註解與使用範例
12. IF 元件 API 有重大變更 THEN 類型定義 SHALL 標記舊的 props 為 @deprecated

---

### Requirement 12: 頁面整合 - 首頁（Homepage）

**Objective:** 作為開發人員，我需要將首頁的所有 UI 元件遷移至 PipBoy 元件系統，以確保首頁視覺風格一致。

#### Acceptance Criteria

1. WHEN 首頁 Hero section 渲染 THEN UI 系統 SHALL 使用 PipBoyButton 元件取代現有 shadcn/ui Button
2. WHEN 首頁顯示「開始解讀」按鈕 THEN 元件系統 SHALL 套用 variant="default" 及 size="lg"
3. WHEN 首頁顯示快速示範卡片 THEN UI 系統 SHALL 使用 PipBoyCard 元件包裝卡片內容
4. WHERE 首頁包含表單輸入（如問題輸入） THEN UI 系統 SHALL 使用 PipBoyInput 元件
5. WHEN 使用者在首頁選擇牌陣類型 THEN UI 系統 SHALL 使用 PipBoySelect 元件
6. IF 首頁顯示載入狀態 THEN UI 系統 SHALL 使用 LoadingSpinner 或 Skeleton 元件
7. WHEN 首頁完成遷移 THEN 測試系統 SHALL 驗證所有現有的 E2E 測試案例皆能通過
8. WHEN 首頁完成遷移 THEN 視覺回歸測試 SHALL 確認無非預期的版面位移

---

### Requirement 13: 頁面整合 - 卡牌頁面（Cards Page）

**Objective:** 作為開發人員，我需要將卡牌瀏覽頁面的所有 UI 元件遷移至 PipBoy 元件系統，以提供一致的廢土風格卡片展示。

#### Acceptance Criteria

1. WHEN 卡牌頁面渲染卡片清單 THEN UI 系統 SHALL 使用 PipBoyCard 元件包裝每張塔羅牌
2. WHEN 使用者點擊卡片查看詳情 THEN UI 系統 SHALL 使用 PipBoyDialog 顯示卡片詳細資訊
3. WHEN 卡片 Dialog 顯示 THEN 元件系統 SHALL 在標題列顯示卡片名稱與 Vault-Tec 標誌
4. WHERE 卡牌頁面包含花色篩選 THEN UI 系統 SHALL 使用 PipBoySelect 元件
5. WHEN 使用者搜尋卡片 THEN UI 系統 SHALL 使用 PipBoyInput 元件作為搜尋框
6. WHEN 卡片載入中 THEN UI 系統 SHALL 使用 Skeleton 元件顯示載入佔位符
7. IF 使用者點擊卡片關閉按鈕 THEN UI 系統 SHALL 使用 PipBoyButton（variant="ghost", size="icon"）
8. WHEN 卡牌頁面完成遷移 THEN 測試系統 SHALL 驗證卡片詳情 Dialog 的所有互動功能正常
9. WHEN 卡牌頁面完成遷移 THEN 無障礙測試 SHALL 確認所有卡片都可以鍵盤導航

---

### Requirement 14: 頁面整合 - 賓果頁面（Bingo Page）

**Objective:** 作為開發人員，我需要將每日賓果簽到頁面的所有 UI 元件遷移至 PipBoy 元件系統，以強化遊戲化體驗。

#### Acceptance Criteria

1. WHEN 賓果頁面渲染簽到卡片 THEN UI 系統 SHALL 使用 PipBoyCard 元件包裝賓果卡
2. WHEN 使用者設定賓果卡 THEN UI 系統 SHALL 使用 PipBoyDialog 顯示設定介面
3. WHEN 賓果設定 Dialog 顯示 THEN 元件系統 SHALL 使用 PipBoyButton 作為確認與取消按鈕
4. WHERE 賓果卡顯示每日數字 THEN UI 系統 SHALL 使用 PipBoy 元件的終端機風格數字顯示
5. WHEN 使用者完成三連線 THEN UI 系統 SHALL 使用 PipBoyDialog 顯示獎勵通知
6. WHEN 獎勵通知顯示 THEN 元件系統 SHALL 套用綠色脈衝動畫與 Pip-Boy 音效
7. IF 賓果卡尚未設定 THEN UI 系統 SHALL 使用 PipBoyButton 引導使用者設定
8. WHEN 賓果頁面完成遷移 THEN 測試系統 SHALL 驗證所有賓果遊戲邏輯與 UI 互動正常
9. WHEN 賓果頁面完成遷移 THEN 視覺測試 SHALL 確認賓果卡網格對齊與間距正確

---

### Requirement 15: 頁面整合 - 成就頁面（Achievements Page）

**Objective:** 作為開發人員，我需要將成就系統頁面的所有 UI 元件遷移至 PipBoy 元件系統，以提供統一的成就展示風格。

#### Acceptance Criteria

1. WHEN 成就頁面渲染成就清單 THEN UI 系統 SHALL 使用 PipBoyCard 元件包裝每個成就
2. WHEN 成就卡片顯示已解鎖成就 THEN 元件系統 SHALL 套用 Bright Green 邊框與綠色發光效果
3. WHEN 成就卡片顯示未解鎖成就 THEN 元件系統 SHALL 套用灰色調並降低不透明度至 50%
4. WHEN 使用者點擊成就查看詳情 THEN UI 系統 SHALL 使用 PipBoyDialog 顯示成就說明
5. WHERE 成就 Dialog 顯示進度條 THEN UI 系統 SHALL 使用 PipBoyProgressBar 元件（如已建立）或保留現有進度條元件
6. WHEN 使用者解鎖新成就 THEN UI 系統 SHALL 使用 PipBoyDialog 或 Toast 顯示恭喜訊息
7. IF 成就頁面包含分類篩選 THEN UI 系統 SHALL 使用 PipBoySelect 或 Tabs 元件
8. WHEN 成就頁面完成遷移 THEN 測試系統 SHALL 驗證成就解鎖動畫與通知正常顯示
9. WHEN 成就頁面完成遷移 THEN 無障礙測試 SHALL 確認螢幕閱讀器能正確朗讀成就狀態

---

### Requirement 16: 頁面整合 - 解讀頁面（Reading Page）

**Objective:** 作為開發人員，我需要將塔羅解讀頁面的所有 UI 元件遷移至 PipBoy 元件系統，以提供沉浸式的解讀體驗。

#### Acceptance Criteria

1. WHEN 解讀頁面顯示牌陣選擇器 THEN UI 系統 SHALL 使用 PipBoySelect 元件
2. WHEN 使用者輸入解讀問題 THEN UI 系統 SHALL 使用 PipBoyInput 或 Textarea 元件
3. WHEN 使用者點擊「開始解讀」按鈕 THEN UI 系統 SHALL 使用 PipBoyButton（variant="default", size="lg"）
4. WHEN AI 解讀串流顯示 THEN UI 系統 SHALL 使用 PipBoyCard 包裝解讀文字內容
5. WHEN 解讀文字串流中 THEN 元件系統 SHALL 顯示綠色游標閃爍動畫模擬終端機輸出
6. WHEN 解讀完成 THEN UI 系統 SHALL 使用 PipBoyButton 提供儲存與分享選項
7. WHERE 解讀歷史清單顯示 THEN UI 系統 SHALL 使用 PipBoyCard 包裝每筆歷史記錄
8. WHEN 使用者點擊歷史記錄 THEN UI 系統 SHALL 使用 PipBoyDialog 顯示完整解讀內容
9. IF 解讀發生錯誤 THEN UI 系統 SHALL 使用 ErrorDisplay 或 PipBoyDialog 顯示錯誤訊息
10. WHEN 解讀頁面完成遷移 THEN 測試系統 SHALL 驗證 AI 串流顯示與所有互動功能正常
11. WHEN 解讀頁面完成遷移 THEN E2E 測試 SHALL 確認解讀流程從問題輸入到結果顯示完整可用

---

### Requirement 17: 向後相容性保證

**Objective:** 作為開發人員，我需要確保遷移過程不會破壞現有功能，以維持系統穩定性。

#### Acceptance Criteria

1. WHEN 開始遷移任何頁面元件 THEN 遷移系統 SHALL 保留舊的 shadcn/ui 元件直到新元件完全測試通過
2. WHEN PipBoy 元件遷移完成 THEN 測試系統 SHALL 執行所有現有的單元測試並確保通過
3. WHEN PipBoy 元件遷移完成 THEN 測試系統 SHALL 執行所有現有的整合測試並確保通過
4. WHEN PipBoy 元件遷移完成 THEN 測試系統 SHALL 執行所有現有的 E2E 測試並確保通過
5. IF 任何測試失敗 THEN 開發系統 SHALL 回滾該元件的遷移並修復問題後重試
6. WHERE 舊元件與新元件並存 THEN 系統 SHALL 確保 CSS 類別不衝突且樣式優先級正確
7. WHEN 所有頁面遷移完成 THEN 開發系統 SHALL 評估是否移除未使用的 shadcn/ui 元件檔案（保留作為 deprecated 參考）
8. WHEN 移除舊元件後 THEN 測試系統 SHALL 再次執行完整測試套件確保無遺漏的依賴
9. IF 發現任何 breaking change THEN 開發系統 SHALL 更新所有相關文件與遷移指南
10. WHEN 遷移完成後 THEN 版本控制系統 SHALL 標記為 feature version bump（如 1.x.0）

---

### Requirement 18: 效能優化要求

**Objective:** 作為使用者，我希望 PipBoy 元件不會降低網站效能，以獲得流暢的使用體驗。

#### Acceptance Criteria

1. WHEN PipBoy 元件渲染 THEN UI 系統 SHALL 確保首次渲染時間（FCP）< 1.5 秒
2. WHEN 頁面包含多個 PipBoy 元件 THEN UI 系統 SHALL 確保總阻塞時間（TBT）< 300ms
3. WHEN CRT 掃描線效果運作 THEN UI 系統 SHALL 維持畫面更新率 >= 60fps（桌面裝置）
4. WHEN 使用者互動觸發元件動畫 THEN UI 系統 SHALL 確保動畫延遲 < 100ms
5. IF 裝置效能較低（< 4GB RAM 或低階 CPU）THEN UI 系統 SHALL 自動降低動畫品質或停用非必要效果
6. WHERE 頁面包含大量 PipBoyCard 元件（> 20 個）THEN UI 系統 SHALL 實作虛擬捲動（virtualization）
7. WHEN PipBoyDialog 開啟或關閉 THEN UI 系統 SHALL 確保動畫執行時間 <= 300ms
8. WHEN 執行效能測試 THEN 測試系統 SHALL 使用 Lighthouse 確保 Performance Score >= 90
9. WHEN 遷移完成後 THEN 測試系統 SHALL 驗證 bundle size 增加 < 20KB（gzipped）
10. IF PipBoy 元件包含未使用的樣式 THEN 建置系統 SHALL 使用 tree-shaking 移除無用程式碼

---

### Requirement 19: 測試覆蓋率要求

**Objective:** 作為開發人員，我需要為所有 PipBoy 元件撰寫完整測試，以確保功能正確性。

#### Acceptance Criteria

1. WHEN 建立或擴充任何 PipBoy 元件 THEN 測試系統 SHALL 要求撰寫對應的單元測試
2. WHEN 元件單元測試撰寫完成 THEN 測試系統 SHALL 確保程式碼覆蓋率 >= 80%
3. WHEN 元件支援多個 variants THEN 測試系統 SHALL 為每個 variant 撰寫獨立測試案例
4. WHEN 元件支援多個 sizes THEN 測試系統 SHALL 為每個 size 撰寫獨立測試案例
5. WHEN 元件包含無障礙功能 THEN 測試系統 SHALL 使用 @testing-library/jest-dom 驗證 ARIA 屬性
6. WHERE 元件支援鍵盤導航 THEN 測試系統 SHALL 模擬鍵盤事件（Tab, Enter, Escape）並驗證行為
7. WHEN 元件包含動畫效果 THEN 測試系統 SHALL 驗證動畫開始與結束狀態
8. WHEN 整合測試撰寫完成 THEN 測試系統 SHALL 確保所有頁面整合場景都有 E2E 測試覆蓋
9. IF 元件渲染失敗 THEN 測試系統 SHALL 顯示清晰的錯誤訊息指出失敗原因
10. WHEN 所有測試完成 THEN CI/CD 系統 SHALL 在測試失敗時阻止程式碼合併

---

### Requirement 20: 文件與開發者體驗

**Objective:** 作為開發人員，我需要完整的元件文件與範例，以便快速理解如何使用 PipBoy 元件。

#### Acceptance Criteria

1. WHEN PipBoy 元件系統擴充完成 THEN 文件系統 SHALL 在 `src/components/ui/pipboy/README.md` 包含完整的元件使用指南
2. WHEN 開發人員查看元件文件 THEN 文件系統 SHALL 提供每個元件的完整 API 說明
3. WHEN 開發人員查看元件範例 THEN 文件系統 SHALL 提供至少 3 個實際使用案例
4. WHERE 元件支援多個 variants THEN 文件系統 SHALL 提供每個 variant 的視覺預覽或程式碼範例
5. WHEN 元件有特殊使用注意事項 THEN 文件系統 SHALL 在顯眼位置標示警告訊息
6. IF 元件有已知限制 THEN 文件系統 SHALL 明確列出限制條件與建議解決方案
7. WHEN 開發人員需要遷移指南 THEN 文件系統 SHALL 提供從 shadcn/ui 遷移至 PipBoy 元件的逐步教學
8. WHERE 文件包含程式碼範例 THEN 文件系統 SHALL 確保範例可以直接複製貼上使用
9. WHEN 元件 API 有重大變更 THEN 文件系統 SHALL 提供版本遷移指南或更新日誌
10. WHEN 開發人員查詢元件 THEN 文件系統 SHALL 提供可互動的元件展示頁面（如 `/pipboy-showcase`）或 Storybook

---

## Summary

本需求文件定義了擴充並統一 Wasteland Tarot 平台內部 PipBoy UI 元件系統的完整規範，涵蓋 20 個主要需求領域：

1. **基礎設定**：PipBoy 元件系統基礎架構、統一匯出、CVA 變體系統
2. **視覺風格**：CRT 掃描線、Pip-Boy Green 配色、Cubic 11 字體（延續現有整合）
3. **核心元件建立與擴充**：
   - 擴充：PipBoyButton（9 variants）、PipBoyCard（對齊 shadcn/ui API）
   - 新建：PipBoyInput、PipBoySelect、PipBoyLabel、PipBoyDialog
4. **響應式與無障礙**：多裝置支援與 WCAG AA 合規
5. **TypeScript 支援**：完整類型定義與編譯時期檢查
6. **頁面整合**：5 個主要頁面（首頁、卡牌、賓果、成就、解讀）從 shadcn/ui 遷移至 PipBoy 元件系統
7. **品質保證**：向後相容性、效能優化、測試覆蓋、文件完整性

所有 Acceptance Criteria 皆遵循 EARS 格式，確保需求可測試、可驗證、可追蹤。遷移過程將採用漸進式策略，保留 shadcn/ui 作為底層依賴（Radix UI Primitives），確保系統穩定性與使用者體驗不受影響。
