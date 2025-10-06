-- Comprehensive Database Validation Script
-- This script performs thorough validation of the 78-card Wasteland Tarot system
-- Created: 2025-01-29

-- Set up validation environment
\set ON_ERROR_STOP on

SELECT '🏗️ SUPABASE SCHEMA ARCHITECTURE - VALIDATION REPORT' as header;
SELECT '================================================================' as separator;

-- 1. SCHEMA ANALYSIS
SELECT '📊 SCHEMA ANALYSIS' as section;
SELECT '─────────────────────────────────────────────────────' as subsection;

-- Table structure validation
SELECT
    'Table Structure' as test,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'wasteland_cards'
        ) THEN '✅ PASS: wasteland_cards table exists'
        ELSE '❌ FAIL: wasteland_cards table missing'
    END as result;

-- Column completeness check
WITH expected_columns AS (
    SELECT unnest(ARRAY[
        'id', 'name', 'suit', 'card_number', 'number',
        'upright_meaning', 'reversed_meaning', 'description', 'keywords',
        'image_url', 'radiation_factor', 'karma_alignment',
        'fallout_reference', 'symbolism', 'element', 'astrological_association',
        'character_voice_interpretations',
        'pip_boy_interpretation', 'super_mutant_interpretation',
        'ghoul_interpretation', 'raider_interpretation',
        'brotherhood_scribe_interpretation', 'vault_dweller_interpretation',
        'codsworth_interpretation', 'rarity_level', 'is_complete',
        'is_active', 'created_at', 'updated_at'
    ]) as expected_column
),
actual_columns AS (
    SELECT column_name as actual_column
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wasteland_cards'
)
SELECT
    'Column Completeness' as test,
    (SELECT COUNT(*) FROM expected_columns) as expected_count,
    (SELECT COUNT(*) FROM actual_columns) as actual_count,
    CASE
        WHEN (SELECT COUNT(*) FROM expected_columns
              WHERE expected_column NOT IN (SELECT actual_column FROM actual_columns)) = 0
        THEN '✅ PASS: All required columns present'
        ELSE '❌ FAIL: Missing columns: ' || (
            SELECT string_agg(expected_column, ', ')
            FROM expected_columns
            WHERE expected_column NOT IN (SELECT actual_column FROM actual_columns)
        )
    END as result;

-- 2. DATA COMPLETENESS ANALYSIS
SELECT '📋 DATA COMPLETENESS ANALYSIS' as section;
SELECT '─────────────────────────────────────────────────────' as subsection;

-- Card distribution by suit
SELECT
    'Card Distribution by Suit' as analysis,
    suit,
    COUNT(*) as card_count,
    CASE
        WHEN suit = 'MAJOR_ARCANA' AND COUNT(*) = 22 THEN '✅ Complete (22/22)'
        WHEN suit = 'MAJOR_ARCANA' AND COUNT(*) < 22 THEN '⚠️  Missing ' || (22 - COUNT(*))::text || ' cards'
        WHEN suit IN ('RADIATION_RODS', 'COMBAT_WEAPONS', 'BOTTLE_CAPS', 'NUKA_COLA_BOTTLES')
             AND COUNT(*) = 14 THEN '✅ Complete (14/14)'
        WHEN suit IN ('RADIATION_RODS', 'COMBAT_WEAPONS', 'BOTTLE_CAPS', 'NUKA_COLA_BOTTLES')
             AND COUNT(*) < 14 THEN '⚠️  Missing ' || (14 - COUNT(*))::text || ' cards'
        ELSE '🔍 Review needed'
    END as status
FROM public.wasteland_cards
WHERE is_active = true
GROUP BY suit
ORDER BY suit;

