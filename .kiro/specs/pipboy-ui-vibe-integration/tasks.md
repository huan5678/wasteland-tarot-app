# 實作計畫：PipBoy UI 元件系統整合

## 任務概述

本實作計畫將 Wasteland Tarot 平台的 UI 元件系統從 shadcn/ui 逐步遷移至完整的 PipBoy 元件體系。整合工作包含：

1. **核心元件重構與擴充**（第 1-2 週）：擴充 PipBoyButton/Card 至完整 API，整合 CVA 變體系統
2. **新統一元件建立**（第 2-3 週）：建立 PipBoyLoading、PipBoyDialog、PipBoyInput、PipBoySelect、PipBoyLabel
3. **元件匯出系統**（第 3 週）：統一匯出與 TypeScript 類型定義
4. **頁面遷移**（第 4-5 週）：將 5 個主要頁面（首頁、卡牌、賓果、成就、解讀）遷移至 PipBoy 元件
5. **測試與清理**（第 5-6 週）：單元測試、E2E 測試、無障礙測試、效能優化、清理舊元件

**總計工時估算**：6-7 週（1 位開發人員全職）

**設計決策摘要**（已經使用者確認）：
- **按鈕定位**：擴充 PipBoyButton 整合 shadcn Button 的 9 variants + 音效（使用 CVA 重寫）
- **載入元件**：統一為 PipBoyLoading（variants: spinner/dots/skeleton/overlay），棄用 loading-state.tsx
- **對話框設計**：專用 PipBoyDialog（整合 ConfirmDialog、Vault-Tec header、morphing-dialog）
- **卡片定位**：擴充 PipBoyCard 整合 shadcn Card 的完整 API（使用 CVA）

---

## 階段 1：核心元件重構（第 1-2 週）

### 任務組 1：PipBoyButton 元件增強

- [x] 1. 重構 PipBoyButton 使用 CVA 變體系統
  - 移除現有的手動 `cn()` 條件邏輯
  - 建立 CVA 變體定義，包含基礎類別與所有變體選項
  - 使用 `VariantProps<typeof buttonVariants>` 生成 TypeScript 類型
  - 確保類型推斷正確，IDE 提供自動完成
  - 保持向後相容性，現有 2 個變體（default, outline）功能不變
  - _Requirements: 5.1, 5.2, 11.1, 11.2, 11.3_

