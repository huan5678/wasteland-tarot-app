# Requirements Document

## Project Description (Input)
將前端所有原生 `<button>` 標籤重構為標準 Button 組件（@/components/ui/button），包含以下功能：

1. **完全替換策略**：所有原生 HTML button 標籤替換為 Button 組件
2. **音效整合**：利用 Button 組件內置的 useAudioEffect，為所有按鈕添加點擊音效
3. **無障礙優化**：檢查並補充 aria-label、disabled、aria-disabled 等無障礙屬性
4. **樣式映射**：將原有的 className 映射到合適的 variant（default, outline, destructive, ghost, link 等）
5. **重構範圍**：`src/app/` 和 `src/components/`（排除 `src/components/ui/` 內的 UI 組件庫）

**統計數據**：
- 總文件數：100+ 個文件
- 原生 button 總數：400+ 個
- 高頻文件 Top 14：包含 MobileSpreadSelector.tsx (16 個)、admin/interpretations/page.tsx (16 個) 等

## Introduction

本專案旨在統一前端按鈕組件的使用，將所有原生 HTML `<button>` 標籤替換為專案標準的 Button 組件（`@/components/ui/button`）。此重構將確保整個應用程式的按鈕具有一致的 Fallout Pip-Boy 視覺風格、音效反饋、無障礙支援，並消除硬編碼重複的樣式定義。

**重構動機**：
- **一致性**：統一按鈕視覺和互動體驗
- **可維護性**：集中管理按鈕樣式與行為
- **音效整合**：自動為所有按鈕添加 Wasteland 主題音效
- **無障礙性**：確保所有按鈕符合 WCAG AA 標準
- **開發效率**：減少重複的樣式程式碼，遵循 CLAUDE.md 編碼規範

**Button 組件能力概覽**：
- 9 種 variants：`default`, `outline`, `destructive`, `secondary`, `ghost`, `link`, `success`, `warning`, `info`
- 6 種 sizes：`xs`, `sm`, `default`, `lg`, `xl`, `icon`
- 內建音效功能：`useAudioEffect` hook
- OKLCH 色彩系統：Pip-Boy 綠色主題
- React 19 ref-as-prop 支援
- 完整無障礙屬性支援

**重構範圍**：
- **包含**：`src/app/` 和 `src/components/`（排除 `src/components/ui/` 內的 UI 組件庫）
- **總量**：100+ 個文件，400+ 個原生 button
- **高頻文件**：MobileSpreadSelector.tsx (16)、admin/interpretations/page.tsx (16)、MobileReadingInterface.tsx (13) 等

## Requirements

### Requirement 1: 原生按鈕替換（Button Element Replacement）
**Objective:** 作為前端開發者，我希望所有原生 `<button>` 標籤替換為 Button 組件，以便統一按鈕的視覺風格和行為。

#### Acceptance Criteria
1. WHEN 前端重構系統掃描 `src/app/` 和 `src/components/`（排除 `src/components/ui/`）THEN 前端重構系統 SHALL 識別所有原生 `<button>` 標籤及其屬性
2. WHEN 前端重構系統替換原生按鈕 THEN 前端重構系統 SHALL 將所有 `<button>` 標籤替換為 `<Button>` 組件
3. WHEN 前端重構系統替換按鈕 THEN 前端重構系統 SHALL 保留原有的事件處理器（onClick、onSubmit 等）
4. WHEN 前端重構系統替換按鈕 THEN 前端重構系統 SHALL 保留原有的 type 屬性（button、submit、reset）
5. IF 原生按鈕包含 disabled 屬性 THEN 前端重構系統 SHALL 將其映射到 Button 組件的 disabled prop
6. WHERE 按鈕使用 ref THEN 前端重構系統 SHALL 確保 ref 正確傳遞給 Button 組件（支援 React 19 ref-as-prop）
7. WHEN 替換完成後 THEN 前端重構系統 SHALL 在重構範圍內找不到任何原生 `<button>` 標籤（測試文件除外）

### Requirement 2: 樣式映射與統一（Style Mapping and Unification）
**Objective:** 作為前端開發者，我希望原有按鈕的樣式映射到合適的 Button variant，以便保持視覺一致性並消除硬編碼重複。