-- Overall deck completeness
SELECT
    'Deck Completeness Summary' as analysis,
    COUNT(*) as total_cards,
    CASE
        WHEN COUNT(*) = 78 THEN '✅ COMPLETE: Perfect 78-card deck'
        WHEN COUNT(*) < 78 THEN '⚠️  INCOMPLETE: Missing ' || (78 - COUNT(*))::text || ' cards'
        WHEN COUNT(*) > 78 THEN '⚠️  EXCESS: ' || (COUNT(*) - 78)::text || ' extra cards detected'
    END as status
FROM public.wasteland_cards
WHERE is_active = true;

-- 3. DATA QUALITY VALIDATION
SELECT '🔧 DATA QUALITY VALIDATION' as section;
SELECT '─────────────────────────────────────────────────────' as subsection;

-- Radiation factor validation
SELECT
    'Radiation Factor Range' as test,
    COUNT(*) FILTER (WHERE radiation_factor BETWEEN 0.0 AND 1.0) as valid_count,
    COUNT(*) FILTER (WHERE radiation_factor < 0.0 OR radiation_factor > 1.0) as invalid_count,
    CASE
        WHEN COUNT(*) FILTER (WHERE radiation_factor < 0.0 OR radiation_factor > 1.0) = 0
        THEN '✅ PASS: All radiation factors within 0.0-1.0 range'
        ELSE '❌ FAIL: ' || COUNT(*) FILTER (WHERE radiation_factor < 0.0 OR radiation_factor > 1.0)::text || ' cards with invalid radiation factors'
    END as result
FROM public.wasteland_cards
WHERE is_active = true;

-- Karma alignment validation
SELECT
    'Karma Alignment Values' as test,
    COUNT(*) FILTER (WHERE karma_alignment IN ('GOOD', 'NEUTRAL', 'EVIL')) as valid_count,
    COUNT(*) FILTER (WHERE karma_alignment NOT IN ('GOOD', 'NEUTRAL', 'EVIL')) as invalid_count,
    CASE
        WHEN COUNT(*) FILTER (WHERE karma_alignment NOT IN ('GOOD', 'NEUTRAL', 'EVIL')) = 0
        THEN '✅ PASS: All karma alignments valid'
        ELSE '❌ FAIL: ' || COUNT(*) FILTER (WHERE karma_alignment NOT IN ('GOOD', 'NEUTRAL', 'EVIL'))::text || ' cards with invalid karma alignment'
    END as result
FROM public.wasteland_cards
WHERE is_active = true;

-- Essential field completeness
SELECT
    'Essential Fields Completeness' as test,
    COUNT(*) as total_cards,
    COUNT(*) FILTER (WHERE upright_meaning IS NOT NULL AND upright_meaning != '') as has_upright,
    COUNT(*) FILTER (WHERE reversed_meaning IS NOT NULL AND reversed_meaning != '') as has_reversed,
    COUNT(*) FILTER (WHERE image_url IS NOT NULL AND image_url != '') as has_image,
    CASE
        WHEN COUNT(*) FILTER (WHERE upright_meaning IS NULL OR upright_meaning = '' OR
                                    reversed_meaning IS NULL OR reversed_meaning = '' OR
                                    image_url IS NULL OR image_url = '') = 0
        THEN '✅ PASS: All cards have essential fields'
        ELSE '⚠️  WARNING: ' || COUNT(*) FILTER (WHERE upright_meaning IS NULL OR upright_meaning = '' OR
                                                        reversed_meaning IS NULL OR reversed_meaning = '' OR
                                                        image_url IS NULL OR image_url = '')::text || ' cards missing essential fields'
    END as result
FROM public.wasteland_cards
WHERE is_active = true;

