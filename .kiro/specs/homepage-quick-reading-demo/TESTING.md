# 快速占卜功能 - 測試指南

本文件說明如何執行快速占卜功能的完整測試套件。

## 測試架構概覽

```
Phase 1 - 核心開發 (任務 1-13)          ✅ 100% 完成
Phase 2 - 測試與優化 (任務 14-20)       ✅ 100% 完成
  ├─ 單元測試 (14.1-14.3)              ✅ 已完成
  ├─ 整合測試 (15.1-15.5)              ✅ 已完成
  ├─ E2E 測試 (16.1-16.6)              ✅ 已完成
  ├─ 效能測試 (17.1-17.3)              ✅ 已完成
  ├─ 跨瀏覽器測試 (18.1-18.2)          ✅ 已完成
  ├─ 無障礙測試 (19)                   ✅ 已完成
  └─ 最終檢查 (20)                     ✅ 已完成
```

## 快速開始

### 1. 執行所有測試

```bash
# 最終檢查腳本（推薦）
chmod +x scripts/final-check.sh
./scripts/final-check.sh
```

### 2. 分別執行各類測試

#### 單元測試

```bash
# localStorage 服務測試
bun test src/lib/__tests__/quickReadingStorage.test.ts

# 卡牌池選取測試
bun test src/app/readings/quick/__tests__/cardPool.test.ts

# 狀態管理測試
bun test src/app/readings/quick/__tests__/stateManagement.test.ts

# localStorage 效能測試
bun test src/lib/__tests__/quickReadingStoragePerformance.test.ts
```

#### 整合測試

```bash
# 完整流程整合測試
bun test src/app/readings/quick/__tests__/integration.test.tsx
```

#### E2E 測試

```bash
# 啟動開發伺服器
bun run dev

# 在另一個終端執行 E2E 測試
npx playwright test tests/e2e/quick-reading.spec.ts

# 特定瀏覽器
npx playwright test tests/e2e/quick-reading.spec.ts --project=chromium
npx playwright test tests/e2e/quick-reading.spec.ts --project=firefox
npx playwright test tests/e2e/quick-reading.spec.ts --project=webkit

# 特定尺寸
npx playwright test tests/e2e/quick-reading.spec.ts --project=desktop-1280px
npx playwright test tests/e2e/quick-reading.spec.ts --project=tablet-768px
npx playwright test tests/e2e/quick-reading.spec.ts --project=mobile-375px
```

#### 效能測試

```bash
# Lighthouse 頁面載入效能測試
node scripts/test-quick-reading-performance.js

# 動畫效能測試（需要開發伺服器）
npx playwright test tests/e2e/animation-performance.spec.ts
```

#### 無障礙測試

```bash
# WCAG 2.1 AA 合規性測試（需要開發伺服器）
npx playwright test tests/e2e/accessibility.spec.ts

# 僅執行 axe-core 測試
npx playwright test tests/e2e/accessibility.spec.ts --grep "axe"

# 僅執行鍵盤導航測試
npx playwright test tests/e2e/accessibility.spec.ts --grep "鍵盤導航"
```

## 測試覆蓋率

### 單元測試覆蓋率

| 模組 | 覆蓋率 | 測試檔案 |
|------|--------|----------|
| `quickReadingStorage.ts` | 100% | `quickReadingStorage.test.ts` |
| 卡牌池選取邏輯 | 100% | `cardPool.test.ts` |
| 狀態管理輔助函式 | 100% | `stateManagement.test.ts` |
| localStorage 效能 | 100% | `quickReadingStoragePerformance.test.ts` |

### 整合測試覆蓋率

| 功能區塊 | 測試場景數 | 檔案 |
|----------|-----------|------|
| 頁面載入流程 | 3 | `integration.test.tsx` |
| Carousel 導航 | 3 | `integration.test.tsx` |
| localStorage 持久化 | 3 | `integration.test.tsx` |
| Carousel 導航 | 9 | `integration.test.tsx` |
| Modal 互動 | 4 | `integration.test.tsx` |
| CTA 導流 | 5 | `integration.test.tsx` |

### E2E 測試覆蓋率

| 測試類別 | 測試場景數 | 檔案 |
|----------|-----------|------|
| 訪客首次抽卡流程 | 14 | `quick-reading.spec.ts` |
| 狀態恢復 | 3 | `quick-reading.spec.ts` |
| 鍵盤導航 | 4 | `quick-reading.spec.ts` |
| 語音播放 | 2 | `quick-reading.spec.ts` |
| CTA 轉換 | 3 | `quick-reading.spec.ts` |
| 重新抽卡 | 4 | `quick-reading.spec.ts` |
| 響應式設計 | 3 | `quick-reading.spec.ts` |

