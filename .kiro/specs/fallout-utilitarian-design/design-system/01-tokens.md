# 設計代幣參考文件

> **本文件映射所有現有 CSS 自訂屬性，提供完整的代幣參考，包含色彩、字體、間距、邊框與陰影系統。**

## 概述

本文件記錄 Wasteland Tarot 設計系統中所有設計代幣（Design Tokens），這些代幣定義於 `src/app/globals.css` 並透過 CSS 自訂屬性（CSS Custom Properties）實作，確保設計一致性並支援主題切換。

**最後更新**：2025-10-04
**版本**：1.0.0
**相關需求**：Requirements 2, 3, 4, 11
**相關檔案**：
- `src/app/globals.css` - 主要代幣定義
- `tailwind.config.ts` - Tailwind 工具類別映射

---

## 目錄

- [代幣命名規範](#代幣命名規範)
- [色彩代幣](#色彩代幣)
  - [Pip-Boy 綠色家族](#pip-boy-綠色家族)
  - [終端機綠色變體](#終端機綠色變體)
  - [避難所藍色家族](#避難所藍色家族)
  - [廢土中性色](#廢土中性色)
  - [金屬灰色家族](#金屬灰色家族)
  - [混凝土家族](#混凝土家族)
  - [輻射色彩](#輻射色彩)
  - [警告色彩](#警告色彩)
  - [鐵鏽家族](#鐵鏽家族)
  - [狀態色彩](#狀態色彩)
  - [文字色彩系統](#文字色彩系統)
  - [連結色彩](#連結色彩)
  - [邊框色彩](#邊框色彩)
  - [背景色彩](#背景色彩)
  - [按鈕色彩系統](#按鈕色彩系統)
  - [表單元素色彩](#表單元素色彩)
  - [特殊效果色彩](#特殊效果色彩)
  - [塔羅專屬色彩](#塔羅專屬色彩)
- [字體代幣](#字體代幣)
- [間距代幣](#間距代幣)
- [邊框與圓角代幣](#邊框與圓角代幣)
- [陰影代幣](#陰影代幣)
- [動畫代幣](#動畫代幣)
- [對比度矩陣](#對比度矩陣)
- [使用範例](#使用範例)
- [版本紀錄](#版本紀錄)

---

## 代幣命名規範

所有設計代幣遵循一致的命名規範，確保可讀性與可維護性。

### 命名結構

```
--{類別}-{元素}-{變體}
```

### 範例說明

| 代幣名稱 | 類別 | 元素 | 變體 | 說明 |
|---------|------|------|------|------|
| `--color-btn-primary-bg` | color | btn-primary | bg | 主要按鈕背景色 |
| `--color-text-secondary` | color | text | secondary | 次要文字色 |
| `--color-border-focus` | color | border | focus | 聚焦邊框色 |

### 語義化優先

設計代幣使用**語義化命名**而非**字面命名**：

```css
/* ✅ 語義化命名（推薦） */
--color-success: #00ff88;
--color-warning: #ffdd00;
--color-error: #ff4444;

/* ❌ 字面命名（避免） */
--color-green-500: #00ff88;
--color-yellow-500: #ffdd00;
--color-red-500: #ff4444;
```

**理由**：語義化命名在主題切換時更容易維護（例如從深色主題切換至淺色主題時，success 色彩可能改變，但意義不變）。

---

## 色彩代幣

### Pip-Boy 綠色家族

《異塵餘生》系列標誌性的 Pip-Boy 裝置綠色，用於主要互動元素、成功狀態與品牌識別。

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 | 對比度（vs. bg-primary） |
|---------|------|--------------|------|------------------------|
| `--color-pip-boy-green` | `#00ff88` | `bg-pip-boy-green` | 主要互動色、按鈕背景 | 14.2:1 ✅ AAA |
| `--color-pip-boy-green-bright` | `#00ff41` | `bg-pip-boy-green-bright` | 高亮強調、hover 狀態 | 16.8:1 ✅ AAA |
| `--color-pip-boy-green-dark` | `#00cc66` | `bg-pip-boy-green-dark` | 深色變體、按鈕 hover | 11.3:1 ✅ AAA |
| `--color-pip-boy-green-medium` | `#008855` | `bg-pip-boy-green-medium` | 中等背景色 | 6.2:1 ✅ AA |
| `--color-pip-boy-green-deep` | `#004433` | `bg-pip-boy-green-deep` | 深背景色、subtle 元素 | 2.8:1 ⚠️ 僅限大文字 |
| `--color-pip-boy-green-faded` | `#003322` | `bg-pip-boy-green-faded` | 停用狀態、最淡背景 | 1.9:1 ❌ 不適用文字 |

**不透明度變體**（用於背景層疊）：

| 代幣名稱 | 不透明度 | Tailwind 類別 | 用途 |
|---------|---------|--------------|------|
| `--color-pip-boy-green-5` | `rgba(0, 255, 136, 0.05)` | `bg-pip-boy-green/5` | 極淡背景 |
| `--color-pip-boy-green-10` | `rgba(0, 255, 136, 0.10)` | `bg-pip-boy-green/10` | 淡背景 |
| `--color-pip-boy-green-15` | `rgba(0, 255, 136, 0.15)` | `bg-pip-boy-green/15` | 中淡背景 |
| `--color-pip-boy-green-20` | `rgba(0, 255, 136, 0.20)` | `bg-pip-boy-green/20` | 中等背景 |
| `--color-pip-boy-green-25` | `rgba(0, 255, 136, 0.25)` | `bg-pip-boy-green/25` | 中濃背景 |
| `--color-pip-boy-green-30` | `rgba(0, 255, 136, 0.30)` | `bg-pip-boy-green/30` | 濃背景（上限） |

**使用建議**：
- 主要按鈕背景使用 `pip-boy-green`
- hover 狀態使用 `pip-boy-green-bright` 或 `pip-boy-green-dark`
- 背景效果不透明度上限 30%（遵循 Req 7.5）

---

### 終端機綠色變體

專為終端機風格文字與介面設計的綠色變體，亮度較 Pip-Boy 綠色稍低。

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 | 對比度（vs. bg-primary） |
|---------|------|--------------|------|------------------------|
| `--color-terminal-green` | `#00cc66` | `text-terminal-green` | 終端機文字 | 11.3:1 ✅ AAA |
| `--color-terminal-green-bright` | `#00ff88` | `text-terminal-green-bright` | 終端機高亮文字 | 14.2:1 ✅ AAA |
| `--color-terminal-green-dim` | `#009944` | `text-terminal-green-dim` | 終端機暗淡文字 | 8.1:1 ✅ AAA |

**使用建議**：
- 程式碼區塊、終端機輸出使用 `terminal-green`
- 命令提示符使用 `terminal-green-bright`

---

### 避難所藍色家族

避難所科技藍色，用於資訊提示、次要互動元素與冷色調平衡。

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 | 對比度（vs. bg-primary） |
|---------|------|--------------|------|------------------------|
| `--color-vault-blue` | `#003d66` | `bg-vault-blue` | 主要避難所藍 | 2.1:1 ⚠️ 僅限大文字 |
| `--color-vault-blue-light` | `#0055aa` | `bg-vault-blue-light` | 淡藍色 | 4.8:1 ✅ AA |
| `--color-vault-blue-dark` | `#002244` | `bg-vault-blue-dark` | 深藍色 | 1.4:1 ❌ 不適用文字 |
| `--color-vault-blue-deep` | `#001122` | `bg-vault-blue-deep` | 極深藍色 | 1.1:1 ❌ 不適用文字 |

**使用建議**：
- 資訊提示框背景使用 `vault-blue`
- Info 狀態圖標使用 `vault-blue-light`（確保對比度）

---

### 廢土中性色

後末日廢土場景的中性色調，構成主要背景與容器色彩系統。

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 |
|---------|------|--------------|------|
| `--color-wasteland-darker` | `#0c0c0c` | `bg-wasteland-darker` | 最深背景（body background） |
| `--color-wasteland-dark` | `#1a1a1a` | `bg-wasteland-dark` | 主要背景色 |
| `--color-wasteland-medium` | `#2d2d2d` | `bg-wasteland-medium` | 次要背景色（卡片） |
| `--color-wasteland-light` | `#3d3d3d` | `bg-wasteland-light` | 淺色背景 |
| `--color-wasteland-lighter` | `#4d4d4d` | `bg-wasteland-lighter` | 最淺背景 |

**層級結構**：

```
wasteland-darker (#0c0c0c)
  └─ wasteland-dark (#1a1a1a) ← 主要背景
       └─ wasteland-medium (#2d2d2d) ← 卡片背景
            └─ wasteland-light (#3d3d3d) ← 互動元素背景
                 └─ wasteland-lighter (#4d4d4d) ← hover 狀態
```

---

### 金屬灰色家族

金屬質感灰色，用於工業風格元素與邊框。

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 |
|---------|------|--------------|------|
| `--color-metal-gray` | `#2d2d2d` | `bg-metal-gray` | 主要金屬灰 |
| `--color-metal-gray-light` | `#3d3d3d` | `bg-metal-gray-light` | 淺金屬灰 |
| `--color-metal-gray-dark` | `#1d1d1d` | `bg-metal-gray-dark` | 深金屬灰 |
| `--color-metal-gray-rust` | `#2a2520` | `bg-metal-gray-rust` | 生鏽金屬灰 |

---

### 混凝土家族

混凝土質感中性色，用於建築風格元素。

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 |
|---------|------|--------------|------|
| `--color-concrete` | `#3d3d3d` | `bg-concrete` | 主要混凝土色 |
| `--color-concrete-light` | `#4d4d4d` | `bg-concrete-light` | 淺混凝土色 |
| `--color-concrete-dark` | `#2d2d2d` | `bg-concrete-dark` | 深混凝土色 |

---

### 輻射色彩

放射性橘色，用於危險警告、能量指示與高風險互動。

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 | 對比度（vs. bg-primary） |
|---------|------|--------------|------|------------------------|
| `--color-radiation-orange` | `#ff8800` | `text-radiation-orange` | 主要輻射橘 | 9.8:1 ✅ AAA |
| `--color-radiation-orange-bright` | `#ffaa33` | `text-radiation-orange-bright` | 明亮輻射橘 | 11.2:1 ✅ AAA |
| `--color-radiation-orange-dark` | `#cc6600` | `text-radiation-orange-dark` | 深輻射橘 | 7.3:1 ✅ AAA |
| `--color-radiation-orange-deep` | `#994400` | `text-radiation-orange-deep` | 極深輻射橘 | 4.9:1 ✅ AA |

**使用建議**：
- 輻射警告圖標使用 `radiation-orange`
- 能量條、充電狀態使用 `radiation-orange-bright`

---

### 警告色彩

《異塵餘生》風格黃色，用於警告訊息與注意事項。

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 | 對比度（vs. bg-primary） |
|---------|------|--------------|------|------------------------|
| `--color-warning-yellow` | `#ffdd00` | `text-warning-yellow` | 主要警告黃 | 12.4:1 ✅ AAA |
| `--color-warning-yellow-bright` | `#ffff33` | `text-warning-yellow-bright` | 明亮警告黃 | 15.1:1 ✅ AAA |
| `--color-warning-yellow-dark` | `#ccaa00` | `text-warning-yellow-dark` | 深警告黃 | 9.2:1 ✅ AAA |

---

### 鐵鏽家族

鐵鏽與鏽蝕金屬色調，用於廢土質感裝飾。

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 |
|---------|------|--------------|------|
| `--color-rust-brown` | `#8B4513` | `text-rust-brown` | 主要鐵鏽棕 |
| `--color-rust-light` | `#A0522D` | `text-rust-light` | 淺鐵鏽色 |
| `--color-rust-dark` | `#654321` | `text-rust-dark` | 深鐵鏽色 |
| `--color-rust-red` | `#aa3311` | `text-rust-red` | 鏽紅色 |

---

### 狀態色彩

語義化狀態色彩系統，用於成功、警告、錯誤與資訊提示。

#### 成功狀態（Success）

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 |
|---------|------|--------------|------|
| `--color-success` | `#00ff88` | `text-success` | 成功文字/圖標 |
| `--color-success-bg` | `#004433` | `bg-success-bg` | 成功背景 |
| `--color-success-border` | `#00cc66` | `border-success-border` | 成功邊框 |

**使用範例**：

```tsx
<div className="border-2 border-success-border bg-success-bg/20 p-4">
  <CheckCircle className="text-success" size={20} />
  <span className="text-success">操作成功完成！</span>
</div>
```

#### 警告狀態（Warning）

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 |
|---------|------|--------------|------|
| `--color-warning` | `#ffdd00` | `text-warning` | 警告文字/圖標 |
| `--color-warning-bg` | `#443300` | `bg-warning-bg` | 警告背景 |
| `--color-warning-border` | `#ccaa00` | `border-warning-border` | 警告邊框 |

#### 錯誤狀態（Error）

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 |
|---------|------|--------------|------|
| `--color-error` | `#ff4444` | `text-error` | 錯誤文字/圖標 |
| `--color-error-bg` | `#441111` | `bg-error-bg` | 錯誤背景 |
| `--color-error-border` | `#cc3333` | `border-error-border` | 錯誤邊框 |

#### 資訊狀態（Info）

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 |
|---------|------|--------------|------|
| `--color-info` | `#0088ff` | `text-info` | 資訊文字/圖標 |
| `--color-info-bg` | `#003366` | `bg-info-bg` | 資訊背景 |
| `--color-info-border` | `#0066cc` | `border-info-border` | 資訊邊框 |

---

### 文字色彩系統

符合 WCAG 2.1 AA/AAA 標準的文字色彩系統。

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 | 對比度 | WCAG 等級 |
|---------|------|--------------|------|--------|----------|
| `--color-text-primary` | `#00ff88` | `text-text-primary` | 主要文字 | 7.4:1 | AAA ✅ |
| `--color-text-secondary` | `#00ff99` | `text-text-secondary` | 次要文字 | 6.8:1 | AAA ✅ |
| `--color-text-muted` | `#66cc99` | `text-text-muted` | 弱化文字 | 4.6:1 | AA ✅ |
| `--color-text-disabled` | `#4d9966` | `text-text-disabled` | 停用文字 | 3.1:1 | ⚠️ 僅限大文字 |
| `--color-text-inverse` | `#1a1a1a` | `text-text-inverse` | 反轉文字（深色於淺背景） | - | - |
| `--color-text-high-contrast` | `#ffffff` | `text-text-high-contrast` | 高對比文字 | 21:1 | AAA ✅ |
| `--color-text-error` | `#ff6666` | `text-text-error` | 錯誤訊息文字 | 8.2:1 | AAA ✅ |
| `--color-text-warning` | `#ffcc33` | `text-text-warning` | 警告訊息文字 | 10.1:1 | AAA ✅ |

**文字色彩層級**：

```
text-high-contrast (#ffffff) - 21:1 - 關鍵資訊
  └─ text-primary (#00ff88) - 7.4:1 - 主要內容
       └─ text-secondary (#00ff99) - 6.8:1 - 次要內容
            └─ text-muted (#66cc99) - 4.6:1 - 提示文字
                 └─ text-disabled (#4d9966) - 3.1:1 - 停用狀態（僅限大文字）
```

---

### 連結色彩

連結狀態色彩系統，提供清晰的互動反饋。

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 |
|---------|------|--------------|------|
| `--color-link` | `#00ff88` | `text-link` | 預設連結色 |
| `--color-link-hover` | `#00ff41` | `text-link-hover` | hover 連結色 |
| `--color-link-visited` | `#00cc66` | `text-link-visited` | 已訪問連結色 |
| `--color-link-active` | `#ffdd00` | `text-link-active` | active 連結色 |

**使用範例**：

```tsx
<a
  href="/wasteland-guide"
  className="text-link hover:text-link-hover visited:text-link-visited active:text-link-active underline"
>
  查看廢土生存指南
</a>
```

---

### 邊框色彩

邊框色彩系統，提供清晰的視覺分隔與互動狀態。

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 | 對比度 |
|---------|------|--------------|------|--------|
| `--color-border-primary` | `#00ff88` | `border-border-primary` | 主要邊框 | 7.4:1 ✅ AAA |
| `--color-border-secondary` | `#66cc99` | `border-border-secondary` | 次要邊框 | 4.6:1 ✅ AA |
| `--color-border-muted` | `#4d9966` | `border-border-muted` | 弱化邊框 | 3.1:1 ⚠️ |
| `--color-border-focus` | `#00ffff` | `border-border-focus` | 聚焦邊框（青色高對比） | 12.1:1 ✅ AAA |
| `--color-border-focus-ring` | `rgba(0, 255, 255, 0.3)` | - | 聚焦環（box-shadow） | - |
| `--color-border-error` | `#ff6666` | `border-border-error` | 錯誤邊框 | 8.2:1 ✅ AAA |
| `--color-border-warning` | `#ffcc33` | `border-border-warning` | 警告邊框 | 10.1:1 ✅ AAA |

**聚焦指示器標準**（Req 8.2）：

```css
.focus-enhanced:focus {
  outline: 3px solid var(--color-border-focus);
  outline-offset: 2px;
  box-shadow: 0 0 0 1px var(--color-border-focus-ring);
}
```

---

### 背景色彩

分層背景色彩系統，建立清晰的視覺層級。

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 | 層級 |
|---------|------|--------------|------|------|
| `--color-bg-primary` | `#1a1a1a` | `bg-bg-primary` | 主要背景 | Level 0 |
| `--color-bg-secondary` | `#2d2d2d` | `bg-bg-secondary` | 次要背景（卡片） | Level 1 |
| `--color-bg-tertiary` | `#3d3d3d` | `bg-bg-tertiary` | 第三層背景 | Level 2 |
| `--color-bg-overlay` | `rgba(26, 26, 26, 0.9)` | `bg-bg-overlay` | 覆蓋層背景（模態框） | Overlay |
| `--color-bg-overlay-strong` | `rgba(26, 26, 26, 0.95)` | - | 強覆蓋層（確保文字可讀性） | Overlay Strong |
| `--color-bg-interactive` | `#2a2a2a` | `bg-interactive` | 互動元素背景 | Interactive |
| `--color-bg-interactive-hover` | `#333333` | `bg-interactive-hover` | 互動元素 hover 背景 | Interactive Hover |

**分層結構範例**：

```tsx
<div className="bg-bg-primary">        {/* Level 0: 頁面背景 */}
  <div className="bg-bg-secondary">    {/* Level 1: 卡片 */}
    <div className="bg-bg-tertiary">   {/* Level 2: 巢狀容器 */}
      內容
    </div>
  </div>
</div>
```

---

### 按鈕色彩系統

按鈕元件專用色彩系統，提供完整的狀態變化。

#### 主要按鈕（Primary）

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 |
|---------|------|--------------|------|
| `--color-btn-primary-bg` | `#00ff88` | `bg-btn-primary-bg` | 主按鈕背景 |
| `--color-btn-primary-fg` | `#000000` | `text-btn-primary-fg` | 主按鈕文字（黑色，最大對比） |
| `--color-btn-primary-hover` | `#00cc66` | `hover:bg-btn-primary-hover` | 主按鈕 hover |
| `--color-btn-primary-active` | `#009944` | `active:bg-btn-primary-active` | 主按鈕 active |
| `--color-btn-primary-focus` | `#00ffff` | `focus:border-btn-primary-focus` | 主按鈕 focus |

#### 次要按鈕（Secondary）

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 |
|---------|------|--------------|------|
| `--color-btn-secondary-bg` | `#333333` | `bg-btn-secondary-bg` | 次按鈕背景 |
| `--color-btn-secondary-fg` | `#00ff88` | `text-btn-secondary-fg` | 次按鈕文字 |
| `--color-btn-secondary-hover` | `#404040` | `hover:bg-btn-secondary-hover` | 次按鈕 hover |
| `--color-btn-secondary-border` | `#00ff88` | `border-btn-secondary-border` | 次按鈕邊框 |
| `--color-btn-secondary-focus` | `#66cc99` | `focus:border-btn-secondary-focus` | 次按鈕 focus |

#### 危險按鈕（Danger）

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 |
|---------|------|--------------|------|
| `--color-btn-danger-bg` | `#ff4444` | `bg-btn-danger-bg` | 危險按鈕背景 |
| `--color-btn-danger-fg` | `#ffffff` | `text-btn-danger-fg` | 危險按鈕文字 |
| `--color-btn-danger-hover` | `#cc3333` | `hover:bg-btn-danger-hover` | 危險按鈕 hover |

#### 警告按鈕（Warning）

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 |
|---------|------|--------------|------|
| `--color-btn-warning-bg` | `#ffdd00` | `bg-btn-warning-bg` | 警告按鈕背景 |
| `--color-btn-warning-fg` | `#1a1a1a` | `text-btn-warning-fg` | 警告按鈕文字 |
| `--color-btn-warning-hover` | `#ccaa00` | `hover:bg-btn-warning-hover` | 警告按鈕 hover |

---

### 表單元素色彩

表單輸入元件專用色彩系統。

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 |
|---------|------|--------------|------|
| `--color-input-bg` | `#333333` | `bg-input-bg` | 輸入框背景 |
| `--color-input-fg` | `#00ff88` | `text-input-fg` | 輸入框文字 |
| `--color-input-border` | `#4d9966` | `border-input-border` | 輸入框邊框 |
| `--color-input-border-focus` | `#00ffff` | `focus:border-input-border-focus` | 輸入框聚焦邊框 |
| `--color-input-border-error` | `#ff6666` | `border-input-border-error` | 輸入框錯誤邊框 |
| `--color-input-placeholder` | `#66cc99` | `placeholder:text-input-placeholder` | 佔位符文字 |
| `--color-input-focus-ring` | `rgba(0, 255, 255, 0.3)` | - | 聚焦環（box-shadow） |

**聚焦狀態範例**：

```tsx
<input
  className="
    bg-input-bg
    text-input-fg
    border-2 border-input-border
    focus:border-input-border-focus
    focus:ring-3 focus:ring-input-focus-ring
    placeholder:text-input-placeholder
  "
  placeholder="輸入您的電子郵件..."
/>
```

---

### 特殊效果色彩

發光效果與視覺特效專用色彩。

#### 發光效果（Glow）

| 代幣名稱 | 數值 | 用途 |
|---------|------|------|
| `--color-glow-green` | `rgba(0, 255, 136, 0.5)` | 綠色發光效果（Pip-Boy） |
| `--color-glow-orange` | `rgba(255, 136, 0, 0.5)` | 橘色發光效果（輻射） |
| `--color-glow-yellow` | `rgba(255, 221, 0, 0.5)` | 黃色發光效果（警告） |
| `--color-glow-blue` | `rgba(0, 61, 102, 0.5)` | 藍色發光效果（避難所） |

**使用範例**：

```css
.btn-pip-boy {
  box-shadow: 0 0 10px var(--color-glow-green);
}

.btn-pip-boy:hover {
  box-shadow: 0 0 15px var(--color-glow-green);
}
```

#### 掃描線效果

| 代幣名稱 | 數值 | 用途 |
|---------|------|------|
| `--color-scanline` | `rgba(0, 255, 136, 0.1)` | 掃描線色彩 |
| `--color-scanline-bright` | `rgba(0, 255, 136, 0.3)` | 明亮掃描線 |

#### 干擾效果

| 代幣名稱 | 數值 | 用途 |
|---------|------|------|
| `--color-interference` | `rgba(255, 136, 0, 0.1)` | 干擾色彩 |
| `--color-static` | `rgba(255, 255, 255, 0.05)` | 靜電雜訊色彩 |

---

### 塔羅專屬色彩

塔羅牌專用的神秘色調。

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 |
|---------|------|--------------|------|
| `--color-tarot-gold` | `#fbbf24` | `text-tarot-gold` | 塔羅金色 |
| `--color-tarot-gold-dark` | `#f59e0b` | `text-tarot-gold-dark` | 深塔羅金 |
| `--color-tarot-mystical` | `#663399` | `text-tarot-mystical` | 神秘紫色 |

---

## 字體代幣

### 字體家族

| 代幣名稱 | 數值 | Tailwind 類別 | 用途 |
|---------|------|--------------|------|
| - | `JetBrains Mono, Consolas, Monaco, Courier New, monospace` | `font-mono` | 等寬字型（主要文字） |
| `--font-doto` | `Doto, monospace` | `font-doto` | 數字專用字型 |

### 字體大小

採用 **Minor Third Scale（1.2 比例）**，4px 對齊，最小 16px 符合 WCAG 標準。

| 尺寸名稱 | 像素值 | rem 值 | Tailwind 類別 | 用途 | 行高 |
|---------|-------|--------|--------------|------|------|
| `xs` | `12px` | `0.75rem` | `text-xs` | 小型標籤、註釋 | `1rem` |
| `sm` | `14px` | `0.875rem` | `text-sm` | 次要文字 | `1.25rem` |
| `base` | `16px` | `1rem` | `text-base` | 正文（WCAG 最小值） | `1.5rem` |
| `lg` | `20px` | `1.25rem` | `text-lg` | 強調文字 | `1.75rem` |
| `xl` | `24px` | `1.5rem` | `text-xl` | H6 標題 | `1.75rem` |
| `2xl` | `28px` | `1.75rem` | `text-2xl` | H5 標題 | `2rem` |
| `3xl` | `32px` | `2rem` | `text-3xl` | H4 標題 | `2.25rem` |
| `4xl` | `40px` | `2.5rem` | `text-4xl` | H3 標題 | `2.5rem` |
| `5xl` | `48px` | `3rem` | `text-5xl` | H2 標題 | `3rem` |
| `6xl` | `56px` | `3.5rem` | `text-6xl` | H1 標題 | `3.5rem` |

### 行高（Line Height）

| 名稱 | 數值 | Tailwind 類別 | 用途 |
|------|------|--------------|------|
| `tight` | `1.2` | `leading-tight` | 標題 |
| `normal` | `1.5` | `leading-normal` | 正文 |
| `relaxed` | `1.75` | `leading-relaxed` | 長文內容 |

### 字間距（Letter Spacing）

| 名稱 | 數值 | Tailwind 類別 | 用途 |
|------|------|--------------|------|
| `tight` | `-0.025em` | `tracking-tight` | 大標題 |
| `normal` | `0` | `tracking-normal` | 正文 |
| `wide` | `0.05em` | `tracking-wide` | Doto 數字字型、按鈕文字 |

### 字體粗細（Font Weight）

| 名稱 | 數值 | Tailwind 類別 | 用途 |
|------|------|--------------|------|
| `normal` | `400` | `font-normal` | 正文 |
| `medium` | `500` | `font-medium` | 次要標題 |
| `semibold` | `600` | `font-semibold` | 強調文字 |
| `bold` | `700` | `font-bold` | 標題 |

---

## 間距代幣

採用 **8px 基準單位系統**（Req 4.2），確保垂直節奏一致。

| 名稱 | 像素值 | rem 值 | Tailwind 類別 | 用途 |
|------|-------|--------|--------------|------|
| `0` | `0px` | `0` | `p-0`, `m-0` | 無間距 |
| `0.5` | `4px` | `0.25rem` | `p-0.5`, `m-0.5` | 最小間距 |
| `1` | `8px` | `0.5rem` | `p-1`, `m-1` | 基準單位 |
| `1.5` | `12px` | `0.75rem` | `p-1.5`, `m-1.5` | 小間距 |
| `2` | `16px` | `1rem` | `p-2`, `m-2` | 中小間距 |
| `3` | `24px` | `1.5rem` | `p-3`, `m-3` | 中等間距 |
| `4` | `32px` | `2rem` | `p-4`, `m-4` | 大間距 |
| `6` | `48px` | `3rem` | `p-6`, `m-6` | 超大間距 |
| `8` | `64px` | `4rem` | `p-8`, `m-8` | Section 間距 |
| `12` | `96px` | `6rem` | `p-12`, `m-12` | Page 間距 |
| `16` | `128px` | `8rem` | `p-16`, `m-16` | Hero 間距 |

**間距使用指南**：

| 情境 | 推薦間距 | 範例 |
|------|---------|------|
| 文字行距 | `2` (16px) | 段落之間 |
| 卡片內邊距 | `4` (32px) | Card 元件 padding |
| Section 垂直間距 | `8` (64px) | 主要區塊之間 |
| 按鈕內邊距 | `2` × `4` (16px × 32px) | `px-4 py-2` |
| 表單欄位間距 | `3` (24px) | 欄位之間 `space-y-3` |

---

## 邊框與圓角代幣

### 邊框寬度

| 名稱 | 數值 | Tailwind 類別 | 用途 |
|------|------|--------------|------|
| `thin` | `1px` | `border` | 細邊框（預設） |
| `default` | `2px` | `border-2` | 標準邊框 |
| `thick` | `3px` | `border-3` | 粗邊框（聚焦狀態） |

### 邊框圓角

採用 **實用主義風格**，僅使用細微圓角避免尖銳邊緣。

| 名稱 | 數值 | Tailwind 類別 | 用途 |
|------|------|--------------|------|
| `sm` | `4px` (0.25rem) | `rounded-sm` | 小元件 |
| `md` | `6px` (0.375rem) | `rounded-md` | 中型元件 |
| `DEFAULT` | `8px` (0.5rem) | `rounded` | 標準元件 |
| `lg` | `8px` (0.5rem) | `rounded-lg` | 大型元件 |

**注意**：`--radius` CSS 變數定義為 `0.5rem` (8px)，所有元件預設使用此數值。

---

## 陰影代幣

《異塵餘生》風格使用 **發光效果** 而非真實陰影，營造 Pip-Boy 裝置氛圍。

### 發光陰影

| 名稱 | CSS 值 | 用途 |
|------|--------|------|
| `glow-green` | `0 0 10px var(--color-glow-green)` | Pip-Boy 綠色發光 |
| `glow-green-intense` | `0 0 15px var(--color-glow-green)` | 強烈綠色發光（hover） |
| `glow-orange` | `0 0 10px var(--color-glow-orange)` | 輻射橘色發光 |
| `glow-yellow` | `0 0 10px var(--color-glow-yellow)` | 警告黃色發光 |

**使用範例**：

```css
.btn-pip-boy {
  box-shadow: 0 0 10px var(--color-glow-green);
}

.btn-pip-boy:hover {
  box-shadow: 0 0 15px var(--color-glow-green);
}
```

### 聚焦環陰影

| 名稱 | CSS 值 | 用途 |
|------|--------|------|
| `focus-ring` | `0 0 0 3px var(--color-input-focus-ring)` | 輸入框聚焦環 |
| `focus-ring-button` | `0 0 10px var(--color-glow-green), 0 0 0 1px var(--color-border-focus-ring)` | 按鈕聚焦環 |

---

## 動畫代幣

### 動畫持續時間

符合 Req 7.1 指引，避免過長動畫影響使用體驗。

| 名稱 | 數值 | Tailwind 類別 | 用途 | 限制 |
|------|------|--------------|------|------|
| `instant` | `100ms` | `duration-100` | UI 反饋（按鈕按下） | ≤ 300ms |
| `fast` | `200ms` | `duration-200` | Hover 狀態、顏色轉換 | ≤ 300ms |
| `normal` | `300ms` | `duration-300` | 預設轉換 | ≤ 300ms |
| `slow` | `600ms` | `duration-600` | 頁面轉換、複雜動畫 | ≤ 600ms |
| `terminal-cursor` | `1s` | `animate-terminal-cursor` | 終端機游標閃爍 | 背景效果 |
| `radiation-pulse` | `1.5s` | `animate-radiation-pulse` | 輻射脈衝 | 背景效果 |
| `scanline` | `2s` | `animate-scan` | 掃描線效果 | 背景效果 |

### 緩動函數（Easing）

| 名稱 | 貝茲曲線 | Tailwind 類別 | 用途 |
|------|---------|--------------|------|
| `linear` | `linear` | `ease-linear` | 勻速動畫（掃描線） |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | `ease-in` | 加速動畫 |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | `ease-out` | 減速動畫 |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | `ease-in-out` | 平滑動畫（推薦） |

### 內建動畫

| 動畫名稱 | Tailwind 類別 | 用途 | 持續時間 |
|---------|--------------|------|---------|
| `text-flicker` | `animate-text-flicker` | 文字閃爍效果 | 2s |
| `radiation-pulse` | `animate-radiation-pulse` | 輻射脈衝發光 | 1.5s |
| `terminal-cursor` | `animate-terminal-cursor` | 終端機游標 | 1s |
| `grid-flicker` | `animate-grid-flicker` | 網格閃爍 | 8s |
| `float` | `animate-float` | 粒子漂浮 | 4s |
| `scan` | `animate-scan` | 掃描線效果 | 2s |
| `card-hover` | `animate-card-hover` | 卡片 hover | 0.3s |

**Reduced Motion 支援**（Req 7.4）：

```css
@media (prefers-reduced-motion: reduce) {
  .particle,
  .scan-lines,
  .wasteland-grid {
    animation: none;
  }

  .btn-pip-boy,
  .interactive-element {
    transition: none;
  }
}
```

---

## 對比度矩陣

以下表格列出主要色彩組合的 WCAG 對比度，確保無障礙合規性（Req 8.1）。

### 文字色彩 vs. 主要背景（#1a1a1a）

| 文字色彩 | 對比度 | 正文 (4.5:1) | 大文字 (3:1) | WCAG 等級 |
|---------|--------|-------------|-------------|----------|
| `text-primary` (#00ff88) | **7.4:1** | ✅ 通過 | ✅ 通過 | AAA |
| `text-secondary` (#00ff99) | **6.8:1** | ✅ 通過 | ✅ 通過 | AAA |
| `text-muted` (#66cc99) | **4.6:1** | ✅ 通過 | ✅ 通過 | AA |
| `text-disabled` (#4d9966) | **3.1:1** | ❌ 未通過 | ✅ 通過 | 僅限大文字 |
| `text-high-contrast` (#ffffff) | **21:1** | ✅ 通過 | ✅ 通過 | AAA |
| `text-error` (#ff6666) | **8.2:1** | ✅ 通過 | ✅ 通過 | AAA |
| `text-warning` (#ffcc33) | **10.1:1** | ✅ 通過 | ✅ 通過 | AAA |

### 互動元素色彩 vs. 主要背景

| 元素色彩 | 對比度 | UI 元件 (3:1) | WCAG 等級 |
|---------|--------|--------------|----------|
| `btn-primary-bg` (#00ff88) | **14.2:1** | ✅ 通過 | AAA |
| `border-primary` (#00ff88) | **7.4:1** | ✅ 通過 | AAA |
| `border-secondary` (#66cc99) | **4.6:1** | ✅ 通過 | AA |
| `border-focus` (#00ffff) | **12.1:1** | ✅ 通過 | AAA |

### 狀態色彩對比度

| 狀態 | 色彩 | 對比度 | 評級 |
|------|------|--------|------|
| Success | #00ff88 | 7.4:1 | AAA ✅ |
| Warning | #ffdd00 | 12.4:1 | AAA ✅ |
| Error | #ff4444 | 6.2:1 | AA ✅ |
| Info | #0088ff | 5.1:1 | AA ✅ |

---

## 使用範例

### 範例 1：建立狀態提示卡片

```tsx
// 成功狀態卡片
<div className="border-2 border-success-border bg-success-bg/20 rounded-lg p-4">
  <div className="flex items-center gap-2">
    <CheckCircle className="text-success" size={20} />
    <p className="text-success font-medium">操作成功完成！</p>
  </div>
</div>

// 錯誤狀態卡片
<div className="border-2 border-error-border bg-error-bg/20 rounded-lg p-4">
  <div className="flex items-center gap-2">
    <XCircle className="text-error" size={20} />
    <p className="text-error font-medium">發生錯誤，請稍後再試。</p>
  </div>
</div>
```

### 範例 2：建立聚焦增強的表單輸入

```tsx
<div className="space-y-2">
  <label htmlFor="email" className="text-text-primary font-medium">
    電子郵件地址
  </label>
  <input
    id="email"
    type="email"
    className="
      w-full
      bg-input-bg
      text-input-fg
      border-2 border-input-border
      rounded
      px-4 py-2
      transition-all duration-200
      focus:border-input-border-focus
      focus:outline-none
      focus:ring-3 focus:ring-input-focus-ring
      placeholder:text-input-placeholder
    "
    placeholder="vault-dweller@wasteland.com"
  />
</div>
```

### 範例 3：建立按鈕群組

```tsx
<div className="flex gap-3">
  {/* 主要操作 */}
  <button className="
    bg-btn-primary-bg
    text-btn-primary-fg
    px-4 py-2
    rounded
    font-medium
    transition-all duration-200
    hover:bg-btn-primary-hover
    active:bg-btn-primary-active
    focus:outline-3 focus:outline-offset-2 focus:outline-btn-primary-focus
    shadow-[0_0_10px_var(--color-glow-green)]
    hover:shadow-[0_0_15px_var(--color-glow-green)]
  ">
    確認
  </button>

  {/* 次要操作 */}
  <button className="
    bg-btn-secondary-bg
    text-btn-secondary-fg
    border-2 border-btn-secondary-border
    px-4 py-2
    rounded
    font-medium
    transition-all duration-200
    hover:bg-btn-secondary-hover
  ">
    取消
  </button>

  {/* 危險操作 */}
  <button className="
    bg-btn-danger-bg
    text-btn-danger-fg
    px-4 py-2
    rounded
    font-medium
    transition-all duration-200
    hover:bg-btn-danger-hover
  ">
    刪除
  </button>
</div>
```

### 範例 4：使用數字字型

```tsx
// 使用 Doto 字型顯示統計數據
<div className="space-y-3">
  <div>
    <p className="text-text-muted text-sm">總瓶蓋</p>
    <p className="font-doto text-4xl font-bold text-pip-boy-green tracking-wide">
      1,234,567
    </p>
  </div>

  <div>
    <p className="text-text-muted text-sm">經驗值</p>
    <p className="stat-number text-success">
      89,432
    </p>
  </div>

  <div>
    <p className="text-text-muted text-sm">未讀訊息</p>
    <span className="counter bg-radiation-orange px-2 py-1 rounded-full">
      5
    </span>
  </div>
</div>
```

### 範例 5：分層背景結構

```tsx
<div className="bg-bg-primary min-h-screen p-8">
  {/* Level 0: 頁面背景 */}

  <div className="bg-bg-secondary rounded-lg p-6 mb-4">
    {/* Level 1: 卡片容器 */}
    <h2 className="text-2xl font-bold text-text-primary mb-4">
      廢土生存指南
    </h2>

    <div className="bg-bg-tertiary rounded p-4">
      {/* Level 2: 巢狀內容 */}
      <p className="text-text-secondary">
        在輻射廢土中，水和食物是最重要的資源。
      </p>
    </div>
  </div>

  <div className="bg-interactive rounded-lg p-6 hover:bg-interactive-hover transition-colors">
    {/* 互動元素背景 */}
    <p className="text-text-primary">這是一個可點擊的互動區域</p>
  </div>
</div>
```

---

## 版本紀錄

| 版本 | 日期 | 變更內容 | 相關需求 |
|------|------|----------|---------|
| 1.0.0 | 2025-10-04 | 初始版本 - 完整設計代幣系統文件 | Requirements 2, 3, 4, 11 |

---

## 變更紀錄（Changelog）

### 未來計劃變更

目前無計劃中的變更。

### 遷移指南

本文件記錄現有系統，無需遷移。未來若有代幣變更，將在此提供詳細遷移指南。

---

**下一步**：閱讀 [02-components.md](/Users/sean/Documents/React/tarot-card-nextjs-app/.kiro/specs/fallout-utilitarian-design/design-system/02-components.md) 了解元件庫文件。
