# Requirements Document

## 專案描述

統一 Karma 與遊戲化系統（Unified Karma & Gamification System）是一項架構重構與功能擴展專案，目標是：

1. **資料模型重構**：將 `User.karma_score` 遷移至獨立的 `UserKarma` 表，支援雙分數系統（alignment_karma 0-100 用於陣營對齊，total_karma 無上限累積用於等級進階）
2. **清理歷史債務**：移除舊版 `user_achievements` 表，統一使用 `user_achievement_progress` + `achievements` 表結構
3. **建立等級系統**：實作基於 total_karma 的使用者等級系統，支援等級進階、稱號解鎖與特權
4. **任務系統**：新建每日任務與每週任務系統，提供固定與隨機任務，完成任務獲得 Karma 獎勵
5. **統一服務層**：確保 KarmaService 作為唯一的 Karma 分數管理入口，AchievementService 與 QuestService 透過 KarmaService 發放獎勵
6. **保留現有功能**：所有陣營對齊功能（faction affinity, character voice, AI interpretation tone）不受影響

專案涉及 8 個使用 KarmaService 的核心服務、4 個 Achievement 相關服務、新建 Quest 系統、資料遷移腳本、以及完整的測試與監控機制。

## Requirements

### Requirement 1: UserKarma 資料模型重構（UserKarma Data Model Refactor）
**Objective:** 作為系統架構師，我需要將 Karma 資料從 User 表獨立出來，以便支援雙分數系統、簡化查詢、提升擴展性。

#### Acceptance Criteria
1. WHEN 系統初始化 THEN 建立 `user_karma` 表包含欄位：user_id (FK to users), alignment_karma (0-100), total_karma (>= 0), level (計算欄位), created_at, updated_at
2. WHEN 使用者執行產生業力的行動 THEN KarmaService SHALL 同時更新 UserKarma.alignment_karma 與 UserKarma.total_karma
3. IF alignment_karma 達到上限 100 或下限 0 THEN 系統 SHALL 限制 alignment_karma 範圍但繼續累積 total_karma
4. WHERE 陣營判斷需求（faction alignment, AI tone, character voice）THE KarmaService SHALL 使用 alignment_karma 作為判斷依據
5. WHERE 等級進階需求（level calculation, privilege unlock）THE LevelService SHALL 使用 total_karma 作為計算依據
6. WHEN alignment_karma 更新時 THEN 系統 SHALL 即時重新計算陣營分類（Very Good: 80-100, Good: 60-79, Neutral: 40-59, Evil: 20-39, Very Evil: 0-19）
7. WHEN 資料遷移完成後 THEN User.karma_score SHALL 標記為 deprecated 但保留 3 個月過渡期（向後相容）

### Requirement 2: 清理成就系統歷史債務（Achievement System Cleanup）
**Objective:** 作為資料庫管理員，我需要移除舊版成就表並統一資料結構，以便簡化維護與避免混淆。

#### Acceptance Criteria
1. WHEN 資料遷移腳本執行 THEN 系統 SHALL 檢查 `user_achievements` 表是否存在資料
2. IF user_achievements 表有資料 THEN 遷移腳本 SHALL 將資料轉換至 `user_achievement_progress` + `achievements` 結構
3. WHEN 資料遷移完成 THEN 遷移腳本 SHALL 驗證資料完整性（資料筆數、關鍵欄位、關聯完整性）
4. IF 遷移驗證成功 THEN 系統 SHALL 重命名 user_achievements 為 user_achievements_deprecated 保留 1 個月
5. WHEN 1 個月後 THEN 系統 SHALL 提供清理腳本刪除 user_achievements_deprecated 表
6. WHERE 程式碼仍參照 UserAchievement model THE 重構 SHALL 更新所有 imports 指向 UserAchievementProgress
7. WHEN 清理完成後 THEN 所有 Achievement 相關查詢 SHALL 只使用 achievements + user_achievement_progress 表

### Requirement 3: 使用者等級系統（User Level System）
**Objective:** 作為遊戲化設計者，我需要建立基於 total_karma 的等級系統，以便提供進度感與成就感。

