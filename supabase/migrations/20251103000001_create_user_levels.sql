-- =============================================
-- Migration: 建立 user_levels 資料表
-- Description: 等級系統資料表，定義 1-100 等級的 karma 需求、稱號與特權
-- Requirements: unified-karma-system/Requirement 3
-- Task: 1.2
-- =============================================

-- 建立 user_levels 資料表
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INTEGER NOT NULL UNIQUE,                             -- 等級 (1-100)
  required_karma INTEGER NOT NULL,                           -- 達到此等級所需的 total_karma
  title_zh_tw VARCHAR(100) NOT NULL,                         -- 繁體中文稱號
  title_en VARCHAR(100) NOT NULL,                            -- 英文稱號（保留未來使用）
  icon_name VARCHAR(50) NOT NULL,                            -- PixelIcon 圖示名稱
  privileges JSONB NOT NULL DEFAULT '{}',                    -- 特權內容 (reading_limit, unlocked_spreads, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- 約束條件
  CONSTRAINT check_level_range CHECK (level >= 1 AND level <= 100),
  CONSTRAINT check_required_karma_positive CHECK (required_karma >= 0)
);

-- =============================================
-- 建立索引以優化查詢效能
-- =============================================

-- 索引 1: level (主要查詢欄位，已經是 UNIQUE，不需額外索引)
CREATE INDEX IF NOT EXISTS idx_user_levels_required_karma ON user_levels USING btree (required_karma);

-- 索引 2: privileges (JSONB GIN 索引，支援特權篩選)
CREATE INDEX IF NOT EXISTS idx_user_levels_privileges ON user_levels USING gin (privileges);

-- =============================================
-- 種子資料：100 個等級定義
-- 公式：required_karma = FLOOR(100 * (level ^ 1.5))
-- 稱號主題：Fallout 廢土世界觀
-- =============================================

