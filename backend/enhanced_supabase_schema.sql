-- Enhanced Wasteland Tarot Supabase Schema
-- Comprehensive database design supporting all system features
-- Created: 2025-01-28

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Drop existing tables in correct order to handle dependencies
DROP TABLE IF EXISTS public.reading_card_positions CASCADE;
DROP TABLE IF EXISTS public.card_synergies CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.karma_history CASCADE;
DROP TABLE IF EXISTS public.user_friendships CASCADE;
DROP TABLE IF EXISTS public.reading_sessions CASCADE;
DROP TABLE IF EXISTS public.spread_templates CASCADE;
DROP TABLE IF EXISTS public.interpretation_templates CASCADE;
DROP TABLE IF EXISTS public.user_readings CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.wasteland_cards CASCADE;

-- Core card system with enhanced attributes
CREATE TABLE public.wasteland_cards (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    suit VARCHAR(50) NOT NULL,
    number INTEGER,

    -- Core meanings
    upright_meaning TEXT NOT NULL,
    reversed_meaning TEXT NOT NULL,

    -- Fallout-specific attributes
    radiation_level DECIMAL(4,2) DEFAULT 0.0 CHECK (radiation_level >= 0.0 AND radiation_level <= 10.0),
    threat_level INTEGER DEFAULT 1 CHECK (threat_level >= 1 AND threat_level <= 10),
    vault_reference INTEGER,

    -- Keywords for semantic search
    upright_keywords TEXT[],
    reversed_keywords TEXT[],

    -- Character-based interpretations
    pip_boy_analysis TEXT,
    vault_dweller_perspective TEXT,
    wasteland_trader_wisdom TEXT,
    super_mutant_simplicity TEXT,
    codsworth_analysis TEXT,

    -- Karma-aligned interpretations
    good_karma_interpretation TEXT,
    neutral_karma_interpretation TEXT,
    evil_karma_interpretation TEXT,

    -- Faction significance
    brotherhood_significance TEXT,
    ncr_significance TEXT,
    legion_significance TEXT,
    raiders_significance TEXT,
    vault_dweller_significance TEXT,

    -- Flavor and atmosphere
    wasteland_humor TEXT,
    nuka_cola_reference TEXT,
    fallout_easter_egg TEXT,
    special_ability TEXT,

    -- Visual and audio
    image_url VARCHAR(500),
    image_alt_text TEXT,
    audio_cue_url VARCHAR(500),
    geiger_intensity DECIMAL(3,2) DEFAULT 0.1,

    -- Usage statistics
    draw_frequency INTEGER DEFAULT 0,
    total_appearances INTEGER DEFAULT 0,
    positive_feedback_count INTEGER DEFAULT 0,
    negative_feedback_count INTEGER DEFAULT 0,

    -- Metadata
    rarity_level VARCHAR(20) DEFAULT 'common' CHECK (rarity_level IN ('common', 'uncommon', 'rare', 'legendary')),
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced user system with Supabase auth integration
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Authentication (integrates with Supabase Auth)
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,

    -- Profile basics
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),

    -- Wasteland-specific attributes
    faction_alignment VARCHAR(50) DEFAULT 'vault_dweller',
    karma_score INTEGER DEFAULT 50 CHECK (karma_score >= 0 AND karma_score <= 100),
    vault_number INTEGER,
    wasteland_location VARCHAR(100),

    -- Account status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,

    -- Statistics
    total_readings INTEGER DEFAULT 0,
    daily_readings_count INTEGER DEFAULT 0,
    daily_readings_reset_date DATE DEFAULT CURRENT_DATE,
    accurate_predictions INTEGER DEFAULT 0,
    community_points INTEGER DEFAULT 0,
    experience_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,

    -- Social features
    allow_friend_requests BOOLEAN DEFAULT true,
    public_profile BOOLEAN DEFAULT false,

    -- Security
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP WITH TIME ZONE,

    -- Privacy
    data_collection_consent BOOLEAN DEFAULT true,
    marketing_consent BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles with enhanced wasteland elements
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

    -- Character voice preference
    preferred_voice VARCHAR(50) DEFAULT 'pip_boy',

    -- Advanced wasteland profile
    vault_backstory TEXT,
    faction_rank VARCHAR(50),
    special_stats JSONB DEFAULT '{"strength": 5, "perception": 5, "endurance": 5, "charisma": 5, "intelligence": 5, "agility": 5, "luck": 5}',
    perks_unlocked TEXT[],

    -- Reading preferences
    favorite_card_suit VARCHAR(50),
    preferred_spread_types TEXT[],
    interpretation_style VARCHAR(50) DEFAULT 'balanced',

    -- Achievement tracking
    achievements_earned TEXT[],
    badges_collected TEXT[],
    milestone_dates JSONB DEFAULT '{}',

    -- Social stats
    friends_count INTEGER DEFAULT 0,
    readings_shared INTEGER DEFAULT 0,
    community_contributions INTEGER DEFAULT 0,
    reputation_score DECIMAL(4,2) DEFAULT 0.0,

    -- Personalization
    timezone VARCHAR(50) DEFAULT 'UTC',
    language_preference VARCHAR(10) DEFAULT 'en',
    accessibility_settings JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id)
);

