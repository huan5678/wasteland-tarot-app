# Pixel 風格圖示系統替換 - 實作任務清單 (HackerNoon 版)

**Feature**: pixel-icon-replacement
**版本**: 2.0
**狀態**: ⏳ 待開始
**目標**: 從 pixelarticons 遷移至 @hackernoon/pixel-icon-library (1440+ 圖示)
**預估總工時**: 10-16 天

---

## 📋 任務概覽

| Phase | 任務數 | 預估時間 | 狀態 |
|-------|-------|---------|------|
| Phase 1: 準備階段 | 5 | 1-2 天 | ⏳ 待開始 |
| Phase 2: 核心元件改造 | 4 | 2-3 天 | ⏳ 待開始 |
| Phase 3: 映射表完成 | 4 | 3-5 天 | ⏳ 待開始 |
| Phase 4: 全域替換 | 3 | 1-2 天 | ⏳ 待開始 |
| Phase 5: 測試與優化 | 4 | 2-3 天 | ⏳ 待開始 |
| Phase 6: 部署與清理 | 4 | 1 天 | ⏳ 待開始 |
| **總計** | **24** | **10-16 天** | **0% (0/24)** |

---

## Phase 1: 準備階段

### Task 1.1: 安裝 HackerNoon 套件

**優先級**: P0 (Critical)
**預估時間**: 15 分鐘
**狀態**: ⏳ 待開始
**依賴**: 無

**目標**: 安裝 `@hackernoon/pixel-icon-library` npm 套件

**步驟**:
```bash
# 1. 安裝套件
bun add @hackernoon/pixel-icon-library

# 2. 驗證安裝
ls -la node_modules/@hackernoon/pixel-icon-library/
```

**驗收標準**:
- [ ] `package.json` 包含 `@hackernoon/pixel-icon-library`
- [ ] `node_modules/@hackernoon/pixel-icon-library/` 目錄存在
- [ ] 可成功 import 套件

**相關檔案**:
- `package.json`
- `bun.lock`

---

### Task 1.2: 探索套件結構

**優先級**: P0 (Critical)
**預估時間**: 30 分鐘
**狀態**: ⏳ 待開始
**依賴**: Task 1.1

**目標**: 了解 HackerNoon 套件的實際結構和圖示命名規則

**步驟**:
```bash
# 1. 查看目錄結構
tree node_modules/@hackernoon/pixel-icon-library/icons/ -L 4

# 2. 列出 Light mode 24px SVG 圖示
ls node_modules/@hackernoon/pixel-icon-library/icons/svg/light/24px/ | head -20

# 3. 檢查是否有 Dark mode
ls node_modules/@hackernoon/pixel-icon-library/icons/svg/dark/24px/ | head -20
```

**驗收標準**:
- [ ] 確認包含 SVG 和 PNG 格式
- [ ] 確認包含 Light/Dark 模式
- [ ] 確認包含 12px, 16px, 24px, 48px 四種尺寸
- [ ] 記錄至少 20 個圖示名稱範例

**輸出**:
建立筆記記錄實際結構（可選）

---

### Task 1.3: 掃描專案中所有使用的 PixelIcon

**優先級**: P0 (Critical)
**預估時間**: 30 分鐘
**狀態**: ⏳ 待開始
**依賴**: 無

**目標**: 找出專案中所有使用的 `PixelIcon` 圖示名稱

**步驟**:
```bash
# 1. 掃描所有 PixelIcon 使用並保存
grep -r "PixelIcon.*name=" src/ --include="*.tsx" --include="*.ts" | \
  grep -o 'name="[^"]*"' | \
  sort -u > .kiro/specs/pixel-icon-replacement/icon-usage.txt

# 2. 統計數量
wc -l .kiro/specs/pixel-icon-replacement/icon-usage.txt

# 3. 找出最常用的圖示
grep -r "PixelIcon.*name=" src/ --include="*.tsx" --include="*.ts" | \
  grep -o 'name="[^"]*"' | \
  sort | uniq -c | sort -rn | head -20
```

**驗收標準**:
- [ ] 產生 `icon-usage.txt` 檔案
- [ ] 記錄總使用圖示數量（估計 60-85 個）
- [ ] 識別最常用的 10-20 個圖示