-- Character voice interpretations completeness
SELECT
    'Character Voice Interpretations' as test,
    COUNT(*) as total_cards,
    COUNT(*) FILTER (WHERE character_voice_interpretations::text != '{}') as has_json_voices,
    COUNT(*) FILTER (WHERE pip_boy_interpretation IS NOT NULL AND pip_boy_interpretation != '') as has_pip_boy,
    ROUND(
        (COUNT(*) FILTER (WHERE character_voice_interpretations::text != '{}' OR
                               pip_boy_interpretation IS NOT NULL) * 100.0) / COUNT(*), 1
    ) as completion_percentage,
    CASE
        WHEN COUNT(*) FILTER (WHERE character_voice_interpretations::text != '{}' OR
                                   pip_boy_interpretation IS NOT NULL) >= COUNT(*) * 0.8
        THEN '✅ GOOD: ' || ROUND((COUNT(*) FILTER (WHERE character_voice_interpretations::text != '{}' OR pip_boy_interpretation IS NOT NULL) * 100.0) / COUNT(*), 1)::text || '% have voice interpretations'
        ELSE '⚠️  NEEDS WORK: Only ' || ROUND((COUNT(*) FILTER (WHERE character_voice_interpretations::text != '{}' OR pip_boy_interpretation IS NOT NULL) * 100.0) / COUNT(*), 1)::text || '% have voice interpretations'
    END as result
FROM public.wasteland_cards
WHERE is_active = true;

-- 4. PERFORMANCE METRICS
SELECT '⚡ PERFORMANCE VALIDATION' as section;
SELECT '─────────────────────────────────────────────────────' as subsection;

-- Index effectiveness check
SELECT
    'Database Indexes' as test,
    COUNT(*) as index_count,
    CASE
        WHEN COUNT(*) >= 5 THEN '✅ PASS: ' || COUNT(*)::text || ' indexes configured'
        ELSE '⚠️  WARNING: Only ' || COUNT(*)::text || ' indexes found'
    END as result
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'wasteland_cards';

-- Query performance test (simplified)
EXPLAIN (FORMAT JSON)
SELECT * FROM public.wasteland_cards
WHERE suit = 'MAJOR_ARCANA' AND is_active = true
LIMIT 10;

-- 5. SECURITY VALIDATION
SELECT '🔒 SECURITY VALIDATION' as section;
SELECT '─────────────────────────────────────────────────────' as subsection;

-- RLS (Row Level Security) status
SELECT
    'Row Level Security Status' as test,
    CASE
        WHEN rowsecurity THEN '✅ PASS: RLS enabled'
        ELSE '❌ FAIL: RLS not enabled'
    END as result
FROM pg_class
WHERE relname = 'wasteland_cards' AND relnamespace = (
    SELECT oid FROM pg_namespace WHERE nspname = 'public'
);

-- RLS policies count
SELECT
    'RLS Policies Configuration' as test,
    COUNT(*) as policy_count,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ PASS: ' || COUNT(*)::text || ' RLS policies configured'
        ELSE '❌ FAIL: No RLS policies found'
    END as result
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'wasteland_cards';

-- 6. FINAL HEALTH CHECK
SELECT '📈 FINAL HEALTH CHECK' as section;
SELECT '─────────────────────────────────────────────────────' as subsection;

-- Comprehensive deck statistics
SELECT
    '78-Card Deck Health Summary' as metric,
    COUNT(*) as total_active_cards,
    COUNT(*) FILTER (WHERE suit = 'MAJOR_ARCANA') as major_arcana,
    COUNT(*) FILTER (WHERE suit = 'RADIATION_RODS') as radiation_rods,
    COUNT(*) FILTER (WHERE suit = 'COMBAT_WEAPONS') as combat_weapons,
    COUNT(*) FILTER (WHERE suit = 'BOTTLE_CAPS') as bottle_caps,
    COUNT(*) FILTER (WHERE suit = 'NUKA_COLA_BOTTLES') as nuka_cola_bottles,
    COUNT(*) FILTER (WHERE is_complete = true) as complete_cards,
    ROUND(AVG(radiation_factor), 3) as avg_radiation,
    COUNT(*) FILTER (WHERE karma_alignment = 'GOOD') as good_karma,
    COUNT(*) FILTER (WHERE karma_alignment = 'NEUTRAL') as neutral_karma,
    COUNT(*) FILTER (WHERE karma_alignment = 'EVIL') as evil_karma,
    COUNT(*) FILTER (WHERE rarity_level = 'legendary') as legendary_cards,
    CASE
        WHEN COUNT(*) = 78 AND
             COUNT(*) FILTER (WHERE suit = 'MAJOR_ARCANA') = 22 AND
             COUNT(*) FILTER (WHERE suit = 'RADIATION_RODS') = 14 AND
             COUNT(*) FILTER (WHERE suit = 'COMBAT_WEAPONS') = 14 AND
             COUNT(*) FILTER (WHERE suit = 'BOTTLE_CAPS') = 14 AND
             COUNT(*) FILTER (WHERE suit = 'NUKA_COLA_BOTTLES') = 14
        THEN '✅ PERFECT: Complete 78-card Wasteland Tarot deck'
        ELSE '⚠️  NEEDS ATTENTION: Review missing/extra cards'
    END as overall_status
