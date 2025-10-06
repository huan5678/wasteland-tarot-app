# UI 模式目錄

> **常見的 UI 模式與頁面佈局範例，協助開發者快速實作一致的介面。**

## 概述

本文件提供可重用的 UI 模式，包含頁面佈局、表單模式、資料顯示模式與導航模式的完整程式碼範例。所有模式遵循 [00-philosophy.md](./00-philosophy.md) 的設計哲學，並使用 [02-components.md](./02-components.md) 中定義的元件。

**最後更新**：2025-10-04
**版本**：1.0.0
**相關需求**：Requirements 9, 12
**相關檔案**：
- [02-components.md](./02-components.md) - 元件庫參考
- [01-tokens.md](./01-tokens.md) - 設計代幣參考

---

## 目錄

- [頁面佈局模式](#頁面佈局模式)
  - [單欄佈局](#單欄佈局)
  - [側邊欄佈局](#側邊欄佈局)
  - [儀表板佈局](#儀表板佈局)
- [表單模式](#表單模式)
  - [內嵌驗證表單](#內嵌驗證表單)
  - [多步驟表單](#多步驟表單)
  - [欄位群組](#欄位群組)
- [資料顯示模式](#資料顯示模式)
  - [響應式表格](#響應式表格)
  - [卡片網格](#卡片網格)
  - [空狀態](#空狀態)
- [導航模式](#導航模式)
  - [頂部導航](#頂部導航)
  - [側邊導航](#側邊導航)
  - [行動選單](#行動選單)
- [漸進揭露模式](#漸進揭露模式)
  - [可摺疊區塊](#可摺疊區塊)
  - [標籤頁](#標籤頁)
  - [手風琴](#手風琴)

---

## 頁面佈局模式

### 單欄佈局

適用於長文閱讀、部落格文章、文件頁面。

#### 視覺特性

- 最大寬度：640px（Prose 容器）
- 垂直間距：8 倍基準單位（64px）
- 水平內距：4 倍基準單位（32px）

#### 程式碼範例

```tsx
export default function SingleColumnLayout() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* 頁面容器 */}
      <div className="max-w-prose mx-auto px-4 py-12">

        {/* 頁面標題 */}
        <header className="mb-8">
          <h1 className="text-5xl font-bold text-text-primary mb-4">
            廢土生存指南
          </h1>
          <p className="text-lg text-text-secondary">
            後末日世界的終極生存手冊
          </p>
        </header>

        {/* 主要內容 */}
        <article className="space-y-6">
          <section>
            <h2 className="text-3xl font-bold text-text-primary mb-3">
              第一章：水源與食物
            </h2>
            <p className="text-base text-text-primary leading-relaxed">
              在輻射廢土中，乾淨的水源和未受污染的食物是最珍貴的資源...
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-text-primary mb-3">
              第二章：避難所選擇
            </h2>
            <p className="text-base text-text-primary leading-relaxed">
              選擇合適的避難所可以大幅提升生存機率...
            </p>
          </section>
        </article>

        {/* 頁尾 */}
        <footer className="mt-12 pt-8 border-t border-border-muted">
          <p className="text-sm text-text-muted">
            最後更新：2287年10月23日
          </p>
        </footer>

      </div>
    </div>
  )
}
```

---

### 側邊欄佈局

適用於文件網站、設定頁面、篩選介面。

#### 視覺特性

- 主要內容：8 欄（66.67%）
- 側邊欄：4 欄（33.33%）
- 斷點：1024px（lg）
- 間距：6 倍基準單位（48px）

#### 程式碼範例

```tsx
export default function SidebarLayout() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-12">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* 側邊欄 (4 欄) */}
          <aside className="lg:col-span-4">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>導航選單</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a href="#section-1" className="block py-2 px-3 rounded text-link hover:bg-bg-tertiary transition-colors">
                  水源與食物
                </a>
                <a href="#section-2" className="block py-2 px-3 rounded text-link hover:bg-bg-tertiary transition-colors">
                  避難所選擇
                </a>
                <a href="#section-3" className="block py-2 px-3 rounded text-link hover:bg-bg-tertiary transition-colors">
                  輻射防護
                </a>
              </CardContent>
            </Card>
          </aside>

          {/* 主要內容 (8 欄) */}
          <main className="lg:col-span-8">
            <div className="space-y-6">
              <Card id="section-1">
                <CardHeader>
                  <CardTitle>水源與食物</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-primary">
                    在輻射廢土中，乾淨的水源和未受污染的食物是最珍貴的資源...
                  </p>
                </CardContent>
              </Card>

              <Card id="section-2">
                <CardHeader>
                  <CardTitle>避難所選擇</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-primary">
                    選擇合適的避難所可以大幅提升生存機率...
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>

        </div>
      </div>
    </div>
  )
}
```

---

### 儀表板佈局

適用於數據儀表板、統計頁面、管理後台。

#### 視覺特性

- 網格：1 欄 → 2 欄 → 3 欄（響應式）
- 卡片間距：4 倍基準單位（32px）
- 統計數字使用 Doto 字型

#### 程式碼範例

```tsx
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react"

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* 頁面標題 */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary">
            廢土數據儀表板
          </h1>
        </header>

        {/* 統計卡片網格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-text-muted">總瓶蓋</p>
                <DollarSign size={20} className="text-success" />
              </div>
              <p className="numeric text-3xl font-bold text-success">
                45,231
              </p>
              <p className="text-xs text-text-muted mt-2">
                <TrendingUp size={12} className="inline mr-1" />
                +12.5% 本月
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-text-muted">活躍居民</p>
                <Users size={20} className="text-info" />
              </div>
              <p className="numeric text-3xl font-bold text-info">
                573
              </p>
              <p className="text-xs text-text-muted mt-2">
                <TrendingUp size={12} className="inline mr-1" />
                +8 本週
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-text-muted">輻射指數</p>
                <Activity size={20} className="text-warning" />
              </div>
              <p className="numeric text-3xl font-bold text-warning">
                127 Rad
              </p>
              <p className="text-xs text-text-muted mt-2">
                安全範圍內
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-text-muted">任務完成</p>
                <TrendingUp size={20} className="text-success" />
              </div>
              <p className="numeric text-3xl font-bold text-success">
                89%
              </p>
              <p className="text-xs text-text-muted mt-2">
                +5% 本週
              </p>
            </CardContent>
          </Card>

        </div>

        {/* 圖表區域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>資源趨勢</CardTitle>
            </CardHeader>
            <CardContent>
              {/* 圖表元件 */}
              <div className="h-64 flex items-center justify-center text-text-muted">
                圖表區域
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>居民活動</CardTitle>
            </CardHeader>
            <CardContent>
              {/* 圖表元件 */}
              <div className="h-64 flex items-center justify-center text-text-muted">
                圖表區域
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
```

---

## 表單模式

### 內嵌驗證表單

即時驗證使用者輸入，提供清晰的錯誤反饋。

#### 程式碼範例

```tsx
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function InlineValidationForm() {
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value) {
      setEmailError("請輸入電子郵件")
    } else if (!emailRegex.test(value)) {
      setEmailError("請輸入有效的電子郵件地址")
    } else {
      setEmailError("")
    }
  }

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("請輸入密碼")
    } else if (value.length < 8) {
      setPasswordError("密碼至少需要 8 個字元")
    } else {
      setPasswordError("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailError && !passwordError && email && password) {
      console.log("表單提交成功")
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>登入避難所系統</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 電子郵件欄位 */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-text-primary">
              電子郵件地址
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                validateEmail(e.target.value)
              }}
              onBlur={() => validateEmail(email)}
              className={emailError ? "border-error-border" : email ? "border-success-border" : ""}
              aria-invalid={!!emailError}
              aria-describedby="email-helper email-error"
              placeholder="vault-dweller@wasteland.com"
            />
            <p id="email-helper" className="text-sm text-text-muted">
              使用您的避難所電子郵件
            </p>
            {emailError && (
              <p id="email-error" role="alert" className="text-sm text-error flex items-center gap-1">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{emailError}</span>
              </p>
            )}
            {email && !emailError && (
              <p className="text-sm text-success flex items-center gap-1">
                <CheckCircle size={16} aria-hidden="true" />
                <span>電子郵件格式正確</span>
              </p>
            )}
          </div>

          {/* 密碼欄位 */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-text-primary">
              密碼
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                validatePassword(e.target.value)
              }}
              onBlur={() => validatePassword(password)}
              className={passwordError ? "border-error-border" : password && !passwordError ? "border-success-border" : ""}
              aria-invalid={!!passwordError}
              aria-describedby="password-error"
            />
            {passwordError && (
              <p id="password-error" role="alert" className="text-sm text-error flex items-center gap-1">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{passwordError}</span>
              </p>
            )}
            {password && !passwordError && (
              <p className="text-sm text-success flex items-center gap-1">
                <CheckCircle size={16} aria-hidden="true" />
                <span>密碼強度足夠</span>
              </p>
            )}
          </div>

          {/* 提交按鈕 */}
          <Button
            type="submit"
            variant="default"
            className="w-full"
            disabled={!!emailError || !!passwordError || !email || !password}
          >
            登入系統
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}
```

---

### 多步驟表單

將複雜表單分解為多個步驟，降低認知負荷。

#### 程式碼範例

```tsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"

export default function MultiStepForm() {
  const [step, setStep] = useState(1)
  const totalSteps = 3

  const nextStep = () => setStep((prev) => Math.min(prev + 1, totalSteps))
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>避難所居民註冊</CardTitle>

        {/* 進度指示器 */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1">
              <div className={`h-2 rounded-full transition-colors ${
                s <= step ? 'bg-success' : 'bg-bg-tertiary'
              }`} />
              <p className={`text-xs mt-1 ${
                s <= step ? 'text-success' : 'text-text-muted'
              }`}>
                {s === 1 && '個人資訊'}
                {s === 2 && '技能評估'}
                {s === 3 && '確認送出'}
              </p>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="min-h-[300px]">

        {/* 步驟 1：個人資訊 */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input id="name" placeholder="輸入您的姓名" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">年齡</Label>
              <Input id="age" type="number" placeholder="輸入您的年齡" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="occupation">職業</Label>
              <Input id="occupation" placeholder="輸入您的職業" />
            </div>
          </div>
        )}

        {/* 步驟 2：技能評估 */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>主要技能</Label>
              <div className="grid grid-cols-2 gap-2">
                {['醫療', '工程', '戰鬥', '外交'].map((skill) => (
                  <Button key={skill} variant="outline" className="justify-start">
                    {skill}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">經驗年數</Label>
              <Input id="experience" type="number" placeholder="輸入經驗年數" />
            </div>
          </div>
        )}

        {/* 步驟 3：確認送出 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-success-bg/20 border border-success-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Check size={20} className="text-success" />
                <p className="text-success font-medium">資料已完整填寫</p>
              </div>
              <p className="text-text-secondary text-sm">
                請確認以下資訊無誤後送出申請
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-border-muted">
                <span className="text-text-muted">姓名</span>
                <span className="text-text-primary">約翰·避難所</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-muted">
                <span className="text-text-muted">年齡</span>
                <span className="text-text-primary">28</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-muted">
                <span className="text-text-muted">職業</span>
                <span className="text-text-primary">工程師</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-text-muted">主要技能</span>
                <span className="text-text-primary">工程</span>
              </div>
            </div>
          </div>
        )}

      </CardContent>

      <CardFooter className="flex justify-between border-t border-border-muted pt-4">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
        >
          <ChevronLeft size={20} />
          上一步
        </Button>

        {step < totalSteps ? (
          <Button variant="default" onClick={nextStep}>
            下一步
            <ChevronRight size={20} />
          </Button>
        ) : (
          <Button variant="success">
            <Check size={20} />
            送出申請
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
```

---

### 欄位群組

將相關欄位組織在一起，提升表單可讀性。

#### 程式碼範例

```tsx
<Card>
  <CardHeader>
    <CardTitle>避難所設定</CardTitle>
  </CardHeader>
  <CardContent className="space-y-6">

    {/* 群組 1：基本資訊 */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary border-b border-border-muted pb-2">
        基本資訊
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vault-name">避難所名稱</Label>
          <Input id="vault-name" placeholder="Vault 101" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vault-number">避難所編號</Label>
          <Input id="vault-number" type="number" placeholder="101" />
        </div>
      </div>
    </div>

    {/* 群組 2：位置資訊 */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary border-b border-border-muted pb-2">
        位置資訊
      </h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="location">地理位置</Label>
          <Input id="location" placeholder="華盛頓特區" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">緯度</Label>
            <Input id="latitude" placeholder="38.9072" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">經度</Label>
            <Input id="longitude" placeholder="-77.0369" />
          </div>
        </div>
      </div>
    </div>

    {/* 群組 3：安全設定 */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary border-b border-border-muted pb-2">
        安全設定
      </h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="security-level">安全等級</Label>
          <select id="security-level" className="input-terminal w-full">
            <option>標準</option>
            <option>高級</option>
            <option>最高級</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="radiation-alert" className="w-4 h-4" />
          <Label htmlFor="radiation-alert">啟用輻射警報</Label>
        </div>
      </div>
    </div>

  </CardContent>
  <CardFooter className="border-t border-border-muted pt-4">
    <Button variant="default" className="w-full">
      儲存設定
    </Button>
  </CardFooter>
</Card>
```

---

## 資料顯示模式

### 響應式表格

桌面顯示表格，行動裝置切換為卡片佈局。

#### 程式碼範例

```tsx
const residents = [
  { id: 1, name: "約翰·避難所", role: "工程師", status: "活躍", caps: 1250 },
  { id: 2, name: "瑪莉·輻射", role: "醫生", status: "活躍", caps: 2100 },
  { id: 3, name: "湯姆·廢土", role: "守衛", status: "休息", caps: 890 },
]

export default function ResponsiveTable() {
  return (
    <div>
      {/* 桌面表格 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-primary">
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                姓名
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                職位
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                狀態
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-text-primary">
                瓶蓋
              </th>
            </tr>
          </thead>
          <tbody>
            {residents.map((resident) => (
              <tr key={resident.id} className="border-b border-border-muted hover:bg-bg-tertiary transition-colors">
                <td className="py-3 px-4 text-text-primary">
                  {resident.name}
                </td>
                <td className="py-3 px-4 text-text-secondary">
                  {resident.role}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    resident.status === '活躍'
                      ? 'bg-success-bg text-success'
                      : 'bg-warning-bg text-warning'
                  }`}>
                    {resident.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right numeric text-text-primary">
                  {resident.caps}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 行動卡片 */}
      <div className="md:hidden space-y-4">
        {residents.map((resident) => (
          <Card key={resident.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {resident.name}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {resident.role}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  resident.status === '活躍'
                    ? 'bg-success-bg text-success'
                    : 'bg-warning-bg text-warning'
                }`}>
                  {resident.status}
                </span>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-muted">
                <span className="text-sm text-text-muted">瓶蓋</span>
                <span className="numeric text-lg text-text-primary">
                  {resident.caps}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

---

### 卡片網格

響應式卡片網格，適用於產品列表、任務清單。

#### 程式碼範例

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {missions.map((mission) => (
    <Card key={mission.id} className="hover:border-border-primary transition-all cursor-pointer">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{mission.title}</span>
          <span className={`text-xs px-2 py-1 rounded ${
            mission.difficulty === '簡單' ? 'bg-success-bg text-success' :
            mission.difficulty === '中等' ? 'bg-warning-bg text-warning' :
            'bg-error-bg text-error'
          }`}>
            {mission.difficulty}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-secondary mb-4">
          {mission.description}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-text-muted">獎勵</span>
          <span className="numeric text-success">
            {mission.reward} 瓶蓋
          </span>
        </div>
      </CardContent>
      <CardFooter className="border-t border-border-muted pt-4">
        <Button variant="default" size="sm" className="w-full">
          接受任務
        </Button>
      </CardFooter>
    </Card>
  ))}
</div>
```

---

### 空狀態

當資料為空時提供友善的提示與行動建議。

#### 程式碼範例

```tsx
import { Inbox, Plus } from "lucide-react"

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox size={64} className="text-text-muted mb-4" />
      <h3 className="text-xl font-semibold text-text-primary mb-2">
        尚無任務資料
      </h3>
      <p className="text-text-secondary mb-6 max-w-sm">
        目前沒有進行中的任務。開始建立您的第一個任務，展開廢土冒險！
      </p>
      <Button variant="default">
        <Plus size={20} />
        建立新任務
      </Button>
    </div>
  )
}
```

---

## 導航模式

### 頂部導航

桌面顯示完整導航列，行動裝置顯示漢堡選單。

#### 程式碼範例

```tsx
import { Menu, X } from "lucide-react"
import { useState } from "react"

export default function TopNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-bg-secondary border-b border-border-primary">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-pip-boy-green">
              WASTELAND TAROT
            </h1>
          </div>

          {/* 桌面導航 */}
          <div className="hidden md:flex items-center gap-6">
            <a href="/dashboard" className="text-link hover:text-link-hover transition-colors">
              儀表板
            </a>
            <a href="/missions" className="text-link hover:text-link-hover transition-colors">
              任務
            </a>
            <a href="/inventory" className="text-link hover:text-link-hover transition-colors">
              庫存
            </a>
            <a href="/settings" className="text-link hover:text-link-hover transition-colors">
              設定
            </a>
          </div>

          {/* 行動選單按鈕 */}
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="開啟選單"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>

        </div>

        {/* 行動選單 */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border-muted">
            <div className="flex flex-col gap-3">
              <a href="/dashboard" className="py-2 px-4 text-link hover:bg-bg-tertiary rounded transition-colors">
                儀表板
              </a>
              <a href="/missions" className="py-2 px-4 text-link hover:bg-bg-tertiary rounded transition-colors">
                任務
              </a>
              <a href="/inventory" className="py-2 px-4 text-link hover:bg-bg-tertiary rounded transition-colors">
                庫存
              </a>
              <a href="/settings" className="py-2 px-4 text-link hover:bg-bg-tertiary rounded transition-colors">
                設定
              </a>
            </div>
          </div>
        )}

      </div>
    </nav>
  )
}
```

---

### 側邊導航

適用於文件網站、管理後台。

#### 程式碼範例

```tsx
<div className="flex h-screen">

  {/* 側邊導航 */}
  <aside className="w-64 bg-bg-secondary border-r border-border-primary">
    <div className="p-4 border-b border-border-muted">
      <h2 className="font-bold text-pip-boy-green">導航選單</h2>
    </div>
    <nav className="p-4">
      <ul className="space-y-2">
        <li>
          <a href="#" className="block py-2 px-3 rounded bg-success-bg text-success">
            儀表板
          </a>
        </li>
        <li>
          <a href="#" className="block py-2 px-3 rounded text-link hover:bg-bg-tertiary transition-colors">
            任務
          </a>
        </li>
        <li>
          <a href="#" className="block py-2 px-3 rounded text-link hover:bg-bg-tertiary transition-colors">
            庫存
          </a>
        </li>
        <li>
          <a href="#" className="block py-2 px-3 rounded text-link hover:bg-bg-tertiary transition-colors">
            設定
          </a>
        </li>
      </ul>
    </nav>
  </aside>

  {/* 主要內容 */}
  <main className="flex-1 overflow-y-auto p-6">
    頁面內容
  </main>

</div>
```

---

### 行動選單

底部導航列，適用於行動應用。

#### 程式碼範例

```tsx
import { Home, Compass, Package, Settings } from "lucide-react"

export default function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-border-primary md:hidden">
      <div className="grid grid-cols-4">
        <a href="/dashboard" className="flex flex-col items-center py-3 text-link hover:bg-bg-tertiary transition-colors">
          <Home size={24} />
          <span className="text-xs mt-1">首頁</span>
        </a>
        <a href="/missions" className="flex flex-col items-center py-3 text-text-muted hover:text-link hover:bg-bg-tertiary transition-colors">
          <Compass size={24} />
          <span className="text-xs mt-1">任務</span>
        </a>
        <a href="/inventory" className="flex flex-col items-center py-3 text-text-muted hover:text-link hover:bg-bg-tertiary transition-colors">
          <Package size={24} />
          <span className="text-xs mt-1">庫存</span>
        </a>
        <a href="/settings" className="flex flex-col items-center py-3 text-text-muted hover:text-link hover:bg-bg-tertiary transition-colors">
          <Settings size={24} />
          <span className="text-xs mt-1">設定</span>
        </a>
      </div>
    </nav>
  )
}
```

---

## 漸進揭露模式

### 可摺疊區塊

使用 Radix UI Collapsible 元件。

#### 程式碼範例

```tsx
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@radix-ui/react-collapsible"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

export default function CollapsibleSection() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span>進階設定</span>
          <ChevronDown
            size={20}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4 space-y-3">
        <div className="space-y-2">
          <Label htmlFor="advanced-1">選項 1</Label>
          <Input id="advanced-1" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="advanced-2">選項 2</Label>
          <Input id="advanced-2" />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

---

### 標籤頁

使用 Radix UI Tabs 元件。

#### 程式碼範例

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs"

export default function TabsPattern() {
  return (
    <Tabs defaultValue="tab1" className="w-full">
      <TabsList className="flex gap-2 border-b border-border-muted">
        <TabsTrigger
          value="tab1"
          className="px-4 py-2 text-text-muted data-[state=active]:text-success data-[state=active]:border-b-2 data-[state=active]:border-success"
        >
          基本資訊
        </TabsTrigger>
        <TabsTrigger
          value="tab2"
          className="px-4 py-2 text-text-muted data-[state=active]:text-success data-[state=active]:border-b-2 data-[state=active]:border-success"
        >
          技能
        </TabsTrigger>
        <TabsTrigger
          value="tab3"
          className="px-4 py-2 text-text-muted data-[state=active]:text-success data-[state=active]:border-b-2 data-[state=active]:border-success"
        >
          裝備
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tab1" className="mt-4">
        <p className="text-text-primary">基本資訊內容...</p>
      </TabsContent>

      <TabsContent value="tab2" className="mt-4">
        <p className="text-text-primary">技能內容...</p>
      </TabsContent>

      <TabsContent value="tab3" className="mt-4">
        <p className="text-text-primary">裝備內容...</p>
      </TabsContent>
    </Tabs>
  )
}
```

---

### 手風琴

使用 Radix UI Accordion 元件。

#### 程式碼範例

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

export default function AccordionPattern() {
  return (
    <Accordion type="single" collapsible className="space-y-2">

      <AccordionItem value="item-1" className="border border-border-secondary rounded-lg">
        <AccordionTrigger className="flex justify-between items-center w-full px-4 py-3 text-left text-text-primary hover:bg-bg-tertiary transition-colors">
          <span>什麼是避難所系統？</span>
          <ChevronDown size={20} className="transition-transform data-[state=open]:rotate-180" />
        </AccordionTrigger>
        <AccordionContent className="px-4 py-3 text-text-secondary">
          避難所系統是一個先進的居民管理平台，協助您有效管理廢土資源與人員配置。
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-2" className="border border-border-secondary rounded-lg">
        <AccordionTrigger className="flex justify-between items-center w-full px-4 py-3 text-left text-text-primary hover:bg-bg-tertiary transition-colors">
          <span>如何增加居民？</span>
          <ChevronDown size={20} className="transition-transform data-[state=open]:rotate-180" />
        </AccordionTrigger>
        <AccordionContent className="px-4 py-3 text-text-secondary">
          您可以透過招募任務或廣播訊號吸引新居民加入避難所。
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-3" className="border border-border-secondary rounded-lg">
        <AccordionTrigger className="flex justify-between items-center w-full px-4 py-3 text-left text-text-primary hover:bg-bg-tertiary transition-colors">
          <span>輻射防護如何運作？</span>
          <ChevronDown size={20} className="transition-transform data-[state=open]:rotate-180" />
        </AccordionTrigger>
        <AccordionContent className="px-4 py-3 text-text-secondary">
          系統會自動監測輻射指數，當超過安全閾值時會發出警報並啟動防護措施。
        </AccordionContent>
      </AccordionItem>

    </Accordion>
  )
}
```

---

## 版本紀錄

| 版本 | 日期 | 變更內容 | 相關需求 |
|------|------|----------|---------|
| 1.0.0 | 2025-10-04 | 初始版本 - 完整 UI 模式目錄 | Requirements 9, 12 |

---

**下一步**：閱讀 [04-quick-start.md](./04-quick-start.md) 快速上手設計系統。