**輸出**:
- `.kiro/specs/pixel-icon-replacement/icon-usage.txt`

---

### Task 1.4: 建立 TypeScript 型別定義

**優先級**: P0 (Critical)
**預估時間**: 1 小時
**狀態**: ⏳ 待開始
**依賴**: Task 1.2

**目標**: 擴充 `src/types/icons.ts` 以支援 HackerNoon 新功能

**實作內容**:
```typescript
// src/types/icons.ts

// ... 保留現有的 Phase 6 型別 ...

/**
 * HackerNoon-specific: Light/Dark mode
 */
export type IconMode = 'light' | 'dark';

/**
 * HackerNoon-specific: Icon format
 */
export type IconFormat = 'svg' | 'png';

/**
 * HackerNoon-specific: Original icon sizes
 */
export type OriginalIconSize = 12 | 16 | 24 | 48;

// 擴充 PixelIconProps
export interface PixelIconProps {
  // ... 保留所有現有 props ...

  // HackerNoon 新增
  mode?: IconMode;
  format?: IconFormat;
  originalSize?: OriginalIconSize;
}
```

**驗收標準**:
- [ ] TypeScript 編譯無錯誤
- [ ] 新型別正確導出
- [ ] 保留所有現有型別（向後相容）
- [ ] JSDoc 註解完整

**相關檔案**:
- `src/types/icons.ts`

---

### Task 1.5: 建立初始映射表骨架

**優先級**: P0 (Critical)
**預估時間**: 1 小時
**狀態**: ⏳ 待開始
**依賴**: Task 1.3

**目標**: 建立 `iconMapping.ts` 映射表骨架

**實作內容**:
```typescript
// src/components/ui/icons/iconMapping.ts

import type { IconMode, IconFormat, OriginalIconSize } from '@/types/icons';

/**
 * pixelarticons → HackerNoon 圖示映射表
 */
export const pixelartToHackernoonMap: Record<string, string> = {
  // 從 icon-usage.txt 導入的圖示
  'home': '',  // TODO: 需要映射
  'menu': '',  // TODO: 需要映射
  // ... 其他圖示
};

export function mapIconName(pixelartName: string): string {
  const mapped = pixelartToHackernoonMap[pixelartName];
  if (!mapped) {
    console.warn(`Icon "${pixelartName}" not found in mapping table.`);
    return pixelartName;
  }
  return mapped;
}

export function getIconPath(
  name: string,
  mode: IconMode = 'light',
  format: IconFormat = 'svg',
  size: OriginalIconSize = 24
): string {
  const hackernoonName = mapIconName(name);
  return `/node_modules/@hackernoon/pixel-icon-library/icons/${format}/${mode}/${size}px/${hackernoonName}.${format}`;
}

export function getFallbackIcon(): string {
  return 'question-mark';
}

// ... 其他工具函式 ...
```

**驗收標準**:
- [ ] 檔案成功建立
- [ ] 包含所有專案使用的圖示名稱
- [ ] 所有映射函式實作完成
- [ ] TypeScript 編譯無錯誤

**相關檔案**:
- `src/components/ui/icons/iconMapping.ts` (新建)

---

## Phase 2: 核心元件改造

### Task 2.1: 建立 HackerNoonIconRegistry 類別

**優先級**: P0 (Critical)
**預估時間**: 2 小時
**狀態**: ⏳ 待開始
**依賴**: Task 1.4

**目標**: 實作 HackerNoon 圖示的載入和快取管理器

**實作要點**:
- Memory Cache (Map<string, string>)
- `getIcon(name, mode, format, size)` 方法
- `preloadCriticalIcons(names)` 方法
- `convertToDataURL()` 方法（PNG 支援）
- `clearCache()` 和 `getCacheStats()` 方法

參考 design.md 第 4.2 節的完整實作程式碼

**驗收標準**:
- [ ] 類別成功實作
- [ ] 所有方法都有 JSDoc 註解
- [ ] TypeScript 編譯無錯誤
- [ ] 快取機制正常運作

**相關檔案**:
- `src/lib/hackernoonIconRegistry.ts` (新建)

---

### Task 2.2: 更新 iconMapping.ts 完整實作

