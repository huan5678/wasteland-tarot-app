# Fallout Background Effects Testing Suite

這是一個專為 Fallout 主題背景效果設計的完整測試套件，提供全面的視覺效果、性能分析和跨平台兼容性測試。

## 🎯 測試覆蓋範圍

### 1. 視覺效果測試 (`background-effects-visual.spec.ts`)
- ✅ 各頁面背景變體渲染正確性
- ✅ Fallout 色彩系統準確性
- ✅ 輻射粒子動畫顯示
- ✅ 掃描線和網格紋理效果
- ✅ 輝光效果和特殊色彩
- ✅ 視覺回歸測試（截圖對比）

### 2. 性能測試 (`background-performance.spec.ts`)
- ⚡ 頁面載入時間影響分析
- ⚡ CPU 使用率監控
- ⚡ 記憶體使用量追蹤
- ⚡ 不同動畫強度性能比較
- ⚡ 網路資源影響測試

### 3. 響應式設計測試 (`background-responsive.spec.ts`)
- 📱 多種螢幕尺寸適應性
- 📱 粒子數量動態調整
- 📱 移動設備優化驗證
- 📱 橫向/縱向顯示測試
- 📱 極端長寬比處理

### 4. 無障礙測試 (`background-accessibility.spec.ts`)
- ♿ `prefers-reduced-motion` 支援
- ♿ 色彩對比度檢查
- ♿ 螢幕閱讀器兼容性
- ♿ 鍵盤導航不受影響
- ♿ 高對比模式支援
- ♿ 文字縮放支援（200%）

### 5. 跨瀏覽器兼容性 (`background-cross-browser.spec.ts`)
- 🌐 Chrome、Firefox、Safari 測試
- 🌐 CSS 自定義屬性支援
- 🌐 梯度和動畫渲染
- 🌐 Transform 動畫兼容性
- 🌐 Box-shadow 效果支援

### 6. FPS 監控和性能分析 (`background-fps-monitoring.spec.ts`)
- 📊 即時 FPS 測量
- 📊 JavaScript 執行時間分析
- 📊 GPU 加速效果驗證
- 📊 長期性能穩定性測試
- 📊 動畫流暢度評估

## 🚀 如何執行測試

### 完整測試套件
```bash
# 執行所有背景效果測試
npm run test:background-effects

# 這會執行所有測試並生成詳細報告
```

### 個別測試類別
```bash
# 視覺效果測試
npm run test:background:visual

# 性能測試
npm run test:background:performance

# 響應式設計測試
npm run test:background:responsive

# 無障礙測試
npm run test:background:accessibility

# 跨瀏覽器測試
npm run test:background:cross-browser

# FPS 監控測試
npm run test:background:fps
```

### 開發模式測試
```bash
# UI 模式執行測試（推薦開發時使用）
npx playwright test tests/e2e/background-effects-visual.spec.ts --ui

# 僅在 Chrome 執行
npx playwright test tests/e2e/background-performance.spec.ts --project=chromium

# 除錯模式
npx playwright test tests/e2e/background-accessibility.spec.ts --debug
```

## 📊 測試報告

執行完整測試套件後，會在 `test-results/background-effects/` 目錄生成：

- `report.json` - 詳細的 JSON 格式報告
- `report.html` - 視覺化 HTML 報告（Fallout 主題樣式）
- `screenshots/` - 視覺回歸測試截圖
- `test-results/` - Playwright 測試結果

### 報告內容包括：
- 📈 FPS 性能數據
- 💾 記憶體使用分析
- 🎨 視覺效果驗證
- ♿ 無障礙合規性
- 🔧 改進建議

## 🎯 性能基準

### 期望性能指標：
- **平均 FPS**: > 55 FPS ✅
- **最低 FPS**: > 30 FPS ✅
- **記憶體使用**: < 100MB ✅
- **頁面載入時間**: < 1000ms ✅
- **CPU 使用率**: < 50ms/秒 ✅

### 動畫強度對應：
- **Low**: 20 粒子，8s 動畫週期
- **Medium**: 50 粒子，4s 動畫週期 （預設）
- **High**: 80 粒子，2s 動畫週期

## 🔧 客製化測試

### 修改測試參數
在測試檔案中可以調整：
- 粒子數量範圍
- 動畫持續時間
- 性能閾值
- 截圖比較容差

### 新增自定義測試
1. 複製現有測試檔案
2. 修改測試案例
3. 更新 `scripts/test-background-effects.ts` 引入新測試
4. 在 `package.json` 添加新的 npm script

## 🐛 常見問題

### 測試失敗排除
1. **視覺回歸失敗**: 檢查 `test-results/` 中的截圖差異
2. **性能測試失敗**: 確認系統負載不高，關閉其他應用程式
3. **跨瀏覽器失敗**: 檢查瀏覽器版本和驅動程式更新

### 最佳實務
- 在穩定的環境下執行性能測試
- 定期更新基準截圖
- 監控長期性能趨勢
- 在 CI/CD 中整合關鍵測試

## 📝 測試維護

### 定期更新：
- 📸 更新視覺回歸基準圖
- 🎯 調整性能基準值
- 🆕 新增新功能測試
- 🔍 檢視測試覆蓋率

### 版本控制：
- 測試程式碼應該和功能程式碼一起版本控制
- 基準截圖存放在版本控制中
- 性能基準記錄在測試配置中

---

*這個測試套件使用 Playwright 和現代前端測試最佳實務，確保 Fallout 主題背景效果在所有平台上都能提供最佳的使用者體驗。*