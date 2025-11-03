# Unified Karma System - Deployment Guide (Phase 7)

## 部署前檢查清單

### 1. 資料庫遷移

**檢查現有遷移狀態**:
```bash
cd /path/to/project
supabase db migrations list
```

**需要執行的遷移** (按順序):
```bash
# Phase 1 - Database Schema
supabase/migrations/20251103000000_create_user_karma.sql
supabase/migrations/20251103000001_create_user_levels.sql  # 已存在
supabase/migrations/20251103000002_create_quests.sql       # 已存在
supabase/migrations/20251103000003_create_user_quest_progress.sql  # 已存在
supabase/migrations/20251103000004_migrate_user_achievements.sql   # 已存在
```

**執行遷移**:
```bash
# 本地開發環境
supabase db push

# 生產環境
supabase link --project-ref <your-project-ref>
supabase db push --linked
```

**驗證遷移**:
```sql
-- 檢查表是否存在
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_karma', 'user_levels', 'quests', 'user_quest_progress');

-- 檢查 user_karma 表結構
\d user_karma

-- 檢查種子資料
SELECT COUNT(*) FROM user_levels;  -- 應該有 100 條
SELECT COUNT(*) FROM quests;       -- 應該有 17 條
```

---

### 2. 後端服務部署

**安裝依賴**:
```bash
cd backend
uv sync  # 或 pip install -r requirements.txt
```

**環境變數檢查**:
```bash
# .env 檔案必須包含
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_JWT_SECRET=...
```

**啟動服務**:
```bash
# 開發環境
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 生產環境（使用 Gunicorn + Uvicorn workers）
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120
```

**健康檢查**:
```bash
curl http://localhost:8000/health
curl http://localhost:8000/docs  # Swagger UI
```

---

### 3. 背景任務排程設定

#### 選項 A: 使用 Crontab (簡單)

**編輯 crontab**:
```bash
crontab -e
```

**新增任務**:
```cron
# Unified Karma System - Background Tasks
BACKEND_PATH=/path/to/backend
VENV_PATH=/path/to/.venv

# 每日任務重置 (00:00 UTC)
0 0 * * * cd $BACKEND_PATH && $VENV_PATH/bin/python -m app.tasks.quest_scheduler daily >> /var/log/quest_daily.log 2>&1

# 每週任務重置 (週一 00:00 UTC)
0 0 * * 1 cd $BACKEND_PATH && $VENV_PATH/bin/python -m app.tasks.quest_scheduler weekly >> /var/log/quest_weekly.log 2>&1

# 過期任務清理 (01:00 UTC)
0 1 * * * cd $BACKEND_PATH && $VENV_PATH/bin/python -m app.tasks.quest_scheduler cleanup >> /var/log/quest_cleanup.log 2>&1
```

#### 選項 B: 使用 APScheduler (推薦)

**安裝 APScheduler**:
```bash
pip install apscheduler
```

**建立排程服務** (`backend/app/scheduler.py`):
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.tasks.quest_scheduler import (
    daily_quest_reset_task,
    weekly_quest_reset_task,
    cleanup_expired_quests_task
)

scheduler = AsyncIOScheduler(timezone='UTC')

# 每日任務重置
scheduler.add_job(
    daily_quest_reset_task,
    CronTrigger(hour=0, minute=0),
    id='daily_quest_reset',
    name='Daily Quest Reset',
    replace_existing=True
)

# 每週任務重置
scheduler.add_job(
    weekly_quest_reset_task,
    CronTrigger(day_of_week='mon', hour=0, minute=0),
    id='weekly_quest_reset',
    name='Weekly Quest Reset',
    replace_existing=True
)

# 過期任務清理
scheduler.add_job(
    cleanup_expired_quests_task,
    CronTrigger(hour=1, minute=0),
    id='cleanup_expired_quests',
    name='Cleanup Expired Quests',
    replace_existing=True
)

def start_scheduler():
    """啟動排程器"""
    scheduler.start()
    print("Scheduler started")

