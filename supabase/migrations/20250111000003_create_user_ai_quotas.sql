-- =============================================
-- Migration: 建立 user_ai_quotas 配額追蹤表
-- Description: AI 生成配額追蹤表,支援月度配額重置
-- Requirements: 17
-- Task: 1.4
-- =============================================

-- 建立 user_ai_quotas 配額追蹤表
CREATE TABLE IF NOT EXISTS user_ai_quotas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  quota_limit INTEGER NOT NULL DEFAULT 20,                   -- 配額上限 (免費 20, 付費 100)
  used_count INTEGER NOT NULL DEFAULT 0,                     -- 本月已使用次數
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT DATE_TRUNC('month', NOW() + INTERVAL '1 month'),  -- 下次重置時間 (下月 1 日)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- 約束: used_count 不可為負數且不可超過 quota_limit
  CONSTRAINT used_count_non_negative CHECK (used_count >= 0),
  CONSTRAINT used_count_within_limit CHECK (used_count <= quota_limit)
);

-- =============================================
-- 建立索引以優化查詢效能
-- =============================================

-- 索引 1: reset_at (查詢需要重置的使用者配額)
CREATE INDEX IF NOT EXISTS idx_user_ai_quotas_reset_at ON user_ai_quotas USING btree (reset_at);

-- 索引 2: user_id (查詢單一使用者配額)
CREATE INDEX IF NOT EXISTS idx_user_ai_quotas_user_id ON user_ai_quotas USING btree (user_id);

-- =============================================
-- 啟用 Row Level Security (RLS)
-- =============================================

ALTER TABLE user_ai_quotas ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS 政策 1: 使用者僅能查看自己的配額
-- =============================================

CREATE POLICY user_ai_quotas_select_own ON user_ai_quotas
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- =============================================
-- RLS 政策 2: 使用者僅能更新自己的配額
-- =============================================

CREATE POLICY user_ai_quotas_update_own ON user_ai_quotas
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- =============================================
-- 套用觸發器: 自動更新 updated_at 欄位
-- =============================================

CREATE TRIGGER update_user_ai_quotas_updated_at
BEFORE UPDATE ON user_ai_quotas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 建立函數: 為新使用者建立初始配額記錄
-- Requirements 17.5: 使用者首次登入後首次使用 AI 生成時,自動建立配額記錄
-- =============================================

CREATE OR REPLACE FUNCTION create_quota_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 為新使用者建立初始配額記錄 (免費 20 次)
  INSERT INTO user_ai_quotas (user_id, quota_limit, used_count, reset_at)
  VALUES (
    NEW.id,
    20,
    0,
    DATE_TRUNC('month', NOW() + INTERVAL '1 month')
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 套用觸發器: 新使用者自動建立配額記錄
-- 觸發條件: auth.users 表有新使用者註冊時
-- =============================================

CREATE TRIGGER create_quota_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_quota_for_new_user();

-- =============================================
-- 建立函數: 檢查配額是否足夠
-- Requirements 17.9: 當使用者達到月度配額時,系統停用 AI 生成功能
-- =============================================

CREATE OR REPLACE FUNCTION check_quota_available(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  quota_record RECORD;
BEGIN
  -- 查詢使用者配額
  SELECT quota_limit, used_count INTO quota_record
  FROM user_ai_quotas
  WHERE user_id = p_user_id;

  -- 若配額記錄不存在,回傳 TRUE (允許生成,並在生成時自動建立記錄)
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;

  -- 檢查配額是否已用完
  IF quota_record.used_count >= quota_record.quota_limit THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 建立函數: 增加配額使用次數
-- Requirements 2.2: 使用者成功生成 AI 音樂後,更新配額使用次數
-- =============================================

CREATE OR REPLACE FUNCTION increment_quota_usage(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- 增加 used_count
  UPDATE user_ai_quotas
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 若配額記錄不存在,建立新記錄 (初始 used_count = 1)
  IF NOT FOUND THEN
    INSERT INTO user_ai_quotas (user_id, quota_limit, used_count, reset_at)
    VALUES (
      p_user_id,
      20,
      1,
      DATE_TRUNC('month', NOW() + INTERVAL '1 month')
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 建立函數: 取得剩餘配額
-- =============================================

CREATE OR REPLACE FUNCTION get_remaining_quota(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  quota_record RECORD;
BEGIN
  -- 查詢使用者配額
  SELECT quota_limit, used_count INTO quota_record
  FROM user_ai_quotas
  WHERE user_id = p_user_id;

  -- 若配額記錄不存在,回傳預設配額 20
  IF NOT FOUND THEN
    RETURN 20;
  END IF;

  -- 計算剩餘配額
  RETURN GREATEST(quota_record.quota_limit - quota_record.used_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 驗證資料
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20250111000003_create_user_ai_quotas completed successfully.';
  RAISE NOTICE 'User AI quotas table created with the following features:';
  RAISE NOTICE '  - Default quota: 20 generations per month';
  RAISE NOTICE '  - Auto-create quota record for new users';
  RAISE NOTICE '  - Helper functions: check_quota_available(), increment_quota_usage(), get_remaining_quota()';
END;
$$;