-- User preferences with comprehensive customization
CREATE TABLE public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

    -- Reading preferences
    default_character_voice VARCHAR(50) DEFAULT 'pip_boy',
    auto_save_readings BOOLEAN DEFAULT true,
    share_readings_publicly BOOLEAN DEFAULT false,
    favorite_spread_types JSONB DEFAULT '["single_card", "vault_tec_spread"]',
    karma_influence_level VARCHAR(20) DEFAULT 'moderate',

    -- UI preferences
    theme VARCHAR(50) DEFAULT 'dark_vault',
    pip_boy_color VARCHAR(20) DEFAULT 'green',
    terminal_effects BOOLEAN DEFAULT true,
    sound_effects BOOLEAN DEFAULT true,
    background_music BOOLEAN DEFAULT false,
    geiger_counter_volume DECIMAL(3,2) DEFAULT 0.5,
    voice_volume DECIMAL(3,2) DEFAULT 0.8,
    ambient_volume DECIMAL(3,2) DEFAULT 0.3,

    -- Card display preferences
    preferred_card_back VARCHAR(50) DEFAULT 'vault_tech',
    card_animation_speed VARCHAR(20) DEFAULT 'normal',
    show_radiation_effects BOOLEAN DEFAULT true,

    -- Notifications
    email_notifications BOOLEAN DEFAULT false,
    daily_reading_reminder BOOLEAN DEFAULT false,
    friend_activity_notifications BOOLEAN DEFAULT true,
    achievement_notifications BOOLEAN DEFAULT true,
    reading_reminder_time TIME,

    -- Privacy
    public_profile BOOLEAN DEFAULT false,
    allow_friend_requests BOOLEAN DEFAULT true,
    share_reading_history BOOLEAN DEFAULT false,

    -- Accessibility
    high_contrast_mode BOOLEAN DEFAULT false,
    large_text_mode BOOLEAN DEFAULT false,
    screen_reader_mode BOOLEAN DEFAULT false,
    reduced_motion BOOLEAN DEFAULT false,
    keyboard_navigation BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Spread templates for different divination methods
CREATE TABLE public.spread_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,

    -- Template configuration
    card_count INTEGER NOT NULL CHECK (card_count >= 1 AND card_count <= 21),
    position_names TEXT[] NOT NULL,
    position_meanings TEXT[] NOT NULL,
    layout_config JSONB NOT NULL, -- Contains position coordinates, styling

    -- Fallout theme
    fallout_theme VARCHAR(50),
    difficulty_level VARCHAR(20) DEFAULT 'beginner',
    faction_association VARCHAR(50),

    -- Usage stats
    usage_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.0,

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    creator_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Character interpretation templates
CREATE TABLE public.interpretation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_voice VARCHAR(50) NOT NULL,
    template_name VARCHAR(100) NOT NULL,

    -- Template structure
    intro_phrases TEXT[],
    card_interpretation_format TEXT,
    conclusion_phrases TEXT[],
    transition_phrases TEXT[],

    -- Voice characteristics
    personality_traits JSONB,
    speaking_style VARCHAR(100),
    favorite_expressions TEXT[],
    fallout_references TEXT[],

    -- Usage
    is_active BOOLEAN DEFAULT true,
    usage_weight DECIMAL(3,2) DEFAULT 1.0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading sessions for complex multi-card readings
