-- Migration Script: Transform existing schema to optimized wasteland cards
-- This script safely migrates from the current enhanced schema to the new optimized version
-- Created: 2025-01-29

-- Begin transaction for safety
BEGIN;

-- Step 1: Backup existing data (optional but recommended)
-- CREATE TABLE wasteland_cards_backup AS SELECT * FROM public.wasteland_cards;

-- Step 2: Add new columns to existing table
ALTER TABLE public.wasteland_cards
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS character_voice_interpretations JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS pip_boy_interpretation TEXT,
ADD COLUMN IF NOT EXISTS super_mutant_interpretation TEXT,
ADD COLUMN IF NOT EXISTS ghoul_interpretation TEXT,
ADD COLUMN IF NOT EXISTS raider_interpretation TEXT,
ADD COLUMN IF NOT EXISTS brotherhood_scribe_interpretation TEXT,
ADD COLUMN IF NOT EXISTS vault_dweller_interpretation TEXT,
ADD COLUMN IF NOT EXISTS codsworth_interpretation TEXT,
ADD COLUMN IF NOT EXISTS wasteland_humor TEXT,
ADD COLUMN IF NOT EXISTS nuka_cola_reference TEXT,
ADD COLUMN IF NOT EXISTS special_ability TEXT,
ADD COLUMN IF NOT EXISTS audio_cue_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT false;

-- Step 3: Update existing constraint for radiation_factor (change range to 0.0-1.0)
ALTER TABLE public.wasteland_cards DROP CONSTRAINT IF EXISTS wasteland_cards_radiation_level_check;
ALTER TABLE public.wasteland_cards
ADD CONSTRAINT wasteland_cards_radiation_factor_check
CHECK (radiation_factor >= 0.0 AND radiation_factor <= 1.0);

-- Step 4: Normalize existing data
UPDATE public.wasteland_cards
SET
    -- Ensure number and card_number are consistent
    number = COALESCE(number, card_number),
    card_number = COALESCE(card_number, number),

    -- Set default keywords from existing data if available
    keywords = CASE
        WHEN upright_keywords IS NOT NULL THEN upright_keywords
        ELSE ARRAY[]::TEXT[]
    END,

    -- Migrate character interpretations to JSONB format
    character_voice_interpretations = jsonb_build_object(
        'PIP_BOY', COALESCE(pip_boy_analysis, ''),
        'SUPER_MUTANT', COALESCE(super_mutant_simplicity, ''),
        'GHOUL', COALESCE(wasteland_trader_wisdom, ''), -- Map existing fields creatively
        'RAIDER', COALESCE(raiders_significance, ''),
        'BROTHERHOOD_SCRIBE', COALESCE(brotherhood_significance, ''),
        'VAULT_DWELLER', COALESCE(vault_dweller_significance, ''),
        'CODSWORTH', COALESCE(codsworth_analysis, '')
    ),

    -- Copy to individual interpretation fields for better querying
    pip_boy_interpretation = COALESCE(pip_boy_analysis, ''),
    super_mutant_interpretation = COALESCE(super_mutant_simplicity, ''),
    ghoul_interpretation = COALESCE(wasteland_trader_wisdom, ''),
    raider_interpretation = COALESCE(raiders_significance, ''),
    brotherhood_scribe_interpretation = COALESCE(brotherhood_significance, ''),
    vault_dweller_interpretation = COALESCE(vault_dweller_significance, ''),
    codsworth_interpretation = COALESCE(codsworth_analysis, ''),

    -- Map other fields
    wasteland_humor = COALESCE(wasteland_humor, nuka_cola_reference),
    special_ability = COALESCE(special_ability, fallout_easter_egg),

    -- Normalize radiation factor to 0.0-1.0 range if needed
    radiation_factor = CASE
        WHEN radiation_level > 1.0 THEN radiation_level / 10.0
        ELSE COALESCE(radiation_level, radiation_factor, 0.0)
    END;

-- Step 5: Update completion status for existing cards
UPDATE public.wasteland_cards
SET is_complete = (
    upright_meaning IS NOT NULL AND upright_meaning != '' AND
    reversed_meaning IS NOT NULL AND reversed_meaning != '' AND
    (description IS NOT NULL OR fallout_reference IS NOT NULL) AND
    (character_voice_interpretations::text != '{}' OR pip_boy_interpretation IS NOT NULL)
);

