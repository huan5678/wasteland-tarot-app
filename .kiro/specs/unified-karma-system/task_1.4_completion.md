# Task 1.4 Completion Report: user_quest_progress 表

## 實作時間
2025-11-03

## 實作內容

### 1. 資料表結構
**檔案**: `supabase/migrations/20251103000003_create_user_quest_progress.sql`

建立 `user_quest_progress` 使用者任務進度追蹤表，包含以下欄位：

#### 核心欄位
- `id`: UUID 主鍵
- `user_id`: UUID (FK to users) - 使用者 ID
- `quest_id`: UUID (FK to quests) - 任務 ID
- `status`: VARCHAR(20) - 任務狀態 (AVAILABLE/IN_PROGRESS/COMPLETED/CLAIMED)
- `current_progress`: INTEGER - 當前進度值
- `target_progress`: INTEGER - 目標進度值（從 quest.objectives.target 複製）

#### 時間欄位
- `available_at`: TIMESTAMP - 任務可用時間
- `expires_at`: TIMESTAMP - 任務過期時間
- `started_at`: TIMESTAMP - 任務開始時間（自動設定）
- `completed_at`: TIMESTAMP - 任務完成時間（自動設定）
- `claimed_at`: TIMESTAMP - 獎勵領取時間（自動設定）
- `created_at`: TIMESTAMP - 建立時間
- `updated_at`: TIMESTAMP - 更新時間（自動更新）

### 2. 約束條件 (10 個)

#### CHECK 約束 (7 個)
1. `check_quest_status`: status 必須是 AVAILABLE, IN_PROGRESS, COMPLETED, CLAIMED 之一
2. `check_progress_range`: current_progress 必須在 0 到 target_progress 範圍內
3. `check_target_positive`: target_progress 必須大於 0
4. `check_time_sequence`: available_at 必須早於 expires_at
5. `check_started_after_available`: started_at 必須在 available_at 之後（或為 NULL）
6. `check_completed_after_started`: completed_at 必須在 started_at 之後
7. `check_claimed_after_completed`: claimed_at 必須在 completed_at 之後

#### 外鍵約束 (2 個)
1. `fk_user_quest_progress_user`: user_id → users.id (CASCADE DELETE)
2. `fk_user_quest_progress_quest`: quest_id → quests.id (CASCADE DELETE)

#### 唯一約束 (1 個)
1. `uq_user_quest_period`: (user_id, quest_id, available_at) - 確保同一時間段內使用者不會有重複任務

### 3. 索引優化 (9 個)

| 索引名稱 | 類型 | 欄位 | 用途 |
|---------|------|------|------|
| idx_user_quest_progress_user | B-tree | user_id | 使用者任務查詢 |
| idx_user_quest_progress_quest | B-tree | quest_id | 任務進度統計 |
| idx_user_quest_progress_status | B-tree | status | 任務狀態篩選 |
| idx_user_quest_progress_user_status | B-tree | user_id, status | 使用者活躍任務查詢（最常用） |
| idx_user_quest_progress_user_expires | B-tree | user_id, expires_at | 過期任務清理 |
| idx_user_quest_progress_available_at | B-tree | available_at | 時間範圍查詢 |
| idx_user_quest_progress_expires_at | B-tree | expires_at | 過期任務批次處理 |
| idx_user_quest_progress_completed_at | B-tree | completed_at (partial) | 統計與排行榜 |
| idx_user_quest_progress_user_quest | B-tree | user_id, quest_id | 任務檢查 |

**最常用查詢優化**:
```sql
-- 查詢使用者活躍任務（使用複合索引 user_id + status）
SELECT * FROM user_quest_progress 
WHERE user_id = ? AND status IN ('AVAILABLE', 'IN_PROGRESS');
```

### 4. 自動觸發器 (2 個)

#### Trigger 1: 自動更新 updated_at
```sql
CREATE TRIGGER trigger_update_user_quest_progress_updated_at
  BEFORE UPDATE ON user_quest_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_user_quest_progress_updated_at();
```
**功能**: 每次 UPDATE 時自動設定 `updated_at = NOW()`

