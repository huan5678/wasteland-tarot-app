# Dashboard Gamification System - 技術設計文件

## 1. 系統架構概覽

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Dashboard   │  │    Zustand   │  │  UI Components│ │
│  │     Page     │◄─┤    Stores    │◄─┤  (PipBoy)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │         │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          │   HTTP/REST      │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API (FastAPI + Python)             │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Karma      │  │    Tasks     │  │   Activity   │ │
│  │   Service    │  │   Service    │  │   Service    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │         │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          │   PostgreSQL     │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                  Database (Supabase)                    │
│                                                         │
│  karma_logs  │  user_karma  │  daily_tasks  │  ...    │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 資料庫設計

### 2.1 新增表結構

#### 2.1.1 Karma 系統表

```sql
-- ========================================
-- Karma 記錄表（所有 Karma 獲得記錄）
-- ========================================
CREATE TABLE karma_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'daily_login', 'complete_reading', 'share_reading', 'complete_task', 'milestone', etc.
  karma_amount INTEGER NOT NULL CHECK (karma_amount > 0),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb -- 額外資訊（例如：reading_id, task_id, milestone_type）
);

-- 索引優化
CREATE INDEX idx_karma_logs_user_id ON karma_logs(user_id);
CREATE INDEX idx_karma_logs_created_at ON karma_logs(created_at DESC);
CREATE INDEX idx_karma_logs_action_type ON karma_logs(action_type);

-- ========================================
-- 用戶 Karma 總計表（彙總數據）
-- ========================================
CREATE TABLE user_karma (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_karma INTEGER NOT NULL DEFAULT 0 CHECK (total_karma >= 0),
  current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level >= 1),
  karma_to_next_level INTEGER NOT NULL DEFAULT 500,
  rank INTEGER, -- 全服排名（定期更新）
  last_karma_at TIMESTAMP WITH TIME ZONE, -- 最後獲得 Karma 時間
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引優化
CREATE INDEX idx_user_karma_total ON user_karma(total_karma DESC); -- 用於排行榜
CREATE INDEX idx_user_karma_level ON user_karma(current_level DESC);
```

#### 2.1.2 任務系統表

```sql
-- ========================================
-- 每日任務定義表（系統配置）
-- ========================================
CREATE TABLE daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_key VARCHAR(50) UNIQUE NOT NULL, -- 'daily_reading', 'daily_login', 'daily_share'
  name VARCHAR(100) NOT NULL,
  description TEXT,
  target_value INTEGER NOT NULL CHECK (target_value > 0),
  karma_reward INTEGER NOT NULL CHECK (karma_reward > 0),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 用戶每日任務進度表
-- ========================================
CREATE TABLE user_daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES daily_tasks(id) ON DELETE CASCADE,
  task_key VARCHAR(50) NOT NULL, -- 冗餘欄位，方便查詢
  current_value INTEGER NOT NULL DEFAULT 0,
  target_value INTEGER NOT NULL, -- 冗餘欄位，避免 JOIN
  is_completed BOOLEAN DEFAULT FALSE,
  is_claimed BOOLEAN DEFAULT FALSE, -- 是否已領取獎勵
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, task_id, task_date),
  CHECK (current_value <= target_value)
);

-- 索引優化
CREATE INDEX idx_user_daily_tasks_user_date ON user_daily_tasks(user_id, task_date);
CREATE INDEX idx_user_daily_tasks_date ON user_daily_tasks(task_date); -- 用於批次清理

-- ========================================
-- 每週任務定義表
-- ========================================
CREATE TABLE weekly_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  target_value INTEGER NOT NULL CHECK (target_value > 0),
  karma_reward INTEGER NOT NULL CHECK (karma_reward > 0),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 用戶每週任務進度表
-- ========================================
CREATE TABLE user_weekly_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES weekly_tasks(id) ON DELETE CASCADE,
  task_key VARCHAR(50) NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  target_value INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  is_claimed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  week_start DATE NOT NULL, -- 該週的週一日期（Monday）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, task_id, week_start),
  CHECK (current_value <= target_value)
);

-- 索引優化
CREATE INDEX idx_user_weekly_tasks_user_week ON user_weekly_tasks(user_id, week_start);
CREATE INDEX idx_user_weekly_tasks_week ON user_weekly_tasks(week_start);
```

