# PipBoy Tabs 元件

## 概述

基於 `/readings/[id]` 頁面的 Tab 設計，創建統一的 Fallout/Wasteland 風格 Tab 元件。

## 設計特色

- ✅ 底部邊框高亮效果（Active 狀態）
- ✅ 動畫過渡（Framer Motion）
- ✅ Pip-Boy 綠色主題
- ✅ 支援圖示（PixelIcon）
- ✅ 響應式設計（可橫向滾動）
- ✅ 無障礙支援（ARIA 屬性）

## 使用方式

### 基本用法

```tsx
import {
  PipBoyTabs,
  PipBoyTabsList,
  PipBoyTabsTrigger,
  PipBoyTabsContent
} from '@/components/ui/pipboy-tabs';

function MyComponent() {
  return (
    <PipBoyTabs defaultValue="tab1">
      <PipBoyTabsList>
        <PipBoyTabsTrigger value="tab1" icon="home">
          總覽
        </PipBoyTabsTrigger>
        <PipBoyTabsTrigger value="tab2" icon="settings">
          設定
        </PipBoyTabsTrigger>
      </PipBoyTabsList>

      <PipBoyTabsContent value="tab1">
        <div>Tab 1 內容</div>
      </PipBoyTabsContent>

      <PipBoyTabsContent value="tab2">
        <div>Tab 2 內容</div>
      </PipBoyTabsContent>
    </PipBoyTabs>
  );
}
```

### 使用 Tab Config

```tsx
import { TabConfig } from '@/components/ui/pipboy-tabs';

const TAB_CONFIG: TabConfig[] = [
  { id: 'overview', label: '總覽', icon: 'home' },
  { id: 'settings', label: '設定', icon: 'settings' },
  { id: 'account', label: '帳戶', icon: 'user', disabled: true }
];

<PipBoyTabs defaultValue="overview">
  <PipBoyTabsList>
    {TAB_CONFIG.map(tab => (
      <PipBoyTabsTrigger
        key={tab.id}
        value={tab.id}
        icon={tab.icon}
        disabled={tab.disabled}
      >
        {tab.label}
      </PipBoyTabsTrigger>
    ))}
  </PipBoyTabsList>
  {/* ... content ... */}
</PipBoyTabs>
```

### 自定義顏色

```tsx
<PipBoyTabsTrigger
  value="danger"
  icon="alert"
  color="text-red-400"
>
  危險區域
</PipBoyTabsTrigger>
```

### 受控模式

```tsx
const [activeTab, setActiveTab] = useState('tab1');

<PipBoyTabs value={activeTab} onValueChange={setActiveTab}>
  {/* ... */}
</PipBoyTabs>
```

## API Reference

### PipBoyTabs

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultValue` | `string` | **required** | 預設選中的 tab |
| `value` | `string` | - | 受控模式的當前值 |
| `onValueChange` | `(value: string) => void` | - | Tab 改變時的回調 |
| `children` | `ReactNode` | **required** | 子元件 |
| `className` | `string` | - | 自定義 CSS class |

### PipBoyTabsList

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Tab trigger 按鈕 |
| `className` | `string` | 自定義 CSS class |

### PipBoyTabsTrigger

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | **required** | Tab 識別值 |
| `children` | `ReactNode` | **required** | 按鈕文字 |
| `icon` | `string` | - | PixelIcon 名稱 |
| `color` | `string` | `'text-pip-boy-green'` | Active 狀態的顏色 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `className` | `string` | - | 自定義 CSS class |

### PipBoyTabsContent

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | Tab 識別值 |
| `children` | `ReactNode` | Tab 內容 |
| `className` | `string` | 自定義 CSS class |
| `animationKey` | `string` | 自定義動畫 key |

### TabConfig (Type)

```ts
interface TabConfig {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  disabled?: boolean;
}
```

## 已替換的頁面

### ✅ 已完成

1. **`/app/profile/page.tsx`** - Profile 頁面（4 個 tabs）
2. **`/components/auth/AuthPageClient.tsx`** - 登入/註冊頁面（2 個 tabs）

### 📋 待替換

可以使用以下指令找出其他使用舊 tabs 的地方：

```bash
rg "from.*@/components/ui/tabs" src/app src/components --files-with-matches
```

## 與原始 Tabs 的差異

| 功能 | 原始 Tabs | PipBoy Tabs |
|------|-----------|-------------|
| 底部邊框 | ❌ | ✅ Active 高亮 |
| 動畫效果 | ❌ | ✅ Framer Motion |
| 圖示支援 | 需手動 | ✅ 內建 icon prop |
| 樣式主題 | 通用 | ✅ Pip-Boy 主題 |
| 橫向滾動 | ❌ | ✅ 支援 |
| Hover 效果 | 基本 | ✅ Y 軸移動 |

## 樣式自定義

### 修改 Active 顏色

```tsx
// 綠色（預設）
<PipBoyTabsTrigger value="tab1">Tab 1</PipBoyTabsTrigger>

// 橙色
<PipBoyTabsTrigger value="tab2" color="text-radiation-orange">
  Tab 2
</PipBoyTabsTrigger>

// 紅色
<PipBoyTabsTrigger value="tab3" color="text-red-400">
  Tab 3
</PipBoyTabsTrigger>
```

### 修改動畫

在 `PipBoyTabsContent` 中自定義動畫：

```tsx
<PipBoyTabsContent value="tab1" animationKey="custom-key">
  {/* 使用自定義 key 重置動畫 */}
</PipBoyTabsContent>
```

## 注意事項

1. **需要安裝 Framer Motion**: `motion/react`
2. **需要 PixelIcon 元件**: 用於顯示圖示
3. **最小高度**: TabsContent 預設 `min-h-[60vh]`，可透過 className 覆蓋
4. **無障礙**: 已包含 `role="tab"`, `aria-selected`, `aria-disabled`

## Troubleshooting

### Tab 內容沒有動畫

確保使用 `AnimatePresence` 包裹動態內容：

```tsx
<PipBoyTabsContent value="tab1">
  <AnimatePresence mode="wait">
    {/* 動態內容 */}
  </AnimatePresence>
</PipBoyTabsContent>
```

### 圖示不顯示

檢查 PixelIcon 名稱是否正確：

```tsx
// ✅ 正確
<PipBoyTabsTrigger icon="home" />

// ❌ 錯誤（圖示名稱不存在）
<PipBoyTabsTrigger icon="nonexistent" />
```

可在 `/icon-showcase` 頁面查看所有可用圖示。
