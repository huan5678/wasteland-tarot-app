-- Performance Optimization Indexes for Scalability
-- Generated: 2025-11-13
-- Purpose: Add indexes for frequently queried columns to improve query performance

-- Readings table indexes (for reading history and filtering)
CREATE INDEX IF NOT EXISTS idx_readings_user_created
ON completed_readings(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_readings_user_id
ON completed_readings(user_id);

CREATE INDEX IF NOT EXISTS idx_readings_created_at
ON completed_readings(created_at DESC);

-- Reading tags indexes (for tag filtering)
CREATE INDEX IF NOT EXISTS idx_reading_tags_reading
ON reading_tags(reading_id);

CREATE INDEX IF NOT EXISTS idx_reading_tags_tag
ON reading_tags(tag);

-- Categories index
CREATE INDEX IF NOT EXISTS idx_readings_category
ON completed_readings(category_id) WHERE category_id IS NOT NULL;

-- User table indexes (for authentication)
CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_username
ON users(username) WHERE username IS NOT NULL;

-- Cards table indexes (for card lookups)
CREATE INDEX IF NOT EXISTS idx_cards_name
ON wasteland_cards(name);

CREATE INDEX IF NOT EXISTS idx_cards_suit
ON wasteland_cards(suit);

-- Spread templates index
CREATE INDEX IF NOT EXISTS idx_spreads_name
ON spread_templates(name);

-- Character voices index (for AI interpretation)
CREATE INDEX IF NOT EXISTS idx_characters_fallout_name
ON characters(fallout_character_name);

-- Faction index
CREATE INDEX IF NOT EXISTS idx_factions_name
ON factions(name);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_readings_user_spread
ON completed_readings(user_id, spread_template_id);

CREATE INDEX IF NOT EXISTS idx_readings_user_category
ON completed_readings(user_id, category_id) WHERE category_id IS NOT NULL;

-- Partial index for active (non-deleted) readings
CREATE INDEX IF NOT EXISTS idx_readings_active
ON completed_readings(user_id, created_at DESC) WHERE deleted_at IS NULL;

-- Comment: These indexes support the following common queries:
-- 1. User reading history (user_id + created_at DESC)
-- 2. Tag filtering (reading_tags.tag)
-- 3. Category filtering (category_id)
-- 4. User authentication (email, username)
-- 5. Card lookups (name, suit)
-- 6. Spread template lookups (name)
-- 7. Character voice lookups (fallout_character_name)
-- 8. Active readings filtering (deleted_at IS NULL)

-- Analyze tables to update statistics for query planner
ANALYZE completed_readings;
ANALYZE reading_tags;
ANALYZE users;
ANALYZE wasteland_cards;
ANALYZE spread_templates;
ANALYZE characters;
ANALYZE factions;
