-- Optimized Wasteland Tarot Cards Schema
-- Designed to match DetailedTarotCard TypeScript interface exactly
-- Created: 2025-01-29

-- Enable necessary extensions first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop existing table if needed (be careful in production!)
-- DROP TABLE IF EXISTS public.wasteland_cards CASCADE;

-- Create optimized wasteland_cards table
CREATE TABLE IF NOT EXISTS public.wasteland_cards (
    -- Primary identification (matches DetailedTarotCard interface)
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,

    -- Card classification
    suit VARCHAR(50) NOT NULL,
    card_number INTEGER, -- matches card_number in interface
    number INTEGER,      -- also matches number in interface (for compatibility)

    -- Core tarot meanings (exact interface match)
    upright_meaning TEXT NOT NULL,
    reversed_meaning TEXT NOT NULL,
    description TEXT,
    keywords TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Visual representation
    image_url VARCHAR(500) NOT NULL,

    -- Fallout-specific attributes (matching interface)
    radiation_factor DECIMAL(3,2) DEFAULT 0.0 CHECK (radiation_factor >= 0.0 AND radiation_factor <= 1.0),
    karma_alignment VARCHAR(20) DEFAULT 'NEUTRAL' CHECK (karma_alignment IN ('GOOD', 'NEUTRAL', 'EVIL')),
    fallout_reference TEXT,

    -- Symbolism and spiritual aspects
    symbolism TEXT,
    element VARCHAR(50),
    astrological_association TEXT,

    -- Character voice interpretations (JSONB for flexibility)
    character_voice_interpretations JSONB DEFAULT '{}'::jsonb,

    -- Extended Fallout universe elements
    vault_reference INTEGER,
    threat_level INTEGER DEFAULT 1 CHECK (threat_level >= 1 AND threat_level <= 10),
    faction_significance JSONB DEFAULT '{}'::jsonb, -- Store multiple faction meanings

    -- Enhanced character voices (individual columns for better querying)
    pip_boy_interpretation TEXT,
    super_mutant_interpretation TEXT,
    ghoul_interpretation TEXT,
    raider_interpretation TEXT,
    brotherhood_scribe_interpretation TEXT,
    vault_dweller_interpretation TEXT,
    codsworth_interpretation TEXT,

    -- Additional Fallout flavor
    wasteland_humor TEXT,
    nuka_cola_reference TEXT,
    special_ability TEXT,

    -- Audio and visual enhancements
    audio_cue_url VARCHAR(500),
    geiger_intensity DECIMAL(3,2) DEFAULT 0.1,

    -- Usage and feedback statistics
    draw_frequency INTEGER DEFAULT 0,
    total_appearances INTEGER DEFAULT 0,
    positive_feedback INTEGER DEFAULT 0,
    negative_feedback INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.0,

    -- Metadata and status
    rarity_level VARCHAR(20) DEFAULT 'common' CHECK (rarity_level IN ('common', 'uncommon', 'rare', 'legendary', 'unique')),
    is_active BOOLEAN DEFAULT true,
    is_complete BOOLEAN DEFAULT false, -- Track if all interpretations are filled

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create optimized indexes for performance
CREATE INDEX IF NOT EXISTS idx_wasteland_cards_suit_number ON public.wasteland_cards(suit, card_number);
CREATE INDEX IF NOT EXISTS idx_wasteland_cards_active ON public.wasteland_cards(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_wasteland_cards_radiation ON public.wasteland_cards(radiation_factor);
CREATE INDEX IF NOT EXISTS idx_wasteland_cards_karma ON public.wasteland_cards(karma_alignment);
CREATE INDEX IF NOT EXISTS idx_wasteland_cards_rarity ON public.wasteland_cards(rarity_level);
CREATE INDEX IF NOT EXISTS idx_wasteland_cards_complete ON public.wasteland_cards(is_complete);

-- GIN index for keyword search
CREATE INDEX IF NOT EXISTS idx_wasteland_cards_keywords_gin
ON public.wasteland_cards USING gin(keywords);

-- GIN index for character voice interpretations JSON
CREATE INDEX IF NOT EXISTS idx_wasteland_cards_voices_gin
ON public.wasteland_cards USING gin(character_voice_interpretations);

-- Full text search index for descriptions and meanings
CREATE INDEX IF NOT EXISTS idx_wasteland_cards_fts
ON public.wasteland_cards USING gin(
    to_tsvector('english',
        COALESCE(name, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(upright_meaning, '') || ' ' ||
        COALESCE(reversed_meaning, '') || ' ' ||
        COALESCE(fallout_reference, '')
    )
);

-- Create trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_wasteland_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();

    -- Auto-update number field to match card_number if not set
    IF NEW.number IS NULL AND NEW.card_number IS NOT NULL THEN
        NEW.number = NEW.card_number;
    END IF;

    -- Update completion status based on key fields
    NEW.is_complete = (
        NEW.upright_meaning IS NOT NULL AND NEW.upright_meaning != '' AND
        NEW.reversed_meaning IS NOT NULL AND NEW.reversed_meaning != '' AND
        NEW.description IS NOT NULL AND NEW.description != '' AND
        NEW.fallout_reference IS NOT NULL AND NEW.fallout_reference != '' AND
        NEW.symbolism IS NOT NULL AND NEW.symbolism != '' AND
        (
            NEW.character_voice_interpretations::text != '{}'::text OR
            NEW.pip_boy_interpretation IS NOT NULL
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wasteland_cards_updated_at
    BEFORE UPDATE ON public.wasteland_cards
    FOR EACH ROW EXECUTE FUNCTION update_wasteland_cards_updated_at();

-- Create trigger for initial setup on INSERT
CREATE OR REPLACE FUNCTION setup_new_wasteland_card()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure number matches card_number
    IF NEW.number IS NULL AND NEW.card_number IS NOT NULL THEN
        NEW.number = NEW.card_number;
    ELSIF NEW.card_number IS NULL AND NEW.number IS NOT NULL THEN
        NEW.card_number = NEW.number;
    END IF;

    -- Set up default character voice interpretations structure if empty
    IF NEW.character_voice_interpretations::text = '{}'::text THEN
        NEW.character_voice_interpretations = jsonb_build_object(
            'PIP_BOY', COALESCE(NEW.pip_boy_interpretation, ''),
            'SUPER_MUTANT', COALESCE(NEW.super_mutant_interpretation, ''),
            'GHOUL', COALESCE(NEW.ghoul_interpretation, ''),
            'RAIDER', COALESCE(NEW.raider_interpretation, ''),
            'BROTHERHOOD_SCRIBE', COALESCE(NEW.brotherhood_scribe_interpretation, ''),
            'VAULT_DWELLER', COALESCE(NEW.vault_dweller_interpretation, ''),
            'CODSWORTH', COALESCE(NEW.codsworth_interpretation, '')
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_setup_new_wasteland_card
    BEFORE INSERT ON public.wasteland_cards
    FOR EACH ROW EXECUTE FUNCTION setup_new_wasteland_card();

-- Enable Row Level Security
ALTER TABLE public.wasteland_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wasteland_cards
CREATE POLICY "Anyone can read active wasteland cards" ON public.wasteland_cards
    FOR SELECT USING (is_active = true);

-- Only authenticated users can modify cards (you might want to restrict this further)
CREATE POLICY "Authenticated users can insert cards" ON public.wasteland_cards
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update cards" ON public.wasteland_cards
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Utility functions for card management

-- Function to get card with all interpretations
CREATE OR REPLACE FUNCTION get_detailed_card(card_id VARCHAR(100))
RETURNS TABLE (
    id VARCHAR(100),
    name VARCHAR(200),
    suit VARCHAR(50),
    card_number INTEGER,
    number INTEGER,
    upright_meaning TEXT,
    reversed_meaning TEXT,
    description TEXT,
    keywords TEXT[],
    image_url VARCHAR(500),
    radiation_factor DECIMAL(3,2),
    karma_alignment VARCHAR(20),
    fallout_reference TEXT,
    symbolism TEXT,
    element VARCHAR(50),
    astrological_association TEXT,
    character_voice_interpretations JSONB,
    rarity_level VARCHAR(20),
    is_complete BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        wc.id,
        wc.name,
        wc.suit,
        wc.card_number,
        wc.number,
        wc.upright_meaning,
        wc.reversed_meaning,
        wc.description,
        wc.keywords,
        wc.image_url,
        wc.radiation_factor,
        wc.karma_alignment,
        wc.fallout_reference,
        wc.symbolism,
        wc.element,
        wc.astrological_association,
        wc.character_voice_interpretations,
        wc.rarity_level,
        wc.is_complete
    FROM public.wasteland_cards wc
    WHERE wc.id = card_id AND wc.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to search cards by keywords
CREATE OR REPLACE FUNCTION search_cards(search_term TEXT, suit_filter VARCHAR(50) DEFAULT NULL)
RETURNS TABLE (
    id VARCHAR(100),
    name VARCHAR(200),
    suit VARCHAR(50),
    upright_meaning TEXT,
    radiation_factor DECIMAL(3,2),
    karma_alignment VARCHAR(20),
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        wc.id,
        wc.name,
        wc.suit,
        wc.upright_meaning,
        wc.radiation_factor,
        wc.karma_alignment,
        ts_rank(
            to_tsvector('english',
                COALESCE(wc.name, '') || ' ' ||
                COALESCE(wc.description, '') || ' ' ||
                COALESCE(wc.upright_meaning, '') || ' ' ||
                COALESCE(wc.fallout_reference, '')
            ),
            plainto_tsquery('english', search_term)
        ) as relevance_score
    FROM public.wasteland_cards wc
    WHERE
        wc.is_active = true
        AND (suit_filter IS NULL OR wc.suit = suit_filter)
        AND (
            to_tsvector('english',
                COALESCE(wc.name, '') || ' ' ||
                COALESCE(wc.description, '') || ' ' ||
                COALESCE(wc.upright_meaning, '') || ' ' ||
                COALESCE(wc.fallout_reference, '')
            ) @@ plainto_tsquery('english', search_term)
            OR search_term = ANY(wc.keywords)
        )
    ORDER BY relevance_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Create view for easy card statistics
CREATE OR REPLACE VIEW card_statistics AS
SELECT
    suit,
    COUNT(*) as total_cards,
    COUNT(*) FILTER (WHERE is_complete = true) as complete_cards,
    ROUND(AVG(radiation_factor), 2) as avg_radiation,
    COUNT(*) FILTER (WHERE karma_alignment = 'GOOD') as good_karma_cards,
    COUNT(*) FILTER (WHERE karma_alignment = 'NEUTRAL') as neutral_karma_cards,
    COUNT(*) FILTER (WHERE karma_alignment = 'EVIL') as evil_karma_cards,
    COUNT(*) FILTER (WHERE rarity_level = 'legendary') as legendary_cards
FROM public.wasteland_cards
WHERE is_active = true
GROUP BY suit
ORDER BY suit;

-- Comments for documentation
COMMENT ON TABLE public.wasteland_cards IS 'Comprehensive wasteland tarot cards with Fallout theming and character interpretations';
COMMENT ON COLUMN public.wasteland_cards.character_voice_interpretations IS 'JSON object containing interpretations from different Fallout characters';
COMMENT ON COLUMN public.wasteland_cards.radiation_factor IS 'Radiation level from 0.0 to 1.0 affecting card danger level';
COMMENT ON COLUMN public.wasteland_cards.karma_alignment IS 'Moral alignment: GOOD, NEUTRAL, or EVIL';
COMMENT ON COLUMN public.wasteland_cards.is_complete IS 'Auto-calculated field indicating if all required interpretations are filled';
COMMENT ON FUNCTION get_detailed_card(VARCHAR) IS 'Retrieve complete card information including all interpretations';
COMMENT ON FUNCTION search_cards(TEXT, VARCHAR) IS 'Full-text search across card content with optional suit filtering';

-- Final success message
SELECT 'Optimized Wasteland Tarot Cards Schema Created Successfully!' as status,
       'Schema matches DetailedTarotCard TypeScript interface exactly' as compatibility,
       'Includes full-text search, character voices, and Fallout theming' as features;