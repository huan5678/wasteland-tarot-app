-- 添加缺少的角色解讀欄位
-- 2025-11-05: 擴展角色解讀系統

-- 1. 兄弟會聖騎士
ALTER TABLE wasteland_cards 
ADD COLUMN IF NOT EXISTS brotherhood_paladin_combat_wisdom TEXT;

COMMENT ON COLUMN wasteland_cards.brotherhood_paladin_combat_wisdom IS 
'兄弟會聖騎士的戰鬥智慧 - 強調紀律、榮譽和戰術';

-- 2. NCR 遊騎兵
ALTER TABLE wasteland_cards 
ADD COLUMN IF NOT EXISTS ncr_ranger_tactical_analysis TEXT;

COMMENT ON COLUMN wasteland_cards.ncr_ranger_tactical_analysis IS 
'NCR 遊騎兵的戰術分析 - 強調民主、法治和策略';

-- 3. 軍團百夫長
ALTER TABLE wasteland_cards 
ADD COLUMN IF NOT EXISTS legion_centurion_command TEXT;

COMMENT ON COLUMN wasteland_cards.legion_centurion_command IS 
'軍團百夫長的指揮 - 強調服從、力量和榮耀';

-- 4. 民兵
ALTER TABLE wasteland_cards 
ADD COLUMN IF NOT EXISTS minuteman_hope_message TEXT;

COMMENT ON COLUMN wasteland_cards.minuteman_hope_message IS 
'民兵的希望訊息 - 強調人民、自由和希望';

-- 5. 鐵路特工
ALTER TABLE wasteland_cards 
ADD COLUMN IF NOT EXISTS railroad_agent_liberation_view TEXT;

COMMENT ON COLUMN wasteland_cards.railroad_agent_liberation_view IS 
'鐵路特工的解放觀點 - 強調自由、秘密和解放';

-- 6. 學院科學家
ALTER TABLE wasteland_cards 
ADD COLUMN IF NOT EXISTS institute_scientist_research_notes TEXT;

COMMENT ON COLUMN wasteland_cards.institute_scientist_research_notes IS 
'學院科學家的研究筆記 - 強調科學、理性和進步';

-- 創建索引以加快查詢（可選）
-- CREATE INDEX IF NOT EXISTS idx_cards_has_paladin ON wasteland_cards((brotherhood_paladin_combat_wisdom IS NOT NULL));
-- CREATE INDEX IF NOT EXISTS idx_cards_has_ncr ON wasteland_cards((ncr_ranger_tactical_analysis IS NOT NULL));
-- CREATE INDEX IF NOT EXISTS idx_cards_has_legion ON wasteland_cards((legion_centurion_command IS NOT NULL));
-- CREATE INDEX IF NOT EXISTS idx_cards_has_minuteman ON wasteland_cards((minuteman_hope_message IS NOT NULL));
-- CREATE INDEX IF NOT EXISTS idx_cards_has_railroad ON wasteland_cards((railroad_agent_liberation_view IS NOT NULL));
-- CREATE INDEX IF NOT EXISTS idx_cards_has_institute ON wasteland_cards((institute_scientist_research_notes IS NOT NULL));

-- 驗證
SELECT 
    COUNT(*) as total_cards,
    COUNT(brotherhood_paladin_combat_wisdom) as has_paladin,
    COUNT(ncr_ranger_tactical_analysis) as has_ncr,
    COUNT(legion_centurion_command) as has_legion,
    COUNT(minuteman_hope_message) as has_minuteman,
    COUNT(railroad_agent_liberation_view) as has_railroad,
    COUNT(institute_scientist_research_notes) as has_institute
FROM wasteland_cards;
