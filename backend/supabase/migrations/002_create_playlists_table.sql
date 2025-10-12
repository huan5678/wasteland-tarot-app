-- Migration: Create playlists table
-- Description: 儲存使用者播放清單
-- Created: 2025-01-11

CREATE TABLE IF NOT EXISTS public.playlists (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User Reference
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Playlist Metadata
    name TEXT NOT NULL,
    description TEXT,

    -- Flags
    is_default BOOLEAN NOT NULL DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT playlists_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_is_default ON public.playlists(is_default);
CREATE INDEX IF NOT EXISTS idx_playlists_created_at ON public.playlists(created_at DESC);

-- Unique constraint: Each user can have only ONE default playlist
CREATE UNIQUE INDEX IF NOT EXISTS idx_playlists_user_default
    ON public.playlists(user_id)
    WHERE is_default = TRUE;

-- Trigger for updated_at
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

-- Comments
COMMENT ON TABLE public.playlists IS '播放清單表：儲存使用者的音樂播放清單';
COMMENT ON COLUMN public.playlists.is_default IS '預設播放清單標記（每個使用者僅能有一個）';
