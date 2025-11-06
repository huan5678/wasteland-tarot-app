-- Add indexes to improve readings query performance
-- This addresses the slow performance issue with GET /api/v1/readings/

-- Index on user_id + created_at for sorted user queries (most common case)
CREATE INDEX IF NOT EXISTS idx_completed_readings_user_created 
ON completed_readings(user_id, created_at DESC);

-- Index on user_id + character_voice_used for voice filtering
CREATE INDEX IF NOT EXISTS idx_completed_readings_user_voice 
ON completed_readings(user_id, character_voice_used);

-- Index on user_id + karma_context for karma filtering
CREATE INDEX IF NOT EXISTS idx_completed_readings_user_karma 
ON completed_readings(user_id, karma_context);

-- Index on user_id + is_favorite for favorites filtering
CREATE INDEX IF NOT EXISTS idx_completed_readings_user_favorite 
ON completed_readings(user_id, is_favorite);

-- Index on user_id + privacy_level for privacy filtering
CREATE INDEX IF NOT EXISTS idx_completed_readings_user_privacy 
ON completed_readings(user_id, privacy_level);

-- Composite index for date range queries
CREATE INDEX IF NOT EXISTS idx_completed_readings_user_dates 
ON completed_readings(user_id, created_at DESC, updated_at DESC);

-- Verify indexes were created
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'completed_readings' 
AND indexname LIKE 'idx_completed_readings_%'
ORDER BY indexname;
