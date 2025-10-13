-- Migration: Create user_rhythm_presets table
-- Description: 儲存使用者節奏 Pattern（16 步驟音序器），支援系統預設和公開分享
-- Created: 2025-01-13
-- Feature: playlist-music-player (v4.0)

-- ============================================================================
-- 1. 建立 user_rhythm_presets 表
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_rhythm_presets (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User Reference (NULL for system presets)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Preset Metadata
    name TEXT NOT NULL CHECK (char_length(name) <= 50),
    description TEXT CHECK (char_length(description) <= 200),

    -- Pattern Data (JSONB)
    -- 格式：{ kick: boolean[16], snare: boolean[16], hihat: boolean[16], openhat: boolean[16], clap: boolean[16] }
    pattern JSONB NOT NULL,

    -- Flags
    is_system_preset BOOLEAN NOT NULL DEFAULT FALSE,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT pattern_structure_check CHECK (
        jsonb_typeof(pattern) = 'object' AND
        pattern ? 'kick' AND
        pattern ? 'snare' AND
        pattern ? 'hihat' AND
        pattern ? 'openhat' AND
        pattern ? 'clap'
    )
);

-- ============================================================================
-- 2. 建立索引
-- ============================================================================

-- 使用者 ID 索引（查詢使用者所有 Preset）
CREATE INDEX IF NOT EXISTS idx_user_rhythm_presets_user_id
    ON public.user_rhythm_presets(user_id);

-- 公開狀態索引（查詢公開歌曲）
CREATE INDEX IF NOT EXISTS idx_user_rhythm_presets_is_public
    ON public.user_rhythm_presets(is_public)
    WHERE is_public = TRUE;

-- 系統預設索引（查詢系統預設歌曲）
CREATE INDEX IF NOT EXISTS idx_user_rhythm_presets_is_system_preset
    ON public.user_rhythm_presets(is_system_preset)
    WHERE is_system_preset = TRUE;

-- 建立時間索引（排序用）
CREATE INDEX IF NOT EXISTS idx_user_rhythm_presets_created_at
    ON public.user_rhythm_presets(created_at DESC);

-- ============================================================================
-- 3. 建立 updated_at 觸發器
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_rhythm_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_rhythm_presets_updated_at
    BEFORE UPDATE ON public.user_rhythm_presets
    FOR EACH ROW
    EXECUTE FUNCTION update_user_rhythm_presets_updated_at();

-- ============================================================================
-- 4. 建立註解（文件化）
-- ============================================================================

COMMENT ON TABLE public.user_rhythm_presets IS '使用者節奏 Preset 表：儲存 16 步驟節奏 Pattern（系統預設 + 使用者創作）';
COMMENT ON COLUMN public.user_rhythm_presets.id IS 'Preset UUID';
COMMENT ON COLUMN public.user_rhythm_presets.user_id IS '使用者 ID（NULL 表示系統預設）';
COMMENT ON COLUMN public.user_rhythm_presets.name IS 'Preset 名稱（最多 50 字元）';
COMMENT ON COLUMN public.user_rhythm_presets.description IS 'Preset 描述（最多 200 字元，可選）';
COMMENT ON COLUMN public.user_rhythm_presets.pattern IS '16 步驟節奏 Pattern（JSONB 格式：5 個軌道 x 16 步驟）';
COMMENT ON COLUMN public.user_rhythm_presets.is_system_preset IS '系統預設標記（TRUE = 系統預設，禁止刪除/修改）';
COMMENT ON COLUMN public.user_rhythm_presets.is_public IS '公開分享標記（TRUE = 公開，訪客可見）';
COMMENT ON COLUMN public.user_rhythm_presets.created_at IS '建立時間';
COMMENT ON COLUMN public.user_rhythm_presets.updated_at IS '最後更新時間';

-- ============================================================================
-- 5. 啟用 Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.user_rhythm_presets ENABLE ROW LEVEL SECURITY;

-- 註：RLS Policies 將在後續 migration（20250113000003_create_rls_policies.sql）中定義
