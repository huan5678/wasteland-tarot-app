# 實作計畫

## 資料庫架構建置

- [x] 1. 建立賓果遊戲資料庫 Schema
  - 在 `backend/app/models/` 建立 `bingo.py`，定義 SQLAlchemy 模型：`UserBingoCard`, `DailyBingoNumber`, `UserNumberClaim`, `BingoReward`, `MonthlyResetLog`
  - 使用 UUID 作為主鍵，設定外鍵關聯至 `users` 表
  - 為 `UserBingoCard` 設定 PostgreSQL RANGE 分區（按 `month_year` 欄位）
  - 為所有時間相關欄位設定預設值 `NOW()`，並建立適當索引
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 2. 建立資料庫遷移檔案
  - 使用 Alembic 在 `backend/alembic/versions/` 生成遷移檔案
  - 包含建立主表、歷史表（`*_history`）、索引與約束的 SQL
  - 加入當月分區建立邏輯（例如 `user_bingo_cards_2025_10`）
  - 編寫測試驗證遷移可成功執行與回滾
  - _Requirements: 6.1, 6.5_

- [x] 3. 建立 Pydantic Schema 定義
  - 在 `backend/app/schemas/` 建立 `bingo.py`，定義請求/回應模型
  - 實作 `BingoCardCreate`, `BingoCardResponse`, `DailyNumberResponse`, `ClaimResult`, `LineCheckResult`
  - 為 `BingoCardCreate` 加入驗證器：確保 25 個號碼、範圍 1-25、無重複
  - 編寫單元測試驗證 Schema 驗證邏輯正確
  - _Requirements: 2.2, 6.1_

## 後端核心服務實作

- [x] 4. 實作賓果卡管理服務
  - 在 `backend/app/services/` 建立 `bingo_card_service.py`
  - 實作 `BingoCardManagerService` 類別，包含 `create_card()`, `get_user_card()`, `has_card_for_month()`, `validate_card_numbers()` 方法
  - 驗證使用者每月僅能建立一張賓果卡（檢查 UNIQUE 約束）
  - 將賓果卡 5x5 陣列儲存為 JSONB 格式
  - 編寫單元測試涵蓋建立、查詢、驗證邏輯
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 5. 實作每日號碼生成服務
  - 在 `backend/app/services/` 建立 `daily_number_generator_service.py`
  - 實作 `DailyNumberGeneratorService` 類別，包含 `generate_daily_number()`, `get_current_cycle_numbers()`, `reset_cycle()` 方法
  - 使用 Fisher-Yates shuffle 演算法確保 25 日內號碼隨機且不重複
  - 當號碼池達 25 個時自動重置並開始新循環週期
  - 編寫單元測試驗證 25 天內無重複號碼且範圍正確
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 6. 實作連線檢測服務（位元遮罩演算法）
  - 在 `backend/app/services/` 建立 `line_detection_service.py`
  - 實作 `LineDetectionService` 類別，定義 12 種連線模式常數（5 橫、5 直、2 斜）
  - 實作 `create_bitmask()` 將賓果卡與已領取號碼轉換為 25-bit 整數
  - 實作 `count_lines()` 使用位元 AND 運算檢測連線（O(1) 複雜度）
  - 實作 `check_lines()` 整合查詢賓果卡、計算遮罩、檢測連線流程
  - 編寫單元測試驗證各種連線組合檢測正確性與效能 (<10ms)
  - _Requirements: 4.1, 4.5_

- [x] 7. 實作每日領取服務
  - 在 `backend/app/services/` 建立 `daily_claim_service.py`
  - 實作 `DailyClaimService` 類別，包含 `claim_daily_number()`, `has_claimed_today()`, `get_claimed_numbers()` 方法
  - 整合連線檢測服務，每次領取後自動檢測連線狀態
  - 實作防重複領取邏輯（檢查 `user_number_claims` 表 UNIQUE 約束）
  - 當達成 3 條連線時自動呼叫 `LineDetectionService.issue_reward()` 發放獎勵
  - 編寫整合測試涵蓋領取流程、連線檢測與獎勵發放
  - _Requirements: 3.1, 3.2, 3.3, 4.2, 4.3_

