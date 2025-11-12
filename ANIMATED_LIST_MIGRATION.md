# AnimatedList 組件遷移文檔

## 概述

本專案已將主要內容列表頁面的列表渲染改用統一的 `AnimatedList` 組件，提供以下功能：

- ✅ **滾動進入動畫**：使用 framer-motion 的 `useInView` 實現元素進入視窗時的動畫效果
- ✅ **鍵盤導航**：支援上下箭頭、Tab、Enter 鍵操作
- ✅ **漸變邊緣效果**：頂部和底部的漸變遮罩，提示可滾動內容
- ✅ **自動滾動到選中項目**：鍵盤導航時自動將選中項目滾動到可視區域

## 已改造的組件

### 1. ReadingHistory 組件
**位置**: `src/components/readings/ReadingHistory.tsx`

**改造內容**:
- 將占卜記錄列表從傳統的 `.map()` 改用 `AnimatedList` 組件
- 保留所有原有樣式和功能（篩選、搜尋、分頁、收藏、刪除）
- 新增滾動動畫和鍵盤導航功能

**測試方式**:
1. 訪問 `/readings` 頁面
2. 確認列表項目在滾動進入視窗時有縮放和淡入動畫
3. 使用上下箭頭鍵或 Tab 鍵導航列表項目
4. 按 Enter 鍵打開選中的占卜記錄
5. 確認滑鼠懸停和點擊功能正常
6. 確認分頁功能正常運作

### 2. JournalList 組件
**位置**: `src/components/journal/JournalList.tsx`

**改造內容**:
- 將日記列表從傳統的 `.map()` 改用 `AnimatedList` 組件
- 保留所有原有樣式和功能（搜尋、心情標籤篩選、分頁）
- 新增滾動動畫和鍵盤導航功能

**測試方式**:
1. 訪問 `/journal` 頁面
2. 確認日記卡片在滾動進入視窗時有縮放和淡入動畫
3. 使用上下箭頭鍵或 Tab 鍵導航日記列表
4. 按 Enter 鍵打開選中的日記
5. 確認搜尋和篩選功能正常
6. 確認分頁功能正常運作

## AnimatedList 組件 API

### 基本用法

```tsx
import { AnimatedList } from '@/components/ui/AnimatedList';

<AnimatedList
  items={data}
  keyExtractor={(item) => item.id}
  renderItem={(item, index, isSelected) => (
    <div className={isSelected ? 'selected' : ''}>
      {item.title}
    </div>
  )}
  onItemSelect={(item, index) => {
    console.log('Selected:', item);
  }}
/>
```

### 主要 Props

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `items` | `T[]` | 必填 | 列表項目資料陣列 |
| `renderItem` | `(item: T, index: number, isSelected: boolean) => ReactNode` | 必填 | 渲染每個項目的函數 |
| `keyExtractor` | `(item: T, index: number) => string \| number` | 必填 | 取得項目唯一鍵值的函數 |
| `onItemSelect` | `(item: T, index: number) => void` | 可選 | 項目被選中時的回調 |
| `selectedIndex` | `number` | 可選 | 當前選中的索引（受控模式） |
| `initialSelectedIndex` | `number` | `-1` | 初始選中的索引 |
| `showGradients` | `boolean` | `true` | 是否顯示漸變邊緣效果 |
| `enableArrowNavigation` | `boolean` | `true` | 是否啟用鍵盤導航 |
| `className` | `string` | `''` | 容器的自訂 className |
| `itemClassName` | `string` | `''` | 列表項目容器的自訂 className |
| `displayScrollbar` | `boolean` | `true` | 是否顯示捲軸 |
| `maxHeight` | `string` | `'400px'` | 最大高度（CSS 值，例如 '400px' 或 'none'） |
| `animationDelay` | `number` | `0.1` | 動畫延遲時間（秒） |
| `animationDuration` | `number` | `0.2` | 動畫持續時間（秒） |
| `gradientColor` | `string` | `'#060010'` | 漸變顏色（CSS 顏色值） |
| `gradientHeight` | `{ top: number; bottom: number }` | `{ top: 50, bottom: 100 }` | 漸變高度（像素值） |

### 鍵盤操作

- **↑ / Shift+Tab**: 向上導航
- **↓ / Tab**: 向下導航
- **Enter**: 選中當前項目

