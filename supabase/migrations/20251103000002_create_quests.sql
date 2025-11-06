-- =============================================
-- Migration: 建立 quests 資料表
-- Description: 統一任務系統資料表，包含每日與每週任務定義
-- Requirements: unified-karma-system/Requirement 4
-- Task: 1.3
-- =============================================

-- 建立 quests 資料表
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,                         -- 任務唯一識別碼
  name_zh_tw VARCHAR(200) NOT NULL,                          -- 繁體中文任務名稱
  name_en VARCHAR(200) NOT NULL,                             -- 英文任務名稱
  description TEXT NOT NULL,                                 -- 任務描述
  type VARCHAR(20) NOT NULL,                                 -- 任務類型: DAILY, WEEKLY
  category VARCHAR(50) NOT NULL,                             -- 任務分類: READING, SOCIAL, BINGO, EXPLORATION
  objectives JSONB NOT NULL,                                 -- 任務目標 (type, target, filters)
  rewards JSONB NOT NULL,                                    -- 任務獎勵 (karma_points, bonus_items)
  difficulty VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',          -- 難度: EASY, MEDIUM, HARD
  is_fixed BOOLEAN NOT NULL DEFAULT FALSE,                   -- 是否為固定任務（非隨機）
  is_active BOOLEAN NOT NULL DEFAULT TRUE,                   -- 是否啟用
  display_order INTEGER NOT NULL DEFAULT 0,                  -- 顯示順序
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- 約束條件
  CONSTRAINT check_quest_type CHECK (type IN ('DAILY', 'WEEKLY')),
  CONSTRAINT check_quest_category CHECK (category IN ('READING', 'SOCIAL', 'BINGO', 'EXPLORATION')),
  CONSTRAINT check_quest_difficulty CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD'))
);

-- =============================================
-- 建立索引以優化查詢效能
-- =============================================

-- 索引 1: code (唯一識別碼查詢)
CREATE INDEX IF NOT EXISTS idx_quests_code ON quests USING btree (code);

-- 索引 2: type (按類型篩選任務)
CREATE INDEX IF NOT EXISTS idx_quests_type ON quests USING btree (type);

-- 索引 3: category (按分類篩選任務)
CREATE INDEX IF NOT EXISTS idx_quests_category ON quests USING btree (category);

-- 索引 4: type + is_active (活躍任務查詢)
CREATE INDEX IF NOT EXISTS idx_quests_type_active ON quests USING btree (type, is_active) WHERE is_active = TRUE;

-- 索引 5: is_fixed (固定任務查詢)
CREATE INDEX IF NOT EXISTS idx_quests_fixed ON quests USING btree (is_fixed);

-- 索引 6: difficulty (難度篩選)
CREATE INDEX IF NOT EXISTS idx_quests_difficulty ON quests USING btree (difficulty);

-- 索引 7: objectives (JSONB GIN 索引，支援目標類型查詢)
CREATE INDEX IF NOT EXISTS idx_quests_objectives ON quests USING gin (objectives);

-- 索引 8: rewards (JSONB GIN 索引，支援獎勵查詢)
CREATE INDEX IF NOT EXISTS idx_quests_rewards ON quests USING gin (rewards);

-- =============================================
-- 種子資料：17 個任務定義
-- - 每日任務: 8 個 (1 固定 + 7 隨機池)
-- - 每週任務: 9 個 (1 固定 + 8 困難池)
-- =============================================