**優先級**: P0 (Critical)
**預估時間**: 1 小時
**狀態**: ⏳ 待開始
**依賴**: Task 1.5, Task 2.1

**目標**: 完善 iconMapping.ts 實作

**實作要點**:
- 整合所有映射函式
- 新增錯誤處理和警告訊息
- 完整的 JSDoc 註解
- 實作 `isMapped()`, `getAllMappedIcons()`, `findSimilarIcons()`

**驗收標準**:
- [ ] 所有函式完整實作
- [ ] 錯誤處理完善
- [ ] JSDoc 註解完整
- [ ] TypeScript 編譯無錯誤

**相關檔案**:
- `src/components/ui/icons/iconMapping.ts`

---

### Task 2.3: 更新 PixelIcon.tsx 元件

**優先級**: P0 (Critical)
**預估時間**: 3 小時
**狀態**: ⏳ 待開始
**依賴**: Task 2.1, Task 2.2, Task 1.4

**目標**: 更新 PixelIcon 元件以支援 HackerNoon

**關鍵變更**:
```typescript
export const PixelIcon: React.FC<PixelIconProps> = ({
  name,
  size,
  sizePreset,
  animation,
  variant,
  mode = 'light',           // 🆕 HackerNoon
  format = 'svg',           // 🆕 HackerNoon
  originalSize = 24,        // 🆕 HackerNoon
  // ... 其他 props
}) => {
  // 載入邏輯更新
  const loadIcon = useCallback(async () => {
    const hackernoonName = mapIconName(name);
    const content = await hackernoonIconRegistry.getIcon(
      hackernoonName,
      mode,
      format,
      originalSize
    );
    // ...
  }, [name, mode, format, originalSize]);

  // PNG 渲染支援
  if (format === 'png') {
    return <span><img src={iconContent} /></span>;
  }

  // SVG 渲染（預設）
  return <span dangerouslySetInnerHTML={{ __html: iconContent }} />;
};
```

**驗收標準**:
- [ ] 新 props 正確整合
- [ ] 使用 HackerNoonIconRegistry
- [ ] 支援 SVG 和 PNG 格式
- [ ] Phase 6 功能保留
- [ ] 向後相容
- [ ] TypeScript 編譯無錯誤

**相關檔案**:
- `src/components/ui/icons/PixelIcon.tsx`

---

### Task 2.4: 驗證 Phase 6 工具函式

**優先級**: P1 (High)
**預估時間**: 30 分鐘
**狀態**: ⏳ 待開始
**依賴**: Task 2.3

**目標**: 確保 iconUtils.ts 中的 Phase 6 工具函式正常運作

**驗證內容**:
- `getIconSize(size, sizePreset)` 正常
- `composeIconClasses(...)` 正常
- 動畫效果正常顯示
- 顏色變體正確套用
- 尺寸預設計算正確

**驗收標準**:
- [ ] 所有 Phase 6 工具函式正常
- [ ] 動畫效果正常
- [ ] 顏色變體正確
- [ ] 尺寸預設正確

**相關檔案**:
- `src/components/ui/icons/iconUtils.ts`

---

## Phase 3: 映射表完成

### Task 3.1: 完成核心圖示映射（第一優先）

**優先級**: P0 (Critical)
**預估時間**: 4-6 小時
**狀態**: ⏳ 待開始
**依賴**: Task 1.2, Task 1.3, Task 2.2

**目標**: 完成專案實際使用的 60-85 個圖示映射

**映射策略**:
1. 從 `icon-usage.txt` 讀取所有圖示名稱
2. 對每個圖示在 HackerNoon 中搜尋對應圖示
3. 優先處理最常用的 20 個圖示
4. 填入 `pixelartToHackernoonMap`
5. 記錄無法映射的圖示

**映射範例**:
```typescript
export const pixelartToHackernoonMap: Record<string, string> = {
  // Navigation
  'home': 'house',
  'menu': 'hamburger-menu',
  'close': 'x',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',

  // User & Auth
  'user': 'user-circle',
  'login': 'sign-in',
  'logout': 'sign-out',
  'settings': 'gear',

  // ... 繼續映射
};
```

