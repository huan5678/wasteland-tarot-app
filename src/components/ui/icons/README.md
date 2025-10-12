# PixelIcon 圖示系統

**使用 RemixIcon CSS 的統一圖示元件**

## 📦 版本資訊

- **Version**: 4.0
- **Icon Library**: RemixIcon 4.7.0 (2800+ icons)
- **實作方式**: CSS class name (`ri-{name}-{style}`)
- **Phase 6**: 完整支援動畫、顏色變體、尺寸預設

## 🚀 快速開始

### 基本使用

```tsx
import { PixelIcon } from '@/components/ui/icons'

// 基本圖示（預設 line 風格）
<PixelIcon name="home" />

// Fill 風格（實心）
<PixelIcon name="home" remixVariant="fill" />

// 自訂尺寸
<PixelIcon name="user" size={32} />

// 使用尺寸預設
<PixelIcon name="settings" sizePreset="lg" />
```

### 從 RemixIcon 網站複製名稱

1. 訪問 [remixicon.com](https://remixicon.com/)
2. 搜尋並找到想要的圖示
3. 複製圖示名稱（例如 "home-line"）
4. 去掉 `-line` 或 `-fill` 後綴
5. 直接使用：

```tsx
// 網站顯示: home-line
<PixelIcon name="home" />

// 網站顯示: user-fill
<PixelIcon name="user" remixVariant="fill" />

// 網站顯示: loader-4-line
<PixelIcon name="loader-4" />
```

## 🎨 Phase 6 功能

### 動畫效果

```tsx
// 旋轉動畫（適合載入）
<PixelIcon name="loader-4" animation="spin" />

// 彈跳動畫（適合通知）
<PixelIcon name="notification" animation="bounce" />

// 搖晃動畫（適合錯誤）
<PixelIcon name="error-warning" animation="wiggle" />

// 脈衝動畫（適合提示）
<PixelIcon name="heart" animation="pulse" />
```

**可用動畫**:
- `spin` - 旋轉（載入、同步）
- `bounce` - 彈跳（提示、警告）
- `pulse` - 脈衝（載入、通知）
- `ping` - Ping（通知點）
- `fade` - 淡入淡出（切換）
- `wiggle` - 搖晃（錯誤、警告）
- `float` - 懸浮（提示）

### 顏色變體

```tsx
// 成功狀態
<PixelIcon name="checkbox-circle" variant="success" />

// 錯誤狀態
<PixelIcon name="error-warning" variant="error" />

// 警告狀態
<PixelIcon name="alarm-warning" variant="warning" />

// 資訊提示
<PixelIcon name="information" variant="info" />

// 主要色
<PixelIcon name="home" variant="primary" />
```

**可用變體**:
- `default` - 繼承當前顏色
- `primary` - Pip-Boy Green (#00ff88)
- `secondary` - Radiation Orange (#ff8800)
- `success` - Bright Green (#00ff41)
- `warning` - Warning Yellow (#ffdd00)
- `error` - Deep Red (#ef4444)
- `info` - Vault Blue (#0055aa)
- `muted` - Gray (#6b7280)

### 尺寸預設

```tsx
<PixelIcon name="home" sizePreset="xs" />   // 16px
<PixelIcon name="home" sizePreset="sm" />   // 24px
<PixelIcon name="home" sizePreset="md" />   // 32px
<PixelIcon name="home" sizePreset="lg" />   // 48px
<PixelIcon name="home" sizePreset="xl" />   // 72px
<PixelIcon name="home" sizePreset="xxl" />  // 96px
```

## 🎯 實際使用範例

### 載入動畫

```tsx
<PixelIcon
  name="loader-4"
  animation="spin"
  variant="primary"
  sizePreset="lg"
  decorative
/>
```

### 錯誤訊息

```tsx
<div className="flex items-center gap-2">
  <PixelIcon
    name="error-warning"
    variant="error"
    animation="wiggle"
    sizePreset="sm"
    decorative
  />
  <span>發生錯誤</span>
</div>
```

### 互動式按鈕

```tsx
<button onClick={handleDelete}>
  <PixelIcon
    name="delete-bin"
    variant="error"
    sizePreset="md"
    aria-label="刪除項目"
  />
</button>
```

### 狀態指示器

```tsx
<PixelIcon
  name={isPlaying ? "pause" : "play"}
  variant="primary"
  sizePreset="sm"
  aria-label={isPlaying ? "暫停" : "播放"}
/>
```

## ♿ 無障礙性

### 互動式圖示

必須提供 `aria-label`：

```tsx
<PixelIcon
  name="trash"
  onClick={handleDelete}
  aria-label="刪除項目"
/>
```

### 裝飾性圖示

使用 `decorative` prop：

```tsx
<div className="flex items-center gap-2">
  <PixelIcon name="star" decorative />
  <span>重要訊息</span>
</div>
```

## 📋 API 參考

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | *required* | RemixIcon 圖示名稱 |
| `remixVariant` | `'line' \| 'fill'` | `'line'` | 圖示風格 |
| `size` | `number` | `24` | 圖示尺寸（像素） |
| `sizePreset` | `IconSizePreset` | - | 語意化尺寸名稱 |
| `animation` | `IconAnimation` | - | 動畫效果 |
| `variant` | `IconColorVariant` | `'default'` | 顏色變體 |
| `className` | `string` | - | 自訂 CSS 類別 |
| `aria-label` | `string` | - | 無障礙標籤 |
| `decorative` | `boolean` | `false` | 是否為裝飾性圖示 |
| `style` | `CSSProperties` | - | 內聯樣式 |
| `onClick` | `function` | - | 點擊事件 |

## 🔧 技術細節

### CSS Class Name 規則

```tsx
<PixelIcon name="home" />
// 生成: <i class="ri-home-line" />

<PixelIcon name="home" remixVariant="fill" />
// 生成: <i class="ri-home-fill" />
```

### 優點

✅ **簡單直觀**: 直接從 RemixIcon 網站複製名稱使用
✅ **效能優異**: 純 CSS icon font，無需動態 import
✅ **輕量級**: 不增加 JavaScript bundle 大小
✅ **2800+ 圖示**: RemixIcon 完整圖示庫
✅ **完整功能**: Phase 6 動畫、變體、預設尺寸全支援

### 相容性

- ✅ 支援所有現代瀏覽器
- ✅ 自動支援 `prefers-reduced-motion`
- ✅ 完整的 ARIA 無障礙支援
- ✅ SSR/SSG 完全相容

## 📚 更多資源

- [RemixIcon 官網](https://remixicon.com/) - 瀏覽所有圖示
- [RemixIcon GitHub](https://github.com/Remix-Design/RemixIcon) - 原始碼
- [測試頁面](/test-icons) - 本地測試所有功能

## 🔄 遷移指南

從舊版本遷移無需修改任何程式碼：

```tsx
// ✅ 原有程式碼繼續運作
<PixelIcon name="home" size={32} />

// ✅ 只需確保圖示名稱符合 RemixIcon
// 如果需要，更新圖示名稱即可
```

## 📝 常見問題

### Q: 如何找到圖示名稱？

訪問 [remixicon.com](https://remixicon.com/)，搜尋並複製圖示名稱（去掉 -line/-fill 後綴）。

### Q: 如何更改圖示顏色？

使用 `className` 或 `variant` prop：

```tsx
<PixelIcon name="home" className="text-blue-500" />
<PixelIcon name="home" variant="primary" />
```

### Q: 為什麼圖示不顯示？

1. 確認圖示名稱正確（訪問 remixicon.com 確認）
2. 檢查是否正確引入 CSS（layout.tsx 應該有 `import "remixicon/fonts/remixicon.css"`）
3. 檢查瀏覽器 console 是否有錯誤

### Q: 如何停用動畫？

使用者系統設定 `prefers-reduced-motion` 時會自動停用。或者不傳入 `animation` prop。

---

**最後更新**: 2025-10-12
**版本**: 4.0
**維護者**: Wasteland Tarot Team