#### Acceptance Criteria
1. WHEN 系統初始化 THEN 建立 `user_levels` 表包含：level (1-100), required_karma, title_zh_tw, icon_name, privileges (JSONB)
2. WHEN 使用者 total_karma 增加 THEN LevelService SHALL 自動計算當前等級並檢查是否升級
3. IF 使用者達到新等級所需 karma THEN 系統 SHALL 觸發升級事件、更新 UserProfile.level、發送通知、解鎖稱號與特權
4. WHEN 計算等級進度 THEN 系統 SHALL 返回：current_level, current_karma, next_level_karma, progress_percentage
5. WHERE 等級對應稱號 THE LevelService SHALL 支援多語言稱號（zh-tw, en）且與 Fallout 世界觀相符（例如：Vault Dweller, Wasteland Wanderer, Brotherhood Paladin）
6. WHEN 等級曲線設計 THEN 系統 SHALL 使用指數成長公式防止後期進度過快（例如：level_karma = 100 * (level ^ 1.5)）
7. IF 等級解鎖特權 THEN 特權 SHALL 包含：解讀次數上限提升、特殊牌陣解鎖、獨家角色語音、社交功能增強

### Requirement 4: 每日/每週任務系統（Daily/Weekly Quest System）
**Objective:** 作為遊戲化設計者，我需要建立任務系統提供固定與隨機任務，以便增加使用者黏著度與活躍度。

#### Acceptance Criteria
1. WHEN 系統初始化 THEN 建立 `quests` 表包含：code, name_zh_tw, description, type (DAILY/WEEKLY), category (READING/SOCIAL/BINGO/EXPLORATION), objectives (JSONB), rewards (JSONB), is_active
2. WHEN 系統初始化 THEN 建立 `user_quest_progress` 表追蹤：user_id, quest_id, status (AVAILABLE/IN_PROGRESS/COMPLETED/CLAIMED), current_progress, target_progress, available_at, expires_at, completed_at
3. WHEN 每日重置時 THEN QuestService SHALL 為所有活躍使用者分配 3 個每日任務（1 固定 + 2 隨機）
4. WHEN 每週重置時 THEN QuestService SHALL 為所有活躍使用者分配 3 個每週任務（1 固定 + 2 隨機從困難池抽取）
5. IF 使用者完成任務條件 THEN QuestService SHALL 自動檢測進度並更新 status 為 COMPLETED
6. WHEN 使用者領取任務獎勵 THEN QuestService SHALL 呼叫 KarmaService 發放 karma_points 並標記 status 為 CLAIMED
7. WHERE 任務範例 THE 系統 SHALL 包含：每日解讀 1 次 (+10 karma), 每週完成 5 次解讀 (+50 karma), Bingo 簽到連續 3 天 (+20 karma), 社交互動 3 次 (+15 karma)

### Requirement 5: 統一 Karma 服務層（Unified Karma Service Layer）
**Objective:** 作為後端開發者，我需要確保 KarmaService 作為唯一的 Karma 管理入口，以便統一業務邏輯與避免資料不一致。

#### Acceptance Criteria
1. WHEN AchievementService 發放 Karma 獎勵 THEN 必須透過 KarmaService.add_karma() 而非直接操作資料庫
2. WHEN QuestService 發放 Karma 獎勵 THEN 必須透過 KarmaService.add_karma() 而非直接操作資料庫
3. IF 任何服務需要查詢使用者 Karma THEN 必須透過 KarmaService.get_user_karma() 取得 UserKarma 物件
4. WHEN KarmaService 更新 Karma 分數 THEN 系統 SHALL 同時更新 alignment_karma, total_karma, 並寫入 KarmaHistory 審計日誌
5. WHERE 規則引擎需求 THE KarmaService SHALL 保留現有 KarmaRulesEngine（每日上限、倍數加成、驗證機制）
6. WHEN Karma 變更觸發陣營變化 THEN KarmaService SHALL 發出事件通知相關服務（AI interpretation, character voice, faction service）
7. IF KarmaService 操作失敗 THEN 系統 SHALL 回滾 transaction 並返回明確錯誤訊息避免部分更新

### Requirement 6: 資料遷移策略（Data Migration Strategy）
**Objective:** 作為資料庫管理員，我需要執行零停機資料遷移，以便在不影響生產環境的前提下完成系統升級。

