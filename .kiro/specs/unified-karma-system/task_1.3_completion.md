# Task 1.3 Completion Report: quests 表與種子任務

## 實作時間
2025-11-03

## 實作內容

### 1. 資料表結構
**檔案**: `supabase/migrations/20251103000002_create_quests.sql`

建立 `quests` 統一任務表，取代舊的 `daily_tasks` 和 `weekly_tasks`，包含以下欄位：
- `id`: UUID 主鍵
- `code`: 任務唯一識別碼 (VARCHAR 100, UNIQUE)
- `name_zh_tw`, `name_en`: 多語言任務名稱
- `description`: 任務描述
- `type`: 任務類型 (DAILY/WEEKLY)
- `category`: 任務分類 (READING/SOCIAL/BINGO/EXPLORATION)
- `objectives`: JSONB 任務目標配置
- `rewards`: JSONB 獎勵配置
- `difficulty`: 難度等級 (EASY/MEDIUM/HARD)
- `is_fixed`: 是否為固定任務（非隨機）
- `is_active`: 是否啟用
- `display_order`: 顯示順序
- `created_at`, `updated_at`: 時間戳記

### 2. 索引優化
建立 8 個索引以支援高效查詢：
- `idx_quests_code`: B-tree 索引 (code)
- `idx_quests_type`: B-tree 索引 (type)
- `idx_quests_category`: B-tree 索引 (category)
- `idx_quests_type_active`: 複合索引 (type, is_active) with WHERE clause
- `idx_quests_fixed`: B-tree 索引 (is_fixed)
- `idx_quests_difficulty`: B-tree 索引 (difficulty)
- `idx_quests_objectives`: GIN 索引 (objectives JSONB)
- `idx_quests_rewards`: GIN 索引 (rewards JSONB)

### 3. 任務種子資料

#### 總覽
- **總任務數**: 17 個
- **每日任務**: 8 個 (1 固定 + 7 隨機池)
- **每週任務**: 9 個 (1 固定 + 8 困難池)
- **啟用狀態**: 17 個全部啟用

#### 分類分佈
| 分類 | 任務數量 | 說明 |
|------|---------|------|
| READING | 8 | 占卜解讀相關 |
| EXPLORATION | 4 | 卡牌收集、牌陣探索 |
| BINGO | 3 | Bingo 簽到與連線 |
| SOCIAL | 2 | 分享與社交互動 |

#### 難度分佈
| 難度 | 任務數量 |
|------|---------|
| EASY | 6 |
| MEDIUM | 6 |
| HARD | 5 |

### 4. 每日任務設計

#### 固定任務 (1 個)
```
今日占卜 (daily_reading_1)
- 目標: 完成 1 次塔羅牌解讀
- 獎勵: +10 karma
- 難度: EASY
```

#### 隨機池 (7 個)
| 任務代碼 | 任務名稱 | 目標 | 獎勵 | 難度 |
|---------|---------|------|------|------|
| daily_reading_3 | 勤奮占卜師 | 完成 3 次解讀 | +30 karma | MEDIUM |
| daily_celtic_cross | 凱爾特十字探索 | 使用凱爾特十字牌陣 1 次 | +20 karma | MEDIUM |
| daily_new_card | 卡牌收集者 | 收集 3 張不同卡牌 | +15 karma | EASY |
| daily_bingo_checkin | 每日簽到 | 完成 Bingo 簽到 | +10 karma | EASY |
| daily_share_reading | 分享智慧 | 分享 1 次解讀結果 | +15 karma | EASY |
| daily_voice_reading | 聆聽命運 | 使用語音解讀 1 次 | +20 karma | MEDIUM |
| daily_morning_reading | 晨光占卜 | 上午時段解讀 1 次 | +15 karma | EASY |

### 5. 每週任務設計

#### 固定任務 (1 個)
```
每週修行 (weekly_reading_5)
- 目標: 本週完成 5 次塔羅牌解讀
- 獎勵: +50 karma
- 難度: EASY
```