#### 2.1.3 活躍度統計表

```sql
-- ========================================
-- 用戶每日活躍度統計表
-- ========================================
CREATE TABLE user_activity_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,

  -- 占卜活動統計
  readings_count INTEGER DEFAULT 0,
  unique_cards_collected INTEGER DEFAULT 0, -- 當日抽到的不重複卡牌數

  -- 社交互動統計
  shares_count INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  comments_received INTEGER DEFAULT 0,

  -- 登入習慣統計
  login_count INTEGER DEFAULT 0, -- 當日登入次數
  login_duration_minutes INTEGER DEFAULT 0, -- 登入時長（分鐘）

  -- 任務完成統計
  daily_tasks_completed INTEGER DEFAULT 0,
  weekly_tasks_completed INTEGER DEFAULT 0,

  -- Karma 統計
  karma_earned INTEGER DEFAULT 0, -- 當日獲得的 Karma

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, stat_date)
);

-- 索引優化
CREATE INDEX idx_user_activity_stats_user_date ON user_activity_stats(user_id, stat_date DESC);
CREATE INDEX idx_user_activity_stats_date ON user_activity_stats(stat_date DESC);

-- ========================================
-- 用戶連續登入記錄表
-- ========================================
CREATE TABLE user_login_streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_login_date DATE,
  milestone_3_claimed BOOLEAN DEFAULT FALSE, -- 3 天里程碑是否已領取
  milestone_7_claimed BOOLEAN DEFAULT FALSE, -- 7 天里程碑是否已領取
  milestone_30_claimed BOOLEAN DEFAULT FALSE, -- 30 天里程碑是否已領取
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 初始種子資料

```sql
-- ========================================
-- 每日任務初始數據
-- ========================================
INSERT INTO daily_tasks (task_key, name, description, target_value, karma_reward, display_order) VALUES
('daily_reading', '完成 1 次占卜', '進行一次塔羅占卜解讀', 1, 20, 1),
('daily_login', '每日登入', '登入 Pip-Boy 終端機', 1, 20, 2),
('daily_share', '分享 1 次解讀', '將占卜結果分享到社交平台', 1, 20, 3);

