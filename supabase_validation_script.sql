-- Supabase 廢土塔羅資料庫完整驗證腳本
-- 在 Supabase SQL 編輯器中執行此腳本

-- 基本資料統計
SELECT
    '🔍 基本資料統計' as section,
    COUNT(*) as total_cards,
    COUNT(DISTINCT suit) as unique_suits,
    COUNT(*) FILTER (WHERE suit = 'major_arcana') as major_arcana_count,
    COUNT(*) FILTER (WHERE suit = 'radiation_rods') as radiation_rods_count,
    COUNT(*) FILTER (WHERE suit = 'combat_weapons') as combat_weapons_count,
    COUNT(*) FILTER (WHERE suit = 'bottle_caps') as bottle_caps_count,
    COUNT(*) FILTER (WHERE suit LIKE '%nuka%' OR suit LIKE '%cola%') as nuka_cola_count,
    (78 - COUNT(*)) as missing_cards
FROM public.wasteland_cards;

-- 花色詳細分析
SELECT
    '📊 花色分布分析' as analysis,
    suit,
    COUNT(*) as card_count,
    CASE
        WHEN suit = 'major_arcana' THEN (22 - COUNT(*))
        WHEN suit IN ('radiation_rods', 'combat_weapons', 'bottle_caps') THEN (14 - COUNT(*))
        ELSE 0
    END as missing_count,
    CASE
        WHEN suit = 'major_arcana' AND COUNT(*) = 22 THEN '✅ 完整'
        WHEN suit IN ('radiation_rods', 'combat_weapons', 'bottle_caps') AND COUNT(*) = 14 THEN '✅ 完整'
        ELSE '⚠️ 不完整'
    END as status
FROM public.wasteland_cards
GROUP BY suit
ORDER BY suit;

-- 資料品質檢查
SELECT
    '🔧 資料品質檢查' as test,
    COUNT(*) as total_cards,
    COUNT(*) FILTER (WHERE upright_meaning IS NOT NULL AND LENGTH(upright_meaning) > 0) as has_upright_meaning,
    COUNT(*) FILTER (WHERE reversed_meaning IS NOT NULL AND LENGTH(reversed_meaning) > 0) as has_reversed_meaning,
    COUNT(*) FILTER (WHERE radiation_level IS NOT NULL) as has_radiation_level,
    COUNT(*) FILTER (WHERE radiation_level BETWEEN 0 AND 1) as valid_radiation_range,
    ROUND(AVG(radiation_level), 3) as avg_radiation_level
FROM public.wasteland_cards;

-- 檢查具體缺失的卡牌
SELECT
    '🔍 檢查缺失的大阿爾克那' as analysis,
    s.card_num as missing_number
FROM generate_series(0, 21) s(card_num)
WHERE NOT EXISTS (
    SELECT 1 FROM public.wasteland_cards
    WHERE suit = 'major_arcana' AND number = s.card_num
);

-- 檢查是否有重複ID
SELECT
    '⚠️ 重複ID檢查' as test,
    id,
    COUNT(*) as duplicate_count
FROM public.wasteland_cards
GROUP BY id
HAVING COUNT(*) > 1;

-- 最新更新記錄
SELECT
    '📅 最近更新' as info,
    name,
    suit,
    number,
    updated_at
FROM public.wasteland_cards
ORDER BY updated_at DESC
LIMIT 10;

-- 總結建議
SELECT
    '📝 總結建議' as summary,
    CASE
        WHEN (SELECT COUNT(*) FROM public.wasteland_cards) = 78
        THEN '✅ 資料庫完整：78張卡牌'
        ELSE '⚠️ 需要修正：缺少 ' || (78 - (SELECT COUNT(*) FROM public.wasteland_cards))::text || ' 張卡牌'
    END as database_status,
    CASE
        WHEN (SELECT COUNT(*) FROM public.wasteland_cards WHERE suit = 'major_arcana') = 22
        THEN '✅ 大阿爾克那完整'
        ELSE '⚠️ 大阿爾克那缺少 ' || (22 - (SELECT COUNT(*) FROM public.wasteland_cards WHERE suit = 'major_arcana'))::text || ' 張'
    END as major_arcana_status;