CREATE TABLE public.reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

    -- Session details
    question TEXT NOT NULL,
    spread_template_id UUID REFERENCES public.spread_templates(id),
    session_state VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, abandoned

    -- Context
    character_voice VARCHAR(50) NOT NULL,
    karma_influence VARCHAR(20),
    faction_influence VARCHAR(50),
    mood_context VARCHAR(50),
    location_context VARCHAR(100),

    -- Metadata
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    session_duration INTEGER, -- seconds

    -- Results
    final_interpretation TEXT,
    user_feedback TEXT,
    accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),

    -- Privacy
    is_private BOOLEAN DEFAULT true,
    allow_public_sharing BOOLEAN DEFAULT false,
    share_with_friends BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual card positions within reading sessions
CREATE TABLE public.reading_card_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.reading_sessions(id) ON DELETE CASCADE NOT NULL,
    card_id VARCHAR(100) REFERENCES public.wasteland_cards(id) NOT NULL,

    -- Position details
    position_index INTEGER NOT NULL, -- 0-based index
    position_name VARCHAR(100) NOT NULL,
    position_meaning TEXT,

    -- Card state
    is_reversed BOOLEAN DEFAULT false,
    drawn_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Interpretation
    individual_interpretation TEXT,
    position_significance TEXT,
    card_synergy_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Card synergies and combinations
CREATE TABLE public.card_synergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_card_id VARCHAR(100) REFERENCES public.wasteland_cards(id) NOT NULL,
    secondary_card_id VARCHAR(100) REFERENCES public.wasteland_cards(id) NOT NULL,

    -- Synergy details
    synergy_type VARCHAR(50) NOT NULL, -- complementary, conflicting, amplifying, neutralizing
    synergy_strength DECIMAL(3,2) DEFAULT 1.0,
    synergy_description TEXT,

    -- Context conditions
    applicable_spreads TEXT[],
    position_requirements JSONB,
    karma_conditions TEXT[],
    faction_conditions TEXT[],

    -- Usage stats
    occurrence_count INTEGER DEFAULT 0,
    user_feedback_score DECIMAL(3,2) DEFAULT 0.0,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(primary_card_id, secondary_card_id)
);

-- User achievement tracking
CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id VARCHAR(100) NOT NULL,

    -- Achievement details
    achievement_name VARCHAR(200) NOT NULL,
    achievement_description TEXT,
    achievement_category VARCHAR(50),

    -- Progress tracking
    current_progress INTEGER DEFAULT 0,
    required_progress INTEGER DEFAULT 1,
    progress_percentage DECIMAL(5,2) DEFAULT 0.0,

    -- Completion
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Rewards
    experience_reward INTEGER DEFAULT 0,
    community_points_reward INTEGER DEFAULT 0,
    special_rewards JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, achievement_id)
);

-- Karma history tracking
CREATE TABLE public.karma_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

    -- Change details
    previous_karma INTEGER NOT NULL,
    new_karma INTEGER NOT NULL,
    karma_change INTEGER NOT NULL,

    -- Context
    change_reason VARCHAR(100) NOT NULL,
    related_reading_id UUID REFERENCES public.reading_sessions(id),
    related_action VARCHAR(100),

    -- Metadata
    automatic_change BOOLEAN DEFAULT true,
    admin_override BOOLEAN DEFAULT false,
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User friendships and social connections
CREATE TABLE public.user_friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    addressee_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

    -- Friendship status
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked, declined
    established_at TIMESTAMP WITH TIME ZONE,

    -- Social features
    can_view_readings BOOLEAN DEFAULT false,
    can_comment_readings BOOLEAN DEFAULT false,
    notification_level VARCHAR(20) DEFAULT 'normal', -- none, minimal, normal, all

    -- Interaction stats
    shared_readings_count INTEGER DEFAULT 0,
    mutual_friends_count INTEGER DEFAULT 0,
    last_interaction TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(requester_id, addressee_id),
    CHECK(requester_id != addressee_id)
);

