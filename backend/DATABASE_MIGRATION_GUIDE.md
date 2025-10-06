# Daily Bingo 資料庫遷移指南

## 📋 概述

本指南說明 Daily Bingo 功能的資料庫遷移步驟、順序與回滾流程。

## 🗂️ 遷移檔案清單

### Alembic 遷移檔案（FastAPI Backend）

所有遷移檔案位於 `backend/alembic/versions/`：

1. **賓果遊戲基礎表** (已存在於之前的實作)
   - `xxxx_create_bingo_tables.py` - 建立主表與歷史表
   - 包含: `user_bingo_cards`, `daily_bingo_numbers`, `user_number_claims`, `bingo_rewards`
   - 包含: 對應的 `*_history` 表

2. **索引與約束** (已存在)
   - 各表的 UNIQUE 約束
   - 外鍵約束
   - 效能索引（user_id, date, month_year）

3. **PostgreSQL 分區** (已存在)
   - `user_bingo_cards` 表的 RANGE 分區設定
   - 初始分區建立（當月與下月）

### Supabase 遷移檔案

所有遷移檔案位於 `supabase/migrations/`：

1. **`20251002000001_create_partition_function.sql`**
   - 建立 `create_monthly_partition()` 函式
   - 建立 `cleanup_old_partitions()` 函式
   - 建立初始分區（當月、下月）
   - 授予 `service_role` 執行權限

2. **`20251002000000_setup_pg_cron_bingo.sql`**
   - 啟用 `pg_cron`, `pg_net` 擴充
   - 註冊每日號碼生成 cron 任務
   - 註冊每月重置 cron 任務
   - 設定 PostgreSQL 環境變數

## 🚀 部署步驟

### 環境 A: Supabase + Zeabur (推薦)

#### 1. 準備環境變數

在 Supabase Dashboard > Settings > Database > Custom PostgreSQL config:

```ini
app.supabase_url = https://[project-ref].supabase.co
app.supabase_service_role_key = [service-role-key]
```

在 Zeabur 環境變數:

```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

#### 2. 執行 Supabase 遷移

```bash
# 連接到 Supabase
psql $SUPABASE_DATABASE_URL

# 按順序執行遷移
\i supabase/migrations/20251002000001_create_partition_function.sql
\i supabase/migrations/20251002000000_setup_pg_cron_bingo.sql
```

或使用 Supabase CLI:

```bash
supabase db push
```

#### 3. 部署 Edge Functions

```bash
# 部署每日號碼生成函式
supabase functions deploy generate-daily-number

# 部署每月重置函式
supabase functions deploy monthly-reset

# 設定密鑰
supabase secrets set SUPABASE_URL=https://[project-ref].supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

#### 4. 驗證部署

```bash
# 查看 cron 任務
psql $SUPABASE_DATABASE_URL -c "SELECT * FROM cron.job;"

# 查看分區
psql $SUPABASE_DATABASE_URL -c "
SELECT
  c.relname AS partition_name,
  pg_get_expr(c.relpartbound, c.oid) AS partition_bound
FROM pg_class c
JOIN pg_inherits i ON i.inhrelid = c.oid
JOIN pg_class p ON p.oid = i.inhparent
WHERE p.relname = 'user_bingo_cards';
"

# 測試 Edge Functions
curl -X POST https://[project-ref].supabase.co/functions/v1/generate-daily-number \
  -H "Authorization: Bearer [service-role-key]"
```

### 環境 B: 自架 PostgreSQL + FastAPI (備用方案)

#### 1. 執行 Alembic 遷移

```bash
cd backend

# 檢查待執行的遷移
alembic current
alembic history

# 執行遷移
alembic upgrade head
```

#### 2. 驗證遷移

```bash
# 檢查表結構
psql $DATABASE_URL -c "\dt"

# 檢查索引
psql $DATABASE_URL -c "\di"

# 檢查約束
psql $DATABASE_URL -c "
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
AND tc.table_name LIKE '%bingo%'
ORDER BY tc.table_name, tc.constraint_type;
"
```

#### 3. 建立初始分區

```bash
# 建立當月分區
psql $DATABASE_URL -c "
CREATE TABLE user_bingo_cards_$(date +%Y_%m)
PARTITION OF user_bingo_cards
FOR VALUES FROM ('$(date +%Y-%m-01)') TO ('$(date -d 'next month' +%Y-%m-01)');
"

# 建立下月分區
psql $DATABASE_URL -c "
CREATE TABLE user_bingo_cards_$(date -d 'next month' +%Y_%m)
PARTITION OF user_bingo_cards
FOR VALUES FROM ('$(date -d 'next month' +%Y-%m-01)') TO ('$(date -d '2 months' +%Y-%m-01)');
"
```

## 🔄 遷移順序

**重要**: 必須按照以下順序執行遷移，避免依賴性問題。

### Supabase 環境

1. ✅ 啟用擴充 (`pg_cron`, `pg_net`)
2. ✅ 設定環境變數 (`app.supabase_url`, `app.supabase_service_role_key`)
3. ✅ 執行 `20251002000001_create_partition_function.sql`
4. ✅ 執行 `20251002000000_setup_pg_cron_bingo.sql`
5. ✅ 部署 Edge Functions
6. ✅ 設定 Edge Function 密鑰
7. ✅ 驗證 cron 任務執行

### FastAPI 環境（如使用）

1. ✅ 執行 Alembic 遷移至最新版本
2. ✅ 手動建立當月與下月分區
3. ✅ 驗證表結構與索引
4. ✅ 執行種子資料（可選）

## 🔙 回滾流程

### Supabase 環境回滾

