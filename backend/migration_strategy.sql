-- Wasteland Tarot Migration Strategy
-- Safe migration from existing schema to enhanced schema
-- Created: 2025-01-28

-- Phase 1: Backup and Preparation
-- Run this BEFORE applying the enhanced schema

-- Create backup tables
CREATE TABLE backup_wasteland_cards AS SELECT * FROM public.wasteland_cards;
CREATE TABLE backup_users AS SELECT * FROM public.users;
CREATE TABLE backup_user_profiles AS SELECT * FROM public.user_profiles;
CREATE TABLE backup_user_preferences AS SELECT * FROM public.user_preferences;
CREATE TABLE backup_user_readings AS SELECT * FROM public.user_readings;

-- Phase 2: Data Migration Scripts (Run AFTER enhanced schema is applied)

-- Migrate existing user readings to new reading_sessions format
INSERT INTO public.reading_sessions (
    id,
    user_id,
    question,
    spread_template_id,
    session_state,
    character_voice,
    karma_influence,
    faction_influence,
    started_at,
    completed_at,
    final_interpretation,
    user_feedback,
    accuracy_rating,
    is_private,
    allow_public_sharing,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    ur.user_id,
    COALESCE(ur.question, 'Imported reading'),
    (SELECT id FROM public.spread_templates WHERE slug =
        CASE ur.spread_type
            WHEN 'SINGLE_CARD' THEN 'single_wasteland'
            WHEN 'VAULT_TEC_SPREAD' THEN 'vault_tec_spread'
            WHEN 'WASTELAND_SURVIVAL' THEN 'wasteland_survival'
            WHEN 'BROTHERHOOD_COUNCIL' THEN 'brotherhood_council'
            ELSE 'single_wasteland'
        END
    ),
    'completed',
    COALESCE(ur.character_voice, 'pip_boy'),
    ur.karma_influence,
    ur.faction_influence,
    ur.created_at,
    ur.created_at + INTERVAL '10 minutes', -- Estimate completion time
    ur.interpretation_result,
    ur.feedback_comment,
    ur.feedback_rating,
    NOT COALESCE(ur.is_public, false),
    COALESCE(ur.is_public, false),
    ur.created_at,
    ur.updated_at
FROM backup_user_readings ur
WHERE ur.user_id IS NOT NULL;

-- Migrate card positions from old reading format
WITH reading_mapping AS (
    SELECT
        ur.id as old_reading_id,
        rs.id as new_session_id,
        ur.cards_drawn,
        ur.cards_orientations,
        ur.cards_positions
    FROM backup_user_readings ur
    JOIN public.reading_sessions rs ON ur.user_id = rs.user_id
        AND ur.created_at = rs.started_at
)
INSERT INTO public.reading_card_positions (
    id,
    session_id,
    card_id,
    position_index,
    position_name,
    is_reversed,
    drawn_at
)
SELECT
    gen_random_uuid(),
    rm.new_session_id,
    card_id,
    position_idx - 1, -- Convert to 0-based index
    COALESCE(position_name, 'Position ' || position_idx),
    COALESCE(orientation, false),
    NOW() - (INTERVAL '1 minute' * position_idx) -- Stagger draw times
FROM reading_mapping rm,
     LATERAL unnest(rm.cards_drawn) WITH ORDINALITY AS card_data(card_id, position_idx),
     LATERAL unnest(COALESCE(rm.cards_positions, ARRAY['Position ' || position_idx])) WITH ORDINALITY AS pos_data(position_name, pos_idx),
     LATERAL unnest(COALESCE(rm.cards_orientations, ARRAY[false])) WITH ORDINALITY AS orient_data(orientation, orient_idx)
WHERE position_idx = pos_idx AND position_idx = orient_idx;

-- Update user statistics based on migrated data
UPDATE public.users
SET total_readings = (
    SELECT COUNT(*)
    FROM public.reading_sessions rs
    WHERE rs.user_id = users.id AND rs.session_state = 'completed'
)
WHERE id IN (SELECT DISTINCT user_id FROM public.reading_sessions);

-- Initialize karma history for existing users
INSERT INTO public.karma_history (
    user_id,
    previous_karma,
    new_karma,
    karma_change,
    change_reason,
    automatic_change,
    created_at
)
SELECT
    id,
    50, -- Default starting karma
    karma_score,
    karma_score - 50,
    'Initial karma from migration',
    true,
    created_at
FROM public.users
WHERE karma_score != 50;

-- Create initial achievements for active users
INSERT INTO public.user_achievements (
    user_id,
    achievement_id,
    achievement_name,
    achievement_description,
    achievement_category,
    current_progress,
    required_progress,
    progress_percentage,
    is_completed,
    completed_at,
    experience_reward,
    community_points_reward
)
SELECT DISTINCT
    u.id,
    'early_adopter',
    'Early Adopter',
    'Joined the Wasteland Tarot during beta',
    'account',
    1,
    1,
    100.0,
    true,
    u.created_at,
    100,
    50
FROM public.users u
WHERE u.created_at < NOW() - INTERVAL '1 day';

-- Phase 3: Data Validation Queries
-- Run these to verify migration success

-- Validate reading migration
SELECT
    'Reading Migration Validation' as check_type,
    COUNT(*) as migrated_sessions,
    (SELECT COUNT(*) FROM backup_user_readings) as original_readings,
    CASE
        WHEN COUNT(*) = (SELECT COUNT(*) FROM backup_user_readings)
        THEN 'SUCCESS'
        ELSE 'NEEDS_REVIEW'
    END as status
FROM public.reading_sessions
WHERE created_at >= (SELECT MIN(created_at) FROM backup_user_readings);

-- Validate card positions migration
SELECT
    'Card Positions Migration Validation' as check_type,
    COUNT(*) as migrated_positions,
    (
        SELECT SUM(array_length(cards_drawn, 1))
        FROM backup_user_readings
        WHERE cards_drawn IS NOT NULL
    ) as original_positions,
    'Check counts manually' as status
FROM public.reading_card_positions;

-- Validate user statistics
SELECT
    'User Statistics Validation' as check_type,
    COUNT(*) as users_with_readings,
    AVG(total_readings) as avg_readings,
    MAX(total_readings) as max_readings
FROM public.users
WHERE total_readings > 0;

-- Phase 4: Cleanup (Run only after validation is successful)
-- UNCOMMENT THESE LINES ONLY AFTER CONFIRMING MIGRATION SUCCESS

-- DROP TABLE backup_wasteland_cards;
-- DROP TABLE backup_users;
-- DROP TABLE backup_user_profiles;
-- DROP TABLE backup_user_preferences;
-- DROP TABLE backup_user_readings;

-- Phase 5: Performance Optimization
-- Additional indexes based on expected query patterns

-- Composite indexes for common filtering scenarios
CREATE INDEX CONCURRENTLY idx_reading_sessions_user_voice_karma
ON public.reading_sessions(user_id, character_voice, karma_influence)
WHERE session_state = 'completed';

CREATE INDEX CONCURRENTLY idx_wasteland_cards_faction_search
ON public.wasteland_cards(suit, faction_alignment)
WHERE is_active = true;

-- Full-text search indexes for card meanings
CREATE INDEX CONCURRENTLY idx_wasteland_cards_meaning_search
ON public.wasteland_cards USING gin(
    to_tsvector('english', upright_meaning || ' ' || reversed_meaning || ' ' ||
                COALESCE(wasteland_humor, '') || ' ' ||
                COALESCE(fallout_easter_egg, ''))
);

-- User engagement tracking indexes
CREATE INDEX CONCURRENTLY idx_user_last_activity
ON public.reading_sessions(user_id, completed_at DESC)
WHERE session_state = 'completed';

-- Social features indexes
CREATE INDEX CONCURRENTLY idx_friendship_mutual_lookup
ON public.user_friendships(requester_id, addressee_id, status)
WHERE status = 'accepted';

-- Achievement progress tracking
CREATE INDEX CONCURRENTLY idx_achievements_progress
ON public.user_achievements(achievement_category, progress_percentage)
WHERE is_completed = false;

SELECT 'Migration strategy created successfully!
Run phases in order:
1. Backup (before schema change)
2. Apply enhanced_supabase_schema.sql
3. Run data migration (this file)
4. Validate results
5. Cleanup and optimize' as result;