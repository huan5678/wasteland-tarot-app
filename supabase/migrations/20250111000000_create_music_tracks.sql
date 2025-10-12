-- =============================================
-- Migration: 建立 music_tracks 資料表
-- Description: 音樂庫資料表，儲存使用者 AI 生成音樂和系統預設音樂
-- Requirements: 16, 19
-- Task: 1.1
-- =============================================

-- 建立 music_tracks 資料表
CREATE TABLE IF NOT EXISTS music_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL 表示系統音樂
  title VARCHAR(100) NOT NULL,
  prompt TEXT,                                               -- 使用者輸入的原始 prompt (系統音樂為 NULL)
  parameters JSONB NOT NULL,                                 -- LLM 解析的音樂參數 (key, mode, tempo, timbre, genre, mood)
  audio_data TEXT NOT NULL,                                  -- 序列化的 Web Audio API 參數
  duration INTEGER NOT NULL DEFAULT 0,                       -- 音樂時長 (秒)
  is_public BOOLEAN NOT NULL DEFAULT FALSE,                  -- 是否公開分享 (保留未來使用)
  is_system BOOLEAN NOT NULL DEFAULT FALSE,                  -- 系統預設音樂標記
  play_count INTEGER NOT NULL DEFAULT 0,                     -- 播放次數
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================
-- 建立索引以優化查詢效能
-- =============================================

-- 索引 1: user_id (查詢使用者音樂)
CREATE INDEX IF NOT EXISTS idx_music_tracks_user_id ON music_tracks USING btree (user_id);

-- 索引 2: created_at (按建立時間排序)
CREATE INDEX IF NOT EXISTS idx_music_tracks_created_at ON music_tracks USING btree (created_at DESC);

-- 索引 3: parameters (JSONB GIN 索引，支援標籤篩選)
CREATE INDEX IF NOT EXISTS idx_music_tracks_parameters ON music_tracks USING gin (parameters);

-- 索引 4: is_system (查詢系統音樂)
CREATE INDEX IF NOT EXISTS idx_music_tracks_is_system ON music_tracks USING btree (is_system) WHERE is_system = TRUE;

-- =============================================
-- 啟用 Row Level Security (RLS)
-- =============================================

ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS 政策 1: 使用者僅能查看自己的音樂、系統音樂和公開音樂
-- =============================================

CREATE POLICY music_tracks_select_own ON music_tracks
  FOR SELECT
  USING (
    -- 使用者自己的音樂
    (SELECT auth.uid()) = user_id
    OR
    -- 系統音樂
    is_system = TRUE
    OR
    -- 公開音樂
    is_public = TRUE
  );

-- =============================================
-- RLS 政策 2: 使用者僅能新增自己的音樂
-- =============================================

CREATE POLICY music_tracks_insert_own ON music_tracks
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- =============================================
-- RLS 政策 3: 使用者僅能刪除自己的音樂 (系統音樂禁止刪除)
-- =============================================

CREATE POLICY music_tracks_delete_own ON music_tracks
  FOR DELETE
  USING (
    (SELECT auth.uid()) = user_id
    AND
    is_system = FALSE
  );

-- =============================================
-- RLS 政策 4: 使用者僅能更新自己的音樂 (系統音樂禁止更新)
-- =============================================

CREATE POLICY music_tracks_update_own ON music_tracks
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id
    AND
    is_system = FALSE
  );

-- =============================================
-- 初始化 4 首系統預設音樂
-- Requirements 19.2: Synthwave, Divination, Lo-fi, Ambient
-- =============================================

INSERT INTO music_tracks (user_id, title, prompt, parameters, audio_data, duration, is_system, is_public) VALUES
  -- Synthwave
  (
    NULL,
    'Synthwave',
    NULL,
    '{"key": "C", "mode": "minor", "tempo": 120, "timbre": "sawtooth", "genre": ["synthwave"], "mood": ["energetic"]}',
    '{"preset": "synthwave_classic", "chordProgression": "classic_synthwave", "complexity": "rich"}',
    0,
    TRUE,
    TRUE
  ),
  -- Divination
  (
    NULL,
    'Divination',
    NULL,
    '{"key": "A", "mode": "minor", "tempo": 80, "timbre": "sine", "genre": ["ambient"], "mood": ["mysterious"]}',
    '{"preset": "divination", "chordProgression": "divination_simple", "complexity": "simple"}',
    0,
    TRUE,
    TRUE
  ),
  -- Lo-fi
  (
    NULL,
    'Lo-fi',
    NULL,
    '{"key": "F", "mode": "major", "tempo": 90, "timbre": "triangle", "genre": ["lofi"], "mood": ["calm"]}',
    '{"preset": "lofi", "chordProgression": "melancholic", "complexity": "standard"}',
    0,
    TRUE,
    TRUE
  ),
  -- Ambient
  (
    NULL,
    'Ambient',
    NULL,
    '{"key": "E", "mode": "minor", "tempo": 60, "timbre": "sine", "genre": ["ambient"], "mood": ["calm"]}',
    '{"preset": "ambient", "chordProgression": "dorian_groove", "complexity": "simple"}',
    0,
    TRUE,
    TRUE
  );

-- =============================================
-- 建立觸發函數: 自動更新 updated_at 欄位
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 套用觸發器至 music_tracks 表
-- =============================================

CREATE TRIGGER update_music_tracks_updated_at
BEFORE UPDATE ON music_tracks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 驗證資料
-- =============================================

-- 檢查系統音樂是否正確建立
DO $$
DECLARE
  system_tracks_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO system_tracks_count FROM music_tracks WHERE is_system = TRUE;

  IF system_tracks_count <> 4 THEN
    RAISE EXCEPTION 'System tracks initialization failed. Expected 4 tracks, found %', system_tracks_count;
  END IF;

  RAISE NOTICE 'Migration 20250111000000_create_music_tracks completed successfully. % system tracks created.', system_tracks_count;
END;
$$;