-- ========================================
-- 每週任務初始數據
-- ========================================
INSERT INTO weekly_tasks (task_key, name, description, target_value, karma_reward, display_order) VALUES
('weekly_readings', '完成 5 次占卜', '進行 5 次塔羅占卜', 5, 50, 1),
('weekly_streak', '連續登入 3 天', '連續 3 天登入系統', 3, 50, 2),
('weekly_collection', '收集 10 張卡牌', '在占卜中抽到 10 張不同的卡牌', 10, 50, 3),
('weekly_social', '獲得 3 個讚', '分享的解讀獲得 3 個讚', 3, 50, 4),
('weekly_daily_complete', '完成每日任務 3 次', '完成 3 天的所有每日任務', 3, 50, 5);
```

### 2.3 資料庫函數與觸發器

```sql
-- ========================================
-- 自動更新 updated_at 觸發器
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_karma_updated_at
BEFORE UPDATE ON user_karma
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_daily_tasks_updated_at
BEFORE UPDATE ON user_daily_tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_weekly_tasks_updated_at
BEFORE UPDATE ON user_weekly_tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 計算等級的函數
-- ========================================
CREATE OR REPLACE FUNCTION calculate_level(total_karma INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN FLOOR(total_karma / 500.0) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ========================================
-- 計算到下一級所需 Karma 的函數
-- ========================================
CREATE OR REPLACE FUNCTION calculate_karma_to_next_level(total_karma INTEGER)
RETURNS INTEGER AS $$
DECLARE
  current_level INTEGER;
  next_level_requirement INTEGER;
BEGIN
  current_level := calculate_level(total_karma);
  next_level_requirement := current_level * 500;
  RETURN next_level_requirement - total_karma;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## 3. API 設計

### 3.1 Karma 相關 API

#### 3.1.1 獲取 Karma 總覽

```http
GET /api/v1/karma/summary
Authorization: Bearer {jwt_token}
```

**Response (200 OK)**:
```json
{
  "total_karma": 1250,
  "current_level": 3,
  "karma_to_next_level": 250,
  "rank": 42,
  "today_earned": 35,
  "level_title": "廢土流浪者"
}
```

#### 3.1.2 獲取 Karma 記錄

```http
GET /api/v1/karma/logs?page=1&limit=20
Authorization: Bearer {jwt_token}
```

**Response (200 OK)**:
```json
{
  "logs": [
    {
      "id": "uuid",
      "action_type": "complete_reading",
      "karma_amount": 10,
      "description": "完成占卜",
      "created_at": "2025-01-04T10:30:00Z",
      "metadata": {
        "reading_id": "uuid"
      }
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

#### 3.1.3 授予 Karma（內部 API）

```http
POST /api/v1/karma/grant
Authorization: Bearer {internal_secret}
Content-Type: application/json

{
  "user_id": "uuid",
  "action_type": "complete_reading",
  "karma_amount": 10,
  "description": "完成占卜",
  "metadata": {
    "reading_id": "uuid"
  }
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "total_karma": 1260,
  "level_changed": false,
  "new_level": 3
}
```

---

### 3.2 任務相關 API

#### 3.2.1 獲取每日任務列表

```http
GET /api/v1/tasks/daily
Authorization: Bearer {jwt_token}
```

**Response (200 OK)**:
```json
{
  "tasks": [
    {
      "id": "uuid",
      "task_key": "daily_reading",
      "name": "完成 1 次占卜",
      "description": "進行一次塔羅占卜解讀",
      "target_value": 1,
      "current_value": 0,
      "karma_reward": 20,
      "is_completed": false,
      "is_claimed": false,
      "progress_percentage": 0
    },
    {
      "id": "uuid",
      "task_key": "daily_login",
      "name": "每日登入",
      "description": "登入 Pip-Boy 終端機",
      "target_value": 1,
      "current_value": 1,
      "karma_reward": 20,
      "is_completed": true,
      "is_claimed": false,
      "progress_percentage": 100
    },
    {
      "id": "uuid",
      "task_key": "daily_share",
      "name": "分享 1 次解讀",
      "description": "將占卜結果分享到社交平台",
      "target_value": 1,
      "current_value": 0,
      "karma_reward": 20,
      "is_completed": false,
      "is_claimed": false,
      "progress_percentage": 0
    }
  ],
  "reset_time": "2025-01-05T00:00:00+08:00",
  "completed_count": 1,
  "total_count": 3
}
```

#### 3.2.2 獲取每週任務列表

```http
GET /api/v1/tasks/weekly
Authorization: Bearer {jwt_token}
```

**Response (200 OK)**:（結構類似每日任務）

#### 3.2.3 領取每日任務獎勵

```http
POST /api/v1/tasks/daily/{task_id}/claim
Authorization: Bearer {jwt_token}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "karma_earned": 20,
  "total_karma": 1280,
  "message": "已領取任務獎勵：完成 1 次占卜"
}
```

**Error Response (400 Bad Request)**:
```json
{
  "error": "TASK_NOT_COMPLETED",
  "message": "任務尚未完成，無法領取獎勵"
}
```

#### 3.2.4 更新任務進度（內部 API）

```http
POST /api/v1/tasks/progress
Authorization: Bearer {internal_secret}
Content-Type: application/json

