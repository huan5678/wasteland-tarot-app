# Cubic 11 字體使用方式

## 字體說明
- **字體名稱**: Cubic 11 (11×11 像素點陣字體)
- **檔案位置**: `/public/fonts/Cubic_11.woff2` (400KB)
- **授權**: SIL Open Font License 1.1
- **來源**: [ACh-K/Cubic-11](https://github.com/ACh-K/Cubic-11)

## 字元支援
- **繁體中文**: 常用國字標準字體 4808 字、Big5 第一字面 5401 字、IICore Taiwan
- **簡體中文**: 通用规范汉字表一级、GB 2312 Level-1
- **注音符號**: 完整支援 Bopomofo/Zhuyin
- **拉丁字母**: A-Z, a-z, 0-9, 標點符號

## 使用方式

### ✅ 推薦做法（自動繼承）

```tsx
// 無需手動指定字體，所有元件自動繼承 Cubic 11
<div className="text-pip-boy-green">
  這段文字會自動使用 Cubic 11 字體
</div>

<h1 className="text-4xl font-bold">
  標題也會自動使用 Cubic 11
</h1>

<button className="px-4 py-2 bg-pip-boy-green">
  按鈕文字也是 Cubic 11
</button>
```

### ❌ 錯誤做法（不要硬編碼字體）

```tsx
// ❌ 不要這樣做！會覆蓋全域字體設定
<div className="font-mono text-pip-boy-green">
  這會覆蓋 Cubic 11 字體
</div>

// ❌ 不要在 CSS 中硬編碼字體
.my-custom-class {
  font-family: 'Cubic 11'; /* 不要這樣做 */
}

// ✅ 應該使用繼承
.my-custom-class {
  font-family: inherit; /* 正確做法 */
}
```

## 整合策略

### 全域應用
字體透過 `src/app/layout.tsx` 的 body 元素全域套用：

```tsx
<body className={cn("font-cubic", "text-pip-boy-green", "antialiased")}>
  {children}
</body>
```

### 自動繼承
所有子元件透過 CSS 繼承機制自動使用 Cubic 11：

```
layout.tsx (body.font-cubic)
    ↓ 自動繼承
    ├─ Header
    ├─ Main Content
    │   ├─ All Pages
    │   └─ All Components
    └─ Footer
```

### CSS 變數
如需在自訂樣式中使用字體，請使用 CSS 變數：

```css
/* ✅ 推薦：使用 inherit */
.my-class {
  font-family: inherit;
}

/* ✅ 或使用 CSS 變數 */
.my-class {
  font-family: var(--font-cubic);
}

/* ❌ 不要硬編碼 */
.my-class {
  font-family: 'Cubic 11'; /* 不要這樣 */
}
```

## 技術細節

### @font-face 宣告
定義於 `src/app/globals.css` 頂部

### Tailwind 變數
`--font-cubic` 定義於 `@theme` 區塊，自動生成 `.font-cubic` utility class

### 效能優化
- `font-display: swap` - 避免 FOIT (Flash of Invisible Text)
- 長期快取 - Cache-Control: public, max-age=31536000, immutable

### 降級機制
字體堆疊: 'Cubic 11', ui-monospace, 'SFMono-Regular', 'SF Mono', Consolas, Monaco, monospace

## 開發監控

開發環境會在 Console 顯示字體載入資訊：
- ✅ 載入成功狀態
- ⏱️ 載入時間
- ⚠️ 載入失敗警告

## 參考文件
- 詳細設計: `.kiro/specs/cubic-11-font-integration/design.md`
- 實作計畫: `.kiro/specs/cubic-11-font-integration/tasks.md`
- 專案文件: `CLAUDE.md` - Font Integration 章節

## 常見問題

### Q: 如何切換回舊字體？
A: 在 `src/app/layout.tsx` 的 body 元素移除 `font-cubic` className

### Q: 某個元件沒有套用 Cubic 11？
A: 檢查該元件或其父元件是否有硬編碼 `font-mono` 或 `font-sans` className

### Q: 自訂 CSS 類別如何使用字體？
A: 使用 `font-family: inherit` 或 `font-family: var(--font-cubic)`

### Q: 字體檔案在哪裡？
A: `/public/fonts/Cubic_11.woff2` (400KB)

### Q: 如何在新元件中使用字體？
A: 什麼都不用做！字體會自動繼承。只要不要添加 `font-mono` 或 `font-sans` 等硬編碼字體 className 即可。
