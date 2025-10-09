-- Enhanced Wasteland Tarot Supabase Schema
-- Complete 78-card tarot system with Fallout theme
-- Created: 2025-01-28

-- Drop existing tables if they exist (for clean install)
DROP TABLE IF EXISTS public.reading_card_positions CASCADE;
DROP TABLE IF EXISTS public.reading_sessions CASCADE;
DROP TABLE IF EXISTS public.card_synergies CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.karma_history CASCADE;
DROP TABLE IF EXISTS public.user_friendships CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.interpretation_templates CASCADE;
DROP TABLE IF EXISTS public.spread_templates CASCADE;
DROP TABLE IF EXISTS public.wasteland_cards CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create custom types
CREATE TYPE wasteland_suit AS ENUM (
    'MAJOR_ARCANA',
    'NUKA_COLA_BOTTLES',
    'COMBAT_WEAPONS',
    'BOTTLE_CAPS',
    'RADIATION_RODS'
);

CREATE TYPE card_rarity AS ENUM ('common', 'uncommon', 'rare', 'legendary');

CREATE TYPE faction_alignment AS ENUM (
    'brotherhood',
    'ncr',
    'legion',
    'raiders',
    'vault_dweller',
    'independent'
);

CREATE TYPE character_voice AS ENUM (
    'pip_boy',
    'vault_dweller',
    'wasteland_trader',
    'super_mutant',
    'codsworth',
    'ghoul',
    'raider',
    'brotherhood_scribe'
);

CREATE TYPE karma_alignment AS ENUM ('good', 'neutral', 'evil');

CREATE TYPE session_state AS ENUM ('in_progress', 'completed', 'abandoned');

CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'blocked', 'declined');

CREATE TYPE synergy_type AS ENUM ('complementary', 'conflicting', 'amplifying', 'neutralizing');

CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'vault_dweller', 'overseer');

CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

CREATE TYPE notification_level AS ENUM ('none', 'minimal', 'normal', 'all');

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core Tables

-- Wasteland Cards Table - The heart of the tarot system
CREATE TABLE public.wasteland_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    suit wasteland_suit NOT NULL,
    number INTEGER CHECK (number >= 0 AND number <= 21),
    upright_meaning TEXT NOT NULL,
    reversed_meaning TEXT NOT NULL,
    radiation_level DECIMAL(3,2) DEFAULT 0.0 CHECK (radiation_level >= 0.0 AND radiation_level <= 1.0),
    threat_level DECIMAL(3,2) DEFAULT 0.0 CHECK (threat_level >= 0.0 AND threat_level <= 1.0),
    vault_reference INTEGER,
    upright_keywords TEXT[] DEFAULT '{}',
    reversed_keywords TEXT[] DEFAULT '{}',

    -- Character voice interpretations
    pip_boy_analysis TEXT,
    vault_dweller_perspective TEXT,
    wasteland_trader_wisdom TEXT,
    super_mutant_simplicity TEXT,
    codsworth_analysis TEXT,
    ghoul_wisdom TEXT,
    raider_insight TEXT,
    brotherhood_scribe_analysis TEXT,

    -- Karma-based interpretations
    good_karma_interpretation TEXT,
    neutral_karma_interpretation TEXT,
    evil_karma_interpretation TEXT,

    -- Faction perspectives
    brotherhood_significance TEXT,
    ncr_significance TEXT,
    legion_significance TEXT,
    raiders_significance TEXT,
    vault_dweller_significance TEXT,

    -- Fallout-specific content
    wasteland_humor TEXT,
    nuka_cola_reference TEXT,
    fallout_easter_egg TEXT,
    special_ability TEXT,
    fallout_lore TEXT,
    pre_war_reference TEXT,

    -- Media and presentation
    image_url TEXT,
    image_alt_text TEXT,
    audio_cue_url TEXT,

    -- Engagement metrics
    geiger_intensity DECIMAL(3,2) DEFAULT 0.5 CHECK (geiger_intensity >= 0.0 AND geiger_intensity <= 1.0),
    draw_frequency INTEGER DEFAULT 0,
    total_appearances INTEGER DEFAULT 0,
    positive_feedback_count INTEGER DEFAULT 0,
    negative_feedback_count INTEGER DEFAULT 0,

    -- Card properties
    rarity_level card_rarity DEFAULT 'common',
    element TEXT DEFAULT 'unknown',
    astrological_association TEXT,
    symbolism TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table
CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL CHECK (length(username) >= 3),
    display_name TEXT,
    bio TEXT CHECK (length(bio) <= 500),
    avatar_url TEXT,

    -- Fallout-specific profile
    faction_alignment faction_alignment DEFAULT 'vault_dweller',
    karma_score INTEGER DEFAULT 50 CHECK (karma_score >= -1000 AND karma_score <= 1000),
    vault_number INTEGER CHECK (vault_number > 0),
    wasteland_location TEXT DEFAULT 'Capital Wasteland',

    -- Account status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,

    -- Usage statistics
    total_readings INTEGER DEFAULT 0,
    daily_readings_count INTEGER DEFAULT 0,
    daily_readings_reset_date DATE DEFAULT CURRENT_DATE,
    accurate_predictions INTEGER DEFAULT 0,
    community_points INTEGER DEFAULT 0,
    experience_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1 CHECK (current_level >= 1),

    -- Privacy settings
    allow_friend_requests BOOLEAN DEFAULT true,
    public_profile BOOLEAN DEFAULT true,

    -- Security
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP WITH TIME ZONE,

    -- Compliance
    data_collection_consent BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Profiles Table - Extended user information
CREATE TABLE public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

    -- Preferences
    preferred_voice character_voice DEFAULT 'pip_boy',
    vault_backstory TEXT,
    faction_rank TEXT,

    -- S.P.E.C.I.A.L. stats
    special_strength INTEGER DEFAULT 5 CHECK (special_strength >= 1 AND special_strength <= 10),
    special_perception INTEGER DEFAULT 5 CHECK (special_perception >= 1 AND special_perception <= 10),
    special_endurance INTEGER DEFAULT 5 CHECK (special_endurance >= 1 AND special_endurance <= 10),
    special_charisma INTEGER DEFAULT 5 CHECK (special_charisma >= 1 AND special_charisma <= 10),
    special_intelligence INTEGER DEFAULT 5 CHECK (special_intelligence >= 1 AND special_intelligence <= 10),
    special_agility INTEGER DEFAULT 5 CHECK (special_agility >= 1 AND special_agility <= 10),
    special_luck INTEGER DEFAULT 5 CHECK (special_luck >= 1 AND special_luck <= 10),

    perks_unlocked TEXT[] DEFAULT '{}',
    favorite_card_suit wasteland_suit,
    preferred_spread_types TEXT[] DEFAULT '{}',
    interpretation_style TEXT DEFAULT 'balanced',

    -- Social metrics
    achievements_earned TEXT[] DEFAULT '{}',
    badges_collected TEXT[] DEFAULT '{}',
    milestone_dates JSONB DEFAULT '{}',
    friends_count INTEGER DEFAULT 0,
    readings_shared INTEGER DEFAULT 0,
    community_contributions INTEGER DEFAULT 0,
    reputation_score DECIMAL(3,1) DEFAULT 5.0 CHECK (reputation_score >= 0.0 AND reputation_score <= 10.0),

    -- Localization
    timezone TEXT DEFAULT 'UTC',
    language_preference TEXT DEFAULT 'en-US',
    accessibility_settings JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id)
);

-- User Preferences Table
CREATE TABLE public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

    -- Reading preferences
    default_character_voice character_voice DEFAULT 'pip_boy',
    auto_save_readings BOOLEAN DEFAULT true,
    share_readings_publicly BOOLEAN DEFAULT false,
    favorite_spread_types TEXT[] DEFAULT '{}',
    karma_influence_level TEXT DEFAULT 'moderate',

    -- UI preferences
    theme TEXT DEFAULT 'wasteland',
    pip_boy_color TEXT DEFAULT '#00FF00',
    terminal_effects BOOLEAN DEFAULT true,

    -- Audio preferences
    sound_effects BOOLEAN DEFAULT true,
    background_music BOOLEAN DEFAULT true,
    geiger_counter_volume DECIMAL(3,2) DEFAULT 0.7,
    voice_volume DECIMAL(3,2) DEFAULT 0.8,
    ambient_volume DECIMAL(3,2) DEFAULT 0.5,

    -- Visual preferences
    preferred_card_back TEXT DEFAULT 'vault_tec',
    card_animation_speed TEXT DEFAULT 'normal',
    show_radiation_effects BOOLEAN DEFAULT true,

    -- Notifications
    email_notifications BOOLEAN DEFAULT false,
    daily_reading_reminder BOOLEAN DEFAULT false,
    friend_activity_notifications BOOLEAN DEFAULT true,
    achievement_notifications BOOLEAN DEFAULT true,
    reading_reminder_time TIME,

    -- Privacy
    public_profile BOOLEAN DEFAULT true,
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

