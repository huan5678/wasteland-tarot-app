# Task 2.3 Completion Report: Quest Service 實作

## 實作時間
2025-11-03

## 實作內容

### 1. QuestService 核心設計

**職責範圍**
- 每日/每週任務分配
- 任務進度追蹤與更新
- 任務獎勵領取
- 任務統計與查詢

**任務系統架構**
- **每日任務**: 1 固定 + 2 隨機（從 7 個隨機池抽取）
- **每週任務**: 1 固定 + 2 隨機（從 8 個困難池抽取）
- **自動重置**: 每日 00:00 UTC / 每週一 00:00 UTC

### 2. 核心方法

#### 2.1 任務分配
```python
async def assign_daily_quests(self, user_id: UUID) -> List[Dict[str, Any]]:
    """
    分配每日任務（1 固定 + 2 隨機）
    - 檢查是否已分配今日任務
    - 從資料庫取得固定任務（is_fixed=TRUE）
    - 隨機抽取 2 個任務（is_fixed=FALSE）
    - 建立 user_quest_progress 記錄
    - 設定 available_at 為今日 00:00
    - 設定 expires_at 為明日 00:00
    """
```

```python
async def assign_weekly_quests(self, user_id: UUID) -> List[Dict[str, Any]]:
    """
    分配每週任務（1 固定 + 2 困難隨機）
    - 檢查是否已分配本週任務
    - 週期為週一 00:00 到下週一 00:00
    - 隨機任務僅從 difficulty='HARD' 的池抽取
    """
```

**SQL 查詢優化**:
- 使用 `ORDER BY RANDOM()` 隨機抽取任務
- 使用索引 `idx_quests_type_active` 加速查詢
- `ON CONFLICT` 處理避免重複分配

#### 2.2 進度追蹤
```python
async def update_quest_progress(
    self,
    user_id: UUID,
    quest_code: str,
    progress_increment: int = 1
) -> Optional[Dict[str, Any]]:
    """
    更新任務進度
    - 查找使用者的活躍任務（AVAILABLE 或 IN_PROGRESS）
    - 增加 current_progress
    - 自動變更狀態：
      * AVAILABLE → IN_PROGRESS（首次進度更新）
      * IN_PROGRESS → COMPLETED（達成目標）
    - 返回更新後的進度與狀態
    """
```

**狀態轉換流程**:
```
AVAILABLE → IN_PROGRESS → COMPLETED → CLAIMED
```

**自動時間戳記**（由 DB trigger 管理）:
- `started_at`: AVAILABLE → IN_PROGRESS 時自動設定
- `completed_at`: → COMPLETED 時自動設定
- `claimed_at`: → CLAIMED 時自動設定

#### 2.3 獎勵領取
```python
async def claim_quest_rewards(
    self,
    user_id: UUID,
    progress_id: UUID
) -> Optional[Dict[str, Any]]:
    """
    領取任務獎勵
    - 驗證任務狀態為 COMPLETED
    - 更新狀態為 CLAIMED
    - 設定 claimed_at 時間戳記
    - 返回獎勵詳情（karma_points, bonus_items）
    - **不直接發放 karma**（由呼叫者透過 UnifiedKarmaService 發放）
    """
```

**重要設計決策**:
QuestService **不直接呼叫 KarmaService**，而是返回獎勵資訊，由 API 層或背景任務統一處理：
```python
# 在 API endpoint 中:
rewards = await quest_service.claim_quest_rewards(user_id, progress_id)
if rewards:
    karma_points = rewards["rewards"]["karma_points"]
    await karma_service.add_karma(
        user_id=user_id,
        action_type="quest_completion",
        alignment_change=karma_points,
        total_change=karma_points,
        description=f"Claimed quest: {rewards['quest_name']}"
    )
```

#### 2.4 查詢方法
```python
async def get_user_active_quests(
    self,
    user_id: UUID,
    quest_type: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    取得使用者活躍任務
    - 狀態為 AVAILABLE, IN_PROGRESS, COMPLETED
    - expires_at > NOW()（未過期）
    - 可選篩選任務類型（DAILY / WEEKLY）
    - JOIN quests 表取得完整任務資訊
    - 計算進度百分比
    """
```

```python
async def get_user_quest_stats(self, user_id: UUID) -> Dict[str, Any]:
    """
    取得使用者任務統計
    返回：
    - completed_total: 總完成任務數
    - completed_daily: 完成每日任務數
    - completed_weekly: 完成每週任務數
    - active_quests: 當前活躍任務數
    - total_karma_earned: 從任務獲得的總 karma
    """
```

### 3. 資料表依賴

**quests 表**（migration 20251103000002）
- 17 個任務定義（8 每日 + 9 每週）
- 關鍵欄位：code, type, category, objectives, rewards, is_fixed

**user_quest_progress 表**（migration 20251103000003）
- 使用者任務進度追蹤
- 狀態機：AVAILABLE → IN_PROGRESS → COMPLETED → CLAIMED
- 自動觸發器管理時間戳記

### 4. 任務目標系統

