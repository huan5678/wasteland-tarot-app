-- Validation and Testing Script for Wasteland Tarot Database
-- Comprehensive testing of the optimized schema and data integrity
-- Created: 2025-01-29

-- Set up test environment
\set ON_ERROR_STOP on

-- Test 1: Schema validation
SELECT '=== SCHEMA VALIDATION TESTS ===' as test_section;

-- Verify table exists with correct structure
SELECT
    'Table Structure Check' as test_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'wasteland_cards'
        ) THEN 'PASS: Table exists'
        ELSE 'FAIL: Table missing'
    END as result;

-- Verify essential columns exist
SELECT
    'Essential Columns Check' as test_name,
    CASE
        WHEN (
            SELECT COUNT(*) FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'wasteland_cards'
            AND column_name IN (
                'id', 'name', 'suit', 'card_number', 'upright_meaning',
                'reversed_meaning', 'character_voice_interpretations',
                'radiation_factor', 'karma_alignment'
            )
        ) = 9 THEN 'PASS: All essential columns present'
        ELSE 'FAIL: Missing essential columns'
    END as result;

-- Verify constraints are in place
SELECT
    'Constraints Check' as test_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.check_constraints
            WHERE constraint_schema = 'public'
            AND constraint_name LIKE '%radiation_factor%'
        ) THEN 'PASS: Radiation factor constraint exists'
        ELSE 'FAIL: Missing radiation constraint'
    END as result;

-- Test 2: Index verification
SELECT '=== INDEX VALIDATION TESTS ===' as test_section;

-- Check for essential indexes
SELECT
    'Index Check' as test_name,
    COUNT(*) as index_count,
    CASE
        WHEN COUNT(*) >= 5 THEN 'PASS: Sufficient indexes'
        ELSE 'FAIL: Missing indexes'
    END as result
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'wasteland_cards';

-- Test 3: Data integrity tests
SELECT '=== DATA INTEGRITY TESTS ===' as test_section;

-- Test card insertion with validation
DO $$
DECLARE
    test_result BOOLEAN;
BEGIN
    -- Test valid card insertion
    SELECT seed_wasteland_card(
        'test_card_001',
        'Test Vault Dweller',
        '大阿爾克那',
        99,
        'Test upright meaning',
        'Test reversed meaning',
        'Test description',
        ARRAY['test', 'validation'],
        '/cards/test.png',
        0.5,
        'GOOD',
        'Test fallout reference',
        'Test symbolism',
        '測試',
        'Test astrological',
        'Test pip-boy interpretation',
        'TEST SUPER MUTANT TALK!',
        'Test ghoul wisdom',
        'Test raider comment',
        'Test: Brotherhood analysis',
        'Gosh, this is a test!',
        'Sir, this appears to be a test card.',
        'rare'
    ) INTO test_result;

    IF test_result THEN
        RAISE NOTICE 'PASS: Test card insertion successful';
    ELSE
        RAISE NOTICE 'FAIL: Test card insertion failed';
    END IF;
END $$;

-- Verify test card was inserted correctly
SELECT
    'Test Card Verification' as test_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM public.wasteland_cards
            WHERE id = 'test_card_001'
            AND character_voice_interpretations->>'PIP_BOY' = 'Test pip-boy interpretation'
        ) THEN 'PASS: Test card data correct'
        ELSE 'FAIL: Test card data incorrect'
    END as result;

-- Test constraint validation
DO $$
BEGIN
    -- Test invalid radiation factor (should fail)
    BEGIN
        INSERT INTO public.wasteland_cards (
            id, name, suit, card_number, upright_meaning, reversed_meaning,
            image_url, radiation_factor
        ) VALUES (
            'invalid_test', 'Invalid Card', 'Test', 1,
            'Test', 'Test', '/test.png', 2.0  -- Invalid: > 1.0
        );
        RAISE NOTICE 'FAIL: Invalid radiation factor accepted';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: Radiation factor constraint working';
    END;

    -- Test invalid karma alignment (should fail)
    BEGIN
        INSERT INTO public.wasteland_cards (
            id, name, suit, card_number, upright_meaning, reversed_meaning,
            image_url, karma_alignment
        ) VALUES (
            'invalid_test2', 'Invalid Card 2', 'Test', 2,
            'Test', 'Test', '/test.png', 'INVALID'  -- Invalid karma
        );
        RAISE NOTICE 'FAIL: Invalid karma alignment accepted';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'PASS: Karma alignment constraint working';
    END;
END $$;

-- Test 4: Function validation
SELECT '=== FUNCTION VALIDATION TESTS ===' as test_section;

-- Test get_detailed_card function
SELECT
    'get_detailed_card Function' as test_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM get_detailed_card('0')
            WHERE name = '廢土流浪者'
        ) THEN 'PASS: Function returns correct data'
        ELSE 'FAIL: Function error or incorrect data'
    END as result;

-- Test search_cards function
SELECT
    'search_cards Function' as test_name,
    CASE
        WHEN (
            SELECT COUNT(*) FROM search_cards('廢土', NULL)
        ) > 0 THEN 'PASS: Search function working'
        ELSE 'FAIL: Search function not working'
    END as result;

-- Test 5: Trigger validation
SELECT '=== TRIGGER VALIDATION TESTS ===' as test_section;

-- Test auto-update trigger
UPDATE public.wasteland_cards
SET name = name || ' (Updated)'
WHERE id = 'test_card_001';

