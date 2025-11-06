-- Migration: Add daily rhythm generation quota to user_ai_quotas
-- Description: 新增每日節奏生成配額欄位（獨立於每月 AI 配額）
-- Created: 2025-11-03

-- Add new columns for rhythm generation quota (daily)
-- Note: last_reset_at already exists from migration 004, we just add the rhythm quota columns
ALTER TABLE public.user_ai_quotas
ADD COLUMN IF NOT EXISTS rhythm_quota_used INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS rhythm_quota_limit INTEGER NOT NULL DEFAULT 20;

-- Add constraints (separately for compatibility)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_ai_quotas_rhythm_quota_non_negative') THEN
        ALTER TABLE public.user_ai_quotas ADD CONSTRAINT user_ai_quotas_rhythm_quota_non_negative CHECK (rhythm_quota_used >= 0);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_ai_quotas_rhythm_quota_limit_positive') THEN
        ALTER TABLE public.user_ai_quotas ADD CONSTRAINT user_ai_quotas_rhythm_quota_limit_positive CHECK (rhythm_quota_limit > 0);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_ai_quotas_rhythm_used_not_exceed') THEN
        ALTER TABLE public.user_ai_quotas ADD CONSTRAINT user_ai_quotas_rhythm_used_not_exceed CHECK (rhythm_quota_used <= rhythm_quota_limit + 10);
    END IF;
END $$;

-- Note: Index for last_reset_at already exists from migration 004

-- Function to reset daily rhythm quotas (called by scheduled job)
CREATE OR REPLACE FUNCTION reset_daily_rhythm_quotas()
RETURNS void AS $$
BEGIN
    UPDATE public.user_ai_quotas
    SET
        rhythm_quota_used = 0,
        last_reset_at = NOW() + INTERVAL '1 day'
    WHERE
        last_reset_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON COLUMN public.user_ai_quotas.rhythm_quota_used IS '每日節奏生成已使用配額';
COMMENT ON COLUMN public.user_ai_quotas.rhythm_quota_limit IS '每日節奏生成配額上限 (預設 20 次)';
-- Note: last_reset_at comment already set in migration 004
COMMENT ON FUNCTION reset_daily_rhythm_quotas() IS '重置所有使用者的每日節奏配額 (由排程每日執行)';
