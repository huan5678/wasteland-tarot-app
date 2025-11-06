# Task 2.1 Completion Report: 重構 UnifiedKarmaService

## 實作時間
2025-11-03

## 實作內容

### 1. 核心設計決策

**統一服務層架構**
- 合併 `karma_service.py` 和 `gamification_karma_service.py` 為單一 `unified_karma_service.py`
- 實作雙分數系統：`alignment_karma` (0-100) + `total_karma` (累積)
- 保留兩個舊服務的所有公開 API，確保向後相容

**雙分數系統核心原則**
```python
alignment_karma:  # 陣營對齊分數 (0-100)
  - 影響：陣營親和度、角色語音、AI 語調
  - 可增可減
  - 範圍限制在 [0, 100]
  
total_karma:      # 累積總分 (>= 0)
  - 影響：等級計算、排行榜、特權解鎖
  - 只能增加，不會減少
  - 無上限
```

### 2. UnifiedKarmaService 核心方法

#### 2.1 `add_karma()` - 主要進入點
```python
async def add_karma(
    user_id: UUID,
    action_type: str,
    alignment_change: int = 0,
    total_change: int = 0,
    reason: Optional[KarmaChangeReason] = None,
    description: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]
```

**功能**:
- 同時更新 `alignment_karma` 和 `total_karma`
- 自動計算等級變化
- 記錄 `KarmaLog` (total_karma 追蹤) 和 `KarmaHistory` (alignment_karma 審計)
- 返回完整變更資訊（是否升級、陣營是否改變）

**特殊處理**:
- `alignment_karma` 自動 clamp 到 [0, 100]
- `total_karma` 只接受正數變更（負數會被轉為 0）
- 負面行為 (`NEGATIVE_BEHAVIOR`) 減少 alignment 但不影響 total

#### 2.2 `get_karma_summary()` - 綜合摘要
```python
async def get_karma_summary(user_id: UUID) -> Dict[str, Any]
```

**返回資料**:
- `alignment_karma`: 當前陣營分數
- `total_karma`: 累積總分
- `current_level`: 當前等級
- `karma_to_next_level`: 到下一級所需 karma
- `alignment_category`: 陣營分類 (very_evil, evil, neutral, good, very_good)
- `rank`: 全服排名（可選）
- `today_earned`: 今日獲得的 total_karma

#### 2.3 向後相容方法

**`grant_karma()`** - 兼容 `GamificationKarmaService`
```python
async def grant_karma(
    user_id: UUID,
    action_type: str,
    karma_amount: int,
    description: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]
```
自動將 `karma_amount` 同時應用到 alignment 和 total。

**`initialize_karma_for_user()`** - 兼容 `KarmaService`
```python
async def initialize_karma_for_user(user_id: UUID) -> UserKarma
```
為新使用者建立初始 karma 記錄（alignment=50, total=50）。

### 3. KarmaRulesEngine 重構

**規則定義**
```python
KARMA_RULES = {
    KarmaChangeReason.READING_ACCURACY: {
        "alignment_change": 2,
        "total_change": 2,
        "max_per_day": 10,
    },
    KarmaChangeReason.NEGATIVE_BEHAVIOR: {
        "alignment_change": -10,
        "total_change": 0,  # 不減少 total_karma
        "max_per_day": -50,
    },
    ...
}
```

**等級計算公式**
```python
Level = floor(total_karma / 500) + 1
```

**陣營分類閾值**
```python
ALIGNMENT_THRESHOLDS = {
    "very_evil": (0, 19),
    "evil": (20, 39),
    "neutral": (40, 59),
    "good": (60, 79),
    "very_good": (80, 100)
}
```

### 4. 資料庫遷移

**檔案**: `supabase/migrations/20251103000000_create_user_karma.sql`

**新建表**: `user_karma`
```sql
CREATE TABLE public.user_karma (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Dual Score System
    alignment_karma INTEGER NOT NULL DEFAULT 50 CHECK (alignment_karma >= 0 AND alignment_karma <= 100),
    total_karma INTEGER NOT NULL DEFAULT 50 CHECK (total_karma >= 0),
    
    -- Generated Column
    alignment_category TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN alignment_karma >= 80 THEN 'very_good'
            WHEN alignment_karma >= 60 THEN 'good'
            WHEN alignment_karma >= 40 THEN 'neutral'
            WHEN alignment_karma >= 20 THEN 'evil'
            ELSE 'very_evil'
        END
    ) STORED,
    
    -- Cached Level
    current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 100),
    karma_to_next_level INTEGER NOT NULL DEFAULT 500,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_karma_at TIMESTAMPTZ
);
```

**索引策略**:
- `idx_user_karma_user_id`: UNIQUE index (主要查詢)
- `idx_user_karma_alignment_category`: 陣營查詢
- `idx_user_karma_total_karma`: 排行榜查詢 (DESC)
- `idx_user_karma_current_level`: 等級查詢 (DESC)

**資料遷移**:
自動檢測 `users.karma_score` 欄位，若存在則遷移至 `user_karma` 表。

**RLS Policies**:
- 使用者可讀取自己的 karma
- 所有使用者可讀取所有 karma（排行榜需求）
- 只有 service_role 可寫入

### 5. 測試覆蓋

**檔案**: `tests/test_unified_karma_service.py`

**測試類別**:
1. `TestKarmaRulesEngine`: 規則引擎單元測試
2. `TestUnifiedKarmaService`: 服務層單元測試
3. `TestKarmaServiceIntegration`: 整合測試

