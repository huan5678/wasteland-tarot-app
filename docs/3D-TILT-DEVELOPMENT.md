# 3D 卡片傾斜效果 - 開發指南

本文件說明如何在開發與生產環境中使用 3D 卡片傾斜效果。

## 功能概述

3D 卡片傾斜效果為塔羅牌卡片增加沉浸式互動體驗：
- **桌面**：滑鼠 hover 時卡片根據游標位置產生 3D 傾斜（-15° ~ +15°）
- **行動**：陀螺儀感應手機傾斜，卡片跟隨旋轉（-20° ~ +20°）
- **視覺增強**：動態光澤與增強陰影效果
- **效能優化**：60fps 流暢動畫、低效能裝置自動降級
- **無障礙**：支援 prefers-reduced-motion、鍵盤導航、螢幕閱讀器

---

## 開發環境設定

### 為什麼需要 HTTPS？

**iOS 13+ 的 DeviceOrientation API 需要 HTTPS 才能請求陀螺儀權限。**

在 HTTP 環境下：
- ❌ 權限請求會被自動拒絕
- ❌ 陀螺儀功能無法使用
- ❌ 僅滑鼠 hover 效果可用

在 HTTPS 環境下：
- ✅ 權限對話框正常顯示
- ✅ 陀螺儀功能完全可用
- ✅ 完整的行動體驗

### 啟動 HTTPS 開發伺服器

```bash
# 啟動 HTTPS 開發伺服器
bun run dev:https

# 伺服器位置
# Local:   https://localhost:3000
# Network: https://192.168.1.173:3000
```

### 在行動裝置上測試

1. **確保裝置與開發機器在同一網路**

2. **開啟 HTTPS URL**
   - iOS Safari: `https://192.168.1.173:3000`
   - Android Chrome: `https://192.168.1.173:3000`

3. **接受自簽憑證警告**
   - **iOS Safari**:
     - 點擊「顯示詳細資料」
     - 點擊「瀏覽此網站」
     - 再次確認「瀏覽此網站」
   - **Android Chrome**:
     - 點擊「進階」
     - 點擊「繼續前往 192.168.1.173 (不安全)」

4. **測試陀螺儀權限**
   - 開啟測試頁面：`https://192.168.1.173:3000/test-gyro`
   - 點擊「請求陀螺儀權限」按鈕
   - 允許權限後，傾斜手機觀察效果

---

## 使用方式

### 基本使用

所有卡片元件已預設啟用 3D 傾斜效果：

```tsx
import { TarotCard } from '@/components/tarot/TarotCard'
import { MobileTarotCard } from '@/components/mobile/MobileTarotCard'
import { CardThumbnail } from '@/components/cards/CardThumbnail'

// 預設啟用 3D 傾斜
<TarotCard card={card} />
<MobileTarotCard card={card} />
<CardThumbnail card={card} />
```

### 自訂配置

```tsx
// 停用 3D 傾斜
<TarotCard card={card} enable3DTilt={false} />

// 自訂最大傾斜角度
<TarotCard card={card} tiltMaxAngle={20} />

// 停用陀螺儀（僅使用滑鼠）
<TarotCard card={card} enableGyroscope={false} />

// 停用光澤效果
<TarotCard card={card} enableGloss={false} />

// 自訂過渡動畫時間
<TarotCard card={card} tiltTransitionDuration={600} />
```

### 全域配置

在應用程式根部設定全域預設值（已在 `src/app/layout.tsx` 中配置）：

```tsx
import { TiltConfigProvider } from '@/contexts/TiltConfigContext'

<TiltConfigProvider
  defaultMaxAngle={15}
  enableGyroscopeGlobal={true}
  enableGlossGlobal={true}
>
  {children}
</TiltConfigProvider>
```

---

## 元件 API

### TarotCard / MobileTarotCard / CardThumbnail

所有卡片元件都支援以下 3D 傾斜 props：

| Prop | 型別 | 預設值 | 說明 |
|------|------|--------|------|
| `enable3DTilt` | `boolean` | `true` | 啟用/停用 3D 傾斜效果 |
| `tiltMaxAngle` | `number` | `15` | 最大傾斜角度（度） |
| `tiltTransitionDuration` | `number` | `400` | 過渡動畫時間（毫秒） |
| `enableGyroscope` | `boolean` | `true` | 啟用/停用陀螺儀傾斜（行動裝置） |
| `enableGloss` | `boolean` | `true` | 啟用/停用光澤效果 |

