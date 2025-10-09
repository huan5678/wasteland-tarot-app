# 元件庫參考文件

> **本文件記錄所有 UI 元件的設計規範、變體、狀態與使用範例，確保一致的使用者體驗與開發效率。**

## 概述

本文件提供完整的元件庫參考，包含按鈕、表單、卡片、圖標等所有 UI 元件的詳細規格、程式碼範例與最佳實踐。所有元件遵循 [00-philosophy.md](./00-philosophy.md) 定義的設計哲學，並使用 [01-tokens.md](./01-tokens.md) 中定義的設計代幣。

**最後更新**：2025-10-04
**版本**：1.0.0
**相關需求**：Requirements 5, 6, 7, 10
**相關檔案**：
- `src/components/ui/button.tsx` - Button 元件
- `src/components/ui/input.tsx` - Input 元件
- `src/components/ui/label.tsx` - Label 元件
- `src/components/ui/card.tsx` - Card 元件

---

## 目錄

- [按鈕元件 (Button)](#按鈕元件-button)
- [表單元件](#表單元件)
- [卡片元件 (Card)](#卡片元件-card)
- [圖標系統 (Icons)](#圖標系統-icons)
- [版面配置系統](#版面配置系統)
- [動畫標準](#動畫標準)
- [效能優化指南](#效能優化指南)

---

## 按鈕元件 (Button)

### 按鈕變體

Button 元件提供 9 種語義化變體，每種變體傳達特定的功能意義。

| 變體 | 使用情境 | 視覺處理 | 無障礙特性 |
|------|---------|---------|----------|
| `default` | 主要操作 | Pip-Boy 綠色背景、黑色文字、綠色發光效果 | WCAG AAA 對比度 (14.2:1) |
| `destructive` | 刪除/移除操作 | 紅色背景、白色文字、輻射警告美學 | 高對比度 + 警告圖標 |
| `outline` | 次要操作 | 透明背景、綠色邊框、hover 顯示背景 | 3px 聚焦外框 |
| `secondary` | 第三級操作 | 深色背景、綠色文字 | 清晰狀態變化 |
| `ghost` | 最小視覺衝擊 | 透明背景、hover 顯示背景變化 | 明確互動提示 |
| `link` | 內嵌導航 | hover 顯示底線、綠色文字 | 底線 + 顏色雙重提示 |
| `warning` | 謹慎操作 | 黃色背景、深色文字 | 高可見度 |
| `success` | 成功確認 | 綠色背景、黑色文字 | 明確正向反饋 |
| `info` | 資訊提示 | 藍色背景、白色文字 | 清晰資訊層級 |

#### 程式碼範例

```tsx
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle, Check } from "lucide-react"

// 主要操作
<Button variant="default">
  確認選擇
</Button>

// 危險操作（帶圖標）
<Button variant="destructive">
  <Trash2 size={16} />
  刪除帳戶
</Button>

// 次要操作
<Button variant="outline">
  取消
</Button>

// 警告操作
<Button variant="warning">
  <AlertTriangle size={16} />
  謹慎繼續
</Button>

// 成功確認
<Button variant="success">
  <Check size={16} />
  已完成
</Button>
```

---

### 按鈕尺寸

符合 **最小觸控目標 44×44px**（WCAG 2.5.5），確保行動裝置友善。

| 尺寸 | 高度 | 水平內距 | 最小觸控目標 | 使用情境 |
|------|------|---------|-------------|---------|
| `sm` | 32px (h-8) | 12px (px-3) | 44px（透過間距擴充） | 密集介面、工具列 |
| `default` | 36px (h-9) | 16px (px-4) | 44px（預設符合） | 標準按鈕 |
| `lg` | 40px (h-10) | 24px (px-6) | 44px+ | 主要 CTA、行動優先 |
| `icon` | 36×36px (size-9) | - | 44px（透過間距擴充） | 圖標按鈕 |

#### 程式碼範例

```tsx
// 小型按鈕（工具列）
<Button size="sm" variant="outline">
  編輯
</Button>

// 標準按鈕
<Button size="default">
  提交
</Button>

// 大型按鈕（行動優先）
<Button size="lg" variant="default">
  開始任務
</Button>

// 圖標按鈕
<Button size="icon" variant="ghost">
  <X size={20} />
</Button>
```

---

### 按鈕狀態

所有按鈕必須提供清晰的視覺狀態反饋（Req 5.2, 3.3）。

#### 1. **預設狀態（Default）**

基礎外觀，明確的互動提示。

```tsx
<Button variant="default">
  點擊我
</Button>
```

**視覺特性**：
- Pip-Boy 綠色背景 (#00ff88)
- 黑色文字（最大對比度 14.2:1）
- 綠色發光效果 (`box-shadow: 0 0 10px var(--color-glow-green)`)

---

#### 2. **Hover 狀態**

滑鼠懸停時，亮度提升 10%+，發光增強。

```css
.btn-pip-boy:hover {
  background-color: var(--color-pip-boy-green-dark); /* 亮度降低但對比增加 */
  box-shadow: 0 0 15px var(--color-glow-green); /* 發光增強 */
}
```

**過渡時間**：200ms（符合 Req 7.1）

---

#### 3. **Active 狀態**

按下時提供視覺壓下反饋。

```css
.btn-pip-boy:active {
  background-color: var(--color-btn-primary-active);
  transform: scale(0.98); /* 細微壓縮效果 */
}
```

---

#### 4. **Focus 狀態**

鍵盤導航時顯示高對比度聚焦環（WCAG 2.4.7）。

```css
.btn-pip-boy:focus-visible {
  outline: 3px solid var(--color-border-focus); /* 青色高對比 */
  outline-offset: 2px;
  box-shadow:
    0 0 10px var(--color-glow-green),
    0 0 0 1px var(--color-border-focus-ring); /* 雙層視覺提示 */
}
```

**無障礙要求**：
- 最小外框寬度：3px
- 外框偏移：2px
- 對比度：12.1:1（AAA 等級）

---

#### 5. **Disabled 狀態**

停用按鈕，不透明度 50%，禁用指標事件。

```tsx
<Button variant="default" disabled>
  已停用
</Button>
```

**視覺特性**：
- `opacity: 0.5`
- `pointer-events: none`
- `cursor: not-allowed`

---

### 按鈕音效反饋

Button 元件內建 Web Audio API 音效反饋（Req 5.4）。

```tsx
// button.tsx 內建音效邏輯
const { playSound } = useAudioEffect()

const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  if (!disableSound) {
    playSound('button-click') // Pip-Boy 點擊音效
  }
  props.onClick?.(e)
}
```

**停用音效**：

```tsx
<Button disableSound onClick={handleAction}>
  靜音按鈕
</Button>
```

---

### 按鈕組合範例

#### 對話框操作列

```tsx
<div className="flex gap-3 justify-end">
  <Button variant="ghost" onClick={onCancel}>
    取消
  </Button>
  <Button variant="default" onClick={onConfirm}>
    確認
  </Button>
</div>
```

#### 危險操作確認

```tsx
<div className="flex gap-3">
  <Button variant="destructive" size="lg">
    <Trash2 size={20} />
    永久刪除
  </Button>
  <Button variant="outline" size="lg">
    我再想想
  </Button>
</div>
```

---

## 表單元件

### 輸入框 (Input)

Input 元件提供多種視覺狀態，確保清晰的使用者反饋。

#### 視覺狀態

| 狀態 | 邊框色彩 | 背景色彩 | 文字色彩 | 無障礙屬性 |
|------|---------|---------|---------|----------|
| `default` | `#4d9966` | `#333333` | `#00ff88` | - |
| `focus` | `#00ffff` (青色) | `#333333` | `#00ff88` | `outline: 2px`, `box-shadow: 0 0 0 3px` |
| `error` | `#ff6666` | `#333333` | `#00ff88` | `aria-invalid="true"` |
| `success` | `#00cc66` | `#333333` | `#00ff88` | - |
| `disabled` | `#4d9966` | `#2d2d2d` | `#4d9966` | `disabled`, `cursor: not-allowed` |

#### 程式碼範例

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle } from "lucide-react"

// 預設狀態
<div className="space-y-2">
  <Label htmlFor="username">使用者名稱</Label>
  <Input
    id="username"
    type="text"
    placeholder="vault-dweller"
  />
</div>

// 錯誤狀態
<div className="space-y-2">
  <Label htmlFor="email">電子郵件</Label>
  <Input
    id="email"
    type="email"
    className="border-error-border"
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <p id="email-error" role="alert" className="text-sm text-error flex items-center gap-1">
    <AlertCircle size={16} aria-hidden="true" />
    <span>請輸入有效的電子郵件地址</span>
  </p>
</div>

// 成功狀態
<div className="space-y-2">
  <Label htmlFor="password">密碼</Label>
  <Input
    id="password"
    type="password"
    className="border-success-border"
    aria-describedby="password-success"
  />
  <p id="password-success" className="text-sm text-success flex items-center gap-1">
    <CheckCircle size={16} aria-hidden="true" />
    <span>密碼強度足夠</span>
  </p>
</div>
```

---

### 聚焦指示器規範

符合 WCAG 2.4.7（Focus Visible），確保鍵盤使用者清晰識別聚焦元素。

```css
.input-terminal:focus {
  border-color: var(--color-input-border-focus); /* 青色邊框 */
  outline: 2px solid var(--color-input-border-focus); /* 2px 外框 */
  outline-offset: 1px; /* 1px 偏移 */
  box-shadow: 0 0 0 3px var(--color-input-focus-ring); /* 3px 發光環 */
}
```

**規格**：
- 外框寬度：2px（最小）
- 外框偏移：1px
- 發光環：3px（rgba(0, 255, 255, 0.3)）
- 對比度：12.1:1（AAA 等級）

---

### 標籤 (Label)

Label 元件提供語義化標籤，與表單欄位關聯。

```tsx
import { Label } from "@/components/ui/label"

<Label htmlFor="input-id" className="text-text-primary font-medium">
  欄位標籤
</Label>
<Input id="input-id" />
```

**無障礙要求**：
- 必須使用 `htmlFor` 關聯輸入框
- 文字對比度 ≥ 4.5:1（WCAG AA）
- 支援 `peer-disabled:opacity-70`（停用狀態）

---

### 表單欄位組合

#### 完整表單欄位範例

```tsx
<div className="space-y-2">
  {/* 標籤 */}
  <Label htmlFor="email" className="text-text-primary">
    電子郵件地址
  </Label>

  {/* 輸入框 */}
  <Input
    id="email"
    type="email"
    value={email}
    onChange={handleEmailChange}
    className={emailError ? "border-error-border" : ""}
    aria-invalid={!!emailError}
    aria-describedby="email-helper email-error"
    placeholder="vault-dweller@wasteland.com"
  />

  {/* 輔助文字 */}
  <p id="email-helper" className="text-sm text-text-muted">
    我們不會分享您的電子郵件給第三方。
  </p>

  {/* 錯誤訊息（條件顯示） */}
  {emailError && (
    <p id="email-error" role="alert" className="text-sm text-error flex items-center gap-1">
      <AlertCircle size={16} aria-hidden="true" />
      <span>{emailError}</span>
    </p>
  )}

  {/* 成功訊息（條件顯示） */}
  {email && !emailError && (
    <p className="text-sm text-success flex items-center gap-1">
      <CheckCircle size={16} aria-hidden="true" />
      <span>電子郵件格式正確</span>
    </p>
  )}
</div>
```

**無障礙特性**：
- ✅ `htmlFor` 關聯標籤與輸入框
- ✅ `aria-invalid` 標記錯誤狀態
- ✅ `aria-describedby` 關聯輔助文字與錯誤訊息
- ✅ `role="alert"` 確保螢幕閱讀器朗讀錯誤
- ✅ 圖標 + 顏色 + 文字（支援色盲使用者）

---

## 卡片元件 (Card)

### 卡片變體

Card 元件提供基礎容器結構，支援巢狀內容與互動狀態。

| 變體 | 視覺處理 | 使用情境 |
|------|---------|---------|
| `default` | 深色背景、細邊框、8px 圓角 | 靜態內容卡片 |
| `elevated` | 深色背景 + 綠色發光陰影 | 強調內容卡片 |
| `ghost` | 透明背景、無邊框 | 低視覺權重容器 |
| `interactive` | hover 顯示邊框與背景變化 | 可點擊卡片 |

#### 程式碼範例

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"

// 預設卡片
<Card>
  <CardHeader>
    <CardTitle>任務詳情</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-text-secondary">清理廢水處理廠...</p>
  </CardContent>
  <CardFooter>
    <Button variant="default">接受任務</Button>
  </CardFooter>
</Card>

// 互動卡片
<Card className="cursor-pointer hover:border-border-primary hover:bg-bg-tertiary transition-all duration-200">
  <CardContent className="p-6">
    點擊查看詳情
  </CardContent>
</Card>
```

---

### 卡片結構

Card 元件由多個子元件組成，提供清晰的內容層級。

```tsx
<Card className="card-wasteland"> {/* 預設樣式於 globals.css */}

  {/* 標題區域（選用） */}
  <CardHeader className="flex flex-col space-y-1.5 p-6">
    <CardTitle className="text-pip-boy font-mono font-semibold">
      卡片標題
    </CardTitle>
    <CardDescription className="text-muted-wasteland">
      卡片描述文字
    </CardDescription>
  </CardHeader>

  {/* 主要內容 */}
  <CardContent className="p-6 pt-0">
    <p className="text-text-primary">主要內容區域</p>
  </CardContent>

  {/* 頁尾操作（選用） */}
  <CardFooter className="flex items-center p-6 pt-0">
    <Button variant="default">操作按鈕</Button>
  </CardFooter>

</Card>
```

---

### 卡片內容層級範例

#### 設定卡片

```tsx
<Card>
  <CardHeader>
    <CardTitle>音效設定</CardTitle>
    <CardDescription>調整音效與音樂音量</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="sfx-volume">音效音量</Label>
      <Input id="sfx-volume" type="range" min="0" max="100" defaultValue="80" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="music-volume">音樂音樂</Label>
      <Input id="music-volume" type="range" min="0" max="100" defaultValue="60" />
    </div>
  </CardContent>
  <CardFooter className="border-t border-border-muted pt-4">
    <Button variant="default">儲存設定</Button>
  </CardFooter>
</Card>
```

---

## 圖標系統 (Icons)

### 圖標尺寸

使用 **Lucide React** 圖標庫，提供標準化尺寸。

| 尺寸名稱 | 像素值 | Lucide `size` prop | 使用情境 |
|---------|-------|-------------------|---------|
| `xs` | 16px | `size={16}` | 內嵌文字圖標、表單欄位圖標 |
| `sm` | 20px | `size={20}` | 按鈕圖標、小型元件 |
| `md` | 24px | `size={24}` | 預設尺寸、導航圖標 |
| `lg` | 32px | `size={32}` | Section 標題圖標 |
| `xl` | 48px | `size={48}` | Hero 圖標、空狀態圖標 |

#### 程式碼範例

```tsx
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react"

// 內嵌文字圖標（16px）
<p className="flex items-center gap-1 text-sm">
  <CheckCircle size={16} className="text-success" />
  <span>操作成功</span>
</p>

// 按鈕圖標（20px）
<Button variant="default">
  <CheckCircle size={20} />
  確認
</Button>

// 空狀態圖標（48px）
<div className="flex flex-col items-center gap-3 text-center py-12">
  <Info size={48} className="text-info" />
  <p className="text-text-muted">尚無資料</p>
</div>
```

---

### 圖標使用模式

#### 1. **圖標 + 文字標籤（推薦）**

適用於大部分情境，確保清晰傳達功能。

```tsx
<Button variant="default">
  <Trash2 size={20} />
  <span>刪除</span>
</Button>
```

---

#### 2. **圖標單獨使用（需 Tooltip）**

適用於空間受限情境，必須提供 `aria-label`。

```tsx
<Button size="icon" variant="ghost" aria-label="關閉對話框">
  <X size={20} />
</Button>
```

**無障礙要求**：
- 必須提供 `aria-label` 描述功能
- 觸控目標最小 44×44px

---

### 狀態圖標

結合圖標形狀與功能色彩，支援色盲使用者（Req 6.4, 3.5）。

| 狀態 | 圖標 | 顏色 | 對比度 |
|------|------|------|--------|
| Success | `<CheckCircle />` | `text-success` (#00ff88) | 7.4:1 AAA ✅ |
| Warning | `<AlertTriangle />` | `text-warning` (#ffdd00) | 12.4:1 AAA ✅ |
| Error | `<XCircle />` | `text-error` (#ff4444) | 6.2:1 AA ✅ |
| Info | `<Info />` | `text-info` (#0088ff) | 5.1:1 AA ✅ |

#### 程式碼範例

```tsx
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react"

// 成功狀態
<div className="flex items-center gap-2 text-success">
  <CheckCircle size={20} aria-hidden="true" />
  <span>操作成功完成</span>
</div>

// 警告狀態
<div className="flex items-center gap-2 text-warning">
  <AlertTriangle size={20} aria-hidden="true" />
  <span>請謹慎操作</span>
</div>

// 錯誤狀態
<div className="flex items-center gap-2 text-error" role="alert">
  <XCircle size={20} aria-hidden="true" />
  <span>發生錯誤，請稍後再試</span>
</div>

// 資訊狀態
<div className="flex items-center gap-2 text-info">
  <Info size={20} aria-hidden="true" />
  <span>這是一則資訊提示</span>
</div>
```

**注意**：圖標使用 `aria-hidden="true"`，因為文字已提供完整資訊。

---

## 版面配置系統

### 響應式網格

使用 Tailwind CSS 的 12 欄網格系統，支援 5 個斷點（Req 4.1）。

#### 斷點定義

| 斷點 | 最小寬度 | 裝置類型 | Tailwind 前綴 |
|------|---------|---------|-------------|
| `xs` | 0px | 手機直向 | 無前綴 |
| `sm` | 640px | 手機橫向、小平板 | `sm:` |
| `md` | 768px | 平板直向 | `md:` |
| `lg` | 1024px | 平板橫向、小桌機 | `lg:` |
| `xl` | 1280px | 桌上型電腦 | `xl:` |
| `2xl` | 1536px | 大螢幕 | `2xl:` |

#### 響應式網格範例

```tsx
// 1 欄 → 2 欄 → 3 欄 → 4 欄
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <Card>卡片 1</Card>
  <Card>卡片 2</Card>
  <Card>卡片 3</Card>
  <Card>卡片 4</Card>
</div>

// 側邊欄版面（8:4 分割）
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  {/* 主要內容（8 欄） */}
  <main className="lg:col-span-8">
    主要內容區域
  </main>

  {/* 側邊欄（4 欄） */}
  <aside className="lg:col-span-4">
    側邊欄內容
  </aside>
</div>
```

---

### 容器寬度

提供 4 種容器最大寬度，確保最佳閱讀體驗（Req 4.3）。

| 容器類型 | 最大寬度 | Tailwind 類別 | 使用情境 |
|---------|---------|--------------|---------|
| Prose | 640px | `max-w-prose` | 長文閱讀、部落格文章 |
| Standard | 1024px | `max-w-4xl` | 標準內容頁面 |
| Wide | 1280px | `max-w-5xl` | 寬版面、儀表板 |
| Immersive | 100% | `max-w-full` | 全螢幕體驗、影片 |

#### 程式碼範例

```tsx
// Prose 容器（最佳閱讀行長 45-75 字元）
<div className="max-w-prose mx-auto px-4">
  <h1 className="text-4xl font-bold mb-4">文章標題</h1>
  <p className="text-base leading-relaxed">
    長文內容...
  </p>
</div>

// Standard 容器
<div className="max-w-4xl mx-auto px-6">
  標準內容頁面
</div>

// Wide 容器
<div className="max-w-5xl mx-auto px-8">
  寬版儀表板
</div>

// Immersive 容器
<div className="max-w-full px-4">
  全螢幕內容
</div>
```

---

### 間距系統

採用 **8px 基準單位系統**，確保垂直節奏一致（Req 4.2, 4.4）。

#### 常用間距模式

| 使用情境 | 推薦間距 | Tailwind 類別 | 像素值 |
|---------|---------|--------------|-------|
| 文字行距 | `2` | `space-y-2` | 16px |
| 卡片內邊距 | `4` 或 `6` | `p-4` 或 `p-6` | 32px 或 48px |
| Section 垂直間距 | `8` | `space-y-8` | 64px |
| 按鈕內邊距 | `px-4 py-2` | `px-4 py-2` | 16px × 32px |
| 表單欄位間距 | `3` | `space-y-3` | 24px |
| Page 間距 | `12` | `py-12` | 96px |

#### 程式碼範例

```tsx
// 表單欄位垂直間距（24px）
<form className="space-y-3">
  <div>
    <Label htmlFor="username">使用者名稱</Label>
    <Input id="username" />
  </div>
  <div>
    <Label htmlFor="email">電子郵件</Label>
    <Input id="email" type="email" />
  </div>
</form>

// Section 垂直間距（64px）
<div className="space-y-8">
  <section>Section 1</section>
  <section>Section 2</section>
  <section>Section 3</section>
</div>

// 卡片佈局（16px gap）
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card />
  <Card />
  <Card />
</div>
```

---

## 動畫標準

### 持續時間指引

符合 Req 7.1 指引，避免過長動畫影響使用者體驗。

| 名稱 | 持續時間 | Tailwind 類別 | 使用情境 | 限制 |
|------|---------|--------------|---------|------|
| `instant` | 100ms | `duration-100` | UI 反饋（按鈕按下） | ≤ 300ms |
| `fast` | 200ms | `duration-200` | Hover 狀態、顏色轉換 | ≤ 300ms |
| `normal` | 300ms | `duration-300` | 預設轉換 | ≤ 300ms |
| `slow` | 600ms | `duration-600` | 頁面轉換、複雜動畫 | ≤ 600ms |
| `terminal-cursor` | 1s | `animate-terminal-cursor` | 終端機游標閃爍 | 背景效果 |
| `radiation-pulse` | 1.5s | `animate-radiation-pulse` | 輻射脈衝 | 背景效果 |
| `scanline` | 2s | `animate-scan` | 掃描線效果 | 背景效果 |

#### 程式碼範例

```tsx
// 快速 hover 轉換（200ms）
<Button className="transition-all duration-200 hover:brightness-110">
  快速反饋
</Button>

// 標準轉換（300ms）
<div className="transition-colors duration-300 hover:bg-bg-tertiary">
  標準轉換
</div>

// 頁面轉換（600ms）
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: "easeOut" }}
>
  頁面內容
</motion.div>
```

---

### 緩動函數

| 名稱 | 貝茲曲線 | Tailwind 類別 | 使用情境 |
|------|---------|--------------|---------|
| `linear` | `linear` | `ease-linear` | 勻速動畫（掃描線） |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | `ease-in` | 加速動畫 |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | `ease-out` | 減速動畫（推薦） |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | `ease-in-out` | 平滑動畫（推薦） |

#### 程式碼範例

```tsx
// 減速進入（ease-out）
<div className="transition-transform duration-300 ease-out hover:scale-105">
  減速進入
</div>

// 平滑進出（ease-in-out）
<div className="transition-all duration-600 ease-in-out">
  平滑轉換
</div>
```

---

### Fallout 特效動畫

#### 掃描線效果

```tsx
// 背景掃描線（不影響內容可讀性）
<div className="relative">
  <div className="scan-lines" aria-hidden="true" />
  <div className="relative z-10">
    內容不受掃描線影響
  </div>
</div>
```

**規格**：
- 不透明度上限：30%（Req 7.5）
- 動畫持續時間：2s
- 線條高度：4px

---

#### 輻射脈衝

```tsx
<div className="radiation-pulse">
  輻射警告
</div>
```

**CSS 定義**（tailwind.config.ts:213-216）：

```css
@keyframes radiation-pulse {
  0%, 100% { box-shadow: 0 0 5px var(--color-glow-yellow); }
  50% { box-shadow: 0 0 15px var(--color-glow-yellow); }
}
```

---

#### 終端機游標閃爍

```tsx
<span className="animate-terminal-cursor">|</span>
```

**CSS 定義**（tailwind.config.ts:217-220）：

```css
@keyframes terminal-cursor {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
```

---

### Reduced Motion 支援

符合 `prefers-reduced-motion` 使用者偏好設定（Req 7.4）。

```css
@media (prefers-reduced-motion: reduce) {
  .particle,
  .scan-lines,
  .wasteland-grid {
    animation: none; /* 停用背景動畫 */
  }

  .btn-pip-boy,
  .interactive-element {
    transition: none; /* 停用轉換效果 */
  }
}
```

**程式碼範例**（自動生效）：

```tsx
// 瀏覽器自動處理，開發者無需額外設定
<Button variant="default">
  按鈕（自動支援 reduced motion）
</Button>
```

---

## 效能優化指南

### 字型載入策略

#### Next.js Font Optimization（自動優化）

```typescript
// app/layout.tsx（已實作）
import { JetBrains_Mono } from "next/font/google"
import localFont from "next/font/local"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap", // 防止 FOIT（Flash of Invisible Text）
})

const doto = localFont({
  src: "./fonts/Doto-Variable.ttf",
  variable: "--font-doto",
  display: "swap",
})
```

**優化特性**：
- ✅ `font-display: swap` 防止文字閃爍
- ✅ `subsets: ["latin"]` 限制字元集，減少檔案大小
- ✅ 自動預載入關鍵字型
- ✅ 系統字型作為 fallback（monospace）

---

### 動畫效能

#### GPU 加速屬性（推薦）

僅使用 `transform` 和 `opacity` 屬性，避免觸發重排（Req 10.2）。

```css
/* ✅ 高效能（GPU 加速） */
.smooth-animation {
  transform: translateX(0);
  opacity: 1;
  transition: transform 200ms, opacity 200ms;
}

.smooth-animation:hover {
  transform: translateX(10px);
  opacity: 0.8;
}
```

```css
/* ❌ 低效能（觸發重排） */
.avoid-this {
  width: 100px; /* 觸發 layout */
  left: 10px;   /* 觸發 layout */
  transition: width 200ms, left 200ms;
}
```

---

#### `will-change` 使用指引

僅用於頻繁動畫的元素，避免過度使用（Req 10.2）。

```css
/* ✅ 適當使用 */
.frequently-animated {
  will-change: transform; /* 僅 transform 屬性 */
}

/* ❌ 過度使用 */
.avoid-this {
  will-change: transform, opacity, width, height, left, top; /* 太多屬性 */
}
```

**注意**：`will-change` 會消耗記憶體，僅用於真正需要的元素。

---

### 背景效果優化

使用 CSS 漸層與 SVG 圖案，避免載入大型圖片（Req 10.3）。

#### CSS 漸層背景（已實作）

```css
.wasteland-background {
  background: linear-gradient(
    135deg,
    var(--color-wasteland-darker) 0%,
    var(--color-wasteland-dark) 25%,
    var(--color-wasteland-medium) 50%,
    var(--color-wasteland-dark) 75%,
    var(--color-wasteland-darker) 100%
  );
}
```

**優勢**：
- ✅ 零 HTTP 請求
- ✅ 可縮放至任意尺寸
- ✅ 檔案大小 < 1KB

---

#### CSS 網格紋理（已實作）

```css
.wasteland-grid {
  background-image:
    linear-gradient(var(--color-terminal-green) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-terminal-green) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.1; /* 不影響可讀性 */
}
```

---

### 效能目標

| 指標 | 目標值 | 當前狀態 | 工具 |
|------|--------|---------|------|
| Lighthouse Performance | > 90 | 待測量 | Lighthouse CI |
| Lighthouse Accessibility | > 90 | 待測量 | Lighthouse CI |
| First Contentful Paint (FCP) | < 1.5s | 待測量 | Lighthouse |
| Time to Interactive (TTI) | < 3.5s | 待測量 | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.1 | 待測量 | Lighthouse |
| CSS Bundle Size | < 50KB gzipped | 待測量 | Webpack Bundle Analyzer |

---

## 版本紀錄

| 版本 | 日期 | 變更內容 | 相關需求 |
|------|------|----------|---------|
| 1.0.0 | 2025-10-04 | 初始版本 - 完整元件庫文件 | Requirements 5, 6, 7, 10 |

---

**下一步**：閱讀 [03-patterns.md](./03-patterns.md) 了解常用 UI 模式。