#### Trigger 2: 狀態轉換時間戳記自動設定
```sql
CREATE TRIGGER trigger_auto_set_quest_progress_timestamps
  BEFORE UPDATE ON user_quest_progress
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_quest_progress_timestamps();
```
**功能**: 
- `AVAILABLE` → `IN_PROGRESS`: 自動設定 `started_at`
- 任何狀態 → `COMPLETED`: 自動設定 `completed_at`
- 任何狀態 → `CLAIMED`: 自動設定 `claimed_at`

**優勢**: 
- 開發者無需手動管理時間戳記
- 確保時間順序正確性
- 減少程式碼錯誤

### 5. 視圖設計 (2 個)

#### View 1: v_active_quest_progress（活躍任務視圖）
```sql
CREATE OR REPLACE VIEW v_active_quest_progress AS
SELECT 
  uqp.id,
  uqp.user_id,
  q.code AS quest_code,
  q.name_zh_tw AS quest_name,
  q.type AS quest_type,
  q.category AS quest_category,
  q.difficulty AS quest_difficulty,
  uqp.status,
  uqp.current_progress,
  uqp.target_progress,
  ROUND(uqp.current_progress::NUMERIC / uqp.target_progress * 100, 2) AS progress_percentage,
  uqp.expires_at,
  (uqp.expires_at - NOW()) AS time_remaining,
  q.rewards
FROM user_quest_progress uqp
JOIN quests q ON uqp.quest_id = q.id
WHERE 
  uqp.status IN ('AVAILABLE', 'IN_PROGRESS', 'COMPLETED')
  AND uqp.expires_at > NOW()
  AND q.is_active = TRUE;
```

**用途**: 
- 快速查詢使用者活躍任務
- 自動計算進度百分比
- 自動計算剩餘時間
- 過濾已過期與已領取的任務

**前端使用範例**:
```typescript
// GET /api/quests/active
const activeQuests = await supabase
  .from('v_active_quest_progress')
  .select('*')
  .eq('user_id', userId)
  .order('expires_at', { ascending: true });
```

#### View 2: v_user_quest_stats（使用者任務統計視圖）
```sql
CREATE OR REPLACE VIEW v_user_quest_stats AS
SELECT 
  user_id,
  COUNT(*) AS total_quests,
  COUNT(*) FILTER (WHERE status = 'CLAIMED') AS claimed_quests,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_unclaimed,
  COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') AS in_progress_quests,
  COUNT(*) FILTER (WHERE expires_at < NOW() AND status NOT IN ('COMPLETED', 'CLAIMED')) AS expired_quests,
  SUM((q.rewards->>'karma_points')::INTEGER) FILTER (WHERE uqp.status = 'CLAIMED') AS total_karma_earned,
  MIN(uqp.claimed_at) AS first_claim_date,
  MAX(uqp.claimed_at) AS last_claim_date,
  COUNT(DISTINCT DATE(uqp.claimed_at)) AS active_days
FROM user_quest_progress uqp
JOIN quests q ON uqp.quest_id = q.id
GROUP BY user_id;
```

**用途**:
- 使用者成就儀表板
- 任務完成率統計
- 累積 Karma 計算
- 活躍天數追蹤
- 排行榜資料來源

**前端使用範例**:
```typescript
// GET /api/users/:userId/quest-stats
const stats = await supabase
  .from('v_user_quest_stats')
  .select('*')
  .eq('user_id', userId)
  .single();

// 顯示: "你已完成 35 個任務，獲得 850 Karma"
```

### 6. 資料流程設計

#### 6.1 每日/每週任務分配流程
```
1. QuestService.assign_daily_quests(user_id)
   ↓
2. 從 quests 表選擇任務（1 固定 + 2 隨機）
   ↓
3. INSERT INTO user_quest_progress
   - status = 'AVAILABLE'
   - current_progress = 0
   - target_progress = quest.objectives.target
   - available_at = NOW()
   - expires_at = END_OF_DAY (或 END_OF_WEEK)
```

#### 6.2 任務進度更新流程
```
1. 使用者執行行動（如完成解讀）
   ↓
2. QuestService.check_progress(user_id, action_type)
   ↓
3. 找到符合條件的 IN_PROGRESS 任務
   ↓
4. UPDATE user_quest_progress
   SET current_progress = current_progress + 1,
       status = CASE WHEN current_progress + 1 >= target_progress 
                THEN 'COMPLETED' 
                ELSE 'IN_PROGRESS' END
   ↓
5. Trigger 自動設定 completed_at（如果已完成）
```

