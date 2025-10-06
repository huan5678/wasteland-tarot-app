# Supabase Deployment Guide - Daily Bingo 排程系統

## 📋 概述

本指南說明如何在 Supabase 上部署 Daily Bingo 的排程系統，使用 **pg_cron + Edge Functions** 方案。

## 🏗️ 架構

```
┌─────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL                   │
│                                                          │
│  ┌──────────────┐      ┌──────────────────────────┐    │
│  │   pg_cron    │──┬──>│  Edge Function:          │    │
│  │              │  │   │  generate-daily-number   │    │
│  │  每日 16:00  │  │   └──────────────────────────┘    │
│  │  UTC         │  │                                    │
│  │              │  │   ┌──────────────────────────┐    │
│  │  每月1日     │  └──>│  Edge Function:          │    │
│  │  16:00 UTC   │      │  monthly-reset           │    │
│  └──────────────┘      └──────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Tables: daily_bingo_numbers,                     │  │
│  │          user_bingo_cards (partitioned),          │  │
│  │          user_number_claims, bingo_rewards        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 🚀 部署步驟

### 1. 啟用必要的 PostgreSQL 擴充功能

在 Supabase Dashboard > Database > Extensions 啟用:

```sql
-- pg_cron: 排程任務
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- pg_net: HTTP 請求（用於呼叫 Edge Functions）
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 2. 設定 PostgreSQL 環境變數

在 Supabase Dashboard > Settings > Database > Custom PostgreSQL config 新增:

```ini
app.supabase_url = https://your-project.supabase.co
app.supabase_service_role_key = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**注意**: 請替換為你的實際值
- `your-project`: 你的 Supabase 專案 ID
- `service_role_key`: 在 Settings > API > service_role key 取得

驗證設定:
```sql
SELECT current_setting('app.supabase_url', true);
SELECT current_setting('app.supabase_service_role_key', true);
```

### 3. 執行資料庫遷移

按順序執行 `supabase/migrations/` 中的 SQL 檔案:

#### 3.1 建立分區函式
```bash
# 在 Supabase SQL Editor 執行
supabase/migrations/20251002000001_create_partition_function.sql
```

此步驟會:
- 建立 `create_monthly_partition()` 函式
- 建立當月與下月的初始分區
- 建立 `cleanup_old_partitions()` 函式（可選）

#### 3.2 設定 pg_cron 排程
```bash
# 在 Supabase SQL Editor 執行
supabase/migrations/20251002000000_setup_pg_cron_bingo.sql
```

此步驟會:
- 建立每日號碼生成排程（16:00 UTC）
- 建立每月重置排程（每月1日 16:00 UTC）

### 4. 部署 Edge Functions

#### 4.1 安裝 Supabase CLI
```bash
npm install -g supabase
```

#### 4.2 登入 Supabase
```bash
supabase login
```

#### 4.3 連結專案
```bash
supabase link --project-ref your-project-id
```

#### 4.4 部署 Edge Functions
```bash
# 部署每日號碼生成函式
supabase functions deploy generate-daily-number

# 部署每月重置函式
supabase functions deploy monthly-reset
```

#### 4.5 設定 Edge Function 密鑰
```bash
# 設定 SUPABASE_URL
supabase secrets set SUPABASE_URL=https://your-project.supabase.co

# 設定 SERVICE_ROLE_KEY
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. 驗證部署

#### 5.1 檢查 Edge Functions 狀態
```bash
supabase functions list
```

應顯示:
```
┌─────────────────────────┬────────────┬─────────────────┐
│ NAME                    │ VERSION    │ STATUS          │
├─────────────────────────┼────────────┼─────────────────┤
│ generate-daily-number   │ v1         │ ACTIVE          │
│ monthly-reset           │ v1         │ ACTIVE          │
└─────────────────────────┴────────────┴─────────────────┘
```

#### 5.2 檢查 pg_cron 任務
```sql
SELECT * FROM cron.job;
```

應顯示兩個任務:
```
┌──────────────────────────────┬───────────────┬──────────────┐
│ jobname                      │ schedule      │ active       │
├──────────────────────────────┼───────────────┼──────────────┤
│ daily-bingo-number-generation│ 0 16 * * *    │ t            │
│ monthly-bingo-reset          │ 0 16 1 * *    │ t            │
└──────────────────────────────┴───────────────┴──────────────┘
```

#### 5.3 手動測試 Edge Functions

測試每日號碼生成:
```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/generate-daily-number \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

測試每月重置:
```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/monthly-reset \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

#### 5.4 檢查任務執行歷史
```sql
-- 查看 cron 執行記錄
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- 查看每月重置日誌
SELECT * FROM monthly_reset_logs
ORDER BY executed_at DESC;

-- 查看今日號碼
SELECT * FROM daily_bingo_numbers
WHERE date = CURRENT_DATE;
```

## 📊 監控與維護

### 查看排程任務狀態