-- Spread Templates Table
CREATE TABLE public.spread_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    card_count INTEGER NOT NULL CHECK (card_count >= 1 AND card_count <= 22),
    position_names TEXT[] NOT NULL,
    position_meanings TEXT[] NOT NULL,
    layout_config JSONB NOT NULL DEFAULT '{}',

    -- Fallout theming
    fallout_theme TEXT,
    difficulty_level difficulty_level DEFAULT 'beginner',
    faction_association faction_alignment,

    -- Usage metrics
    usage_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,1) DEFAULT 0.0,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    creator_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interpretation Templates Table
CREATE TABLE public.interpretation_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character_voice character_voice NOT NULL,
    template_name TEXT NOT NULL,

    -- Template content
    intro_phrases TEXT[] DEFAULT '{}',
    card_interpretation_format TEXT NOT NULL,
    conclusion_phrases TEXT[] DEFAULT '{}',
    transition_phrases TEXT[] DEFAULT '{}',

    -- Voice characteristics
    personality_traits JSONB DEFAULT '{}',
    speaking_style TEXT NOT NULL,
    favorite_expressions TEXT[] DEFAULT '{}',
    fallout_references TEXT[] DEFAULT '{}',

    -- Usage
    is_active BOOLEAN DEFAULT true,
    usage_weight DECIMAL(3,2) DEFAULT 1.0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading Sessions Table
CREATE TABLE public.reading_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    spread_template_id UUID REFERENCES public.spread_templates(id),

    -- Session configuration
    session_state session_state DEFAULT 'in_progress',
    character_voice character_voice DEFAULT 'pip_boy',
    karma_influence TEXT,
    faction_influence faction_alignment,
    mood_context TEXT,
    location_context TEXT DEFAULT 'Capital Wasteland',

    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    session_duration INTEGER, -- seconds

    -- Results
    final_interpretation TEXT,
    user_feedback TEXT,
    accuracy_rating DECIMAL(3,1) CHECK (accuracy_rating >= 1.0 AND accuracy_rating <= 5.0),

    -- Privacy
    is_private BOOLEAN DEFAULT true,
    allow_public_sharing BOOLEAN DEFAULT false,
    share_with_friends BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading Card Positions Table
CREATE TABLE public.reading_card_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.reading_sessions(id) ON DELETE CASCADE,
    card_id UUID REFERENCES public.wasteland_cards(id),

    -- Position info
    position_index INTEGER NOT NULL CHECK (position_index >= 0),
    position_name TEXT NOT NULL,
    position_meaning TEXT,
    is_reversed BOOLEAN DEFAULT false,

    -- Timing and interpretation
    drawn_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    individual_interpretation TEXT,
    position_significance TEXT,
    card_synergy_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(session_id, position_index)
);

-- Card Synergies Table
CREATE TABLE public.card_synergies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    primary_card_id UUID REFERENCES public.wasteland_cards(id),
    secondary_card_id UUID REFERENCES public.wasteland_cards(id),

    -- Synergy details
    synergy_type synergy_type NOT NULL,
    synergy_strength DECIMAL(3,2) CHECK (synergy_strength >= 0.0 AND synergy_strength <= 1.0),
    synergy_description TEXT,

    -- Conditions
    applicable_spreads TEXT[] DEFAULT '{}',
    position_requirements JSONB DEFAULT '{}',
    karma_conditions TEXT[] DEFAULT '{}',
    faction_conditions TEXT[] DEFAULT '{}',

    -- Analytics
    occurrence_count INTEGER DEFAULT 0,
    user_feedback_score DECIMAL(3,1) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CHECK (primary_card_id != secondary_card_id)
);

