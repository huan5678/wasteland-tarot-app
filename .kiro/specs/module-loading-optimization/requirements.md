# Requirements Document

## Project Description (Input)
Next.js 15 應用程式整體模組載入優化計畫。目前全站載入 3142 個模組，首次編譯時間達 13.8 秒。優化目標包含：

1. **全站性能優化**（非僅針對 404 頁面）
   - 減少所有頁面的模組載入數量
   - 改善首次編譯與 HMR 重載速度
   - 優化生產環境 bundle size

2. **核心優化策略**
   - Radix UI 套件的 tree-shaking 優化（5.0M → 按需載入）
   - 重量級元件（如 MusicPlayerDrawer）的動態載入
   - 系統初始化元件（7個）的條件式載入邏輯
   - Barrel export 模式檢視與重構

3. **分階段目標**
   - Phase 1: 快速優化（Radix UI + 動態載入）→ 目標 ~2900 模組
   - Phase 2: 中期優化（初始化元件條件載入）→ 目標 ~2200 模組
   - Phase 3: 長期優化（頁面特定 layout）→ 目標 ~1800 模組
   - Phase 4: 架構改進（條件式載入架構）→ 持續優化

4. **現有成果**
   - 已完成：iconMetadata barrel export 移除（影響 125 個檔案）
   - 已完成：authStore 開發環境載入時間優化（5000ms → 100ms）
   - 已完成：next.config.ts webpack cache 優化

## Requirements
<!-- Will be generated in /kiro:spec-requirements phase -->