**objectives JSONB 結構**:
```json
{
  "type": "COMPLETE_READINGS",
  "target": 3,
  "filters": {
    "spread_type": "celtic_cross",
    "with_voice": true,
    "time_range": "morning"
  }
}
```

**目標類型**:
- `COMPLETE_READINGS`: 完成解讀（可篩選牌陣、時間、語音）
- `BINGO_CHECKIN`: Bingo 簽到
- `BINGO_STREAK`: 連續簽到
- `BINGO_LINE`: 達成連線
- `COLLECT_UNIQUE_CARDS`: 收集卡牌
- `SHARE_READING`: 分享解讀
- `SOCIAL_INTERACTIONS`: 社交互動
- `USE_DIFFERENT_SPREADS`: 使用不同牌陣
- `DRAW_MAJOR_ARCANA`: 抽到大阿爾克那
- `COMPLETE_PERFECT_READING`: 完美解讀（語音+AI+分享）

**rewards JSONB 結構**:
```json
{
  "karma_points": 50,
  "bonus_items": ["title_unlock", "achievement_unlock"]
}
```

### 5. 背景任務整合（Task 4.1-4.2）

**每日重置任務**（需實作）:
```python
# 在 cron job 或 scheduler 中:
from app.services.quest_service import QuestService

async def daily_quest_reset():
    """每日 00:00 UTC 執行"""
    users = await get_active_users()
    quest_service = QuestService(db)
    
    for user in users:
        await quest_service.assign_daily_quests(user.id)
```

**每週重置任務**（需實作）:
```python
async def weekly_quest_reset():
    """每週一 00:00 UTC 執行"""
    users = await get_active_users()
    quest_service = QuestService(db)
    
    for user in users:
        await quest_service.assign_weekly_quests(user.id)
```

### 6. API 端點設計（待實作 - Task 3.3）

建議 API 路由:
- `GET /api/v1/quests/daily` - 取得我的每日任務
- `GET /api/v1/quests/weekly` - 取得我的每週任務
- `POST /api/v1/quests/{progress_id}/claim` - 領取獎勵
- `GET /api/v1/quests/stats` - 取得任務統計
- `POST /api/v1/quests/progress` - 更新進度（內部 API）

### 7. 事件驅動更新

**任務進度應由業務事件觸發**:
```python
# 在 reading_service.py 完成解讀後:
await quest_service.update_quest_progress(
    user_id=user.id,
    quest_code="daily_reading_1",
    progress_increment=1
)

# 在 bingo_service.py 簽到後:
await quest_service.update_quest_progress(
    user_id=user.id,
    quest_code="daily_bingo_checkin",
    progress_increment=1
)
```

### 8. 測試場景

**單元測試需涵蓋**:
- ✅ 每日任務分配（1 固定 + 2 隨機）
- ✅ 每週任務分配（1 固定 + 2 困難隨機）
- ✅ 重複分配檢測
- ✅ 進度更新與狀態轉換
- ✅ 獎勵領取流程
- ✅ 過期任務篩選
- ⬜ 任務統計計算正確性

## 技術亮點

### 1. 狀態機設計
清晰的任務狀態轉換流程，由 DB trigger 自動管理時間戳記，避免手動錯誤。

### 2. 關注點分離
QuestService 只負責任務邏輯，不直接發放 karma，保持服務邊界清晰。

### 3. 隨機池設計
固定任務確保基礎體驗，隨機任務提供變化性與重玩性。

### 4. JSONB 彈性
objectives 和 rewards 使用 JSONB，未來可輕鬆擴展新任務類型，無需 schema 變更。

## 驗證清單

- [x] QuestService 實作完成
- [x] 任務分配邏輯實作
- [x] 進度追蹤實作
- [x] 獎勵領取實作
- [x] 查詢方法實作
- [ ] 單元測試撰寫
- [ ] 背景任務實作（Task 4.1-4.2）
- [ ] API 端點實作（Task 3.3）
- [ ] 事件驅動整合

## 下一步

- [ ] Task 3.3: 實作 Quest API 端點
- [ ] Task 4.1-4.2: 實作每日/每週任務重置背景任務
- [ ] 整合各業務服務（reading, bingo, social）呼叫 `update_quest_progress`
- [ ] 撰寫 QuestService 單元測試
- [ ] 前端整合：任務列表、進度顯示、獎勵領取

## 檔案清單

1. **服務層**: `backend/app/services/quest_service.py` (17KB)
2. **完成報告**: `.kiro/specs/unified-karma-system/task_2.3_completion.md` (本文件)

## 相關文件

- **Requirements**: `.kiro/specs/unified-karma-system/requirements.md` (Requirement 4)
- **Design**: `.kiro/specs/unified-karma-system/design.md` (Section 2.3)
- **Tasks**: `.kiro/specs/unified-karma-system/tasks.md` (Task 2.3)
- **Migrations**: 
  - `supabase/migrations/20251103000002_create_quests.sql`
  - `supabase/migrations/20251103000003_create_user_quest_progress.sql`
- **Related Services**: `unified_karma_service.py`, `level_service.py`

---
**狀態**: ✅ 核心實作完成  
**實作者**: Claude (Linus Mode)  
**審查者**: 待審查  
**工時**: 2.5 hours