**驗收標準**:
- [ ] 所有專案使用的圖示都已映射
- [ ] 映射表包含 60-85 個圖示
- [ ] 每個映射都經過驗證
- [ ] 記錄無法映射的圖示清單

**輸出**:
- 更新 `src/components/ui/icons/iconMapping.ts`
- `.kiro/specs/pixel-icon-replacement/mapping-report.md` (記錄映射結果)

---

### Task 3.2: 建立 /icon-showcase 頁面

**優先級**: P1 (High)
**預估時間**: 2-3 小時
**狀態**: ⏳ 待開始
**依賴**: Task 2.3

**目標**: 建立圖示預覽和測試工具頁面

**功能需求**:
- 顯示所有已映射的圖示
- 搜尋功能
- Light/Dark 模式切換
- SVG/PNG 格式切換
- 尺寸選擇（12px, 16px, 24px, 48px）
- 顯示統計資訊
- Fallout 主題樣式

參考 design.md 第 8.1 節的完整實作程式碼

**驗收標準**:
- [ ] 頁面成功建立
- [ ] 所有功能正常運作
- [ ] 可訪問 `/icon-showcase` 路由
- [ ] 樣式符合 Fallout 主題
- [ ] 響應式設計

**相關檔案**:
- `src/app/icon-showcase/page.tsx` (新建)

---

### Task 3.3: 視覺驗證與調整

**優先級**: P1 (High)
**預估時間**: 2-3 小時
**狀態**: ⏳ 待開始
**依賴**: Task 3.1, Task 3.2

**目標**: 驗證所有映射圖示的視覺效果

**步驟**:
1. 使用 `/icon-showcase` 檢視所有圖示
2. 對比 HackerNoon 圖示與原 pixelarticons 圖示
3. 調整不滿意的映射
4. 記錄需要人工確認的圖示
5. 截圖保存重要圖示的對比（可選）

**驗收標準**:
- [ ] 所有映射圖示視覺效果符合預期
- [ ] 無明顯的視覺不協調
- [ ] 記錄需要設計師審核的圖示

**輸出**:
更新 `mapping-report.md` 增加視覺驗證結果

---

### Task 3.4: 產生遷移報告

**優先級**: P2 (Medium)
**預估時間**: 1 小時
**狀態**: ⏳ 待開始
**依賴**: Task 3.3

**目標**: 產生完整的圖示遷移報告

**報告格式**:
```markdown
# 圖示遷移報告

## 統計資訊
- 總計圖示數: 85
- 成功映射: 82 (96%)
- 需要確認: 3 (4%)
- 無法映射: 0 (0%)

## 成功映射的圖示
| pixelarticons | HackerNoon | 狀態 |
|---------------|-----------|------|
| home | house | ✅ 完美匹配 |
| menu | hamburger-menu | ✅ 完美匹配 |

## 需要確認的圖示
| pixelarticons | HackerNoon 候選 | 原因 |
|---------------|----------------|------|
| custom-icon | option-a, option-b | 無完美匹配 |
```

**驗收標準**:
- [ ] 報告成功產生
- [ ] 包含完整統計資訊
- [ ] 列出所有映射結果
- [ ] 提供清晰的後續行動建議

**輸出**:
- `.kiro/specs/pixel-icon-replacement/migration-report.md`

---

## Phase 4: 全域替換

### Task 4.1: 測試向後相容性

**優先級**: P0 (Critical)
**預估時間**: 2 小時
**狀態**: ⏳ 待開始
**依賴**: Phase 3 所有任務

**目標**: 確保所有現有程式碼無需修改即可使用 HackerNoon 圖示

**測試內容**:
```bash
# 1. 啟動開發伺服器
bun run dev

# 2. 手動測試主要頁面
# - 首頁 (/)
# - Dashboard (/dashboard)
# - Readings (/readings)
# - Settings (/settings)
# - 音樂播放器
# - 靜態頁面

# 3. 檢查 console 錯誤

# 4. 驗證 Phase 6 功能（animation, variant, sizePreset）

# 5. 驗證 HackerNoon 新功能（mode, format, originalSize）
```