INSERT INTO quests (code, name_zh_tw, name_en, description, type, category, objectives, rewards, difficulty, is_fixed, is_active, display_order, created_at, updated_at) VALUES

  -- 每日任務（固定）
  ('daily_reading_1', '今日占卜', 'Daily Reading', '完成 1 次塔羅牌解讀', 'DAILY', 'READING', '{"type": "COMPLETE_READINGS", "target": 1, "filters": {}}', '{"karma_points": 10, "bonus_items": []}', 'EASY', TRUE, TRUE, 1, NOW(), NOW()),

  -- 每日任務（隨機池）
  ('daily_reading_3', '勤奮占卜師', 'Diligent Diviner', '完成 3 次塔羅牌解讀', 'DAILY', 'READING', '{"type": "COMPLETE_READINGS", "target": 3, "filters": {}}', '{"karma_points": 30, "bonus_items": []}', 'MEDIUM', FALSE, TRUE, 2, NOW(), NOW()),
  ('daily_celtic_cross', '凱爾特十字探索', 'Celtic Cross Explorer', '使用凱爾特十字牌陣完成 1 次解讀', 'DAILY', 'READING', '{"type": "COMPLETE_READINGS", "target": 1, "filters": {"spread_type": "celtic_cross"}}', '{"karma_points": 20, "bonus_items": []}', 'MEDIUM', FALSE, TRUE, 3, NOW(), NOW()),
  ('daily_new_card', '卡牌收集者', 'Card Collector', '收集 3 張不同的卡牌', 'DAILY', 'EXPLORATION', '{"type": "COLLECT_UNIQUE_CARDS", "target": 3, "filters": {}}', '{"karma_points": 15, "bonus_items": []}', 'EASY', FALSE, TRUE, 4, NOW(), NOW()),
  ('daily_bingo_checkin', '每日簽到', 'Daily Check-in', '完成 Bingo 每日簽到', 'DAILY', 'BINGO', '{"type": "BINGO_CHECKIN", "target": 1, "filters": {}}', '{"karma_points": 10, "bonus_items": []}', 'EASY', FALSE, TRUE, 5, NOW(), NOW()),
  ('daily_share_reading', '分享智慧', 'Share Wisdom', '分享 1 次解讀結果', 'DAILY', 'SOCIAL', '{"type": "SHARE_READING", "target": 1, "filters": {}}', '{"karma_points": 15, "bonus_items": []}', 'EASY', FALSE, TRUE, 6, NOW(), NOW()),
  ('daily_voice_reading', '聆聽命運', 'Listen to Fate', '使用語音解讀完成 1 次占卜', 'DAILY', 'READING', '{"type": "COMPLETE_READINGS", "target": 1, "filters": {"with_voice": true}}', '{"karma_points": 20, "bonus_items": []}', 'MEDIUM', FALSE, TRUE, 7, NOW(), NOW()),
  ('daily_morning_reading', '晨光占卜', 'Morning Divination', '在上午時段（6:00-12:00）完成 1 次解讀', 'DAILY', 'READING', '{"type": "COMPLETE_READINGS", "target": 1, "filters": {"time_range": "morning"}}', '{"karma_points": 15, "bonus_items": []}', 'EASY', FALSE, TRUE, 8, NOW(), NOW()),

  -- 每週任務（固定）
  ('weekly_reading_5', '每週修行', 'Weekly Practice', '本週完成 5 次塔羅牌解讀', 'WEEKLY', 'READING', '{"type": "COMPLETE_READINGS", "target": 5, "filters": {}}', '{"karma_points": 50, "bonus_items": []}', 'EASY', TRUE, TRUE, 101, NOW(), NOW()),

  -- 每週任務（困難池）
  ('weekly_reading_15', '占卜大師之路', 'Path to Master', '本週完成 15 次塔羅牌解讀', 'WEEKLY', 'READING', '{"type": "COMPLETE_READINGS", "target": 15, "filters": {}}', '{"karma_points": 150, "bonus_items": ["title_unlock"]}', 'HARD', FALSE, TRUE, 102, NOW(), NOW()),
  ('weekly_bingo_streak_3', '連續簽到獎勵', 'Check-in Streak', '連續簽到 3 天', 'WEEKLY', 'BINGO', '{"type": "BINGO_STREAK", "target": 3, "filters": {}}', '{"karma_points": 30, "bonus_items": []}', 'MEDIUM', FALSE, TRUE, 103, NOW(), NOW()),
  ('weekly_bingo_line', '賓果連線', 'Bingo Line', '達成 1 條 Bingo 連線', 'WEEKLY', 'BINGO', '{"type": "BINGO_LINE", "target": 1, "filters": {}}', '{"karma_points": 100, "bonus_items": []}', 'HARD', FALSE, TRUE, 104, NOW(), NOW()),
  ('weekly_social_3', '社交達人', 'Social Butterfly', '完成 3 次社交互動（分享、評論、點讚）', 'WEEKLY', 'SOCIAL', '{"type": "SOCIAL_INTERACTIONS", "target": 3, "filters": {}}', '{"karma_points": 40, "bonus_items": []}', 'MEDIUM', FALSE, TRUE, 105, NOW(), NOW()),
  ('weekly_collect_20', '卡牌收藏家', 'Card Collector Master', '本週收集 20 張不同的卡牌', 'WEEKLY', 'EXPLORATION', '{"type": "COLLECT_UNIQUE_CARDS", "target": 20, "filters": {}}', '{"karma_points": 80, "bonus_items": []}', 'HARD', FALSE, TRUE, 106, NOW(), NOW()),
  ('weekly_all_spreads', '牌陣探索者', 'Spread Explorer', '使用 3 種不同的牌陣各完成 1 次解讀', 'WEEKLY', 'EXPLORATION', '{"type": "USE_DIFFERENT_SPREADS", "target": 3, "filters": {}}', '{"karma_points": 60, "bonus_items": []}', 'MEDIUM', FALSE, TRUE, 107, NOW(), NOW()),
  ('weekly_major_arcana', '大阿爾克那精通', 'Major Arcana Mastery', '解讀結果包含 5 張不同的大阿爾克那', 'WEEKLY', 'EXPLORATION', '{"type": "DRAW_MAJOR_ARCANA", "target": 5, "filters": {"unique": true}}', '{"karma_points": 70, "bonus_items": []}', 'HARD', FALSE, TRUE, 108, NOW(), NOW()),
  ('weekly_perfect_reading', '完美占卜', 'Perfect Reading', '完成 1 次使用所有功能的完整解讀（語音+AI增強+分享）', 'WEEKLY', 'READING', '{"type": "COMPLETE_PERFECT_READING", "target": 1, "filters": {"with_voice": true, "with_ai": true, "shared": true}}', '{"karma_points": 100, "bonus_items": ["achievement_unlock"]}', 'HARD', FALSE, TRUE, 109, NOW(), NOW());