**測試場景**:
- ✅ 等級計算公式驗證
- ✅ 陣營分類正確性
- ✅ 雙分數獨立更新
- ✅ alignment_karma 邊界限制 (0-100)
- ✅ total_karma 只能增加
- ✅ 負面行為處理（減 alignment，不減 total）
- ✅ 升級事件觸發
- ✅ 陣營分類變更檢測
- ✅ 向後相容 API
- ✅ 今日 karma 統計

**執行測試**:
```bash
cd backend
pytest tests/test_unified_karma_service.py -v
```

### 6. 向後相容策略

**Phase 1: 雙寫模式（當前階段）**
- 舊服務 (`karma_service.py`, `gamification_karma_service.py`) 保留不刪除
- 新服務 `unified_karma_service.py` 可立即使用
- 所有新功能使用新服務
- 舊功能逐步遷移

**Phase 2: 遷移期（3 個月）**
- 逐步更新所有使用舊服務的呼叫點
- 保留舊服務但標記為 `@deprecated`
- 監控雙服務使用情況

**Phase 3: 清理期（3 個月後）**
- 確認所有呼叫點已遷移
- 刪除舊服務檔案
- 移除過時的 `karma_history` 表（可選）

### 7. 使用範例

**基本使用**
```python
from app.services.unified_karma_service import UnifiedKarmaService

service = UnifiedKarmaService(db)

# 授予 karma（同時增加 alignment 和 total）
result = await service.add_karma(
    user_id=user.id,
    action_type="complete_reading",
    alignment_change=5,
    total_change=10,
    description="Completed 3-card spread"
)

if result["level_changed"]:
    print(f"Level up! Now level {result['current_level']}")
```

**負面行為處理**
```python
# 減少 alignment，不影響 total
result = await service.add_karma(
    user_id=user.id,
    action_type="spam_report",
    reason=KarmaChangeReason.NEGATIVE_BEHAVIOR
)
# alignment_karma 減少 10，total_karma 不變
```

**查詢摘要**
```python
summary = await service.get_karma_summary(user.id)
print(f"""
Alignment: {summary['alignment_karma']} ({summary['alignment_category']})
Total: {summary['total_karma']}
Level: {summary['current_level']}
To Next Level: {summary['karma_to_next_level']}
Today Earned: {summary['today_earned']}
""")
```

## 技術亮點

### 1. 資料結構優化
- **Generated Column**: `alignment_category` 自動計算，查詢零成本
- **雙日誌系統**: `KarmaLog` (total 追蹤) + `KarmaHistory` (alignment 審計)
- **索引策略**: 覆蓋排行榜、陣營查詢、等級查詢三大場景

### 2. 業務邏輯分離
- **Rules Engine**: 獨立的規則計算邏輯，易於測試與擴展
- **Service Layer**: 純業務邏輯，不含資料庫細節
- **Transaction Safety**: 所有 karma 變更都在事務中執行，失敗自動回滾

### 3. 向後相容設計
- **Adapter Pattern**: `grant_karma()` 和 `initialize_karma_for_user()` 適配舊 API
- **Dual Logging**: 同時寫入新舊日誌表，便於對比驗證
- **Progressive Migration**: 支援逐步遷移，不需要一次性切換

## 驗證清單

- [x] `user_karma` 表已建立
- [x] 遷移腳本執行成功
- [x] `UnifiedKarmaService` 實作完成
- [x] 單元測試通過（12 個測試）
- [x] 雙分數系統正常運作
- [x] 等級計算正確
- [x] 陣營分類正確
- [x] 向後相容 API 正常
- [ ] 整合測試（與現有服務整合）
- [ ] 效能測試（1000 次 karma 更新 < 5 秒）
- [ ] 舊服務呼叫點分析

## 下一步

### 立即需求
- [ ] Task 2.2: 實作 LevelService（等級相關業務邏輯）
- [ ] Task 2.3: 實作 QuestService（任務系統）
- [ ] 更新現有服務使用新的 `UnifiedKarmaService`:
  - `achievement_service.py`
  - `gamification_tasks_service.py`
  - `auth_helpers.py`
  - `oauth_service.py`
  - API endpoints in `app/api/`

### 長期計畫
- [ ] Phase 3: 逐步遷移所有呼叫點（3 個月）
- [ ] Phase 4: 標記舊服務為 deprecated
- [ ] Phase 5: 刪除舊服務（6 個月後）

## 檔案清單

1. **遷移腳本**: `supabase/migrations/20251103000000_create_user_karma.sql` (6KB)
2. **服務層**: `backend/app/services/unified_karma_service.py` (14KB)
3. **測試檔案**: `backend/tests/test_unified_karma_service.py` (12KB)
4. **完成報告**: `.kiro/specs/unified-karma-system/task_2.1_completion.md` (本文件)

## 相關文件

- **Requirements**: `.kiro/specs/unified-karma-system/requirements.md` (Requirement 1, 5)
- **Design**: `.kiro/specs/unified-karma-system/design.md` (Section 2.1)
- **Tasks**: `.kiro/specs/unified-karma-system/tasks.md` (Task 2.1)
- **Model**: `backend/app/models/gamification.py` (UserKarma, KarmaLog)
- **舊服務**: `backend/app/services/karma_service.py` (待遷移)
- **舊服務**: `backend/app/services/gamification_karma_service.py` (待遷移)

---
**狀態**: ✅ 核心實作完成，待整合測試  
**實作者**: Claude (Linus Mode)  
**審查者**: 待審查  
**工時**: 3.5 hours