### 特殊行為

- **翻牌時自動停用**：`isFlipping={true}` 時 3D 傾斜會暫時停用，避免動畫衝突
- **載入時停用**：`loading={true}` 時 3D 傾斜會停用
- **小尺寸自動縮放**：`CardThumbnail` 使用 `size: 'small'`，角度自動減至 60%（9°）
- **低效能裝置降級**：CPU < 4 核心或記憶體 < 4GB 時，角度減至 60%、光澤停用

---

## Hooks API

### use3DTilt

核心 Hook，提供 3D 傾斜邏輯：

```tsx
import { use3DTilt } from '@/hooks/tilt/use3DTilt'

const {
  tiltRef,        // 綁定至卡片根元素
  tiltHandlers,   // { onMouseEnter, onMouseMove, onMouseLeave }
  tiltStyle,      // CSS transform 樣式
  tiltState,      // { rotateX, rotateY, isActive, isTilted }
  glossStyle,     // 光澤效果樣式（可選）
  gyroscopePermission  // { status, requestPermission, error }
} = use3DTilt({
  enable3DTilt: true,
  tiltMaxAngle: 15,
  enableGyroscope: true,
  enableGloss: true,
  size: 'medium',
  isFlipping: false,
  loading: false
})
```

### useGyroscopePermission

管理 iOS 13+ 陀螺儀權限：

```tsx
import { useGyroscopePermission } from '@/hooks/tilt/useGyroscopePermission'

const { status, requestPermission, error } = useGyroscopePermission()

// status: 'prompt' | 'granted' | 'denied' | 'unsupported'
// requestPermission: () => Promise<void>
// error: string | null
```

### useDeviceCapabilities

偵測裝置能力：

```tsx
import { useDeviceCapabilities } from '@/hooks/tilt/useDeviceCapabilities'

const {
  isTouchDevice,        // 是否為觸控裝置
  prefersReducedMotion, // 使用者偏好減少動畫
  isIOS,                // 是否為 iOS
  hardwareConcurrency,  // CPU 核心數
  deviceMemory          // 裝置記憶體（GB）
} = useDeviceCapabilities()
```

---

## 測試

### 單元測試

```bash
# 執行所有單元測試
bun run test

# 執行 3D tilt 相關測試
bun run test -- use3DTilt
bun run test -- TiltVisualEffects
bun run test -- TiltConfigContext
```

### E2E 測試

```bash
# 桌面測試
bun run test:playwright tests/e2e/card-tilt-desktop.spec.ts

# 行動測試
bun run test:playwright tests/e2e/card-tilt-mobile.spec.ts

# 陀螺儀測試
bun run test:playwright tests/e2e/card-tilt-gyroscope.spec.ts

# 無障礙測試
bun run test:playwright tests/e2e/card-tilt-accessibility.spec.ts
```

### 視覺回歸測試

```bash
bun run test:playwright tests/visual/card-tilt-visual.spec.ts
```

### 效能測試

```bash
bun run test:playwright tests/performance/card-tilt-performance.spec.ts
```

---

## 效能考量

### 優化策略

1. **IntersectionObserver**：僅為可視卡片啟用傾斜效果
2. **requestAnimationFrame**：與瀏覽器渲染週期同步
3. **Throttle**：滑鼠事件 16ms (60fps)，陀螺儀事件 33ms (30fps)
4. **硬體加速**：使用 CSS `transform3d()` 與 `will-change`
5. **Page Visibility API**：背景時暫停陀螺儀監聽
6. **自動降級**：低效能裝置減少角度與停用光澤

### 效能目標

- **FPS**: ≥60fps（理想），≥30fps（最低可接受）
- **首次互動延遲**: <50ms
- **記憶體增加**: <5MB（多卡片場景）
- **記憶體洩漏**: <1MB

---

## 無障礙支援

### 自動處理

- ✅ `prefers-reduced-motion: reduce` → 自動停用所有傾斜效果
- ✅ 視覺效果元素設為 `aria-hidden="true"`
- ✅ 鍵盤導航不受影響
- ✅ 焦點指示器（focus ring）不被遮蓋
- ✅ 螢幕閱讀器不會朗讀視覺效果元素

### WCAG 合規

- ✅ WCAG AA 等級
- ✅ 鍵盤可操作性
- ✅ 輔助技術相容性