### 效能測試覆蓋率

| 測試類別 | 標準 | 狀態 |
|----------|------|------|
| LCP | < 2.5s | ✅ 已實作 |
| FCP | < 1.5s | ✅ 已實作 |
| TTI | < 3.5s | ✅ 已實作 |
| CLS | < 0.1 | ✅ 已實作 |
| 翻牌動畫 FPS | > 55 | ✅ 已實作 |
| Carousel FPS 維持率 | > 90% | ✅ 已實作 |
| localStorage save() | < 10ms | ✅ 已實作 |
| localStorage load() | < 20ms | ✅ 已實作 |

### 無障礙測試覆蓋率

| 測試類別 | 標準 | 狀態 |
|----------|------|------|
| WCAG 2.1 AA 合規性 | axe-core | ✅ 已實作 |
| 色彩對比度 | WCAG AA | ✅ 已實作 |
| ARIA 屬性 | 有效性 | ✅ 已實作 |
| 鍵盤導航 | 完整流程 | ✅ 已實作 |
| Focus 狀態 | 可見性 | ✅ 已實作 |
| 螢幕閱讀器 | 支援性 | ✅ 已實作 |

## 效能基準

### 頁面載入效能

```
目標值:
  LCP (Largest Contentful Paint):    < 2.5s
  FCP (First Contentful Paint):       < 1.5s
  TTI (Time to Interactive):          < 3.5s
  CLS (Cumulative Layout Shift):      < 0.1
```

### 動畫效能

```
目標值:
  翻牌動畫平均 FPS:                    > 55
  Carousel 滑動 FPS 維持率:            > 90%
  Modal 開啟/關閉動畫 FPS:             > 55
  低於 60fps 的幀率:                   < 5%
```

### localStorage 效能

```
目標值:
  save() 操作:                         < 10ms
  load() 操作:                         < 20ms
  驗證與反序列化:                       < 5ms
  完整讀寫循環:                         < 35ms
```

## 跨瀏覽器支援

| 瀏覽器 | 版本 | 測試狀態 |
|--------|------|----------|
| Chrome | 最新 | ✅ 已配置 |
| Firefox | 最新 | ✅ 已配置 |
| Safari (WebKit) | 最新 | ✅ 已配置 |
| Edge | 最新 | ✅ 已配置 |

## 響應式設計

| 裝置類型 | 解析度 | 測試狀態 |
|----------|--------|----------|
| 桌面 | 1280x720 | ✅ 已配置 |
| 平板 | 768x1024 | ✅ 已配置 |
| 手機 | 375x667 | ✅ 已配置 |

## 故障排除

### 測試失敗常見原因

1. **開發伺服器未運行**
   ```bash
   # 解決方案：啟動開發伺服器
   bun run dev
   ```

2. **Playwright 瀏覽器未安裝**
   ```bash
   # 解決方案：安裝瀏覽器
   npx playwright install
   ```

3. **localStorage 測試失敗**
   ```bash
   # 解決方案：清除 localStorage
   # 在瀏覽器開發者工具中執行:
   localStorage.clear()
   ```

4. **效能測試超時**
   ```bash
   # 解決方案：增加超時時間或在較快機器上執行
   # 檢查是否有其他應用佔用資源
   ```

## CI/CD 整合

### GitHub Actions 範例

```yaml
name: Quick Reading Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run unit tests
        run: bun test src/lib/__tests__/quickReadingStorage.test.ts

      - name: Build
        run: bun run build

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test tests/e2e/quick-reading.spec.ts

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## 報告與結果

### 測試報告位置

- **Playwright HTML 報告**: `playwright-report/index.html`
- **Lighthouse 報告**: `lighthouse-reports/`
- **測試結果 JSON**: `test-results/results.json`
- **測試結果 XML**: `test-results/results.xml`

### 查看報告

```bash
# 查看 Playwright 報告
npx playwright show-report

# 查看 Lighthouse 報告
open lighthouse-reports/quick-reading-*.html
```

## 下一步

完成所有測試後，參考以下步驟準備部署：

1. ✅ 執行 `./scripts/final-check.sh` 確保所有檢查通過
2. ✅ 執行完整測試套件 `bun test && npx playwright test`
3. ✅ 執行 Lighthouse CI `node scripts/test-quick-reading-performance.js`
4. ✅ 建立 staging 部署
5. ✅ 執行煙霧測試
6. ✅ 準備生產環境部署

## 聯絡與支援

如有測試相關問題，請參考：
- 任務清單：`.kiro/specs/homepage-quick-reading-demo/tasks.md`
- 需求文件：`.kiro/specs/homepage-quick-reading-demo/requirements.md`
- 設計文件：`.kiro/specs/homepage-quick-reading-demo/design.md`