#### Acceptance Criteria
1. WHEN 前端重構系統分析原生按鈕的 className THEN 前端重構系統 SHALL 根據語意映射到對應的 variant
2. IF 原生按鈕包含 primary、submit、confirm 類樣式 THEN 前端重構系統 SHALL 映射到 `variant="default"`（Pip-Boy 綠色）
3. IF 原生按鈕包含 outline、secondary、bordered 類樣式 THEN 前端重構系統 SHALL 映射到 `variant="outline"`（透明 + 邊框）
4. IF 原生按鈕包含 destructive、danger、delete、remove 類樣式 THEN 前端重構系統 SHALL 映射到 `variant="destructive"`（紅色警告）
5. IF 原生按鈕包含 ghost、transparent、flat 類樣式 THEN 前端重構系統 SHALL 映射到 `variant="ghost"`（無邊框懸浮）
6. IF 原生按鈕包含 link、text、anchor 類樣式 THEN 前端重構系統 SHALL 映射到 `variant="link"`（鏈接樣式）
7. IF 原生按鈕包含 success、confirm、complete 類樣式 THEN 前端重構系統 SHALL 映射到 `variant="success"`（成功綠色）
8. IF 原生按鈕包含 warning、alert、caution 類樣式 THEN 前端重構系統 SHALL 映射到 `variant="warning"`（警告黃色）
9. IF 原生按鈕包含 info、help、tooltip 類樣式 THEN 前端重構系統 SHALL 映射到 `variant="info"`（資訊藍色）
10. WHEN 前端重構系統映射 variant 後 THEN 前端重構系統 SHALL 移除所有與 variant 功能重複的 className
11. WHEN 前端重構系統處理按鈕尺寸 THEN 前端重構系統 SHALL 映射到對應的 size prop（xs, sm, default, lg, xl, icon）
12. IF 無法明確映射 variant THEN 前端重構系統 SHALL 預設使用 `variant="default"` 並記錄警告供人工審查

### Requirement 3: 音效整合（Audio Effect Integration）
**Objective:** 作為使用者，我希望所有按鈕點擊時都有音效反饋，以便獲得沉浸式的 Wasteland 主題體驗。

#### Acceptance Criteria
1. WHEN 使用者點擊 Button 組件 THEN Button 組件 SHALL 自動觸發內建的 useAudioEffect 音效
2. WHERE Button 組件已內建 useAudioEffect THEN 前端重構系統 SHALL 不需要額外添加音效邏輯
3. IF 原有按鈕已有自定義音效邏輯 THEN 前端重構系統 SHALL 評估是否保留該邏輯或使用 Button 內建音效
4. WHEN Button 組件播放音效 THEN Button 組件 SHALL 確保音效不阻塞 UI 互動（非同步播放）
5. IF Button 組件處於 disabled 狀態 THEN Button 組件 SHALL 不觸發音效

### Requirement 4: 無障礙優化（Accessibility Enhancement）
**Objective:** 作為身障使用者，我希望所有按鈕都具備完整的無障礙屬性，以便使用螢幕閱讀器或鍵盤操作。

#### Acceptance Criteria
1. WHEN 前端重構系統替換按鈕 AND 原按鈕缺少 aria-label THEN 前端重構系統 SHALL 根據按鈕文字或功能添加 aria-label
2. IF 按鈕僅包含圖示（無文字）THEN 前端重構系統 SHALL 添加明確的 aria-label 描述按鈕功能
3. WHEN Button 組件處於 disabled 狀態 THEN Button 組件 SHALL 自動設置 aria-disabled="true"
4. WHERE 按鈕用於提交表單 THEN 前端重構系統 SHALL 確保 type="submit" 屬性正確設置
5. IF 按鈕用於關閉對話框或模態 THEN 前端重構系統 SHALL 添加 aria-label="關閉" 或類似描述
6. WHEN Button 組件渲染後 THEN Button 組件 SHALL 支援鍵盤 Enter 和 Space 鍵觸發
7. WHEN Button 組件渲染後 THEN Button 組件 SHALL 具備清晰的 focus 視覺指示器（符合 WCAG AA 對比度要求）

### Requirement 5: 批次重構執行（Batch Refactoring Execution）
**Objective:** 作為前端開發者，我希望按優先級分批次執行重構，以便降低風險並便於測試驗證。

#### Acceptance Criteria
1. WHEN 前端重構系統執行重構 THEN 前端重構系統 SHALL 按以下順序分 5 個批次進行：
   - Batch 1: Mobile 組件（MobileSpreadSelector, MobileReadingInterface, MobileNavigation, MobileTarotCard）
   - Batch 2: Admin 頁面（admin/interpretations, admin/cards, admin/users）
   - Batch 3: Readings 組件（ReadingHistory, SpreadSelector, StreamingInterpretation, ReadingDetailModal）
   - Batch 4: Auth & Settings（LoginForm, RegisterForm, ProfileSettings）
   - Batch 5: 其餘文件（低頻按鈕文件）
2. WHEN 前端重構系統完成每個批次 THEN 前端重構系統 SHALL 執行該批次的組件測試並確保無迴歸
3. IF 任一批次測試失敗 THEN 前端重構系統 SHALL 停止後續批次並報告失敗詳情
4. WHEN 前端重構系統完成所有批次 THEN 前端重構系統 SHALL 生成重構報告（替換數量、映射統計、警告列表）