def shutdown_scheduler():
    """關閉排程器"""
    scheduler.shutdown()
    print("Scheduler shutdown")
```

**整合到 FastAPI** (`backend/app/main.py`):
```python
from app.scheduler import start_scheduler, shutdown_scheduler

@app.on_event("startup")
async def startup_event():
    start_scheduler()

@app.on_event("shutdown")
async def shutdown_event():
    shutdown_scheduler()
```

#### 選項 C: 使用 Docker Compose + Cron

**docker-compose.yml**:
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    
  scheduler:
    build: ./backend
    command: python -m app.scheduler
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - backend
```

---

### 4. API 測試

**測試 Karma API**:
```bash
# 取得 Karma 總覽
curl -X GET "http://localhost:8000/api/v1/karma/summary" \
  -H "Authorization: Bearer <your-token>"

# 取得 Karma 記錄
curl -X GET "http://localhost:8000/api/v1/karma/logs?page=1&limit=20" \
  -H "Authorization: Bearer <your-token>"

# 取得 Karma 歷史
curl -X GET "http://localhost:8000/api/v1/karma/history" \
  -H "Authorization: Bearer <your-token>"
```

**測試 Level API**:
```bash
# 取得我的等級
curl -X GET "http://localhost:8000/api/v1/levels/me" \
  -H "Authorization: Bearer <your-token>"

# 取得排行榜
curl -X GET "http://localhost:8000/api/v1/levels/leaderboard?page=1&limit=10"

# 取得我的排名
curl -X GET "http://localhost:8000/api/v1/levels/me/rank" \
  -H "Authorization: Bearer <your-token>"

# 取得下一個里程碑
curl -X GET "http://localhost:8000/api/v1/levels/me/next-milestone" \
  -H "Authorization: Bearer <your-token>"
```

**測試 Quest API**:
```bash
# 取得每日任務
curl -X GET "http://localhost:8000/api/v1/quests/daily" \
  -H "Authorization: Bearer <your-token>"

# 取得每週任務
curl -X GET "http://localhost:8000/api/v1/quests/weekly" \
  -H "Authorization: Bearer <your-token>"

# 取得任務統計
curl -X GET "http://localhost:8000/api/v1/quests/stats" \
  -H "Authorization: Bearer <your-token>"

# 領取任務獎勵
curl -X POST "http://localhost:8000/api/v1/quests/{progress_id}/claim" \
  -H "Authorization: Bearer <your-token>"
```

---

### 5. 監控與日誌

**關鍵指標監控**:
- API 回應時間（< 200ms）
- 資料庫查詢時間（< 100ms）
- 背景任務執行狀態
- Karma 更新頻率
- 任務完成率

**日誌收集**:
```bash
# API 日誌
tail -f /var/log/api.log

# 背景任務日誌
tail -f /var/log/quest_daily.log
tail -f /var/log/quest_weekly.log
tail -f /var/log/quest_cleanup.log
```

**告警設定** (Prometheus + Grafana):
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'karma-api'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
```

---

## 回滾計畫

### 情境 1: API 故障

**回滾步驟**:
1. 恢復舊版 API 容器：
   ```bash
   docker rollback karma-api
   ```
2. 確認服務正常：
   ```bash
   curl http://localhost:8000/health
   ```

### 情境 2: 資料庫遷移失敗

**回滾步驟**:
1. 檢查遷移錯誤：
   ```bash
   supabase db migrations list
   ```
2. 回滾到上一個版本：
   ```sql
   -- 刪除新建立的表
   DROP TABLE IF EXISTS user_karma CASCADE;
   
   -- 恢復舊的 karma_history 表（如果被修改）
   -- 從備份恢復
   ```

### 情境 3: 背景任務錯誤

**緊急停止**:
```bash
# 停止 cron 任務
crontab -e  # 註解掉相關行