---

## 瀏覽器支援

### 桌面瀏覽器

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### 行動瀏覽器

- ✅ iOS Safari 14+（需 HTTPS）
- ✅ Chrome Mobile 90+
- ✅ Samsung Internet 14+

### Polyfills

程式碼包含以下 API 的 fallback：
- `IntersectionObserver` → 簡單可見性檢查
- `requestAnimationFrame` → `setTimeout` fallback
- `DeviceOrientation API` → 優雅降級（僅滑鼠效果）

---

## 故障排除

### 陀螺儀權限被拒絕（iOS）

**症狀**：點擊按鈕後無權限對話框，狀態顯示 `denied`

**可能原因與解決方案**：

1. **使用 HTTP 而非 HTTPS**
   - ✅ 解決：使用 `bun run dev:https` 啟動伺服器
   - ✅ 確認 URL 為 `https://` 開頭

2. **Safari 設定阻擋**
   - ✅ Safari → 設定 → 隱私權 → 動作與方向
   - ✅ 確認開關為開啟狀態

3. **權限已被拒絕（快取）**
   - ✅ Safari → 設定 → Safari → 清除歷史記錄與網站資料
   - ✅ 重新載入頁面並重試

### 傾斜效果不顯示

**檢查項目**：

1. **確認 `enable3DTilt={true}`**
2. **確認元件不在 `loading` 或 `isFlipping` 狀態**
3. **檢查 `prefers-reduced-motion` 是否啟用**
4. **開啟開發者工具 Console 檢查錯誤**

### 效能不佳（卡頓）

**優化建議**：

1. **減少同時顯示的卡片數量**
2. **確認 IntersectionObserver 正常運作**（僅可視卡片啟用）
3. **降低 `tiltMaxAngle` 或 `tiltTransitionDuration`**
4. **停用光澤效果**：`enableGloss={false}`

---

## 生產環境部署

### 重要提醒

⚠️ **生產環境必須使用正式 SSL 憑證！**

- ❌ 不要使用自簽憑證
- ✅ 使用 Let's Encrypt、Cloudflare 或其他正式 SSL 服務
- ✅ 確保 HTTPS 正確配置

### Vercel 部署

Vercel 預設提供 HTTPS，無需額外設定：

```bash
# 部署至 Vercel
vercel --prod
```

部署後，陀螺儀權限將自動正常運作（因為 Vercel 提供正式 SSL）。

### 自託管

使用 Nginx 或 Apache 配置正式 SSL 憑證：

```nginx
# Nginx 範例
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 相關檔案

### 核心實作

- `src/hooks/tilt/use3DTilt.ts` - 核心 3D 傾斜 Hook
- `src/hooks/tilt/useGyroscopePermission.ts` - 陀螺儀權限管理
- `src/hooks/tilt/useDeviceCapabilities.ts` - 裝置能力偵測
- `src/hooks/tilt/useIntersectionTilt.ts` - 可視區域優化
- `src/components/tilt/TiltVisualEffects.tsx` - 視覺效果元件
- `src/components/tilt/TiltErrorBoundary.tsx` - 錯誤邊界
- `src/contexts/TiltConfigContext.tsx` - 全域配置 Context
- `src/utils/browserCompat.ts` - 瀏覽器相容性工具

### 測試

- `tests/e2e/card-tilt-*.spec.ts` - E2E 測試
- `tests/visual/card-tilt-visual.spec.ts` - 視覺回歸測試
- `tests/performance/card-tilt-performance.spec.ts` - 效能測試
- `src/components/__tests__/integration/CardTiltIntegration.test.tsx` - 整合測試

### 文件

- `.kiro/specs/3d-card-tilt-effects/` - 完整規格文件
  - `requirements.md` - 功能需求（EARS 格式）
  - `design.md` - 技術設計
  - `tasks.md` - 實作任務清單

---

## 開發測試頁面

專用測試頁面用於診斷陀螺儀功能：

**URL**: `/test-gyro`

**功能**：
- 顯示裝置資訊（User Agent、iOS 偵測、HTTPS 狀態）
- 權限狀態即時顯示
- 陀螺儀資料視覺化
- 3D 傾斜預覽
- 診斷工具

---

## 授權與貢獻

此功能為 Wasteland Tarot 專案的一部分。

如有問題或建議，請開啟 GitHub Issue。