#### Acceptance Criteria
1. WHEN 遷移腳本執行 THEN 系統 SHALL 建立 `user_karma` 表並為每個使用者建立記錄
2. WHEN 遷移 User.karma_score THEN 系統 SHALL 將值同時寫入 UserKarma.alignment_karma 與 UserKarma.total_karma（初始值相同）
3. IF user_achievements 表有資料 THEN 遷移腳本 SHALL 轉換至 achievements + user_achievement_progress 結構
4. WHEN 遷移完成 THEN 系統 SHALL 執行資料完整性驗證（筆數、欄位、FK 關聯）並生成報告
5. IF 遷移失敗 THEN 系統 SHALL 自動回滾並記錄詳細錯誤（哪一筆資料、哪個欄位、錯誤原因）
6. WHERE 過渡期需求 THE 系統 SHALL 支援雙寫模式（更新 User.karma_score 時同步更新 UserKarma.alignment_karma）維持 3 個月
7. WHEN 過渡期結束 THEN 系統 SHALL 移除雙寫邏輯並將 User.karma_score 標記為 deprecated

### Requirement 7: 陣營對齊功能保留（Faction Alignment Feature Preservation）
**Objective:** 作為產品經理，我需要確保重構後所有陣營對齊功能正常運作，以便維持現有使用者體驗。

#### Acceptance Criteria
1. WHEN 系統重構完成 THEN alignment_karma 功能 SHALL 與舊版 User.karma_score 行為完全相同
2. WHEN 使用者 alignment_karma 改變 THEN 系統 SHALL 即時更新 faction_affinity 分數（Brotherhood of Steel, NCR, Raiders, Vault-Tec）
3. IF alignment_karma 位於 80-100 範圍 THEN 系統 SHALL 標記使用者為 "Very Good" 並啟用對應角色語音與內容過濾
4. IF alignment_karma 位於 0-19 範圍 THEN 系統 SHALL 標記使用者為 "Very Evil" 並啟用對應角色語音與內容過濾
5. WHEN AI 解讀系統生成回應 THEN 系統 SHALL 根據 alignment_karma 調整語調、建議與陣營視角
6. WHERE 現有 8 個使用 KarmaService 的服務 THE 重構 SHALL 確保所有呼叫路徑測試通過不影響功能
7. IF 陣營相關測試 THEN 系統 SHALL 涵蓋：陣營計算邏輯、角色語音選擇、AI prompt 調整、UI 顯示

### Requirement 8: API 向後相容與新端點（API Backward Compatibility & New Endpoints）
**Objective:** 作為前端開發者，我需要 API 保持相容並提供新端點，以便平滑遷移與使用新功能。

#### Acceptance Criteria
1. WHEN 前端呼叫舊版 API `/api/karma/score` THEN 系統 SHALL 返回 alignment_karma 值（從 UserKarma 表讀取）維持向後相容
2. WHEN 前端呼叫新版 API `/api/karma/v2/profile` THEN 系統 SHALL 返回：{alignment_karma, total_karma, level, level_progress, next_level_karma, alignment_category, faction_affinities}
3. WHEN 前端呼叫 `/api/quests/daily` THEN 系統 SHALL 返回當日可用任務列表與進度
4. WHEN 前端呼叫 `/api/quests/weekly` THEN 系統 SHALL 返回本週可用任務列表與進度
5. WHEN 前端呼叫 `/api/level/info` THEN 系統 SHALL 返回：{current_level, level_title, privileges, next_level_requirements, level_history}
6. IF 現有服務使用 User.karma_score THEN 過渡期 SHALL 同步寫入 UserKarma.alignment_karma 確保資料一致
7. WHERE 錯誤處理 THE 新端點 SHALL 使用統一錯誤格式：{error_code, message, details, timestamp}

### Requirement 9: 效能與擴展性（Performance and Scalability）
**Objective:** 作為系統效能負責人，我需要確保新系統不影響回應速度，以便維持使用者體驗品質。

#### Acceptance Criteria
1. WHEN KarmaService 處理單一 Karma 行動 THEN 系統 SHALL 在 100ms 內完成（不含外部 API 呼叫）
2. WHEN 查詢使用者 Karma 資料 THEN 系統 SHALL 在 50ms 內返回（資料庫查詢 + 快取）
3. IF 每日任務重置（高峰期）THEN QuestService SHALL 支援 10,000 使用者在 5 分鐘內完成分配
4. WHEN KarmaHistory 表達到 1M 筆記錄 THEN 查詢效能 SHALL 不劣化超過 10%（需要適當索引）
5. WHERE 快取策略 THE 系統 SHALL 使用 Redis 快取 UserKarma 資料（TTL 5 分鐘）並在寫入時 invalidate
6. WHEN 資料庫連線池耗盡 THEN 系統 SHALL 優雅降級返回 503 而非崩潰
7. IF 等級計算需求 THEN LevelService SHALL 使用預計算欄位避免每次查詢時重複計算

