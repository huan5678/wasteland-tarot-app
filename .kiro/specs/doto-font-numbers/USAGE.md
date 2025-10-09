# Doto 字體使用指南

## 概述

本專案使用 Google Font **Doto**（像素風格可變字體）來顯示所有數字內容，與 Fallout 主題的 Pip-Boy 風格完美協調。

## 字體配置

### 基礎設定

字體已透過 Next.js Font Optimization 配置於 `src/lib/fonts.ts`：

```typescript
import { Doto } from 'next/font/google';

export const doto = Doto({
  subsets: ['latin'],
  variable: '--font-doto',
  display: 'swap',
  fallback: ['monospace', 'Courier New', 'Monaco'],
  preload: true,
  adjustFontFallback: true,
});
```

### 全域整合

字體變數已在 `src/app/layout.tsx` 中注入到 HTML：

```tsx
<html lang="zh-TW" className={`dark ${doto.variable}`}>
```

### Tailwind CSS 配置

在 `tailwind.config.ts` 中已擴展字體家族：

```typescript
fontFamily: {
  mono: ["JetBrains Mono", "Consolas", "Monaco", "Courier New", "monospace"],
  doto: ["var(--font-doto)", "monospace"],
}
```

## CSS 工具類別

### 1. `.font-doto` (Tailwind)

**用途**：直接套用 Doto 字體
**使用時機**：任何需要顯示數字的元素

```tsx
<span className="font-doto">123</span>
```

### 2. `.tabular-nums` (Tailwind)

**用途**：等寬數字對齊
**使用時機**：與 `font-doto` 一起使用，確保數字對齊

```tsx
<span className="font-doto tabular-nums">42</span>
```

### 3. `.numeric` (全域 CSS)

**定義**：
```css
.numeric {
  font-family: var(--font-doto);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}
```

**用途**：基礎數字樣式
**使用時機**：需要基本數字顯示時

```tsx
<span className="numeric">999</span>
```

### 4. `.stat-number` (全域 CSS - 響應式)

**定義**：
```css
.stat-number {
  @apply font-doto text-2xl md:text-3xl lg:text-4xl font-bold tabular-nums;
}
```

**用途**：大型統計數值顯示（響應式）
**使用時機**：儀表板、統計卡片的主要數值

```tsx
<div className="stat-number">1,234</div>
```

**響應式大小**：
- 手機：`text-2xl` (1.5rem / 24px)
- 平板：`text-3xl` (1.875rem / 30px)
- 桌面：`text-4xl` (2.25rem / 36px)

### 5. `.counter` (全域 CSS - 響應式)

**定義**：
```css
.counter {
  @apply font-doto text-xs md:text-sm tabular-nums;
}
```

**用途**：小型計數器、字數統計
**使用時機**：字數限制顯示、小型數字指標

```tsx
<span className="counter">{content.length}/2000</span>
```

**響應式大小**：
- 手機：`text-xs` (0.75rem / 12px)
- 平板/桌面：`text-sm` (0.875rem / 14px)

## 使用模式

### 模式 1：內嵌數字顯示

**場景**：在文字中顯示數字

```tsx
<div className="text-pip-boy-green">
  顯示 <span className="font-doto tabular-nums">{count}</span> 筆
</div>
```

### 模式 2：統計卡片

**場景**：大型統計數值（使用 StatisticsCard 組件）

```tsx
<StatisticsCard
  title="總占卜次數"
  value={totalReadings}
  useNumericFont={true}  // 預設為 true
/>
```

### 模式 3：字數計數器

**場景**：表單輸入的字數限制

```tsx
<div className="text-xs text-pip-boy-green/60">
  <span className="font-doto tabular-nums">{content.length}</span>
  /
  <span className="font-doto tabular-nums">2000</span>
</div>
```

### 模式 4：進度指示器

**場景**：顯示分頁或進度

```tsx
<div>
  <span className="font-doto tabular-nums">{current + 1}</span>
  {' / '}
  <span className="font-doto tabular-nums">{total}</span>
</div>
```

### 模式 5：圖表工具提示

**場景**：Recharts Tooltip

```tsx
<Tooltip
  contentStyle={{
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.5rem',
    fontFamily: 'var(--font-doto), monospace',
  }}
/>
```

## 組件樣式指南

### 何時使用 Doto 字體

✅ **應該使用**：
- 所有純數字顯示（統計、計數、分數）
- 數字 + 單位組合（如 "42 次"）
- 日期時間中的數字部分
- 圖表中的數值標籤
- 字數/字元計數器
- 頁碼、進度指示
- 百分比數字（如 "85%"）

