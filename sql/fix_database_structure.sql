-- Critical Database Structure Fix for Wasteland Cards
-- This script addresses the mismatches between current database and expected structure
-- Created: 2025-01-29

BEGIN;

-- Step 1: Create backup of current data
CREATE TABLE IF NOT EXISTS wasteland_cards_backup_20250129 AS
SELECT * FROM public.wasteland_cards;

-- Step 2: Fix suit enum to match expected values
-- First check what suits we currently have
SELECT DISTINCT suit, COUNT(*) as count
FROM public.wasteland_cards
WHERE is_active = true
GROUP BY suit
ORDER BY suit;

-- Update Chinese suits to English enum values
UPDATE public.wasteland_cards SET
suit = CASE
    WHEN suit IN ('大阿爾克那', 'major_arcana') THEN 'MAJOR_ARCANA'
    WHEN suit IN ('輻射棒', '權杖', 'radiation_rods') THEN 'RADIATION_RODS'
    WHEN suit IN ('戰鬥武器', '寶劍', 'combat_weapons') THEN 'COMBAT_WEAPONS'
    WHEN suit IN ('瓶蓋', '錢幣', 'bottle_caps') THEN 'BOTTLE_CAPS'
    WHEN suit IN ('可樂瓶', '聖杯', 'nuka_cola_bottles') THEN 'NUKA_COLA_BOTTLES'
    ELSE suit
END;

-- Step 3: Fix ID format issue (convert UUID to string format if needed)
-- Update IDs to match expected string format for seed data compatibility
UPDATE public.wasteland_cards SET id =
CASE
    -- Major Arcana cards (0-21)
    WHEN suit = 'MAJOR_ARCANA' AND number = 0 THEN '0'
    WHEN suit = 'MAJOR_ARCANA' AND number = 1 THEN '1'
    WHEN suit = 'MAJOR_ARCANA' AND number = 2 THEN '2'
    WHEN suit = 'MAJOR_ARCANA' AND number = 4 THEN '3' -- Assuming Overseer is Emperor (4)
    -- Add other major arcana mappings as needed

    -- Minor Arcana - format as suit_number
    WHEN suit = 'RADIATION_RODS' THEN 'rad_' || number::text
    WHEN suit = 'COMBAT_WEAPONS' THEN 'weapon_' || number::text
    WHEN suit = 'BOTTLE_CAPS' THEN 'cap_' || number::text
    WHEN suit = 'NUKA_COLA_BOTTLES' THEN 'nuka_' || number::text

    ELSE id -- Keep existing ID if no mapping needed
END
WHERE id ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'; -- Only update UUID format IDs

-- Step 4: Standardize field names to match optimized schema
-- Add missing columns that exist in TypeScript interface but not in DB
ALTER TABLE public.wasteland_cards
ADD COLUMN IF NOT EXISTS card_number INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS radiation_factor DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS karma_alignment VARCHAR(20) DEFAULT 'NEUTRAL',
ADD COLUMN IF NOT EXISTS fallout_reference TEXT,
ADD COLUMN IF NOT EXISTS symbolism TEXT,
ADD COLUMN IF NOT EXISTS element VARCHAR(50),
ADD COLUMN IF NOT EXISTS astrological_association TEXT,
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

-- Step 5: Migrate existing data to new structure
UPDATE public.wasteland_cards SET
    -- Ensure card_number matches number
    card_number = COALESCE(card_number, number),

    -- Migrate radiation_level to radiation_factor (normalize to 0-1 range)
    radiation_factor = CASE
        WHEN radiation_level > 1.0 THEN LEAST(radiation_level / 10.0, 1.0)
        ELSE COALESCE(radiation_level, 0.0)
    END,

    -- Set up character voice interpretations JSON
    character_voice_interpretations = jsonb_build_object(
        'PIP_BOY', COALESCE(pip_boy_analysis, pip_boy_interpretation, ''),
        'SUPER_MUTANT', COALESCE(super_mutant_simplicity, super_mutant_interpretation, ''),
        'GHOUL', COALESCE(ghoul_wisdom, ghoul_interpretation, ''),
        'RAIDER', COALESCE(raider_insight, raider_interpretation, ''),
        'BROTHERHOOD_SCRIBE', COALESCE(brotherhood_scribe_analysis, brotherhood_scribe_interpretation, ''),
        'VAULT_DWELLER', COALESCE(vault_dweller_perspective, vault_dweller_interpretation, ''),
        'CODSWORTH', COALESCE(codsworth_analysis, codsworth_interpretation, '')
    ),

    -- Copy to individual interpretation fields for easier querying
    pip_boy_interpretation = COALESCE(pip_boy_analysis, pip_boy_interpretation),
    super_mutant_interpretation = COALESCE(super_mutant_simplicity, super_mutant_interpretation),
    ghoul_interpretation = COALESCE(ghoul_wisdom, ghoul_interpretation),
    raider_interpretation = COALESCE(raider_insight, raider_interpretation),
    brotherhood_scribe_interpretation = COALESCE(brotherhood_scribe_analysis, brotherhood_scribe_interpretation),
    vault_dweller_interpretation = COALESCE(vault_dweller_perspective, vault_dweller_interpretation),
    codsworth_interpretation = COALESCE(codsworth_analysis, codsworth_interpretation),

    -- Map other fields
    fallout_reference = COALESCE(fallout_lore, pre_war_reference, fallout_reference),
    wasteland_humor = COALESCE(wasteland_humor, nuka_cola_reference),
    special_ability = COALESCE(special_ability, fallout_easter_egg),

    -- Set keywords from existing data
    keywords = CASE
        WHEN upright_keywords IS NOT NULL THEN upright_keywords
        ELSE ARRAY[]::TEXT[]
    END,

    -- Set karma alignment based on existing karma interpretations
    karma_alignment = CASE
        WHEN good_karma_interpretation IS NOT NULL AND good_karma_interpretation != '' THEN 'GOOD'
        WHEN evil_karma_interpretation IS NOT NULL AND evil_karma_interpretation != '' THEN 'EVIL'
        ELSE 'NEUTRAL'
    END;

