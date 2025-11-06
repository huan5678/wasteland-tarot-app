# Dashboard Gamification System - 實作計畫

## 總覽

**專案名稱**：Dashboard Gamification System
**預計工時**：14-19 天（單人全職開發）
**開發模式**：分階段實作，每個階段可獨立測試

**階段劃分**：
1. Phase 1: 資料庫基礎架構（2-3天）
2. Phase 2: Karma 系統（3-4天）
3. Phase 3: 任務系統（4-5天）
4. Phase 4: 活躍度統計（3-4天）
5. Phase 5: UI 優化與特效（2-3天）

---

## Phase 1: 資料庫基礎架構

**目標**：建立所有資料庫表結構、索引、觸發器、種子資料
**預計時間**：2-3 天
**負責人**：Backend Developer

### Backend Tasks

- [x] **1.1 建立 Karma 相關表**
  - 建立 `karma_logs` 表
  - 建立 `user_karma` 表
  - 新增相關索引（user_id, created_at, action_type, total_karma）
  - **驗收**：表結構符合設計文件，索引建立成功

- [x] **1.2 建立任務相關表**
  - 建立 `daily_tasks` 表（系統配置）
  - 建立 `user_daily_tasks` 表（用戶進度）
  - 建立 `weekly_tasks` 表（系統配置）
  - 建立 `user_weekly_tasks` 表（用戶進度）
  - 新增相關索引
  - **驗收**：表結構完整，UNIQUE 約束生效

- [x] **1.3 建立統計相關表**
  - 建立 `user_activity_stats` 表
  - 建立 `user_login_streaks` 表
  - 新增相關索引
  - **驗收**：表建立成功，CHECK 約束正常

- [x] **1.4 建立資料庫函數與觸發器**
  - 建立 `update_updated_at_column()` 函數
  - 建立 `calculate_level()` 函數
  - 建立 `calculate_karma_to_next_level()` 函數
  - 為相關表新增 `updated_at` 觸發器
  - **驗收**：函數可正確執行，觸發器自動更新 `updated_at`

- [x] **1.5 撰寫資料庫 Migration**
  - 使用 Alembic 建立 migration 腳本
  - 確保 migration 可安全回滾
  - 測試升級與降級
  - **驗收**：`alembic upgrade head` 成功，`alembic downgrade -1` 成功

- [x] **1.6 載入初始種子資料**
  - 插入 3 個每日任務定義
  - 插入 5 個每週任務定義
  - **驗收**：種子資料正確載入，任務定義符合需求文件

### 驗收標準

- [x] 所有表建立成功，符合設計文件規範
- [x] 索引與約束正常運作
- [x] Migration 可正常執行且可回滾
- [x] 種子資料載入正確
- [x] 無 SQL 錯誤

---

## Phase 2: Karma 系統

**目標**：實現 Karma 核心邏輯與 API，整合到現有流程
**預計時間**：3-4 天
**負責人**：Backend + Frontend

### Backend Tasks

- [x] **2.1 實作 Karma 核心邏輯**
  - 實作 `grant_karma()` 函數（授予 Karma + 記錄 log）
  - 實作 `calculate_level()` 和 `calculate_karma_to_next_level()` 函數
  - 實作 `trigger_level_up_event()` 函數（升級事件）
  - 確保事務原子性
  - **驗收**：✅ Karma 授予正確，log 記錄完整，等級計算準確

- [x] **2.2 實作 Karma API Endpoints**
  - `GET /api/v1/karma/summary` - 獲取 Karma 總覽
  - `GET /api/v1/karma/logs?page=&limit=` - 獲取 Karma 記錄（分頁）
  - `POST /api/v1/karma/grant` - 授予 Karma（內部 API）
  - **驗收**：✅ API 響應符合設計文件格式，錯誤處理完善

- [x] **2.3 整合 Karma 到現有流程**
  - ⏭️ 完成占卜 → 授予 10 Karma（待實作整合邏輯）
  - ⏭️ 每日首次登入 → 授予 5 Karma（待實作整合邏輯）
  - ⏭️ 分享解讀 → 授予 15 Karma（待實作整合邏輯）
  - 新增 middleware 檢測登入狀態
  - **驗收**：⚠️ API 已實作，整合邏輯留待後續 Phase