-- Create optimized indexes for performance
CREATE INDEX idx_wasteland_cards_suit_number ON public.wasteland_cards(suit, number);
CREATE INDEX idx_wasteland_cards_radiation ON public.wasteland_cards(radiation_level);
CREATE INDEX idx_wasteland_cards_threat ON public.wasteland_cards(threat_level);
CREATE INDEX idx_wasteland_cards_rarity ON public.wasteland_cards(rarity_level);
CREATE INDEX idx_wasteland_cards_active ON public.wasteland_cards(is_active);
CREATE INDEX idx_wasteland_cards_keywords_gin ON public.wasteland_cards USING gin(upright_keywords, reversed_keywords);

CREATE INDEX idx_users_faction_karma ON public.users(faction_alignment, karma_score);
CREATE INDEX idx_users_active_verified ON public.users(is_active, is_verified);
CREATE INDEX idx_users_premium_tier ON public.users(is_premium, subscription_tier);
CREATE INDEX idx_users_daily_readings ON public.users(daily_readings_reset_date, daily_readings_count);

CREATE INDEX idx_user_profiles_voice_suit ON public.user_profiles(preferred_voice, favorite_card_suit);
CREATE INDEX idx_user_profiles_achievements_gin ON public.user_profiles USING gin(achievements_earned);

CREATE INDEX idx_reading_sessions_user_state ON public.reading_sessions(user_id, session_state);
CREATE INDEX idx_reading_sessions_completed ON public.reading_sessions(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_reading_sessions_public ON public.reading_sessions(allow_public_sharing) WHERE allow_public_sharing = true;

CREATE INDEX idx_reading_card_positions_session ON public.reading_card_positions(session_id, position_index);
CREATE INDEX idx_reading_card_positions_card ON public.reading_card_positions(card_id);

CREATE INDEX idx_card_synergies_primary ON public.card_synergies(primary_card_id);
CREATE INDEX idx_card_synergies_secondary ON public.card_synergies(secondary_card_id);
CREATE INDEX idx_card_synergies_type_strength ON public.card_synergies(synergy_type, synergy_strength);

CREATE INDEX idx_user_achievements_user_category ON public.user_achievements(user_id, achievement_category);
CREATE INDEX idx_user_achievements_completed ON public.user_achievements(is_completed, completed_at);

CREATE INDEX idx_karma_history_user_time ON public.karma_history(user_id, created_at);
CREATE INDEX idx_karma_history_reading ON public.karma_history(related_reading_id);

CREATE INDEX idx_user_friendships_requester ON public.user_friendships(requester_id, status);
CREATE INDEX idx_user_friendships_addressee ON public.user_friendships(addressee_id, status);

-- Create auto-update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wasteland_cards_updated_at BEFORE UPDATE ON public.wasteland_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spread_templates_updated_at BEFORE UPDATE ON public.spread_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reading_sessions_updated_at BEFORE UPDATE ON public.reading_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_achievements_updated_at BEFORE UPDATE ON public.user_achievements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_friendships_updated_at BEFORE UPDATE ON public.user_friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.wasteland_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spread_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interpretation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_card_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_synergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karma_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Cards are publicly readable
CREATE POLICY "Anyone can read wasteland cards" ON public.wasteland_cards
    FOR SELECT USING (is_active = true);

-- Users can only read their own user data
CREATE POLICY "Users can read their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- User profiles
CREATE POLICY "Users can manage their own profile" ON public.user_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public profiles are readable" ON public.user_profiles
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users
            WHERE public_profile = true AND is_active = true
        )
    );