#### 6.3 獎勵領取流程
```
1. 前端呼叫 POST /api/quests/:progress_id/claim
   ↓
2. QuestService.claim_reward(progress_id)
   ↓
3. 檢查 status = 'COMPLETED'
   ↓
4. BEGIN TRANSACTION
   ├─ UPDATE user_quest_progress SET status = 'CLAIMED'
   ├─ KarmaService.add_karma(user_id, karma_points)
   └─ COMMIT
   ↓
5. Trigger 自動設定 claimed_at
```

### 7. 與其他表的關聯

```
users (id)
  ↓ 1:N
user_quest_progress (user_id, quest_id)
  ↑ N:1
quests (id)

user_karma (user_id)
  ↑ 透過 KarmaService 更新
user_quest_progress (claimed_at)
```

**依賴關係**:
- Task 1.1: `user_karma` 表 (已完成) - 用於獎勵發放
- Task 1.2: `user_levels` 表 (已完成) - 用於等級相關任務條件
- Task 1.3: `quests` 表 (已完成) - 任務定義來源
- `users` 表 (既有) - 使用者資料

### 8. 效能考量

#### 8.1 高頻查詢優化
```sql
-- 查詢 1: 使用者活躍任務列表（最常用）
-- 使用索引: idx_user_quest_progress_user_status
SELECT * FROM v_active_quest_progress WHERE user_id = ?;

-- 查詢 2: 檢查任務是否已分配
-- 使用索引: idx_user_quest_progress_user_quest
SELECT id FROM user_quest_progress 
WHERE user_id = ? AND quest_id = ? AND available_at > ?;

-- 查詢 3: 過期任務清理（每日背景任務）
-- 使用索引: idx_user_quest_progress_expires_at
UPDATE user_quest_progress 
SET status = 'EXPIRED' 
WHERE expires_at < NOW() AND status IN ('AVAILABLE', 'IN_PROGRESS');
```

#### 8.2 資料增長預估
假設：
- 10,000 活躍使用者
- 每日 3 個任務 + 每週 3 個任務
- 每週資料量 = 10,000 × 6 = 60,000 rows
- 每年資料量 = 60,000 × 52 = 3,120,000 rows

**表大小估算**:
- 每行約 150 bytes
- 年度資料: 3.12M × 150 bytes ≈ 468 MB
- 3 年資料: 約 1.4 GB

**建議**:
- 定期清理過期 > 3 個月的任務記錄（歷史統計已匯總）
- 使用分割表（Partitioning）按月份分割
- 建立歷史摘要表（quest_history_summary）

### 9. 安全性與資料完整性

#### 9.1 RLS (Row Level Security) 建議
```sql
-- 使用者只能查看自己的任務進度
CREATE POLICY user_quest_progress_select_policy ON user_quest_progress
  FOR SELECT USING (auth.uid() = user_id);

-- 使用者只能更新自己的任務進度（且有限制）
CREATE POLICY user_quest_progress_update_policy ON user_quest_progress
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    -- 只能更新 current_progress，不能直接改 status
    OLD.status = NEW.status OR 
    -- 或者透過 Service Role 更新
    current_setting('role') = 'service_role'
  );
```

#### 9.2 資料完整性保證
1. **外鍵級聯刪除**: 使用者或任務刪除時，自動清理進度記錄
2. **CHECK 約束**: 確保進度值、時間順序合理
3. **UNIQUE 約束**: 防止重複分配任務
4. **觸發器**: 自動管理時間戳記，減少人為錯誤

### 10. 測試腳本
**檔案**: `/tmp/test_user_quest_progress_migration.py`

#### 測試覆蓋項目
1. ✓ 表結構驗證（13 個欄位）
2. ✓ 索引驗證（9 個索引）
3. ✓ 約束驗證（7 CHECK + 2 FK + 1 UNIQUE）
4. ✓ 觸發器驗證（2 個）
5. ✓ 視圖驗證（2 個）
6. ✓ 資料插入與查詢測試
7. ✓ 視圖查詢測試

## 手動驗證步驟

### 步驟 1: 執行遷移
```bash
cd /path/to/project
psql $DATABASE_URL -f supabase/migrations/20251103000003_create_user_quest_progress.sql
```

### 步驟 2: 驗證表結構
```sql
\d user_quest_progress
```
預期輸出應包含 13 個欄位與 10 個約束。

