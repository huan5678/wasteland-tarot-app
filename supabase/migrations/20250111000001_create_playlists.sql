-- =============================================
-- Migration: 建立 playlists 資料表
-- Description: 播放清單資料表,支援使用者建立最多 5 個播放清單
-- Requirements: 18
-- Task: 1.2
-- =============================================

-- 建立 playlists 資料表
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,                 -- 預設播放清單 (每位使用者僅一個)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================
-- 建立索引以優化查詢效能
-- =============================================

-- 索引 1: user_id (查詢使用者播放清單)
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists USING btree (user_id);

-- 索引 2: 唯一預設播放清單 (每位使用者僅一個 is_default = TRUE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_playlists_user_default
  ON playlists (user_id)
  WHERE is_default = TRUE;

-- =============================================
-- 啟用 Row Level Security (RLS)
-- =============================================

ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS 政策: 使用者僅能存取自己的播放清單
-- =============================================

CREATE POLICY playlists_all_own ON playlists
  FOR ALL
  USING ((SELECT auth.uid()) = user_id);

-- =============================================
-- 建立函數: 驗證播放清單數量限制 (最多 5 個)
-- Requirements 18.4: 每位使用者最多建立 5 個播放清單
-- =============================================

CREATE OR REPLACE FUNCTION check_playlist_limit()
RETURNS TRIGGER AS $$
DECLARE
  playlist_count INTEGER;
BEGIN
  -- 計算使用者當前的播放清單數量
  SELECT COUNT(*) INTO playlist_count
  FROM playlists
  WHERE user_id = NEW.user_id;

  -- 檢查是否超過限制 (5 個)
  IF playlist_count >= 5 THEN
    RAISE EXCEPTION 'Playlist limit exceeded. Maximum 5 playlists per user.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 套用觸發器: 檢查播放清單數量限制
-- =============================================

CREATE TRIGGER check_playlist_limit_trigger
BEFORE INSERT ON playlists
FOR EACH ROW
EXECUTE FUNCTION check_playlist_limit();

-- =============================================
-- 套用觸發器: 自動更新 updated_at 欄位
-- =============================================

CREATE TRIGGER update_playlists_updated_at
BEFORE UPDATE ON playlists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 建立函數: 自動為新使用者建立預設播放清單
-- Requirements 18.3: 使用者首次登入時自動建立「我的最愛」預設播放清單
-- =============================================

CREATE OR REPLACE FUNCTION create_default_playlist_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 為新使用者建立預設播放清單
  INSERT INTO playlists (user_id, name, description, is_default)
  VALUES (
    NEW.id,
    '我的最愛',
    '自動建立的預設播放清單',
    TRUE
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 套用觸發器: 新使用者自動建立預設播放清單
-- 觸發條件: auth.users 表有新使用者註冊時
-- =============================================

CREATE TRIGGER create_default_playlist_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_default_playlist_for_new_user();

-- =============================================
-- 驗證資料
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20250111000001_create_playlists completed successfully.';
  RAISE NOTICE 'Playlists table created with the following features:';
  RAISE NOTICE '  - Maximum 5 playlists per user';
  RAISE NOTICE '  - Unique default playlist per user';
  RAISE NOTICE '  - Auto-create default playlist for new users';
END;
$$;
