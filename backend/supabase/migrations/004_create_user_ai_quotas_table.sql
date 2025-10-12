-- Migration: Create user_ai_quotas table
-- Description: 使用者 AI 生成配額管理
-- Created: 2025-01-11

CREATE TABLE IF NOT EXISTS public.user_ai_quotas (
    -- Primary Key (user_id as PK for easier access)
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Quota Management
    monthly_quota INTEGER NOT NULL DEFAULT 10,  -- 每月免費配額
    used_quota INTEGER NOT NULL DEFAULT 0,      -- 本月已使用配額

    -- Timestamps
    last_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT user_ai_quotas_monthly_quota_positive CHECK (monthly_quota > 0),
    CONSTRAINT user_ai_quotas_used_quota_non_negative CHECK (used_quota >= 0),
    CONSTRAINT user_ai_quotas_used_not_exceed CHECK (used_quota <= monthly_quota + 100)  -- Allow some buffer
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_ai_quotas_last_reset ON public.user_ai_quotas(last_reset_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_ai_quotas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_ai_quotas_updated_at
    BEFORE UPDATE ON public.user_ai_quotas
    FOR EACH ROW
    EXECUTE FUNCTION update_user_ai_quotas_updated_at();

-- Function to reset monthly quotas (called by pg_cron)
CREATE OR REPLACE FUNCTION reset_monthly_ai_quotas()
RETURNS void AS $$
BEGIN
    UPDATE public.user_ai_quotas
    SET
        used_quota = 0,
        last_reset_at = NOW()
    WHERE
        DATE_TRUNC('month', last_reset_at) < DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE public.user_ai_quotas IS 'AI 配額表：管理使用者每月 AI 生成音樂配額';
COMMENT ON COLUMN public.user_ai_quotas.monthly_quota IS '每月免費配額 (預設 10 次)';
COMMENT ON COLUMN public.user_ai_quotas.used_quota IS '本月已使用配額';
COMMENT ON FUNCTION reset_monthly_ai_quotas() IS '重置所有使用者的月配額 (由 pg_cron 每月 1 日執行)';