### Requirement 6: 程式碼品質與規範遵循（Code Quality and Standards Compliance）
**Objective:** 作為專案維護者，我希望重構後的程式碼符合專案編碼規範，以便保持程式碼可讀性和可維護性。

#### Acceptance Criteria
1. WHEN 前端重構系統生成重構程式碼 THEN 前端重構系統 SHALL 遵循 CLAUDE.md 的硬編碼消除原則
2. IF 重構後出現 3 個以上結構相同的按鈕元素 THEN 前端重構系統 SHALL 使用陣列映射（.map()）生成按鈕
3. WHEN 前端重構系統映射按鈕資料 THEN 前端重構系統 SHALL 將按鈕資料抽取到常數陣列（使用 `as const` 斷言）
4. WHERE 按鈕資料包含圖示 THEN 前端重構系統 SHALL 使用 PixelIcon 組件（不得使用 lucide-react）
5. WHEN 前端重構系統生成 import 語句 THEN 前端重構系統 SHALL 正確導入 Button 組件：`import { Button } from '@/components/ui/button'`
6. WHEN 前端重構系統完成重構 THEN 前端重構系統 SHALL 確保程式碼通過 ESLint 檢查（無新增錯誤或警告）
7. WHEN 前端重構系統完成重構 THEN 前端重構系統 SHALL 確保程式碼通過 TypeScript 編譯（無型別錯誤）

### Requirement 7: 效能與非功能需求（Performance and Non-Functional Requirements）
**Objective:** 作為使用者，我希望重構後的按鈕效能不受影響，以便保持流暢的使用體驗。

#### Acceptance Criteria
1. WHEN Button 組件渲染 THEN Button 組件 SHALL 在 100ms 內完成首次渲染
2. WHEN Button 組件播放音效 THEN Button 組件 SHALL 確保音效延遲 < 50ms 且不阻塞主執行緒
3. WHERE 頁面包含 50+ 個 Button 組件 THEN Button 組件 SHALL 確保頁面初始載入時間增加 < 200ms
4. WHEN 前端重構系統替換按鈕 THEN 前端重構系統 SHALL 確保不影響現有的 memo、useCallback 等效能優化
5. IF Button 組件用於高頻互動場景（如拖拽、滾動） THEN Button 組件 SHALL 支援防抖（debounce）或節流（throttle）
6. WHEN 前端重構系統完成重構 THEN 前端重構系統 SHALL 確保應用程式的 Lighthouse Performance Score 下降 < 5 分

### Requirement 8: 測試覆蓋與驗證（Test Coverage and Validation）
**Objective:** 作為 QA 工程師，我希望重構後有完整的測試覆蓋，以便確保功能正確性和防止迴歸。

#### Acceptance Criteria
1. WHEN 前端重構系統完成批次重構 THEN 前端重構系統 SHALL 執行所有相關組件的單元測試
2. WHEN 前端重構系統執行測試 THEN 前端重構系統 SHALL 確保測試覆蓋率不低於原有水平
3. WHERE 高頻文件被重構（如 MobileSpreadSelector） THEN 前端重構系統 SHALL 執行該組件的 E2E 測試
4. WHEN 前端重構系統執行無障礙測試 THEN 前端重構系統 SHALL 確保所有 Button 組件通過 axe-core 檢查
5. IF 測試文件中包含原生 button 模擬 THEN 前端重構系統 SHALL 評估是否需要更新測試工具（如 Jest mock）
6. WHEN 前端重構系統完成所有重構 THEN 前端重構系統 SHALL 執行完整的迴歸測試套件並確保 100% 通過

### Requirement 9: 文件與知識傳遞（Documentation and Knowledge Transfer）
**Objective:** 作為新加入的開發者，我希望有清晰的文件記錄重構細節，以便理解變更和維護程式碼。

#### Acceptance Criteria
1. WHEN 前端重構系統完成重構 THEN 前端重構系統 SHALL 生成重構報告（Markdown 格式）包含：
   - 替換統計（總數、各批次數量）
   - Variant 映射統計（各 variant 使用數量）
   - 警告與特殊處理案例列表
   - 測試結果摘要
2. WHEN 前端重構系統遇到無法自動處理的案例 THEN 前端重構系統 SHALL 在報告中標記為「需人工審查」並提供檔案路徑和行號
3. WHERE Button 組件使用方式有變更 THEN 前端重構系統 SHALL 更新相關組件的 JSDoc 註解
4. WHEN 前端重構系統完成重構 THEN 前端重構系統 SHALL 更新 `.kiro/specs/button-component-refactoring/` 下的文件（design.md, tasks.md）