**驗收標準**:
- [ ] 所有頁面圖示正常顯示
- [ ] 無 console 錯誤
- [ ] 無 404 錯誤（圖示載入失敗）
- [ ] Phase 6 功能正常
- [ ] HackerNoon 新功能正常

**輸出**:
`.kiro/specs/pixel-icon-replacement/compatibility-test.md`

---

### Task 4.2: 更新文件

**優先級**: P1 (High)
**預估時間**: 2 小時
**狀態**: ⏳ 待開始
**依賴**: Task 4.1

**目標**: 更新所有相關文件

**需要更新的檔案**:

1. **`src/components/ui/icons/README.md`**
   - 移除 pixelarticons 說明
   - 新增 HackerNoon 使用指南
   - 新增 mode, format, originalSize props 說明
   - 新增範例程式碼

2. **`CLAUDE.md`**
   - 更新 Icon System 章節
   - 移除 pixelarticons 提及
   - 新增 HackerNoon 套件說明
   - 更新範例程式碼

3. **`MIGRATION_GUIDE.md`**（已存在）
   - 驗證內容是否需要更新
   - 補充實際遷移經驗

**驗收標準**:
- [ ] 所有文件已更新
- [ ] 無 pixelarticons 殘留提及
- [ ] 範例程式碼正確
- [ ] 文件完整且清晰

---

### Task 4.3: 清理舊程式碼（可選）

**優先級**: P2 (Medium)
**預估時間**: 1 小時
**狀態**: ⏳ 待開始
**依賴**: Task 4.1

**目標**: 移除 pixelarticons 相關的舊程式碼

**步驟**:
```bash
# 1. 檢查是否有 pixelarticons 殘留
grep -r "pixelarticons" src/ --include="*.ts" --include="*.tsx"

# 2. 決定是否移除舊的 iconRegistry.ts
# （如果已被 HackerNoonIconRegistry 完全取代）

# 3. 移除臨時測試檔案（如有）
```

**驗收標準**:
- [ ] 無 pixelarticons 程式碼殘留（除非有意保留）
- [ ] 無不必要的舊檔案
- [ ] TypeScript 編譯無錯誤

---

## Phase 5: 測試與優化

### Task 5.1: 單元測試

**優先級**: P1 (High)
**預估時間**: 3 小時
**狀態**: ⏳ 待開始
**依賴**: Phase 4 所有任務

**目標**: 撰寫完整的單元測試

**測試檔案**:

1. **`src/components/ui/icons/__tests__/PixelIcon.test.tsx`**
   - 測試基本渲染
   - 測試 HackerNoon registry 整合
   - 測試 mode, format, originalSize props
   - 測試 Phase 6 功能
   - 測試 fallback 機制

2. **`src/components/ui/icons/__tests__/iconMapping.test.ts`**
   - 測試 `mapIconName()`
   - 測試 `isMapped()`
   - 測試 `getAllMappedIcons()`
   - 測試 `findSimilarIcons()`

3. **`src/lib/__tests__/hackernoonIconRegistry.test.ts`**（可選）
   - 測試快取機制
   - 測試預載入
   - 測試錯誤處理

**測試覆蓋率目標**: ≥ 80%

**驗收標準**:
- [ ] 所有測試通過
- [ ] 測試覆蓋率達標
- [ ] 無未處理的 edge cases

---

### Task 5.2: E2E 測試

**優先級**: P1 (High)
**預估時間**: 2 小時
**狀態**: ⏳ 待開始
**依賴**: Task 5.1

**目標**: 建立 E2E 測試驗證圖示系統整合

**測試檔案**:

1. **`tests/e2e/hackernoon-icons.spec.ts`**
   - 測試首頁所有圖示正常渲染
   - 測試 `/icon-showcase` 頁面
   - 測試 Light/Dark 模式切換
   - 測試 Phase 6 動畫效果

2. **`tests/visual/hackernoon-icons-visual.spec.ts`**
   - 截圖比對 `/icon-showcase` 頁面

**驗收標準**:
- [ ] 所有 E2E 測試通過
- [ ] 視覺回歸測試通過
- [ ] 無非預期的視覺變化

---

### Task 5.3: 效能測試與優化

**優先級**: P1 (High)
**預估時間**: 2 小時
**狀態**: ⏳ 待開始
**依賴**: Task 5.2