- [x] 8. 實作獎勵發放邏輯
  - 在 `LineDetectionService` 中實作 `issue_reward()` 方法
  - 驗證使用者本月尚未領取獎勵（檢查 `bingo_rewards` 表 UNIQUE 約束）
  - 記錄獎勵發放時間、連線類型（JSONB 陣列）與使用者 ID
  - 編寫單元測試確保每使用者每月僅發放一次獎勵
  - _Requirements: 4.2, 4.3, 4.4_

## 任務排程系統

- [x] 9. ~~安裝並配置 APScheduler~~ → 改用 Supabase pg_cron + Edge Functions
  - ~~在後端專案使用 `uv add apscheduler pytz` 安裝排程器套件~~
  - ~~在 `backend/app/core/` 建立 `scheduler.py`，初始化 APScheduler 實例連接 PostgreSQL~~
  - ~~配置 SQLAlchemyJobStore 工作佇列表（自動建立於 PostgreSQL）~~
  - ~~編寫測試驗證 APScheduler 連接成功與任務註冊機制~~
  - **實際實作**: 使用 Supabase pg_cron 原生排程器，配合 Edge Functions 執行定時任務
  - 建立 `supabase/migrations/20251002000000_setup_pg_cron_bingo.sql` 設定排程
  - _Requirements: 8.1, 8.2_

- [x] 10. 實作每日號碼生成定時任務
  - ~~在 `backend/app/jobs/` 建立 `daily_number_job.py`~~
  - ~~註冊 APScheduler cron job，排程時間為每日 00:00 UTC+8~~
  - ~~任務執行 `DailyNumberGeneratorService.generate_daily_number()`~~
  - **實際實作**: 建立 `supabase/functions/generate-daily-number/index.ts` Edge Function
  - 使用 pg_cron 排程於每日 16:00 UTC (對應 00:00 UTC+8 隔天) 透過 HTTP 觸發
  - 實作 Fisher-Yates shuffle、25 天循環重置邏輯、時區轉換 (UTC+8)
  - 設定錯誤處理與日誌記錄（Edge Function 層級）
  - _Requirements: 1.1, 1.4, 8.1, 8.3, 8.4_

- [x] 11. 實作每月重置排程器
  - ~~在 `backend/app/services/` 建立 `monthly_reset_scheduler.py`~~
  - ~~實作 `MonthlyResetScheduler` 類別，包含 `execute_monthly_reset()`, `_archive_bingo_cards()`, `_clear_current_month_data()` 方法~~
  - ~~在 `backend/app/jobs/` 建立 `monthly_reset_job.py`，註冊 APScheduler cron job 於每月 1 日 00:00 UTC+8 執行~~
  - **實際實作**: 建立 `supabase/functions/monthly-reset/index.ts` Edge Function
  - 使用 pg_cron 排程於每月 1 日 16:00 UTC (對應 00:00 UTC+8) 透過 HTTP 觸發
  - 實作資料歸檔邏輯至 4 個歷史表 (cards, claims, rewards, numbers)
  - 實作清空當月資料、呼叫分區建立函式、記錄 monthly_reset_logs
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.5, 8.2_

- [x] 12. 實作自動分區建立任務
  - ~~在每月重置任務中加入下月分區建立邏輯（`create_next_month_partition()`）~~
  - ~~使用 SQLAlchemy `text()` 執行動態 SQL：`CREATE TABLE user_bingo_cards_YYYY_MM PARTITION OF user_bingo_cards FOR VALUES FROM ... TO ...`~~
  - **實際實作**: 建立 PostgreSQL 函式 `create_monthly_partition()` 於 `supabase/migrations/20251002000001_create_partition_function.sql`
  - Edge Function `monthly-reset` 透過 `supabase.rpc()` 呼叫此函式建立下月分區
  - 驗證分區建立成功且索引自動繼承（PostgreSQL PARTITION OF 機制）
  - 加入分區清理函式 `cleanup_old_partitions()` 用於刪除超過 N 個月的舊分區
  - _Requirements: 6.5_

