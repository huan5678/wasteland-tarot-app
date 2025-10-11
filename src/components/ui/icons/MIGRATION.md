# 從 lucide-react 遷移到 PixelIcon

本指南協助你將現有的 `lucide-react` 圖示遷移到 Wasteland Tarot 的 PixelIcon 系統。

---

## 📋 目錄

1. [為什麼要遷移？](#為什麼要遷移)
2. [遷移前準備](#遷移前準備)
3. [基本遷移步驟](#基本遷移步驟)
4. [圖示映射表](#圖示映射表)
5. [常見模式轉換](#常見模式轉換)
6. [無障礙改進](#無障礙改進)
7. [效能考量](#效能考量)
8. [故障排除](#故障排除)

---

## 為什麼要遷移？

### 視覺一致性
- ✅ 統一的像素風格與 Fallout 主題完美融合
- ✅ 與 Cubic 11 字體和 Pip-Boy 介面協調
- ✅ 強化品牌識別度

### 技術優勢
- ✅ 更小的 bundle 大小（3.2KB vs lucide-react 的 ~50KB）
- ✅ 完整 TypeScript 支援與自動完成
- ✅ 內建快取機制提升效能
- ✅ 更好的 SSR 支援

---

## 遷移前準備

### 1. 檢查現有圖示使用情況

使用以下指令找出所有 lucide-react 圖示：

```bash
# 搜尋所有從 lucide-react 匯入的檔案
grep -r "from 'lucide-react'" src/

# 或使用 ripgrep（更快）
rg "from 'lucide-react'" src/
```

### 2. 建立圖示清單

建立一個清單記錄專案中使用的所有圖示：

```bash
# 提取所有匯入的圖示名稱
grep -rh "import.*from 'lucide-react'" src/ | sort | uniq
```

### 3. 檢查圖示可用性

前往 `/test/icon-preview` 頁面確認所有需要的圖示在 pixelarticons 中都有對應版本。

---

## 基本遷移步驟

### Step 1: 更新 Import 語句

**之前 (lucide-react)**
```tsx
import { Home, Menu, User, Settings } from 'lucide-react';
```

**之後 (PixelIcon)**
```tsx
import { PixelIcon } from '@/components/ui/icons';
```

### Step 2: 替換圖示元件

**之前 (lucide-react)**
```tsx
<Home className="w-6 h-6 text-pip-boy-green" />
```

**之後 (PixelIcon)**
```tsx
<PixelIcon name="home" size={24} className="text-pip-boy-green" />
```

### Step 3: 尺寸對照表

| lucide-react | 實際尺寸 | PixelIcon size |
|--------------|----------|----------------|
| `w-4 h-4` | 16px | `size={16}` |
| `w-5 h-5` | 20px | `size={24}` |
| `w-6 h-6` | 24px | `size={24}` |
| `w-8 h-8` | 32px | `size={32}` |
| `w-12 h-12` | 48px | `size={48}` |
| `w-16 h-16` | 64px | `size={72}` |

### Step 4: 新增無障礙屬性

**互動式圖示**
```tsx
// 之前
<button onClick={handleClose}>
  <X className="w-6 h-6" />
</button>

// 之後
<button onClick={handleClose}>
  <PixelIcon name="close" size={24} aria-label="關閉對話框" />
</button>
```

**裝飾性圖示**
```tsx
// 之前
<div className="flex items-center gap-2">
  <Star className="w-5 h-5" />
  <span>精選內容</span>
</div>

// 之後
<div className="flex items-center gap-2">
  <PixelIcon name="star" size={24} decorative />
  <span>精選內容</span>
</div>
```

---

## 圖示映射表

### 導航圖示

| lucide-react | PixelIcon | 說明 |
|--------------|-----------|------|
| `Home` | `home` | 首頁 |
| `Menu` | `menu` | 選單 |
| `X` | `close` | 關閉 |
| `ChevronLeft` | `chevron-left` | 左箭頭 |
| `ChevronRight` | `chevron-right` | 右箭頭 |
| `ChevronDown` | `chevron-down` | 下箭頭 |
| `ChevronUp` | `chevron-up` | 上箭頭 |
| `ArrowLeft` | `arrow-left` | 返回 |
| `ExternalLink` | `external-link` | 外部連結 |

### 使用者圖示

| lucide-react | PixelIcon | 說明 |
|--------------|-----------|------|
| `User` | `user` | 用戶 |
| `UserPlus` | `user-plus` | 註冊 |
| `Users` | `users` | 多位用戶 |
| `UserCircle` | `user` | 用戶圓圈（使用 user） |
| `Fingerprint` | `shield` | 指紋（替代：盾牌） |
| `LogOut` | `logout` | 登出 |

### 動作圖示

| lucide-react | PixelIcon | 說明 |
|--------------|-----------|------|
| `Plus` | `plus` | 新增 |
| `Pencil` | `pencil` | 編輯 |
| `Trash2` | `trash` | 刪除 |
| `Save` | `save` | 儲存 |
| `X` | `close` | 關閉 |
| `Check` | `checkmark` | 確認 |
| `Search` | `search` | 搜尋 |
| `Filter` | `filter` | 篩選 |
| `Settings` | `settings` | 設定 |
| `RotateCw` | `reload` | 重新載入 |
| `RefreshCw` | `reload` | 刷新 |
| `Download` | `download` | 下載 |
| `Upload` | `upload` | 上傳 |
| `Copy` | `copy` | 複製 |
| `Share2` | `share` | 分享 |

### 狀態圖示

| lucide-react | PixelIcon | 說明 |
|--------------|-----------|------|
| `AlertTriangle` | `alert` | 警告 |
| `Info` | `info` | 資訊 |
| `CheckCircle` | `check-circle` | 成功 |
| `XCircle` | `close-circle` | 錯誤 |
| `Smile` | `mood-happy` | 成功（笑臉） |
| `Frown` | `mood-sad` | 錯誤（哭臉） |
| `AlertCircle` | `alert` | 注意 |

### 媒體圖示

| lucide-react | PixelIcon | 說明 |
|--------------|-----------|------|
| `Play` | `play` | 播放 |
| `Pause` | `pause` | 暫停 |
| `SkipForward` | `skip-forward` | 下一首 |
| `SkipBack` | `skip-back` | 上一首 |
| `Volume2` | `volume` | 音量 |
| `VolumeX` | `volume-mute` | 靜音 |
| `Music` | `music` | 音樂 |
| `Music2` | `music-2` | 音樂（替代） |
| `Image` | `image` | 圖片 |
| `Headphones` | `headphones` | 耳機 |

### 內容圖示

| lucide-react | PixelIcon | 說明 |
|--------------|-----------|------|
| `Book` | `book` | 書籍 |
| `BookOpen` | `book-open` | 打開的書 |
| `Library` | `book` | 圖書館（使用 book） |
| `Layers` | `card-stack` | 圖層（替代：卡牌堆疊） |
| `MessageSquare` | `message` | 訊息 |
| `Tag` | `tag` | 標籤 |
| `Calendar` | `calendar` | 日曆 |
| `Star` | `star` | 星星 |
| `Heart` | `heart` | 愛心 |
| `Bookmark` | `bookmark` | 書籤 |
| `Archive` | `archive` | 封存 |
| `ScrollText` | `scroll-text` | 卷軸 |

### 符號與裝飾

| lucide-react | PixelIcon | 說明 |
|--------------|-----------|------|
| `Spade` | `card-stack` | 黑桃（替代：卡牌） |
| `Dices` | `dice` | 骰子 |
| `BarChart3` | `chart-bar` | 長條圖 |
| `Hash` | `hash` | 井號 |
| `Palette` | `palette` | 調色盤 |
| `Target` | `target` | 目標 |
| `Crosshair` | `target` | 準星（替代：目標） |

### 社群圖示

| lucide-react | PixelIcon | 說明 |
|--------------|-----------|------|
| `Github` | `github` | GitHub |
| `Twitter` | `external-link` | Twitter（替代：外部連結） |
| `Discord` | `message` | Discord（替代：訊息） |
| `Mail` | `mail` | 郵件 |
| `Link` | `link` | 連結 |

---

## 常見模式轉換

### 1. 按鈕圖示

**之前**
```tsx
<button className="flex items-center gap-2">
  <Plus className="w-5 h-5" />
  <span>新增項目</span>
</button>
```

**之後**
```tsx
<button className="flex items-center gap-2">
  <PixelIcon name="plus" size={24} aria-label="新增項目" />
  <span>新增項目</span>
</button>
```

### 2. 導航連結

**之前**
```tsx
<Link href="/dashboard" className="flex items-center gap-2">
  <Home className="w-6 h-6 text-pip-boy-green" />
  <span>首頁</span>
</Link>
```

**之後**
```tsx
<Link href="/dashboard" className="flex items-center gap-2">
  <PixelIcon name="home" size={24} className="text-pip-boy-green" aria-label="首頁" />
  <span>首頁</span>
</Link>
```

### 3. 表單驗證

**之前**
```tsx
{error && (
  <div className="flex items-center gap-2 text-red-500">
    <AlertTriangle className="w-5 h-5" />
    <span>{error}</span>
  </div>
)}
```

**之後**
```tsx
{error && (
  <div className="flex items-center gap-2 text-red-500">
    <PixelIcon name="alert" size={24} decorative />
    <span>{error}</span>
  </div>
)}
```

### 4. 下拉選單

**之前**
```tsx
<button className="flex items-center justify-between">
  <span>選擇選項</span>
  <ChevronDown className="w-4 h-4" />
</button>
```

**之後**
```tsx
<button className="flex items-center justify-between">
  <span>選擇選項</span>
  <PixelIcon name="chevron-down" size={16} decorative />
</button>
```

### 5. 載入狀態

**之前**
```tsx
{isLoading ? (
  <RotateCw className="w-6 h-6 animate-spin" />
) : (
  <Save className="w-6 h-6" />
)}
```

**之後**
```tsx
{isLoading ? (
  <PixelIcon name="reload" size={24} className="animate-spin" aria-label="載入中" />
) : (
  <PixelIcon name="save" size={24} aria-label="儲存" />
)}
```

### 6. 音樂播放器控制項

**之前**
```tsx
<button onClick={togglePlay}>
  {isPlaying ? (
    <Pause className="w-8 h-8" />
  ) : (
    <Play className="w-8 h-8" />
  )}
</button>
```

**之後**
```tsx
<button onClick={togglePlay}>
  {isPlaying ? (
    <PixelIcon name="pause" size={32} aria-label="暫停" />
  ) : (
    <PixelIcon name="play" size={32} aria-label="播放" />
  )}
</button>
```

### 7. 社群連結

**之前**
```tsx
<a href="https://github.com/..." target="_blank">
  <Github className="w-6 h-6" />
</a>
```

**之後**
```tsx
<a href="https://github.com/..." target="_blank">
  <PixelIcon name="github" size={24} aria-label="訪問 GitHub" />
</a>
```

### 8. 關閉按鈕

**之前**
```tsx
<DialogPrimitive.Close className="absolute right-4 top-4">
  <X className="h-4 w-4" />
  <span className="sr-only">Close</span>
</DialogPrimitive.Close>
```

**之後**
```tsx
<DialogPrimitive.Close className="absolute right-4 top-4">
  <PixelIcon name="close" size={16} aria-label="關閉對話框" />
</DialogPrimitive.Close>
```

---

## 無障礙改進

### WCAG 2.1 AA 標準遵循

#### 1. 互動式圖示必須有 aria-label

**❌ 不良實踐**
```tsx
<button onClick={handleDelete}>
  <Trash2 className="w-5 h-5" />
</button>
```

**✅ 良好實踐**
```tsx
<button onClick={handleDelete}>
  <PixelIcon name="trash" size={24} aria-label="刪除項目" />
</button>
```

#### 2. 裝飾性圖示應標記為 decorative

**❌ 不良實踐**
```tsx
<div className="flex items-center gap-2">
  <Star className="w-5 h-5" aria-label="星星" /> {/* 過度標註 */}
  <span>精選內容</span>
</div>
```

**✅ 良好實踐**
```tsx
<div className="flex items-center gap-2">
  <PixelIcon name="star" size={24} decorative />
  <span>精選內容</span>
</div>
```

#### 3. 提供有意義的標籤

**❌ 不良實踐**
```tsx
<button onClick={handleEdit}>
  <PixelIcon name="pencil" size={20} aria-label="鉛筆" /> {/* 太字面 */}
</button>
```

**✅ 良好實踐**
```tsx
<button onClick={handleEdit}>
  <PixelIcon name="pencil" size={20} aria-label="編輯文章" /> {/* 有上下文 */}
</button>
```

---

## 效能考量

### 1. 預載關鍵圖示

已在 `src/app/layout.tsx` 預載的圖示：
- `chart-bar`, `card-stack`, `book`, `dice`, `user`
- `logout`, `close`, `github`, `external-link`

**如需新增預載**
```tsx
// src/app/layout.tsx
<link rel="preload" href="/icons/pixelarticons/your-icon.svg" as="image" type="image/svg+xml" />
```

### 2. 快取機制

圖示自動快取，無需額外設定：

```tsx
// 第一次載入
<PixelIcon name="home" size={24} /> // 請求 SVG

// 之後重複使用
<PixelIcon name="home" size={32} /> // 從快取讀取 ✅
<PixelIcon name="home" size={48} /> // 從快取讀取 ✅
```

### 3. Bundle 大小比較

| 套件 | 大小 (gzipped) |
|------|----------------|
| lucide-react | ~50KB |
| PixelIcon 系統 | ~10KB |
| iconMapping.ts | 3.2KB |
| **節省** | **~40KB** ✅ |

---

## 故障排除

### 問題 1: 找不到對應的圖示

**症狀**：某個 lucide-react 圖示在 pixelarticons 中沒有對應版本

**解決方法**：
1. 訪問 `/test/icon-preview` 搜尋相似圖示
2. 查看 `src/components/ui/icons/iconMapping.ts` 的替代映射
3. 使用語義相近的圖示（如 Twitter → external-link）

### 問題 2: 圖示尺寸不正確

**症狀**：遷移後圖示看起來太大或太小

**解決方法**：檢查尺寸對照表

```tsx
// lucide-react
<Icon className="w-6 h-6" /> // 24px

// PixelIcon
<PixelIcon name="icon-name" size={24} /> // 對應 24px
```

### 問題 3: 顏色沒有套用

**症狀**：`className="text-pip-boy-green"` 沒有效果

**解決方法**：確保使用 `text-*` 而非 `color-*`

```tsx
// ❌ 無效
<PixelIcon name="heart" className="color-red-500" />

// ✅ 有效
<PixelIcon name="heart" className="text-red-500" />
```

### 問題 4: TypeScript 錯誤

**症狀**：`Type '"icon-name"' is not assignable to type 'PixelIconName'`

**解決方法**：
1. 檢查拼寫（TypeScript 會自動完成正確名稱）
2. 確認圖示存在於 `/test/icon-preview`
3. 若確實需要新圖示，更新 `src/types/icons.ts`

### 問題 5: 無障礙測試失敗

**症狀**：axe-core 報告缺少 aria-label

**解決方法**：
- 互動式圖示：新增 `aria-label="描述性文字"`
- 裝飾性圖示：新增 `decorative` prop

```tsx
// 互動式
<button onClick={handler}>
  <PixelIcon name="close" size={24} aria-label="關閉視窗" />
</button>

// 裝飾性
<div className="flex items-center gap-2">
  <PixelIcon name="star" size={20} decorative />
  <span>精選</span>
</div>
```

---

## 批次遷移腳本

### 自動替換 Import 語句

```bash
# 將所有 lucide-react import 替換為 PixelIcon
find src -name "*.tsx" -type f -exec sed -i '' \
  's/import { .* } from "lucide-react"/import { PixelIcon } from "@\/components\/ui\/icons"/' {} +
```

### 檢查遷移進度

```bash
# 檢查還有多少檔案使用 lucide-react
grep -r "from 'lucide-react'" src/ | wc -l

# 列出所有未遷移的檔案
grep -rl "from 'lucide-react'" src/
```

---

## 遷移檢查清單

### 開始前
- [ ] 建立完整的圖示使用清單
- [ ] 確認所有圖示在 pixelarticons 中都有對應版本
- [ ] 在 `/test/icon-preview` 預覽所有需要的圖示

### 程式碼遷移
- [ ] 更新所有 import 語句
- [ ] 替換所有圖示元件為 `<PixelIcon>`
- [ ] 轉換尺寸（`w-* h-*` → `size` prop）
- [ ] 轉換顏色類別（確保使用 `text-*`）

### 無障礙改進
- [ ] 為所有互動式圖示新增 `aria-label`
- [ ] 為所有裝飾性圖示新增 `decorative` prop
- [ ] 移除冗餘的 `<span className="sr-only">` 標籤

### 測試
- [ ] 視覺檢查：所有頁面圖示正確顯示
- [ ] 無障礙測試：通過 axe-core 檢測
- [ ] 效能測試：Lighthouse 分數沒有下降
- [ ] 功能測試：所有互動功能正常運作

### 清理
- [ ] 移除所有未使用的 lucide-react import
- [ ] 執行 `bun remove lucide-react`
- [ ] 更新文件和註解

---

## 完整遷移範例

### 遷移前：Header.tsx

```tsx
import { Menu, Home, User, Settings, LogOut } from 'lucide-react';

export function Header() {
  return (
    <header>
      <button>
        <Menu className="w-6 h-6" />
      </button>
      <nav>
        <Link href="/">
          <Home className="w-5 h-5 text-pip-boy-green" />
          <span>首頁</span>
        </Link>
        <Link href="/dashboard">
          <User className="w-5 h-5" />
          <span>個人資料</span>
        </Link>
        <Link href="/settings">
          <Settings className="w-5 h-5" />
          <span>設定</span>
        </Link>
      </nav>
      <button onClick={handleLogout}>
        <LogOut className="w-5 h-5" />
      </button>
    </header>
  );
}
```

### 遷移後：Header.tsx

```tsx
import { PixelIcon } from '@/components/ui/icons';

export function Header() {
  return (
    <header>
      <button>
        <PixelIcon name="menu" size={24} aria-label="開啟選單" />
      </button>
      <nav>
        <Link href="/" className="flex items-center gap-2">
          <PixelIcon name="home" size={24} className="text-pip-boy-green" aria-label="首頁" />
          <span>首頁</span>
        </Link>
        <Link href="/dashboard" className="flex items-center gap-2">
          <PixelIcon name="user" size={24} aria-label="個人資料" />
          <span>個人資料</span>
        </Link>
        <Link href="/settings" className="flex items-center gap-2">
          <PixelIcon name="settings" size={24} aria-label="設定" />
          <span>設定</span>
        </Link>
      </nav>
      <button onClick={handleLogout}>
        <PixelIcon name="logout" size={24} aria-label="登出" />
      </button>
    </header>
  );
}
```

### 主要變更：
1. ✅ 單一 import 替換多個 lucide-react imports
2. ✅ 所有圖示統一使用 `<PixelIcon>` 元件
3. ✅ `w-5 h-5` (20px) 轉換為 `size={24}` (標準尺寸)
4. ✅ `w-6 h-6` (24px) 轉換為 `size={24}`
5. ✅ 所有互動式圖示新增 `aria-label`
6. ✅ 保留顏色類別 `text-pip-boy-green`

---

## 需要協助？

- **圖示瀏覽器**：[/test/icon-preview](http://localhost:3000/test/icon-preview)
- **使用指南**：[README.md](./README.md)
- **設計文件**：[.kiro/specs/pixel-icon-replacement/design.md](/.kiro/specs/pixel-icon-replacement/design.md)
- **映射表**：[src/components/ui/icons/iconMapping.ts](/src/components/ui/icons/iconMapping.ts)

---

**文件版本**：1.0
**最後更新**：2025-10-11
**適用範圍**：Wasteland Tarot 專案