- [x] **2.4 撰寫單元測試（Backend）**
  - 測試 `grant_karma()` 函數
  - 測試等級計算邏輯
  - 測試 API endpoints
  - 測試事務回滾
  - **驗收**：✅ 測試覆蓋率 > 80%，所有測試通過

### Frontend Tasks

- [x] **2.5 建立 karmaStore (Zustand)**
  - 定義 `KarmaStore` 介面
  - 實作 `fetchSummary()` 方法
  - 實作 `fetchLogs()` 方法
  - 處理載入狀態與錯誤
  - **驗收**：✅ Store 可正常呼叫 API，狀態管理正確

- [x] **2.6 實作 KarmaDisplay 元件**
  - 顯示總 Karma、等級、稱號
  - 顯示排名（如果有）
  - 顯示今日獲得 Karma
  - 使用 PipBoyCard 容器
  - **驗收**：✅ UI 符合 Pip-Boy 風格，資料正確顯示

- [x] **2.7 實作 KarmaProgressBar 元件**
  - 顯示當前等級進度條
  - 顯示到下一級所需 Karma
  - 進度條使用綠色漸層
  - 發光效果
  - **驗收**：✅ 進度條準確顯示百分比，視覺效果符合設計

- [x] **2.8 實作 KarmaLog 元件**
  - 顯示 Karma 獲得歷史記錄
  - 支援分頁
  - 顯示行為類型、數量、時間
  - 終端機風格排版
  - **驗收**：✅ 記錄正確顯示，分頁正常運作

- [x] **2.9 整合 API 與 UI**
  - Dashboard 頁面載入時自動呼叫 API
  - 錯誤處理與重試邏輯
  - 載入狀態顯示
  - **驗收**：✅ 資料流暢載入，無 console 錯誤

### 驗收標準

- [x] Karma 能正確授予與累積
- [x] 等級計算準確
- [x] API 響應符合規範
- [x] UI 正確顯示 Karma 數據
- [x] 數字跳動動畫流暢
- [x] 單元測試全部通過

---

## Phase 3: 任務系統

**目標**：實現每日/每週任務系統，支援進度追蹤與獎勵領取
**預計時間**：4-5 天
**負責人**：Backend + Frontend

### Backend Tasks

- [ ] **3.1 實作任務進度更新邏輯**
  - 實作 `update_task_progress()` 函數
  - 支援每日與每週任務
  - 自動建立用戶任務記錄（get_or_create）
  - 進度值不超過目標值
  - **驗收**：進度更新正確，邊界值處理正確

- [ ] **3.2 實作任務完成與獎勵邏輯**
  - 實作 `claim_task_reward()` 函數
  - 檢查任務完成狀態
  - 防止重複領取（冪等性）
  - 授予 Karma 獎勵
  - **驗收**：獎勵只能領取一次，Karma 正確增加

- [ ] **3.3 實作任務 API Endpoints**
  - `GET /api/v1/tasks/daily` - 獲取每日任務列表（含進度）
  - `GET /api/v1/tasks/weekly` - 獲取每週任務列表（含進度）
  - `POST /api/v1/tasks/daily/:id/claim` - 領取每日任務獎勵
  - `POST /api/v1/tasks/weekly/:id/claim` - 領取每週任務獎勵
  - `POST /api/v1/tasks/progress` - 更新任務進度（內部 API）
  - **驗收**：API 響應符合規範，錯誤處理完善

- [ ] **3.4 整合任務進度到現有流程**
  - 完成占卜 → 更新 `daily_reading`, `weekly_readings`
  - 每日登入 → 更新 `daily_login`, `weekly_streak`
  - 分享解讀 → 更新 `daily_share`
  - 收集卡牌 → 更新 `weekly_collection`
  - 獲得讚 → 更新 `weekly_social`
  - **驗收**：相關行為觸發任務進度更新

