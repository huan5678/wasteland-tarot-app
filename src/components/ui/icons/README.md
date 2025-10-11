# PixelIcon 使用指南

## 📖 總覽

PixelIcon 是 Wasteland Tarot 專案的官方圖示系統，使用 [pixelarticons](https://pixelarticons.com/) 套件提供 486 個像素風格圖示，完美契合 Fallout 主題的復古美學。

### 核心特性

- ✅ **486 個像素圖示**：涵蓋所有常用 UI 需求
- ✅ **TypeScript 支援**：完整型別定義與自動完成
- ✅ **無障礙優先**：符合 WCAG 2.1 AA 標準
- ✅ **效能優化**：內建快取機制，支援 SSR
- ✅ **回退機制**：缺失圖示自動顯示 fallback
- ✅ **彈性尺寸**：支援 16px 到 96px 六種尺寸

---

## 🚀 快速開始

### 基本使用

```tsx
import { PixelIcon } from '@/components/ui/icons';

export default function MyComponent() {
  return (
    <div>
      <PixelIcon name="home" size={24} aria-label="首頁" />
    </div>
  );
}
```

### 裝飾性圖示

```tsx
// 裝飾性圖示（不需要 aria-label）
<PixelIcon name="star" size={16} decorative />
```

### 互動式圖示

```tsx
// 按鈕或連結中的圖示必須有 aria-label
<button onClick={handleClick}>
  <PixelIcon name="close" size={24} aria-label="關閉對話框" />
</button>
```

---

## 📚 API 參考

### PixelIconProps

| 屬性 | 型別 | 預設值 | 必填 | 說明 |
|------|------|--------|------|------|
| `name` | `PixelIconName` | - | ✅ | 圖示名稱（完整列表見下方） |
| `size` | `16 \| 24 \| 32 \| 48 \| 72 \| 96` | `24` | ❌ | 圖示尺寸（px） |
| `className` | `string` | - | ❌ | 自訂 CSS 類別 |
| `aria-label` | `string` | - | ❌ | 無障礙標籤（互動式圖示必填） |
| `decorative` | `boolean` | `false` | ❌ | 標記為裝飾性（自動加 `aria-hidden="true"`） |
| `style` | `React.CSSProperties` | - | ❌ | 內聯樣式 |
| `onClick` | `(event: React.MouseEvent) => void` | - | ❌ | 點擊事件處理 |

---

## 🎨 使用範例

### 1. 導航按鈕

```tsx
<nav>
  <Link href="/" className="flex items-center gap-2">
    <PixelIcon name="home" size={24} aria-label="回到首頁" />
    <span>首頁</span>
  </Link>

  <Link href="/dashboard" className="flex items-center gap-2">
    <PixelIcon name="chart-bar" size={24} aria-label="儀表板" />
    <span>儀表板</span>
  </Link>
</nav>
```

### 2. 自訂顏色與樣式

```tsx
// 使用 Tailwind CSS 自訂顏色
<PixelIcon
  name="heart"
  size={32}
  className="text-pip-boy-green hover:text-pip-boy-amber transition-colors"
  aria-label="收藏"
/>

// 使用內聯樣式
<PixelIcon
  name="star"
  size={24}
  style={{ color: '#FFD700', filter: 'drop-shadow(0 0 8px #FFD700)' }}
  decorative
/>
```

### 3. 表單驗證圖示

```tsx
<div className="flex items-center gap-2">
  {error ? (
    <PixelIcon name="alert" size={20} className="text-red-500" aria-label="錯誤" />
  ) : (
    <PixelIcon name="checkmark" size={20} className="text-green-500" aria-label="驗證成功" />
  )}
  <span>{error || '格式正確'}</span>
</div>
```

### 4. 載入中狀態

```tsx
<button disabled={isLoading}>
  {isLoading ? (
    <PixelIcon name="reload" size={20} className="animate-spin" aria-label="載入中" />
  ) : (
    <PixelIcon name="save" size={20} aria-label="儲存" />
  )}
  <span>{isLoading ? '儲存中...' : '儲存'}</span>
</button>
```

### 5. 響應式尺寸

```tsx
// 在不同螢幕尺寸使用不同圖示大小
<PixelIcon
  name="menu"
  size={24}
  className="sm:hidden" // 小螢幕顯示
  aria-label="開啟選單"
/>
<PixelIcon
  name="menu"
  size={32}
  className="hidden sm:block" // 大螢幕顯示
  aria-label="開啟選單"
/>
```

### 6. 互動式清單

```tsx
<ul>
  {items.map(item => (
    <li key={item.id} className="flex items-center justify-between">
      <span>{item.name}</span>
      <div className="flex gap-2">
        <button onClick={() => handleEdit(item.id)}>
          <PixelIcon name="pencil" size={20} aria-label={`編輯 ${item.name}`} />
        </button>
        <button onClick={() => handleDelete(item.id)}>
          <PixelIcon name="trash" size={20} aria-label={`刪除 ${item.name}`} />
        </button>
      </div>
    </li>
  ))}
</ul>
```

---

## 🔍 圖示瀏覽器

前往 **`/test/icon-preview`** 頁面查看所有可用圖示：

- 🔍 **搜尋功能**：按名稱、標籤、描述搜尋
- 🏷️ **分類篩選**：11 種分類（導航、使用者、動作等）
- 📏 **尺寸預覽**：即時切換 24-96px
- 🎨 **顏色預覽**：Pip-Boy Green、Amber、White
- 📋 **一鍵複製**：點擊圖示複製使用程式碼

**開發環境訪問**：`http://localhost:3000/test/icon-preview`

---

## 🎯 最佳實踐

### ✅ 正確做法

```tsx
// 1. 互動式圖示提供有意義的 aria-label
<button onClick={handleClose}>
  <PixelIcon name="close" size={24} aria-label="關閉對話框" />
</button>

// 2. 裝飾性圖示標記為 decorative
<div className="flex items-center gap-2">
  <PixelIcon name="star" size={16} decorative />
  <span>精選內容</span>
</div>

// 3. 使用 className 而非內聯樣式（便於維護）
<PixelIcon name="heart" className="text-pip-boy-green" decorative />

// 4. 使用語義化的圖示名稱
<PixelIcon name="trash" aria-label="刪除項目" />
```

### ❌ 錯誤做法

```tsx
// 1. 互動式圖示缺少 aria-label
<button onClick={handleClose}>
  <PixelIcon name="close" size={24} /> {/* ❌ 螢幕閱讀器無法理解 */}
</button>

// 2. 裝飾性圖示提供 aria-label
<div className="flex items-center gap-2">
  <PixelIcon name="star" size={16} aria-label="星星" /> {/* ❌ 過度標註 */}
  <span>精選內容</span>
</div>

// 3. 硬編碼顏色值
<PixelIcon name="heart" style={{ color: '#00ff00' }} /> {/* ❌ 不符合設計系統 */}

// 4. 使用不存在的圖示名稱
<PixelIcon name="nonexistent" /> {/* ⚠️ 會顯示 fallback 圖示並警告 */}
```

---

## 🌐 無障礙指南

### 1. 互動式圖示（必填 aria-label）

所有在按鈕、連結、表單控制項中的圖示都必須提供 `aria-label`：

```tsx
// ✅ 正確
<button onClick={handleSave}>
  <PixelIcon name="save" size={24} aria-label="儲存變更" />
</button>

<Link href="/settings">
  <PixelIcon name="settings" size={24} aria-label="開啟設定" />
</Link>
```

### 2. 裝飾性圖示（使用 decorative）

與文字並列、僅供視覺裝飾的圖示應標記為 `decorative={true}`：

```tsx
// ✅ 正確
<div className="flex items-center gap-2">
  <PixelIcon name="checkmark" size={20} decorative />
  <span>儲存成功</span> {/* 文字已提供語義 */}
</div>
```

### 3. 鍵盤導航

確保包含圖示的互動元素支援鍵盤操作：

```tsx
<button
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  className="focus:outline-none focus:ring-2 focus:ring-pip-boy-green"
>
  <PixelIcon name="plus" size={24} aria-label="新增項目" />
</button>
```

### 4. 焦點指示器

使用 Tailwind CSS 的 `focus:` 變體確保焦點可見：

```tsx
<button className="p-2 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-pip-boy-green">
  <PixelIcon name="menu" size={24} aria-label="開啟選單" />
</button>
```

---

## ⚡ 效能優化

### 1. 圖示預載（Critical Icons）

專案已在 `src/app/layout.tsx` 中預載 9 個關鍵圖示：

```tsx
// 已預載的圖示（無需額外設定）
- chart-bar, card-stack, book, dice, user
- logout, close, github, external-link
```

### 2. 快取機制

所有圖示 SVG 自動快取，重複使用同一圖示不會重複請求：

```tsx
// 第一次載入會請求 SVG
<PixelIcon name="home" size={24} />

// 之後的相同圖示直接從快取讀取
<PixelIcon name="home" size={32} /> // ✅ 使用快取
```

### 3. Bundle 大小

- **iconMapping.ts**: 3.2KB (gzipped)
- **總圖示系統**: < 10KB (gzipped)
- **單個 SVG**: 平均 200-400 bytes

### 4. SSR 支援

PixelIcon 完整支援 Server-Side Rendering，可在 Server Components 中使用：

```tsx
// ✅ 在 Server Component 中正常運作
export default async function Page() {
  return (
    <div>
      <PixelIcon name="home" size={24} decorative />
      <h1>歡迎</h1>
    </div>
  );
}
```

---

## 🗺️ 常用圖示速查

### 導航 (Navigation)

```tsx
<PixelIcon name="home" />          // 首頁
<PixelIcon name="menu" />          // 選單
<PixelIcon name="chevron-left" />  // 左箭頭
<PixelIcon name="chevron-right" /> // 右箭頭
<PixelIcon name="chevron-down" />  // 下箭頭
<PixelIcon name="chevron-up" />    // 上箭頭
<PixelIcon name="arrow-left" />    // 返回
<PixelIcon name="external-link" /> // 外部連結
```

### 使用者 (User)

```tsx
<PixelIcon name="user" />          // 用戶
<PixelIcon name="user-plus" />     // 註冊
<PixelIcon name="users" />         // 多位用戶
<PixelIcon name="shield" />        // 安全/認證
<PixelIcon name="logout" />        // 登出
```

### 動作 (Actions)

```tsx
<PixelIcon name="plus" />          // 新增
<PixelIcon name="pencil" />        // 編輯
<PixelIcon name="trash" />         // 刪除
<PixelIcon name="save" />          // 儲存
<PixelIcon name="close" />         // 關閉
<PixelIcon name="checkmark" />     // 確認
<PixelIcon name="search" />        // 搜尋
<PixelIcon name="filter" />        // 篩選
<PixelIcon name="settings" />      // 設定
<PixelIcon name="reload" />        // 重新載入
```

### 狀態 (Status)

```tsx
<PixelIcon name="alert" />         // 警告
<PixelIcon name="info" />          // 資訊
<PixelIcon name="check-circle" />  // 成功
<PixelIcon name="mood-happy" />    // 成功（笑臉）
<PixelIcon name="mood-sad" />      // 錯誤（哭臉）
```

### 媒體 (Media)

```tsx
<PixelIcon name="play" />          // 播放
<PixelIcon name="pause" />         // 暫停
<PixelIcon name="skip-forward" />  // 下一首
<PixelIcon name="skip-back" />     // 上一首
<PixelIcon name="volume" />        // 音量
<PixelIcon name="music" />         // 音樂
<PixelIcon name="image" />         // 圖片
```

### 內容 (Content)

```tsx
<PixelIcon name="book" />          // 書籍/文件
<PixelIcon name="card-stack" />    // 卡牌堆疊
<PixelIcon name="message" />       // 訊息
<PixelIcon name="tag" />           // 標籤
<PixelIcon name="calendar" />      // 日曆
<PixelIcon name="star" />          // 星星/收藏
<PixelIcon name="heart" />         // 愛心/喜歡
```

### 社群 (Social)

```tsx
<PixelIcon name="github" />        // GitHub
<PixelIcon name="external-link" /> // Twitter (替代)
<PixelIcon name="message" />       // Discord (替代)
<PixelIcon name="share" />         // 分享
```

---

## 🔧 進階使用

### 1. 自訂 SVG 內容樣式

```tsx
<PixelIcon
  name="heart"
  size={32}
  className="[&_svg]:fill-current [&_svg]:stroke-current"
  style={{ color: '#FF0000' }}
/>
```

### 2. 動畫效果

```tsx
// 旋轉動畫
<PixelIcon name="reload" className="animate-spin" decorative />

// 脈衝動畫
<PixelIcon name="alert" className="animate-pulse" aria-label="警告" />

// 自訂過渡效果
<PixelIcon
  name="heart"
  className="transition-all duration-300 hover:scale-110"
  decorative
/>
```

### 3. 條件渲染

```tsx
const getStatusIcon = (status: 'success' | 'error' | 'loading') => {
  const iconMap = {
    success: { name: 'check-circle', color: 'text-green-500' },
    error: { name: 'alert', color: 'text-red-500' },
    loading: { name: 'reload', color: 'text-gray-500' },
  } as const;

  const { name, color } = iconMap[status];

  return (
    <PixelIcon
      name={name as PixelIconName}
      size={24}
      className={color}
      aria-label={status}
    />
  );
};
```

### 4. Icon Grid 佈局

```tsx
<div className="grid grid-cols-4 gap-4">
  {iconNames.map(name => (
    <div key={name} className="flex flex-col items-center">
      <PixelIcon name={name} size={32} decorative />
      <span className="text-xs mt-2">{name}</span>
    </div>
  ))}
</div>
```

---

## 🐛 疑難排解

### 問題 1：圖示沒有顯示

**原因**：圖示名稱拼寫錯誤或不存在

**解決方法**：
1. 檢查 TypeScript 自動完成建議
2. 訪問 `/test/icon-preview` 確認圖示名稱
3. 查看 console 是否有警告訊息

```tsx
// ❌ 錯誤
<PixelIcon name="hoem" size={24} /> // 拼寫錯誤

// ✅ 正確
<PixelIcon name="home" size={24} />
```

### 問題 2：圖示顏色無法改變

**原因**：SVG 內部可能使用 `fill` 屬性

**解決方法**：使用 `className` 和 `text-*` 類別

```tsx
// ❌ 無效
<PixelIcon name="heart" color="red" /> // 無 color prop

// ✅ 有效
<PixelIcon name="heart" className="text-red-500" />
```

### 問題 3：圖示載入閃爍

**原因**：圖示未預載，首次載入需要時間

**解決方法**：在 `layout.tsx` 中新增預載連結

```tsx
// src/app/layout.tsx
<link rel="preload" href="/icons/pixelarticons/your-icon.svg" as="image" type="image/svg+xml" />
```

### 問題 4：TypeScript 報錯 "Type not assignable"

**原因**：使用的圖示名稱不在 `PixelIconName` 型別中

**解決方法**：
1. 確認圖示確實存在於 pixelarticons
2. 更新 `src/types/icons.ts` 新增該圖示名稱
3. 更新 `src/components/ui/icons/iconMapping.ts`

---

## 📦 圖示映射表

如果需要將舊的 lucide-react 圖示遷移到 PixelIcon，請參考 `src/components/ui/icons/iconMapping.ts` 中的 `ICON_MAPPING` 對照表。

### 常見映射範例

| lucide-react | pixelarticons | 說明 |
|--------------|---------------|------|
| `Home` | `home` | 首頁 |
| `Menu` | `menu` | 選單 |
| `X` | `close` | 關閉 |
| `ChevronLeft` | `chevron-left` | 左箭頭 |
| `User` | `user` | 用戶 |
| `Settings` | `settings` | 設定 |
| `AlertTriangle` | `alert` | 警告 |
| `Check` | `checkmark` | 勾選 |
| `Trash2` | `trash` | 刪除 |
| `Pencil` | `pencil` | 編輯 |

---

## 📄 相關文件

- **[pixelarticons 官方網站](https://pixelarticons.com/)** - 完整圖示列表
- **[WCAG 2.1 AA 標準](https://www.w3.org/WAI/WCAG21/quickref/)** - 無障礙指南
- **[專案設計文件](.kiro/specs/pixel-icon-replacement/design.md)** - 技術設計詳情
- **[遷移指南](./MIGRATION.md)** - 從 lucide-react 遷移

---

## 🆘 需要協助？

1. **圖示瀏覽器**：訪問 `/test/icon-preview` 查看所有可用圖示
2. **TypeScript 自動完成**：輸入 `<PixelIcon name="` 會顯示所有選項
3. **Console 警告**：開發模式會顯示缺失圖示的警告訊息
4. **測試頁面**：在 `/test/icon-preview` 測試圖示渲染效果

---

**文件版本**：1.0
**最後更新**：2025-10-11
**維護者**：Wasteland Tarot 開發團隊