# 停止 APScheduler
# 重啟 API 服務（不載入 scheduler）
```

**手動修復**:
```sql
-- 修正錯誤的任務分配
DELETE FROM user_quest_progress
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND status = 'AVAILABLE';
```

---

## 故障排除

### 問題 1: 任務未自動分配

**症狀**: 使用者訪問 `/quests/daily` 無任務

**排查**:
```sql
-- 檢查 quests 表
SELECT * FROM quests WHERE is_active = TRUE;

-- 檢查 user_quest_progress 表
SELECT * FROM user_quest_progress 
WHERE user_id = '<user-id>' 
ORDER BY created_at DESC 
LIMIT 10;
```

**解決**:
```bash
# 手動觸發任務分配
python -m app.tasks.quest_scheduler daily
```

### 問題 2: Karma 更新失敗

**症狀**: API 回傳 500 錯誤

**排查**:
```bash
# 檢查 API 日誌
tail -f /var/log/api.log | grep "Failed to add karma"

# 檢查資料庫連線
psql $DATABASE_URL -c "SELECT 1"
```

**解決**:
```python
# 檢查 UnifiedKarmaService 是否正確初始化
# 確認 user_karma 表存在且有資料
```

### 問題 3: 排行榜查詢慢

**症狀**: `/levels/leaderboard` 回應時間 > 1 秒

**排查**:
```sql
EXPLAIN ANALYZE
SELECT u.id, u.username, uk.total_karma, uk.current_level
FROM users u
JOIN user_karma uk ON u.id = uk.user_id
ORDER BY uk.total_karma DESC
LIMIT 10;
```

**解決**:
```sql
-- 確認索引存在
CREATE INDEX IF NOT EXISTS idx_user_karma_total_karma 
ON user_karma(total_karma DESC);

-- 考慮使用 materialized view
CREATE MATERIALIZED VIEW leaderboard AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY uk.total_karma DESC) as rank,
  u.id, u.username, uk.total_karma, uk.current_level
FROM users u
JOIN user_karma uk ON u.id = uk.user_id
ORDER BY uk.total_karma DESC
LIMIT 100;

-- 每小時更新一次
REFRESH MATERIALIZED VIEW leaderboard;
```

---

## 效能優化建議

### 1. 資料庫索引
```sql
-- user_karma 表索引（已在遷移中）
CREATE INDEX idx_user_karma_user_id ON user_karma(user_id);
CREATE INDEX idx_user_karma_total_karma ON user_karma(total_karma DESC);
CREATE INDEX idx_user_karma_current_level ON user_karma(current_level DESC);

-- user_quest_progress 表索引
CREATE INDEX idx_user_quest_progress_user_status 
ON user_quest_progress(user_id, status);

CREATE INDEX idx_user_quest_progress_expires_at 
ON user_quest_progress(expires_at) 
WHERE status IN ('AVAILABLE', 'IN_PROGRESS', 'COMPLETED');
```

### 2. 連線池設定
```python
# app/db/database.py
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,        # 預設 5，提升到 20
    max_overflow=10,      # 最多額外 10 個連線
    pool_pre_ping=True,   # 檢查連線是否存活
    pool_recycle=3600     # 1 小時回收連線
)
```

### 3. 快取層 (選做)
```python
# 安裝 Redis
pip install redis aioredis

# 快取排行榜
from redis import asyncio as aioredis

redis = aioredis.from_url("redis://localhost")

async def get_leaderboard_cached():
    cached = await redis.get("leaderboard")
    if cached:
        return json.loads(cached)
    
    # 從資料庫查詢
    leaderboard = await level_service.get_leaderboard()
    
    # 快取 5 分鐘
    await redis.setex("leaderboard", 300, json.dumps(leaderboard))
    
    return leaderboard
```

---

## 安全檢查

- [ ] API 端點都需要認證
- [ ] 管理員端點有權限檢查
- [ ] SQL 注入防護（使用 SQLAlchemy ORM）
- [ ] Rate limiting 設定
- [ ] 敏感資料不回傳（privileges 僅自己可見）
- [ ] CORS 設定正確

---

**文件版本**: 1.0  
**最後更新**: 2025-11-03  
**維護者**: Claude (Linus Mode)