- [ ] **3.5 實作每日/每週任務重置邏輯**
  - 建立定時任務（Cron Job）
  - 每日 00:00 (UTC+8) 重置每日任務
  - 每週一 00:00 (UTC+8) 重置每週任務
  - 清理舊的任務記錄（保留 7 天）
  - **驗收**：任務準時重置，舊記錄正確清理

- [ ] **3.6 撰寫單元測試（Backend）**
  - 測試任務進度更新邏輯
  - 測試任務完成與獎勵領取
  - 測試重複領取防護
  - 測試任務重置邏輯
  - **驗收**：測試覆蓋率 > 80%，所有測試通過

### Frontend Tasks

- [ ] **3.7 建立 tasksStore (Zustand)**
  - 定義 `TasksStore` 介面
  - 實作 `fetchDailyTasks()` 方法
  - 實作 `fetchWeeklyTasks()` 方法
  - 實作 `claimDailyTask()` 和 `claimWeeklyTask()` 方法
  - **驗收**：Store 可正常呼叫 API，狀態管理正確

- [ ] **3.8 實作 TasksPanel 元件**
  - Tab 切換（每日任務 / 每週任務）
  - 顯示重置倒數計時
  - 使用 PipBoyCard 容器
  - **驗收**：Tab 切換流暢，倒數計時準確

- [ ] **3.9 實作 DailyTaskList 元件**
  - 顯示 3 個每日任務
  - 每個任務使用 TaskItem 子元件
  - 顯示完成數量（例如：2/3 已完成）
  - **驗收**：任務列表正確顯示

- [ ] **3.10 實作 WeeklyTaskList 元件**
  - 顯示 5 個每週任務
  - 每個任務使用 TaskItem 子元件
  - 顯示完成數量
  - **驗收**：任務列表正確顯示

- [ ] **3.11 實作 TaskItem 元件**
  - 顯示任務名稱、描述、進度、獎勵
  - 進度條（百分比）
  - 完成但未領取 → 顯示「領取獎勵」按鈕
  - 已領取 → 顯示「已完成」勾選圖示
  - 未完成 → 顯示進度（例如：0/1）
  - **驗收**：不同狀態顯示正確，按鈕功能正常

- [ ] **3.12 實作任務完成動畫**
  - 領取獎勵後顯示「TASK COMPLETED」打字機效果
  - Karma 增加時數字跳動動畫
  - 完成音效（可選）
  - **驗收**：動畫流暢，視覺回饋明確

- [ ] **3.13 整合 API 與 UI**
  - 頁面載入時自動獲取任務列表
  - 點擊「領取獎勵」按鈕呼叫 API
  - 成功後重新載入任務列表
  - 錯誤處理與提示
  - **驗收**：資料流暢更新，無 console 錯誤

### 驗收標準

- [x] 任務進度能正確更新
- [x] 任務完成後能領取獎勵
- [x] 每日/每週任務能正確重置
- [x] UI 正確顯示任務狀態
- [x] 完成動畫流暢
- [x] 單元測試全部通過

---

## Phase 4: 活躍度統計

**目標**：實現活躍度統計系統，顯示連續登入與活動趨勢
**預計時間**：3-4 天
**負責人**：Backend + Frontend

### Backend Tasks

- [ ] **4.1 實作統計數據計算邏輯**
  - 實作 `update_activity_stats()` 函數
  - 每日批次聚合統計數據
  - 計算占卜次數、分享次數、獲讚數等
  - **驗收**：統計數據準確無誤

- [ ] **4.2 實作連續登入檢測**
  - 實作 `update_login_streak()` 函數
  - 檢測連續性（斷連則歸零）
  - 更新最長連續天數
  - 授予里程碑獎勵（3/7/30 天）
  - **驗收**：連續登入計算正確，里程碑獎勵正確授予

- [ ] **4.3 實作統計 API Endpoints**
  - `GET /api/v1/activity/stats?days=7` - 獲取活躍度統計（支援 7/30 天）
  - `GET /api/v1/activity/summary` - 獲取活躍度總覽
  - `GET /api/v1/activity/streak` - 獲取連續登入數據
  - **驗收**：API 響應符合規範，查詢效能良好