-- Step 6: Remove redundant columns (be careful - backup first!)
-- Only uncomment these after confirming data migration was successful
/*
ALTER TABLE public.wasteland_cards
DROP COLUMN IF EXISTS upright_keywords,
DROP COLUMN IF EXISTS reversed_keywords,
DROP COLUMN IF EXISTS pip_boy_analysis,
DROP COLUMN IF EXISTS vault_dweller_perspective,
DROP COLUMN IF EXISTS wasteland_trader_wisdom,
DROP COLUMN IF EXISTS super_mutant_simplicity,
DROP COLUMN IF EXISTS codsworth_analysis,
DROP COLUMN IF EXISTS good_karma_interpretation,
DROP COLUMN IF EXISTS neutral_karma_interpretation,
DROP COLUMN IF EXISTS evil_karma_interpretation,
DROP COLUMN IF EXISTS brotherhood_significance,
DROP COLUMN IF EXISTS ncr_significance,
DROP COLUMN IF EXISTS legion_significance,
DROP COLUMN IF EXISTS raiders_significance,
DROP COLUMN IF EXISTS vault_dweller_significance,
DROP COLUMN IF EXISTS fallout_easter_egg,
DROP COLUMN IF EXISTS image_alt_text,
DROP COLUMN IF EXISTS geiger_intensity,
DROP COLUMN IF EXISTS draw_frequency,
DROP COLUMN IF EXISTS total_appearances,
DROP COLUMN IF EXISTS positive_feedback_count,
DROP COLUMN IF EXISTS negative_feedback_count,
DROP COLUMN IF EXISTS radiation_level,
DROP COLUMN IF EXISTS threat_level,
DROP COLUMN IF EXISTS vault_reference;
*/

-- Step 7: Create/update indexes for the new structure
DROP INDEX IF EXISTS idx_wasteland_cards_keywords_gin;
CREATE INDEX idx_wasteland_cards_keywords_gin
ON public.wasteland_cards USING gin(keywords);

DROP INDEX IF EXISTS idx_wasteland_cards_voices_gin;
CREATE INDEX idx_wasteland_cards_voices_gin
ON public.wasteland_cards USING gin(character_voice_interpretations);

DROP INDEX IF EXISTS idx_wasteland_cards_fts;
CREATE INDEX idx_wasteland_cards_fts
ON public.wasteland_cards USING gin(
    to_tsvector('english',
        COALESCE(name, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(upright_meaning, '') || ' ' ||
        COALESCE(reversed_meaning, '') || ' ' ||
        COALESCE(fallout_reference, '')
    )
);

CREATE INDEX IF NOT EXISTS idx_wasteland_cards_complete
ON public.wasteland_cards(is_complete);

-- Step 8: Update/recreate triggers
DROP TRIGGER IF EXISTS trigger_update_wasteland_cards_updated_at ON public.wasteland_cards;
DROP TRIGGER IF EXISTS trigger_setup_new_wasteland_card ON public.wasteland_cards;

-- Recreate the optimized triggers from the schema
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
        (NEW.description IS NOT NULL OR NEW.fallout_reference IS NOT NULL) AND NEW.description != '' AND
        NEW.fallout_reference IS NOT NULL AND NEW.fallout_reference != '' AND
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

-- Step 9: Create utility functions
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

-- Step 10: Validation - Check migration results
SELECT
    'Migration Progress Check' as status,
    COUNT(*) as total_cards,
    COUNT(*) FILTER (WHERE is_complete = true) as complete_cards,
    COUNT(*) FILTER (WHERE character_voice_interpretations::text != '{}') as cards_with_voices,
    COUNT(*) FILTER (WHERE description IS NOT NULL AND description != '') as cards_with_descriptions
FROM public.wasteland_cards
WHERE is_active = true;

-- Commit transaction if everything looks good
COMMIT;

-- Final message
SELECT 'Migration completed successfully!' as result,
       'Review the validation results above and test your application' as next_steps,
       'Uncomment the DROP COLUMN statements after confirming everything works' as cleanup;