**目標**: 驗證效能指標並優化

**測試項目**:
```bash
# 1. Production build
bun run build

# 2. 檢查 bundle 大小
# 目標: 圖示系統 ≤ 70KB gzipped

# 3. 測試 FCP
# 目標: < 1.5s
# 使用 Lighthouse CI

# 4. 測試圖示載入速度
# 目標: < 150ms
# 使用 Chrome DevTools

# 5. 驗證快取機制
hackernoonIconRegistry.getCacheStats()
```

**效能目標**:
- Bundle Size: ≤ 70KB gzipped
- FCP: < 1.5s
- 圖示載入: < 150ms
- Cache Hit Rate: > 90%

**驗收標準**:
- [ ] 所有效能指標達標
- [ ] Bundle 大小符合目標
- [ ] FCP 符合標準
- [ ] 快取機制正常

**輸出**:
`.kiro/specs/pixel-icon-replacement/performance-report.md`

---

### Task 5.4: 無障礙性測試

**優先級**: P1 (High)
**預估時間**: 1 小時
**狀態**: ⏳ 待開始
**依賴**: Task 5.2

**目標**: 確保符合 WCAG 2.1 AA 標準

**測試內容**:
1. 執行 axe-core 檢測
2. 測試鍵盤導航
3. 測試螢幕閱讀器
4. 對比度測試

**驗收標準**:
- [ ] axe-core 無違規
- [ ] 鍵盤導航正常
- [ ] 螢幕閱讀器相容
- [ ] 對比度測試通過

**測試檔案**:
- `tests/accessibility/hackernoon-icons.spec.ts` (新建)

---

## Phase 6: 部署與清理

### Task 6.1: 確認遷移完成

**優先級**: P0 (Critical)
**預估時間**: 1 小時
**狀態**: ⏳ 待開始
**依賴**: Phase 5 所有任務

**目標**: 最後檢查確保遷移 100% 完成

**檢查項目**:
```bash
# 1. 檢查 pixelarticons 殘留
grep -r "pixelarticons" src/ package.json CLAUDE.md

# 2. 驗證所有頁面使用 HackerNoon 圖示
# 手動訪問所有主要頁面
# 檢查 Network tab 確認圖示來源

# 3. 執行完整測試套件
bun test
bun run test:playwright
```

**驗收標準**:
- [ ] 無 pixelarticons 殘留
- [ ] 所有頁面使用 HackerNoon 圖示
- [ ] 所有測試通過

**輸出**:
`.kiro/specs/pixel-icon-replacement/migration-complete.md`

---

### Task 6.2: 移除 pixelarticons 套件

**優先級**: P0 (Critical)
**預估時間**: 15 分鐘
**狀態**: ⏳ 待開始
**依賴**: Task 6.1

**目標**: 移除舊的 pixelarticons 套件

**步驟**:
```bash
# 1. 移除套件
bun remove pixelarticons

# 2. 驗證 package.json
# 確認 pixelarticons 已移除
# 確認 @hackernoon/pixel-icon-library 存在

# 3. 執行測試確認無影響
bun test
```

**驗收標準**:
- [ ] pixelarticons 套件已移除
- [ ] package.json 已更新
- [ ] 測試仍然通過

**相關檔案**:
- `package.json`
- `bun.lock`

---

### Task 6.3: 清理程式碼和檔案

**優先級**: P1 (High)
**預估時間**: 30 分鐘
**狀態**: ⏳ 待開始
**依賴**: Task 6.2

**目標**: 移除過渡期的臨時程式碼和檔案

**清理項目**:
1. 移除臨時測試頁面（如 `/test/icon-comparison`，如果建立了）
2. 移除臨時檔案（`.kiro/specs/pixel-icon-replacement/icon-usage.txt` 可選保留）
3. 決定 `/icon-showcase` 是否保留為永久開發者工具
4. 確認無未使用的 import

**驗收標準**:
- [ ] 無臨時檔案殘留
- [ ] 程式碼乾淨整潔
- [ ] 無未使用的 import

---

### Task 6.4: Production Build 與部署

**優先級**: P0 (Critical)
**預估時間**: 1 小時
**狀態**: ⏳ 待開始
**依賴**: Task 6.3