### Requirement 10: 測試覆蓋率與品質保證（Test Coverage and Quality Assurance）
**Objective:** 作為 QA 工程師，我需要完整的測試套件，以便確保重構不引入迴歸問題。

#### Acceptance Criteria
1. WHEN KarmaService 重構完成 THEN 單元測試 SHALL 達到至少 85% 覆蓋率（line coverage）
2. WHEN LevelService 開發完成 THEN 測試 SHALL 涵蓋：等級計算、升級觸發、稱號解鎖、特權驗證
3. WHEN QuestService 開發完成 THEN 測試 SHALL 涵蓋：任務分配、進度追蹤、獎勵發放、過期處理
4. IF 資料遷移腳本測試 THEN 測試 SHALL 使用真實大小資料集（至少 10,000 users）驗證正確性與效能
5. WHERE API 測試 THE 測試套件 SHALL 使用合約測試確保向後相容性
6. WHEN 整合測試執行 THEN 測試 SHALL 驗證 KarmaService, AchievementService, QuestService 的整合流程
7. IF 效能測試 THEN 系統 SHALL 在 500 req/s 負載下維持 P95 < 150ms 回應時間

---

## 額外需求

### Requirement 11: 監控與可觀測性（Monitoring and Observability）
**Objective:** 作為 SRE 工程師，我需要完整監控機制，以便快速診斷與修復問題。

#### Acceptance Criteria
1. WHEN KarmaService 執行操作 THEN 系統 SHALL 記錄結構化日誌：{user_id, action_type, alignment_delta, total_delta, timestamp, execution_ms}
2. WHEN 規則引擎拒絕操作 THEN 系統 SHALL 記錄 WARNING：{reason, daily_used, limit, user_context}
3. IF 遷移執行中 THEN 系統 SHALL 每 1000 筆輸出進度：{processed, total, errors, eta}
4. WHEN 效能異常 THEN 系統 SHALL 發送 Prometheus metrics 並觸發告警（回應時間 > 200ms）
5. WHERE 錯誤發生 THE 系統 SHALL 記錄完整堆疊追蹤與輸入參數

### Requirement 12: 文件與範例（Documentation and Examples）
**Objective:** 作為開發者，我需要完整文件與範例，以便快速整合新系統。

#### Acceptance Criteria
1. WHEN 系統部署前 THEN 提供完整 OpenAPI/Swagger 文件
2. WHEN 遷移執行前 THEN 提供遷移指南：{步驟、檢查清單、回滾程序}
3. IF 開發者整合 THEN 提供程式碼範例：{Karma 發放、任務完成、等級查詢}
4. WHEN 架構變更完成 THEN 更新架構圖反映新資料流
5. WHERE 疑難排解 THE 提供故障排除指南與常見錯誤解決方案

---

## 專案範圍摘要

### 新建資料表 (4 張)
1. `user_karma` - 使用者業力資料（alignment_karma, total_karma）
2. `user_levels` - 等級定義表（level 1-100, required_karma, title, privileges）
3. `quests` - 任務定義表（daily/weekly, objectives, rewards）
4. `user_quest_progress` - 使用者任務進度表

### 遷移資料表 (2 張)
1. `user_achievements` → 合併至 `achievements` + `user_achievement_progress`
2. `User.karma_score` → 遷移至 `user_karma.alignment_karma`

### 新建服務 (2 個)
1. `LevelService` - 等級計算與升級管理
2. `QuestService` - 任務分配、進度追蹤、獎勵發放

### 重構服務 (1 個)
1. `KarmaService` - 適配 UserKarma 表，保留 KarmaRulesEngine

### 整合服務 (2 個)
1. `AchievementService` - 確保透過 KarmaService 發放獎勵
2. Existing 8 services - 更新 Karma 查詢路徑

### 新建 API 端點 (4 組)
1. `/api/karma/v2/profile` - 完整 Karma 資料
2. `/api/level/info` - 等級資訊與進度
3. `/api/quests/daily` - 每日任務
4. `/api/quests/weekly` - 每週任務

### 受影響檔案估計
- Backend models: 6 個新增/修改
- Backend services: 11 個 (2 新建 + 1 重構 + 8 整合)
- Backend API: 4 個端點
- Migration scripts: 3 個
- Tests: 15+ 個測試檔案

---

**規格版本**: 2.0 (完全重寫)
**最後更新**: 2025-11-03 14:55 UTC
**狀態**: 等待審核
**變更原因**: 基於實際 codebase 分析，釐清真實需求（A+B+C + 遊戲化系統）