-- User preferences - completely private
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Spread templates - public for reading, admin for writing
CREATE POLICY "Anyone can read active spread templates" ON public.spread_templates
    FOR SELECT USING (is_active = true);

-- Interpretation templates - public for reading
CREATE POLICY "Anyone can read active interpretation templates" ON public.interpretation_templates
    FOR SELECT USING (is_active = true);

-- Reading sessions - users can manage their own
CREATE POLICY "Users can manage their own reading sessions" ON public.reading_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public reading sessions are readable" ON public.reading_sessions
    FOR SELECT USING (
        allow_public_sharing = true AND
        session_state = 'completed' AND
        is_private = false
    );

CREATE POLICY "Friends can read shared sessions" ON public.reading_sessions
    FOR SELECT USING (
        share_with_friends = true AND
        session_state = 'completed' AND
        user_id IN (
            SELECT CASE
                WHEN requester_id = auth.uid() THEN addressee_id
                WHEN addressee_id = auth.uid() THEN requester_id
            END
            FROM public.user_friendships
            WHERE status = 'accepted' AND
                (requester_id = auth.uid() OR addressee_id = auth.uid())
        )
    );

-- Reading card positions - inherit from sessions
CREATE POLICY "Users can manage their reading card positions" ON public.reading_card_positions
    FOR ALL USING (
        session_id IN (
            SELECT id FROM public.reading_sessions
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Public reading card positions are readable" ON public.reading_card_positions
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM public.reading_sessions
            WHERE allow_public_sharing = true AND session_state = 'completed'
        )
    );

-- Card synergies - public for reading
CREATE POLICY "Anyone can read active card synergies" ON public.card_synergies
    FOR SELECT USING (is_active = true);

-- User achievements - users can read their own
CREATE POLICY "Users can read their own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (true); -- Will be handled by backend

CREATE POLICY "Users can update their achievement progress" ON public.user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- Karma history - users can read their own
CREATE POLICY "Users can read their own karma history" ON public.karma_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert karma changes" ON public.karma_history
    FOR INSERT WITH CHECK (true); -- Will be handled by backend

-- User friendships - users can manage their own relationships
CREATE POLICY "Users can read their own friendships" ON public.user_friendships
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friend requests" ON public.user_friendships
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own friendship status" ON public.user_friendships
    FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Utility views for common queries

-- Popular cards with usage statistics
CREATE VIEW public.popular_cards AS
SELECT
    wc.*,
    COALESCE(rcp.usage_count, 0) as current_usage_count,
    COALESCE(rcp.avg_rating, 0.0) as average_user_rating
FROM public.wasteland_cards wc
LEFT JOIN (
    SELECT
        card_id,
        COUNT(*) as usage_count,
        AVG(COALESCE((
            SELECT accuracy_rating
            FROM public.reading_sessions rs
            WHERE rs.id = rcp.session_id
        ), 3.0)) as avg_rating
    FROM public.reading_card_positions rcp
    GROUP BY card_id
) rcp ON wc.id = rcp.card_id
WHERE wc.is_active = true
ORDER BY current_usage_count DESC, average_user_rating DESC;

-- User statistics with comprehensive metrics
CREATE VIEW public.user_statistics AS
SELECT
    u.id,
    u.username,
    u.display_name,
    u.faction_alignment,
    u.karma_score,
    u.current_level,
    u.total_readings,
    u.community_points,

    up.friends_count,
    up.reputation_score,

    COALESCE(rs_stats.completed_readings, 0) as completed_readings,
    COALESCE(rs_stats.avg_session_duration, 0) as avg_session_duration,
    COALESCE(rs_stats.avg_accuracy_rating, 0.0) as avg_accuracy_rating,

    COALESCE(array_length(up.achievements_earned, 1), 0) as total_achievements,

    CASE
        WHEN u.karma_score >= 80 THEN 'Saint'
        WHEN u.karma_score >= 60 THEN 'Good'
        WHEN u.karma_score >= 40 THEN 'Neutral'
        WHEN u.karma_score >= 20 THEN 'Evil'
        ELSE 'Very Evil'
    END as karma_title

FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN (
    SELECT
        user_id,
        COUNT(*) FILTER (WHERE session_state = 'completed') as completed_readings,
        AVG(session_duration) FILTER (WHERE session_state = 'completed') as avg_session_duration,
        AVG(accuracy_rating) FILTER (WHERE accuracy_rating IS NOT NULL) as avg_accuracy_rating
    FROM public.reading_sessions
    GROUP BY user_id
) rs_stats ON u.id = rs_stats.user_id
WHERE u.is_active = true;

-- Friend recommendations based on common interests
CREATE VIEW public.friend_recommendations AS
SELECT DISTINCT
    u1.id as user_id,
    u2.id as recommended_user_id,
    u2.username as recommended_username,
    u2.display_name as recommended_display_name,

    -- Calculate compatibility score
    (
        CASE WHEN u1.faction_alignment = u2.faction_alignment THEN 20 ELSE 0 END +
        CASE WHEN ABS(u1.karma_score - u2.karma_score) <= 20 THEN 15 ELSE 0 END +
        CASE WHEN up1.favorite_card_suit = up2.favorite_card_suit THEN 10 ELSE 0 END +
        CASE WHEN up1.preferred_voice = up2.preferred_voice THEN 5 ELSE 0 END
    ) as compatibility_score

FROM public.users u1
JOIN public.users u2 ON u1.id != u2.id
LEFT JOIN public.user_profiles up1 ON u1.id = up1.user_id
LEFT JOIN public.user_profiles up2 ON u2.id = up2.user_id
WHERE
    u1.is_active = true
    AND u2.is_active = true
    AND u2.allow_friend_requests = true
    AND u2.public_profile = true
    AND NOT EXISTS (
        SELECT 1 FROM public.user_friendships uf
        WHERE (uf.requester_id = u1.id AND uf.addressee_id = u2.id)
           OR (uf.requester_id = u2.id AND uf.addressee_id = u1.id)
    );

-- Insert default spread templates
INSERT INTO public.spread_templates (name, slug, description, card_count, position_names, position_meanings, layout_config, fallout_theme, difficulty_level) VALUES
('Single Wasteland Card', 'single_wasteland', 'A single card reading for quick guidance in the wasteland', 1,
 ARRAY['The Path'], ARRAY['Your current situation and immediate guidance'],
 '{"positions": [{"x": 50, "y": 50, "rotation": 0}]}', 'general', 'beginner'),

('Vault-Tec Spread', 'vault_tec_spread', 'Past, Present, Future - the classic three-card spread with Vault-Tec efficiency', 3,
 ARRAY['Past', 'Present', 'Future'], ARRAY['What brought you here', 'Your current state', 'Where you''re heading'],
 '{"positions": [{"x": 25, "y": 50, "rotation": 0}, {"x": 50, "y": 50, "rotation": 0}, {"x": 75, "y": 50, "rotation": 0}]}', 'vault_tec', 'beginner'),

('Wasteland Survival Spread', 'wasteland_survival', 'Five-card spread for navigating wasteland challenges', 5,
 ARRAY['Resources', 'Threats', 'Allies', 'Strategy', 'Outcome'],
 ARRAY['What you have to work with', 'Dangers to avoid', 'Who will help you', 'Best approach to take', 'Likely result'],
 '{"positions": [{"x": 20, "y": 30, "rotation": 0}, {"x": 80, "y": 30, "rotation": 0}, {"x": 20, "y": 70, "rotation": 0}, {"x": 80, "y": 70, "rotation": 0}, {"x": 50, "y": 50, "rotation": 0}]}', 'wasteland', 'intermediate'),

