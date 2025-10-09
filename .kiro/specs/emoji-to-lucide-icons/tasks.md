# 實作計畫

## 任務清單

- [x] 1. 建立圖示包裝元件與型別定義
- [x] 1.1 建立 SuitIcon 元件
  - 實作統一的圖示樣式包裝元件,支援多種尺寸選項
  - 套用 Pip-Boy 風格樣式 (pip-boy-green 顏色、發光效果)
  - 整合無障礙性屬性支援 (aria-label、aria-hidden)
  - 實作響應式尺寸系統 (sm、md、lg、xl)
  - 設定預設 strokeWidth 為 1.5 以符合設計規範
  - _Requirements: 1.1, 1.2, 3.1-3.4, 4.3, 5.3, 5.4_

- [x] 1.2 擴展花色型別定義
  - 從 lucide-react 匯入 LucideIcon 型別
  - 擴展 SuitMetadata 介面新增 Icon 屬性
  - 為向後相容保留 icon 字串屬性並標記為 deprecated
  - 建立 SuitIconProps 型別定義
  - _Requirements: 4.1, 4.4, 9.1, 9.2_

- [ ] 1.3 撰寫 SuitIcon 元件單元測試
  - 驗證基本圖示渲染功能
  - 測試所有尺寸變體 (sm、md、lg、xl)
  - 驗證無障礙性屬性正確設定
  - 測試自訂 className 合併邏輯
  - 驗證預設值行為
  - _Requirements: 6.1, 6.4_

- [x] 2. 更新花色配置系統
- [x] 2.1 匯入 lucide-react 圖示元件
  - 匯入 Sparkles、Wine、Swords、Coins、Zap 圖示
  - 匯入 Image 圖示用於骨架屏
  - 匯入 Layers 圖示用於卡牌數量指示器
  - _Requirements: 1.3_

- [x] 2.2 更新 SUIT_CONFIG 配置
  - 為 Major Arcana 新增 Sparkles 圖示元件
  - 為 Nuka-Cola Bottles 新增 Wine 圖示元件
  - 為 Combat Weapons 新增 Swords 圖示元件
  - 為 Bottle Caps 新增 Coins 圖示元件
  - 為 Radiation Rods 新增 Zap 圖示元件
  - 在每個配置新增註解說明圖示選擇理由
  - _Requirements: 1.1, 1.3, 4.1, 4.2, 10.1_

- [ ] 2.3 驗證型別安全性
  - 執行 TypeScript 編譯檢查確保無型別錯誤
  - 撰寫測試驗證所有花色配置包含有效 Icon 屬性
  - _Requirements: 9.1, 9.3_

- [x] 3. 更新 SuitCard 元件
- [x] 3.1 替換花色圖示渲染邏輯
  - 匯入 SuitIcon 元件和 Layers 圖示
  - 將 emoji 顯示替換為 SuitIcon 元件渲染
  - 傳入 metadata.Icon、size="lg"、ariaHidden 屬性
  - 確保保持相同的容器結構和動畫效果
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 3.2, 4.2_

- [x] 3.2 替換卡牌數量指示器圖示
  - 將 🃏 emoji 替換為 SuitIcon 包裝的 Layers 圖示
  - 設定 size="sm" 並套用 pip-boy-green 顏色
  - 維持相同的發光效果樣式
  - 設定 ariaHidden="true" 因圖示與文字並存
  - _Requirements: 2.3, 3.4_

- [ ] 3.3 更新 SuitCard 元件測試
  - 驗證 SuitIcon 元件正確渲染
  - 測試 metadata.Icon 正確傳遞
  - 執行視覺快照測試確保無樣式回歸
  - 驗證卡牌數量指示器使用 lucide 圖示
  - _Requirements: 6.1, 6.3_

- [x] 4. 更新 CardThumbnail 骨架屏元件
- [x] 4.1 替換 CardThumbnailSkeleton 載入圖示
  - 匯入 Image 圖示從 lucide-react
  - 將 🃏 emoji 替換為 SuitIcon 包裝的 Image 圖示
  - 設定 size="sm" 並套用 text-pip-boy-green/30 顏色
  - 設定 ariaHidden="true" 用於裝飾性圖示
  - _Requirements: 2.1, 2.2, 3.2_

