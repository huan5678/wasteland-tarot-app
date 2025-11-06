-- Migration: Fix user_ai_quotas foreign key constraint
-- Description: 修正 user_ai_quotas 外鍵從 auth.users 改為 public.users
-- Created: 2025-11-03

-- Step 1: Drop the old foreign key constraint
ALTER TABLE public.user_ai_quotas
DROP CONSTRAINT IF EXISTS user_ai_quotas_user_id_fkey;

-- Step 2: Add the correct foreign key constraint pointing to public.users
ALTER TABLE public.user_ai_quotas
ADD CONSTRAINT user_ai_quotas_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Comments
COMMENT ON CONSTRAINT user_ai_quotas_user_id_fkey ON public.user_ai_quotas IS '外鍵約束：關聯到 public.users 表';
