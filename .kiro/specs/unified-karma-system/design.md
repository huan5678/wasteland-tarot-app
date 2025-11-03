# Design Document - Unified Karma & Gamification System

⚠️ **注意：此檔案需要從完整對話記錄重建**

由於檔案過大（約45KB），請執行以下步驟重建：

1. 往上滾動對話記錄，找到第一個 `view design.md` 的完整輸出
2. 該輸出包含完整的 1347 行設計文件
3. 複製完整內容並覆蓋此檔案

## 檔案應包含的章節：

1. 資料庫設計 (Database Schema)
   - 1.1 新建資料表 (user_karma, user_levels, quests, user_quest_progress)
   - 1.2 資料遷移策略
2. 服務層設計 (Service Layer)
   - 2.1 KarmaService 重構
   - 2.2 LevelService 設計
   - 2.3 QuestService 設計
3. API 設計 (API Endpoints)
4. 背景任務 (Background Jobs)
5. 效能優化策略
6. 測試策略
7. 部署檢查清單

**原始檔案資訊**:
- 版本: 1.0
- 行數: 1347
- 大小: ~45KB
- 最後更新: 2025-11-03 15:05 UTC

**臨時方案**: 執行 Task 1 時，設計文件的關鍵部分（user_karma 表結構）已在 migration 腳本中實作。
