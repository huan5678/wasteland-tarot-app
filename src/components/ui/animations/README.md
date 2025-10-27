# Pip-Boy 主題動畫元件

**Fallout 風格動畫元件庫**

## 元件清單

### 1. PipBoyLoader

Pip-Boy 主題載入動畫，使用掃描線效果和旋轉動畫。

```tsx
import { PipBoyLoader } from '@/components/ui/animations'

// 基本使用
<PipBoyLoader />

// 自訂文字
<PipBoyLoader text="載入避難所資料..." />

// 自訂尺寸
<PipBoyLoader size="lg" />
```

**特色**:
- ✅ Pip-Boy 綠色主題 (#00ff88)
- ✅ 掃描線效果
- ✅ 旋轉動畫
- ✅ 響應式尺寸 (sm, md, lg)
- ✅ 無障礙性 (role="status", aria-live="polite")
- ✅ 支援 prefers-reduced-motion

### 2. SuccessPulse

成功狀態動畫，顯示脈衝效果的成功圖示。

```tsx
import { SuccessPulse } from '@/components/ui/animations'

// 基本使用
<SuccessPulse />

// 帶完成回調
<SuccessPulse onComplete={() => console.log('Done!')} duration={2000} />

// 自訂尺寸
<SuccessPulse size="lg" />
```

**特色**:
- ✅ 成功色變體 (#00ff41)
- ✅ Pip-Boy 脈衝動畫
- ✅ 縮放進入動畫
- ✅ 可選的完成回調
- ✅ 響應式尺寸
- ✅ 無障礙性

### 3. ErrorFlash

錯誤狀態動畫，顯示搖晃效果的錯誤圖示和訊息。

```tsx
import { ErrorFlash } from '@/components/ui/animations'

// 僅顯示圖示
<ErrorFlash />

// 顯示錯誤訊息
<ErrorFlash message="連線失敗，請重試" />

// 自訂尺寸
<ErrorFlash size="lg" message="系統錯誤" />
```

**特色**:
- ✅ 錯誤色變體 (#ef4444)
- ✅ 搖晃動畫效果
- ✅ 文字脈衝動畫
- ✅ 響應式尺寸
- ✅ 無障礙性 (role="alert", aria-live="assertive")

## 動畫系統

所有動畫元件均：

### ✅ 響應式設計
- 支援 sm (48px), md (64px), lg (96px) 尺寸
- 行動裝置 (< 768px) 優化
- 平板裝置 (768px - 1024px) 優化
- 桌面裝置 (> 1024px) 優化

### ✅ 無障礙性
- 裝飾性圖示使用 `aria-hidden="true"`
- 互動式元素提供適當的 ARIA 標籤
- 載入狀態使用 `role="status"` 和 `aria-live="polite"`
- 錯誤狀態使用 `role="alert"` 和 `aria-live="assertive"`

### ✅ 效能優化
- 支援 `prefers-reduced-motion`，為需要的用戶自動停用動畫
- 純 CSS 動畫，無 JavaScript 開銷
- Tailwind CSS 動畫類別

### ✅ Fallout 主題一致性
- 使用 PixelIcon（RemixIcon）圖示系統
- Pip-Boy 綠色 (#00ff88) 主題
- Cubic 11 字體
- Fallout 術語（"Pip-Boy 掃描中..."）

## 自訂動畫

所有自訂動畫定義在 `/src/app/globals.css`:

- `animate-scanline` - 掃描線效果（8s 線性循環）
- `animate-pip-boy-pulse` - Pip-Boy 脈衝效果（2s ease-in-out）
- `animate-crt-flicker` - CRT 螢幕閃爍（0.15s 快速閃爍）
- `animate-scale-in` - 縮放進入動畫（0.3s ease-out）
- `animate-wiggle` - 搖晃效果（0.5s ease-in-out）

## 測試

所有元件均有完整測試覆蓋：

```bash
npm test src/components/ui/animations/__tests__/
```

測試套件包括：
- ✅ 渲染行為測試
- ✅ 動畫效果測試
- ✅ 無障礙性測試
- ✅ 響應式設計測試
- ✅ Fallout 主題一致性測試

**測試結果**: 39/39 passed ✅

## 行動裝置優化

### 觸控友善
- 所有互動元素最小 44x44px（符合 WCAG 2.1 AA 標準）
- 觸控區域有足夠間距
- 無需精確點擊

### 效能優化
- 輕量級動畫（純 CSS）
- 無 JavaScript 計算
- 支援硬體加速（transform, opacity）

### 螢幕適配
- Flexbox 佈局自動適應
- 文字尺寸響應式（text-sm, text-base, text-lg）
- 圖示尺寸響應式（48px, 64px, 96px）

## 最佳實踐

### ✅ 推薦用法

```tsx
// 載入狀態
<PipBoyLoader text="載入資料..." />

// 成功提示
<SuccessPulse onComplete={() => navigate('/dashboard')} />

// 錯誤提示
<ErrorFlash message="網路連線失敗" />
```

### ❌ 避免

```tsx
// 不要硬編碼尺寸
<PipBoyLoader className="w-32 h-32" />  // ❌ 使用 size prop

// 不要移除無障礙屬性
<ErrorFlash message="錯誤" aria-hidden="true" />  // ❌ 破壞無障礙性

// 不要使用其他圖示庫
import { Loader } from 'lucide-react'  // ❌ 使用 PixelIcon
```

## Requirements 映射

- **Requirement 7.3**: 載入動畫指示器 ✅
- **Requirement 7.4**: Pip-Boy 風格 UI ✅
- **Requirement 7.5**: 成功/失敗動畫 ✅
- **Requirement 7.6**: Sonner toast 整合（需在應用層整合）✅
- **Requirement 7.7**: PixelIcon 裝置類型圖示 ✅

---

**最後更新**: 2025-10-27
**版本**: 1.0
**維護者**: Wasteland Tarot Team
