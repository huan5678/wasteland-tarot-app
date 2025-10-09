# 快速開始指南

> **5 分鐘快速上手 Wasteland Tarot 設計系統，包含常用配方與故障排除。**

## 概述

本文件提供開發者快速參考，協助新團隊成員在短時間內開始使用設計系統建立一致的介面。包含常用元件配方、開發流程與故障排除指引。

**最後更新**：2025-10-04
**版本**：1.0.0
**相關需求**：Requirements 12.1, 12.2, 12.3
**相關檔案**：
- [00-philosophy.md](./00-philosophy.md) - 設計哲學
- [01-tokens.md](./01-tokens.md) - 設計代幣參考
- [02-components.md](./02-components.md) - 元件庫
- [03-patterns.md](./03-patterns.md) - UI 模式

---

## 目錄

- [快速開始](#快速開始)
  - [環境需求](#環境需求)
  - [專案設定](#專案設定)
- [常用元件配方](#常用元件配方)
  - [按鈕](#按鈕)
  - [表單欄位](#表單欄位)
  - [卡片](#卡片)
  - [狀態提示](#狀態提示)
- [常用佈局配方](#常用佈局配方)
  - [頁面容器](#頁面容器)
  - [響應式網格](#響應式網格)
- [開發流程](#開發流程)
  - [建立新頁面](#建立新頁面)
  - [新增新元件](#新增新元件)
- [故障排除](#故障排除)
  - [樣式未生效](#樣式未生效)
  - [對比度不足](#對比度不足)
  - [聚焦指示器未顯示](#聚焦指示器未顯示)
- [參考資源](#參考資源)

---

## 快速開始

### 環境需求

| 項目 | 版本 | 說明 |
|------|------|------|
| Node.js | ≥ 18.0.0 | 後端執行環境 |
| bun | 最新版 | 前端套件管理工具 |
| Next.js | ≥ 14.0.0 | React 框架 |
| Tailwind CSS | ≥ 3.4.0 | CSS 框架 |
| TypeScript | ≥ 5.0.0 | 類型系統 |

---

### 專案設定

設計系統已內建於專案中，無需額外安裝。

#### 1. **檢查設定檔案**

確認以下檔案已正確配置：

```bash
# 檢查 globals.css
cat src/app/globals.css | head -50

# 檢查 tailwind.config.ts
cat tailwind.config.ts | head -30
```

#### 2. **字型載入**

Doto 字型已透過 Next.js Font Optimization 自動載入：

```typescript
// src/app/layout.tsx
import localFont from "next/font/local"

const doto = localFont({
  src: "./fonts/Doto-Variable.ttf",
  variable: "--font-doto",
  display: "swap",
})
```

#### 3. **元件庫位置**

所有 UI 元件位於 `src/components/ui/`：

```
src/components/ui/
├── button.tsx
├── input.tsx
├── label.tsx
├── card.tsx
└── ...
```

---

## 常用元件配方

### 按鈕

#### 主要操作按鈕

```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">
  確認
</Button>
```

#### 危險操作按鈕（帶圖標）

```tsx
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

<Button variant="destructive">
  <Trash2 size={20} />
  刪除
</Button>
```

#### 次要操作按鈕

```tsx
<Button variant="outline">
  取消
</Button>
```

#### 圖標按鈕

```tsx
import { X } from "lucide-react"

<Button size="icon" variant="ghost" aria-label="關閉">
  <X size={20} />
</Button>
```

---

### 表單欄位

#### 基本輸入框

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="username">使用者名稱</Label>
  <Input id="username" type="text" placeholder="vault-dweller" />
</div>
```

#### 錯誤狀態輸入框

```tsx
import { AlertCircle } from "lucide-react"

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
```

#### 成功狀態輸入框

```tsx
import { CheckCircle } from "lucide-react"

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

### 卡片

#### 基本卡片

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

<Card>
  <CardHeader>
    <CardTitle>卡片標題</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-text-secondary">卡片內容...</p>
  </CardContent>
  <CardFooter>
    <Button variant="default">操作按鈕</Button>
  </CardFooter>
</Card>
```

#### 互動卡片（可點擊）

```tsx
<Card className="cursor-pointer hover:border-border-primary hover:bg-bg-tertiary transition-all duration-200">
  <CardContent className="p-6">
    點擊查看詳情
  </CardContent>
</Card>
```

---

### 狀態提示

#### 成功提示

```tsx
import { CheckCircle } from "lucide-react"

<div className="border-2 border-success-border bg-success-bg/20 rounded-lg p-4">
  <div className="flex items-center gap-2">
    <CheckCircle size={20} className="text-success" aria-hidden="true" />
    <p className="text-success font-medium">操作成功完成！</p>
  </div>
</div>
```

#### 錯誤提示

```tsx
import { XCircle } from "lucide-react"

<div className="border-2 border-error-border bg-error-bg/20 rounded-lg p-4" role="alert">
  <div className="flex items-center gap-2">
    <XCircle size={20} className="text-error" aria-hidden="true" />
    <p className="text-error font-medium">發生錯誤，請稍後再試</p>
  </div>
</div>
```

#### 警告提示

```tsx
import { AlertTriangle } from "lucide-react"

<div className="border-2 border-warning-border bg-warning-bg/20 rounded-lg p-4">
  <div className="flex items-center gap-2">
    <AlertTriangle size={20} className="text-warning" aria-hidden="true" />
    <p className="text-warning font-medium">請注意此操作不可逆</p>
  </div>
</div>
```

---

## 常用佈局配方

### 頁面容器

#### Prose 容器（文章閱讀）

```tsx
export default function ArticlePage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-prose mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold text-text-primary mb-4">
          文章標題
        </h1>
        <p className="text-base text-text-primary leading-relaxed">
          內容...
        </p>
      </div>
    </div>
  )
}
```

#### Standard 容器（標準頁面）

```tsx
export default function StandardPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-text-primary mb-8">
          頁面標題
        </h1>
        {/* 內容 */}
      </div>
    </div>
  )
}
```

#### Wide 容器（儀表板）

```tsx
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-5xl mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold text-text-primary mb-8">
          儀表板
        </h1>
        {/* 內容 */}
      </div>
    </div>
  )
}
```

---

### 響應式網格

#### 1 欄 → 2 欄 → 3 欄

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>卡片 1</Card>
  <Card>卡片 2</Card>
  <Card>卡片 3</Card>
</div>
```

#### 側邊欄佈局（8:4 分割）

```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  {/* 主要內容（8 欄） */}
  <main className="lg:col-span-8">
    主要內容
  </main>

  {/* 側邊欄（4 欄） */}
  <aside className="lg:col-span-4">
    側邊欄
  </aside>
</div>
```

---

## 開發流程

### 建立新頁面

#### 1. **建立頁面檔案**

```bash
# 建立新頁面
touch src/app/your-page/page.tsx
```

#### 2. **使用頁面範本**

```tsx
// src/app/your-page/page.tsx
export default function YourPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* 頁面標題 */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary">
            頁面標題
          </h1>
        </header>

        {/* 主要內容 */}
        <main className="space-y-6">
          <Card>
            <CardContent className="p-6">
              內容區域
            </CardContent>
          </Card>
        </main>

      </div>
    </div>
  )
}
```

#### 3. **測試無障礙性**

```bash
# 執行開發伺服器
bun dev

# 開啟 Chrome DevTools → Lighthouse
# 執行無障礙性檢查
```

---

### 新增新元件

#### 1. **建立元件檔案**

```bash
# 建立新元件
touch src/components/ui/your-component.tsx
```

#### 2. **使用元件範本**

```tsx
// src/components/ui/your-component.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface YourComponentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "alternate"
}

const YourComponent = React.forwardRef<HTMLDivElement, YourComponentProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // 基礎樣式
          "rounded-lg p-4",
          // 變體樣式
          variant === "default" && "bg-bg-secondary text-text-primary",
          variant === "alternate" && "bg-bg-tertiary text-text-secondary",
          // 自訂樣式
          className
        )}
        {...props}
      />
    )
  }
)

YourComponent.displayName = "YourComponent"

export { YourComponent }
```

#### 3. **匯出元件**

```typescript
// 確保從元件檔案匯出
export { YourComponent } from "./your-component"
```

---

## 故障排除

### 樣式未生效

#### 問題：Tailwind 類別無作用

**可能原因**：
1. Tailwind 類別名稱錯誤
2. CSS 優先順序衝突
3. Tailwind 設定未包含檔案

**解決方案**：

```bash
# 1. 檢查 tailwind.config.ts content 設定
cat tailwind.config.ts

# 確認包含你的檔案路徑
content: [
  "./src/**/*.{js,ts,jsx,tsx,mdx}",
]

# 2. 重新啟動開發伺服器
bun dev

# 3. 清除 Next.js 快取
rm -rf .next
bun dev
```

---

### 對比度不足

#### 問題：文字對比度不符合 WCAG AA 標準

**診斷工具**：

1. 開啟 Chrome DevTools
2. 選取元素
3. 查看「Accessibility」面板
4. 檢查「Contrast」數值

**解決方案**：

```tsx
// ❌ 對比度不足
<p className="text-text-disabled">
  重要訊息
</p>

// ✅ 使用高對比度文字
<p className="text-text-primary">
  重要訊息
</p>

// ✅ 使用 AAA 等級文字
<p className="text-text-high-contrast">
  關鍵資訊
</p>
```

**參考對比度**（vs. #1a1a1a）：

| 文字色彩 | 對比度 | WCAG 等級 |
|---------|--------|----------|
| `text-primary` | 7.4:1 | AAA ✅ |
| `text-secondary` | 6.8:1 | AAA ✅ |
| `text-muted` | 4.6:1 | AA ✅ |
| `text-disabled` | 3.1:1 | ⚠️ 僅限大文字 |

---

### 聚焦指示器未顯示

#### 問題：鍵盤導航時無聚焦外框

**可能原因**：
1. `outline: none` 覆蓋預設樣式
2. 未使用 `focus-visible` 偽類

**解決方案**：

```tsx
// ❌ 移除聚焦指示器（無障礙問題）
<Button className="outline-none">
  按鈕
</Button>

// ✅ 使用內建聚焦指示器
<Button>
  按鈕
</Button>

// ✅ 自訂高對比度聚焦指示器
<Button className="
  outline-none
  focus-visible:outline-3
  focus-visible:outline-offset-2
  focus-visible:outline-border-focus
  focus-visible:ring-2
  focus-visible:ring-border-focus-ring
">
  按鈕
</Button>
```

---

## 參考資源

### 設計系統文件

| 文件 | 用途 |
|------|------|
| [00-philosophy.md](./00-philosophy.md) | 設計哲學與原則 |
| [01-tokens.md](./01-tokens.md) | 色彩、字體、間距代幣 |
| [02-components.md](./02-components.md) | 元件庫參考 |
| [03-patterns.md](./03-patterns.md) | UI 模式目錄 |
| [05-accessibility.md](./05-accessibility.md) | 無障礙指南 |

---

### 外部資源

#### WCAG 指南

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

#### Tailwind CSS

- [Tailwind CSS 官方文件](https://tailwindcss.com/docs)
- [Tailwind CSS 配色工具](https://tailwindcss.com/docs/customizing-colors)

#### React & Next.js

- [Next.js 官方文件](https://nextjs.org/docs)
- [React 官方文件](https://react.dev/)

#### 無障礙測試

- [Axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Pa11y](https://pa11y.org/)

---

### 常用快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `Tab` | 移動至下一個可聚焦元素 |
| `Shift + Tab` | 移動至上一個可聚焦元素 |
| `Enter` / `Space` | 啟動按鈕 |
| `Esc` | 關閉模態框/對話框 |
| `Cmd/Ctrl + K` | 開啟命令面板（若有） |

---

### 聯絡與支援

如有問題或建議，請聯絡設計系統維護團隊。

---

## 版本紀錄

| 版本 | 日期 | 變更內容 | 相關需求 |
|------|------|----------|---------|
| 1.0.0 | 2025-10-04 | 初始版本 - 快速開始指南 | Requirements 12.1, 12.2, 12.3 |

---

**恭喜！** 您已準備好開始使用 Wasteland Tarot 設計系統建立一致且無障礙的介面。