### Requirement 10: 向後相容與邊界條件（Backward Compatibility and Edge Cases）
**Objective:** 作為系統管理員，我希望重構不會破壞現有功能，以便確保系統穩定性。

#### Acceptance Criteria
1. WHERE 原生按鈕使用自定義 DOM 屬性（data-* 等）THEN 前端重構系統 SHALL 保留這些屬性並傳遞給 Button 組件
2. IF 原生按鈕使用內聯樣式（style prop）THEN 前端重構系統 SHALL 保留內聯樣式並傳遞給 Button 組件
3. WHERE 按鈕包含複雜子元素（如巢狀 span、圖示組件）THEN 前端重構系統 SHALL 保留所有子元素結構
4. IF 按鈕用於第三方庫整合（如 React Hook Form）THEN 前端重構系統 SHALL 確保與第三方庫的整合不受影響
5. WHEN 前端重構系統遇到測試文件中的原生按鈕 THEN 前端重構系統 SHALL 保持原樣不處理（或延後處理）
6. IF Button 組件不支援某些原生按鈕的特定屬性 THEN 前端重構系統 SHALL 記錄警告並建議解決方案

## Constraints and Assumptions

### Constraints
1. **範圍限制**：不處理 `src/components/ui/` 內的 UI 組件庫（這些組件本身定義了按鈕樣式）
2. **測試文件**：測試文件中的原生按鈕保持原樣或延後處理，避免過度影響測試邏輯
3. **第三方組件**：第三方組件庫（如 kokonutui）內的按鈕不在重構範圍內
4. **效能預算**：重構不得導致頁面載入時間增加超過 200ms
5. **音效相容性**：Button 組件音效必須在所有支援的瀏覽器中正常工作（Chrome, Firefox, Safari, Edge）

### Assumptions
1. **Button 組件穩定**：假設 `@/components/ui/button` 組件已經過充分測試且 API 穩定
2. **音效資源可用**：假設 useAudioEffect hook 所需的音效檔案已正確配置且可訪問
3. **TypeScript 嚴格模式**：假設專案啟用 TypeScript strict mode，所有型別需正確定義
4. **Bun 環境**：假設開發環境使用 Bun 作為套件管理器和執行時
5. **React 19**：假設專案使用 React 19，支援 ref-as-prop 新特性
6. **Tailwind CSS v4**：假設專案使用 Tailwind CSS v4，OKLCH 色彩系統可用

### Edge Cases to Consider
1. **動態按鈕**：透過 JavaScript 動態生成的按鈕（如在 useEffect 中創建）
2. **條件渲染**：大量使用三元運算子或 && 運算子的按鈕渲染邏輯
3. **HOC 包裝**：被高階組件（HOC）包裝的按鈕組件
4. **Portal 渲染**：透過 React Portal 渲染的按鈕（如在 Modal 中）
5. **Ref forwarding**：需要 ref forwarding 的按鈕組件
6. **表單整合**：作為表單子元素的按鈕，可能涉及複雜的驗證邏輯

## Out of Scope

以下項目明確不在本次重構範圍內：

1. **UI 組件庫重構**：`src/components/ui/` 內的其他 UI 組件（如 Input, Select 等）
2. **Button 組件本身修改**：不修改 `@/components/ui/button.tsx` 的實作
3. **新功能開發**：不添加 Button 組件的新 variant 或功能（除非必要）
4. **測試框架升級**：不升級 Jest, Playwright 或其他測試工具版本
5. **CSS 重構**：不重構全域 CSS 或 Tailwind 配置（除非與 Button 直接相關）
6. **音效系統重構**：不重構 useAudioEffect hook 的實作
7. **第三方組件**：不處理 kokonutui 或其他第三方組件庫內的按鈕
8. **後端 API**：不涉及任何後端 API 或資料庫變更

## Glossary

- **Button 組件**：指 `@/components/ui/button.tsx` 定義的標準按鈕組件
- **原生按鈕**：指 HTML `<button>` 標籤
- **Variant**：Button 組件的樣式變體（如 default, outline, destructive 等）
- **Pip-Boy 綠色**：Fallout 系列遊戲中 Pip-Boy 設備的標誌性綠色（OKLCH 色彩系統）
- **EARS 格式**：Easy Approach to Requirements Syntax，需求撰寫標準格式
- **硬編碼消除原則**：CLAUDE.md 定義的編碼規範，禁止在 return 語句中硬編碼重複內容
- **PixelIcon**：專案使用的圖示組件（`@/components/ui/icons`），替代 lucide-react
- **useAudioEffect**：Button 組件內建的音效 hook
- **重構範圍**：`src/app/` 和 `src/components/`（排除 `src/components/ui/`）
- **批次重構**：分 5 個批次按優先級執行重構（Mobile → Admin → Readings → Auth & Settings → 其他）
