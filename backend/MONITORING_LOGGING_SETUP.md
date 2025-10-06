# Daily Bingo 監控與日誌設定指南

## 📋 概述

本指南說明 Daily Bingo 功能的監控、日誌與告警設定，確保系統穩定運行。

## 🔍 日誌系統

### 結構化日誌配置

所有服務已整合 Python `logging` 模組，輸出結構化日誌。

#### 日誌格式

```python
# backend/app/core/logging_config.py
import logging
import json
from datetime import datetime

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)

    def info(self, message: str, **kwargs):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": "INFO",
            "service": "bingo",
            "message": message,
            **kwargs
        }
        self.logger.info(json.dumps(log_data))

    def error(self, message: str, **kwargs):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": "ERROR",
            "service": "bingo",
            "message": message,
            **kwargs
        }
        self.logger.error(json.dumps(log_data))

# 使用方式
logger = StructuredLogger(__name__)
logger.info(
    "Daily number generated",
    number=13,
    cycle_number=1,
    user_id="123"
)
```

#### 日誌級別

- **DEBUG**: 詳細的除錯資訊
- **INFO**: 一般資訊訊息（預設）
- **WARNING**: 警告訊息
- **ERROR**: 錯誤訊息
- **CRITICAL**: 嚴重錯誤

### 關鍵日誌點

#### 1. 每日號碼生成

```python
# supabase/functions/generate-daily-number/index.ts
console.log(`Generating daily number for date: ${taipeiDate}`)
console.log(`Generated number ${selectedNumber} (cycle: ${currentCycle})`)
```

#### 2. 每月重置

```python
# supabase/functions/monthly-reset/index.ts
console.log(`Starting monthly reset for period: ${lastMonthStart} to ${lastMonthEnd}`)
console.log(`Archived ${result.archived_cards} cards`)
console.log(`Monthly reset completed successfully`)
```

#### 3. API 請求

```python
# backend/app/core/logging_middleware.py
logger.info(
    "API Request",
    method=request.method,
    path=request.url.path,
    user_id=user.id if user else None,
    duration_ms=duration * 1000
)
```

#### 4. 連線檢測

```python
# backend/app/services/line_detection_service.py
logger.debug(
    "Line detection result",
    user_id=user_id,
    line_count=line_count,
    execution_time_ms=execution_time * 1000
)
```

## 📊 監控指標

### 1. 資料庫監控

#### PostgreSQL 效能指標

```sql
-- 查詢執行統計
SELECT
  calls,
  total_exec_time,
  mean_exec_time,
  query
FROM pg_stat_statements
WHERE query LIKE '%bingo%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 連接數監控
SELECT
  count(*) as connection_count,
  state
FROM pg_stat_activity
GROUP BY state;

-- 資料表大小監控
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS bytes
FROM pg_tables
WHERE tablename LIKE '%bingo%'
ORDER BY bytes DESC;
```

#### 分區狀態監控

```sql
-- 查看所有分區
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

### 2. 排程任務監控

#### pg_cron 執行狀態

```sql
-- 查看所有 cron 任務
SELECT
  jobname,
  schedule,
  active,
  database
FROM cron.job;

-- 查看執行歷史
SELECT
  job_name,
  status,
  start_time,
  end_time,
  return_message,
  EXTRACT(EPOCH FROM (end_time - start_time)) * 1000 AS duration_ms
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;

-- 查看失敗的任務
SELECT
  job_name,
  status,
  start_time,
  return_message
FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC;
```

#### 每月重置日誌

```sql
-- 查看重置執行記錄
SELECT
  reset_date,
  archived_cards,
  archived_claims,
  archived_rewards,
  archived_numbers,
  partition_created,
  status,
  error_message,
  executed_at
FROM monthly_reset_logs
ORDER BY executed_at DESC
LIMIT 10;

-- 統計重置成功率
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM monthly_reset_logs
GROUP BY status;
```

### 3. Edge Functions 監控

#### Supabase Dashboard

在 Supabase Dashboard > Edge Functions > Logs 查看:

- 執行次數
- 平均回應時間
- 錯誤率
- 記憶體使用

#### CLI 查看日誌

```bash
# 查看每日號碼生成日誌
supabase functions logs generate-daily-number --tail

