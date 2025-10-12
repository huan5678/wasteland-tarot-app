-- Migration: Create Row Level Security (RLS) Policies
-- Description: 設定資料表的 RLS 安全政策
-- Created: 2025-01-11

-- ===========================================
-- Enable RLS on all tables
-- ===========================================

ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_quotas ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- music_tracks RLS Policies
-- ===========================================

-- Policy 1: 使用者可以查看自己的音樂
CREATE POLICY "Users can view their own music"
    ON public.music_tracks
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR is_system = TRUE  -- 系統音樂對所有人可見
        OR (is_public = TRUE)  -- 公開音樂對所有人可見
    );

-- Policy 2: 使用者可以建立自己的音樂
CREATE POLICY "Users can create their own music"
    ON public.music_tracks
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND is_system = FALSE  -- 使用者不能建立系統音樂
    );

-- Policy 3: 使用者可以更新自己的音樂
CREATE POLICY "Users can update their own music"
    ON public.music_tracks
    FOR UPDATE
    USING (user_id = auth.uid() AND is_system = FALSE)
    WITH CHECK (user_id = auth.uid() AND is_system = FALSE);

-- Policy 4: 使用者可以刪除自己的音樂（但不能刪除系統音樂）
CREATE POLICY "Users can delete their own music"
    ON public.music_tracks
    FOR DELETE
    USING (user_id = auth.uid() AND is_system = FALSE);

-- ===========================================
-- playlists RLS Policies
-- ===========================================

-- Policy 1: 使用者只能查看自己的播放清單
CREATE POLICY "Users can view their own playlists"
    ON public.playlists
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy 2: 使用者可以建立自己的播放清單
CREATE POLICY "Users can create their own playlists"
    ON public.playlists
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Policy 3: 使用者可以更新自己的播放清單
CREATE POLICY "Users can update their own playlists"
    ON public.playlists
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy 4: 使用者可以刪除自己的播放清單（但不能刪除預設播放清單）
CREATE POLICY "Users can delete their own playlists"
    ON public.playlists
    FOR DELETE
    USING (user_id = auth.uid() AND is_default = FALSE);

-- ===========================================
-- playlist_tracks RLS Policies
-- ===========================================

-- Policy 1: 使用者可以查看自己播放清單中的軌道
CREATE POLICY "Users can view tracks in their playlists"
    ON public.playlist_tracks
    FOR SELECT
    USING (
        playlist_id IN (
            SELECT id FROM public.playlists WHERE user_id = auth.uid()
        )
    );

-- Policy 2: 使用者可以添加軌道到自己的播放清單
CREATE POLICY "Users can add tracks to their playlists"
    ON public.playlist_tracks
    FOR INSERT
    WITH CHECK (
        playlist_id IN (
            SELECT id FROM public.playlists WHERE user_id = auth.uid()
        )
    );

-- Policy 3: 使用者可以更新自己播放清單中的軌道
CREATE POLICY "Users can update tracks in their playlists"
    ON public.playlist_tracks
    FOR UPDATE
    USING (
        playlist_id IN (
            SELECT id FROM public.playlists WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        playlist_id IN (
            SELECT id FROM public.playlists WHERE user_id = auth.uid()
        )
    );

-- Policy 4: 使用者可以從自己的播放清單中移除軌道
CREATE POLICY "Users can remove tracks from their playlists"
    ON public.playlist_tracks
    FOR DELETE
    USING (
        playlist_id IN (
            SELECT id FROM public.playlists WHERE user_id = auth.uid()
        )
    );

-- ===========================================
-- user_ai_quotas RLS Policies
-- ===========================================

-- Policy 1: 使用者只能查看自己的配額
CREATE POLICY "Users can view their own quota"
    ON public.user_ai_quotas
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy 2: 系統可以建立配額記錄 (透過 service_role)
CREATE POLICY "Service role can create quota records"
    ON public.user_ai_quotas
    FOR INSERT
    WITH CHECK (true);  -- Service role bypasses RLS

-- Policy 3: 系統可以更新配額
CREATE POLICY "Service role can update quota"
    ON public.user_ai_quotas
    FOR UPDATE
    USING (true)  -- Service role bypasses RLS
    WITH CHECK (true);

-- Comments
COMMENT ON POLICY "Users can view their own music" ON public.music_tracks IS '使用者可查看：自己的音樂 + 系統音樂 + 公開音樂';
COMMENT ON POLICY "Users can delete their own music" ON public.music_tracks IS '使用者只能刪除自己的音樂，不能刪除系統音樂';
COMMENT ON POLICY "Users can delete their own playlists" ON public.playlists IS '使用者只能刪除自己的播放清單，不能刪除預設播放清單';
