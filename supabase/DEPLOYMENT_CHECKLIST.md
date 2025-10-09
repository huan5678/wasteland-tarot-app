# Supabase 部署檢查清單 - Daily Bingo 排程系統

## 📋 部署前準備

### 1. Supabase 專案設定
- [ ] 建立或確認 Supabase 專案
- [ ] 記錄專案 URL: `https://[project-ref].supabase.co`
- [ ] 從 Settings > API 取得 `anon` key
- [ ] 從 Settings > API 取得 `service_role` key ⚠️ (保密)

### 2. 本地環境設定
- [ ] 安裝 Supabase CLI: `npm install -g supabase`
- [ ] 登入 Supabase: `supabase login`
- [ ] 連結專案: `supabase link --project-ref [project-ref]`
- [ ] 驗證連結成功: `supabase status`

---

## 🗄️ 資料庫設定

### 3. 啟用 PostgreSQL 擴充功能

在 Supabase Dashboard > Database > Extensions 啟用:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

驗證:
```sql
SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```

- [ ] `pg_cron` 已啟用
- [ ] `pg_net` 已啟用

### 4. 設定 PostgreSQL 環境變數

在 Supabase Dashboard > Settings > Database > Custom PostgreSQL config:

```ini
app.supabase_url = https://[project-ref].supabase.co
app.supabase_service_role_key = [service-role-key]
```

驗證:
```sql
SELECT current_setting('app.supabase_url', true);
SELECT current_setting('app.supabase_service_role_key', true);
```

- [ ] `app.supabase_url` 已設定
- [ ] `app.supabase_service_role_key` 已設定
- [ ] 驗證查詢回傳正確值

### 5. 執行資料庫遷移

按順序執行 SQL 遷移檔案:

#### 5.1 建立分區管理函式
```bash
psql [DATABASE_URL] -f supabase/migrations/20251002000001_create_partition_function.sql
```

驗證:
```sql
SELECT proname FROM pg_proc WHERE proname IN ('create_monthly_partition', 'cleanup_old_partitions');
```

- [ ] `create_monthly_partition` 函式已建立
- [ ] `cleanup_old_partitions` 函式已建立
- [ ] 初始分區（當月、下月）已建立

#### 5.2 設定 pg_cron 排程
```bash
psql [DATABASE_URL] -f supabase/migrations/20251002000000_setup_pg_cron_bingo.sql
```

驗證:
```sql
SELECT jobname, schedule, active FROM cron.job;
```

- [ ] `daily-bingo-number-generation` 任務已註冊
- [ ] `monthly-bingo-reset` 任務已註冊
- [ ] 兩個任務狀態為 `active = true`

---

## ⚡ Edge Functions 部署

### 6. 部署 Edge Functions

#### 6.1 部署每日號碼生成函式
```bash
supabase functions deploy generate-daily-number
```

- [ ] 部署成功
- [ ] 函式狀態為 ACTIVE

#### 6.2 部署每月重置函式
```bash
supabase functions deploy monthly-reset
```

- [ ] 部署成功
- [ ] 函式狀態為 ACTIVE

驗證:
```bash
supabase functions list
```

### 7. 設定 Edge Function 密鑰

```bash
supabase secrets set SUPABASE_URL=https://[project-ref].supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

驗證:
```bash
supabase secrets list
```

- [ ] `SUPABASE_URL` 已設定
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 已設定

---

## 🧪 功能測試

### 8. 手動測試 Edge Functions

#### 8.1 測試每日號碼生成

使用測試腳本:
```bash
chmod +x ./supabase/test-edge-functions.sh
./supabase/test-edge-functions.sh daily
```

或手動 curl:
```bash
curl -X POST \
  https://[project-ref].supabase.co/functions/v1/generate-daily-number \
  -H "Authorization: Bearer [service-role-key]" \
  -H "Content-Type: application/json" \
  -d '{}'
```

預期回應:
```json
{
  "success": true,
  "number": 15,
  "date": "2025-10-02",
  "cycle_number": 1,
  "used_count": 1,
  "available_count": 24
}
```

- [ ] HTTP 狀態碼 200
- [ ] 回傳包含 `success: true`
- [ ] 號碼範圍在 1-25 之間
- [ ] 資料庫 `daily_bingo_numbers` 表已插入記錄

#### 8.2 測試每月重置

```bash
./supabase/test-edge-functions.sh monthly
```

或手動 curl:
```bash
curl -X POST \
  https://[project-ref].supabase.co/functions/v1/monthly-reset \
  -H "Authorization: Bearer [service-role-key]" \
  -H "Content-Type: application/json" \
  -d '{}'
```

預期回應:
```json
{
  "success": true,
  "reset_date": "2025-10-02",
  "archived_cards": 0,
  "archived_claims": 0,
  "archived_rewards": 0,
  "archived_numbers": 0,
  "cleared_records": 0,
  "partition_created": true
}
```

- [ ] HTTP 狀態碼 200
- [ ] 回傳包含 `success: true`
- [ ] `monthly_reset_logs` 表已插入執行記錄
- [ ] 下月分區已建立（如適用）

### 9. 測試 pg_cron 自動觸發

#### 9.1 檢查排程狀態
```sql
SELECT * FROM cron.job;
```

- [ ] 兩個任務顯示為 `active`

#### 9.2 查看執行歷史
```sql
SELECT
  job_name,
  status,
  start_time,
  end_time,
  return_message
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

- [ ] 可查看任務執行歷史
- [ ] 沒有 `failed` 狀態的記錄（或已修復）

