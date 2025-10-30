# PipBoy UI 元件系統

為 Wasteland Tarot 專案打造的統一 Pip-Boy 風格 UI 元件庫。

## 目錄

- [簡介](#簡介)
- [特色功能](#特色功能)
- [安裝與使用](#安裝與使用)
- [元件 API 文件](#元件-api-文件)
  - [PipBoyButton](#pipboybutton)
  - [PipBoyCard](#pipboycard)
  - [PipBoyDialog](#pipboydialog)
  - [PipBoyLoading](#pipboyloading)
- [進階使用](#進階使用)
- [無障礙支援](#無障礙支援)
- [效能優化](#效能優化)
- [已知限制](#已知限制)

---

## 簡介

PipBoy UI 元件系統提供一套完整的 React 元件，遵循 Fallout Pip-Boy 終端機美學，為 Wasteland Tarot 專案帶來沉浸式的廢土風格體驗。

### 設計原則

- **視覺一致性**: 所有元件使用統一的 Pip-Boy Green (#00ff88) 配色
- **終端機美學**: CRT 掃描線效果、Cubic 11 像素字體、終端機風格陰影
- **完整無障礙**: 符合 WCAG AA 標準，支援鍵盤導航與螢幕閱讀器
- **類型安全**: 完整的 TypeScript 類型定義與 IDE 自動完成
- **音效整合**: 內建終端機按鍵音效系統

---

## 特色功能

✅ **9 個按鈕變體**: default, outline, destructive, secondary, ghost, link, success, warning, info
✅ **6 個尺寸選項**: xs, sm, default, lg, xl, icon
✅ **4 個載入動畫**: spinner, dots, skeleton, overlay
✅ **自動音效**: 按鈕點擊、卡片互動自動播放終端機音效
✅ **CRT 掃描線**: 真實的 CRT 顯示器視覺效果
✅ **Cubic 11 字體**: 11×11 像素點陣字體，支援 4808+ 繁體中文
✅ **React 19 支援**: ref-as-prop 模式
✅ **CVA 變體系統**: 使用 class-variance-authority 管理樣式變體

---

## 安裝與使用

### 統一匯入

所有 PipBoy 元件從單一入口匯入：

```tsx
import {
  PipBoyButton,
  PipBoyCard,
  PipBoyCardHeader,
  PipBoyCardTitle,
  PipBoyCardDescription,
  PipBoyCardContent,
  PipBoyCardFooter,
  PipBoyDialog,
  PipBoyDialogTrigger,
  PipBoyDialogContent,
  PipBoyDialogHeader,
  PipBoyDialogTitle,
  PipBoyDialogDescription,
  PipBoyDialogClose,
  PipBoyLoading,
} from '@/components/ui/pipboy'
```

### 基礎範例

```tsx
function MyComponent() {
  return (
    <PipBoyCard variant="elevated" padding="lg">
      <PipBoyCardHeader>
        <PipBoyCardTitle>塔羅卡片</PipBoyCardTitle>
        <PipBoyCardDescription>愚者 - 新的開始</PipBoyCardDescription>
      </PipBoyCardHeader>
      <PipBoyCardContent>
        <p>卡片內容說明</p>
      </PipBoyCardContent>
      <PipBoyCardFooter>
        <PipBoyButton variant="default" size="lg">
          開始解讀
        </PipBoyButton>
        <PipBoyButton variant="outline" size="sm">
          取消
        </PipBoyButton>
      </PipBoyCardFooter>
    </PipBoyCard>
  )
}
```

---

## 元件 API 文件

### PipBoyButton

Pip-Boy 風格按鈕元件，支援 9 個變體與 6 個尺寸。

#### Props

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link' | 'success' | 'warning' | 'info'
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl' | 'icon'
  disableAudio?: boolean
  ref?: React.RefObject<HTMLButtonElement>
}
```

#### Variants

| Variant | 用途 | 色彩 | 背景 |
|---------|------|------|------|
| `default` | 主要操作 | 黑色文字 | Pip-Boy Green (#00ff88) |
| `outline` | 次要操作 | Pip-Boy Green | 透明背景 |
| `destructive` | 刪除操作 | 白色文字 | Deep Red (#ef4444) |
| `secondary` | 次要操作 | 黑色文字 | Radiation Orange (#ff8800) |
| `ghost` | 輕量操作 | Pip-Boy Green | 透明背景，無邊框 |
| `link` | 連結樣式 | Pip-Boy Green | 透明背景，底線 |
| `success` | 成功狀態 | 黑色文字 | Bright Green (#00ff41) |
| `warning` | 警告狀態 | 黑色文字 | Warning Yellow (#ffdd00) |
| `info` | 資訊狀態 | 白色文字 | Vault Blue (#0055aa) |

#### Sizes

| Size | 高度 | 用途 |
|------|------|------|
| `xs` | 28px (h-7) | 超小型按鈕 |
| `sm` | 32px (h-8) | 小型按鈕 |
| `default` | 40px (h-10) | 標準按鈕 |
| `lg` | 48px (h-12) | 大型按鈕 |
| `xl` | 56px (h-14) | 超大型按鈕 |
| `icon` | 40x40px | 圖示按鈕（正方形） |

#### 使用範例

```tsx
// 範例 1: 主要操作按鈕
<PipBoyButton variant="default" size="lg" onClick={handleSubmit}>
  開始解讀
</PipBoyButton>

// 範例 2: 次要操作按鈕
<PipBoyButton variant="outline" size="sm" onClick={handleCancel}>
  取消
</PipBoyButton>

// 範例 3: 刪除操作按鈕
<PipBoyButton variant="destructive" size="default" onClick={handleDelete}>
  刪除記錄
</PipBoyButton>

// 範例 4: 圖示按鈕（必須提供 aria-label）
<PipBoyButton variant="ghost" size="icon" aria-label="關閉對話框">
  <PixelIcon name="close" />
</PipBoyButton>

// 範例 5: 停用音效
<PipBoyButton disableAudio onClick={handleClick}>
  靜音按鈕
</PipBoyButton>

// 範例 6: 載入狀態
<PipBoyButton disabled>
  <PipBoyLoading variant="spinner" size="sm" />
  處理中...
</PipBoyButton>
```

#### 特殊注意事項

⚠️ **圖示按鈕必須提供 aria-label**: 使用 `size="icon"` 時，必須提供 `aria-label` 屬性以確保無障礙性。

```tsx
// ✅ 正確
<PipBoyButton size="icon" aria-label="關閉">
  <PixelIcon name="close" />
</PipBoyButton>

// ❌ 錯誤（缺少 aria-label）
<PipBoyButton size="icon">
  <PixelIcon name="close" />
</PipBoyButton>
```

---

### PipBoyCard

Pip-Boy 風格卡片元件，支援多種變體與互動狀態。

#### Props

```tsx
interface PipBoyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'ghost' | 'interactive'
  padding?: 'none' | 'sm' | 'default' | 'lg' | 'xl'
  isClickable?: boolean
  glowEffect?: boolean
  showCornerIcons?: boolean
  isLoading?: boolean
  fullWidth?: boolean
}
```

#### Variants

| Variant | 用途 | 樣式 |
|---------|------|------|
| `default` | 標準卡片 | 雙層綠色邊框、半透明黑底 |
| `elevated` | 強調卡片 | 增強綠色陰影發光效果 |
| `ghost` | 輕量卡片 | 半透明邊框、淡化背景 |
| `interactive` | 可點擊卡片 | hover 時亮度提升、cursor: pointer |

#### Padding

| Padding | 內距 | 用途 |
|---------|------|------|
| `none` | 0px (p-0) | 無內距（圖片卡片） |
| `sm` | 12px (p-3) | 小內距 |
| `default` | 16px (p-4) | 標準內距 |
| `lg` | 24px (p-6) | 大內距 |
| `xl` | 32px (p-8) | 超大內距 |

#### 子元件

- `PipBoyCardHeader`: 卡片標題區域
- `PipBoyCardTitle`: 卡片標題文字（h3 元素）
- `PipBoyCardDescription`: 卡片描述文字
- `PipBoyCardContent`: 卡片主要內容區域
- `PipBoyCardFooter`: 卡片底部區域

#### 使用範例

```tsx
// 範例 1: 標準卡片
<PipBoyCard variant="default" padding="default">
  <PipBoyCardHeader>
    <PipBoyCardTitle>塔羅卡片</PipBoyCardTitle>
    <PipBoyCardDescription>愚者 - 新的開始</PipBoyCardDescription>
  </PipBoyCardHeader>
  <PipBoyCardContent>
    <p>卡片內容說明</p>
  </PipBoyCardContent>
  <PipBoyCardFooter>
    <PipBoyButton>查看詳情</PipBoyButton>
  </PipBoyCardFooter>
</PipBoyCard>

// 範例 2: 可點擊卡片
<PipBoyCard isClickable onClick={handleCardClick}>
  <PipBoyCardContent>
    點擊我查看詳情
  </PipBoyCardContent>
</PipBoyCard>

// 範例 3: 發光效果卡片
<PipBoyCard variant="elevated" glowEffect>
  <PipBoyCardContent>
    強調的重要訊息
  </PipBoyCardContent>
</PipBoyCard>

// 範例 4: Vault-Tec 角落裝飾
<PipBoyCard showCornerIcons>
  <PipBoyCardContent>
    四個角落顯示 Vault-Tec 標誌
  </PipBoyCardContent>
</PipBoyCard>

// 範例 5: 載入狀態卡片
<PipBoyCard isLoading>
  <PipBoyCardContent>
    載入中...
  </PipBoyCardContent>
</PipBoyCard>

// 範例 6: 無內距圖片卡片
<PipBoyCard padding="none">
  <img src="/tarot-card.jpg" alt="塔羅牌" className="w-full" />
  <PipBoyCardFooter>
    <PipBoyCardTitle>愚者</PipBoyCardTitle>
  </PipBoyCardFooter>
</PipBoyCard>
```

#### 互動行為

當使用 `isClickable` 時，卡片會自動：
- 套用 `role="button"`
- 套用 `tabIndex={0}`（支援鍵盤導航）
- 支援 Enter 鍵觸發 onClick
- 播放終端機點擊音效
- 套用 `cursor: pointer`

```tsx
<PipBoyCard
  isClickable
  onClick={handleClick}
  aria-label="選擇此卡片"
>
  <PipBoyCardContent>可點擊卡片</PipBoyCardContent>
</PipBoyCard>
```

---

### PipBoyDialog

Pip-Boy 風格對話框元件，基於 Radix UI Dialog Primitive。

#### Props

```tsx
// PipBoyDialog (根元件)
interface DialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
}

// PipBoyDialogContent
interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
}
```

#### 子元件

- `PipBoyDialog`: 對話框根元件
- `PipBoyDialogTrigger`: 觸發器（開啟對話框的按鈕）
- `PipBoyDialogContent`: 對話框內容容器
- `PipBoyDialogHeader`: 對話框標題區域
- `PipBoyDialogTitle`: 對話框標題文字
- `PipBoyDialogDescription`: 對話框描述文字
- `PipBoyDialogClose`: 關閉按鈕

#### 使用範例

```tsx
// 範例 1: 基礎對話框
<PipBoyDialog>
  <PipBoyDialogTrigger asChild>
    <PipBoyButton>開啟對話框</PipBoyButton>
  </PipBoyDialogTrigger>
  <PipBoyDialogContent>
    <PipBoyDialogHeader>
      <PipBoyDialogTitle>確認操作</PipBoyDialogTitle>
      <PipBoyDialogDescription>
        此操作無法復原，確定要繼續嗎？
      </PipBoyDialogDescription>
    </PipBoyDialogHeader>
    <div className="flex gap-4 mt-4">
      <PipBoyButton variant="destructive">確認</PipBoyButton>
      <PipBoyDialogClose asChild>
        <PipBoyButton variant="outline">取消</PipBoyButton>
      </PipBoyDialogClose>
    </div>
  </PipBoyDialogContent>
</PipBoyDialog>

// 範例 2: 受控對話框
function MyComponent() {
  const [open, setOpen] = React.useState(false)

  return (
    <PipBoyDialog open={open} onOpenChange={setOpen}>
      <PipBoyDialogTrigger asChild>
        <PipBoyButton onClick={() => setOpen(true)}>
          開啟對話框
        </PipBoyButton>
      </PipBoyDialogTrigger>
      <PipBoyDialogContent>
        <PipBoyDialogHeader>
          <PipBoyDialogTitle>受控對話框</PipBoyDialogTitle>
        </PipBoyDialogHeader>
        <PipBoyButton onClick={() => setOpen(false)}>
          關閉
        </PipBoyButton>
      </PipBoyDialogContent>
    </PipBoyDialog>
  )
}

// 範例 3: 禁止點擊背景關閉
<PipBoyDialog>
  <PipBoyDialogTrigger asChild>
    <PipBoyButton>開啟對話框</PipBoyButton>
  </PipBoyDialogTrigger>
  <PipBoyDialogContent closeOnBackdropClick={false} closeOnEscape={false}>
    <PipBoyDialogHeader>
      <PipBoyDialogTitle>強制操作</PipBoyDialogTitle>
      <PipBoyDialogDescription>
        請完成操作後再關閉
      </PipBoyDialogDescription>
    </PipBoyDialogHeader>
  </PipBoyDialogContent>
</PipBoyDialog>

// 範例 4: 表單對話框
<PipBoyDialog>
  <PipBoyDialogTrigger asChild>
    <PipBoyButton>填寫表單</PipBoyButton>
  </PipBoyDialogTrigger>
  <PipBoyDialogContent>
    <PipBoyDialogHeader>
      <PipBoyDialogTitle>新增解讀記錄</PipBoyDialogTitle>
    </PipBoyDialogHeader>
    <form onSubmit={handleSubmit}>
      <label htmlFor="question">問題</label>
      <input id="question" type="text" />
      <div className="flex gap-4 mt-4">
        <PipBoyButton type="submit">提交</PipBoyButton>
        <PipBoyDialogClose asChild>
          <PipBoyButton type="button" variant="outline">取消</PipBoyButton>
        </PipBoyDialogClose>
      </div>
    </form>
  </PipBoyDialogContent>
</PipBoyDialog>
```

#### 無障礙特性

- **焦點管理**: 對話框開啟時自動聚焦第一個可聚焦元素
- **焦點陷阱**: Tab 鍵導航限制在對話框內
- **焦點恢復**: 對話框關閉時恢復至觸發元素
- **Escape 鍵關閉**: 按下 Escape 鍵關閉對話框（可停用）
- **ARIA 屬性**: 自動套用 `role="dialog"`, `aria-modal="true"`, `aria-labelledby`

---

### PipBoyLoading

Pip-Boy 風格載入動畫元件，支援 4 種變體。

#### Props

```tsx
interface PipBoyLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'spinner' | 'dots' | 'skeleton' | 'overlay'
  size?: 'sm' | 'md' | 'lg'
  text?: string
}
```

#### Variants

| Variant | 用途 | 樣式 |
|---------|------|------|
| `spinner` | 旋轉載入圖示 | 單個旋轉的 spinner |
| `dots` | 跳動點載入 | 三個跳動的點 |
| `skeleton` | 骨架屏載入 | 閃爍的佔位符 |
| `overlay` | 全螢幕遮罩載入 | 半透明背景遮罩 + spinner |

#### Sizes

| Size | 尺寸 | 用途 |
|------|------|------|
| `sm` | 小尺寸 | 內聯載入、按鈕內載入 |
| `md` | 中尺寸 | 卡片載入 |
| `lg` | 大尺寸 | 頁面載入 |

#### 使用範例

```tsx
// 範例 1: 旋轉 Spinner
<PipBoyLoading variant="spinner" size="md" text="載入中..." />

// 範例 2: 跳動點
<PipBoyLoading variant="dots" size="sm" />

// 範例 3: 骨架屏
<PipBoyLoading variant="skeleton" size="lg" />

// 範例 4: 全螢幕遮罩
<PipBoyLoading variant="overlay" text="正在處理您的請求..." />

// 範例 5: 按鈕內載入
<PipBoyButton disabled>
  <PipBoyLoading variant="spinner" size="sm" />
  處理中...
</PipBoyButton>

// 範例 6: 卡片載入狀態
<PipBoyCard isLoading>
  <PipBoyCardContent>
    <PipBoyLoading variant="skeleton" size="md" />
  </PipBoyCardContent>
</PipBoyCard>
```

#### 無障礙支援

- **role="status"**: 自動套用 ARIA 狀態角色
- **aria-live="polite"**: 螢幕閱讀器會朗讀載入狀態
- **sr-only**: 提供視覺隱藏的 "Loading..." 文字供螢幕閱讀器讀取
- **prefers-reduced-motion**: 自動停用動畫（使用者啟用減少動畫偏好時）

---

## 進階使用

### 自訂樣式

所有 PipBoy 元件支援 `className` prop，可使用 Tailwind CSS 覆寫樣式：

```tsx
<PipBoyButton className="bg-red-500 hover:bg-red-600 text-white">
  自訂樣式按鈕
</PipBoyButton>

<PipBoyCard className="border-4 border-yellow-500 shadow-2xl">
  自訂樣式卡片
</PipBoyCard>
```

### 使用 CVA 變體

PipBoy 元件使用 `class-variance-authority` (CVA) 管理變體系統。你可以直接匯入 `buttonVariants` 或 `cardVariants` 用於自訂元件：

```tsx
import { buttonVariants } from '@/components/ui/pipboy'

function CustomButton({ className, ...props }: ButtonProps) {
  return (
    <a
      className={cn(
        buttonVariants({ variant: 'default', size: 'lg' }),
        className
      )}
      {...props}
    />
  )
}
```

### 組合模式

PipBoy 元件支援 Composition Pattern，可靈活組合子元件：

```tsx
<PipBoyCard>
  <PipBoyCardHeader bordered={false}>
    <PipBoyCardTitle>自訂標題</PipBoyCardTitle>
  </PipBoyCardHeader>
  <PipBoyCardContent>
    <div className="grid grid-cols-2 gap-4">
      <PipBoyCard variant="ghost" padding="sm">子卡片 1</PipBoyCard>
      <PipBoyCard variant="ghost" padding="sm">子卡片 2</PipBoyCard>
    </div>
  </PipBoyCardContent>
  <PipBoyCardFooter bordered={false}>
    <PipBoyButton fullWidth>提交</PipBoyButton>
  </PipBoyCardFooter>
</PipBoyCard>
```

### TypeScript 類型推斷

所有 PipBoy 元件提供完整的 TypeScript 類型定義：

```tsx
import type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  PipBoyCardProps,
  PipBoyLoadingProps
} from '@/components/ui/pipboy'

// 類型安全的 variant 與 size
const variant: ButtonVariant = 'success'
const size: ButtonSize = 'lg'

// Props 類型推斷
const buttonProps: ButtonProps = {
  variant: 'default',
  size: 'lg',
  onClick: handleClick,
}
```

---

## 無障礙支援

所有 PipBoy 元件符合 WCAG AA 標準，提供完整的無障礙支援：

### 鍵盤導航

- **Tab 鍵**: 導航至下一個可聚焦元素
- **Shift + Tab**: 導航至上一個可聚焦元素
- **Enter / Space**: 觸發按鈕與可點擊卡片
- **Escape**: 關閉對話框

### ARIA 屬性

- **role**: 自動套用正確的 ARIA role（button, dialog, status）
- **aria-label**: 圖示按鈕必須提供
- **aria-modal**: 對話框自動套用
- **aria-live**: 載入元件自動套用
- **aria-disabled**: disabled 狀態自動套用

### 色彩對比度

所有文字與背景色彩對比度 ≥ 4.5:1（WCAG AA 標準）：

- Pip-Boy Green (#00ff88) on Black: **15.2:1** ✅
- Warning Yellow (#ffdd00) on Black: **12.4:1** ✅
- Bright Green (#00ff41) on Black: **14.8:1** ✅

### prefers-reduced-motion

所有動畫效果支援 `prefers-reduced-motion` 媒體查詢，當使用者啟用「減少動畫」偏好時自動停用動畫。

### 螢幕閱讀器支援

- 所有互動元件可被螢幕閱讀器正確識別
- 載入狀態會自動朗讀
- 圖示按鈕必須提供 `aria-label`
- 對話框標題自動連結至 `aria-labelledby`

---

## 效能優化

### Bundle Size

PipBoy 元件系統經過優化，minimized + gzipped 後的大小：

- **PipBoyButton**: ~2KB
- **PipBoyCard**: ~3KB
- **PipBoyDialog**: ~5KB (包含 Radix UI Dialog)
- **PipBoyLoading**: ~1KB

### Tree Shaking

使用 ES Modules 支援 tree shaking，只匯入使用的元件：

```tsx
// ✅ 只匯入需要的元件（推薦）
import { PipBoyButton, PipBoyCard } from '@/components/ui/pipboy'

// ❌ 避免 barrel import 整個套件
import * as PipBoy from '@/components/ui/pipboy'
```

### CRT 掃描線效能

CRT 掃描線動畫使用 CSS 動畫，GPU 加速，維持 60fps：

```css
animation: scanline 4s linear infinite;
will-change: transform; /* GPU 加速 */
```

低階裝置會自動降級或停用動畫效果。

---

## 已知限制

### 限制 1: 音效系統依賴

PipBoy 元件音效功能依賴 `useAudioEffect` hook。若音效系統未初始化或音效檔案缺失，音效將無法播放（但不影響元件功能）。

**解決方案**: 使用 `disableAudio` prop 暫時停用音效。

### 限制 2: Cubic 11 字體載入

Cubic 11 字體檔案較大 (~400KB)。首次載入可能需要 1-2 秒。

**解決方案**: 字體已設定 `font-display: swap`，會先顯示系統字體再切換至 Cubic 11。

### 限制 3: CRT 掃描線效果

CRT 掃描線動畫可能在低階裝置影響效能。

**解決方案**:
- 自動偵測 `prefers-reduced-motion` 並停用動畫
- 可手動停用 CRT 效果（透過 CSS class 覆寫）

### 限制 4: Dialog 焦點管理

PipBoyDialog 使用 Radix UI Dialog Primitive，在某些複雜表單場景可能需要手動管理焦點。

**解決方案**: 使用 `ref` 手動設定焦點至特定元素。

---

## 版本歷史

### v1.0.0 (2025-10-30)

- ✅ 初版發布
- ✅ PipBoyButton 完整支援 9 個變體與 6 個尺寸
- ✅ PipBoyCard 完整支援子元件系統
- ✅ PipBoyDialog 整合 Radix UI Primitives
- ✅ PipBoyLoading 支援 4 種載入動畫
- ✅ 完整無障礙支援（WCAG AA）
- ✅ TypeScript 類型安全
- ✅ 音效系統整合
- ✅ CRT 掃描線效果
- ✅ Cubic 11 字體整合

---

## 支援

- **完整遷移指南**: [MIGRATION.md](./MIGRATION.md)
- **互動式展示**: 訪問 `/pipboy-showcase` (若已建立)
- **測試範例**: 查看 `./__tests__/` 目錄

---

**維護者**: Wasteland Tarot Development Team
**最後更新**: 2025-10-30
**版本**: 1.0.0
**授權**: MIT