```sql
-- 查看所有 cron 任務
SELECT
  jobname,
  schedule,
  active,
  database,
  command
FROM cron.job;

-- 查看最近執行的任務
SELECT
  job_name,
  status,
  start_time,
  end_time,
  return_message
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;

-- 查看失敗的任務
SELECT * FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC;
```

### 監控 Edge Function 日誌

在 Supabase Dashboard > Edge Functions > Logs 查看執行日誌

或使用 CLI:
```bash
supabase functions logs generate-daily-number
supabase functions logs monthly-reset
```

### 監控資料庫資料

```sql
-- 查看當月賓果卡數量
SELECT COUNT(*) FROM user_bingo_cards
WHERE month_year >= DATE_TRUNC('month', CURRENT_DATE);

-- 查看歷史資料統計
SELECT
  DATE_TRUNC('month', archived_at)::DATE AS month,
  COUNT(*) AS total_cards
FROM user_bingo_cards_history
GROUP BY month
ORDER BY month DESC;

-- 查看分區狀態
SELECT
  c.relname AS partition_name,
  pg_get_expr(c.relpartbound, c.oid) AS partition_bound,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS size
FROM pg_class c
JOIN pg_inherits i ON i.inhrelid = c.oid
JOIN pg_class p ON p.oid = i.inhparent
WHERE p.relname = 'user_bingo_cards'
ORDER BY c.relname;
```

## 🔧 疑難排解

### 問題 1: pg_cron 任務未執行

**症狀**: `cron.job_run_details` 中沒有記錄

**解決方案**:
1. 檢查 `pg_cron` 擴充是否啟用:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. 檢查任務是否啟用:
   ```sql
   SELECT jobname, active FROM cron.job;
   ```

3. 手動執行 SQL 測試:
   ```sql
   SELECT
     net.http_post(
       url := current_setting('app.supabase_url') || '/functions/v1/generate-daily-number',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
       ),
       body := '{}'::jsonb
     ) AS request_id;
   ```

### 問題 2: Edge Function 回傳 401 Unauthorized

**症狀**: `net.http_post` 失敗，錯誤訊息包含 "unauthorized"

**解決方案**:
1. 檢查 `app.supabase_service_role_key` 是否正確設定
2. 確認使用的是 `service_role` key，而非 `anon` key
3. 驗證 Edge Function 的 `SUPABASE_SERVICE_ROLE_KEY` 密鑰

### 問題 3: 分區建立失敗

**症狀**: `create_monthly_partition()` 回傳錯誤

**解決方案**:
1. 檢查函式是否存在:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'create_monthly_partition';
   ```

2. 檢查 `SECURITY DEFINER` 權限:
   ```sql
   \df+ create_monthly_partition
   ```

3. 手動建立分區測試:
   ```sql
   CREATE TABLE user_bingo_cards_2025_12
   PARTITION OF user_bingo_cards
   FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
   ```

### 問題 4: 時區問題

**症狀**: 號碼生成時間不正確（例如提前或延後生成）

**解決方案**:
- pg_cron 使用 UTC 時間
- 每日 16:00 UTC = 00:00 UTC+8（隔天）
- 確認 Edge Function 內的時區轉換邏輯正確:
  ```typescript
  const taipeiDate = new Date(new Date().getTime() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  ```

## 🔄 更新與維護

### 更新 Edge Function

```bash
# 修改後重新部署
supabase functions deploy generate-daily-number
supabase functions deploy monthly-reset
```

### 更新 pg_cron 排程

```sql
-- 取消舊排程
SELECT cron.unschedule('daily-bingo-number-generation');

-- 建立新排程
SELECT cron.schedule(
  'daily-bingo-number-generation',
  '0 16 * * *',  -- 修改時間
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/generate-daily-number',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### 清理舊分區

```sql
-- 刪除超過 6 個月的舊分區
SELECT cleanup_old_partitions('user_bingo_cards', 6);
```

## 📚 參考資源

- [Supabase pg_cron 文件](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Supabase Edge Functions 文件](https://supabase.com/docs/guides/functions)
- [pg_net 擴充文件](https://github.com/supabase/pg_net)
- [PostgreSQL Partitioning 文件](https://www.postgresql.org/docs/current/ddl-partitioning.html)

## ⚠️ 重要注意事項

1. **Service Role Key 安全性**
   - 絕不將 `service_role_key` 暴露在客戶端
   - 僅在 PostgreSQL config 和 Edge Functions secrets 中使用
   - 定期輪換密鑰

2. **分區管理**
   - 首月需手動建立當月分區
   - 之後由 `monthly-reset` 自動建立下月分區
   - 建議定期清理超過 6-12 個月的舊分區

3. **時區處理**
   - pg_cron 使用 UTC
   - Edge Function 轉換為 UTC+8 (台北時間)
   - 確保所有時間邏輯一致

4. **資料備份**
   - Supabase 自動備份資料庫
   - 建議額外備份歷史表資料
   - 測試災難恢復流程

---

*文件版本: 1.0*
*最後更新: 2025-10-02*
*語言: 繁體中文 (zh-TW)*
