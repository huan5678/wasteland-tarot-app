-- Seed Script Structure for 78 Wasteland Tarot Cards
-- This script creates the foundation for seeding all 78 cards
-- Created: 2025-01-29

-- Seed script preparation function
CREATE OR REPLACE FUNCTION seed_wasteland_card(
    p_id VARCHAR(100),
    p_name VARCHAR(200),
    p_suit VARCHAR(50),
    p_card_number INTEGER,
    p_upright_meaning TEXT,
    p_reversed_meaning TEXT,
    p_description TEXT DEFAULT NULL,
    p_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    p_image_url VARCHAR(500) DEFAULT '/cards/placeholder.png',
    p_radiation_factor DECIMAL(3,2) DEFAULT 0.1,
    p_karma_alignment VARCHAR(20) DEFAULT 'NEUTRAL',
    p_fallout_reference TEXT DEFAULT NULL,
    p_symbolism TEXT DEFAULT NULL,
    p_element VARCHAR(50) DEFAULT NULL,
    p_astrological_association TEXT DEFAULT NULL,
    p_pip_boy TEXT DEFAULT NULL,
    p_super_mutant TEXT DEFAULT NULL,
    p_ghoul TEXT DEFAULT NULL,
    p_raider TEXT DEFAULT NULL,
    p_brotherhood_scribe TEXT DEFAULT NULL,
    p_vault_dweller TEXT DEFAULT NULL,
    p_codsworth TEXT DEFAULT NULL,
    p_rarity VARCHAR(20) DEFAULT 'common'
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.wasteland_cards (
        id, name, suit, card_number, number,
        upright_meaning, reversed_meaning, description,
        keywords, image_url,
        radiation_factor, karma_alignment,
        fallout_reference, symbolism, element, astrological_association,
        pip_boy_interpretation, super_mutant_interpretation,
        ghoul_interpretation, raider_interpretation,
        brotherhood_scribe_interpretation, vault_dweller_interpretation,
        codsworth_interpretation,
        character_voice_interpretations,
        rarity_level, is_active
    ) VALUES (
        p_id, p_name, p_suit, p_card_number, p_card_number,
        p_upright_meaning, p_reversed_meaning, p_description,
        p_keywords, p_image_url,
        p_radiation_factor, p_karma_alignment,
        p_fallout_reference, p_symbolism, p_element, p_astrological_association,
        p_pip_boy, p_super_mutant, p_ghoul, p_raider,
        p_brotherhood_scribe, p_vault_dweller, p_codsworth,
        jsonb_build_object(
            'PIP_BOY', COALESCE(p_pip_boy, ''),
            'SUPER_MUTANT', COALESCE(p_super_mutant, ''),
            'GHOUL', COALESCE(p_ghoul, ''),
            'RAIDER', COALESCE(p_raider, ''),
            'BROTHERHOOD_SCRIBE', COALESCE(p_brotherhood_scribe, ''),
            'VAULT_DWELLER', COALESCE(p_vault_dweller, ''),
            'CODSWORTH', COALESCE(p_codsworth, '')
        ),
        p_rarity, true
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        upright_meaning = EXCLUDED.upright_meaning,
        reversed_meaning = EXCLUDED.reversed_meaning,
        description = COALESCE(EXCLUDED.description, wasteland_cards.description),
        keywords = CASE
            WHEN array_length(EXCLUDED.keywords, 1) > 0 THEN EXCLUDED.keywords
            ELSE wasteland_cards.keywords
        END,
        radiation_factor = EXCLUDED.radiation_factor,
        karma_alignment = EXCLUDED.karma_alignment,
        fallout_reference = COALESCE(EXCLUDED.fallout_reference, wasteland_cards.fallout_reference),
        updated_at = NOW();

    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error inserting card %: %', p_id, SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Seed the 6 example cards from enhancedCards.ts
SELECT seed_wasteland_card(
    '0',
    '廢土流浪者',
    '大阿爾克那',
    0,
    '新的開始、純真、潛力、在廢土中的全新起點',
    '魯莽、天真、判斷力差、對廢土毫無準備',
    '一個剛從地下避難所走出，面對嚴酷廢土的身影。',
    ARRAY['新開始', '冒險', '純真', '潛力', '勇氣'],
    '/cards/vault-dweller.png',
    0.1,
    'NEUTRAL',
    '代表離開111號避難所的玩家角色',
    '流浪者手持簡陋的裝備，眼神充滿希望地望向未知的廢土。背景是破損的避難所門，象徵著離開安全但封閉的環境，踏入充滿可能性但危險的新世界。',
    '精神',
    '天王星 - 突破與革新',
    '檢測到新冒險！你的旅程現在開始，使用者。',
    '小人類離開金屬洞穴。廢土會教小人類艱難的課程。',
    '又一個新鮮肉體踏入陽光。希望你的運氣比理智多，光滑皮膚。',
    '又一個避難所老鼠爬出來。看看這個能撐多久。',
    '有趣。又一個避難所居民出現。記錄一切。',
    '主人，又一位冒險者踏上了廢土之路。我相信他們會找到自己的道路。',
    '先生，一位新的旅行者正準備面對這個勇敢的新世界。',
    'uncommon'
) as "廢土流浪者";

SELECT seed_wasteland_card(
    '1',
    '廢土魔法師',
    '大阿爾克那',
    1,
    '技能、意志力、創造、科技掌控、廢土求生能力',
    '操縱、欺騙、技能濫用、科技成癮',
    '一個掌握前戰爭科技的神秘人物，能夠操控廢土的力量。',
    ARRAY['技能', '創造', '科技', '掌控', '智慧'],
    '/cards/wasteland-magician.png',
    0.3,
    'NEUTRAL',
    '象徵著能夠修理和改造廢土科技的技術專家',
    '魔法師舉起一隻手握著核子電池，另一隻手操作著終端機。工作台上擺滿了各種廢土科技，象徵著知識與技能的力量。',
    '火',
    '水星 - 溝通與技術',
    '技術專精檢測。建議：運用你的技能和知識。',
    '聰明的小人類！會修理發光的盒子！',
    '又一個認為自己很聰明的修理工。至少他知道哪邊是核電池的正極。',
    '技術狂。這傢伙知道怎麼讓東西運作。值得留著。',
    '技術知識等級：專家。建議招募入兄弟會。',
    '哇，你真的很會修理東西！這些技能在廢土上非常寶貴。',
    '先生，您的技術能力確實令人印象深刻。知識就是力量。',
    'rare'
) as "廢土魔法師";

SELECT seed_wasteland_card(
    '2',
    '避難所監督',
    '大阿爾克那',
    4,
    '權威、結構、秩序、領導力、穩定',
    '專制、壓迫、權力濫用、反抗權威',
    '控制避難所的權威人物，代表秩序與控制。',
    ARRAY['權威', '秩序', '領導', '控制', '穩定'],
    '/cards/overseer.png',
    0.2,
    'NEUTRAL',
    '維持地下社會秩序的避難所監督',
    '監督坐在控制室中，周圍是監控屏幕和控制面板。代表著在混亂世界中維持秩序的必要性，但也警示著權力可能帶來的腐敗。',
    '土',
    '白羊座 - 領導與權威',
    '檢測到權威人物。建議遵守避難所規則。',
    '金屬洞穴的老大人類。所有小人類都聽老大的話。',
    '每個避難所都需要一個發號司令的大人物。',
    '階級制度的頭頭。尊重等級制度，不然就準備付出代價。',
    '階級領導結構。對避難所生存至關重要。',
    '監督真的很厲害！他們知道如何保護大家。',
    '先生，領導能力是維持文明的關鍵。秩序帶來安全。',
    'rare'
) as "避難所監督";

SELECT seed_wasteland_card(
    '3',
    '神秘商人',
    '大阿爾克那',
    2,
    '直覺、隱藏知識、神秘智慧、內在聲音',
    '缺乏方向、迷失、壓抑直覺、秘密被揭露',
    '廢土中神出鬼沒的商人，擁有稀有物品和古老智慧。',
    ARRAY['直覺', '神秘', '智慧', '秘密', '商業'],
    '/cards/mysterious-merchant.png',
    0.4,
    'NEUTRAL',
    '在廢土各地出現的神秘商人，總是有你需要的東西',
    '商人身穿破舊的斗篷，背包裡裝滿了奇異的物品。月亮在背景中照耀著，象徵著直覺和隱藏的知識。',
    '水',
    '月亮 - 直覺與神秘',
    '商人檢測。物品交換機會。建議：相信直覺進行交易。',
    '神秘的小商人！有好東西！小人類要用亮晶晶的換！',
    '老神秘總是在你最需要的時候出現。價格公道...大部分時候。',
    '這傢伙總是有好貨。不過別想著搶他，他比看起來危險。',
    '流動商人。擁有珍貴的前戰爭物品。建議建立貿易關係。',
    '這個商人好酷！他們總是有我想要的東西。',
    '先生，神秘的商人往往擁有最珍貴的寶物。直覺是最好的指引。',
    'legendary'
) as "神秘商人";

SELECT seed_wasteland_card(
    '4',
    '瓶蓋王牌',
    '小阿爾克那',
    1,
    '新的財務機會、物質開始、繁榮、貿易成功',
    '財務損失、貧困、資源缺乏、投資失敗',
    '後末日世界的通用貨幣，象徵著財富與機會。',
    ARRAY['財富', '機會', '貿易', '價值', '交換'],
    '/cards/bottle-cap.png',
    0.2,
    'NEUTRAL',
    '瓶蓋作為標準的戰後貨幣',
    '閃亮的瓶蓋堆疊在一起，背景是廢土集市。象徵著即使在末日後，人類仍然需要貿易和價值交換的媒介。',
    '土',
    '金星 - 價值與財富',
    '檢測到貨幣。價值：重要。可用交易機會。',
    '亮晶晶的金屬圓片！小人類喜歡亮晶晶的東西！',
    '全能的瓶蓋。讓世界轉動，即使在它停止旋轉之後。',
    '瓶蓋就是力量。更多瓶蓋，更多尊重，更多彈藥。',
    '有趣的戰後經濟適應。高效的以物易物系統。',
    '瓶蓋！這些在廢土上可是寶貝！',
    '先生，即使在末日後，價值交換仍是文明的基石。',
    'common'
) as "瓶蓋王牌";

SELECT seed_wasteland_card(
    '5',
    '輻射蟑螂',
    '小阿爾克那',
    2,
    '生存、適應性、堅持、韌性、克服困難',
    '害蟲、煩惱、小問題擴大、感染',
    '變異的蟑螂，象徵著生存能力和適應性。',
    ARRAY['生存', '適應', '堅韌', '克服', '演化'],
    '/cards/radroach.png',
    0.6,
    'NEUTRAL',
    '廢土中常見的變異生物',
    '巨大的蟑螂在廢墟中覓食，象徵著生命的頑強與適應能力。即使在最惡劣的環境中，生命依然能找到存活的方式。',
    '土',
    '天蝎座 - 轉化與重生',
    '檢測到變異昆蟲。威脅等級：極小。生存本能：最大。',
    '噁心的蟲子東西！很難壓扁！小人類怕蟲子！',
    '蟑螂比大多數生物都更能存活下來。必須尊重這一點。',
    '噁心的小雜種。但無論如何都能繼續活下去。',
    '卓越的輻射適應性。自然找到了持續存在的方式。',
    '這些蟑螂好噁心，但它們真的很能適應！',
    '先生，生存能力是最可貴的特質。適應是進化的關鍵。',
    'common'
) as "輻射蟑螂";

-- Create structure for the remaining 72 cards
-- This template can be used to seed all 78 cards systematically

-- Template for Major Arcana (大阿爾克那) - 22 cards total (6 already done, 16 remaining)
-- Template for Minor Arcana suits:
-- 權杖 (Wands/Rods) - 14 cards (Ace-10, Page, Knight, Queen, King)
-- 聖杯 (Cups) - 14 cards
-- 寶劍 (Swords) - 14 cards
-- 錢幣 (Pentacles/Coins) - 14 cards

-- Helper function to generate placeholder data for remaining cards
CREATE OR REPLACE FUNCTION generate_card_placeholders()
RETURNS VOID AS $$
DECLARE
    suits TEXT[] := ARRAY['權杖', '聖杯', '寶劍', '錢幣'];
    suit TEXT;
    i INTEGER;
    card_id VARCHAR;
    card_name VARCHAR;
BEGIN
    -- Generate Minor Arcana cards (placeholder structure)
    FOREACH suit IN ARRAY suits
    LOOP
        -- Generate Ace through 10
        FOR i IN 1..10 LOOP
            card_id := CASE
                WHEN suit = '權杖' THEN 'wand_' || i::text
                WHEN suit = '聖杯' THEN 'cup_' || i::text
                WHEN suit = '寶劍' THEN 'sword_' || i::text
                WHEN suit = '錢幣' THEN 'coin_' || i::text
            END;

            card_name := suit || CASE
                WHEN i = 1 THEN ' 王牌'
                ELSE ' ' || i::text
            END;

            -- Insert placeholder (will need to be filled with actual content later)
            PERFORM seed_wasteland_card(
                card_id,
                card_name,
                '小阿爾克那',
                i,
                '待補充：' || card_name || ' 正位含義',
                '待補充：' || card_name || ' 逆位含義',
                '待補充：' || card_name || ' 的詳細描述',
                ARRAY['待補充'],
                '/cards/placeholder.png',
                0.1 + (i * 0.05), -- Varying radiation levels
                'NEUTRAL',
                '待補充：' || card_name || ' 的廢土背景',
                '待補充：' || card_name || ' 的象徵意義',
                CASE suit
                    WHEN '權杖' THEN '火'
                    WHEN '聖杯' THEN '水'
                    WHEN '寶劍' THEN '風'
                    WHEN '錢幣' THEN '土'
                END,
                '待補充：占星關聯',
                '待補充：Pip-Boy 解讀',
                '待補充：超級變種人解讀',
                '待補充：屍鬼解讀',
                '待補充：掠奪者解讀',
                '待補充：兄弟會書記員解讀',
                '待補充：避難所居民解讀',
                '待補充：科茲沃斯解讀',
                'common'
            );
        END LOOP;

        -- Generate Court Cards (Page, Knight, Queen, King)
        DECLARE
            court_ranks TEXT[] := ARRAY['侍從', '騎士', '王后', '國王'];
            court_rank TEXT;
        BEGIN
            FOREACH court_rank IN ARRAY court_ranks
            LOOP
                card_id := CASE
                    WHEN suit = '權杖' THEN 'wand_' || lower(court_rank)
                    WHEN suit = '聖杯' THEN 'cup_' || lower(court_rank)
                    WHEN suit = '寶劍' THEN 'sword_' || lower(court_rank)
                    WHEN suit = '錢幣' THEN 'coin_' || lower(court_rank)
                END;

                card_name := suit || ' ' || court_rank;

                PERFORM seed_wasteland_card(
                    card_id,
                    card_name,
                    '小阿爾克那',
                    CASE court_rank
                        WHEN '侍從' THEN 11
                        WHEN '騎士' THEN 12
                        WHEN '王后' THEN 13
                        WHEN '國王' THEN 14
                    END,
                    '待補充：' || card_name || ' 正位含義',
                    '待補充：' || card_name || ' 逆位含義',
                    '待補充：' || card_name || ' 的詳細描述',
                    ARRAY['待補充', '人物牌', court_rank],
                    '/cards/placeholder.png',
                    0.3,
                    'NEUTRAL',
                    '待補充：' || card_name || ' 的廢土背景',
                    '待補充：' || card_name || ' 的象徵意義',
                    CASE suit
                        WHEN '權杖' THEN '火'
                        WHEN '聖杯' THEN '水'
                        WHEN '寶劍' THEN '風'
                        WHEN '錢幣' THEN '土'
                    END,
                    '待補充：占星關聯',
                    '待補充：Pip-Boy 解讀',
                    '待補充：超級變種人解讀',
                    '待補充：屍鬼解讀',
                    '待補充：掠奪者解讀',
                    '待補充：兄弟會書記員解讀',
                    '待補充：避難所居民解讀',
                    '待補充：科茲沃斯解讀',
                    CASE court_rank
                        WHEN '國王' THEN 'rare'
                        WHEN '王后' THEN 'rare'
                        ELSE 'uncommon'
                    END
                );
            END LOOP;
        END;
    END LOOP;

    RAISE NOTICE 'Generated placeholder structure for % cards', 56; -- 14 cards × 4 suits
END;
$$ LANGUAGE plpgsql;

-- Generate remaining Major Arcana placeholders (16 remaining cards)
SELECT seed_wasteland_card('major_' || i::text, '大阿爾克那 ' || i::text, '大阿爾克那', i,
    '待補充：大阿爾克那 ' || i::text || ' 正位含義',
    '待補充：大阿爾克那 ' || i::text || ' 逆位含義',
    '待補充：大阿爾克那 ' || i::text || ' 的詳細描述',
    ARRAY['待補充', '大阿爾克那'],
    '/cards/placeholder.png', 0.2, 'NEUTRAL',
    '待補充：大阿爾克那 ' || i::text || ' 的廢土背景',
    '待補充：象徵意義', '精神', '待補充：占星關聯',
    '待補充：Pip-Boy 解讀', '待補充：超級變種人解讀', '待補充：屍鬼解讀',
    '待補充：掠奪者解讀', '待補充：兄弟會書記員解讀', '待補充：避難所居民解讀',
    '待補充：科茲沃斯解讀', 'uncommon'
) as major_card
FROM generate_series(3, 21) as i  -- Skip 0, 1, 2, 4 as they're already done
WHERE i NOT IN (4); -- Skip 4 (already done as 避難所監督)

-- Execute the placeholder generation
-- SELECT generate_card_placeholders();

-- Create summary report
SELECT
    'Seed Structure Created' as status,
    COUNT(*) as total_seeded,
    COUNT(*) FILTER (WHERE is_complete = true) as complete_cards,
    COUNT(*) FILTER (WHERE description LIKE '待補充%' OR description IS NULL) as placeholder_cards
FROM public.wasteland_cards;

-- Final message
SELECT
    'Wasteland Cards Seed Structure Complete!' as result,
    '6 detailed cards seeded, framework ready for remaining 72 cards' as progress,
    'Use the seed_wasteland_card() function to add remaining cards' as next_steps;