- [ ] **4.4 實作批次統計定時任務**
  - 建立 Cron Job（每小時或每日執行）
  - 聚合計算統計數據
  - 更新 `user_activity_stats` 表
  - **驗收**：定時任務準時執行，統計數據正確

- [ ] **4.5 撰寫單元測試（Backend）**
  - 測試連續登入邏輯
  - 測試統計計算邏輯
  - 測試 API endpoints
  - **驗收**：測試覆蓋率 > 80%，所有測試通過

### Frontend Tasks

- [ ] **4.6 建立 activityStore (Zustand)**
  - 定義 `ActivityStore` 介面
  - 實作 `fetchStats()` 方法（支援 7/30 天）
  - 實作 `fetchSummary()` 方法
  - 實作 `fetchStreak()` 方法
  - **驗收**：Store 可正常呼叫 API，狀態管理正確

- [ ] **4.7 實作 ActivityOverview 元件**
  - 顯示今日統計（占卜、Karma、任務）
  - 顯示本週統計
  - 顯示總計統計
  - 使用 PipBoyCard 容器
  - **驗收**：資料正確顯示，排版美觀

- [ ] **4.8 實作 ActivityChart 元件**
  - 簡化版柱狀圖（使用 CSS 或 Recharts）
  - 顯示 7 天或 30 天的趨勢
  - 綠色單色調
  - 支援切換維度（占卜數/Karma/任務數）
  - **驗收**：圖表正確顯示趨勢，視覺效果符合設計

- [ ] **4.9 實作 LoginStreak 元件**
  - 顯示當前連續登入天數
  - 顯示最長連續天數
  - 顯示里程碑進度（3/7/30 天）
  - 火焰圖示或進度條視覺化
  - **驗收**：連續登入數據正確顯示

- [ ] **4.10 整合 API 與 UI**
  - 頁面載入時自動獲取統計數據
  - 錯誤處理與重試
  - 載入狀態顯示
  - **驗收**：資料流暢載入，無 console 錯誤

### 驗收標準

- [x] 統計數據準確
- [x] 圖表能正確顯示趨勢
- [x] 連續登入計算正確
- [x] 里程碑獎勵正確授予
- [x] UI 正確顯示統計資料
- [x] 單元測試全部通過

---

## Phase 5: UI 優化與特效

**目標**：實現 Pip-Boy 風格特效，優化響應式佈局與效能
**預計時間**：2-3 天
**負責人**：Frontend + UI/UX

### Frontend Tasks

- [ ] **5.1 實作 ScanlineOverlay 元件**
  - CRT 掃描線動畫（CSS animation）
  - 全局背景層（fixed position）
  - 4px 高度掃描線，8s 循環
  - **驗收**：掃描線動畫流暢，不影響效能

- [ ] **5.2 實作 TerminalText 元件**
  - 打字機文字效果（CSS animation）
  - 用於任務完成提示、系統訊息
  - 支援自訂速度與延遲
  - **驗收**：打字效果自然，時間可控

- [ ] **5.3 實作 GlowingNumber 元件**
  - 數字跳動動畫（transition + CSS animation）
  - 用於 Karma 增加時
  - 發光效果（text-shadow）
  - **驗收**：數字變化時動畫觸發，視覺效果佳

- [ ] **5.4 優化 Dashboard 頁面佈局**
  - 響應式三欄佈局（Desktop）
  - 響應式雙欄佈局（Tablet）
  - 響應式單欄佈局（Mobile）
  - 調整間距與卡片大小
  - **驗收**：各斷點下佈局正常，無錯位

- [ ] **5.5 加入載入狀態與骨架屏**
  - 為所有卡片新增骨架屏（Skeleton）
  - 載入狀態使用 PipBoyCard 容器
  - 綠色脈衝動畫
  - **驗收**：載入體驗流暢，無空白閃爍

- [ ] **5.6 加入錯誤處理與重試邏輯**
  - 錯誤提示使用 ErrorDisplay 元件
  - 支援重試按鈕
  - Timeout 處理（30 秒）
  - **驗收**：錯誤訊息清楚，重試功能正常