#### 困難池 (8 個)
| 任務代碼 | 任務名稱 | 目標 | 獎勵 | 難度 |
|---------|---------|------|------|------|
| weekly_reading_15 | 占卜大師之路 | 完成 15 次解讀 | +150 karma + 稱號解鎖 | HARD |
| weekly_bingo_streak_3 | 連續簽到獎勵 | 連續簽到 3 天 | +30 karma | MEDIUM |
| weekly_bingo_line | 賓果連線 | 達成 1 條 Bingo 連線 | +100 karma | HARD |
| weekly_social_3 | 社交達人 | 3 次社交互動 | +40 karma | MEDIUM |
| weekly_collect_20 | 卡牌收藏家 | 收集 20 張不同卡牌 | +80 karma | HARD |
| weekly_all_spreads | 牌陣探索者 | 使用 3 種牌陣 | +60 karma | MEDIUM |
| weekly_major_arcana | 大阿爾克那精通 | 抽中 5 張大阿爾克那 | +70 karma | HARD |
| weekly_perfect_reading | 完美占卜 | 完整功能解讀 1 次 | +100 karma + 成就解鎖 | HARD |

### 6. JSONB 資料結構

#### Objectives 結構
```json
{
  "type": "COMPLETE_READINGS",           // 目標類型
  "target": 3,                           // 目標數值
  "filters": {                           // 篩選條件（選填）
    "spread_type": "celtic_cross",       // 牌陣類型
    "with_voice": true,                  // 需要語音
    "time_range": "morning"              // 時間範圍
  }
}
```

**目標類型列表**:
- `COMPLETE_READINGS`: 完成解讀次數
- `COLLECT_UNIQUE_CARDS`: 收集不重複卡牌
- `BINGO_CHECKIN`: Bingo 簽到
- `BINGO_STREAK`: 連續簽到天數
- `BINGO_LINE`: Bingo 連線數
- `SHARE_READING`: 分享解讀
- `SOCIAL_INTERACTIONS`: 社交互動
- `USE_DIFFERENT_SPREADS`: 使用不同牌陣
- `DRAW_MAJOR_ARCANA`: 抽中大阿爾克那
- `COMPLETE_PERFECT_READING`: 完美解讀

#### Rewards 結構
```json
{
  "karma_points": 50,                    // Karma 獎勵
  "bonus_items": [                       // 額外獎勵（選填）
    "title_unlock",                      // 稱號解鎖
    "achievement_unlock"                 // 成就解鎖
  ]
}
```

### 7. 任務分配策略

根據 Requirement 4 的需求：

#### 每日任務分配 (3 個任務)
- **1 個固定任務**: `daily_reading_1` (今日占卜)
- **2 個隨機任務**: 從 7 個隨機池中抽取

#### 每週任務分配 (3 個任務)
- **1 個固定任務**: `weekly_reading_5` (每週修行)
- **2 個隨機任務**: 從 8 個困難池中抽取

### 8. 自動觸發器
建立 `update_quests_updated_at()` 函數與觸發器，自動更新 `updated_at` 欄位。

### 9. 資料驗證
內建 DO 區塊驗證：
- ✅ 任務總數 >= 10
- ✅ 每日任務 >= 5
- ✅ 每週任務 >= 5
- ✅ 固定任務 >= 2 (1 daily + 1 weekly)
- ✅ 輸出統計報告

## 測試結果

### 自動化測試
執行 `test_quests_migration.py`:

```
✓ Test 1: Quest count (17) >= minimum (10)
✓ Test 2: Type distribution valid
    Daily: 8 quests
    Weekly: 9 quests
✓ Test 3: Fixed/Random distribution
    Daily - Fixed: 1, Random pool: 7
    Weekly - Fixed: 1, Random pool: 8
✓ Test 4: Category distribution
    BINGO: 3 quests
    EXPLORATION: 4 quests
    READING: 8 quests
    SOCIAL: 2 quests
✓ Test 5: Difficulty distribution
    EASY: 6 quests
    MEDIUM: 6 quests
    HARD: 5 quests
✓ Test 6: JSONB structure valid (objectives & rewards)
✓ Test 7: All quest codes unique
✓ Test 8: All display orders unique

All validations passed!
```

