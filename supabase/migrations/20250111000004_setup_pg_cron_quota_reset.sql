-- =============================================
-- Migration: 建立 pg_cron 月度配額重置任務
-- Description: 使用 pg_cron 擴充每月 1 日 00:00 自動重置所有使用者的 AI 生成配額
-- Requirements: 17.10
-- Task: 1.5
-- =============================================

-- =============================================
-- 安裝 pg_cron 擴充 (若尚未安裝)
-- =============================================

-- 注意: Supabase 預設已安裝 pg_cron, 如果在本地測試環境需要手動安裝
-- 本地測試環境可執行: CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 檢查 pg_cron 是否已安裝
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Supabase 環境: pg_cron 預設已安裝於 extensions schema
    -- 本地環境: 需要手動安裝
    RAISE NOTICE 'pg_cron extension is not installed. Please install it manually in local environment.';
    RAISE NOTICE 'Run: CREATE EXTENSION IF NOT EXISTS pg_cron;';
  ELSE
    RAISE NOTICE 'pg_cron extension is already installed.';
  END IF;
END;
$$;

-- =============================================
-- 建立月度配額重置函數
-- Requirements 17.10: 每月 1 日 00:00 重置所有使用者配額
-- =============================================

CREATE OR REPLACE FUNCTION reset_monthly_ai_quotas()
RETURNS VOID AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- 重置所有配額記錄
  UPDATE user_ai_quotas
  SET used_count = 0,
      reset_at = DATE_TRUNC('month', NOW() + INTERVAL '1 month'),
      updated_at = NOW()
  WHERE reset_at <= NOW();

  GET DIAGNOSTICS affected_rows = ROW_COUNT;

  -- 記錄日誌
  RAISE NOTICE '[%] Monthly quota reset completed. % users affected.', NOW(), affected_rows;

  -- 插入日誌記錄 (可選: 建立專門的日誌表)
  INSERT INTO cron_job_logs (job_name, execution_time, affected_rows, status)
  VALUES (
    'monthly_quota_reset',
    NOW(),
    affected_rows,
    'success'
  )
  ON CONFLICT DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    -- 錯誤處理
    RAISE WARNING '[%] Monthly quota reset failed: %', NOW(), SQLERRM;

    -- 記錄錯誤日誌
    INSERT INTO cron_job_logs (job_name, execution_time, affected_rows, status, error_message)
    VALUES (
      'monthly_quota_reset',
      NOW(),
      0,
      'failed',
      SQLERRM
    )
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 建立 cron job 日誌表 (用於監控排程任務)
-- =============================================

CREATE TABLE IF NOT EXISTS cron_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name VARCHAR(100) NOT NULL,
  execution_time TIMESTAMP WITH TIME ZONE NOT NULL,
  affected_rows INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL,  -- 'success' or 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 建立索引: 按執行時間排序
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_execution_time
  ON cron_job_logs USING btree (execution_time DESC);

-- 建立索引: 按任務名稱查詢
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_job_name
  ON cron_job_logs USING btree (job_name);

-- =============================================
-- 建立 pg_cron 排程任務
-- Cron 表達式: '0 0 1 * *' = 每月 1 日 00:00
-- =============================================

-- 刪除舊的排程任務 (若存在)
DO $$
DECLARE
  job_id BIGINT;
BEGIN
  -- 查詢是否已存在同名任務
  SELECT jobid INTO job_id
  FROM cron.job
  WHERE jobname = 'monthly-ai-quota-reset';

  IF job_id IS NOT NULL THEN
    -- 刪除舊任務
    PERFORM cron.unschedule(job_id);
    RAISE NOTICE 'Unscheduled existing job with ID: %', job_id;
  END IF;
END;
$$;

-- 建立新的排程任務
SELECT cron.schedule(
  'monthly-ai-quota-reset',                                  -- 任務名稱
  '0 0 1 * *',                                               -- Cron 表達式 (每月 1 日 00:00)
  $$SELECT reset_monthly_ai_quotas()$$                       -- 執行的 SQL
);

-- =============================================
-- 建立手動觸發重置函數 (用於測試或緊急重置)
-- =============================================

CREATE OR REPLACE FUNCTION manual_reset_ai_quotas()
RETURNS TABLE (
  user_id UUID,
  old_used_count INTEGER,
  new_used_count INTEGER,
  old_reset_at TIMESTAMP WITH TIME ZONE,
  new_reset_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH updated AS (
    UPDATE user_ai_quotas
    SET used_count = 0,
        reset_at = DATE_TRUNC('month', NOW() + INTERVAL '1 month'),
        updated_at = NOW()
    RETURNING
      user_ai_quotas.user_id,
      0 AS old_used_count,  -- 舊值已被更新,無法取得
      user_ai_quotas.used_count AS new_used_count,
      reset_at - INTERVAL '1 month' AS old_reset_at,
      user_ai_quotas.reset_at AS new_reset_at
  )
  SELECT * FROM updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 建立查詢排程任務狀態函數
-- =============================================

CREATE OR REPLACE FUNCTION get_cron_job_status()
RETURNS TABLE (
  job_id BIGINT,
  job_name TEXT,
  schedule TEXT,
  command TEXT,
  active BOOLEAN,
  last_run TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.jobid,
    j.jobname,
    j.schedule,
    j.command,
    j.active,
    (
      SELECT MAX(execution_time)
      FROM cron_job_logs
      WHERE job_name = j.jobname
    ) AS last_run
  FROM cron.job j
  WHERE j.jobname = 'monthly-ai-quota-reset';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 驗證排程任務是否正確建立
-- =============================================

DO $$
DECLARE
  job_record RECORD;
BEGIN
  -- 查詢排程任務
  SELECT * INTO job_record
  FROM cron.job
  WHERE jobname = 'monthly-ai-quota-reset';

  IF job_record.jobid IS NOT NULL THEN
    RAISE NOTICE 'Migration 20250111000004_setup_pg_cron_quota_reset completed successfully.';
    RAISE NOTICE 'Cron job created:';
    RAISE NOTICE '  Job ID: %', job_record.jobid;
    RAISE NOTICE '  Job Name: %', job_record.jobname;
    RAISE NOTICE '  Schedule: %', job_record.schedule;
    RAISE NOTICE '  Active: %', job_record.active;
    RAISE NOTICE '';
    RAISE NOTICE 'Helper functions:';
    RAISE NOTICE '  - reset_monthly_ai_quotas(): Auto-reset function (scheduled)';
    RAISE NOTICE '  - manual_reset_ai_quotas(): Manual reset function (for testing)';
    RAISE NOTICE '  - get_cron_job_status(): Check cron job status';
    RAISE NOTICE '';
    RAISE NOTICE 'Cron job logs table: cron_job_logs';
  ELSE
    RAISE WARNING 'Failed to create cron job. Please check pg_cron installation.';
  END IF;
END;
$$;

-- =============================================
-- 測試函數: 模擬下月 1 日重置 (僅用於測試)
-- =============================================

-- UNCOMMENT TO TEST:
-- SELECT manual_reset_ai_quotas();
-- SELECT * FROM cron_job_logs ORDER BY execution_time DESC LIMIT 10;
-- SELECT * FROM get_cron_job_status();