❌ **不應使用**：
- 純文字內容
- 程式碼區塊（使用 JetBrains Mono）
- 長段落或說明文字
- 按鈕文字（除非是純數字按鈕）

### 與其他字體的搭配

```tsx
{/* ✅ 正確：數字使用 Doto，文字使用預設字體 */}
<div className="font-mono text-pip-boy-green">
  你已使用服務 <span className="font-doto tabular-nums">{days}</span> 天
</div>

{/* ❌ 錯誤：整行都用 Doto */}
<div className="font-doto">
  你已使用服務 {days} 天
</div>
```

## 瀏覽器相容性

### CSS 變數支援

專案已包含 CSS 降級處理：

```css
@supports not (font-family: var(--font-doto)) {
  .font-doto,
  .numeric,
  .stat-number,
  .counter {
    font-family: 'Courier New', monospace;
  }
}
```

**支援瀏覽器**：
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

**不支援 CSS 變數的瀏覽器**：會自動降級為 `Courier New` 等寬字體

## 常見問題

### Q1: 字體沒有顯示，顯示為系統預設字體

**檢查步驟**：

1. 確認 HTML 包含字體變數：
   ```bash
   # 開啟瀏覽器 DevTools > Elements
   # 檢查 <html> 元素的 className
   # 應該包含類似 "font-doto" 的類別
   ```

2. 確認 CSS 變數已定義：
   ```bash
   # DevTools > Elements > Computed > Filter: --font-doto
   # 應該顯示 --font-doto: "Doto", monospace
   ```

3. 確認字體檔案已載入：
   ```bash
   # DevTools > Network > Font
   # 應該看到 Doto 相關的 woff2 檔案
   ```

### Q2: 數字對齊不一致

**解決方案**：

確保使用 `tabular-nums`：

```tsx
{/* ✅ 正確 */}
<span className="font-doto tabular-nums">123</span>

{/* ❌ 錯誤 */}
<span className="font-doto">123</span>
```

### Q3: 響應式大小不正確

**解決方案**：

使用 `.stat-number` 或 `.counter` 類別，它們已內建響應式：

```tsx
{/* ✅ 正確：使用預設響應式類別 */}
<div className="stat-number">999</div>

{/* ❌ 錯誤：固定大小 */}
<div className="font-doto text-3xl">999</div>
```

### Q4: 在 TypeScript 中如何使用字體

**解決方案**：

字體實例已匯出，可直接使用：

```tsx
import { doto } from '@/lib/fonts';

// 在 style 屬性中使用
<div style={{ fontFamily: doto.style.fontFamily }}>
  123
</div>

// 或使用 className
<div className={doto.className}>
  123
</div>
```

## 擴展支援其他數字字體

### 步驟 1：新增字體配置

在 `src/lib/fonts.ts` 新增：

```typescript
import { Orbitron } from 'next/font/google';

export const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});
```

### 步驟 2：更新 Layout

在 `src/app/layout.tsx` 加入變數：

```tsx
<html className={`dark ${doto.variable} ${orbitron.variable}`}>
```

### 步驟 3：更新 Tailwind 配置

在 `tailwind.config.ts` 擴展：

```typescript
fontFamily: {
  doto: ["var(--font-doto)", "monospace"],
  orbitron: ["var(--font-orbitron)", "sans-serif"],
}
```

### 步驟 4：建立 CSS 類別

在 `src/app/globals.css` 新增：

```css
.sci-fi-number {
  @apply font-orbitron text-2xl font-bold tabular-nums;
}
```

## 效能最佳化

### Next.js Font Optimization 優勢

1. **自動子集化**：只載入使用的字元
2. **自主託管**：字體檔案從專案域名載入，無需 Google CDN
3. **零佈局偏移**：使用 `adjustFontFallback` 自動調整備用字體
4. **預載入**：`preload: true` 確保字體優先載入

### 快取策略

Next.js 自動設定：
```
Cache-Control: public, max-age=31536000, immutable
```

字體檔案會永久快取，提升後續載入效能。

## 維護建議

1. **版本控制**：避免隨意更換字體，保持視覺一致性
2. **測試覆蓋**：新增數字顯示時，確保套用 Doto 字體
3. **響應式檢查**：在不同螢幕尺寸測試數字可讀性
4. **效能監控**：定期檢查字體載入時間（< 2 秒）

## 相關檔案

- **字體配置**：`src/lib/fonts.ts`
- **全域樣式**：`src/app/globals.css`
- **Tailwind 配置**：`tailwind.config.ts`
- **Layout**：`src/app/layout.tsx`
- **測試檔案**：`src/lib/__tests__/fonts.test.ts`

## 變更歷史

- **2025-10-01**：初始版本，整合 Doto 字體到所有數字顯示