-- Step 6: Update completion status
UPDATE public.wasteland_cards SET
is_complete = (
    upright_meaning IS NOT NULL AND upright_meaning != '' AND
    reversed_meaning IS NOT NULL AND reversed_meaning != '' AND
    (
        character_voice_interpretations::text != '{}'::text OR
        pip_boy_interpretation IS NOT NULL AND pip_boy_interpretation != ''
    )
);

-- Step 7: Add proper constraints
ALTER TABLE public.wasteland_cards
DROP CONSTRAINT IF EXISTS wasteland_cards_radiation_factor_check,
ADD CONSTRAINT wasteland_cards_radiation_factor_check
CHECK (radiation_factor >= 0.0 AND radiation_factor <= 1.0);

ALTER TABLE public.wasteland_cards
DROP CONSTRAINT IF EXISTS wasteland_cards_karma_alignment_check,
ADD CONSTRAINT wasteland_cards_karma_alignment_check
CHECK (karma_alignment IN ('GOOD', 'NEUTRAL', 'EVIL'));

-- Step 8: Create/update essential indexes
DROP INDEX IF EXISTS idx_wasteland_cards_suit_number;
CREATE INDEX idx_wasteland_cards_suit_number ON public.wasteland_cards(suit, card_number);

DROP INDEX IF EXISTS idx_wasteland_cards_active;
CREATE INDEX idx_wasteland_cards_active ON public.wasteland_cards(is_active) WHERE is_active = true;

DROP INDEX IF EXISTS idx_wasteland_cards_complete;
CREATE INDEX idx_wasteland_cards_complete ON public.wasteland_cards(is_complete);

-- Step 9: Update triggers to handle the new structure
CREATE OR REPLACE FUNCTION update_wasteland_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();

    -- Sync number and card_number
    IF NEW.number IS NULL AND NEW.card_number IS NOT NULL THEN
        NEW.number = NEW.card_number;
    ELSIF NEW.card_number IS NULL AND NEW.number IS NOT NULL THEN
        NEW.card_number = NEW.number;
    END IF;

    -- Update completion status
    NEW.is_complete = (
        NEW.upright_meaning IS NOT NULL AND NEW.upright_meaning != '' AND
        NEW.reversed_meaning IS NOT NULL AND NEW.reversed_meaning != '' AND
        (
            NEW.character_voice_interpretations::text != '{}'::text OR
            NEW.pip_boy_interpretation IS NOT NULL AND NEW.pip_boy_interpretation != ''
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wasteland_cards_updated_at ON public.wasteland_cards;
CREATE TRIGGER trigger_update_wasteland_cards_updated_at
    BEFORE UPDATE ON public.wasteland_cards
    FOR EACH ROW EXECUTE FUNCTION update_wasteland_cards_updated_at();

COMMIT;

-- Validation report
SELECT
    'Structure Fix Complete' as status,
    COUNT(*) as total_cards,
    COUNT(*) FILTER (WHERE suit = 'MAJOR_ARCANA') as major_arcana,
    COUNT(*) FILTER (WHERE suit = 'RADIATION_RODS') as radiation_rods,
    COUNT(*) FILTER (WHERE suit = 'COMBAT_WEAPONS') as combat_weapons,
    COUNT(*) FILTER (WHERE suit = 'BOTTLE_CAPS') as bottle_caps,
    COUNT(*) FILTER (WHERE suit = 'NUKA_COLA_BOTTLES') as nuka_cola_bottles,
    COUNT(*) FILTER (WHERE is_complete = true) as complete_cards
FROM public.wasteland_cards
WHERE is_active = true;