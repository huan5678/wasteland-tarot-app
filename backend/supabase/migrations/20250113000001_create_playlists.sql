-- Migration: Create playlists table
-- Description: 儲存使用者播放清單（註冊使用者專用）
-- Created: 2025-01-13
-- Feature: playlist-music-player (v4.0)

-- ============================================================================
-- 1. 建立 playlists 表
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.playlists (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User Reference (NOT NULL - 播放清單必須屬於使用者)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Playlist Metadata
    name TEXT NOT NULL CHECK (char_length(name) <= 100),
    description TEXT CHECK (char_length(description) <= 500),

    -- Visibility Flag
    is_public BOOLEAN NOT NULL DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. 建立索引
-- ============================================================================

-- 使用者 ID 索引（查詢使用者所有播放清單）
CREATE INDEX IF NOT EXISTS idx_playlists_user_id
    ON public.playlists(user_id);

-- 建立時間索引（排序用）
CREATE INDEX IF NOT EXISTS idx_playlists_created_at
    ON public.playlists(created_at DESC);

-- 公開播放清單索引（未來可能用於公開播放清單瀏覽功能）
CREATE INDEX IF NOT EXISTS idx_playlists_is_public
    ON public.playlists(is_public)
    WHERE is_public = TRUE;

-- ============================================================================
-- 3. 建立 updated_at 觸發器
-- ============================================================================

CREATE OR REPLACE FUNCTION update_playlists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER playlists_updated_at
    BEFORE UPDATE ON public.playlists
    FOR EACH ROW
    EXECUTE FUNCTION update_playlists_updated_at();

-- ============================================================================
-- 4. 建立註解（文件化）
-- ============================================================================

COMMENT ON TABLE public.playlists IS '播放清單表：儲存註冊使用者的音樂播放清單';
COMMENT ON COLUMN public.playlists.id IS '播放清單 UUID';
COMMENT ON COLUMN public.playlists.user_id IS '使用者 ID（擁有者）';
COMMENT ON COLUMN public.playlists.name IS '播放清單名稱（最多 100 字元）';
COMMENT ON COLUMN public.playlists.description IS '播放清單描述（最多 500 字元，可選）';
COMMENT ON COLUMN public.playlists.is_public IS '公開標記（TRUE = 公開，FALSE = 私密）';
COMMENT ON COLUMN public.playlists.created_at IS '建立時間';
COMMENT ON COLUMN public.playlists.updated_at IS '最後更新時間';

-- ============================================================================
-- 5. 啟用 Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- 註：RLS Policies 將在後續 migration（20250113000003_create_rls_policies.sql）中定義