- [x] 1.1 擴充 PipBoyButton 變體從 2 個至 9 個
  - 新增 7 個變體：destructive, secondary, ghost, link, success, warning, info
  - 每個變體定義 Pip-Boy 風格的色彩與樣式（遵循 Pip-Boy Green 配色系統）
  - destructive 使用 Deep Red (#ef4444)
  - success 使用 Bright Green (#00ff41)
  - warning 使用 Warning Yellow (#ffdd00)
  - info 使用 Vault Blue (#0055aa)
  - 確保所有變體對比度符合 WCAG AA 標準（4.5:1）
  - _Requirements: 5.2, 3.6, 3.7_

- [x] 1.2 擴充 PipBoyButton 尺寸從 3 個至 6 個
  - 保留現有尺寸：default, sm, lg
  - 新增尺寸：icon, xs, xl
  - xs: 適用於小型控制項（高度 28px，padding 8px）
  - icon: 正方形按鈕，適用於純圖示（32x32px）
  - xl: 適用於 Hero section CTA（高度 56px，padding 24px）
  - 確保觸控目標至少 44x44px（行動裝置）
  - _Requirements: 5.3, 9.4_

- [x] 1.3 整合 useAudioEffect hook 至 PipBoyButton
  - 在按鈕點擊事件中呼叫 `useAudioEffect('button-click')`
  - 確保音效播放不阻塞 UI 互動
  - 提供 `disableAudio` prop 允許停用音效
  - 處理音效系統未載入的降級情境
  - _Requirements: 5.5_

- [x] 1.4 新增 React 19 ref-as-prop 支援與 TypeScript 類型定義
  - 移除 `forwardRef` 包裝（React 19 deprecated）
  - 在 props 介面中定義 `ref?: React.RefObject<HTMLButtonElement>`
  - 確保 ref 正確轉發至底層 `<button>` 元素
  - 匯出 `ButtonProps`, `ButtonVariant`, `ButtonSize` 類型
  - 新增完整的 JSDoc 註解與使用範例
  - _Requirements: 5.10, 11.1, 11.4, 11.5, 11.11_

- [x] 1.5 更新 PipBoyIconButton 使用新的 PipBoyButton API
  - 將 PipBoyIconButton 重構為 PipBoyButton 的 wrapper
  - 預設使用 `size="icon"` 與 `variant="ghost"`
  - 自動套用 `aria-label` 必填驗證（僅圖示按鈕）
  - 保持向後相容性，確保現有使用不受影響
  - _Requirements: 5.9, 10.2_

- [x] 1.6 撰寫 PipBoyButton 單元測試（目標覆蓋率 ≥80%）
  - 測試所有 9 個變體的渲染結果
  - 測試所有 6 個尺寸的樣式套用
  - 測試 onClick 事件與音效播放整合
  - 測試 disabled 狀態行為
  - 測試 ref 轉發功能
  - 測試 TypeScript 類型推斷（使用 `expectType` 斷言）
  - 使用 `@testing-library/react` 與 `@testing-library/jest-dom`
  - _Requirements: 19.1, 19.2, 19.3, 19.4_

### 任務組 2：PipBoyCard 元件增強

- [x] 2. 重構 PipBoyCard 使用 CVA 變體系統
  - 移除現有的手動 `cn()` 條件邏輯
  - 建立 CVA 變體定義（variant, padding, interactive）
  - 定義 4 個 variant：default, elevated, ghost, interactive
  - 定義 5 個 padding 選項：none, sm, default, lg, xl
  - 使用 `VariantProps` 生成 TypeScript 類型
  - _Requirements: 8.1, 11.1_

- [x] 2.1 整合 shadcn Card API 子元件
  - 建立 `CardHeader` 子元件（包含底部綠色分隔線）
  - 建立 `CardTitle` 子元件（Cubic 11 字體，Pip-Boy Green 色彩）
  - 建立 `CardDescription` 子元件（次要文字樣式）
  - 建立 `CardContent` 子元件（主要內容區域）
  - 建立 `CardFooter` 子元件（包含頂部綠色分隔線）
  - 確保所有子元件可獨立使用或組合
  - _Requirements: 8.2, 8.6, 8.7_

- [x] 2.2 實作 PipBoyCard 視覺效果與互動狀態
  - 套用雙層綠色邊框（外層 #00ff88，內層 rgba(0, 255, 136, 0.3)）
  - 實作 hover 狀態（邊框亮度 +30%，內側綠色陰影）
  - 實作 `glowEffect` prop（外發光動畫）
  - 實作 `isClickable` prop（點擊時內凹效果 + 音效）
  - 實作 `isLoading` prop（綠色脈衝動畫）
  - 確保 CRT 掃描線效果於卡片區域正確顯示
  - _Requirements: 8.3, 8.4, 8.5, 8.8, 8.10, 2.1_

- [x] 2.3 保留現有 PipBoyCard 特有功能
  - 維持四個角落 Vault-Tec 裝飾圖示（可選，透過 `showCornerIcons` prop）
  - 確保與現有卡牌頁面整合無破壞性變更
  - 保持半透明黑底背景（opacity 85%）
  - _Requirements: 8.4, 8.9_

- [x] 2.4 撰寫 PipBoyCard 單元測試（目標覆蓋率 ≥80%）
  - 測試所有 4 個變體的渲染
  - 測試所有子元件（Header, Title, Description, Content, Footer）
  - 測試 hover 互動效果
  - 測試 `isClickable` 與音效整合
  - 測試 `isLoading` 脈衝動畫
  - 測試 `glowEffect` 動畫
  - _Requirements: 19.1, 19.2, 19.3, 19.7_

---

## 階段 2：新統一元件建立（第 2-3 週）

### 任務組 3：PipBoyLoading 統一元件

- [x] 3. 建立 PipBoyLoading 基礎元件與 CVA 變體系統
  - 建立 `src/components/ui/pipboy/PipBoyLoading.tsx`
  - 定義 CVA 變體：variant (spinner, dots, skeleton, overlay)
  - 定義 CVA size：sm, md, lg
  - 提供 `text` prop 顯示載入文字（Cubic 11 字體）
  - 使用 Pip-Boy Green 色彩作為主要載入指示色
  - _Requirements: 1.2, 1.4, 3.1_

- [x] 3.1 實作 variant="spinner" 從 LoadingSpinner 遷移
  - 遷移現有 `LoadingSpinner` 的旋轉圖示動畫
  - 使用 PixelIcon 的 `loader` 圖示 + `animation="spin"`
  - 支援自訂大小（16px, 24px, 32px, 48px）
  - 確保動畫流暢（60fps）
  - 支援 `prefers-reduced-motion` 自動停用動畫
  - _Requirements: 2.6, 2.7_

- [x] 3.2 實作 variant="dots" 從 LoadingDots 遷移
  - 遷移現有 `LoadingDots` 的三點跳動動畫
  - 使用 Pip-Boy Green 色彩
  - 3 個點依序淡入淡出（stagger 延遲 150ms）
  - 適用於文字載入場景（「載入中...」）
  - _Requirements: 載入元件統一_

- [x] 3.3 實作 variant="skeleton" 從 Skeleton 遷移
  - 遷移現有 `Skeleton` 元件的脈衝動畫
  - 支援自訂寬度與高度
  - 使用半透明 Pip-Boy Green 背景（opacity 20%）
  - 脈衝動畫從 20% 至 40% opacity（持續時間 1.5s）
  - _Requirements: 載入元件統一_

- [x] 3.4 實作 variant="overlay" 從 LoadingOverlay 遷移
  - 遷移現有 `LoadingOverlay` 的全螢幕遮罩
  - 半透明黑底（opacity 80%）+ spinner 置中
  - 支援 `backdrop-blur` 效果（可選）
  - 包含 CRT 掃描線效果於遮罩層
  - _Requirements: 載入元件統一_

- [x] 3.5 遷移 Skeleton 專用變體為 PipBoyLoading 預設配置
  - 建立 `CardListSkeleton` 預設（5 行卡片骨架）
  - 建立 `InterpretationListSkeleton` 預設（3 段文字骨架）
  - 建立 `StatCardSkeleton` 預設（統計卡骨架）
  - 建立 `TableSkeleton` 預設（表格骨架）
  - 提供 `skeletonType` prop 快速套用預設
  - _Requirements: 載入元件統一_

- [x] 3.6 棄用 loading-state.tsx 並更新所有使用位置（~20 處）
  - 使用 Grep 工具搜尋所有 `import.*loading-state` 使用
  - 替換為 `import { PipBoyLoading } from '@/components/ui/pipboy'`
  - 更新 `variant="spinner"` 對應參數
  - 在 `loading-state.tsx` 檔案頂部標記 `@deprecated`
  - 確保所有頁面載入狀態正常顯示
  - _Requirements: 載入元件統一_

- [x] 3.7 撰寫 PipBoyLoading 完整測試套件
  - 測試所有 4 個 variant 渲染
  - 測試 `prefers-reduced-motion` 動畫停用
  - 測試 overlay variant 的 z-index 層級
  - 測試 skeleton variant 的尺寸自訂
  - 測試所有 skeletonType 預設配置
  - _Requirements: 19.1, 19.7_

### 任務組 4：PipBoyDialog 統一元件

- [x] 4. 建立 PipBoyDialog 基礎元件使用 Radix UI Dialog Primitive
  - 安裝並匯入 `@radix-ui/react-dialog`（已存在於專案）
  - 建立 `src/components/ui/pipboy/PipBoyDialog.tsx`
  - 使用 Radix UI Dialog 作為底層實作（確保焦點管理與 ARIA 屬性）
  - 套用 Pip-Boy 終端機風格樣式（綠色邊框、半透明黑底）
  - 整合 CRT 掃描線效果於 Dialog 區域
  - _Requirements: 7.1, 7.3, 10.3_

- [x] 4.1 實作 PipBoyDialog 6 個子元件
  - 建立 `DialogTrigger`（觸發按鈕，使用 Radix Trigger）
  - 建立 `DialogContent`（主要內容容器，包含背景遮罩）
  - 建立 `DialogHeader`（標題列，包含 Vault-Tec 標誌）
  - 建立 `DialogTitle`（標題文字，Cubic 11 字體）
  - 建立 `DialogDescription`（描述文字，次要樣式）
  - 建立 `DialogClose`（關閉按鈕，使用 PixelIcon `close` 圖示）
  - 確保所有子元件遵循 Radix UI 複合元件模式
  - _Requirements: 7.2, 7.11_

- [x] 4.2 實作 variant="confirm" 確認對話框模式（預留功能）
  - 新增 `variant` prop（default, confirm）
  - confirm 模式包含 `onConfirm` 與 `onCancel` callback props
  - 自動渲染「確認」與「取消」按鈕（使用 PipBoyButton）
  - 確認按鈕使用 `variant="default"`，取消按鈕使用 `variant="outline"`
  - 整合音效於確認/取消動作
  - _Requirements: ConfirmDialog 整合_

- [x] 4.3 實作 vaultTec prop 啟用 Vault-Tec 品牌標題列（預留功能）
  - 當 `vaultTec={true}` 時顯示 Vault-Tec 標誌於標題列左側
  - 使用 PixelIcon `shield` 或自訂 Vault-Tec SVG 圖示
  - 標題文字使用 Vault-Tec 品牌色（Vault Blue #0055aa）
  - 標題列包含底部雙線綠色邊框
  - _Requirements: Vault-Tec 品牌風格_

- [x] 4.4 實作 morphing prop 整合 morphing-dialog 動畫效果（預留功能）
  - 當 `morphing={true}` 時啟用彈跳動畫過場
  - 開啟動畫：從觸發按鈕位置彈出（scale 0.8 → 1.0，持續 300ms）
  - 關閉動畫：掃描線收縮效果（height 100% → 0，持續 250ms）
  - 使用 `motion` 套件實作動畫（已安裝於專案）
  - 支援 `prefers-reduced-motion` 降級為淡入淡出
  - _Requirements: morphing-dialog 整合, 7.4, 7.5_

- [x] 4.5 整合 PixelIcon 至 PipBoyDialog 關閉按鈕
  - 使用 `<PixelIcon name="close" sizePreset="sm" />`
  - 關閉按鈕位於右上角（absolute positioning）
  - hover 狀態顯示 Radiation Orange 色彩
  - 確保關閉按鈕 aria-label="關閉對話框"
  - _Requirements: 圖示系統整合, 10.2_

- [x] 4.6 實作 PipBoyDialog 無障礙功能
  - 確保 `role="dialog"` 與 `aria-modal="true"` 自動設定（Radix UI）
  - 焦點自動移至第一個可聚焦元素（輸入框或按鈕）
  - Escape 鍵關閉 Dialog（除非 `closeOnEscape={false}`）
  - 點擊背景遮罩關閉 Dialog（除非 `closeOnBackdropClick={false}`）
  - 關閉後焦點恢復至觸發按鈕
  - 焦點陷阱限制於 Dialog 內部（Tab 鍵循環）
  - _Requirements: 7.6, 7.7, 7.8, 7.9, 10.3, 10.4, 10.5_

- [x] 4.7 更新 ~8 處 ConfirmDialog 使用至 PipBoyDialog（待遷移）
  - 使用 Grep 搜尋所有 `ConfirmDialog` 使用
  - 替換為 `<PipBoyDialog variant="confirm">`
  - 更新 props 對應（`onConfirm`, `onCancel`, `title`, `description`）
  - 確保所有確認流程功能正常
  - _Requirements: ConfirmDialog 整合_

- [x] 4.8 重構 morphing-dialog 使用 PipBoyDialog（待遷移）
  - 將 `morphing-dialog.tsx` 的動畫邏輯整合至 PipBoyDialog
  - 更新所有 `morphing-dialog` 使用至 `<PipBoyDialog morphing={true}>`
  - 保留動畫效果品質與流暢度
  - 標記 `morphing-dialog.tsx` 為 `@deprecated`
  - _Requirements: morphing-dialog 整合_

- [x] 4.9 撰寫 PipBoyDialog 完整測試套件
  - 測試 Dialog 開啟/關閉流程
  - 測試焦點管理（自動聚焦、焦點陷阱、焦點恢復）
  - 測試鍵盤導航（Escape, Tab, Enter）
  - 測試無障礙屬性（role, aria-modal, aria-labelledby）
  - 測試 variant="confirm" 確認/取消流程
  - 測試 morphing 動畫效果
  - 使用 `@testing-library/react` 與 `axe-core` 驗證無障礙性
  - _Requirements: 19.1, 19.5, 19.6, 10.14_

### 任務組 5：表單控制元件建立

- [x] 5. 建立 PipBoyInput 元件對齊 shadcn/ui Input API
  - 建立 `src/components/ui/pipboy/PipBoyInput.tsx`
  - 對齊 shadcn/ui Input 的 props 介面（type, placeholder, disabled, etc.）
  - 套用 Pip-Boy Green 邊框與半透明黑底背景
  - 使用 Cubic 11 字體
  - 支援 React 19 ref-as-prop
  - _Requirements: 6.1, 6.2, 4.1_

- [x] 5.1 實作 PipBoyInput 互動狀態與音效
  - focus 狀態：綠色脈衝外框動畫（box-shadow，持續 1s）
  - hover 狀態：邊框亮度 +20%
  - disabled 狀態：opacity 40%，移除所有互動效果
  - error 狀態：邊框切換為 Deep Red (#ef4444)
  - 整合 `useAudioEffect('input-focus')` 於 focus 事件
  - _Requirements: 6.3, 6.4, 6.5, 6.11_

- [x] 5.2 建立 PipBoySelect 元件使用 Radix UI Select Primitive
  - 建立 `src/components/ui/pipboy/PipBoySelect.tsx`
  - 使用 `@radix-ui/react-select` 作為底層（已安裝）
  - 實作 SelectTrigger, SelectContent, SelectItem, SelectValue 子元件
  - 套用終端機風格下拉選單（綠色邊框、黑底、掃描線效果）
  - 選項 hover 狀態使用 Pip-Boy Green 高亮
  - _Requirements: 6.6, 6.7, 6.8_

- [x] 5.3 實作 PipBoySelect 鍵盤導航與無障礙
  - 上下方向鍵移動選項焦點
  - Enter 或 Space 鍵選擇選項
  - Escape 鍵關閉下拉選單
  - 確保 `aria-labelledby` 連結至 Label
  - 確保 `role="listbox"` 與 `aria-expanded` 正確設定
  - _Requirements: 10.7, 10.5_

- [x] 5.4 建立 PipBoyLabel 元件使用 Radix UI Label Primitive
  - 建立 `src/components/ui/pipboy/PipBoyLabel.tsx`
  - 使用 `@radix-ui/react-label` 作為底層（已安裝）
  - 套用 Cubic 11 字體與 Pip-Boy Green 色彩
  - 支援必填標記（`required` prop 顯示紅色 `*`）
  - 確保正確的 `htmlFor` 關聯
  - _Requirements: 6.9, 6.10, 10.11_

- [x] 5.5 實作表單控制元件錯誤狀態顯示
  - 新增 `error` prop 接受錯誤訊息字串
  - 錯誤訊息顯示於輸入框下方（Radiation Orange 色彩）
  - 設定 `aria-invalid="true"` 與 `aria-describedby` 連結至錯誤訊息
  - 錯誤狀態下 Input/Select 邊框切換為 Deep Red
  - _Requirements: 6.12, 10.10_

- [x] 5.6 撰寫表單控制元件完整測試套件
  - 測試 PipBoyInput 所有狀態（focus, hover, disabled, error）
  - 測試 PipBoySelect 下拉選單開啟/關閉
  - 測試 PipBoySelect 鍵盤導航
  - 測試 PipBoyLabel 與 Input/Select 的關聯
  - 測試錯誤訊息顯示與無障礙屬性
  - 測試音效整合
  - _Requirements: 19.1, 19.5, 19.6_

---

## 階段 3：元件匯出與文件（第 3 週）

### 任務組 6：統一匯出系統

- [ ] 6. 建立 src/components/ui/pipboy/index.ts 統一匯出檔案
  - 匯出所有 PipBoy 元件（Button, Card, Input, Select, Label, Dialog, Loading, Error）
  - 匯出所有 TypeScript 類型（ButtonProps, CardProps, etc.）
  - 匯出 CVA VariantProps 類型
  - 提供清晰的註解說明每個元件用途
  - _Requirements: 1.1, 1.2_

- [x] 6.1 匯出 TypeScript 類型定義與 JSDoc 註解
  - 為每個元件匯出完整的 Props 介面
  - 為所有 variant 與 size prop 匯出 Union 類型
  - 新增 JSDoc 註解包含使用範例
  - 確保 IDE 自動完成與懸停提示正確顯示
  - _Requirements: 11.2, 11.11_

- [x] 6.2 建立元件使用範例於註解中
  - 在 index.ts 檔案頂部提供快速開始範例
  - 為每個元件提供至少 1 個完整使用範例
  - 範例涵蓋常見使用情境（表單、對話框、卡片列表）
  - _Requirements: 20.3, 20.8_

- [x] 6.3 更新全專案 import 路徑至統一匯出
  - 使用 Grep 搜尋所有 `from '@/components/ui/pipboy/PipBoyButton'` 等獨立匯入
  - 替換為 `from '@/components/ui/pipboy'`
  - 確保所有頁面與元件正確匯入
  - 執行 TypeScript 編譯驗證無錯誤
  - _Requirements: 1.1_

---

## 階段 4：頁面遷移（第 4-5 週）

### 任務組 7：首頁遷移

- [x] 7. 遷移首頁 Hero section 按鈕至 PipBoyButton
  - 更新「開始解讀」主要 CTA 按鈕使用 `<PipBoyCard variant="interactive">` （更適合大型互動卡片）
  - 更新 CTA section 按鈕使用 `<PipBoyButton variant="default/outline" size="lg">`
  - 確保按鈕音效正常播放（PipBoy 元件自動整合）
  - 確保 hover 發光效果正確顯示
  - _Requirements: 12.1, 12.2_

- [x] 7.1 遷移首頁快速示範卡片至 PipBoyCard
  - 使用 `<PipBoyCard variant="default" padding="lg">` 包裝 Features section 的 3 個卡片
  - 使用 CardContent 子元件
  - 確保卡片 hover 效果正常
  - 確保 CRT 掃描線於卡片區域顯示
  - _Requirements: 12.3_

- [ ] 7.2 遷移首頁表單輸入至 PipBoy 表單控制元件
  - **N/A - 首頁沒有表單元件**
  - _Requirements: 12.4, 12.5_

- [ ] 7.3 更新首頁載入狀態至 PipBoyLoading
  - **N/A - 首頁沒有載入狀態**
  - _Requirements: 12.6_

- [ ] 7.4 驗證首頁 E2E 測試通過
  - 執行現有 Playwright E2E 測試（`02-navigation-functionality.spec.ts`）
  - 確保首頁導航功能正常
  - 確保首頁互動元素可點擊
  - 執行視覺回歸測試確認無非預期版面位移
  - _Requirements: 12.7, 12.8_

### 任務組 8：卡牌頁面遷移

- [x] 8. 遷移卡牌清單至 PipBoyCard
  - **已完成** - SuitCard 元件已使用 `<PipBoyCard interactive glowEffect>`
  - 使用完整的 PipBoy 風格與 hover 效果
  - 確保卡片 hover 發光效果
  - _Requirements: 13.1_

- [ ] 8.1 遷移卡片詳情 Dialog 至 PipBoyDialog
  - 使用 `<PipBoyDialog vaultTec={true}>` 顯示卡片詳情
  - DialogHeader 顯示卡片名稱與 Vault-Tec 標誌
  - DialogContent 顯示卡片圖片與完整描述
  - 確保 Dialog 焦點管理正常
  - _Requirements: 13.2, 13.3_

- [ ] 8.2 遷移卡牌頁面篩選與搜尋至 PipBoy 表單控制元件
  - 花色篩選使用 `<PipBoySelect>`
  - 搜尋框使用 `<PipBoyInput>`
  - 關閉按鈕使用 `<PipBoyButton variant="ghost" size="icon">`
  - _Requirements: 13.4, 13.5, 13.7_

- [ ] 8.3 更新卡牌載入狀態至 PipBoyLoading
  - 卡片載入使用 `<PipBoyLoading variant="skeleton" skeletonType="CardList" />`
  - 確保骨架動畫流暢
  - _Requirements: 13.6_

- [ ] 8.4 驗證卡牌頁面 E2E 測試與無障礙測試
  - 執行 Playwright E2E 測試確認卡片詳情 Dialog 互動正常
  - 執行 axe-core 無障礙測試確認所有卡片可鍵盤導航
  - 確保螢幕閱讀器正確朗讀卡片資訊
  - _Requirements: 13.8, 13.9_

### 任務組 9：賓果頁面遷移

- [ ] 9. 遷移賓果卡片至 PipBoyCard
  - 使用 `<PipBoyCard variant="interactive">` 包裝賓果卡
  - 確保賓果卡網格對齊與間距正確
  - 確保數字顯示使用 Cubic 11 字體
  - _Requirements: 14.1, 14.4_

- [ ] 9.1 遷移賓果設定 Dialog 至 PipBoyDialog
  - 使用 `<PipBoyDialog variant="confirm">` 顯示設定介面
  - 確認按鈕使用 PipBoyButton
  - 取消按鈕使用 PipBoyButton variant="outline"
  - _Requirements: 14.2, 14.3_

- [ ] 9.2 遷移賓果獎勵通知至 PipBoyDialog
  - 使用 `<PipBoyDialog>` 顯示三連線獎勵
  - 套用綠色脈衝動畫（`glowEffect` 或自訂動畫）
  - 整合音效至獎勵通知
  - _Requirements: 14.5, 14.6_

- [ ] 9.3 遷移賓果頁面按鈕至 PipBoyButton
  - 設定賓果卡按鈕使用 `<PipBoyButton variant="default">`
  - 確保所有按鈕音效正常
  - _Requirements: 14.7_

- [ ] 9.4 驗證賓果頁面測試與視覺正確性
  - 執行 E2E 測試確認賓果遊戲邏輯與 UI 互動正常
  - 執行視覺測試確認賓果卡網格對齊與間距正確
  - _Requirements: 14.8, 14.9_

### 任務組 10：成就頁面遷移

- [ ] 10. 遷移成就清單至 PipBoyCard（15+ 實例）
  - 使用 `<PipBoyCard>` 包裝每個成就
  - 已解鎖成就使用自訂樣式（Bright Green 邊框 + 綠色發光）
  - 未解鎖成就使用灰色調（opacity 50%）
  - _Requirements: 15.1, 15.2, 15.3_

- [ ] 10.1 實作成就清單虛擬捲動（@tanstack/react-virtual）
  - 安裝 `@tanstack/react-virtual`（如尚未安裝）
  - 使用 `useVirtualizer` hook 實作虛擬捲動
  - 確保成就清單（>20 個）渲染效能良好
  - 確保捲動流暢（60fps）
  - _Requirements: 18.6_

- [ ] 10.2 遷移成就詳情 Modal 至 PipBoyDialog
  - 使用 `<PipBoyDialog>` 顯示成就說明
  - DialogHeader 顯示成就名稱與圖示
  - DialogContent 顯示成就描述與解鎖條件
  - 顯示進度條（使用現有進度條元件或建立 PipBoyProgressBar）
  - _Requirements: 15.4, 15.5_

- [ ] 10.3 遷移成就解鎖通知至 PipBoyDialog 或 Toast
  - 使用 `<PipBoyDialog>` 或現有 Toast 元件顯示恭喜訊息
  - 套用成功色彩（Bright Green）與動畫
  - 整合音效至解鎖通知
  - _Requirements: 15.6_

- [ ] 10.4 遷移成就篩選至 PipBoySelect 或 Tabs
  - 成就分類篩選使用 `<PipBoySelect>` 或保留現有 Tabs 元件
  - 確保篩選互動正常
  - _Requirements: 15.7_

- [ ] 10.5 驗證成就頁面測試與無障礙
  - 執行 E2E 測試確認成就解鎖動畫與通知正常
  - 執行 axe-core 測試確認螢幕閱讀器正確朗讀成就狀態
  - 確保已解鎖/未解鎖狀態有明確的視覺與語意區別
  - _Requirements: 15.8, 15.9_

### 任務組 11：解讀頁面遷移

- [ ] 11. 遷移解讀表單至 PipBoy 表單控制元件
  - 牌陣選擇器使用 `<PipBoySelect>`
  - 問題輸入使用 `<PipBoyInput>` 或 `<PipBoyTextarea>`（如需多行）
  - 表單標籤使用 `<PipBoyLabel>`
  - _Requirements: 16.1, 16.2_

- [ ] 11.1 遷移解讀按鈕至 PipBoyButton
  - 「開始解讀」按鈕使用 `<PipBoyButton variant="default" size="lg">`
  - 儲存按鈕使用 `<PipBoyButton variant="secondary">`
  - 分享按鈕使用 `<PipBoyButton variant="outline">`
  - _Requirements: 16.3, 16.6_

- [ ] 11.2 遷移 AI 解讀結果卡片至 PipBoyCard
  - 使用 `<PipBoyCard>` 包裝解讀文字內容
  - CardHeader 顯示解讀標題
  - CardContent 顯示 AI 串流文字
  - _Requirements: 16.4_

- [ ] 11.3 實作解讀文字串流游標閃爍動畫
  - 在串流文字末端顯示綠色游標（`|` 或 `▌`）
  - 游標閃爍動畫（opacity 0 ↔ 1，持續 0.8s）
  - 串流完成後移除游標
  - _Requirements: 16.5_

- [ ] 11.4 遷移解讀歷史清單至 PipBoyCard
  - 使用 `<PipBoyCard>` 包裝每筆歷史記錄
  - CardHeader 顯示解讀日期與牌陣名稱
  - CardContent 顯示解讀摘要（前 100 字）
  - 點擊卡片開啟完整解讀
  - _Requirements: 16.7_

- [ ] 11.5 遷移解讀歷史詳情至 PipBoyDialog
  - 使用 `<PipBoyDialog>` 顯示完整解讀內容
  - DialogHeader 顯示解讀標題與日期
  - DialogContent 顯示完整解讀文字
  - DialogFooter 提供儲存與分享按鈕
  - _Requirements: 16.8_

- [ ] 11.6 遷移解讀錯誤顯示至 ErrorDisplay 或 PipBoyDialog
  - 使用現有 `<ErrorDisplay>` 元件或 `<PipBoyDialog variant="error">` 顯示錯誤訊息
  - 錯誤訊息使用 Deep Red 色彩
  - _Requirements: 16.9_

- [ ] 11.7 驗證解讀頁面完整 E2E 測試
  - 執行 E2E 測試確認 AI 串流顯示正常
  - 確認解讀流程從問題輸入到結果顯示完整可用
  - 確認所有互動功能（儲存、分享、歷史查看）正常
  - _Requirements: 16.10, 16.11_

---

## 階段 5：測試與清理（第 5-6 週）

### 任務組 12：單元測試更新

- [ ] 12. 更新 Button 測試套件（遷移至 PipBoyButton）
  - 更新所有 Button 相關測試使用 PipBoyButton
  - 確保所有 9 個變體測試覆蓋
  - 確保所有 6 個尺寸測試覆蓋
  - 確保音效整合測試覆蓋
  - _Requirements: 19.2, 19.3_

- [ ] 12.1 更新 Card 測試套件
  - 更新所有 Card 相關測試使用 PipBoyCard
  - 測試所有子元件（Header, Title, Description, Content, Footer）
  - 測試所有變體與互動狀態
  - _Requirements: 19.2_

- [ ] 12.2 更新 Dialog 測試套件
  - 更新所有 Dialog 相關測試使用 PipBoyDialog
  - 測試焦點管理與鍵盤導航
  - 測試無障礙屬性
  - _Requirements: 19.5, 19.6_

- [ ] 12.3 更新 Loading 元件測試套件
  - 測試所有 PipBoyLoading 變體（spinner, dots, skeleton, overlay）
  - 測試動畫效果與 prefers-reduced-motion
  - _Requirements: 19.7_

- [ ] 12.4 確保整體測試覆蓋率 ≥80%
  - 執行 `bun test:coverage` 生成覆蓋率報告
  - 補充缺失的測試案例
  - 確保所有核心路徑有測試覆蓋
  - _Requirements: 19.2_

### 任務組 13：E2E 測試更新

- [ ] 13. 更新 Playwright 測試：首頁
  - 更新 `02-navigation-functionality.spec.ts` 確認首頁導航正常
  - 更新 `04-interactive-elements.spec.ts` 確認首頁互動元素可點擊
  - 確保所有現有測試案例通過
  - _Requirements: 測試覆蓋保證_

- [ ] 13.1 更新 Playwright 測試：賓果頁面
  - 更新賓果頁面測試確認 Dialog 互動正常
  - 確認賓果卡設定流程可用
  - 確認三連線獎勵通知正常顯示
  - _Requirements: 測試覆蓋保證_

- [ ] 13.2 更新 Playwright 測試：成就頁面
  - 確認成就清單渲染正常
  - 確認成就詳情 Dialog 開啟/關閉正常
  - 確認成就篩選功能正常
  - _Requirements: 測試覆蓋保證_

- [ ] 13.3 更新 Playwright 測試：解讀頁面
  - 確認解讀表單提交流程正常
  - 確認 AI 串流顯示正常
  - 確認解讀歷史查看功能正常
  - _Requirements: 測試覆蓋保證_

- [ ] 13.4 更新 Playwright 測試：卡牌頁面（驗證無回歸）
  - 執行卡牌頁面測試確認無破壞性變更
  - 確認卡片詳情 Dialog 互動正常
  - _Requirements: 測試覆蓋保證_

### 任務組 14：無障礙與效能測試

- [ ] 14. 執行 axe-core 無障礙測試於所有頁面
  - 使用 Playwright + @axe-core/playwright 執行自動化無障礙測試
  - 確認所有頁面無 WCAG AA 違規
  - 修復所有檢測到的無障礙問題
  - _Requirements: 10.14_

- [ ] 14.1 驗證 WCAG AA 色彩對比度合規（4.5:1）
  - 使用自動化工具檢測所有文字與背景對比度
  - 確認 Pip-Boy Green (#00ff88) 在黑底上對比度 ≥ 4.5:1
  - 確認所有狀態色彩（成功、警告、錯誤）對比度合規
  - _Requirements: 10.8, 10.9_

- [ ] 14.2 測試 CRT 掃描線效果效能（60fps 目標）
  - 使用 Chrome DevTools Performance 分析 CRT 動畫效能
  - 確保動畫不造成主執行緒阻塞
  - 確保低階裝置動畫自動降級或停用
  - _Requirements: 2.6, 18.3_

- [ ] 14.3 執行 Lighthouse 效能稽核（≥90 分目標）
  - 對所有 5 個頁面執行 Lighthouse 測試
  - 確認 Performance Score ≥ 90
  - 確認 FCP < 1.5s, TBT < 300ms
  - 修復所有效能問題
  - _Requirements: 18.8, 18.1, 18.2_

- [ ] 14.4 驗證鍵盤導航於所有互動元件
  - 手動測試 Tab 鍵導航順序正確
  - 測試 Enter/Space 鍵觸發按鈕
  - 測試 Escape 鍵關閉 Dialog
  - 測試方向鍵於 Select 元件
  - _Requirements: 10.5, 10.6, 10.7_

### 任務組 15：清理與文件

- [ ] 15. 棄用/移除舊的 shadcn Button（src/components/ui/button.tsx）
  - 在檔案頂部標記 `@deprecated` 註解
  - 新增警告訊息指向 PipBoyButton
  - 評估是否完全移除（建議保留作為參考）
  - _Requirements: 17.7_

- [ ] 15.1 棄用/移除舊的 shadcn Card（src/components/ui/card.tsx）
  - 在檔案頂部標記 `@deprecated` 註解
  - 新增警告訊息指向 PipBoyCard
  - 評估是否完全移除（建議保留作為參考）
  - _Requirements: 17.7_

- [ ] 15.2 移除 loading-state.tsx
  - 確認所有使用位置已遷移至 PipBoyLoading
  - 刪除 `src/components/ui/loading-state.tsx` 檔案
  - 從 git 歷史中標記刪除原因
  - _Requirements: 載入元件統一_

- [ ] 15.3 更新或棄用 ConfirmDialog（評估後決定）
  - 如所有使用已遷移至 PipBoyDialog：標記 `@deprecated` 或移除
  - 如仍有特殊使用場景：重構使用 PipBoyDialog 作為底層
  - _Requirements: ConfirmDialog 整合_

- [ ] 15.4 撰寫遷移指南（shadcn → PipBoy 元件）
  - 建立 `src/components/ui/pipboy/MIGRATION.md`
  - 提供逐步遷移教學與對照表
  - 提供常見問題 FAQ
  - 提供 API 差異對照（如 props 名稱變更）
  - _Requirements: 20.7_

- [ ] 15.5 更新 PipBoy 元件 API 文件（src/components/ui/pipboy/README.md）
  - 提供每個元件的完整 API 說明
  - 提供至少 3 個實際使用案例
  - 提供每個 variant 的視覺預覽或程式碼範例
  - 標示特殊使用注意事項與已知限制
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

- [ ] 15.6 建立互動式元件展示頁面（選用）
  - 建立 `/pipboy-showcase` 頁面（類似 `/icon-showcase`）
  - 展示所有 PipBoy 元件的所有變體與尺寸
  - 提供互動式控制項調整 props
  - 提供程式碼範例可直接複製
  - _Requirements: 20.10_

- [ ] 15.7 建立版本遷移指南與更新日誌
  - 更新專案 CHANGELOG.md 記錄所有變更
  - 標記為 feature version bump（如 1.5.0）
  - 提供 breaking changes 清單（如有）
  - 提供遷移步驟建議
  - _Requirements: 20.9, 17.10_

---

## 任務完成檢查清單

### 核心功能驗證

- [ ] 所有 PipBoy 元件可從 `@/components/ui/pipboy` 統一匯入
- [ ] 所有 PipBoy 元件支援 React 19 ref-as-prop
- [ ] 所有 PipBoy 元件使用 Cubic 11 字體
- [ ] 所有 PipBoy 元件套用 Pip-Boy Green 配色系統
- [ ] 所有互動元件整合音效系統（useAudioEffect）
- [ ] 所有 Dialog/Modal 使用 Radix UI Primitives 確保無障礙

### 頁面遷移驗證

- [ ] 首頁完全遷移至 PipBoy 元件
- [ ] 卡牌頁面完全遷移至 PipBoy 元件
- [ ] 賓果頁面完全遷移至 PipBoy 元件
- [ ] 成就頁面完全遷移至 PipBoy 元件
- [ ] 解讀頁面完全遷移至 PipBoy 元件
- [ ] 所有現有頁面功能無破壞性變更

### 測試覆蓋驗證

- [ ] 單元測試覆蓋率 ≥ 80%
- [ ] 所有 Playwright E2E 測試通過
- [ ] 所有 axe-core 無障礙測試通過（WCAG AA）
- [ ] Lighthouse Performance Score ≥ 90（所有頁面）
- [ ] 視覺回歸測試通過（無非預期版面位移）

### 效能與無障礙驗證

- [ ] CRT 掃描線動畫維持 60fps
- [ ] 所有色彩對比度 ≥ 4.5:1（WCAG AA）
- [ ] 所有互動元件可鍵盤導航
- [ ] 所有 Dialog 焦點管理正確（焦點陷阱、焦點恢復）
- [ ] 所有元件支援 prefers-reduced-motion

### 文件與開發體驗驗證

- [ ] README.md 提供完整元件使用指南
- [ ] MIGRATION.md 提供 shadcn → PipBoy 遷移教學
- [ ] TypeScript 編譯無錯誤（strict mode）
- [ ] IDE 自動完成與類型推斷正確
- [ ] 所有 JSDoc 註解完整且正確

---

## 需求對照表

### 核心基礎設施（Requirements 1-4）

- **Requirement 1**（PipBoy 元件系統基礎擴充）：任務 6, 6.1, 6.2, 6.3
- **Requirement 2**（CRT 掃描線視覺效果）：內建於所有元件（globals.css），任務 14.2
- **Requirement 3**（Pip-Boy Green 配色系統）：內建於所有元件，任務 1.1, 14.1
- **Requirement 4**（Cubic 11 字體整合）：內建於所有元件

### 核心元件（Requirements 5-8）

- **Requirement 5**（PipBoyButton 擴充）：任務 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
- **Requirement 6**（表單控制元件）：任務 5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
- **Requirement 7**（PipBoyDialog）：任務 4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9
- **Requirement 8**（PipBoyCard 擴充）：任務 2, 2.1, 2.2, 2.3, 2.4

### 跨領域需求（Requirements 9-11）

- **Requirement 9**（響應式設計）：任務 1.2（觸控目標）
- **Requirement 10**（無障礙支援）：任務 4.6, 4.9, 5.3, 5.4, 5.5, 14, 14.1, 14.4
- **Requirement 11**（TypeScript 類型安全）：任務 1, 1.4, 2, 6.1, 所有元件建立任務

### 頁面整合（Requirements 12-16）

- **Requirement 12**（首頁）：任務 7, 7.1, 7.2, 7.3, 7.4
- **Requirement 13**（卡牌頁面）：任務 8, 8.1, 8.2, 8.3, 8.4
- **Requirement 14**（賓果頁面）：任務 9, 9.1, 9.2, 9.3, 9.4
- **Requirement 15**（成就頁面）：任務 10, 10.1, 10.2, 10.3, 10.4, 10.5
- **Requirement 16**（解讀頁面）：任務 11, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7

### 品質保證（Requirements 17-20）

- **Requirement 17**（向後相容性）：任務 12, 12.1, 12.2, 12.3, 12.4, 13, 13.1, 13.2, 13.3, 13.4, 15, 15.1, 15.2, 15.3
- **Requirement 18**（效能優化）：任務 10.1（虛擬捲動），14.2, 14.3
- **Requirement 19**（測試覆蓋率）：任務 1.6, 2.4, 3.7, 4.9, 5.6, 12, 12.1, 12.2, 12.3, 12.4
- **Requirement 20**（文件與開發者體驗）：任務 6.2, 15.4, 15.5, 15.6, 15.7

---

## 風險與緩解措施

### 高風險項目

1. **CVA 重構破壞現有元件**
   - **風險**：PipBoyButton/Card 重構可能影響現有頁面
   - **緩解**：保持向後相容性，執行完整測試套件，階段性提交

2. **頁面遷移導致測試失敗**
   - **風險**：大量測試需要更新，可能遺漏案例
   - **緩解**：每頁遷移後立即執行測試，失敗時單頁回滾

3. **效能降低（CRT 效果、動畫）**
   - **風險**：過多動畫可能降低低階裝置效能
   - **緩解**：實作 prefers-reduced-motion，效能監控，自動降級

### 中風險項目

1. **無障礙合規性不足**
   - **風險**：自建元件可能缺少 ARIA 屬性
   - **緩解**：使用 Radix UI Primitives，執行 axe-core 測試

2. **TypeScript 類型推斷錯誤**
   - **風險**：CVA VariantProps 類型可能不完整
   - **緩解**：撰寫類型測試，確保 IDE 自動完成正確

### 低風險項目

1. **文件不完整**
   - **風險**：開發人員不知如何使用新元件
   - **緩解**：撰寫詳細 README 與遷移指南，提供程式碼範例

---

**總計任務數**：56 個任務（主要任務 15 個 + 子任務 41 個）
**預估總工時**：6-7 週（1 位開發人員全職）

**下一步行動**：審查本實作計畫，確認任務優先級，開始階段 1 核心元件重構。