INSERT INTO user_levels (level, required_karma, title_zh_tw, title_en, icon_name, privileges) VALUES
  -- Level 1-10: 新手區 (Vault Dweller)
  (1, 0, '避難所居民', 'Vault Dweller', 'home', '{"reading_limit": 3, "unlocked_spreads": ["single_card"], "features": []}'),
  (2, 282, '避難所探索者', 'Vault Explorer', 'compass', '{"reading_limit": 5, "unlocked_spreads": ["single_card", "three_card"], "features": []}'),
  (3, 519, '廢土新人', 'Wasteland Novice', 'map', '{"reading_limit": 5, "unlocked_spreads": ["single_card", "three_card"], "features": []}'),
  (4, 800, '輻射浪人', 'Radiation Wanderer', 'footprints', '{"reading_limit": 7, "unlocked_spreads": ["single_card", "three_card"], "features": ["daily_quest"]}'),
  (5, 1118, '拾荒者', 'Scavenger', 'box', '{"reading_limit": 7, "unlocked_spreads": ["single_card", "three_card", "celtic_cross"], "features": ["daily_quest"]}'),
  (6, 1469, '倖存者', 'Survivor', 'shield', '{"reading_limit": 10, "unlocked_spreads": ["single_card", "three_card", "celtic_cross"], "features": ["daily_quest"]}'),
  (7, 1852, '廢土行者', 'Wasteland Walker', 'navigation', '{"reading_limit": 10, "unlocked_spreads": ["single_card", "three_card", "celtic_cross"], "features": ["daily_quest", "weekly_quest"]}'),
  (8, 2262, '商隊護衛', 'Caravan Guard', 'truck', '{"reading_limit": 12, "unlocked_spreads": ["single_card", "three_card", "celtic_cross"], "features": ["daily_quest", "weekly_quest"]}'),
  (9, 2700, '賞金獵人', 'Bounty Hunter', 'target', '{"reading_limit": 12, "unlocked_spreads": ["single_card", "three_card", "celtic_cross"], "features": ["daily_quest", "weekly_quest"]}'),
  (10, 3162, '流浪傭兵', 'Wandering Mercenary', 'sword', '{"reading_limit": 15, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe"], "features": ["daily_quest", "weekly_quest", "voice_female"]}'),

  -- Level 11-20: 進階探索者 (Wasteland Veteran)
  (11, 3648, '廢土老兵', 'Wasteland Veteran', 'medal', '{"reading_limit": 15, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe"], "features": ["daily_quest", "weekly_quest", "voice_female"]}'),
  (12, 4156, '聚落守護者', 'Settlement Protector', 'users', '{"reading_limit": 18, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male"]}'),
  (13, 4687, '神秘占卜師', 'Mystic Diviner', 'sparkles', '{"reading_limit": 18, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male"]}'),
  (14, 5238, '電台主持人', 'Radio Host', 'radio', '{"reading_limit": 20, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male"]}'),
  (15, 5809, '技術專家', 'Tech Specialist', 'cpu', '{"reading_limit": 20, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male"]}'),
  (16, 6400, '醫療員', 'Medic', 'heart-pulse', '{"reading_limit": 22, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male"]}'),
  (17, 7009, '鋼鐵兄弟會新兵', 'Brotherhood Initiate', 'badge', '{"reading_limit": 22, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral"]}'),
  (18, 7636, '鋼鐵兄弟會騎士', 'Brotherhood Knight', 'crown', '{"reading_limit": 25, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral"]}'),
  (19, 8281, 'NCR 軍官', 'NCR Officer', 'flag', '{"reading_limit": 25, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral"]}'),
  (20, 8944, '凱撒軍團百夫長', 'Legion Centurion', 'spear', '{"reading_limit": 30, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral"]}'),

  -- Level 21-30: 陣營精英 (Faction Elite)
  (21, 9623, '聚落領袖', 'Settlement Leader', 'building', '{"reading_limit": 30, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading"]}'),
  (22, 10318, '鐵路組織特工', 'Railroad Agent', 'incognito', '{"reading_limit": 32, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading"]}'),
  (23, 11030, '義勇軍將軍', 'Minutemen General', 'trophy', '{"reading_limit": 32, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading"]}'),
  (24, 11757, '學院研究員', 'Institute Scientist', 'microscope', '{"reading_limit": 35, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading"]}'),
  (25, 12500, '英克雷軍官', 'Enclave Officer', 'lock', '{"reading_limit": 35, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading"]}'),
  (26, 13257, '掠奪者頭目', 'Raider Boss', 'skull', '{"reading_limit": 38, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading"]}'),
  (27, 14029, '神祕陌生人', 'Mysterious Stranger', 'ghost', '{"reading_limit": 38, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading"]}'),
  (28, 14816, '傳奇槍手', 'Legendary Gunslinger', 'crosshair', '{"reading_limit": 40, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading"]}'),
  (29, 15616, '輻射教主', 'Atom Priest', 'flame', '{"reading_limit": 40, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading"]}'),
  (30, 16431, '廢土先知', 'Wasteland Prophet', 'eye', '{"reading_limit": 45, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread"]}'),

  -- Level 31-40: 傳說人物 (Legendary Figure)
  (31, 17260, '監督者', 'Overseer', 'user-cog', '{"reading_limit": 45, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread"]}'),
  (32, 18101, '長老會議員', 'Elder Councilor', 'users-cog', '{"reading_limit": 50, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread"]}'),
  (33, 18957, '鋼鐵兄弟會長老', 'Brotherhood Elder', 'shield-star', '{"reading_limit": 50, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread"]}'),
  (34, 19825, '共和國總統', 'NCR President', 'landmark', '{"reading_limit": 55, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread"]}'),
  (35, 20706, '凱撒', 'Caesar', 'laurel', '{"reading_limit": 55, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma", "grand_tableau"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread", "priority_support"]}'),
  (36, 21600, '學院理事', 'Institute Director', 'brain', '{"reading_limit": 60, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma", "grand_tableau"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread", "priority_support"]}'),
  (37, 22506, '大師級占卜師', 'Master Diviner', 'crystal-ball', '{"reading_limit": 60, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma", "grand_tableau"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread", "priority_support"]}'),
  (38, 23424, '廢土傳奇', 'Wasteland Legend', 'star', '{"reading_limit": 65, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma", "grand_tableau"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread", "priority_support"]}'),
  (39, 24355, '啟示錄見證者', 'Apocalypse Witness', 'rocket', '{"reading_limit": 65, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma", "grand_tableau"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread", "priority_support"]}'),
  (40, 25298, '避難所科技首席', 'Vault-Tec CEO', 'briefcase', '{"reading_limit": 70, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma", "grand_tableau", "time_spiral"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread", "priority_support", "badge_legendary"]}'),

  -- Level 41-50: 神話級 (Mythical)
  (41, 26252, '時空守護者', 'Chrono Guardian', 'clock', '{"reading_limit": 75, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma", "grand_tableau", "time_spiral"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread", "priority_support", "badge_legendary"]}'),
  (42, 27219, '廢土救世主', 'Wasteland Messiah', 'cross', '{"reading_limit": 80, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma", "grand_tableau", "time_spiral"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread", "priority_support", "badge_legendary"]}'),
  (43, 28196, '量子預言家', 'Quantum Oracle', 'atom', '{"reading_limit": 85, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma", "grand_tableau", "time_spiral"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread", "priority_support", "badge_legendary", "unlimited_ai_quota"]}'),
  (44, 29186, '輻射之主', 'Master of Radiation', 'radiation', '{"reading_limit": 90, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma", "grand_tableau", "time_spiral"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread", "priority_support", "badge_legendary", "unlimited_ai_quota"]}'),
  (45, 30186, '維度行者', 'Dimension Walker', 'portal', '{"reading_limit": 95, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma", "grand_tableau", "time_spiral"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread", "priority_support", "badge_legendary", "unlimited_ai_quota"]}'),
  (46, 31198, '永恆守望者', 'Eternal Watcher', 'infinity', '{"reading_limit": 100, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma", "grand_tableau", "time_spiral"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread", "priority_support", "badge_legendary", "unlimited_ai_quota"]}'),
  (47, 32221, '命運編織者', 'Fate Weaver', 'web', '{"reading_limit": 105, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma", "grand_tableau", "time_spiral"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread", "priority_support", "badge_legendary", "unlimited_ai_quota", "exclusive_events"]}'),
  (48, 33255, '宇宙意識', 'Cosmic Consciousness', 'galaxy', '{"reading_limit": 110, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma", "grand_tableau", "time_spiral"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread", "priority_support", "badge_legendary", "unlimited_ai_quota", "exclusive_events"]}'),
  (49, 34300, '超維度存在', 'Hyperdimensional Being', 'layers', '{"reading_limit": 115, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma", "grand_tableau", "time_spiral"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread", "priority_support", "badge_legendary", "unlimited_ai_quota", "exclusive_events"]}'),
  (50, 35355, '終極真理', 'Ultimate Truth', 'diamond', '{"reading_limit": 120, "unlocked_spreads": ["single_card", "three_card", "celtic_cross", "horseshoe", "tree_of_life", "relationship", "zodiac", "karma", "grand_tableau", "time_spiral"], "features": ["daily_quest", "weekly_quest", "voice_female", "voice_male", "voice_neutral", "share_reading", "ai_enhanced_reading", "custom_spread", "priority_support", "badge_legendary", "unlimited_ai_quota", "exclusive_events"]}'),

  -- Level 51-60: 超越者 (Transcendent)
  (51, 36421, '真理追尋者', 'Truth Seeker', 'search', '{"reading_limit": 250, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (52, 37497, '靈魂工程師', 'Soul Engineer', 'wrench', '{"reading_limit": 300, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (53, 38584, '時間掌控者', 'Time Master', 'hourglass', '{"reading_limit": 350, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (54, 39681, '空間編織者', 'Space Weaver', 'grid', '{"reading_limit": 400, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (55, 40789, '因果洞察者', 'Causality Observer', 'git-branch', '{"reading_limit": 450, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (56, 41906, '概率操控者', 'Probability Manipulator', 'dice', '{"reading_limit": 500, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (57, 43034, '命運主宰', 'Destiny Master', 'crown-king', '{"reading_limit": 550, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (58, 44171, '宇宙建築師', 'Universe Architect', 'blueprint', '{"reading_limit": 600, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (59, 45318, '現實塑造者', 'Reality Shaper', 'magic-wand', '{"reading_limit": 650, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (60, 46475, '絕對存在', 'Absolute Existence', 'eclipse', '{"reading_limit": 700, "unlocked_spreads": ["all"], "features": ["all_features"]}'),

  -- Level 61-70: 至高者 (Supreme)
  (61, 47642, '超越輪迴', 'Beyond Samsara', 'rotate', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (62, 48818, '涅槃覺者', 'Enlightened One', 'lotus', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (63, 50004, '萬物之源', 'Source of All', 'fountain', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (64, 51200, '無限可能', 'Infinite Possibility', 'sparkles-2', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (65, 52404, '永恆之光', 'Eternal Light', 'sun', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (66, 53618, '黑暗之主', 'Lord of Darkness', 'moon', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (67, 54841, '混沌原初', 'Primordial Chaos', 'tornado', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (68, 56074, '秩序化身', 'Order Incarnate', 'scale', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (69, 57315, '創世紀元', 'Genesis Era', 'sunrise', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (70, 58566, '終焉審判', 'Final Judgment', 'gavel', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),

  -- Level 71-80: 神話 (Mythical Gods)
  (71, 59825, '泰坦巨神', 'Titan God', 'mountain', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (72, 61094, '普羅米修斯', 'Prometheus', 'fire', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (73, 62371, '宙斯', 'Zeus', 'lightning', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (74, 63657, '奧丁', 'Odin', 'raven', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (75, 64951, '拉', 'Ra', 'sun-2', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (76, 66255, '梵天', 'Brahma', 'feather', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (77, 67567, '阿努比斯', 'Anubis', 'dog', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (78, 68887, '墨丘利', 'Mercury', 'wings', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (79, 70216, '雅典娜', 'Athena', 'owl', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (80, 71554, '托特', 'Thoth', 'book-open', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),

  -- Level 81-90: 至尊 (Supreme Divine)
  (81, 72900, '阿卡夏記錄守護者', 'Akashic Guardian', 'library', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (82, 74254, '梅塔特隆', 'Metatron', 'hexagon', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (83, 75616, '麥基洗德', 'Melchizedek', 'chalice', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (84, 76987, '聖哲曼', 'Saint Germain', 'violet', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (85, 78366, '昴宿星使者', 'Pleiadian Emissary', 'stars', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (86, 79753, '天狼星守護', 'Sirian Guardian', 'dog-star', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (87, 81148, '大角星導師', 'Arcturian Master', 'teacher', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (88, 82551, '仙女座長老', 'Andromedan Elder', 'woman', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (89, 83962, '獵戶座議會', 'Orion Council', 'council', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (90, 85381, '銀河聯邦', 'Galactic Federation', 'planet-ring', '{"reading_limit": 999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),

  -- Level 91-100: 終極存在 (Ultimate Existence)
  (91, 86808, '維度議會主席', 'Dimensional Council Chair', 'throne', '{"reading_limit": 9999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (92, 88243, '宇宙法則執行者', 'Universal Law Enforcer', 'scales-balance', '{"reading_limit": 9999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (93, 89685, '多重宇宙旅者', 'Multiverse Traveler', 'portal-2', '{"reading_limit": 9999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (94, 91136, '量子意識核心', 'Quantum Consciousness Core', 'cpu-chip', '{"reading_limit": 9999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (95, 92594, '源代碼編寫者', 'Source Code Author', 'code', '{"reading_limit": 9999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (96, 94060, '存在之根基', 'Foundation of Existence', 'anchor', '{"reading_limit": 9999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (97, 95533, '終極答案', 'Ultimate Answer', 'info-circle', '{"reading_limit": 9999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (98, 97015, '無名之名', 'Nameless Name', 'question-mark', '{"reading_limit": 9999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (99, 98503, '唯一真實', 'The One Truth', 'shield-check', '{"reading_limit": 9999, "unlocked_spreads": ["all"], "features": ["all_features"]}'),
  (100, 100000, '廢土塔羅之神', 'God of Wasteland Tarot', 'zap', '{"reading_limit": 99999, "unlocked_spreads": ["all"], "features": ["all_features", "divine_privileges"]}');

-- =============================================
-- 建立觸發函數: 自動更新 updated_at 欄位
-- =============================================

CREATE OR REPLACE FUNCTION update_user_levels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 套用觸發器至 user_levels 表
-- =============================================

CREATE TRIGGER trigger_update_user_levels_updated_at
BEFORE UPDATE ON user_levels
FOR EACH ROW
EXECUTE FUNCTION update_user_levels_updated_at();

-- =============================================
-- 驗證資料
-- =============================================

DO $$
DECLARE
  level_count INTEGER;
  min_level INTEGER;
  max_level INTEGER;
  karma_check BOOLEAN;
BEGIN
  -- 檢查等級數量
  SELECT COUNT(*), MIN(level), MAX(level) 
  INTO level_count, min_level, max_level 
  FROM user_levels;

  IF level_count <> 100 THEN
    RAISE EXCEPTION 'Level seed data incomplete. Expected 100 levels, found %', level_count;
  END IF;

  IF min_level <> 1 OR max_level <> 100 THEN
    RAISE EXCEPTION 'Level range incorrect. Expected 1-100, found %-% ', min_level, max_level;
  END IF;

  -- 檢查 required_karma 是否遞增
  SELECT COUNT(*) = 0 INTO karma_check
  FROM (
    SELECT level, required_karma,
           LAG(required_karma) OVER (ORDER BY level) AS prev_karma
    FROM user_levels
  ) t
  WHERE prev_karma IS NOT NULL AND required_karma <= prev_karma;

  IF NOT karma_check THEN
    RAISE EXCEPTION 'Required karma is not strictly increasing';
  END IF;

  RAISE NOTICE 'Migration 20251103000001_create_user_levels completed successfully. % levels created (%-%).', level_count, min_level, max_level;
END;
$$;