### 步驟 3: 驗證索引
```sql
\di user_quest_progress*
```
預期輸出應包含 9 個索引（加上主鍵索引）。

### 步驟 4: 驗證觸發器
```sql
\dy user_quest_progress*
```
預期輸出應包含 2 個觸發器。

### 步驟 5: 驗證視圖
```sql
\dv v_active_quest_progress v_user_quest_stats
```
預期輸出應包含 2 個視圖。

### 步驟 6: 插入測試資料
```sql
-- 假設已有 user_id 和 quest_id
INSERT INTO user_quest_progress (
  user_id, quest_id, status, current_progress, target_progress,
  available_at, expires_at
) VALUES (
  '<user_uuid>', '<quest_uuid>', 'AVAILABLE', 0, 3,
  NOW(), NOW() + INTERVAL '1 day'
);

-- 驗證插入
SELECT * FROM user_quest_progress WHERE user_id = '<user_uuid>';
```

### 步驟 7: 測試觸發器
```sql
-- 測試狀態轉換時間戳記自動設定
UPDATE user_quest_progress 
SET status = 'IN_PROGRESS', current_progress = 1
WHERE user_id = '<user_uuid>';

-- 驗證 started_at 已自動設定
SELECT status, started_at, completed_at 
FROM user_quest_progress 
WHERE user_id = '<user_uuid>';

-- 測試完成狀態
UPDATE user_quest_progress 
SET status = 'COMPLETED', current_progress = 3
WHERE user_id = '<user_uuid>';

-- 驗證 completed_at 已自動設定
SELECT status, completed_at 
FROM user_quest_progress 
WHERE user_id = '<user_uuid>';
```

### 步驟 8: 測試視圖查詢
```sql
-- 測試活躍任務視圖
SELECT * FROM v_active_quest_progress WHERE user_id = '<user_uuid>';

-- 測試統計視圖
SELECT * FROM v_user_quest_stats WHERE user_id = '<user_uuid>';
```

### 步驟 9: 清理測試資料
```sql
DELETE FROM user_quest_progress WHERE user_id = '<user_uuid>';
```

## 下一步

- [ ] Task 1.5: 清理 `user_achievements` 表遷移（歷史債務清理）
- [ ] Task 2.3: 實作 QuestService（任務分配、進度追蹤、獎勵發放）
- [ ] Task 3.3: 實作 Quest API 端點
- [ ] Task 4.1-4.2: 實作每日/每週任務重置背景任務

## 技術亮點

### 1. 狀態機設計
任務狀態轉換流程清晰：
```
AVAILABLE → IN_PROGRESS → COMPLETED → CLAIMED
```
每個狀態轉換都有對應的時間戳記，便於追蹤與審計。

### 2. 自動化時間管理
使用觸發器自動設定時間戳記，開發者只需更新 `status`，無需手動管理 `started_at`、`completed_at`、`claimed_at`。

### 3. 視圖簡化查詢
- `v_active_quest_progress`: 前端直接使用，無需複雜 JOIN
- `v_user_quest_stats`: 儀表板與排行榜專用，預先計算統計指標

### 4. 多維度索引策略
針對不同查詢模式設計專用索引：
- 使用者查詢: `user_id + status`
- 過期清理: `expires_at`
- 統計分析: `completed_at`

### 5. 資料完整性保證
7 個 CHECK 約束 + 2 個 FK 約束 + 1 個 UNIQUE 約束 = 資料品質有保障。

## 相關文件

- **Requirements**: `.kiro/specs/unified-karma-system/requirements.md` (Requirement 4)
- **Design**: `.kiro/specs/unified-karma-system/design.md` (Section 1.1.4)
- **Tasks**: `.kiro/specs/unified-karma-system/tasks.md` (Task 1.4)
- **Previous Tasks**:
  - Task 1.1: `user_karma` 表 (已完成)
  - Task 1.2: `user_levels` 表 (已完成)
  - Task 1.3: `quests` 表 (已完成)

---

**狀態**: ✅ 已完成  
**實作者**: Claude (Linus Mode)  
**審查者**: 待審查  
**工時**: 2.5 hours  
**遷移檔案**: `supabase/migrations/20251103000003_create_user_quest_progress.sql` (8.8KB)  
**測試腳本**: `/tmp/test_user_quest_progress_migration.py` (10KB)