## FastAPI 路由與端點

- [x] 13. 實作賓果卡 API 端點
  - 在 `backend/app/api/v1/endpoints/` 建立 `bingo.py`
  - 實作 `POST /api/v1/bingo/card` 端點呼叫 `BingoCardManagerService.create_card()`
  - 實作 `GET /api/v1/bingo/card` 端點查詢使用者賓果卡
  - 實作 `GET /api/v1/bingo/status` 端點返回使用者本月賓果狀態（是否已設定卡片、連線數）
  - 加入 JWT 認證依賴（使用現有 `get_current_user`）與錯誤處理
  - 編寫 API 測試驗證請求/回應格式、狀態碼與業務邏輯
  - _Requirements: 2.1, 2.3, 2.5, 7.1_

- [x] 14. 實作每日領取 API 端點
  - 在 `backend/app/api/v1/endpoints/bingo.py` 加入 `POST /api/v1/bingo/claim` 端點
  - 呼叫 `DailyClaimService.claim_daily_number()` 處理領取邏輯
  - 返回當日號碼、是否在賓果卡上、當前連線數、是否獲得獎勵
  - 處理已領取錯誤（409 狀態碼）與無賓果卡錯誤（404 狀態碼）
  - 編寫 API 測試涵蓋成功領取、重複領取、達成獎勵等情境
  - _Requirements: 3.1, 3.3, 3.4, 4.2, 7.4_

- [x] 15. 實作查詢 API 端點
  - 實作 `GET /api/v1/bingo/daily-number` 端點返回今日系統號碼
  - 實作 `GET /api/v1/bingo/lines` 端點查詢使用者連線狀態
  - 實作 `GET /api/v1/bingo/history/{month}` 端點查詢歷史月份記錄（從歷史表查詢）
  - 實作 `GET /api/v1/bingo/rewards` 端點查詢獎勵記錄
  - 編寫 API 測試驗證各端點回應正確性
  - _Requirements: 1.5, 4.5, 6.5_

- [x] 16. 實作錯誤處理與驗證
  - 在 `backend/app/core/exceptions.py` 定義自定義例外：`CardAlreadyExistsError`, `AlreadyClaimedError`, `InvalidCardNumbersError`, `NoCardFoundError`, `PastDateClaimError`
  - 在 FastAPI 全域例外處理器中映射例外至對應 HTTP 狀態碼與錯誤訊息（繁體中文）
  - 為所有 API 端點加入輸入驗證（Pydantic）與錯誤處理
  - 編寫測試驗證各錯誤情境返回正確狀態碼與訊息格式
  - _Requirements: All requirements need robust error handling_

## 前端狀態管理與 API 整合

- [x] 17. 建立 Zustand Bingo Store
  - 在 `src/lib/stores/` 建立 `bingoStore.ts`
  - 定義 Store 狀態：`dailyNumber`, `userCard`, `claimedNumbers`, `lineCount`, `hasReward`, `isLoading`, `error`
  - 實作 Actions：`fetchBingoStatus()`, `createCard()`, `claimDailyNumber()`, `checkLines()`
  - 使用 Fetch API 呼叫後端 `/api/v1/bingo/*` 端點
  - 整合 JWT Token（從現有 `authStore` 取得）至請求 Header
  - _Requirements: 2.3, 3.1, 4.1, 7.3_

- [x] 18. 實作賓果卡號碼驗證與狀態管理
  - 在 `bingoStore.ts` 加入前端驗證邏輯：`validateCardNumbers()`
  - 即時檢查選擇的號碼是否重複、範圍 1-25、數量是否為 25
  - 實作 `selectedNumbers` 狀態管理（Set<number>），支援新增/移除號碼
  - 實作 `canSubmitCard` computed 狀態（當 selectedNumbers.size === 25 時為 true）
  - _Requirements: 2.2, 7.2_

