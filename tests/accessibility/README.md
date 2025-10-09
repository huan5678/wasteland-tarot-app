# 🔍 Comprehensive Accessibility Testing Suite

這是一套完整的無障礙性測試系統，專為確保 Wasteland Tarot 應用程式符合 WCAG AA 標準而設計。

## 📋 測試覆蓋範圍

### 1. **色彩對比度測試** (`color-contrast.spec.ts`)
- 自動化對比度比例計算
- WCAG AA 標準驗證 (4.5:1 普通文字, 3:1 大文字)
- Pip-Boy 綠色主題驗證
- 互動狀態對比度檢查
- axe-core 整合驗證

### 2. **WCAG AA 合規性驗證** (`wcag-aa-compliance.spec.ts`)
- 全面的 WCAG 2.1 AA 標準檢查
- 語義化 HTML 結構驗證
- 表單無障礙性測試
- 互動元素無障礙性檢查
- 媒體和圖片替代文字驗證

### 3. **色盲模擬測試** (`color-blindness-simulation.spec.ts`)
- 7 種色盲類型模擬：
  - Protanopia (紅色盲)
  - Deuteranopia (綠色盲)
  - Tritanopia (藍色盲)
  - Protanomaly (紅色弱)
  - Deuteranomaly (綠色弱)
  - Tritanomaly (藍色弱)
  - Monochromacy (全色盲)
- 色彩依賴元素識別
- 狀態指示器可用性測試

### 4. **鍵盤導航測試** (`keyboard-navigation.spec.ts`)
- Tab 順序邏輯性驗證
- 焦點可見性檢查
- 鍵盤快捷鍵支援
- Skip links 功能測試
- 模態對話框焦點陷阱
- 焦點指示器對比度檢查

### 5. **螢幕閱讀器相容性** (`screen-reader-compatibility.spec.ts`)
- ARIA 屬性和角色驗證
- 圖片和媒體替代文字
- 表單標籤和描述
- 標題結構和地標
- Live regions 和動態內容
- 隱藏內容處理

### 6. **多環境測試** (`multi-environment-testing.spec.ts`)
- 不同裝置類型測試
- 螢幕亮度變化測試
- 高對比度模式支援
- 方向變化適應性
- 省電模式和效能模式
- 觸控目標大小驗證

### 7. **自動化報告系統** (`automated-reporting.spec.ts`)
- 執行摘要生成
- 詳細發現分析
- 優先建議生成
- 合規認證評估
- 歷史趨勢分析
- CI/CD 整合指標

## 🚀 快速開始

### 安裝依賴
```bash
npm install @axe-core/playwright @playwright/test
```

### 執行所有無障礙性測試
```bash
# 使用自定義腳本 (推薦)
node tests/accessibility/run-accessibility-tests.js

# 或使用 Playwright 直接執行
npx playwright test --config=playwright.accessibility.config.ts

# 僅執行特定測試類別
npx playwright test tests/accessibility/color-contrast.spec.ts
```

### 執行選項
```bash
# 指定基礎 URL
node tests/accessibility/run-accessibility-tests.js --base-url http://localhost:4000

# 調整並行度和重試次數
node tests/accessibility/run-accessibility-tests.js --parallel 1 --retries 3

# 在 CI 環境中執行
CI=true node tests/accessibility/run-accessibility-tests.js

# 顯示幫助信息
node tests/accessibility/run-accessibility-tests.js --help
```

## 📊 報告說明

### 報告文件位置
所有報告都保存在 `test-results/accessibility-reports/` 目錄下：

```
test-results/accessibility-reports/
├── accessibility-report-2024-01-01T12-00-00-000Z.json  # 詳細報告
├── accessibility-report-2024-01-01T12-00-00-000Z.md    # Markdown 報告
├── latest-summary.json                                 # 最新摘要
├── final-summary.json                                  # 最終摘要
├── ci-metrics.json                                     # CI/CD 指標
├── github-output.txt                                   # GitHub Actions 輸出
├── ci.properties                                       # Jenkins/CI 屬性
└── test-status.txt                                     # 測試狀態
```

### 報告內容

#### 執行摘要
- **整體分數**: 0-100 分的無障礙性評分
- **合規等級**: WCAG A/AA/AAA 合規狀態
- **關鍵問題**: 阻礙用戶使用的嚴重問題數量
- **總問題數**: 所有發現的問題總數
- **受影響頁面**: 存在問題的頁面數量

#### 詳細發現
每個測試類別的詳細結果：
- 分數和狀態
- 發現的問題列表
- 測試覆蓋率
- 通過/失敗的測試數量

#### 建議建議
按優先級排序的改進建議：
- **高優先級**: 影響基本可用性的問題
- **中優先級**: 影響用戶體驗的問題
- **低優先級**: 增強性改進