### 手動驗證
檢查關鍵任務資料：
- Fixed Daily: 今日占卜 (+10 karma) ✓
- Random Daily: 勤奮占卜師 (+30 karma) ✓
- Fixed Weekly: 每週修行 (+50 karma) ✓
- Random Weekly: 占卜大師之路 (+150 karma) ✓

## 相依性
### 前置需求
- Task 1.1: `user_karma` 表 (已完成)
- Task 1.2: `user_levels` 表 (已完成)
- PostgreSQL 14+ (支援 JSONB GIN 索引)

### 後續需求
- Task 1.4: `user_quest_progress` 表（使用者任務進度追蹤）
- Task 2.3: QuestService 實作
- Task 3.3: Quest API 端點

## 檔案清單
1. **遷移檔案**: `supabase/migrations/20251103000002_create_quests.sql` (11KB)
2. **測試腳本**: `/tmp/test_quests_migration.py` (驗證用)
3. **種子資料生成器**: `/tmp/generate_quests.py` (開發工具)

## 技術亮點

### 1. 統一設計
取代舊的 `daily_tasks` 和 `weekly_tasks` 雙表結構，使用單一 `quests` 表統一管理，透過 `type` 欄位區分類型。

### 2. JSONB 彈性
- `objectives`: 支援多種目標類型與篩選條件
- `rewards`: 支援多種獎勵類型
- 可擴展性強，無需 schema 變更即可新增任務類型

### 3. 隨機任務池
- 每日任務: 1 固定 + 7 隨機池 → 系統每日分配 2 個隨機
- 每週任務: 1 固定 + 8 困難池 → 系統每週分配 2 個隨機
- 確保任務多樣性，提升使用者黏著度

### 4. 多維度篩選
透過多個索引支援高效查詢：
- 按類型: `type = 'DAILY' AND is_active = TRUE`
- 按分類: `category = 'READING'`
- 按難度: `difficulty = 'HARD' AND is_fixed = FALSE`
- JSONB 查詢: `objectives @> '{"type": "COMPLETE_READINGS"}'`

### 5. 獎勵層級設計
- **EASY**: 10-15 karma
- **MEDIUM**: 20-40 karma
- **HARD**: 50-150 karma + 額外獎勵

### 6. 時間過濾支援
部分任務支援時間條件（如晨光占卜），可由 QuestService 檢測執行時間。

## 與舊系統的差異

### 舊設計 (daily_tasks + weekly_tasks)
```sql
-- 兩個獨立的表
daily_tasks (id, task_key, name, target_value, karma_reward, ...)
weekly_tasks (id, task_key, name, target_value, karma_reward, ...)
```

### 新設計 (quests)
```sql
-- 單一統一表
quests (id, code, type, category, objectives, rewards, ...)
```

**優勢**:
1. 減少表數量，簡化 JOIN 查詢
2. JSONB 配置更彈性，支援複雜條件
3. 統一的難度與分類系統
4. 更容易擴展新任務類型（如月度任務）

## 下一步
- [ ] Task 1.4: 建立 `user_quest_progress` 表（使用者任務進度追蹤）
- [ ] Task 1.5: 清理 user_achievements 表遷移
- [ ] Task 2.3: 實作 QuestService (任務分配、進度追蹤、獎勵發放)

## 相關文件
- Requirements: `.kiro/specs/unified-karma-system/requirements.md` (Requirement 4)
- Design: `.kiro/specs/unified-karma-system/design.md` (Section 1.1.3)
- Tasks: `.kiro/specs/unified-karma-system/tasks.md` (Task 1.3)

---
**狀態**: ✅ 已完成  
**實作者**: Claude (Linus Mode)  
**審查者**: 待審查  
**工時**: 2.0 hours