## 前端 UI 元件開發

- [x] 19. 實作賓果卡設定元件 (BingoCardSetup)
  - 在 `src/components/bingo/` 建立 `BingoCardSetup.tsx`
  - 渲染 1-25 號碼選擇器（Grid 佈局，可點擊切換選中狀態）
  - 整合 `bingoStore` 的 `selectedNumbers` 狀態與 `validateCardNumbers()` 方法
  - 顯示即時驗證錯誤訊息（重複號碼、數量不足等）
  - 實作「確認設定」按鈕，呼叫 `bingoStore.createCard()`
  - 使用 Tailwind CSS 設計 Fallout/Wasteland 風格樣式
  - _Requirements: 2.1, 7.1, 7.2_

- [x] 20. 實作賓果卡顯示元件 (BingoGrid)
  - 在 `src/components/bingo/` 建立 `BingoGrid.tsx`
  - 渲染 5x5 賓果卡 Grid，接收 `card` (number[][]) 與 `claimedNumbers` (Set<number>) props
  - 為已獲得號碼加上特殊樣式（高亮、勾選標記等）
  - 支援 `highlightNumber` prop，用於高亮顯示當日號碼
  - 實作連線視覺化（畫線標示橫向、直向、對角線連線）
  - _Requirements: 7.3, 7.5_

- [x] 21. 實作每日簽到元件 (DailyCheckin)
  - 在 `src/components/bingo/` 建立 `DailyCheckin.tsx`
  - 顯示當日系統號碼（從 `bingoStore.dailyNumber` 取得）
  - 實作「領取今日號碼」按鈕，呼叫 `bingoStore.claimDailyNumber()`
  - 處理已領取狀態（按鈕禁用、顯示「已領取」訊息）
  - 領取成功後在 `BingoGrid` 上高亮顯示號碼
  - _Requirements: 3.1, 7.4_

- [x] 22. 實作連線指示器元件 (LineIndicator)
  - 在 `src/components/bingo/` 建立 `LineIndicator.tsx`
  - 顯示當前連線數量（從 `bingoStore.lineCount` 取得）
  - 視覺化呈現連線類型（橫向、直向、對角線）與進度條
  - 使用 motion 動畫呈現連線數增加效果
  - _Requirements: 7.5_

- [x] 23. 實作獎勵通知元件 (RewardNotification)
  - 在 `src/components/bingo/` 建立 `RewardNotification.tsx`
  - 實作 Modal/Toast 顯示三連線獎勵通知
  - 使用 motion 動畫呈現慶祝效果（彈出、閃爍、粒子效果）
  - 整合 `bingoStore.hasReward` 狀態控制顯示/隱藏
  - 加入音效播放預留位置（可整合現有 Web Audio 系統）
  - _Requirements: 7.6_

- [x] 24. 實作賓果歷史查詢元件 (BingoHistory)
  - 在 `src/components/bingo/` 建立 `BingoHistory.tsx`
  - 實作月份選擇器（Dropdown）與查詢按鈕
  - 呼叫 `GET /api/v1/bingo/history/{month}` 取得歷史記錄
  - 顯示歷史賓果卡、已領取號碼、連線數、獎勵狀態
  - _Requirements: 6.5_

## 頁面整合與路由

- [x] 25. 建立賓果遊戲主頁面
  - 在 `src/app/bingo/` 建立 `page.tsx`（Next.js App Router）
  - 整合所有賓果元件：`BingoCardSetup`, `BingoGrid`, `DailyCheckin`, `LineIndicator`, `RewardNotification`, `BingoHistory`
  - 實作邏輯：無賓果卡顯示 `BingoCardSetup`，已設定則顯示遊戲介面
  - 從 `bingoStore.fetchBingoStatus()` 取得初始狀態判斷顯示哪個介面
  - 加入 JWT 認證保護（使用 `useAuthStore` hook）
  - _Requirements: 2.1, 2.5, 7.1, 7.3_

