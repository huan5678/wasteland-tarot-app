-- Migration: Create playlist_tracks table
-- Description: 播放清單與音樂軌道的多對多關聯表
-- Created: 2025-01-11

CREATE TABLE IF NOT EXISTS public.playlist_tracks (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys
    playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES public.music_tracks(id) ON DELETE CASCADE,

    -- Position in playlist (for ordering)
    position INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT playlist_tracks_position_positive CHECK (position >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON public.playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track_id ON public.playlist_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position ON public.playlist_tracks(playlist_id, position);

-- Unique constraint: Same track cannot be added twice to the same playlist
CREATE UNIQUE INDEX IF NOT EXISTS idx_playlist_tracks_unique
    ON public.playlist_tracks(playlist_id, track_id);

-- Comments
COMMENT ON TABLE public.playlist_tracks IS '播放清單軌道關聯表：管理播放清單中的音樂軌道順序';
COMMENT ON COLUMN public.playlist_tracks.position IS '播放清單中的位置 (用於排序)';