-- User Achievements Table
CREATE TABLE public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    achievement_description TEXT,
    achievement_category TEXT,

    -- Progress tracking
    current_progress INTEGER DEFAULT 0,
    required_progress INTEGER NOT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0.0 CHECK (progress_percentage >= 0.0 AND progress_percentage <= 100.0),
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Rewards
    experience_reward INTEGER DEFAULT 0,
    community_points_reward INTEGER DEFAULT 0,
    special_rewards JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, achievement_id)
);

-- Karma History Table
CREATE TABLE public.karma_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

    -- Karma change details
    previous_karma INTEGER NOT NULL,
    new_karma INTEGER NOT NULL,
    karma_change INTEGER NOT NULL,
    change_reason TEXT NOT NULL,
    related_reading_id UUID REFERENCES public.reading_sessions(id),
    related_action TEXT,

    -- Change metadata
    automatic_change BOOLEAN DEFAULT true,
    admin_override BOOLEAN DEFAULT false,
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Friendships Table
CREATE TABLE public.user_friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    addressee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

    -- Friendship details
    status friendship_status DEFAULT 'pending',
    established_at TIMESTAMP WITH TIME ZONE,

    -- Permissions
    can_view_readings BOOLEAN DEFAULT false,
    can_comment_readings BOOLEAN DEFAULT false,
    notification_level notification_level DEFAULT 'normal',

    -- Social metrics
    shared_readings_count INTEGER DEFAULT 0,
    mutual_friends_count INTEGER DEFAULT 0,
    last_interaction TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CHECK (requester_id != addressee_id),
    UNIQUE(requester_id, addressee_id)
);

-- Views for common queries

-- Popular Cards View
CREATE VIEW public.popular_cards AS
SELECT
    wc.*,
    wc.total_appearances as current_usage_count,
    CASE
        WHEN (wc.positive_feedback_count + wc.negative_feedback_count) > 0
        THEN ROUND((wc.positive_feedback_count::DECIMAL / (wc.positive_feedback_count + wc.negative_feedback_count)) * 5.0, 1)
        ELSE 3.0
    END as average_user_rating
FROM public.wasteland_cards wc
WHERE wc.is_active = true
ORDER BY wc.total_appearances DESC, average_user_rating DESC;

-- User Statistics View
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

    -- Calculated stats
    COALESCE(reading_stats.completed_readings, 0) as completed_readings,
    COALESCE(reading_stats.avg_session_duration, 0) as avg_session_duration,
    COALESCE(reading_stats.avg_accuracy_rating, 0) as avg_accuracy_rating,
    COALESCE(array_length(up.achievements_earned, 1), 0) as total_achievements,

    -- Karma title
    CASE
        WHEN u.karma_score >= 750 THEN 'Wasteland Saint'
        WHEN u.karma_score >= 500 THEN 'Good Samaritan'
        WHEN u.karma_score >= 250 THEN 'Good Natured'
        WHEN u.karma_score > -250 THEN 'Neutral'
        WHEN u.karma_score > -500 THEN 'Scoundrel'
        WHEN u.karma_score > -750 THEN 'Evil'
        ELSE 'Very Evil'
    END as karma_title

FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN (
    SELECT
        user_id,
        COUNT(*) as completed_readings,
        AVG(session_duration) as avg_session_duration,
        AVG(accuracy_rating) as avg_accuracy_rating
    FROM public.reading_sessions
    WHERE session_state = 'completed'
    GROUP BY user_id
) reading_stats ON u.id = reading_stats.user_id
WHERE u.is_active = true;