{
  "user_id": "uuid",
  "task_key": "daily_reading",
  "increment": 1
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "new_value": 1,
  "is_completed": true
}
```

---

### 3.3 活躍度統計 API

#### 3.3.1 獲取活躍度統計

```http
GET /api/v1/activity/stats?days=7
Authorization: Bearer {jwt_token}
```

**Response (200 OK)**:
```json
{
  "stats": [
    {
      "date": "2025-01-04",
      "readings_count": 5,
      "shares_count": 2,
      "likes_received": 8,
      "daily_tasks_completed": 3,
      "weekly_tasks_completed": 1,
      "karma_earned": 85
    },
    {
      "date": "2025-01-03",
      "readings_count": 3,
      "shares_count": 1,
      "likes_received": 4,
      "daily_tasks_completed": 2,
      "weekly_tasks_completed": 0,
      "karma_earned": 55
    },
    ...
  ],
  "summary": {
    "total_readings": 28,
    "total_karma_earned": 450,
    "avg_daily_readings": 4.0,
    "most_active_day": "2025-01-04"
  }
}
```

#### 3.3.2 獲取活躍度總覽

```http
GET /api/v1/activity/summary
Authorization: Bearer {jwt_token}
```

**Response (200 OK)**:
```json
{
  "today": {
    "readings": 5,
    "karma": 35,
    "tasks_completed": 2
  },
  "this_week": {
    "readings": 18,
    "karma": 250,
    "tasks_completed": 12
  },
  "all_time": {
    "total_readings": 156,
    "total_karma": 1250,
    "member_since": "2024-10-15"
  }
}
```

#### 3.3.3 獲取連續登入數據

```http
GET /api/v1/activity/streak
Authorization: Bearer {jwt_token}
```

**Response (200 OK)**:
```json
{
  "current_streak": 7,
  "longest_streak": 15,
  "last_login_date": "2025-01-04",
  "milestones": [
    {
      "days": 3,
      "karma_reward": 30,
      "is_claimed": true
    },
    {
      "days": 7,
      "karma_reward": 50,
      "is_claimed": false
    },
    {
      "days": 30,
      "karma_reward": 200,
      "is_claimed": false
    }
  ]
}
```

---

## 4. Backend 業務邏輯

### 4.1 Karma 授予流程

```python
# backend/app/services/karma_service.py

from uuid import UUID
from datetime import datetime
from app.db import database
from app.models import KarmaLog, UserKarma

async def grant_karma(
    user_id: UUID,
    action_type: str,
    karma_amount: int,
    description: str = None,
    metadata: dict = None
) -> dict:
    """
    授予用戶 Karma

    Args:
        user_id: 用戶 ID
        action_type: 行為類型
        karma_amount: Karma 數量
        description: 描述
        metadata: 額外資訊

    Returns:
        {
            "success": True,
            "total_karma": 1260,
            "level_changed": False,
            "new_level": 3
        }
    """
    async with database.transaction():
        # 1. 記錄 Karma log
        await KarmaLog.create(
            user_id=user_id,
            action_type=action_type,
            karma_amount=karma_amount,
            description=description,
            metadata=metadata or {}
        )

        # 2. 更新用戶總 Karma
        user_karma = await UserKarma.get_or_create(user_id=user_id)
        old_level = user_karma.current_level
        new_total = user_karma.total_karma + karma_amount
        new_level = calculate_level(new_total)
        karma_to_next = calculate_karma_to_next_level(new_total)

        await user_karma.update(
            total_karma=new_total,
            current_level=new_level,
            karma_to_next_level=karma_to_next,
            last_karma_at=datetime.now()
        )

        # 3. 檢查是否升級
        level_changed = new_level > old_level
        if level_changed:
            # 觸發升級事件（未來可發送通知）
            await trigger_level_up_event(user_id, new_level)

        return {
            "success": True,
            "total_karma": new_total,
            "level_changed": level_changed,
            "new_level": new_level
        }