('Brotherhood Council', 'brotherhood_council', 'Seven-card circular spread representing the Brotherhood''s decision-making process', 7,
 ARRAY['Central Issue', 'Technology', 'Knowledge', 'Protection', 'Resources', 'Future', 'Wisdom'],
 ARRAY['The core matter at hand', 'Technological factors', 'Information you need', 'What needs defending', 'Available resources', 'Long-term implications', 'Final guidance'],
 '{"positions": [{"x": 50, "y": 50, "rotation": 0}, {"x": 50, "y": 20, "rotation": 0}, {"x": 75, "y": 35, "rotation": 0}, {"x": 75, "y": 65, "rotation": 0}, {"x": 50, "y": 80, "rotation": 0}, {"x": 25, "y": 65, "rotation": 0}, {"x": 25, "y": 35, "rotation": 0}]}', 'brotherhood', 'advanced');

-- Insert character interpretation templates
INSERT INTO public.interpretation_templates (character_voice, template_name, intro_phrases, card_interpretation_format, conclusion_phrases, personality_traits) VALUES
('pip_boy', 'Standard Analysis',
 ARRAY['*BEEP* Initiating tarot analysis...', 'Pip-Boy 3000 diagnostic complete...', 'Data processed. Results follow...'],
 'Statistical probability indicates: {meaning}. Cross-referencing with wasteland survival data suggests {advice}.',
 ARRAY['Analysis complete. Good luck out there!', '*BEEP* End of reading. Stay safe, wanderer.', 'Data saved to personal log. Pip-Boy out.'],
 '{"analytical": true, "technical": true, "helpful": true, "optimistic": false}'),

('vault_dweller', 'Naive Optimism',
 ARRAY['Oh gosh, let me help you figure this out!', 'Gee whiz, this is exciting!', 'Well golly, here''s what I see...'],
 'This card means {meaning}, which sounds really positive! I think {advice} would be the best thing to do!',
 ARRAY['I hope everything works out great for you!', 'Stay positive out there!', 'Gosh, I just know things will get better!'],
 '{"optimistic": true, "naive": true, "enthusiastic": true, "helpful": true}'),

('wasteland_trader', 'Practical Wisdom',
 ARRAY['Alright, let''s talk business...', 'Been around these parts long enough to know...', 'Here''s the deal, friend...'],
 'This here card shows {meaning}. In my experience, that means you should {advice}. Trust me, I''ve seen it all.',
 ARRAY['That''s my two caps worth.', 'Hope that helps your bottom line.', 'Good trading to you, partner.'],
 '{"practical": true, "experienced": true, "business_minded": true, "realistic": true}'),

('super_mutant', 'Simple Truth',
 ARRAY['SUPER MUTANT LOOK AT CARDS NOW.', 'HRMMM. SUPER MUTANT SEE...', 'CARDS SPEAK TO SUPER MUTANT...'],
 'CARD MEAN {meaning}. {advice}. IS SIMPLE.',
 ARRAY['SUPER MUTANT HELP GOOD.', 'GO NOW. BE STRONG.', 'SUPER MUTANT WISE. TRUST SUPER MUTANT.'],
 '{"direct": true, "simple": true, "wise": true, "protective": true}');

-- Add comments for enum values
COMMENT ON COLUMN public.wasteland_cards.suit IS 'MAJOR_ARCANA, NUKA_COLA_BOTTLES, COMBAT_WEAPONS, BOTTLE_CAPS, RADIATION_RODS';
COMMENT ON COLUMN public.users.faction_alignment IS 'brotherhood, ncr, legion, raiders, vault_dweller, independent';
COMMENT ON COLUMN public.user_profiles.preferred_voice IS 'pip_boy, vault_dweller, wasteland_trader, super_mutant, codsworth';
COMMENT ON COLUMN public.reading_sessions.session_state IS 'in_progress, completed, abandoned';
COMMENT ON COLUMN public.user_friendships.status IS 'pending, accepted, blocked, declined';
COMMENT ON COLUMN public.card_synergies.synergy_type IS 'complementary, conflicting, amplifying, neutralizing';

-- Final success message
SELECT 'Enhanced Wasteland Tarot Database Schema Created Successfully!
Tables: 12 core tables with full RLS
Indexes: 25+ optimized indexes for performance
Views: 3 utility views for common queries
Features: Achievements, Social, Karma tracking, Advanced spreads' as result;