-- Friend Recommendations View
CREATE VIEW public.friend_recommendations AS
WITH user_similarities AS (
    SELECT DISTINCT
        u1.id as user_id,
        u2.id as recommended_user_id,
        u2.username as recommended_username,
        u2.display_name as recommended_display_name,

        -- Calculate compatibility score based on various factors
        (
            -- Faction alignment similarity (30% weight)
            CASE WHEN up1.faction_alignment = up2.faction_alignment THEN 30 ELSE 0 END +

            -- Karma alignment similarity (25% weight)
            CASE
                WHEN ABS(u1.karma_score - u2.karma_score) <= 100 THEN 25
                WHEN ABS(u1.karma_score - u2.karma_score) <= 300 THEN 15
                ELSE 5
            END +

            -- Similar reading count (20% weight)
            CASE
                WHEN ABS(u1.total_readings - u2.total_readings) <= 10 THEN 20
                WHEN ABS(u1.total_readings - u2.total_readings) <= 50 THEN 10
                ELSE 5
            END +

            -- Similar level (15% weight)
            CASE
                WHEN ABS(u1.current_level - u2.current_level) <= 2 THEN 15
                WHEN ABS(u1.current_level - u2.current_level) <= 5 THEN 8
                ELSE 2
            END +

            -- Activity similarity (10% weight)
            CASE
                WHEN u1.last_login IS NOT NULL AND u2.last_login IS NOT NULL
                     AND ABS(EXTRACT(EPOCH FROM (u1.last_login - u2.last_login))) <= 86400 THEN 10
                ELSE 5
            END
        ) as compatibility_score

    FROM public.users u1
    CROSS JOIN public.users u2
    LEFT JOIN public.user_profiles up1 ON u1.id = up1.user_id
    LEFT JOIN public.user_profiles up2 ON u2.id = up2.user_id
    WHERE u1.id != u2.id
        AND u1.is_active = true
        AND u2.is_active = true
        AND u1.allow_friend_requests = true
        AND u2.public_profile = true
        -- Not already friends
        AND NOT EXISTS (
            SELECT 1 FROM public.user_friendships uf
            WHERE (uf.requester_id = u1.id AND uf.addressee_id = u2.id)
               OR (uf.requester_id = u2.id AND uf.addressee_id = u1.id)
        )
)
SELECT * FROM user_similarities
WHERE compatibility_score >= 50
ORDER BY user_id, compatibility_score DESC;

-- Indexes for performance

-- Primary search indexes
CREATE INDEX idx_wasteland_cards_suit_number ON public.wasteland_cards(suit, number) WHERE is_active = true;
CREATE INDEX idx_wasteland_cards_active_rarity ON public.wasteland_cards(is_active, rarity_level);
CREATE INDEX idx_wasteland_cards_popularity ON public.wasteland_cards(total_appearances DESC) WHERE is_active = true;

-- User indexes
CREATE INDEX idx_users_username_lower ON public.users(LOWER(username));
CREATE INDEX idx_users_faction_karma ON public.users(faction_alignment, karma_score) WHERE is_active = true;
CREATE INDEX idx_users_last_login ON public.users(last_login DESC) WHERE is_active = true;

-- Reading session indexes
CREATE INDEX idx_reading_sessions_user_completed ON public.reading_sessions(user_id, completed_at DESC) WHERE session_state = 'completed';
CREATE INDEX idx_reading_sessions_public ON public.reading_sessions(allow_public_sharing, completed_at DESC) WHERE allow_public_sharing = true;
CREATE INDEX idx_reading_sessions_character_voice ON public.reading_sessions(character_voice, session_state);

-- Card position indexes
CREATE INDEX idx_reading_card_positions_session ON public.reading_card_positions(session_id, position_index);
CREATE INDEX idx_reading_card_positions_card ON public.reading_card_positions(card_id, drawn_at DESC);

-- Social features indexes
CREATE INDEX idx_user_friendships_requester_status ON public.user_friendships(requester_id, status);
CREATE INDEX idx_user_friendships_addressee_status ON public.user_friendships(addressee_id, status);
CREATE INDEX idx_user_friendships_established ON public.user_friendships(established_at DESC) WHERE status = 'accepted';

-- Achievement indexes
CREATE INDEX idx_user_achievements_category_completed ON public.user_achievements(achievement_category, is_completed);
CREATE INDEX idx_user_achievements_progress ON public.user_achievements(progress_percentage DESC) WHERE is_completed = false;

-- Karma history indexes
CREATE INDEX idx_karma_history_user_date ON public.karma_history(user_id, created_at DESC);
CREATE INDEX idx_karma_history_reading ON public.karma_history(related_reading_id) WHERE related_reading_id IS NOT NULL;

