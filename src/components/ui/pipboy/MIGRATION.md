# PipBoy 元件遷移指南

從 shadcn/ui 元件遷移至 PipBoy 元件系統的完整指南。

## 目錄

- [概述](#概述)
- [為什麼要遷移](#為什麼要遷移)
- [遷移對照表](#遷移對照表)
- [逐步遷移教學](#逐步遷移教學)
- [API 差異對照](#api-差異對照)
- [常見問題 FAQ](#常見問題-faq)
- [疑難排解](#疑難排解)

---

## 概述

PipBoy 元件系統是為 Wasteland Tarot 專案打造的統一 UI 元件庫，提供：

- **統一視覺風格**：所有元件遵循 Fallout Pip-Boy 終端機美學
- **完整無障礙支援**：符合 WCAG AA 標準
- **TypeScript 類型安全**：完整的類型定義與自動完成
- **音效整合**：內建終端機音效系統
- **CRT 掃描線效果**：真實的 CRT 顯示器視覺效果
- **Cubic 11 字體**：全站統一的像素字體

---

## 為什麼要遷移

### 優勢

✅ **視覺一致性**：所有 PipBoy 元件使用相同的 Pip-Boy Green (#00ff88) 配色與終端機風格
✅ **增強的無障礙性**：所有元件經過 axe-core 無障礙測試驗證
✅ **更好的開發體驗**：完整的 TypeScript 類型推斷與 IDE 自動完成
✅ **內建音效**：按鈕點擊、卡片互動自動播放終端機音效
✅ **統一匯出**：從 `@/components/ui/pipboy` 統一匯入所有元件

### 向後相容性

⚠️ **破壞性變更**：無（所有 API 保持相容）
✅ **共存策略**：舊元件仍可使用，已標記 `@deprecated`
✅ **漸進式遷移**：可逐步遷移，不需一次全部替換

---

## 遷移對照表

### 元件映射

| 舊元件 (shadcn/ui) | 新元件 (PipBoy) | 狀態 |
|-------------------|----------------|------|
| `Button` | `PipBoyButton` | ✅ 完全相容 |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | `PipBoyCard`, `PipBoyCardHeader`, `PipBoyCardTitle`, `PipBoyCardDescription`, `PipBoyCardContent`, `PipBoyCardFooter` | ✅ 完全相容 |
| `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogClose` | `PipBoyDialog`, `PipBoyDialogTrigger`, `PipBoyDialogContent`, `PipBoyDialogHeader`, `PipBoyDialogTitle`, `PipBoyDialogDescription`, `PipBoyDialogClose` | ✅ 完全相容 |
| `LoadingState` | `PipBoyLoading` | ⚠️ API 微調（詳見下方） |
| `Input` | `PipBoyInput` | 🚧 開發中 |
| `Select` | `PipBoySelect` | 🚧 開發中 |
| `Label` | `PipBoyLabel` | 🚧 開發中 |

---

## 逐步遷移教學

### 1. 遷移 Button

#### 舊寫法 (shadcn/ui)

```tsx
import { Button } from '@/components/ui/button'

function MyComponent() {
  return (
    <>
      <Button variant="default" size="lg" onClick={handleClick}>
        開始解讀
      </Button>
      <Button variant="outline" size="sm">
        取消
      </Button>
    </>
  )
}
```

#### 新寫法 (PipBoy)

```tsx
import { PipBoyButton } from '@/components/ui/pipboy'

function MyComponent() {
  return (
    <>
      <PipBoyButton variant="default" size="lg" onClick={handleClick}>
        開始解讀
      </PipBoyButton>
      <PipBoyButton variant="outline" size="sm">
        取消
      </PipBoyButton>
    </>
  )
}
```

**變更內容**：
- ✅ 將 `Button` 替換為 `PipBoyButton`
- ✅ 所有 props 保持不變
- ✅ 自動套用 Pip-Boy 綠色配色
- ✅ 自動整合終端機點擊音效

---

### 2. 遷移 Card

#### 舊寫法 (shadcn/ui)

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

function MyComponent() {
  return (
    <Card variant="elevated" padding="lg">
      <CardHeader>
        <CardTitle>塔羅卡片</CardTitle>
        <CardDescription>愚者 - 新的開始</CardDescription>
      </CardHeader>
      <CardContent>
        <p>卡片內容</p>
      </CardContent>
      <CardFooter>
        <Button>查看詳情</Button>
      </CardFooter>
    </Card>
  )
}
```

#### 新寫法 (PipBoy)

```tsx
import {
  PipBoyCard,
  PipBoyCardHeader,
  PipBoyCardTitle,
  PipBoyCardDescription,
  PipBoyCardContent,
  PipBoyCardFooter
} from '@/components/ui/pipboy'
import { PipBoyButton } from '@/components/ui/pipboy'

function MyComponent() {
  return (
    <PipBoyCard variant="elevated" padding="lg">
      <PipBoyCardHeader>
        <PipBoyCardTitle>塔羅卡片</PipBoyCardTitle>
        <PipBoyCardDescription>愚者 - 新的開始</PipBoyCardDescription>
      </PipBoyCardHeader>
      <PipBoyCardContent>
        <p>卡片內容</p>
      </PipBoyCardContent>
      <PipBoyCardFooter>
        <PipBoyButton>查看詳情</PipBoyButton>
      </PipBoyCardFooter>
    </PipBoyCard>
  )
}
```

**變更內容**：
- ✅ 將所有 `Card*` 元件替換為 `PipBoyCard*`
- ✅ 所有 props 保持不變
- ✅ 自動套用雙層綠色邊框與終端機背景
- ✅ 支援 `isClickable`、`glowEffect`、`showCornerIcons` 等增強功能

---

### 3. 遷移 Dialog

#### 舊寫法 (shadcn/ui)

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'

function MyComponent() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>開啟對話框</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>確認刪除</DialogTitle>
          <DialogDescription>此操作無法復原</DialogDescription>
        </DialogHeader>
        {/* Dialog 內容 */}
      </DialogContent>
    </Dialog>
  )
}
```

#### 新寫法 (PipBoy)

```tsx
import {
  PipBoyDialog,
  PipBoyDialogTrigger,
  PipBoyDialogContent,
  PipBoyDialogHeader,
  PipBoyDialogTitle,
  PipBoyDialogDescription
} from '@/components/ui/pipboy'
import { PipBoyButton } from '@/components/ui/pipboy'

function MyComponent() {
  return (
    <PipBoyDialog>
      <PipBoyDialogTrigger asChild>
        <PipBoyButton>開啟對話框</PipBoyButton>
      </PipBoyDialogTrigger>
      <PipBoyDialogContent>
        <PipBoyDialogHeader>
          <PipBoyDialogTitle>確認刪除</PipBoyDialogTitle>
          <PipBoyDialogDescription>此操作無法復原</PipBoyDialogDescription>
        </PipBoyDialogHeader>
        {/* Dialog 內容 */}
      </PipBoyDialogContent>
    </PipBoyDialog>
  )
}
```

**變更內容**：
- ✅ 將所有 `Dialog*` 元件替換為 `PipBoyDialog*`
- ✅ 所有 props 保持不變
- ✅ 自動套用 CRT 掃描線效果
- ✅ 支援 Vault-Tec 標誌與終端機風格標題列

---

### 4. 遷移 LoadingState

#### 舊寫法

```tsx
import { LoadingState } from '@/components/ui/loading-state'

function MyComponent() {
  return (
    <>
      <LoadingState size="md" message="載入中..." />
      <LoadingState size="lg" />
    </>
  )
}
```

#### 新寫法 (PipBoy)

```tsx
import { PipBoyLoading } from '@/components/ui/pipboy'

function MyComponent() {
  return (
    <>
      <PipBoyLoading variant="spinner" size="md" text="載入中..." />
      <PipBoyLoading variant="spinner" size="lg" />
    </>
  )
}
```

**變更內容**：
- ⚠️ `message` prop → `text` prop
- ✅ 新增 `variant` prop（4 種變體：`spinner`, `dots`, `skeleton`, `overlay`）
- ✅ 支援 `prefers-reduced-motion` 自動停用動畫

---

## API 差異對照

### PipBoyButton

**新增的 Variants**：
- `success` - 成功狀態 (Bright Green #00ff41)
- `warning` - 警告狀態 (Warning Yellow #ffdd00)
- `info` - 資訊狀態 (Vault Blue #0055aa)

**新增的 Sizes**：
- `xs` - 超小尺寸 (h-7)
- `xl` - 超大尺寸 (h-14)

**新增的 Props**：
- `disableAudio?: boolean` - 停用點擊音效

---

### PipBoyCard

**新增的 Props**：
- `isClickable?: boolean` - 啟用可點擊狀態
- `glowEffect?: boolean` - 啟用綠色發光效果
- `showCornerIcons?: boolean` - 顯示 Vault-Tec 角落裝飾
- `isLoading?: boolean` - 啟用載入動畫
- `fullWidth?: boolean` - 全寬顯示

**新增的 Padding 選項**：
- `xl` - 超大內距 (p-8)

---

### PipBoyLoading

**新增的功能**：
- `variant?: 'spinner' | 'dots' | 'skeleton' | 'overlay'` - 4 種載入動畫變體
- `text?: string` - 載入文字（替代舊的 `message` prop）

---

## 常見問題 FAQ

### Q1: 我可以同時使用舊元件和新元件嗎？

**A**: 可以。舊元件已標記為 `@deprecated` 但仍可正常使用。建議逐步遷移至新元件以獲得更好的視覺一致性。

---

### Q2: 遷移會破壞現有功能嗎？

**A**: 不會。所有 PipBoy 元件的 API 與 shadcn/ui 元件保持相容。唯一的變更是 `LoadingState` 的 `message` prop 改為 `text`。

---

### Q3: 如何停用按鈕點擊音效？

**A**: 使用 `disableAudio` prop：

```tsx
<PipBoyButton disableAudio onClick={handleClick}>
  靜音按鈕
</PipBoyButton>
```

---

### Q4: 如何使用新的載入變體？

**A**: PipBoyLoading 支援 4 種變體：

```tsx
// 旋轉 spinner
<PipBoyLoading variant="spinner" size="md" />

// 跳動點
<PipBoyLoading variant="dots" size="sm" />

// 骨架屏
<PipBoyLoading variant="skeleton" size="lg" />

// 全螢幕遮罩
<PipBoyLoading variant="overlay" text="載入中..." />
```

---

### Q5: 如何自訂 PipBoy 元件樣式？

**A**: 所有元件支援 `className` prop，可使用 Tailwind CSS 覆寫樣式：

```tsx
<PipBoyButton className="bg-red-500 hover:bg-red-600">
  自訂樣式
</PipBoyButton>
```

---

### Q6: 如何在卡片四個角落顯示 Vault-Tec 裝飾？

**A**: 使用 `showCornerIcons` prop：

```tsx
<PipBoyCard showCornerIcons>
  <PipBoyCardContent>卡片內容</PipBoyCardContent>
</PipBoyCard>
```

---

### Q7: 如何使卡片可點擊？

**A**: 使用 `isClickable` prop 並提供 `onClick` handler：

```tsx
<PipBoyCard isClickable onClick={handleCardClick}>
  <PipBoyCardContent>點擊我</PipBoyCardContent>
</PipBoyCard>
```

元件會自動：
- 套用 `role="button"`
- 套用 `tabIndex={0}`
- 支援鍵盤 Enter 鍵觸發
- 播放點擊音效

---

### Q8: TypeScript 類型有什麼變化？

**A**: 所有 PipBoy 元件提供完整的 TypeScript 類型定義。IDE 會自動提供 props 自動完成與類型檢查：

```tsx
import type { ButtonProps, ButtonVariant, ButtonSize } from '@/components/ui/pipboy'

const variant: ButtonVariant = 'success'  // 類型安全
const size: ButtonSize = 'lg'             // 類型安全
```

---

## 疑難排解

### 問題 1: 音效無法播放

**原因**: 音效系統可能尚未初始化或音效檔案缺失

**解決方案**:
1. 確認 `useAudioEffect` hook 可正常使用
2. 檢查音效檔案是否存在於 `/public/sounds/`
3. 暫時停用音效：`<PipBoyButton disableAudio>`

---

### 問題 2: 樣式未正確套用

**原因**: Tailwind CSS 配置可能缺少 PipBoy 色彩變數

**解決方案**:
確認 `tailwind.config.ts` 包含以下配置：

```ts
colors: {
  'pip-boy-green': '#00ff88',
  'pip-boy-green-bright': '#00ff41',
  // ... 其他色彩
}
```

---

### 問題 3: TypeScript 類型錯誤

**原因**: 可能使用了已棄用的 props

**解決方案**:
- 將 `LoadingState` 的 `message` 改為 `text`
- 確認所有 import 來自 `@/components/ui/pipboy`

---

### 問題 4: CRT 掃描線效果看不見

**原因**: CSS 動畫可能被 `prefers-reduced-motion` 停用

**解決方案**:
檢查系統設定是否啟用「減少動畫」選項。PipBoy 元件會自動遵循無障礙設定停用動畫。

---

## 快速檢查清單

遷移完成後，確認以下項目：

- [ ] 所有 `Button` 已替換為 `PipBoyButton`
- [ ] 所有 `Card*` 已替換為 `PipBoyCard*`
- [ ] 所有 `Dialog*` 已替換為 `PipBoyDialog*`
- [ ] `LoadingState` 的 `message` 已改為 `text`
- [ ] 所有 import 來自 `@/components/ui/pipboy`
- [ ] 單元測試與 E2E 測試通過
- [ ] 視覺回歸測試通過（無非預期版面位移）
- [ ] TypeScript 編譯無錯誤

---

## 支援

如有任何遷移問題，請：

1. 查閱 [PipBoy README.md](./README.md) 完整 API 文件
2. 參考 [測試檔案](./__tests__/) 中的使用範例
3. 訪問 `/pipboy-showcase` 頁面查看互動式元件展示（若已建立）

---

**最後更新**: 2025-10-30
**版本**: 1.0.0
**維護者**: Wasteland Tarot Development Team
