-- =============================================
-- Migration: 建立 playlist_tracks 關聯表
-- Description: 播放清單歌曲關聯表 (多對多),支援拖曳排序
-- Requirements: 18
-- Task: 1.3
-- =============================================

-- 建立 playlist_tracks 關聯表
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES music_tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,                                 -- 歌曲順序 (支援拖曳排序)
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- 唯一約束: 同一播放清單中不可重複加入同一首歌
  UNIQUE (playlist_id, track_id)
);

-- =============================================
-- 建立索引以優化查詢效能
-- =============================================

-- 索引 1: playlist_id (查詢播放清單中的所有歌曲)
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks USING btree (playlist_id);

-- 索引 2: 複合索引 (playlist_id, position) (查詢並按順序排序)
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position ON playlist_tracks USING btree (playlist_id, position);

-- 索引 3: track_id (查詢歌曲出現在哪些播放清單中)
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track_id ON playlist_tracks USING btree (track_id);

-- =============================================
-- 啟用 Row Level Security (RLS)
-- =============================================

ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS 政策: 透過 playlist 的 user_id 控制存取權限
-- =============================================

CREATE POLICY playlist_tracks_all_own ON playlist_tracks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_tracks.playlist_id
      AND playlists.user_id = (SELECT auth.uid())
    )
  );

-- =============================================
-- 建立函數: 自動計算新音樂的 position
-- Requirements 18.9: 新音樂的 position 為播放清單中的下一個順序號
-- =============================================

CREATE OR REPLACE FUNCTION auto_calculate_position()
RETURNS TRIGGER AS $$
DECLARE
  max_position INTEGER;
BEGIN
  -- 如果 position 未提供,自動計算
  IF NEW.position IS NULL OR NEW.position = 0 THEN
    SELECT COALESCE(MAX(position), 0) + 1 INTO max_position
    FROM playlist_tracks
    WHERE playlist_id = NEW.playlist_id;

    NEW.position := max_position;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 套用觸發器: 自動計算 position
-- =============================================

CREATE TRIGGER auto_calculate_position_trigger
BEFORE INSERT ON playlist_tracks
FOR EACH ROW
EXECUTE FUNCTION auto_calculate_position();

-- =============================================
-- 建立函數: 刪除歌曲後重新計算 position (保持連續性)
-- Requirements 18.12: 從播放清單移除音樂後,重新計算剩餘音樂的 position
-- =============================================

CREATE OR REPLACE FUNCTION reorder_positions_after_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- 將被刪除歌曲之後的所有歌曲 position 減 1
  UPDATE playlist_tracks
  SET position = position - 1
  WHERE playlist_id = OLD.playlist_id
  AND position > OLD.position;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 套用觸發器: 刪除後重新計算 position
-- =============================================

CREATE TRIGGER reorder_positions_after_delete_trigger
AFTER DELETE ON playlist_tracks
FOR EACH ROW
EXECUTE FUNCTION reorder_positions_after_delete();

-- =============================================
-- 建立函數: 為新使用者的預設播放清單加入 4 首系統音樂
-- Requirements 19.9: 新使用者註冊時自動將 4 首系統預設音樂加入「我的最愛」
-- =============================================

CREATE OR REPLACE FUNCTION add_system_tracks_to_default_playlist()
RETURNS TRIGGER AS $$
DECLARE
  system_track_record RECORD;
  track_position INTEGER := 1;
BEGIN
  -- 僅在預設播放清單建立時觸發
  IF NEW.is_default = TRUE THEN
    -- 查詢所有系統音樂
    FOR system_track_record IN
      SELECT id FROM music_tracks WHERE is_system = TRUE ORDER BY created_at
    LOOP
      -- 加入系統音樂至預設播放清單
      INSERT INTO playlist_tracks (playlist_id, track_id, position)
      VALUES (NEW.id, system_track_record.id, track_position);

      track_position := track_position + 1;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 套用觸發器: 新預設播放清單自動加入系統音樂
-- =============================================

CREATE TRIGGER add_system_tracks_to_default_playlist_trigger
AFTER INSERT ON playlists
FOR EACH ROW
EXECUTE FUNCTION add_system_tracks_to_default_playlist();

-- =============================================
-- 驗證資料
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20250111000002_create_playlist_tracks completed successfully.';
  RAISE NOTICE 'Playlist_tracks table created with the following features:';
  RAISE NOTICE '  - Unique constraint (playlist_id, track_id)';
  RAISE NOTICE '  - Auto-calculate position for new tracks';
  RAISE NOTICE '  - Auto-reorder positions after delete';
  RAISE NOTICE '  - Auto-add system tracks to default playlist';
END;
$$;
