-- Migration: Create playlist_patterns junction table
-- Description: 播放清單與節奏 Pattern 的多對多關聯表
-- Created: 2025-01-13
-- Feature: playlist-music-player (v4.0)

-- ============================================================================
-- 1. 建立 playlist_patterns 關聯表
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.playlist_patterns (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys
    playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
    pattern_id UUID NOT NULL REFERENCES public.user_rhythm_presets(id) ON DELETE CASCADE,

    -- Position in playlist (0-based index)
    position INTEGER NOT NULL CHECK (position >= 0),

    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- ========================================================================
    -- Unique Constraints
    -- ========================================================================

    -- 約束 1: 同一播放清單中，每個位置只能有一個 Pattern
    CONSTRAINT unique_playlist_position UNIQUE (playlist_id, position),

    -- 約束 2: 同一播放清單中，同一 Pattern 不能重複加入
    CONSTRAINT unique_playlist_pattern UNIQUE (playlist_id, pattern_id)
);

-- ============================================================================
-- 2. 建立索引
-- ============================================================================

-- 播放清單 ID 索引（查詢播放清單中的所有 Pattern）
CREATE INDEX IF NOT EXISTS idx_playlist_patterns_playlist_id
    ON public.playlist_patterns(playlist_id);

-- Pattern ID 索引（查詢 Pattern 被哪些播放清單引用）
CREATE INDEX IF NOT EXISTS idx_playlist_patterns_pattern_id
    ON public.playlist_patterns(pattern_id);

-- 複合索引（播放清單 + 位置排序）
CREATE INDEX IF NOT EXISTS idx_playlist_patterns_playlist_position
    ON public.playlist_patterns(playlist_id, position);

-- ============================================================================
-- 3. 建立自動調整 position 的觸發器（刪除 Pattern 時）
-- ============================================================================

-- 當刪除 Pattern 時，自動調整後續 Pattern 的 position
CREATE OR REPLACE FUNCTION adjust_playlist_positions_after_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- 將被刪除 Pattern 之後的所有 Pattern position 減 1
    UPDATE public.playlist_patterns
    SET position = position - 1
    WHERE playlist_id = OLD.playlist_id
      AND position > OLD.position;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER playlist_patterns_adjust_positions_after_delete
    AFTER DELETE ON public.playlist_patterns
    FOR EACH ROW
    EXECUTE FUNCTION adjust_playlist_positions_after_delete();

-- ============================================================================
-- 4. 建立註解（文件化）
-- ============================================================================

COMMENT ON TABLE public.playlist_patterns IS '播放清單 Pattern 關聯表：多對多關係，支援排序';
COMMENT ON COLUMN public.playlist_patterns.id IS '關聯 UUID';
COMMENT ON COLUMN public.playlist_patterns.playlist_id IS '播放清單 ID（外鍵）';
COMMENT ON COLUMN public.playlist_patterns.pattern_id IS 'Pattern ID（外鍵，引用 user_rhythm_presets）';
COMMENT ON COLUMN public.playlist_patterns.position IS 'Pattern 在播放清單中的位置（0-based）';
COMMENT ON COLUMN public.playlist_patterns.created_at IS '加入時間';

-- ============================================================================
-- 5. 啟用 Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.playlist_patterns ENABLE ROW LEVEL SECURITY;

-- 註：RLS Policies 將在後續 migration（20250113000003_create_rls_policies.sql）中定義
