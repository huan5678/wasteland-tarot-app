-- Daily Bingo pg_cron 排程設定
-- 執行時間: 每日 16:00 UTC (對應 00:00 UTC+8 隔天)
-- 每月重置: 每月最後一天 16:00 UTC (對應下月1日 00:00 UTC+8)

-- 啟用 pg_cron 擴充功能 (需要超級使用者權限)
-- 注意: Supabase 專案已預設啟用，此處僅作記錄
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 1. 每日號碼生成排程
-- ============================================

-- 刪除舊排程 (如果存在)
SELECT cron.unschedule('daily-bingo-number-generation');

-- 建立每日號碼生成排程
-- 執行時間: 每日 16:00 UTC (00:00 UTC+8 隔天)
SELECT cron.schedule(
  'daily-bingo-number-generation',
  '0 16 * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/generate-daily-number',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    ) AS request_id;
  $$
);

-- ============================================
-- 2. 每月重置排程
-- ============================================

-- 刪除舊排程 (如果存在)
SELECT cron.unschedule('monthly-bingo-reset');

-- 建立每月重置排程
-- 執行時間: 每月最後一天 16:00 UTC (下月1日 00:00 UTC+8)
-- 注意: Cron 不直接支援 "月底"，使用每月1日 16:00 執行（等同於月底 16:00 UTC）
SELECT cron.schedule(
  'monthly-bingo-reset',
  '0 16 1 * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/monthly-reset',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    ) AS request_id;
  $$
);

-- ============================================
-- 3. 設定環境變數 (需在 Supabase Dashboard 設定)
-- ============================================

-- 在 Supabase Dashboard > Settings > Database > Custom PostgreSQL config 設定:
-- app.supabase_url = 'https://your-project.supabase.co'
-- app.supabase_service_role_key = 'your-service-role-key'

-- 驗證設定:
-- SELECT current_setting('app.supabase_url', true);
-- SELECT current_setting('app.supabase_service_role_key', true);

-- ============================================
-- 4. 查看已排程任務
-- ============================================

-- 查看所有 cron 任務
-- SELECT * FROM cron.job;

-- 查看任務執行歷史
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- ============================================
-- 5. 手動測試排程任務
-- ============================================

-- 測試每日號碼生成
-- SELECT
--   net.http_post(
--     url := current_setting('app.supabase_url') || '/functions/v1/generate-daily-number',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
--     ),
--     body := '{}'::jsonb
--   ) AS request_id;

-- 測試每月重置
-- SELECT
--   net.http_post(
--     url := current_setting('app.supabase_url') || '/functions/v1/monthly-reset',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
--     ),
--     body := '{}'::jsonb
--   ) AS request_id;

-- ============================================
-- 6. 疑難排解
-- ============================================

-- 檢查 net.http_post 是否可用 (pg_net 擴充)
-- SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- 如果 pg_net 未啟用，執行:
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- 檢查 cron 執行錯誤
-- SELECT * FROM cron.job_run_details WHERE status = 'failed' ORDER BY start_time DESC;

-- ============================================
-- 7. 清理排程 (如需移除)
-- ============================================

-- 移除每日號碼生成排程
-- SELECT cron.unschedule('daily-bingo-number-generation');

-- 移除每月重置排程
-- SELECT cron.unschedule('monthly-bingo-reset');