**目標**: 執行 production build 並驗證

**步驟**:
```bash
# 1. Production build
bun run build

# 2. 本地啟動 production server
bun run start

# 3. 驗證 production 環境
# - 測試所有主要頁面
# - 檢查 console 無錯誤
# - 驗證圖示載入正常

# 4. 監控效能
# - Lighthouse 測試
# - 檢查 bundle 大小
# - 驗證 FCP

# 5. 部署到 staging/production

# 6. 監控錯誤日誌（部署後 24-48 小時）
```

**驗收標準**:
- [ ] Production build 成功
- [ ] 線上環境運作正常
- [ ] 效能指標達標
- [ ] 無錯誤日誌

---

## 📊 進度追蹤

### Phase 完成度

- [ ] **Phase 1: 準備階段** - 0/5 (0%)
- [ ] **Phase 2: 核心元件改造** - 0/4 (0%)
- [ ] **Phase 3: 映射表完成** - 0/4 (0%)
- [ ] **Phase 4: 全域替換** - 0/3 (0%)
- [ ] **Phase 5: 測試與優化** - 0/4 (0%)
- [ ] **Phase 6: 部署與清理** - 0/4 (0%)

### 總體進度: 0/24 (0%)

---

## 🔗 依賴關係圖

```
Phase 1 (準備階段)
├── Task 1.1
├── Task 1.2 ← Task 1.1
├── Task 1.3
├── Task 1.4 ← Task 1.2
└── Task 1.5 ← Task 1.3

Phase 2 (核心元件改造)
├── Task 2.1 ← Task 1.4
├── Task 2.2 ← Task 1.5, Task 2.1
├── Task 2.3 ← Task 2.1, Task 2.2, Task 1.4
└── Task 2.4 ← Task 2.3

Phase 3 (映射表完成)
├── Task 3.1 ← Task 1.2, Task 1.3, Task 2.2
├── Task 3.2 ← Task 2.3
├── Task 3.3 ← Task 3.1, Task 3.2
└── Task 3.4 ← Task 3.3

Phase 4 (全域替換)
├── Task 4.1 ← Phase 3
├── Task 4.2 ← Task 4.1
└── Task 4.3 ← Task 4.1

Phase 5 (測試與優化)
├── Task 5.1 ← Phase 4
├── Task 5.2 ← Task 5.1
├── Task 5.3 ← Task 5.2
└── Task 5.4 ← Task 5.2

Phase 6 (部署與清理)
├── Task 6.1 ← Phase 5
├── Task 6.2 ← Task 6.1
├── Task 6.3 ← Task 6.2
└── Task 6.4 ← Task 6.3
```

---

## 📝 備註

### 關鍵里程碑
- **Milestone 1**: Phase 1 完成 → 套件安裝和結構探索完成
- **Milestone 2**: Phase 2 完成 → 核心元件可用，向後相容
- **Milestone 3**: Phase 3 完成 → 所有圖示映射完成
- **Milestone 4**: Phase 5 完成 → 測試通過，效能達標
- **Milestone 5**: Phase 6 完成 → 正式上線

### 風險提示
- 🔴 **高風險**: Task 3.1（映射表完成）- 可能發現無法映射的圖示
- 🟡 **中風險**: Task 5.3（效能優化）- 可能需要額外優化
- 🟢 **低風險**: 其他任務

### 回滾計畫
如果發現重大問題：
```bash
# 1. 建立分支（Phase 1 前）
git checkout -b feature/hackernoon-icons

# 2. 回滾步驟
git checkout main
bun add pixelarticons
git restore src/components/ui/icons/
git restore src/lib/iconRegistry.ts
git restore src/types/icons.ts

# 3. 測試
bun test

# 4. 部署
bun run build && bun run start
```

**預估回滾時間**: < 30 分鐘

---

**文件版本**: 2.0
**最後更新**: 2025-10-11
**狀態**: ⏳ 待開始
**基於**: design.md v2.0, requirements.md v2.0

**變更記錄**:
- v1.0 (2025-10-11): pixelarticons 版本任務清單（已完成）
- v2.0 (2025-10-11): 完全重寫為 HackerNoon 版本任務清單