- [x] 26. 整合賓果遊戲至導航系統
  - 在 `Header.tsx` 加入「賓果簽到」連結（Desktop）
  - 在 `MobileNavigation.tsx` 加入「賓果」選項（Mobile）
  - 加入未領取今日號碼的提示標記（紅點）
  - _Requirements: 7.1_

## 測試與品質保證

- [x] 27. 實作後端整合測試套件
  - 在 `backend/tests/integration/` 建立 `test_bingo_flow.py`
  - 編寫完整流程測試：建立賓果卡 → 每日領取 → 連線檢測 → 獎勵發放 → 每月重置
  - 使用測試資料庫與 Factory Boy 生成測試資料
  - 驗證資料庫狀態變化、API 回應正確性與業務邏輯
  - 包含重複領取防護、無效號碼驗證、並發測試等場景
  - _Requirements: All requirements need integration validation_

- [x] 28. 實作前端整合測試
  - 在 `src/components/bingo/__tests__/` 建立 `bingo-flow.test.tsx`
  - 使用 MSW mock 所有 API 端點
  - 測試完整 UI 流程：設定賓果卡 → 領取號碼 → 檢視連線 → 接收獎勵通知
  - 驗證錯誤處理（已領取、無賓果卡等情境）
  - 包含元件單元測試與視覺回歸測試
  - _Requirements: All requirements need frontend validation_

- [x] 29. 實作 E2E 測試（Playwright）
  - 在 `tests/e2e/` 建立 `bingo-game.spec.ts`
  - 測試完整使用者旅程：登入 → 設定賓果卡 → 每日簽到 → 查看歷史
  - 驗證跨頁面互動、即時更新、錯誤提示
  - 測試 Responsive 行為（Desktop + Mobile）
  - 包含無障礙測試與視覺截圖測試
  - _Requirements: All requirements need E2E validation_

- [x] 30. 實作效能與負載測試
  - 編寫效能測試驗證連線檢測 <10ms（`backend/tests/performance/test_line_detection_performance.py`）
  - 使用 pytest-benchmark 測試位元遮罩演算法效能
  - 編寫 API 負載測試 Artillery 配置（`backend/tests/performance/load-test.yml`）
  - 模擬 1000+ 並發請求，驗證 API p95 <200ms、p99 <500ms
  - 包含資料庫查詢效能與並發領取效能測試
  - _Requirements: Performance targets validation_

## 部署與監控準備

- [x] 31. 準備資料庫遷移腳本
  - 整理所有 Supabase 遷移檔案，確保版本順序正確
  - 建立 `backend/DATABASE_MIGRATION_GUIDE.md` 說明遷移步驟
  - 包含 Supabase pg_cron 設定與 Edge Functions 部署流程
  - 編寫回滾計畫與驗證清單
  - 包含 Alembic 備用方案（自架 PostgreSQL）
  - _Requirements: Database deployment readiness_

- [x] 32. 配置環境變數與設定
  - 在 `backend/.env.example` 加入賓果相關設定：`BINGO_RESET_TIMEZONE`, `BINGO_CYCLE_LENGTH`, Edge Function URLs
  - 在前端 `.env.local.example` 加入 API 端點與功能開關設定
  - 更新部署文件說明必要環境變數
  - 包含 Supabase 環境變數與 Zeabur 部署配置
  - _Requirements: Configuration management_

- [x] 33. 加入監控與日誌
  - 建立 `backend/MONITORING_LOGGING_SETUP.md` 完整監控指南
  - 結構化日誌已整合至所有服務（JSON 格式）
  - 定時任務執行狀態記錄至 `monthly_reset_logs` 表
  - 設定 PostgreSQL 效能監控 SQL 查詢
  - 設定 pg_cron 失敗告警與 Edge Functions 錯誤追蹤
  - 包含 Grafana Dashboard 配置範例與 Slack 通知整合
  - _Requirements: 8.3, 8.4, 5.4_
