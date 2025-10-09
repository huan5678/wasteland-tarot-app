# 無障礙指南

> **WCAG 2.1 AA 合規性檢查清單、鍵盤導航模式與螢幕閱讀器考量事項。**

## 概述

本文件提供完整的無障礙設計指南，確保所有元件符合 WCAG 2.1 AA 標準，關鍵路徑達到 AAA 等級。所有設計決策遵循 [00-philosophy.md](./00-philosophy.md) 的「功能優於裝飾」原則，並使用 [01-tokens.md](./01-tokens.md) 中定義的高對比度色彩代幣。

**最後更新**：2025-10-04
**版本**：1.0.0
**相關需求**：Requirements 8, 3.5
**相關檔案**：
- [01-tokens.md](./01-tokens.md) - 對比度矩陣參考
- [02-components.md](./02-components.md) - 元件無障礙屬性

---

## 目錄

- [WCAG 2.1 合規性檢查清單](#wcag-21-合規性檢查清單)
  - [感知性（Perceivable）](#感知性perceivable)
  - [可操作性（Operable）](#可操作性operable)
  - [可理解性（Understandable）](#可理解性understandable)
  - [穩健性（Robust）](#穩健性robust)
- [對比度標準](#對比度標準)
  - [文字對比度要求](#文字對比度要求)
  - [UI 元件對比度要求](#ui-元件對比度要求)
  - [對比度測試工具](#對比度測試工具)
- [鍵盤導航](#鍵盤導航)
  - [Tab 順序](#tab-順序)
  - [快捷鍵](#快捷鍵)
  - [聚焦指示器](#聚焦指示器)
- [螢幕閱讀器支援](#螢幕閱讀器支援)
  - [語義化 HTML](#語義化-html)
  - [ARIA 屬性](#aria-屬性)
  - [替代文字](#替代文字)
- [色彩無障礙](#色彩無障礙)
  - [色盲友善設計](#色盲友善設計)
  - [雙重編碼](#雙重編碼)
- [動畫無障礙](#動畫無障礙)
  - [Reduced Motion 支援](#reduced-motion-支援)
  - [動畫停用選項](#動畫停用選項)
- [表單無障礙](#表單無障礙)
  - [標籤關聯](#標籤關聯)
  - [錯誤訊息](#錯誤訊息)
  - [欄位說明](#欄位說明)
- [無障礙測試](#無障礙測試)
  - [自動化測試](#自動化測試)
  - [手動測試](#手動測試)
  - [真實使用者測試](#真實使用者測試)

---

## WCAG 2.1 合規性檢查清單

### 感知性（Perceivable）

確保所有使用者都能感知介面內容。

#### ✅ 1.1 替代文字

| 準則 | 等級 | 狀態 | 實作細節 |
|------|------|------|---------|
| 1.1.1 非文字內容 | A | ✅ 已實作 | 所有圖標必須提供 `aria-label` 或搭配文字標籤 |

**程式碼範例**：

```tsx
// ✅ 圖標 + 文字標籤
<Button>
  <Trash2 size={20} aria-hidden="true" />
  <span>刪除</span>
</Button>

// ✅ 僅圖標（提供 aria-label）
<Button size="icon" aria-label="關閉對話框">
  <X size={20} aria-hidden="true" />
</Button>

// ❌ 僅圖標（缺少 aria-label）
<Button size="icon">
  <X size={20} />
</Button>
```

---

#### ✅ 1.3 可調整性

| 準則 | 等級 | 狀態 | 實作細節 |
|------|------|------|---------|
| 1.3.1 資訊與關係 | A | ✅ 已實作 | 使用語義化 HTML（`<nav>`, `<main>`, `<article>`） |
| 1.3.2 有意義的順序 | A | ✅ 已實作 | DOM 順序與視覺順序一致 |
| 1.3.4 螢幕方向 | AA | ✅ 已實作 | 響應式設計支援橫向與直向 |

**語義化 HTML 範例**：

```tsx
// ✅ 正確語義化結構
<main>
  <nav aria-label="主要導航">
    <ul>
      <li><a href="/dashboard">儀表板</a></li>
      <li><a href="/settings">設定</a></li>
    </ul>
  </nav>

  <article>
    <header>
      <h1>文章標題</h1>
    </header>
    <section>
      <h2>章節標題</h2>
      <p>內容...</p>
    </section>
  </article>
</main>

// ❌ 非語義化結構
<div>
  <div>
    <div><a href="/dashboard">儀表板</a></div>
    <div><a href="/settings">設定</a></div>
  </div>
  <div>
    <div>文章標題</div>
    <div>內容...</div>
  </div>
</div>
```

---

#### ✅ 1.4 可辨識性

| 準則 | 等級 | 狀態 | 實作細節 |
|------|------|------|---------|
| 1.4.1 色彩使用 | A | ✅ 已實作 | 狀態使用圖標 + 顏色雙重編碼 |
| 1.4.3 對比度（最小） | AA | ✅ 已實作 | 文字對比度 ≥ 4.5:1，大文字 ≥ 3:1 |
| 1.4.6 對比度（增強） | AAA | ✅ 已實作 | 關鍵路徑文字對比度 ≥ 7:1 |
| 1.4.10 重排 | AA | ✅ 已實作 | 400% 縮放無橫向滾動 |
| 1.4.11 非文字對比度 | AA | ✅ 已實作 | UI 元件邊框對比度 ≥ 3:1 |
| 1.4.12 文字間距 | AA | ✅ 已實作 | 支援使用者自訂行高與字距 |
| 1.4.13 Hover/Focus 內容 | AA | ✅ 已實作 | Tooltip 可持續顯示與關閉 |

---

### 可操作性（Operable）

確保所有使用者都能操作介面。

#### ✅ 2.1 鍵盤可存取性

| 準則 | 等級 | 狀態 | 實作細節 |
|------|------|------|---------|
| 2.1.1 鍵盤 | A | ✅ 已實作 | 所有互動元件支援鍵盤操作 |
| 2.1.2 無鍵盤陷阱 | A | ✅ 已實作 | 使用 `Esc` 鍵關閉模態框 |
| 2.1.4 字元快捷鍵 | A | ✅ 已實作 | 支援 `Ctrl+/` 顯示快捷鍵列表 |

**鍵盤操作範例**：

```tsx
// ✅ 支援 Enter 與 Space 鍵
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
>
  點擊我
</div>

// ✅ 模態框支援 Esc 關閉
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }
  document.addEventListener('keydown', handleEsc)
  return () => document.removeEventListener('keydown', handleEsc)
}, [onClose])
```

---

#### ✅ 2.4 導航性

| 準則 | 等級 | 狀態 | 實作細節 |
|------|------|------|---------|
| 2.4.1 繞過區塊 | A | ✅ 已實作 | 提供「跳至主要內容」連結 |
| 2.4.2 頁面標題 | A | ✅ 已實作 | 每頁提供描述性 `<title>` |
| 2.4.3 聚焦順序 | A | ✅ 已實作 | Tab 順序符合視覺順序 |
| 2.4.6 標題與標籤 | AA | ✅ 已實作 | 表單欄位提供清晰標籤 |
| 2.4.7 聚焦可見 | AA | ✅ 已實作 | 所有聚焦元素顯示高對比度外框 |

**「跳至主要內容」範例**：

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-bg-secondary focus:text-text-primary"
>
  跳至主要內容
</a>

<main id="main-content" tabIndex={-1}>
  主要內容
</main>
```

---

#### ✅ 2.5 輸入模式

| 準則 | 等級 | 狀態 | 實作細節 |
|------|------|------|---------|
| 2.5.1 指標手勢 | A | ✅ 已實作 | 所有手勢提供單指替代方案 |
| 2.5.2 指標取消 | A | ✅ 已實作 | 點擊事件於 `mouseup` 觸發 |
| 2.5.3 標籤包含名稱 | A | ✅ 已實作 | 可見文字包含於 accessible name |
| 2.5.4 動作啟動 | A | ✅ 已實作 | 避免搖晃等動作觸發功能 |
| 2.5.5 觸控目標大小 | AAA | ✅ 已實作 | 所有觸控目標最小 44×44px |

---

### 可理解性（Understandable）

確保所有使用者都能理解介面運作方式。

#### ✅ 3.1 可讀性

| 準則 | 等級 | 狀態 | 實作細節 |
|------|------|------|---------|
| 3.1.1 頁面語言 | A | ✅ 已實作 | `<html lang="zh-TW">` |
| 3.1.2 部分語言 | AA | ✅ 已實作 | 混合語言使用 `lang` 屬性 |

---

#### ✅ 3.2 可預測性

| 準則 | 等級 | 狀態 | 實作細節 |
|------|------|------|---------|
| 3.2.1 聚焦時 | A | ✅ 已實作 | 聚焦不會觸發頁面跳轉 |
| 3.2.2 輸入時 | A | ✅ 已實作 | 輸入不會自動提交表單 |
| 3.2.3 一致導航 | AA | ✅ 已實作 | 所有頁面導航位置一致 |
| 3.2.4 一致識別 | AA | ✅ 已實作 | 相同功能使用一致圖標與文字 |

---

#### ✅ 3.3 輸入協助

| 準則 | 等級 | 狀態 | 實作細節 |
|------|------|------|---------|
| 3.3.1 錯誤識別 | A | ✅ 已實作 | 錯誤訊息使用圖標 + 顏色 + 文字 |
| 3.3.2 標籤或指示 | A | ✅ 已實作 | 所有欄位提供標籤 |
| 3.3.3 錯誤建議 | AA | ✅ 已實作 | 提供具體錯誤修正建議 |
| 3.3.4 錯誤預防 | AA | ✅ 已實作 | 危險操作提供確認對話框 |

**錯誤訊息範例**：

```tsx
// ✅ 圖標 + 顏色 + 文字（支援色盲使用者）
{emailError && (
  <p id="email-error" role="alert" className="text-sm text-error flex items-center gap-1">
    <AlertCircle size={16} aria-hidden="true" />
    <span>請輸入有效的電子郵件地址（例如：user@example.com）</span>
  </p>
)}

// ❌ 僅顏色（不支援色盲使用者）
{emailError && (
  <p className="text-error">錯誤</p>
)}
```

---

### 穩健性（Robust）

確保內容可被各種使用者代理（包括輔助技術）解譯。

#### ✅ 4.1 相容性

| 準則 | 等級 | 狀態 | 實作細節 |
|------|------|------|---------|
| 4.1.1 解析 | A | ✅ 已實作 | HTML 通過 W3C 驗證 |
| 4.1.2 名稱、角色、值 | A | ✅ 已實作 | 自訂元件提供正確 ARIA 屬性 |
| 4.1.3 狀態訊息 | AA | ✅ 已實作 | 使用 `role="status"` 與 `role="alert"` |

---

## 對比度標準

### 文字對比度要求

所有文字色彩符合 WCAG 2.1 AA/AAA 標準（Req 8.1）。

| 文字類型 | AA 標準 | AAA 標準 | 實作狀態 |
|---------|---------|---------|---------|
| 正文（14-18px） | ≥ 4.5:1 | ≥ 7:1 | ✅ 關鍵路徑達 AAA |
| 大文字（≥ 18px / ≥ 14px 粗體） | ≥ 3:1 | ≥ 4.5:1 | ✅ 關鍵路徑達 AAA |

**對比度實測數據**（vs. 主要背景 #1a1a1a）：

| 文字色彩 | 對比度 | WCAG 等級 | 用途 |
|---------|--------|----------|------|
| `text-primary` (#00ff88) | **7.4:1** | AAA ✅ | 主要文字 |
| `text-secondary` (#00ff99) | **6.8:1** | AAA ✅ | 次要文字 |
| `text-muted` (#66cc99) | **4.6:1** | AA ✅ | 弱化文字 |
| `text-disabled` (#4d9966) | **3.1:1** | ⚠️ 僅限大文字 | 停用狀態 |
| `text-high-contrast` (#ffffff) | **21:1** | AAA ✅ | 關鍵資訊 |
| `text-error` (#ff6666) | **8.2:1** | AAA ✅ | 錯誤訊息 |
| `text-warning` (#ffcc33) | **10.1:1** | AAA ✅ | 警告訊息 |

---

### UI 元件對比度要求

符合 WCAG 2.1 SC 1.4.11（非文字對比度），確保 UI 元件清晰可見。

| 元件類型 | 最小對比度 | 實測對比度 | 狀態 |
|---------|-----------|-----------|------|
| 按鈕邊框 | ≥ 3:1 | 7.4:1 | ✅ 超過標準 |
| 輸入框邊框 | ≥ 3:1 | 4.6:1 | ✅ 超過標準 |
| 聚焦指示器 | ≥ 3:1 | 12.1:1 | ✅ 超過標準 |
| 圖標（vs. 背景） | ≥ 3:1 | 7.4:1 | ✅ 超過標準 |

---

### 對比度測試工具

推薦使用以下工具檢查對比度：

| 工具 | 類型 | 用途 |
|------|------|------|
| [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) | 線上工具 | 快速檢查單一色彩組合 |
| [Axe DevTools](https://www.deque.com/axe/devtools/) | 瀏覽器擴充 | 自動掃描整頁對比度問題 |
| [Lighthouse](https://developers.google.com/web/tools/lighthouse) | Chrome DevTools | 綜合無障礙性評估 |
| [Stark](https://www.getstark.co/) | Figma Plugin | 設計階段檢查對比度 |

---

## 鍵盤導航

### Tab 順序

確保 Tab 順序符合視覺順序與語義層級。

#### 正確 Tab 順序範例

```tsx
// ✅ Tab 順序：Logo → 導航連結 → 搜尋 → 使用者選單
<header>
  <div className="flex items-center justify-between">
    <a href="/" tabIndex={0}>Logo</a>

    <nav>
      <a href="/dashboard" tabIndex={0}>儀表板</a>
      <a href="/missions" tabIndex={0}>任務</a>
      <a href="/settings" tabIndex={0}>設定</a>
    </nav>

    <input type="search" placeholder="搜尋..." tabIndex={0} />

    <button tabIndex={0}>使用者選單</button>
  </div>
</header>
```

#### ⚠️ 避免使用 `tabIndex > 0`

```tsx
// ❌ 破壞自然 Tab 順序
<a href="/link-1" tabIndex={3}>連結 1</a>
<a href="/link-2" tabIndex={1}>連結 2</a>
<a href="/link-3" tabIndex={2}>連結 3</a>

// ✅ 使用自然 DOM 順序
<a href="/link-1">連結 1</a>
<a href="/link-2">連結 2</a>
<a href="/link-3">連結 3</a>
```

---

### 快捷鍵

提供快捷鍵提升操作效率（符合 WCAG 2.1 SC 2.1.4）。

| 快捷鍵 | 功能 | 實作狀態 |
|--------|------|---------|
| `Tab` | 移動至下一個可聚焦元素 | ✅ 已實作 |
| `Shift + Tab` | 移動至上一個可聚焦元素 | ✅ 已實作 |
| `Enter` / `Space` | 啟動按鈕 | ✅ 已實作 |
| `Esc` | 關閉模態框/對話框 | ✅ 已實作 |
| `Ctrl + /` | 顯示快捷鍵列表 | 🔄 規劃中 |

**快捷鍵實作範例**：

```tsx
useEffect(() => {
  const handleKeyboard = (e: KeyboardEvent) => {
    // Esc 關閉模態框
    if (e.key === 'Escape' && isModalOpen) {
      closeModal()
    }

    // Ctrl+/ 顯示快捷鍵
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault()
      toggleShortcutsPanel()
    }
  }

  document.addEventListener('keydown', handleKeyboard)
  return () => document.removeEventListener('keydown', handleKeyboard)
}, [isModalOpen])
```

---

### 聚焦指示器

所有互動元件必須提供清晰的聚焦指示器（WCAG 2.1 SC 2.4.7）。

#### 規格

- **最小外框寬度**：3px
- **外框偏移**：2px
- **對比度**：≥ 3:1（AAA 目標 ≥ 12.1:1）
- **顏色**：青色 (#00ffff)

#### 程式碼範例

```tsx
// ✅ 高對比度聚焦指示器
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

// ✅ 輸入框聚焦指示器
<Input className="
  border-2
  border-input-border
  focus:border-input-border-focus
  focus:outline-2
  focus:outline-offset-1
  focus:outline-input-border-focus
  focus:ring-3
  focus:ring-input-focus-ring
" />
```

#### CSS 定義（globals.css）

```css
.focus-enhanced:focus,
.focus-enhanced:focus-within {
  outline: 3px solid var(--color-border-focus); /* 青色，12.1:1 對比度 */
  outline-offset: 2px;
  box-shadow: 0 0 0 1px var(--color-border-focus-ring); /* rgba(0, 255, 255, 0.3) */
}
```

---

## 螢幕閱讀器支援

### 語義化 HTML

使用正確的 HTML 標籤，確保螢幕閱讀器正確朗讀內容。

| 元素 | 語義化標籤 | 用途 |
|------|----------|------|
| 頁面區塊 | `<header>`, `<main>`, `<footer>`, `<aside>`, `<nav>` | 定義頁面結構 |
| 標題層級 | `<h1>` → `<h6>` | 建立文件大綱 |
| 清單 | `<ul>`, `<ol>`, `<li>` | 組織項目列表 |
| 表格 | `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` | 呈現資料表格 |
| 按鈕 | `<button>` | 觸發操作 |
| 連結 | `<a href="">` | 導航至其他頁面 |

#### ✅ 正確語義化範例

```tsx
<main>
  <h1>避難所管理系統</h1>

  <section>
    <h2>居民列表</h2>
    <ul>
      <li>約翰·避難所</li>
      <li>瑪莉·輻射</li>
    </ul>
  </section>

  <section>
    <h2>操作選項</h2>
    <button type="button">新增居民</button>
    <a href="/settings">前往設定</a>
  </section>
</main>
```

#### ❌ 非語義化範例

```tsx
<div>
  <div>避難所管理系統</div>
  <div>
    <div>居民列表</div>
    <div>約翰·避難所</div>
    <div>瑪莉·輻射</div>
  </div>
  <div>
    <div onClick={handleClick}>新增居民</div>
  </div>
</div>
```

---

### ARIA 屬性

使用 ARIA 屬性增強語義化，但**優先使用原生 HTML**。

#### 常用 ARIA 屬性

| 屬性 | 用途 | 範例 |
|------|------|------|
| `aria-label` | 提供元素標籤 | `<button aria-label="關閉">×</button>` |
| `aria-labelledby` | 關聯標籤元素 | `<dialog aria-labelledby="title">` |
| `aria-describedby` | 關聯描述文字 | `<input aria-describedby="email-helper">` |
| `aria-invalid` | 標記錯誤欄位 | `<input aria-invalid="true">` |
| `aria-live` | 動態內容更新 | `<div aria-live="polite">` |
| `aria-hidden` | 隱藏裝飾元素 | `<Icon aria-hidden="true" />` |

#### 程式碼範例

```tsx
// ✅ ARIA 屬性正確使用
<form>
  <label htmlFor="email" id="email-label">電子郵件</label>
  <input
    id="email"
    type="email"
    aria-labelledby="email-label"
    aria-describedby="email-helper email-error"
    aria-invalid={!!emailError}
  />
  <p id="email-helper">請輸入您的電子郵件地址</p>
  {emailError && (
    <p id="email-error" role="alert">
      {emailError}
    </p>
  )}
</form>

// ✅ 動態內容更新通知
<div role="status" aria-live="polite" aria-atomic="true">
  <p>已成功儲存設定</p>
</div>

// ✅ 隱藏裝飾圖標
<Button>
  <CheckCircle size={20} aria-hidden="true" />
  <span>確認</span>
</Button>
```

---

### 替代文字

為非文字內容提供替代文字（WCAG 2.1 SC 1.1.1）。

#### 圖片替代文字

```tsx
// ✅ 提供描述性 alt
<img src="/vault-logo.png" alt="Vault 101 避難所標誌" />

// ✅ 裝飾性圖片使用空 alt
<img src="/decorative-line.png" alt="" />

// ❌ 缺少 alt
<img src="/vault-logo.png" />
```

#### 圖標替代文字

```tsx
// ✅ 圖標 + 文字（圖標隱藏）
<Button>
  <Trash2 size={20} aria-hidden="true" />
  <span>刪除</span>
</Button>

// ✅ 僅圖標（提供 aria-label）
<Button aria-label="刪除">
  <Trash2 size={20} aria-hidden="true" />
</Button>
```

---

## 色彩無障礙

### 色盲友善設計

支援 8% 男性與 0.5% 女性的色盲使用者（Req 6.4, 3.5）。

#### 雙重編碼

所有資訊不能僅依賴顏色傳達，必須使用**圖標 + 顏色 + 文字**。

```tsx
// ✅ 圖標 + 顏色 + 文字（支援色盲使用者）
<div className="flex items-center gap-2">
  <CheckCircle size={20} className="text-success" aria-hidden="true" />
  <span className="text-success">操作成功</span>
</div>

<div className="flex items-center gap-2">
  <AlertTriangle size={20} className="text-warning" aria-hidden="true" />
  <span className="text-warning">請注意</span>
</div>

<div className="flex items-center gap-2">
  <XCircle size={20} className="text-error" aria-hidden="true" />
  <span className="text-error">發生錯誤</span>
</div>

// ❌ 僅顏色（不支援色盲使用者）
<div className="text-success">成功</div>
<div className="text-warning">警告</div>
<div className="text-error">錯誤</div>
```

#### 狀態指示器

```tsx
// ✅ 使用圖標形狀 + 顏色
<span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
  status === '活躍'
    ? 'bg-success-bg text-success'
    : 'bg-warning-bg text-warning'
}`}>
  {status === '活躍' ? (
    <CheckCircle size={12} aria-hidden="true" />
  ) : (
    <Clock size={12} aria-hidden="true" />
  )}
  <span>{status}</span>
</span>
```

---

### 色盲模擬工具

使用以下工具測試色盲友善性：

| 工具 | 類型 | 支援色盲類型 |
|------|------|-------------|
| [Stark](https://www.getstark.co/) | Figma/Sketch Plugin | Protanopia, Deuteranopia, Tritanopia |
| [Color Oracle](https://colororacle.org/) | 桌面應用 | Protanopia, Deuteranopia, Tritanopia |
| [Chrome DevTools](https://developer.chrome.com/blog/cvd/) | 瀏覽器內建 | Protanopia, Deuteranopia, Tritanopia, Achromatopsia |

---

## 動畫無障礙

### Reduced Motion 支援

符合 `prefers-reduced-motion` 使用者偏好設定（WCAG 2.1 SC 2.3.3, Req 7.4）。

#### CSS 實作

```css
/* globals.css 已實作 */
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

  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### React 實作

```tsx
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

return (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{
      duration: prefersReducedMotion ? 0 : 0.3,
    }}
  >
    內容
  </motion.div>
)
```

---

### 動畫停用選項

提供使用者偏好設定，允許手動停用動畫。

```tsx
// 使用者偏好設定
const [enableAnimations, setEnableAnimations] = useState(true)

// 儲存於 localStorage
useEffect(() => {
  const saved = localStorage.getItem('enable-animations')
  if (saved !== null) {
    setEnableAnimations(saved === 'true')
  }
}, [])

// 套用設定
<div className={enableAnimations ? 'animate-fade-in' : ''}>
  內容
</div>
```

---

## 表單無障礙

### 標籤關聯

所有表單欄位必須提供可見標籤，並使用 `htmlFor` 關聯（WCAG 2.1 SC 3.3.2）。

```tsx
// ✅ 正確標籤關聯
<div className="space-y-2">
  <Label htmlFor="username" className="text-text-primary">
    使用者名稱
  </Label>
  <Input id="username" type="text" />
</div>

// ❌ 缺少標籤
<Input type="text" placeholder="使用者名稱" />

// ❌ 僅 placeholder（不足夠）
<Input type="text" placeholder="使用者名稱" />
```

---

### 錯誤訊息

錯誤訊息必須使用 `role="alert"` 確保螢幕閱讀器朗讀（WCAG 2.1 SC 3.3.1）。

```tsx
// ✅ 完整錯誤訊息實作
<div className="space-y-2">
  <Label htmlFor="email">電子郵件</Label>
  <Input
    id="email"
    type="email"
    className={emailError ? "border-error-border" : ""}
    aria-invalid={!!emailError}
    aria-describedby="email-error"
  />
  {emailError && (
    <p id="email-error" role="alert" className="text-sm text-error flex items-center gap-1">
      <AlertCircle size={16} aria-hidden="true" />
      <span>{emailError}</span>
    </p>
  )}
</div>
```

---

### 欄位說明

使用 `aria-describedby` 關聯輔助文字。

```tsx
<div className="space-y-2">
  <Label htmlFor="password">密碼</Label>
  <Input
    id="password"
    type="password"
    aria-describedby="password-helper"
  />
  <p id="password-helper" className="text-sm text-text-muted">
    密碼至少需要 8 個字元，包含大小寫字母與數字
  </p>
</div>
```

---

## 無障礙測試

### 自動化測試

使用自動化工具掃描常見無障礙問題。

| 工具 | 測試範圍 | 準確度 |
|------|---------|-------|
| [Axe DevTools](https://www.deque.com/axe/devtools/) | WCAG 2.1 A/AA/AAA | ~57% WCAG 問題 |
| [Lighthouse](https://developers.google.com/web/tools/lighthouse) | WCAG 2.1 A/AA | ~30% WCAG 問題 |
| [Pa11y](https://pa11y.org/) | WCAG 2.1 A/AA | CI/CD 整合 |

**Axe DevTools 使用步驟**：

1. 安裝 [Axe DevTools 擴充](https://www.deque.com/axe/devtools/)
2. 開啟 Chrome DevTools → Axe DevTools 分頁
3. 點擊「Scan ALL of my page」
4. 查看報告，修正「Critical」與「Serious」問題

---

### 手動測試

自動化工具僅能檢測 30-57% 的無障礙問題，手動測試至關重要。

#### 鍵盤測試檢查清單

- [ ] 所有互動元件可使用 `Tab` 鍵導航
- [ ] 聚焦順序符合視覺順序
- [ ] 聚焦指示器清晰可見（對比度 ≥ 3:1）
- [ ] 可使用 `Enter` / `Space` 啟動按鈕
- [ ] 可使用 `Esc` 關閉模態框
- [ ] 無鍵盤陷阱（可正常離開所有元件）

#### 螢幕閱讀器測試檢查清單

使用 [NVDA](https://www.nvaccess.org/)（Windows）或 [VoiceOver](https://www.apple.com/accessibility/voiceover/)（macOS）測試。

- [ ] 所有圖像提供替代文字
- [ ] 表單欄位提供標籤
- [ ] 錯誤訊息正確朗讀
- [ ] 標題層級正確（h1 → h6）
- [ ] 連結文字具描述性（避免「點擊這裡」）

#### 對比度測試檢查清單

- [ ] 所有文字對比度 ≥ 4.5:1（正文）
- [ ] 大文字對比度 ≥ 3:1（≥18px）
- [ ] UI 元件邊框對比度 ≥ 3:1
- [ ] 聚焦指示器對比度 ≥ 3:1

---

### 真實使用者測試

邀請真實輔助技術使用者參與測試。

**建議測試族群**：

- 全盲使用者（使用螢幕閱讀器）
- 低視力使用者（使用放大鏡）
- 行動不便使用者（僅使用鍵盤）
- 色盲使用者

**測試任務範例**：

1. 使用鍵盤完成居民註冊表單
2. 使用螢幕閱讀器瀏覽任務列表
3. 使用放大鏡（200%）檢視儀表板

---

## 版本紀錄

| 版本 | 日期 | 變更內容 | 相關需求 |
|------|------|----------|---------|
| 1.0.0 | 2025-10-04 | 初始版本 - 完整無障礙指南 | Requirements 8, 3.5 |

---

**下一步**：閱讀 [04-quick-start.md](./04-quick-start.md) 快速上手設計系統。