-- =============================================
-- 建立觸發函數: 自動更新 updated_at 欄位
-- =============================================

CREATE OR REPLACE FUNCTION update_quests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 套用觸發器至 quests 表
-- =============================================

CREATE TRIGGER trigger_update_quests_updated_at
BEFORE UPDATE ON quests
FOR EACH ROW
EXECUTE FUNCTION update_quests_updated_at();

-- =============================================
-- 驗證資料
-- =============================================

DO $$
DECLARE
  quest_count INTEGER;
  daily_count INTEGER;
  weekly_count INTEGER;
  fixed_count INTEGER;
  active_count INTEGER;
BEGIN
  -- 統計任務數量
  SELECT COUNT(*) INTO quest_count FROM quests;
  SELECT COUNT(*) INTO daily_count FROM quests WHERE type = 'DAILY';
  SELECT COUNT(*) INTO weekly_count FROM quests WHERE type = 'WEEKLY';
  SELECT COUNT(*) INTO fixed_count FROM quests WHERE is_fixed = TRUE;
  SELECT COUNT(*) INTO active_count FROM quests WHERE is_active = TRUE;

  -- 驗證任務數量
  IF quest_count < 10 THEN
    RAISE EXCEPTION 'Quest seed data incomplete. Expected at least 10 quests, found %', quest_count;
  END IF;

  IF daily_count < 5 THEN
    RAISE EXCEPTION 'Daily quests insufficient. Expected at least 5, found %', daily_count;
  END IF;

  IF weekly_count < 5 THEN
    RAISE EXCEPTION 'Weekly quests insufficient. Expected at least 5, found %', weekly_count;
  END IF;

  IF fixed_count < 2 THEN
    RAISE WARNING 'Fixed quests count is low. Expected at least 2 (1 daily + 1 weekly), found %', fixed_count;
  END IF;

  -- 輸出統計結果
  RAISE NOTICE 'Migration 20251103000002_create_quests completed successfully.';
  RAISE NOTICE '  Total quests: %', quest_count;
  RAISE NOTICE '  Daily quests: % (Fixed: %, Random pool: %)', 
    daily_count, 
    (SELECT COUNT(*) FROM quests WHERE type = 'DAILY' AND is_fixed = TRUE),
    (SELECT COUNT(*) FROM quests WHERE type = 'DAILY' AND is_fixed = FALSE);
  RAISE NOTICE '  Weekly quests: % (Fixed: %, Random pool: %)', 
    weekly_count,
    (SELECT COUNT(*) FROM quests WHERE type = 'WEEKLY' AND is_fixed = TRUE),
    (SELECT COUNT(*) FROM quests WHERE type = 'WEEKLY' AND is_fixed = FALSE);
  RAISE NOTICE '  Active quests: %', active_count;
END;
$$;