FROM public.wasteland_cards
WHERE is_active = true;

-- Identify specific gaps
WITH card_gaps AS (
    -- Major Arcana gaps (0-21)
    SELECT 'MAJOR_ARCANA' as missing_suit, s.card_num as missing_number
    FROM generate_series(0, 21) s(card_num)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.wasteland_cards
        WHERE suit = 'MAJOR_ARCANA' AND card_number = s.card_num AND is_active = true
    )

    UNION ALL

    -- Minor Arcana gaps (1-14 for each suit)
    SELECT suit_name as missing_suit, s.card_num as missing_number
    FROM (VALUES
        ('RADIATION_RODS'),
        ('COMBAT_WEAPONS'),
        ('BOTTLE_CAPS'),
        ('NUKA_COLA_BOTTLES')
    ) suits(suit_name)
    CROSS JOIN generate_series(1, 14) s(card_num)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.wasteland_cards
        WHERE suit = suits.suit_name AND card_number = s.card_num AND is_active = true
    )
)
SELECT
    'Missing Cards Detection' as analysis,
    CASE
        WHEN COUNT(*) = 0 THEN '✅ NO GAPS: All 78 cards present'
        ELSE '⚠️  GAPS FOUND: ' || COUNT(*)::text || ' cards missing'
    END as result,
    CASE
        WHEN COUNT(*) > 0 THEN (
            SELECT string_agg(missing_suit || ' ' || missing_number::text, ', ' ORDER BY missing_suit, missing_number)
            FROM card_gaps
            LIMIT 10
        ) || CASE WHEN COUNT(*) > 10 THEN '... and ' || (COUNT(*) - 10)::text || ' more' ELSE '' END
        ELSE 'None'
    END as missing_cards_sample
FROM card_gaps;

SELECT '================================================================' as separator;
SELECT '🎯 RECOMMENDATION SUMMARY' as final_section;
SELECT '================================================================' as separator;

-- Final recommendations
SELECT
    CASE
        WHEN (SELECT COUNT(*) FROM public.wasteland_cards WHERE is_active = true) = 78
        THEN '✅ DATABASE STATUS: READY FOR PRODUCTION'
        ELSE '⚠️  DATABASE STATUS: REQUIRES COMPLETION'
    END as database_status,

    CASE
        WHEN (SELECT COUNT(*) FROM public.wasteland_cards WHERE is_active = true AND is_complete = true) >=
             (SELECT COUNT(*) FROM public.wasteland_cards WHERE is_active = true) * 0.8
        THEN '✅ CONTENT STATUS: SUFFICIENT INTERPRETATIONS'
        ELSE '⚠️  CONTENT STATUS: NEEDS MORE INTERPRETATIONS'
    END as content_status,

    CASE
        WHEN (SELECT rowsecurity FROM pg_class WHERE relname = 'wasteland_cards' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
        THEN '✅ SECURITY STATUS: RLS ENABLED'
        ELSE '⚠️  SECURITY STATUS: ENABLE RLS'
    END as security_status;

SELECT '✨ Validation complete! Review results above for any items requiring attention.' as completion_message;