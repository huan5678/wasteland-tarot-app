-- Migration: Add daily rhythm generation quota to user_ai_quotas
-- Description: 新增每日節奏生成配額欄位（獨立於每月 AI 配額）
-- Created: 2025-11-03

-- Add new columns for rhythm generation quota (daily)
ALTER TABLE public.user_ai_quotas
ADD COLUMN IF NOT EXISTS rhythm_quota_used INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS rhythm_quota_limit INTEGER NOT NULL DEFAULT 20,
ADD COLUMN IF NOT EXISTS quota_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day');

-- Add constraints
ALTER TABLE public.user_ai_quotas
ADD CONSTRAINT IF NOT EXISTS user_ai_quotas_rhythm_quota_non_negative CHECK (rhythm_quota_used >= 0),
ADD CONSTRAINT IF NOT EXISTS user_ai_quotas_rhythm_quota_limit_positive CHECK (rhythm_quota_limit > 0),
ADD CONSTRAINT IF NOT EXISTS user_ai_quotas_rhythm_used_not_exceed CHECK (rhythm_quota_used <= rhythm_quota_limit + 10);

-- Add index for quota reset queries
CREATE INDEX IF NOT EXISTS idx_user_ai_quotas_quota_reset ON public.user_ai_quotas(quota_reset_at);

-- Function to reset daily rhythm quotas (called by scheduled job)
CREATE OR REPLACE FUNCTION reset_daily_rhythm_quotas()
RETURNS void AS $$
BEGIN
    UPDATE public.user_ai_quotas
    SET
        rhythm_quota_used = 0,
        quota_reset_at = NOW() + INTERVAL '1 day'
    WHERE
        quota_reset_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON COLUMN public.user_ai_quotas.rhythm_quota_used IS '每日節奏生成已使用配額';
COMMENT ON COLUMN public.user_ai_quotas.rhythm_quota_limit IS '每日節奏生成配額上限 (預設 20 次)';
COMMENT ON COLUMN public.user_ai_quotas.quota_reset_at IS '配額重置時間 (每日重置)';
COMMENT ON FUNCTION reset_daily_rhythm_quotas() IS '重置所有使用者的每日節奏配額 (由排程每日執行)';