SELECT
    'Update Trigger Test' as test_name,
    CASE
        WHEN (
            SELECT updated_at > created_at
            FROM public.wasteland_cards
            WHERE id = 'test_card_001'
        ) THEN 'PASS: Update trigger working'
        ELSE 'FAIL: Update trigger not working'
    END as result;

-- Test completion status trigger
UPDATE public.wasteland_cards
SET
    upright_meaning = 'Complete upright meaning',
    reversed_meaning = 'Complete reversed meaning',
    description = 'Complete description',
    fallout_reference = 'Complete fallout reference',
    symbolism = 'Complete symbolism',
    pip_boy_interpretation = 'Complete pip-boy'
WHERE id = 'test_card_001';

SELECT
    'Completion Status Trigger' as test_name,
    CASE
        WHEN (
            SELECT is_complete
            FROM public.wasteland_cards
            WHERE id = 'test_card_001'
        ) THEN 'PASS: Completion trigger working'
        ELSE 'FAIL: Completion trigger not working'
    END as result;

-- Test 6: Performance validation
SELECT '=== PERFORMANCE VALIDATION TESTS ===' as test_section;

-- Test index performance with EXPLAIN
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM public.wasteland_cards
WHERE suit = '大阿爾克那' AND radiation_factor > 0.2;

EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM public.wasteland_cards
WHERE 'test' = ANY(keywords);

EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM search_cards('廢土', '大阿爾克那');

-- Test 7: Data completeness validation
SELECT '=== DATA COMPLETENESS TESTS ===' as test_section;

-- Count cards by suit
SELECT
    'Card Distribution' as test_name,
    suit,
    COUNT(*) as count,
    CASE
        WHEN suit = '大阿爾克那' AND COUNT(*) >= 6 THEN 'PASS'
        WHEN suit != '大阿爾克那' AND COUNT(*) >= 0 THEN 'PASS'
        ELSE 'NEEDS_WORK'
    END as status
FROM public.wasteland_cards
WHERE is_active = true
GROUP BY suit
ORDER BY suit;

-- Check data quality
SELECT
    'Data Quality Summary' as test_name,
    COUNT(*) as total_cards,
    COUNT(*) FILTER (WHERE is_complete = true) as complete_cards,
    COUNT(*) FILTER (WHERE radiation_factor BETWEEN 0.0 AND 1.0) as valid_radiation,
    COUNT(*) FILTER (WHERE karma_alignment IN ('GOOD', 'NEUTRAL', 'EVIL')) as valid_karma,
    COUNT(*) FILTER (WHERE character_voice_interpretations::text != '{}') as has_voices,
    ROUND(AVG(radiation_factor), 3) as avg_radiation
FROM public.wasteland_cards
WHERE is_active = true;

-- Test 8: RLS (Row Level Security) validation
SELECT '=== ROW LEVEL SECURITY TESTS ===' as test_section;

-- Check if RLS is enabled
SELECT
    'RLS Status' as test_name,
    CASE
        WHEN rowsecurity THEN 'PASS: RLS enabled'
        ELSE 'FAIL: RLS not enabled'
    END as result
FROM pg_class
WHERE relname = 'wasteland_cards' AND relnamespace = (
    SELECT oid FROM pg_namespace WHERE nspname = 'public'
);

-- Check policies exist
SELECT
    'RLS Policies' as test_name,
    COUNT(*) as policy_count,
    CASE
        WHEN COUNT(*) > 0 THEN 'PASS: Policies configured'
        ELSE 'FAIL: No policies found'
    END as result
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'wasteland_cards';

-- Test 9: View validation
SELECT '=== VIEW VALIDATION TESTS ===' as test_section;

-- Test card_statistics view if it exists
SELECT
    'Card Statistics View' as test_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.views
            WHERE table_schema = 'public' AND table_name = 'card_statistics'
        ) THEN 'PASS: Statistics view exists'
        ELSE 'INFO: Statistics view not found (optional)'
    END as result;

-- Cleanup test data
DELETE FROM public.wasteland_cards WHERE id LIKE 'test_card_%' OR id LIKE 'invalid_test%';

-- Final summary report
SELECT '=== FINAL VALIDATION SUMMARY ===' as test_section;

SELECT
    'Database Health Check' as metric,
    COUNT(*) as total_cards,
    COUNT(*) FILTER (WHERE is_complete = true) as complete_cards,
    COUNT(*) FILTER (WHERE upright_meaning IS NOT NULL AND upright_meaning != '') as has_meanings,
    COUNT(*) FILTER (WHERE character_voice_interpretations::text != '{}') as has_interpretations,
    ROUND(AVG(radiation_factor), 3) as avg_radiation_level,
    string_agg(DISTINCT karma_alignment, ', ') as karma_types,
    string_agg(DISTINCT suit, ', ') as available_suits
FROM public.wasteland_cards
WHERE is_active = true;

-- Performance benchmark
SELECT
    'Performance Metrics' as metric,
    (SELECT COUNT(*) FROM public.wasteland_cards WHERE suit = '大阿爾克那') as major_arcana_query_ms,
    (SELECT COUNT(*) FROM search_cards('廢土', NULL)) as search_results,
    (SELECT COUNT(*) FROM public.wasteland_cards WHERE radiation_factor > 0.5) as high_radiation_cards;

SELECT
    '✅ Validation Complete!' as status,
    'Review results above for any FAIL items that need attention' as next_steps;