- [x] 4.2 更新 CardThumbnail 載入狀態圖示
  - 在載入骨架屏中使用 lucide-react 圖示
  - 確保保持相同的視覺樣式 (text-2xl 尺寸)
  - 維持 pip-boy-green 顏色和 drop-shadow 效果
  - _Requirements: 2.1, 2.2_

- [ ] 4.3 更新 CardThumbnail 元件測試
  - 驗證骨架屏使用 lucide-react 圖示
  - 測試載入到完成狀態的轉換
  - 確保圖示樣式正確套用
  - _Requirements: 6.2_

- [x] 5. 建立整合測試與視覺驗證
- [x] 5.1 撰寫 /cards 頁面整合測試
  - 驗證 5 個花色卡片皆包含 lucide-react 圖示 (SVG 元素檢測)
  - 測試響應式尺寸在不同視窗大小下正確調整
  - 執行跨瀏覽器測試 (Chrome、Firefox、Safari)
  - 使用 axe-core 驗證圖示 ARIA 屬性正確設定
  - _Requirements: 5.1, 5.2, 6.3, 6.4_

- [ ] 5.2 建立視覺回歸測試
  - 對每個花色卡片執行 Playwright 截圖比對
  - 驗證 hover 狀態圖示動畫正確作用
  - 確保圖示替換後無非預期視覺變更
  - _Requirements: 6.3_

- [ ] 5.3 撰寫無障礙性 E2E 測試
  - 使用 Playwright + axe-core 驗證螢幕閱讀器相容性
  - 測試鍵盤導航時圖示不干擾焦點管理
  - 驗證 pip-boy-green 圖示與背景對比度符合 WCAG AA
  - _Requirements: 3.1-3.4, 6.4_

- [ ] 6. 效能測試與優化驗證
- [ ] 6.1 驗證 bundle 大小與 tree-shaking
  - 執行 production build 分析 bundle size
  - 確認僅打包使用的 5-6 個 lucide-react 圖示
  - 測量替換前後 bundle size 差異,確保增量 < 10KB (gzipped)
  - 驗證圖示程式碼正確分割至 /cards 路由 chunk
  - _Requirements: 8.2, 8.4_

- [ ] 6.2 測量渲染效能指標
  - 使用 Lighthouse CI 測量 /cards 頁面 FCP,確保增加 < 50ms
  - 執行 CLS 測試驗證圖示替換無佈局偏移
  - 模擬大量圖示渲染測試效能無顯著退化
  - 使用 React DevTools Profiler 測量元件渲染時間
  - _Requirements: 8.1, 8.3_

- [ ] 7. 型別安全與開發體驗優化
- [ ] 7.1 完整 TypeScript 編譯驗證
  - 執行 tsc --noEmit 確保無型別錯誤或警告
  - 驗證 IDE 提供正確的圖示元件自動完成
  - 測試型別推導在圖示 props 傳遞時正確運作
  - _Requirements: 9.3, 9.4_

- [ ] 7.2 建立圖示使用文件
  - 在圖示配置檔案新增註解說明選擇理由
  - 撰寫範例程式碼展示如何使用 SuitIcon
  - 記錄圖示使用準則 (尺寸、顏色、無障礙性)
  - 說明如何從 lucide-react 選擇適當圖示
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 8. 最終驗證與整合
- [ ] 8.1 執行完整測試套件
  - 執行所有單元測試並確保 100% 通過率
  - 執行 E2E 測試驗證關鍵使用者流程
  - 執行無障礙性測試確保無嚴重違規
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 8.2 審查其他 emoji 使用情況
  - 審查 CategoryManager、CardShare、ReadingTemplates 元件
  - 識別功能性 emoji vs 裝飾性 emoji
  - 決定次要範圍的替換優先順序
  - 記錄發現並建立後續改進建議
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 8.3 最終整合檢查
  - 驗證所有變更的元件正確整合至系統
  - 確認視覺樣式在整個應用程式中一致
  - 執行跨平台測試確保相容性
  - 驗證效能指標符合所有目標
  - _Requirements: 5.1, 5.2, 5.3_
