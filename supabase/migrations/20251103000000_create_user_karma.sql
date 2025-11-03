-- Migration: Create user_karma table (Task 1.1)
-- Description: Dual-score Karma system for unified gamification
-- Author: Claude (Linus Mode)
-- Date: 2025-11-03

-- ========================================
-- 1. Create user_karma table
-- ========================================

CREATE TABLE IF NOT EXISTS public.user_karma (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Dual Score System
    alignment_karma INTEGER NOT NULL DEFAULT 50 
        CHECK (alignment_karma >= 0 AND alignment_karma <= 100),
    total_karma INTEGER NOT NULL DEFAULT 50 
        CHECK (total_karma >= 0),
    
    -- Generated Column - Alignment Category
    alignment_category TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN alignment_karma >= 80 THEN 'very_good'
            WHEN alignment_karma >= 60 THEN 'good'
            WHEN alignment_karma >= 40 THEN 'neutral'
            WHEN alignment_karma >= 20 THEN 'evil'
            ELSE 'very_evil'
        END
    ) STORED,
    
    -- Cached Level (calculated from total_karma)
    current_level INTEGER NOT NULL DEFAULT 1 
        CHECK (current_level >= 1 AND current_level <= 100),
    karma_to_next_level INTEGER NOT NULL DEFAULT 500 
        CHECK (karma_to_next_level >= 0),
    
    -- Ranking (optional, for leaderboard)
    rank INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_karma_at TIMESTAMPTZ
);

-- ========================================
-- 2. Create indexes
-- ========================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_karma_user_id ON public.user_karma(user_id);
CREATE INDEX IF NOT EXISTS idx_user_karma_alignment_category ON public.user_karma(alignment_category);
CREATE INDEX IF NOT EXISTS idx_user_karma_total_karma ON public.user_karma(total_karma DESC);
CREATE INDEX IF NOT EXISTS idx_user_karma_current_level ON public.user_karma(current_level DESC);
CREATE INDEX IF NOT EXISTS idx_user_karma_rank ON public.user_karma(rank) WHERE rank IS NOT NULL;

-- ========================================
-- 3. Add comments
-- ========================================

COMMENT ON TABLE public.user_karma IS 'Unified Karma System - Dual score architecture for gamification';
COMMENT ON COLUMN public.user_karma.alignment_karma IS 'Alignment karma (0-100): affects faction affinity, character voice, AI tone';
COMMENT ON COLUMN public.user_karma.total_karma IS 'Total karma (cumulative): used for level calculation, never decreases';
COMMENT ON COLUMN public.user_karma.alignment_category IS 'Auto-calculated alignment category (GENERATED column)';
COMMENT ON COLUMN public.user_karma.current_level IS 'Cached user level (calculated from total_karma)';
COMMENT ON COLUMN public.user_karma.karma_to_next_level IS 'Karma points needed to reach next level';
COMMENT ON COLUMN public.user_karma.rank IS 'Global leaderboard rank (NULL if not ranked)';

-- ========================================
-- 4. Create trigger for updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_user_karma_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_karma_updated_at
    BEFORE UPDATE ON public.user_karma
    FOR EACH ROW
    EXECUTE FUNCTION update_user_karma_updated_at();

-- ========================================
-- 5. Migrate existing karma data (if any)
-- ========================================

-- Check if users.karma_score exists (old column)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'karma_score'
    ) THEN
        -- Migrate existing karma scores to user_karma table
        INSERT INTO public.user_karma (user_id, alignment_karma, total_karma, current_level, karma_to_next_level)
        SELECT 
            id AS user_id,
            COALESCE(karma_score, 50) AS alignment_karma,
            COALESCE(karma_score, 50) AS total_karma,
            FLOOR(COALESCE(karma_score, 50) / 500)::INTEGER + 1 AS current_level,
            (FLOOR(COALESCE(karma_score, 50) / 500)::INTEGER + 1) * 500 - COALESCE(karma_score, 50) AS karma_to_next_level
        FROM public.users
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'Migrated % users karma scores', (SELECT COUNT(*) FROM public.user_karma);
    ELSE
        RAISE NOTICE 'users.karma_score column not found, skipping migration';
    END IF;
END $$;

-- ========================================
-- 6. Create RLS policies (if RLS is enabled)
-- ========================================

ALTER TABLE public.user_karma ENABLE ROW LEVEL SECURITY;

-- Users can read their own karma
CREATE POLICY user_karma_select_own ON public.user_karma
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can read all karma for leaderboard (optional, adjust as needed)
CREATE POLICY user_karma_select_all ON public.user_karma
    FOR SELECT
    USING (true);

-- Only service role can insert/update/delete
CREATE POLICY user_karma_service_all ON public.user_karma
    FOR ALL
    USING (auth.role() = 'service_role');

-- ========================================
-- 7. Validation
-- ========================================

DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Check table exists
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_karma';
    
    IF table_count = 0 THEN
        RAISE EXCEPTION 'user_karma table was not created';
    END IF;
    
    -- Check indexes exist
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'user_karma';
    
    IF index_count < 5 THEN
        RAISE WARNING 'Expected at least 5 indexes, found %', index_count;
    END IF;
    
    RAISE NOTICE '✓ user_karma table created successfully with % indexes', index_count;
END $$;