-- Full-text search indexes
CREATE INDEX idx_wasteland_cards_search ON public.wasteland_cards USING gin(
    to_tsvector('english', name || ' ' || upright_meaning || ' ' || reversed_meaning)
) WHERE is_active = true;

-- Triggers for automatic updates

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_wasteland_cards_updated_at BEFORE UPDATE ON public.wasteland_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spread_templates_updated_at BEFORE UPDATE ON public.spread_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interpretation_templates_updated_at BEFORE UPDATE ON public.interpretation_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reading_sessions_updated_at BEFORE UPDATE ON public.reading_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_achievements_updated_at BEFORE UPDATE ON public.user_achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_friendships_updated_at BEFORE UPDATE ON public.user_friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
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

-- Public read access to cards and templates
CREATE POLICY "Public cards are viewable by everyone" ON public.wasteland_cards
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public spread templates are viewable by everyone" ON public.spread_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public interpretation templates are viewable by everyone" ON public.interpretation_templates
    FOR SELECT USING (is_active = true);

-- Users can view their own data and public profiles
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id OR public_profile = true);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- User profiles follow user privacy settings
CREATE POLICY "User profiles follow privacy settings" ON public.user_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND public_profile = true)
    );

CREATE POLICY "Users can update own user profile" ON public.user_profiles
    FOR ALL USING (user_id = auth.uid());

-- User preferences are private
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR ALL USING (user_id = auth.uid());

-- Reading sessions privacy
CREATE POLICY "Users can view own readings and public readings" ON public.reading_sessions
    FOR SELECT USING (
        user_id = auth.uid() OR
        (allow_public_sharing = true AND session_state = 'completed') OR
        (share_with_friends = true AND EXISTS (
            SELECT 1 FROM public.user_friendships
            WHERE ((requester_id = auth.uid() AND addressee_id = user_id) OR
                   (requester_id = user_id AND addressee_id = auth.uid()))
            AND status = 'accepted' AND can_view_readings = true
        ))
    );

CREATE POLICY "Users can manage own reading sessions" ON public.reading_sessions
    FOR ALL USING (user_id = auth.uid());

-- Card positions follow reading session access
CREATE POLICY "Card positions follow session access" ON public.reading_card_positions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.reading_sessions rs
        WHERE rs.id = session_id AND (
            rs.user_id = auth.uid() OR
            (rs.allow_public_sharing = true AND rs.session_state = 'completed') OR
            (rs.share_with_friends = true AND EXISTS (
                SELECT 1 FROM public.user_friendships
                WHERE ((requester_id = auth.uid() AND addressee_id = rs.user_id) OR
                       (requester_id = rs.user_id AND addressee_id = auth.uid()))
                AND status = 'accepted' AND can_view_readings = true
            ))
        )
    ));

CREATE POLICY "Users can manage own reading card positions" ON public.reading_card_positions
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.reading_sessions rs
        WHERE rs.id = session_id AND rs.user_id = auth.uid()
    ));

-- User achievements are viewable by friends or public profile users
CREATE POLICY "User achievements follow profile privacy" ON public.user_achievements
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND public_profile = true)
    );

CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR ALL USING (user_id = auth.uid());

-- Karma history is private to user
CREATE POLICY "Users can view own karma history" ON public.karma_history
    FOR ALL USING (user_id = auth.uid());

-- Friendship policies
CREATE POLICY "Users can view friendships they're involved in" ON public.user_friendships
    FOR SELECT USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "Users can manage friendships they're involved in" ON public.user_friendships
    FOR ALL USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Card synergies are publicly viewable
CREATE POLICY "Card synergies are publicly viewable" ON public.card_synergies
    FOR SELECT USING (is_active = true);

-- Grant permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant read access to anonymous users for public data
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.wasteland_cards TO anon;
GRANT SELECT ON public.spread_templates TO anon;
GRANT SELECT ON public.interpretation_templates TO anon;

COMMIT;

-- Success message
SELECT 'Enhanced Wasteland Tarot schema created successfully!
Ready for 78-card tarot system with full Fallout theming.
Next: Run card data insertion script.' as result;