#### 9.3 手動觸發測試（可選）
```sql
-- 手動執行每日號碼生成
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

- [ ] 手動觸發成功
- [ ] `daily_bingo_numbers` 表已更新

---

## 📊 監控設定

### 10. 設定日誌監控

#### 10.1 Edge Functions 日誌
在 Supabase Dashboard > Edge Functions > Logs:

- [ ] 可查看 `generate-daily-number` 執行日誌
- [ ] 可查看 `monthly-reset` 執行日誌
- [ ] 設定錯誤告警（可選）

或使用 CLI:
```bash
supabase functions logs generate-daily-number
supabase functions logs monthly-reset
```

#### 10.2 pg_cron 執行監控

建立查詢失敗任務的 View:
```sql
CREATE OR REPLACE VIEW failed_cron_jobs AS
SELECT
  job_name,
  status,
  start_time,
  return_message
FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC;
```

- [ ] View 已建立
- [ ] 定期檢查 `failed_cron_jobs`

### 11. 設定告警（可選）

- [ ] 整合 Sentry 監控 Edge Function 錯誤
- [ ] 設定 Email/Slack 通知排程任務失敗
- [ ] 建立 Grafana Dashboard（進階）

---

## 🔒 安全性檢查

### 12. 密鑰與權限驗證

- [ ] `service_role_key` 僅用於後端/排程器，從未暴露於客戶端
- [ ] Edge Functions 使用環境變數存取密鑰
- [ ] PostgreSQL config 使用 `current_setting()` 讀取密鑰
- [ ] RLS (Row Level Security) 已正確配置於所有表（除歷史表外）

### 13. 函式權限檢查

```sql
-- 驗證 create_monthly_partition 權限
\df+ create_monthly_partition

-- 應顯示 SECURITY DEFINER
```

- [ ] `create_monthly_partition` 使用 `SECURITY DEFINER`
- [ ] `service_role` 已被授予執行權限

---

## 🎯 最終驗證

### 14. 完整流程測試

#### 14.1 每日號碼生成流程
1. [ ] 手動觸發 Edge Function 生成今日號碼
2. [ ] 驗證 `daily_bingo_numbers` 表有今日記錄
3. [ ] 驗證號碼範圍 1-25，無重複（同循環內）
4. [ ] 驗證循環邏輯（25 天後重置）

#### 14.2 每月重置流程
1. [ ] 手動觸發 Edge Function 執行重置
2. [ ] 驗證資料已歸檔至 `*_history` 表
3. [ ] 驗證主表當月資料已清空
4. [ ] 驗證下月分區已建立
5. [ ] 驗證 `monthly_reset_logs` 表有執行記錄

#### 14.3 排程自動化驗證
- [ ] 等待每日 16:00 UTC，驗證號碼自動生成
- [ ] 等待每月1日 16:00 UTC，驗證重置自動執行（生產環境）
- [ ] 或修改 cron 表達式為近期時間測試（測試環境）

---

## 📝 部署後文件

### 15. 更新專案文件

- [ ] 更新 `README.md` 加入 Supabase 排程系統說明
- [ ] 記錄部署日期與版本於 `CHANGELOG.md`
- [ ] 更新環境變數文件（`.env.example`）
- [ ] 團隊分享 `DEPLOYMENT_GUIDE.md` 與 `DEPLOYMENT_CHECKLIST.md`

### 16. 交接與培訓

- [ ] 向團隊說明 Supabase 排程架構
- [ ] 演示如何查看日誌與監控任務
- [ ] 說明疑難排解流程
- [ ] 分享測試腳本使用方式

---

## ✅ 部署完成確認

### 最終檢查清單

- [ ] ✅ 所有 PostgreSQL 擴充已啟用
- [ ] ✅ 環境變數已正確設定
- [ ] ✅ SQL 遷移已全部執行成功
- [ ] ✅ Edge Functions 已部署且狀態為 ACTIVE
- [ ] ✅ Edge Function 密鑰已設定
- [ ] ✅ pg_cron 任務已註冊且狀態為 active
- [ ] ✅ 手動測試通過（每日號碼 + 每月重置）
- [ ] ✅ 監控與日誌可正常查看
- [ ] ✅ 安全性檢查通過
- [ ] ✅ 文件已更新並分享給團隊

---

## 🚨 回滾計畫（如需要）

### 緊急回滾步驟

如果部署後發現重大問題：

1. **停用 pg_cron 任務**
   ```sql
   SELECT cron.unschedule('daily-bingo-number-generation');
   SELECT cron.unschedule('monthly-bingo-reset');
   ```

2. **檢視並修復資料**
   ```sql
   -- 檢視最近插入的記錄
   SELECT * FROM daily_bingo_numbers ORDER BY generated_at DESC LIMIT 10;
   SELECT * FROM monthly_reset_logs ORDER BY executed_at DESC LIMIT 5;
   ```

3. **恢復備份（如需要）**
   - 使用 Supabase 自動備份恢復資料庫
   - 或從歷史表恢復資料

4. **重新部署修復版本**
   - 修正 Edge Function 程式碼
   - 使用 `supabase functions deploy [function-name]` 重新部署
   - 重新註冊 pg_cron 任務

---

## 📞 支援資源

### 官方文件
- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [pg_net 文件](https://github.com/supabase/pg_net)

### 內部資源
- 部署指南: `supabase/DEPLOYMENT_GUIDE.md`
- 實作總結: `supabase/SUPABASE_SCHEDULER_IMPLEMENTATION.md`
- 測試腳本: `supabase/test-edge-functions.sh`

### 問題回報
- 建立 GitHub Issue 附上錯誤日誌
- 聯繫 DevOps 團隊協助排查

---

*檢查清單版本: 1.0*
*最後更新: 2025-10-02*
*語言: 繁體中文 (zh-TW)*
