# Implementation Tasks - Unified Karma & Gamification System

⚠️ **注意：此檔案需要從完整對話記錄重建**

由於檔案過大（約30KB），請執行以下步驟重建：

1. 往上滾動對話記錄，找到第一個 `view tasks.md` 的完整輸出  
2. 該輸出包含完整的 910 行任務拆解文件
3. 複製完整內容並覆蓋此檔案

## 檔案應包含的內容：

### Phase 1: 資料庫 Schema 與遷移 (15 hours)
- Task 1.1: 建立 user_karma 表與遷移腳本 ⏳ **進行中**
- Task 1.2: 建立 user_levels 表與種子資料
- Task 1.3: 建立 quests 表與種子任務
- Task 1.4: 建立 user_quest_progress 表
- Task 1.5: 清理 user_achievements 表遷移

### Phase 2: 服務層實作 (16 hours)
- Task 2.1-2.6: KarmaService, LevelService, QuestService

### Phase 3: API 端點實作 (8 hours)
- Task 3.1-3.5: Karma v2, Level, Quest APIs

### Phase 4: 背景任務與排程 (4.5 hours)
- Task 4.1-4.3: 每日/每週任務重置

### Phase 5: 效能優化與快取 (3 hours)
- Task 5.1-5.2: Redis 快取、索引優化

### Phase 6: 測試與品質保證 (9 hours)
- Task 6.1-6.3: 單元測試、整合測試、效能測試

### Phase 7: 文件與部署 (4.5 hours)
- Task 7.1-7.3: OpenAPI、遷移指南、部署檢查清單

**總工時**: 60 hours (建議預留 80-100 小時)
**總任務數**: 30 個 Tasks (7 Phases)

**原始檔案資訊**:
- 版本: 1.0
- 行數: 910
- 大小: ~30KB
- 最後更新: 2025-11-03 15:10 UTC

**當前進度**: Task 1.1 進行中（建立 user_karma model 和 migration）