如果部署後發現問題，按以下步驟回滾：

#### 1. 停用 pg_cron 任務

```sql
-- 停用每日號碼生成
SELECT cron.unschedule('daily-bingo-number-generation');

-- 停用每月重置
SELECT cron.unschedule('monthly-bingo-reset');
```

#### 2. 刪除分區（可選）

```sql
-- 列出所有賓果卡分區
SELECT tablename FROM pg_tables WHERE tablename LIKE 'user_bingo_cards_%';

-- 刪除特定分區（保留資料請先備份）
DROP TABLE IF EXISTS user_bingo_cards_2025_10;
DROP TABLE IF EXISTS user_bingo_cards_2025_11;
```

#### 3. 移除函式（可選）

```sql
DROP FUNCTION IF EXISTS create_monthly_partition(TEXT, TEXT, DATE, DATE);
DROP FUNCTION IF EXISTS cleanup_old_partitions(TEXT, INTEGER);
```

#### 4. 禁用擴充（可選，不建議）

```sql
DROP EXTENSION IF EXISTS pg_cron;
DROP EXTENSION IF EXISTS pg_net;
```

### FastAPI 環境回滾

```bash
cd backend

# 查看當前版本
alembic current

# 回滾至前一個版本
alembic downgrade -1

# 或回滾至特定版本
alembic downgrade <revision_id>

# 回滾至基礎版本（清空所有）
alembic downgrade base
```

## 📦 種子資料（可選）

### 生成測試用每日號碼

```bash
cd backend
python -c "
from app.services.daily_number_generator_service import DailyNumberGeneratorService
from app.db.session import get_db
import asyncio
from datetime import date

async def seed():
    async for db in get_db():
        service = DailyNumberGeneratorService(db)
        number = await service.generate_daily_number(date.today())
        print(f'Generated daily number: {number}')
        break

asyncio.run(seed())
"
```

### 建立測試用賓果卡

```bash
python -c "
from app.services.bingo_card_service import BingoCardService
from app.db.session import get_db
import asyncio
from datetime import date

async def seed():
    async for db in get_db():
        service = BingoCardService(db)
        card = await service.create_card(
            user_id='test-user-1',
            numbers=list(range(1, 26)),
            month_year=date.today()
        )
        print(f'Created card: {card.card_id}')
        break

asyncio.run(seed())
"
```

## 🔍 遷移驗證清單

### ✅ Supabase 環境

- [ ] `pg_cron` 擴充已啟用
- [ ] `pg_net` 擴充已啟用
- [ ] PostgreSQL 環境變數已設定
- [ ] `create_monthly_partition()` 函式存在
- [ ] `cleanup_old_partitions()` 函式存在
- [ ] 當月分區已建立
- [ ] 下月分區已建立
- [ ] cron 任務 `daily-bingo-number-generation` 已註冊
- [ ] cron 任務 `monthly-bingo-reset` 已註冊
- [ ] Edge Function `generate-daily-number` 已部署
- [ ] Edge Function `monthly-reset` 已部署
- [ ] Edge Function 密鑰已設定

### ✅ FastAPI 環境（如使用）

- [ ] Alembic 遷移至最新版本
- [ ] 所有賓果表已建立
- [ ] 所有歷史表已建立
- [ ] UNIQUE 約束已設定
- [ ] 外鍵約束已設定
- [ ] 效能索引已建立
- [ ] 當月分區已建立
- [ ] 下月分區已建立

## 🚨 常見問題排解

### 問題 1: 分區建立失敗

**症狀**: `ERROR: permission denied to create table`

**解決方案**:
- Supabase: 使用 `SECURITY DEFINER` 函式
- 自架: 確保資料庫使用者有 `CREATE` 權限

### 問題 2: cron 任務未執行

**症狀**: `cron.job_run_details` 無記錄

**解決方案**:
```sql
-- 檢查 pg_cron 狀態
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- 檢查任務是否啟用
SELECT jobname, active FROM cron.job;

-- 手動觸發測試
SELECT cron.schedule('test', '* * * * *', 'SELECT 1');
SELECT cron.unschedule('test');
```

### 問題 3: 遷移版本衝突

**症狀**: `alembic upgrade` 顯示版本衝突

**解決方案**:
```bash
# 查看遷移歷史
alembic history

# 合併分支（如有多個 head）
alembic merge heads -m "merge branches"

# 重新執行
alembic upgrade head
```

## 📊 監控遷移狀態

### SQL 查詢腳本

```sql
-- 查看所有 cron 任務
SELECT
  jobname,
  schedule,
  active,
  database
FROM cron.job;

-- 查看最近執行記錄
SELECT
  job_name,
  status,
  start_time,
  end_time,
  return_message
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- 查看分區狀態
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'user_bingo_cards%'
ORDER BY tablename;

-- 查看每月重置日誌
SELECT * FROM monthly_reset_logs
ORDER BY executed_at DESC
LIMIT 5;
```

## 📝 部署檢查清單

部署前請確認:

- [ ] 資料庫備份已完成
- [ ] 環境變數已設定
- [ ] 遷移檔案已測試
- [ ] 回滾計畫已準備
- [ ] 監控告警已設定
- [ ] 團隊已通知部署時間

部署後請驗證:

- [ ] 所有表與索引已建立
- [ ] cron 任務正常執行
- [ ] Edge Functions 可正常呼叫
- [ ] 測試流程可完整執行
- [ ] 效能指標符合預期
- [ ] 錯誤日誌無異常

---

*文件版本: 1.0*
*最後更新: 2025-10-02*
*語言: 繁體中文 (zh-TW)*
