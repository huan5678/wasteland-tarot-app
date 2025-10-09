# 前端測試快速開始指南

> **5 分鐘快速上手** - Wasteland Tarot 前端測試

---

## 🚀 一鍵執行所有測試

```bash
./run-frontend-tests.sh
```

這個腳本會自動執行：
- ✅ 單元測試（無障礙性、鍵盤導航）
- ✅ E2E 測試（Design System 元件）
- ✅ 無障礙測試（WCAG AA 合規性）
- ℹ️  效能測試（需手動執行 Lighthouse）

---

## 📦 常用測試指令

### 單元測試

```bash
# 執行所有單元測試
bun test

# 執行特定測試檔案
bun test src/components/ui/__tests__/a11y.test.tsx

# 監聽模式（開發時使用）
bun test:watch

# 生成覆蓋率報告
bun test:coverage
```

### E2E 測試（Playwright）

```bash
# 執行所有 E2E 測試
bun test:playwright

# 執行特定測試
bun test:playwright tests/e2e/design-system/responsive.spec.ts

# UI 模式（視覺化測試執行）
bun test:playwright:ui

# 查看測試報告
bun test:playwright:report
```

### 無障礙測試

```bash
# 執行所有無障礙測試
bun test:accessibility

# WCAG AA 合規性測試
bun test:accessibility:wcag

# 鍵盤導航測試
bun test:accessibility:keyboard

# 螢幕閱讀器相容性測試
bun test:accessibility:screen-reader

# 色彩對比度測試
bun test:accessibility:color-contrast

# 色盲友善測試
bun test:accessibility:colorblind

# 生成無障礙報告
bun test:accessibility:report
```

### 效能測試

```bash
# Lighthouse CI 自動化測試
bun test:perf

# Playwright 效能測試
bun test:performance

# Core Web Vitals 測試
bun test:playwright tests/e2e/06-performance-loading.spec.ts
```

---

## 🎯 針對性測試場景

### 場景 1: 測試新增的 Button 變體

```bash
# 1. 執行單元測試
bun test src/components/ui/__tests__/a11y.test.tsx -t "Button"

# 2. 執行 E2E 測試
bun test:playwright tests/e2e/design-system/responsive.spec.ts -g "Button"

# 3. 截圖驗證
bun test:playwright tests/e2e/design-system/responsive.spec.ts --update-snapshots
```

### 場景 2: 驗證無障礙性

```bash
# 1. 單元無障礙測試
bun test src/components/ui/__tests__/a11y.test.tsx

# 2. 鍵盤導航測試
bun test src/components/ui/__tests__/keyboard-navigation.test.tsx

# 3. E2E 無障礙測試
bun test:accessibility:wcag
```

### 場景 3: 測試響應式設計

```bash
# 1. 響應式設計 E2E 測試（3 個斷點）
bun test:playwright tests/e2e/design-system/responsive.spec.ts

# 2. 或執行完整響應式測試
bun test:responsive
```

### 場景 4: 效能檢測

```bash
# 方法 1: Lighthouse CI（推薦）
bun test:perf

# 方法 2: 手動 Lighthouse 審查
# 1. 啟動伺服器: bun run dev
# 2. 開啟 Chrome DevTools (F12)
# 3. Lighthouse 標籤 → Generate Report

# 方法 3: Playwright 效能測試
bun test:playwright tests/e2e/06-performance-loading.spec.ts
```

---

## 🔧 環境設定檢查清單

### 初次執行前

```bash
# 1. 檢查環境變數
cat .env.local

# 2. 如果缺少 Supabase 配置，添加測試用值
cat >> .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key-12345
EOF

# 3. 安裝 Playwright 瀏覽器
bunx playwright install chromium

# 4. 驗證安裝
bun test --version
bunx playwright --version
```

---

## 📊 測試結果解讀

### 單元測試結果

```
PASS  src/components/ui/__tests__/a11y.test.tsx
  ✓ Button component has no accessibility violations (125 ms)
  ✓ Input component has no accessibility violations (89 ms)
  ✓ Card component has no accessibility violations (76 ms)

Test Suites: 1 passed, 1 total
Tests:       69 passed, 69 total
```

**解讀**: ✅ 所有無障礙測試通過，元件符合 WCAG 2.1 AA 標準

### E2E 測試結果

```
Running 12 tests using 2 workers

  ✓  [chromium] › responsive.spec.ts:23:3 › should render buttons correctly (5.2s)
  ✓  [chromium] › responsive.spec.ts:45:3 › should maintain touch targets (3.8s)
```

**解讀**: ✅ 視覺回歸測試通過，響應式設計正常

### 效能測試結果

```
Lighthouse Performance Score: 92/100
  First Contentful Paint:     1.2s  ✅
  Time to Interactive:        2.8s  ✅
  Cumulative Layout Shift:    0.08  ✅
```

**解讀**: ✅ 效能指標符合目標值

---

## 🚨 常見問題排除

### 問題 1: Supabase 環境變數錯誤

```
Error: Your project's URL and Key are required to create a Supabase client!
```

**解決方案**:
```bash
# 添加測試用環境變數
echo "NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key-12345" >> .env.local
```

### 問題 2: Playwright 測試逾時

```
Test timeout of 30000ms exceeded
```

**解決方案**:
```bash
# 停止背景伺服器
pkill -f "next dev"

# 使用 Playwright 內建伺服器啟動
bun test:playwright
```

### 問題 3: 埠號衝突

```
Error: Port 3000 is already in use
```

**解決方案**:
```bash
# 停止佔用埠號的進程
lsof -ti:3000 | xargs kill

# 或修改 playwright.config.ts 使用不同埠號
```

### 問題 4: 測試覆蓋率過低

```
Coverage: 45% (目標: 80%)
```

**解決方案**:
```bash
# 查看詳細覆蓋率報告
bun test:coverage

# 針對未覆蓋的檔案撰寫測試
# 重點: src/lib/, src/hooks/, src/utils/
```

---

## 📈 測試覆蓋率目標

| 測試類型 | 目標 | 當前狀態 |
|----------|------|----------|
| **單元測試** | ≥ 80% | ⚠️ 待測量 |
| **元件測試** | ≥ 90% | ✅ 100% (Design System) |
| **E2E 測試** | 主要流程 | ✅ 42 個測試檔案 |
| **無障礙測試** | 100% | ✅ 69/69 PASSED |

---

## 🎓 延伸閱讀

- **完整測試策略**: `docs/TESTING_STRATEGY.md`
- **Design System 文件**: `.kiro/specs/fallout-utilitarian-design/design-system/`
- **Playwright 文件**: https://playwright.dev/
- **React Testing Library**: https://testing-library.com/react
- **axe-core 規則**: https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md

---

## ✅ 測試檢查清單

在提交 PR 前，請確認：

- [ ] 所有單元測試通過 (`bun test`)
- [ ] 無障礙測試通過 (`bun test:accessibility`)
- [ ] E2E 測試通過 (`bun test:playwright`)
- [ ] 覆蓋率達標 (`bun test:coverage`)
- [ ] 無 Lint 錯誤 (`bun run lint`)
- [ ] Lighthouse 分數 ≥ 90 (手動驗證)

---

**快速參考卡片**

```bash
# 測試一切
./run-frontend-tests.sh

# 單元測試
bun test

# E2E 測試
bun test:playwright

# 無障礙測試
bun test:accessibility

# 效能測試
bun test:perf

# 查看報告
bun test:playwright:report
```

---

**建立日期**: 2025-10-04
**最後更新**: 2025-10-04
**維護者**: Claude Code