### 自訂樣式範例

```tsx
<AnimatedList
  items={readings}
  keyExtractor={(r) => r.id}
  renderItem={(r, index, isSelected) => (
    <div className={`
      border-2 p-3 transition
      ${isSelected ? 'border-green-500 bg-green-500/10' : 'border-gray-500'}
    `}>
      {r.title}
    </div>
  )}
  maxHeight="600px"
  gradientColor="#000000"
  gradientHeight={{ top: 80, bottom: 120 }}
  displayScrollbar={false}
/>
```

## 未改造的組件（及原因）

### VirtualizedReadingList
**位置**: `src/components/readings/VirtualizedReadingList.tsx`
**原因**: 此組件使用 `@tanstack/react-virtual` 進行虛擬化，專注於處理大量數據（>100 筆）的效能優化。AnimatedList 的動畫功能與虛擬化的目標不同，因此保持原樣。

### Cards 頁面（網格佈局）
**位置**:
- `src/app/cards/page.tsx` - 花色選擇
- `src/app/cards/[suit]/page.tsx` - 卡牌列表

**原因**: 這些頁面使用網格佈局（Grid），不是垂直列表，因此不適合使用 AnimatedList。

## 效能考量

### AnimatedList vs VirtualizedReadingList

| 特性 | AnimatedList | VirtualizedReadingList |
|------|--------------|------------------------|
| **適用場景** | < 100 筆資料 | > 100 筆資料 |
| **動畫效果** | ✅ 豐富的進入動畫 | ❌ 無動畫 |
| **鍵盤導航** | ✅ 完整支援 | ❌ 不支援 |
| **虛擬化** | ❌ 不支援 | ✅ 高效能虛擬化 |
| **記憶體使用** | 全部渲染 | 只渲染可見項目 |
| **建議使用** | 小型列表、互動體驗優先 | 大型列表、效能優先 |

## 開發指南

### 何時使用 AnimatedList

✅ **推薦使用的情境**:
- 列表項目數量 < 100
- 需要良好的視覺回饋和互動體驗
- 支援鍵盤導航的需求
- 內容列表（如占卜記錄、日記、成就等）

❌ **不建議使用的情境**:
- 列表項目數量 > 100（考慮使用 VirtualizedReadingList）
- 網格佈局（Grid）
- 需要虛擬化效能的場景
- 無限滾動列表

### 遷移現有列表的步驟

1. **導入 AnimatedList**
   ```tsx
   import { AnimatedList } from '@/components/ui/AnimatedList';
   ```

2. **將 `.map()` 改為 `renderItem`**
   ```tsx
   // 原本
   {items.map((item) => (
     <div key={item.id}>{item.title}</div>
   ))}

   // 改造後
   <AnimatedList
     items={items}
     keyExtractor={(item) => item.id}
     renderItem={(item) => (
       <div>{item.title}</div>
     )}
   />
   ```

3. **保留原有樣式**
   - 將原有的樣式直接套用在 `renderItem` 返回的元素上
   - 使用 `isSelected` 參數添加選中狀態的樣式

4. **設定行為**
   ```tsx
   <AnimatedList
     onItemSelect={(item) => handleClick(item)}
     enableArrowNavigation={true}
     showGradients={false} // 如果不需要漸變效果
     maxHeight="none" // 如果不需要最大高度限制
   />
   ```

## 建置狀態

✅ **建置成功**: 所有改造後的組件都已通過 Next.js 建置流程，無編譯錯誤。

## 後續優化建議

1. **效能監控**: 使用 React DevTools Profiler 監控動畫效能
2. **無障礙優化**: 增強鍵盤導航的 ARIA 標籤
3. **手機體驗**: 考慮在手機上禁用鍵盤導航，改用滑動手勢
4. **測試覆蓋**: 為 AnimatedList 組件編寫單元測試和整合測試

## 維護說明

- **組件位置**: `src/components/ui/AnimatedList.tsx`
- **類型安全**: 使用 TypeScript 泛型確保類型安全
- **依賴套件**: `motion` (framer-motion)
- **版本**: 1.0.0
- **最後更新**: 2025-11-13

---

**問題回報**: 如發現任何問題，請在專案 issue tracker 中回報。
**功能建議**: 歡迎提出改進建議，幫助優化使用者體驗。