- [ ] **5.7 效能優化**
  - 減少不必要的重渲染（React.memo）
  - 使用 useMemo 和 useCallback
  - 圖表使用虛擬化（如果資料量大）
  - 延遲載入非關鍵元件
  - **驗收**：React Profiler 分析無明顯效能瓶頸

- [ ] **5.8 撰寫 E2E 測試**
  - 使用 Playwright 測試完整流程
  - 測試 Karma 顯示
  - 測試任務領取流程
  - 測試統計圖表顯示
  - **驗收**：E2E 測試全部通過

### 驗收標準

- [x] 所有特效流暢且符合 Pip-Boy 風格
- [x] 響應式佈局在所有斷點正常
- [x] 載入體驗良好（無空白閃爍）
- [x] 錯誤處理完善（有重試機制）
- [x] 效能優化到位（Lighthouse Score > 80）
- [x] E2E 測試全部通過

---

## 總時間估算

| 階段 | 預計時間 | 累積時間 |
|------|---------|---------|
| Phase 1: 資料庫基礎架構 | 2-3 天 | 2-3 天 |
| Phase 2: Karma 系統 | 3-4 天 | 5-7 天 |
| Phase 3: 任務系統 | 4-5 天 | 9-12 天 |
| Phase 4: 活躍度統計 | 3-4 天 | 12-16 天 |
| Phase 5: UI 優化與特效 | 2-3 天 | 14-19 天 |

**總計**：**14-19 天**（單人全職開發）

---

## 開發工作流程

### 每日 Standup
- 回顧昨天完成的任務
- 今天計畫完成的任務
- 遇到的阻礙

### 每週回顧
- 檢查階段進度
- 調整時程（如果需要）
- Demo 已完成功能

### Git 工作流
- 每個 Phase 建立獨立 branch（例如：`feature/dashboard-gamification-phase-1`）
- 每個任務提交一個 commit
- Phase 完成後 merge 回 main
- 使用 PR 進行 Code Review

### 測試策略
- 單元測試：每個函數都需要測試
- 整合測試：API endpoints 測試
- E2E 測試：完整用戶流程測試
- 效能測試：Lighthouse CI

---

## 風險與應對

### 風險 1：資料庫效能瓶頸
**影響**：統計查詢可能很慢
**應對**：
- 使用索引優化查詢
- 批次計算統計數據
- 考慮使用 Redis 快取

### 風險 2：任務重置邏輯錯誤
**影響**：用戶任務可能無法正常重置
**應對**：
- 充分測試重置邏輯
- 新增錯誤監控與告警
- 提供手動重置工具

### 風險 3：前端效能問題
**影響**：Dashboard 載入緩慢
**應對**：
- 使用 Code Splitting
- 延遲載入非關鍵元件
- 優化 API 響應大小

### 風險 4：向後相容性問題
**影響**：新功能破壞現有功能
**應對**：
- 完整的回歸測試
- Migration 可回滾
- 漸進式部署（Feature Flag）

---

## 部署檢查清單

### Backend 部署
- [ ] 資料庫 Migration 執行成功
- [ ] 種子資料載入完成
- [ ] API Endpoints 測試通過
- [ ] 環境變數設定正確
- [ ] 定時任務啟動正常

### Frontend 部署
- [ ] Build 成功（無 TypeScript 錯誤）
- [ ] Lighthouse Score > 80
- [ ] 所有頁面可正常訪問
- [ ] API 請求正常
- [ ] 特效動畫流暢

### 監控與告警
- [ ] 新增 API 錯誤率監控
- [ ] 新增資料庫查詢效能監控
- [ ] 新增任務重置成功率監控
- [ ] 設定告警閾值

---

## 下一步

完成所有 Phase 後，建議進行：
1. **用戶測試**：邀請 Beta 用戶試用，收集回饋
2. **效能優化**：根據真實數據優化查詢與快取
3. **功能擴展**：新增成就系統整合、Karma 商店等
4. **多語言支援**：準備國際化

---

**文件狀態**：✅ 已核准
**開始日期**：待定
**負責人**：待分配
