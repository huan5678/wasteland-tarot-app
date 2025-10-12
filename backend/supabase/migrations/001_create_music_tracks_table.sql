-- Migration: Create music_tracks table
-- Description: 儲存音樂軌道資料（系統音樂 + 使用者生成音樂）
-- Created: 2025-01-11

CREATE TABLE IF NOT EXISTS public.music_tracks (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User Reference (NULL for system music)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Music Metadata
    title TEXT NOT NULL,
    prompt TEXT,  -- NULL for system music

    -- Music Parameters (JSONB)
    parameters JSONB NOT NULL,

    -- Audio Data (Serialized Web Audio API parameters)
    audio_data TEXT NOT NULL,

    -- Duration in seconds
    duration INTEGER NOT NULL DEFAULT 60,

    -- Flags
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,

    -- Statistics
    play_count INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_music_tracks_user_id ON public.music_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_music_tracks_is_system ON public.music_tracks(is_system);
CREATE INDEX IF NOT EXISTS idx_music_tracks_is_public ON public.music_tracks(is_public);
CREATE INDEX IF NOT EXISTS idx_music_tracks_created_at ON public.music_tracks(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_music_tracks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER music_tracks_updated_at
    BEFORE UPDATE ON public.music_tracks
    FOR EACH ROW
    EXECUTE FUNCTION update_music_tracks_updated_at();

-- Comments
COMMENT ON TABLE public.music_tracks IS '音樂軌道表：儲存系統預設音樂和使用者生成的音樂';
COMMENT ON COLUMN public.music_tracks.user_id IS '使用者 ID (NULL 表示系統音樂)';
COMMENT ON COLUMN public.music_tracks.parameters IS 'JSON 格式音樂參數 (key, mode, tempo, timbre, genre, mood)';
COMMENT ON COLUMN public.music_tracks.audio_data IS '序列化的 Web Audio API 參數';
COMMENT ON COLUMN public.music_tracks.is_system IS '系統預設音樂標記';
