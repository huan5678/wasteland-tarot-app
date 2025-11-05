-- 修復陣營-角色關係
-- 2025-11-05: 確保所有陣營都有對應角色

-- ============================================================================
-- 1. 處理重複陣營：合併到主陣營
-- ============================================================================

-- A. 將 caesars_legion 的關係移到 legion
INSERT INTO faction_characters (faction_id, character_id)
SELECT 
    (SELECT id FROM factions WHERE key = 'legion'),
    character_id
FROM faction_characters
WHERE faction_id = (SELECT id FROM factions WHERE key = 'caesars_legion')
ON CONFLICT DO NOTHING;

-- B. 將 brotherhood_of_steel 的關係移到 brotherhood  
INSERT INTO faction_characters (faction_id, character_id)
SELECT 
    (SELECT id FROM factions WHERE key = 'brotherhood'),
    character_id
FROM faction_characters
WHERE faction_id = (SELECT id FROM factions WHERE key = 'brotherhood_of_steel')
ON CONFLICT DO NOTHING;

-- C. 將重複陣營標記為非活躍（不刪除，保留歷史資料）
UPDATE factions 
SET is_active = false 
WHERE key IN ('caesars_legion', 'brotherhood_of_steel');

-- ============================================================================
-- 2. 為空陣營添加角色
-- ============================================================================

-- A. Enclave 避世者 - 科技派系，類似兄弟會但更精英
--    添加: Pip-Boy, Codsworth, Brotherhood Scribe
INSERT INTO faction_characters (faction_id, character_id)
SELECT 
    (SELECT id FROM factions WHERE key = 'enclave'),
    id
FROM characters
WHERE key IN ('pip_boy', 'codsworth', 'brotherhood_scribe')
  AND is_active = true
ON CONFLICT DO NOTHING;

-- B. Vault-Tec 科技公司 - 企業派系，科技與商業
--    添加: Pip-Boy, Vault Dweller, Codsworth, Wasteland Trader
INSERT INTO faction_characters (faction_id, character_id)
SELECT 
    (SELECT id FROM factions WHERE key = 'vault-tec'),
    id
FROM characters
WHERE key IN ('pip_boy', 'vault_dweller', 'codsworth', 'wasteland_trader')
  AND is_active = true
ON CONFLICT DO NOTHING;

-- C. 原子之子 (Children of Atom) - 宗教狂熱派系
--    添加: Pip-Boy, Ghoul, Super Mutant
INSERT INTO faction_characters (faction_id, character_id)
SELECT 
    (SELECT id FROM factions WHERE key = 'children_of_atom'),
    id
FROM characters
WHERE key IN ('pip_boy', 'ghoul', 'super_mutant')
  AND is_active = true
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. 驗證結果
-- ============================================================================

-- 顯示所有陣營的角色數量
SELECT 
    f.name as 陣營,
    f.key,
    f.is_active as 活躍,
    COUNT(fc.character_id) as 角色數量,
    STRING_AGG(c.name, ', ' ORDER BY c.name) as 角色列表
FROM factions f
LEFT JOIN faction_characters fc ON f.id = fc.faction_id
LEFT JOIN characters c ON fc.character_id = c.id AND c.is_active = true
GROUP BY f.id, f.name, f.key, f.is_active
ORDER BY f.is_active DESC, f.name;

-- 顯示統計
SELECT 
    COUNT(*) as 總陣營數,
    COUNT(*) FILTER (WHERE is_active = true) as 活躍陣營數,
    COUNT(*) FILTER (WHERE is_active = false) as 停用陣營數
FROM factions;

SELECT 
    COUNT(*) as 總角色數,
    COUNT(*) FILTER (WHERE is_active = true) as 活躍角色數
FROM characters;

-- 檢查是否還有空陣營
SELECT 
    f.name as 空陣營
FROM factions f
LEFT JOIN faction_characters fc ON f.id = fc.faction_id
WHERE fc.faction_id IS NULL AND f.is_active = true;