def calculate_level(total_karma: int) -> int:
    """計算等級：Level = floor(total_karma / 500) + 1"""
    return int(total_karma // 500) + 1

def calculate_karma_to_next_level(total_karma: int) -> int:
    """計算到下一級所需 Karma"""
    current_level = calculate_level(total_karma)
    next_level_requirement = current_level * 500
    return next_level_requirement - total_karma
```

### 4.2 任務進度更新流程

```python
# backend/app/services/tasks_service.py

from uuid import UUID
from datetime import date, datetime
from app.db import database
from app.models import DailyTask, UserDailyTask, WeeklyTask, UserWeeklyTask
from app.services.karma_service import grant_karma

async def update_task_progress(
    user_id: UUID,
    task_key: str,
    increment: int = 1
) -> dict:
    """
    更新任務進度

    Args:
        user_id: 用戶 ID
        task_key: 任務 key（例如：daily_reading, weekly_readings）
        increment: 增加值（預設 1）

    Returns:
        {
            "success": True,
            "new_value": 1,
            "is_completed": True
        }
    """
    today = date.today()

    # 判斷是每日還是每週任務
    if task_key.startswith("daily_"):
        task = await DailyTask.get_by_key(task_key)
        if not task or not task.is_active:
            raise ValueError(f"Invalid or inactive task: {task_key}")

        user_task = await UserDailyTask.get_or_create(
            user_id=user_id,
            task_id=task.id,
            task_date=today,
            defaults={
                "task_key": task_key,
                "target_value": task.target_value
            }
        )
    else:
        # 每週任務
        week_start = get_week_start(today)  # 獲取本週一的日期
        task = await WeeklyTask.get_by_key(task_key)
        if not task or not task.is_active:
            raise ValueError(f"Invalid or inactive task: {task_key}")

        user_task = await UserWeeklyTask.get_or_create(
            user_id=user_id,
            task_id=task.id,
            week_start=week_start,
            defaults={
                "task_key": task_key,
                "target_value": task.target_value
            }
        )

    # 更新進度
    new_value = min(user_task.current_value + increment, user_task.target_value)
    was_completed = user_task.is_completed
    is_now_completed = new_value >= user_task.target_value

    await user_task.update(current_value=new_value)

    # 檢查是否剛完成（但尚未領取）
    if not was_completed and is_now_completed:
        await user_task.update(
            is_completed=True,
            completed_at=datetime.now()
        )

    return {
        "success": True,
        "new_value": new_value,
        "is_completed": is_now_completed
    }

def get_week_start(date_obj: date) -> date:
    """獲取指定日期所在週的週一"""
    days_since_monday = date_obj.weekday()
    return date_obj - timedelta(days=days_since_monday)
```

### 4.3 任務獎勵領取流程

```python
# backend/app/services/tasks_service.py

async def claim_task_reward(
    user_id: UUID,
    task_id: UUID,
    task_type: str  # "daily" or "weekly"
) -> dict:
    """
    領取任務獎勵

    Args:
        user_id: 用戶 ID
        task_id: 任務 ID
        task_type: 任務類型（daily/weekly）

    Returns:
        {
            "success": True,
            "karma_earned": 20,
            "total_karma": 1280,
            "message": "已領取任務獎勵：完成 1 次占卜"
        }
    """
    today = date.today()

    if task_type == "daily":
        user_task = await UserDailyTask.get(
            user_id=user_id,
            task_id=task_id,
            task_date=today
        )
        task = await DailyTask.get(id=task_id)
    else:
        week_start = get_week_start(today)
        user_task = await UserWeeklyTask.get(
            user_id=user_id,
            task_id=task_id,
            week_start=week_start
        )
        task = await WeeklyTask.get(id=task_id)

    # 驗證任務狀態
    if not user_task:
        raise ValueError("Task not found")

    if not user_task.is_completed:
        raise ValueError("TASK_NOT_COMPLETED: 任務尚未完成")

    if user_task.is_claimed:
        raise ValueError("TASK_ALREADY_CLAIMED: 獎勵已領取")

    # 標記為已領取
    async with database.transaction():
        await user_task.update(
            is_claimed=True,
            claimed_at=datetime.now()
        )

        # 授予 Karma 獎勵
        result = await grant_karma(
            user_id=user_id,
            action_type="complete_task",
            karma_amount=task.karma_reward,
            description=f"完成任務：{task.name}",
            metadata={"task_id": str(task_id), "task_key": task.task_key}
        )

    return {
        "success": True,
        "karma_earned": task.karma_reward,
        "total_karma": result["total_karma"],
        "message": f"已領取任務獎勵：{task.name}"
    }
```

### 4.4 連續登入檢測

```python
# backend/app/services/activity_service.py

from datetime import date, timedelta
from app.models import UserLoginStreak
from app.services.karma_service import grant_karma

async def update_login_streak(user_id: UUID) -> dict:
    """
    更新連續登入天數

    每次用戶登入時呼叫此函數

    Returns:
        {
            "current_streak": 7,
            "milestone_reached": True,
            "milestone_karma": 50
        }
    """
    today = date.today()

    streak = await UserLoginStreak.get_or_create(user_id=user_id)

    # 如果今天已經登入過，不重複處理
    if streak.last_login_date == today:
        return {
            "current_streak": streak.current_streak,
            "milestone_reached": False
        }

    yesterday = today - timedelta(days=1)

    # 判斷連續性
    if streak.last_login_date == yesterday:
        # 連續登入
        new_streak = streak.current_streak + 1
    elif streak.last_login_date is None or streak.last_login_date < yesterday:
        # 中斷，重新開始
        new_streak = 1
    else:
        new_streak = streak.current_streak

    # 更新最長連續天數
    new_longest = max(new_streak, streak.longest_streak)

    await streak.update(
        current_streak=new_streak,
        longest_streak=new_longest,
        last_login_date=today
    )

    # 檢查里程碑獎勵
    milestone_reached = False
    milestone_karma = 0

    if new_streak == 3 and not streak.milestone_3_claimed:
        milestone_karma = 30
        await streak.update(milestone_3_claimed=True)
        milestone_reached = True
    elif new_streak == 7 and not streak.milestone_7_claimed:
        milestone_karma = 50
        await streak.update(milestone_7_claimed=True)
        milestone_reached = True
    elif new_streak == 30 and not streak.milestone_30_claimed:
        milestone_karma = 200
        await streak.update(milestone_30_claimed=True)
        milestone_reached = True

    # 授予里程碑 Karma
    if milestone_reached:
        await grant_karma(
            user_id=user_id,
            action_type="milestone",
            karma_amount=milestone_karma,
            description=f"連續登入 {new_streak} 天里程碑",
            metadata={"milestone_type": "login_streak", "days": new_streak}
        )

    return {
        "current_streak": new_streak,
        "milestone_reached": milestone_reached,
        "milestone_karma": milestone_karma
    }
```

---

## 5. Frontend 架構設計

### 5.1 Zustand Stores

#### 5.1.1 karmaStore.ts

```typescript
// src/stores/karmaStore.ts

import { create } from 'zustand';

interface KarmaLog {
  id: string;
  action_type: string;
  karma_amount: number;
  description: string;
  created_at: string;
  metadata: Record<string, any>;
}

interface KarmaSummary {
  total_karma: number;
  current_level: number;
  karma_to_next_level: number;
  rank: number | null;
  today_earned: number;
  level_title: string;
}

interface KarmaStore {
  // State
  summary: KarmaSummary | null;
  logs: KarmaLog[];
  isLoading: boolean;
  error: string | null;

  // Pagination
  currentPage: number;
  totalPages: number;

  // Actions
  fetchSummary: () => Promise<void>;
  fetchLogs: (page: number) => Promise<void>;
  clearError: () => void;
}

export const useKarmaStore = create<KarmaStore>((set, get) => ({
  summary: null,
  logs: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/v1/karma/summary', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch karma summary');

      const data = await response.json();
      set({ summary: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchLogs: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/v1/karma/logs?page=${page}&limit=20`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch karma logs');

      const data = await response.json();
      set({
        logs: data.logs,
        currentPage: data.pagination.page,
        totalPages: data.pagination.total_pages,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
```

#### 5.1.2 tasksStore.ts

```typescript
// src/stores/tasksStore.ts

import { create } from 'zustand';

interface Task {
  id: string;
  task_key: string;
  name: string;
  description: string;
  target_value: number;
  current_value: number;
  karma_reward: number;
  is_completed: boolean;
  is_claimed: boolean;
  progress_percentage: number;
}

interface TasksStore {
  // State
  dailyTasks: Task[];
  weeklyTasks: Task[];
  isLoading: boolean;
  error: string | null;
  resetTime: string | null;

  // Actions
  fetchDailyTasks: () => Promise<void>;
  fetchWeeklyTasks: () => Promise<void>;
  claimDailyTask: (taskId: string) => Promise<void>;
  claimWeeklyTask: (taskId: string) => Promise<void>;
  clearError: () => void;
}

export const useTasksStore = create<TasksStore>((set, get) => ({
  dailyTasks: [],
  weeklyTasks: [],
  isLoading: false,
  error: null,
  resetTime: null,

  fetchDailyTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/v1/tasks/daily', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch daily tasks');

      const data = await response.json();
      set({
        dailyTasks: data.tasks,
        resetTime: data.reset_time,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchWeeklyTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/v1/tasks/weekly', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch weekly tasks');

      const data = await response.json();
      set({ weeklyTasks: data.tasks, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  claimDailyTask: async (taskId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/v1/tasks/daily/${taskId}/claim`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      // 重新載入任務列表
      await get().fetchDailyTasks();

      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  claimWeeklyTask: async (taskId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/v1/tasks/weekly/${taskId}/claim`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      // 重新載入任務列表
      await get().fetchWeeklyTasks();

      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
```

#### 5.1.3 activityStore.ts

```typescript
// src/stores/activityStore.ts

import { create } from 'zustand';

interface ActivityStat {
  date: string;
  readings_count: number;
  shares_count: number;
  likes_received: number;
  daily_tasks_completed: number;
  weekly_tasks_completed: number;
  karma_earned: number;
}

interface ActivitySummary {
  today: {
    readings: number;
    karma: number;
    tasks_completed: number;
  };
  this_week: {
    readings: number;
    karma: number;
    tasks_completed: number;
  };
  all_time: {
    total_readings: number;
    total_karma: number;
    member_since: string;
  };
}

interface LoginStreak {
  current_streak: number;
  longest_streak: number;
  last_login_date: string;
  milestones: Array<{
    days: number;
    karma_reward: number;
    is_claimed: boolean;
  }>;
}

interface ActivityStore {
  // State
  stats: ActivityStat[];
  summary: ActivitySummary | null;
  streak: LoginStreak | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStats: (days: number) => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchStreak: () => Promise<void>;
  clearError: () => void;
}

export const useActivityStore = create<ActivityStore>((set) => ({
  stats: [],
  summary: null,
  streak: null,
  isLoading: false,
  error: null,

  fetchStats: async (days = 7) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/v1/activity/stats?days=${days}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch activity stats');

      const data = await response.json();
      set({ stats: data.stats, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/v1/activity/summary', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch activity summary');

      const data = await response.json();
      set({ summary: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchStreak: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/v1/activity/streak', {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch login streak');

      const data = await response.json();
      set({ streak: data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
```

---

*(文件長度限制，設計文件將分為 Part 1 和 Part 2)*

**狀態**：✅ Part 1 完成
**下一步**：繼續撰寫 design.md Part 2（UI 元件設計、CSS 動畫、響應式佈局）