#### 合規認證
WCAG 認證準備狀態：
- 目前達到的 WCAG 等級
- 缺失的合規標準
- 預估修復時間

## 🔧 配置自定義

### 修改測試範圍
編輯 `run-accessibility-tests.js` 中的 `config.testFiles` 數組來調整要執行的測試。

### 添加自定義頁面
在各個測試文件中修改 `testPages` 或 `criticalPages` 數組：

```typescript
const testPages = [
  { path: '/', name: 'Home Page', critical: true },
  { path: '/your-new-page', name: 'Your New Page', critical: false }
];
```

### 調整評分標準
在 `automated-reporting.spec.ts` 中修改質量門檻：

```typescript
const qualityGatePass = summary.results.overallScore >= 75 && // 調整最低分數
                       summary.results.criticalIssues === 0;  // 調整允許的關鍵問題數
```

## 🔄 CI/CD 整合

### GitHub Actions
```yaml
name: Accessibility Testing
on: [push, pull_request]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run accessibility tests
        run: |
          npm run build
          CI=true node tests/accessibility/run-accessibility-tests.js

      - name: Upload accessibility reports
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: accessibility-reports
          path: test-results/accessibility-reports/

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        run: |
          SCORE=$(cat test-results/accessibility-reports/ci-metrics.json | jq -r '.accessibilityScore')
          echo "Accessibility Score: $SCORE/100" >> $GITHUB_STEP_SUMMARY
```

### Jenkins Pipeline
```groovy
pipeline {
    agent any

    stages {
        stage('Accessibility Testing') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install --with-deps'
                sh 'CI=true node tests/accessibility/run-accessibility-tests.js'
            }

            post {
                always {
                    archiveArtifacts artifacts: 'test-results/accessibility-reports/**/*'

                    script {
                        def props = readProperties file: 'test-results/accessibility-reports/ci.properties'
                        currentBuild.description = "Accessibility Score: ${props.ACCESSIBILITY_SCORE}/100"

                        if (props.ACCESSIBILITY_QUALITY_GATE != 'PASSED') {
                            currentBuild.result = 'UNSTABLE'
                        }
                    }
                }
            }
        }
    }
}
```

## 🛠️ 疑難排解

### 常見問題

#### 1. 服務器連接失敗
```bash
# 確保開發服務器正在運行
npm run dev

# 或指定不同的基礎 URL
node tests/accessibility/run-accessibility-tests.js --base-url http://localhost:4000
```

#### 2. 測試超時
```bash
# 增加超時時間或減少並行度
node tests/accessibility/run-accessibility-tests.js --parallel 1
```

#### 3. 瀏覽器安裝問題
```bash
# 重新安裝 Playwright 瀏覽器
npx playwright install --with-deps
```

#### 4. 記憶體不足
```bash
# 在 CI 環境中減少並行度
CI=true node tests/accessibility/run-accessibility-tests.js
```

### 調試模式

#### 執行單一測試並查看詳細輸出
```bash
npx playwright test tests/accessibility/color-contrast.spec.ts --headed --debug
```

#### 生成詳細的測試追蹤
```bash
npx playwright test --trace on
```

#### 查看測試報告
```bash
npx playwright show-report test-results/accessibility-reports/playwright-html
```

## 📈 持續改進

### 設定目標
1. **短期目標** (1-2 週):
   - 整體分數達到 80+
   - 關鍵問題數降為 0
   - 所有表單通過無障礙性檢查

2. **中期目標** (1-2 個月):
   - 整體分數達到 90+
   - 通過 WCAG AA 認證準備
   - 實施自動化監控

3. **長期目標** (3-6 個月):
   - 整體分數達到 95+
   - 探索 WCAG AAA 標準
   - 建立無障礙性設計系統

### 監控建議
- 每次部署前執行無障礙性測試
- 設定品質門檻阻止不合規的代碼合併
- 定期審查和更新測試標準
- 培訓團隊成員無障礙性最佳實踐

## 🤝 貢獻指南

### 添加新測試
1. 在 `tests/accessibility/` 目錄下創建新的 `.spec.ts` 文件
2. 遵循現有的測試結構和命名慣例
3. 更新 `run-accessibility-tests.js` 中的 `testFiles` 數組
4. 為新測試添加文件說明

### 改進現有測試
1. 確保向後兼容性
2. 更新相關文件
3. 添加適當的錯誤處理
4. 測試在不同環境中的表現

### 報告問題
當報告問題時，請包含：
- 測試環境詳情
- 重現步驟
- 預期和實際結果
- 相關的錯誤日誌

---

## 📚 相關資源

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [Playwright Testing Documentation](https://playwright.dev/docs/test-intro)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)
- [Screen Reader Testing Guide](https://webaim.org/articles/screenreader_testing/)

**版本**: 1.0.0
**最後更新**: 2024-01-01
**維護者**: Wasteland Tarot Development Team