# 查看每月重置日誌
supabase functions logs monthly-reset --tail

# 過濾錯誤日誌
supabase functions logs generate-daily-number --level error
```

### 4. API 效能監控

#### 關鍵指標

- **回應時間**: p50, p95, p99
- **請求率**: req/s
- **錯誤率**: error/total
- **併發數**: active connections

#### Prometheus 指標（可選）

```python
# backend/app/monitoring/prometheus_metrics.py
from prometheus_client import Counter, Histogram, Gauge

# 請求計數
bingo_requests_total = Counter(
    'bingo_requests_total',
    'Total bingo API requests',
    ['endpoint', 'method', 'status']
)

# 回應時間
bingo_request_duration = Histogram(
    'bingo_request_duration_seconds',
    'Bingo API request duration',
    ['endpoint']
)

# 連線數
bingo_active_lines = Gauge(
    'bingo_active_lines',
    'Current number of bingo lines',
    ['user_id']
)

# 使用方式
@app.post("/api/v1/bingo/claim")
async def claim_number(user_id: str):
    with bingo_request_duration.labels(endpoint="claim").time():
        # ... 業務邏輯
        bingo_requests_total.labels(
            endpoint="claim",
            method="POST",
            status=200
        ).inc()
```

## 🚨 告警設定

### 1. 資料庫告警

#### 連接數告警

```sql
-- 建立告警 View
CREATE OR REPLACE VIEW bingo_connection_alert AS
SELECT
  COUNT(*) as connection_count,
  (COUNT(*) > 80)::int as is_alert  -- 超過 80% 上限
FROM pg_stat_activity;

-- 定期檢查（整合至監控系統）
SELECT * FROM bingo_connection_alert WHERE is_alert = 1;
```

#### 分區告警

```sql
-- 檢查下月分區是否存在
CREATE OR REPLACE FUNCTION check_next_month_partition()
RETURNS TABLE(missing_partition TEXT) AS $$
DECLARE
  next_month DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE;
  partition_name TEXT := 'user_bingo_cards_' || TO_CHAR(next_month, 'YYYY_MM');
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = partition_name
  ) THEN
    RETURN QUERY SELECT partition_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 告警查詢
SELECT * FROM check_next_month_partition();
```

### 2. 排程任務告警

#### cron 任務失敗告警

```sql
-- 建立告警 View
CREATE OR REPLACE VIEW bingo_cron_failures AS
SELECT
  job_name,
  status,
  start_time,
  return_message
FROM cron.job_run_details
WHERE status = 'failed'
AND start_time > NOW() - INTERVAL '1 day';

-- 整合至告警系統
SELECT * FROM bingo_cron_failures;
```

#### Edge Function 錯誤告警

使用 Supabase 內建告警或整合 Sentry:

```typescript
// supabase/functions/generate-daily-number/index.ts
import * as Sentry from '@sentry/deno'

Sentry.init({
  dsn: Deno.env.get('SENTRY_DSN'),
  environment: 'production'
})

serve(async (req) => {
  try {
    // ... 業務邏輯
  } catch (error) {
    Sentry.captureException(error)
    throw error
  }
})
```

### 3. Email/Slack 通知

#### Supabase Webhooks

設定 Supabase Webhooks 在 Edge Function 失敗時發送通知:

1. 前往 Supabase Dashboard > Database > Webhooks
2. 建立新 Webhook:
   - Table: `cron.job_run_details`
   - Events: INSERT
   - Filter: `status = 'failed'`
   - URL: Slack Webhook URL 或自訂告警端點

#### 自訂告警服務

```python
# backend/app/services/alert_service.py
import requests
from typing import Dict

class AlertService:
    def __init__(self, slack_webhook_url: str):
        self.webhook_url = slack_webhook_url

    def send_alert(self, title: str, message: str, severity: str = "warning"):
        color = {
            "info": "#36a64f",
            "warning": "#ff9900",
            "error": "#ff0000",
            "critical": "#8b0000"
        }.get(severity, "#808080")

        payload = {
            "attachments": [{
                "color": color,
                "title": f"🚨 {title}",
                "text": message,
                "footer": "Daily Bingo Alert System",
                "ts": int(time.time())
            }]
        }

        requests.post(self.webhook_url, json=payload)

