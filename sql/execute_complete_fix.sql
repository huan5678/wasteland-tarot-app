-- COMPLETE DATABASE FIX EXECUTION SCRIPT
-- This script executes all necessary fixes in the correct order
-- ⚠️  IMPORTANT: Review and backup your database before running this!
-- Created: 2025-01-29

-- Phase 1: Database Structure Fix
\echo '🔧 Phase 1: Fixing Database Structure...'
\i fix_database_structure.sql

-- Phase 2: Complete Card Seeding
\echo '🃏 Phase 2: Seeding Complete 78-Card Deck...'
\i complete_78_cards_seed.sql

-- Phase 3: Final Validation
\echo '✅ Phase 3: Running Comprehensive Validation...'
\i comprehensive_validation.sql

-- Phase 4: Summary Report
\echo '📊 FINAL EXECUTION SUMMARY'
\echo '=========================='

-- Show final deck state
SELECT
    '🏗️ SUPABASE DATABASE ARCHITECTURE - EXECUTION COMPLETE' as title,
    NOW() as completed_at;

SELECT
    '📋 FINAL DECK COMPOSITION' as report_section,
    COUNT(*) as total_cards,
    COUNT(*) FILTER (WHERE suit = 'MAJOR_ARCANA') as major_arcana,
    COUNT(*) FILTER (WHERE suit = 'RADIATION_RODS') as radiation_rods,
    COUNT(*) FILTER (WHERE suit = 'COMBAT_WEAPONS') as combat_weapons,
    COUNT(*) FILTER (WHERE suit = 'BOTTLE_CAPS') as bottle_caps,
    COUNT(*) FILTER (WHERE suit = 'NUKA_COLA_BOTTLES') as nuka_cola_bottles,
    CASE
        WHEN COUNT(*) = 78 THEN '✅ COMPLETE'
        ELSE '⚠️  INCOMPLETE (' || COUNT(*) || '/78)'
    END as deck_status
FROM public.wasteland_cards
WHERE is_active = true;

SELECT
    '📈 DATA QUALITY METRICS' as report_section,
    COUNT(*) FILTER (WHERE is_complete = true) as complete_interpretations,
    ROUND((COUNT(*) FILTER (WHERE is_complete = true) * 100.0) / COUNT(*), 1) as completion_percentage,
    COUNT(*) FILTER (WHERE radiation_factor BETWEEN 0.0 AND 1.0) as valid_radiation_factors,
    COUNT(*) FILTER (WHERE karma_alignment IN ('GOOD', 'NEUTRAL', 'EVIL')) as valid_karma_alignments,
    COUNT(*) FILTER (WHERE character_voice_interpretations::text != '{}') as cards_with_voices
FROM public.wasteland_cards
WHERE is_active = true;

-- Show any remaining issues
WITH issues AS (
    SELECT 'Missing cards' as issue_type, (78 - COUNT(*))::text as issue_count
    FROM public.wasteland_cards WHERE is_active = true AND COUNT(*) < 78

    UNION ALL

    SELECT 'Invalid radiation factors' as issue_type, COUNT(*)::text as issue_count
    FROM public.wasteland_cards
    WHERE is_active = true AND (radiation_factor < 0.0 OR radiation_factor > 1.0)

    UNION ALL

    SELECT 'Invalid karma alignments' as issue_type, COUNT(*)::text as issue_count
    FROM public.wasteland_cards
    WHERE is_active = true AND karma_alignment NOT IN ('GOOD', 'NEUTRAL', 'EVIL')

    UNION ALL

    SELECT 'Cards without interpretations' as issue_type, COUNT(*)::text as issue_count
    FROM public.wasteland_cards
    WHERE is_active = true AND is_complete = false
)
SELECT
    '⚠️  REMAINING ISSUES (if any)' as report_section,
    issue_type,
    issue_count,
    CASE
        WHEN issue_count = '0' THEN '✅ No issues'
        ELSE '⚠️  Requires attention'
    END as status
FROM issues
WHERE issue_count != '0'
UNION ALL
SELECT '⚠️  REMAINING ISSUES (if any)', 'None found', '0', '✅ Database is healthy'
WHERE NOT EXISTS (SELECT 1 FROM issues WHERE issue_count != '0');

\echo ''
\echo '🎯 NEXT STEPS:'
\echo '1. Review the validation results above'
\echo '2. Update your TypeScript interfaces if needed (already done in src/types/database.ts)'
\echo '3. Test your application with the new database structure'
\echo '4. Add more detailed card interpretations as needed'
\echo '5. Consider adding card images to match the image_url paths'
\echo ''
\echo '✨ Execution complete! Your Wasteland Tarot database is ready for action.'