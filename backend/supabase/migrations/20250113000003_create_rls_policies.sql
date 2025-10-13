-- Migration: Create Row Level Security (RLS) Policies
-- Description: 定義訪客、註冊使用者、擁有者的存取權限
-- Created: 2025-01-13
-- Feature: playlist-music-player (v4.0)

-- ============================================================================
-- 1. user_rhythm_presets RLS Policies
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1.1 SELECT Policies (查詢權限)
-- ────────────────────────────────────────────────────────────────────────────

-- Policy: 訪客可見系統預設 Preset
CREATE POLICY "Guest can view system presets"
    ON public.user_rhythm_presets
    FOR SELECT
    USING (is_system_preset = TRUE);

-- Policy: 訪客可見公開 Preset
CREATE POLICY "Guest can view public presets"
    ON public.user_rhythm_presets
    FOR SELECT
    USING (is_public = TRUE);

-- Policy: 註冊使用者可見自己的所有 Preset（包含私密）
CREATE POLICY "Authenticated users can view their own presets"
    ON public.user_rhythm_presets
    FOR SELECT
    USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 1.2 INSERT Policies (建立權限)
-- ────────────────────────────────────────────────────────────────────────────

-- Policy: 註冊使用者可建立自己的 Preset（禁止建立系統預設）
CREATE POLICY "Authenticated users can create their own presets"
    ON public.user_rhythm_presets
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        is_system_preset = FALSE
    );

-- ────────────────────────────────────────────────────────────────────────────
-- 1.3 UPDATE Policies (更新權限)
-- ────────────────────────────────────────────────────────────────────────────

-- Policy: 註冊使用者只能更新自己的 Preset（禁止更新系統預設）
CREATE POLICY "Authenticated users can update their own presets"
    ON public.user_rhythm_presets
    FOR UPDATE
    USING (
        auth.uid() = user_id AND
        is_system_preset = FALSE
    )
    WITH CHECK (
        auth.uid() = user_id AND
        is_system_preset = FALSE
    );

-- ────────────────────────────────────────────────────────────────────────────
-- 1.4 DELETE Policies (刪除權限)
-- ────────────────────────────────────────────────────────────────────────────

-- Policy: 註冊使用者只能刪除自己的 Preset（禁止刪除系統預設）
CREATE POLICY "Authenticated users can delete their own presets"
    ON public.user_rhythm_presets
    FOR DELETE
    USING (
        auth.uid() = user_id AND
        is_system_preset = FALSE
    );

-- ============================================================================
-- 2. playlists RLS Policies
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 2.1 SELECT Policies (查詢權限)
-- ────────────────────────────────────────────────────────────────────────────

-- Policy: 註冊使用者可見自己的播放清單
CREATE POLICY "Authenticated users can view their own playlists"
    ON public.playlists
    FOR SELECT
    USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 2.2 INSERT Policies (建立權限)
-- ────────────────────────────────────────────────────────────────────────────

-- Policy: 註冊使用者可建立自己的播放清單
CREATE POLICY "Authenticated users can create their own playlists"
    ON public.playlists
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 2.3 UPDATE Policies (更新權限)
-- ────────────────────────────────────────────────────────────────────────────

-- Policy: 註冊使用者只能更新自己的播放清單
CREATE POLICY "Authenticated users can update their own playlists"
    ON public.playlists
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 2.4 DELETE Policies (刪除權限)
-- ────────────────────────────────────────────────────────────────────────────

-- Policy: 註冊使用者只能刪除自己的播放清單
CREATE POLICY "Authenticated users can delete their own playlists"
    ON public.playlists
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 3. playlist_patterns RLS Policies
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 3.1 SELECT Policies (查詢權限)
-- ────────────────────────────────────────────────────────────────────────────

-- Policy: 註冊使用者可見自己播放清單中的 Patterns
CREATE POLICY "Authenticated users can view patterns in their own playlists"
    ON public.playlist_patterns
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.playlists
            WHERE playlists.id = playlist_patterns.playlist_id
              AND playlists.user_id = auth.uid()
        )
    );

-- ────────────────────────────────────────────────────────────────────────────
-- 3.2 INSERT Policies (建立權限)
-- ────────────────────────────────────────────────────────────────────────────

-- Policy: 註冊使用者可加入 Pattern 到自己的播放清單
CREATE POLICY "Authenticated users can add patterns to their own playlists"
    ON public.playlist_patterns
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.playlists
            WHERE playlists.id = playlist_patterns.playlist_id
              AND playlists.user_id = auth.uid()
        )
    );

-- ────────────────────────────────────────────────────────────────────────────
-- 3.3 UPDATE Policies (更新權限)
-- ────────────────────────────────────────────────────────────────────────────

-- Policy: 註冊使用者可更新自己播放清單中的 Pattern（例如調整順序）
CREATE POLICY "Authenticated users can update patterns in their own playlists"
    ON public.playlist_patterns
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.playlists
            WHERE playlists.id = playlist_patterns.playlist_id
              AND playlists.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.playlists
            WHERE playlists.id = playlist_patterns.playlist_id
              AND playlists.user_id = auth.uid()
        )
    );

-- ────────────────────────────────────────────────────────────────────────────
-- 3.4 DELETE Policies (刪除權限)
-- ────────────────────────────────────────────────────────────────────────────

-- Policy: 註冊使用者可移除自己播放清單中的 Pattern
CREATE POLICY "Authenticated users can delete patterns from their own playlists"
    ON public.playlist_patterns
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.playlists
            WHERE playlists.id = playlist_patterns.playlist_id
              AND playlists.user_id = auth.uid()
        )
    );

-- ============================================================================
-- 4. 建立註解（文件化）
-- ============================================================================

COMMENT ON POLICY "Guest can view system presets" ON public.user_rhythm_presets IS
    '訪客可查看系統預設 Preset（is_system_preset = TRUE）';

COMMENT ON POLICY "Guest can view public presets" ON public.user_rhythm_presets IS
    '訪客可查看公開 Preset（is_public = TRUE）';

COMMENT ON POLICY "Authenticated users can view their own presets" ON public.user_rhythm_presets IS
    '註冊使用者可查看自己的所有 Preset（包含私密）';

COMMENT ON POLICY "Authenticated users can create their own presets" ON public.user_rhythm_presets IS
    '註冊使用者可建立自己的 Preset（禁止建立系統預設）';

COMMENT ON POLICY "Authenticated users can update their own presets" ON public.user_rhythm_presets IS
    '註冊使用者可更新自己的 Preset（禁止更新系統預設）';

COMMENT ON POLICY "Authenticated users can delete their own presets" ON public.user_rhythm_presets IS
    '註冊使用者可刪除自己的 Preset（禁止刪除系統預設）';