# 使用方式
alert_service = AlertService(os.getenv("SLACK_WEBHOOK_URL"))
alert_service.send_alert(
    title="Daily Number Generation Failed",
    message="Failed to generate daily number for 2025-10-02",
    severity="error"
)
```

## 📈 Dashboard 設定

### Grafana Dashboard（可選）

```json
{
  "title": "Daily Bingo Monitoring",
  "panels": [
    {
      "title": "Daily Number Generation",
      "targets": [{
        "query": "SELECT COUNT(*) FROM daily_bingo_numbers WHERE date = CURRENT_DATE"
      }]
    },
    {
      "title": "Active Bingo Cards",
      "targets": [{
        "query": "SELECT COUNT(*) FROM user_bingo_cards WHERE is_active = true"
      }]
    },
    {
      "title": "Claim Rate (24h)",
      "targets": [{
        "query": "SELECT COUNT(*) FROM user_number_claims WHERE claimed_at > NOW() - INTERVAL '24 hours'"
      }]
    },
    {
      "title": "Reward Distribution",
      "targets": [{
        "query": "SELECT COUNT(*) FROM bingo_rewards WHERE claimed_at > NOW() - INTERVAL '30 days'"
      }]
    }
  ]
}
```

### Supabase Metrics（內建）

在 Supabase Dashboard 查看:

- Database > Performance
- Edge Functions > Metrics
- API > Logs

## 🔧 日誌查詢範例

### 查詢最近的賓果活動

```sql
-- 今日領取記錄
SELECT
  u.email,
  c.number,
  c.claimed_at
FROM user_number_claims c
JOIN users u ON u.id = c.user_id
WHERE c.claimed_at::date = CURRENT_DATE
ORDER BY c.claimed_at DESC;

-- 本月新賓果卡
SELECT
  u.email,
  bc.month_year,
  bc.created_at
FROM user_bingo_cards bc
JOIN users u ON u.id = bc.user_id
WHERE bc.month_year >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY bc.created_at DESC;

-- 本月獎勵發放
SELECT
  u.email,
  r.line_count,
  r.claimed_at
FROM bingo_rewards r
JOIN users u ON u.id = r.user_id
WHERE r.claimed_at >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY r.claimed_at DESC;
```

### 效能分析

```sql
-- 最慢的 API 端點（需要 logging middleware）
SELECT
  path,
  AVG(duration_ms) as avg_duration,
  COUNT(*) as request_count
FROM api_request_logs
WHERE path LIKE '%/bingo/%'
AND timestamp > NOW() - INTERVAL '1 day'
GROUP BY path
ORDER BY avg_duration DESC;

-- 資料庫慢查詢
SELECT
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE query LIKE '%bingo%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## 📝 監控清單

### 日常監控（每日）

- [ ] 檢查每日號碼是否正常生成
- [ ] 檢查 cron 任務執行狀態
- [ ] 檢查 Edge Functions 錯誤率
- [ ] 檢查 API 回應時間 (p95 <200ms)
- [ ] 檢查資料庫連接數

### 每週監控

- [ ] 檢查分區大小與清理需求
- [ ] 檢查錯誤日誌趨勢
- [ ] 檢查使用者活躍度
- [ ] 檢查效能指標趨勢
- [ ] 檢查告警規則有效性

### 每月監控

- [ ] 驗證每月重置執行成功
- [ ] 檢查歷史資料歸檔完整性
- [ ] 檢查分區建立正確性
- [ ] 檢查資料庫備份
- [ ] 檢查監控系統本身狀態

## 🚀 部署後驗證

部署完成後，執行以下驗證:

```bash
# 1. 檢查日誌輸出
tail -f backend/logs/app.log | grep "bingo"

# 2. 驗證 Prometheus 指標（如使用）
curl http://localhost:8000/metrics | grep bingo

# 3. 測試告警系統
# 手動觸發失敗場景，驗證告警發送

# 4. 查看 Dashboard
# 開啟 Grafana/Supabase Dashboard 驗證資料顯示正確
```

---

*文件版本: 1.0*
*最後更新: 2025-10-02*
*需求對應: 8.3, 8.4, 5.4*
*語言: 繁體中文 (zh-TW)*
